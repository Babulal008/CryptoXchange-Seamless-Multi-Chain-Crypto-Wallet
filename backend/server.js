const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bip39 = require("bip39");
const nacl = require("tweetnacl");
const bs58 = require("bs58").default;
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const router = express.Router();
const bodyParser = require("body-parser");

const {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} = require("@solana/web3.js");
const { derivePath } = require("ed25519-hd-key"); // For deriving private key from mnemonic
// const Transaction = require('./models/Transaction'); // Adjust the path if needed
require("dotenv").config();
console.log(
  "Stripe Secret Key:",
  process.env.STRIPE_SECRET_KEY ? "Loaded" : "Not Loaded"
); // Debugging
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Use process.env
console.log("Stripe initialized successfully!"); // Debugging log

// Create an Express app
const app = express();

// Middleware
app.use(express.json());
const cors = require("cors");
app.use(
  cors({
    origin: "*", // Allow all origins
    methods: "GET,POST,PUT,DELETE", // Allow these HTTP methods
    allowedHeaders: "Content-Type,Authorization", // Allow these headers
  })
);
app.options("*", cors());

// MongoDB connection
const dns = require("dns");

dns.setDefaultResultOrder("ipv4first");

mongoose
  .connect(
    "mongodb+srv://shourav:Sandy%401234@cluster0.cdngv.mongodb.net/authDemo?retryWrites=true&w=majority"
  )
  .then(() => console.log("âœ… MongoDB Connected"))
  .catch((err) => console.error("âŒ MongoDB Connection Error:", err));

// User model
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    pin: { type: String, required: false },
    mnemonic: { type: String, required: true },
    publicKey: { type: String, required: true },
    privateKey: { type: String, required: true },
    subscription: {
      active: { type: Boolean, default: true }, // âœ… Free trial is active by default
      startDate: { type: Date, default: Date.now }, // âœ… Trial starts at signup
      endDate: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // âœ… Ends in 7 days
      },
    },
  })
);

const Subscription = mongoose.model(
  "Subscription",
  new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    active: { type: Boolean, default: false },
    startDate: { type: Date },
    endDate: { type: Date },
    stripeSubscriptionId: { type: String }, // Store Stripe subscription ID
  })
);

// Helper function to generate a unique key pair using Ed25519 (via tweetnacl)
const generateKeyPair = () => {
  const keyPair = nacl.sign.keyPair();

  // Base58 encode the public key and private key
  const publicKeyBase58 = bs58.encode(keyPair.publicKey);
  const privateKeyBase58 = bs58.encode(keyPair.secretKey);

  return {
    publicKey: publicKeyBase58,
    privateKey: privateKeyBase58, // Return the private key as Base58 encoded
  };
};

// Register endpoint
// Register endpoint without PIN=====
app.post('/register', async (req, res) => {
  const { email, password, pin } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const mnemonic = bip39.generateMnemonic(128);
    const { publicKey, privateKey } = generateKeyPair();
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = pin ? await bcrypt.hash(pin, 10) : null;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);  // âœ… Set trial period to 7 days

    const newUser = new User({
      email,
      password: hashedPassword,
      pin: hashedPin,
      mnemonic,
      publicKey,
      privateKey,
      subscription: {
        active: true,  // âœ… Free trial active
        startDate,
        endDate
      }
    });

    await newUser.save();

    res.json({
      message: 'User registered successfully with a 7-day free trial!',
      isSubscribed: true,
      trialEnds: endDate
    });
 } catch (error) {
  console.error('Error during registration:', error.message, error.stack);
  res.status(500).json({ error: error.message || 'Error during registration' });
}
});

// Create a Stripe Checkout Session for Subscription

app.get("/check-subscription", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });

    const currentDate = new Date();
    const isTrialExpired = user.subscription.endDate < currentDate;

    console.log("ðŸ” Subscription Data:", user.subscription);
    console.log("âœ… Trial Expired:", isTrialExpired);

    const isSubscribed = user.subscription.active && !isTrialExpired;

    res.json({
      isSubscribed,
      trialEnded: isTrialExpired,
      subscriptionDetails: user.subscription,
    });
  } catch (error) {
    console.error("âŒ Error checking subscription:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/create-subscription", async (req, res) => {
  try {
    const { email, priceId } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Use your webhook secret

    app.post(
      "/webhook",
      express.raw({ type: "application/json" }),
      async (req, res) => {
        let event;
        try {
          event = stripe.webhooks.constructEvent(
            req.body,
            req.headers["stripe-signature"],
            endpointSecret
          );
        } catch (err) {
          console.error("Webhook signature verification failed.", err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === "invoice.payment_succeeded") {
          const subscriptionId = event.data.object.subscription;

          // Find the user by subscription ID
          const subscription = await Subscription.findOne({
            stripeSubscriptionId: subscriptionId,
          }).populate("userId");

          if (subscription) {
            subscription.active = true;
            await subscription.save();

            // Update user model
            subscription.userId.subscription.active = true;
            await subscription.userId.save();

            console.log(
              `âœ… Subscription activated for ${subscription.userId.email}`
            );
          }
        }

        res.json({ received: true });
      }
    );

    // Check if user already has a Stripe customer ID
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: email,
      });

      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete", // Require payment confirmation
      expand: ["latest_invoice.payment_intent"],
    });

    // Store subscription details in the database
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + 1);

    const newSubscription = new Subscription({
      userId: user._id,
      active: false, // Webhook will update this
      startDate,
      endDate,
      stripeSubscriptionId: subscription.id,
    });

    await newSubscription.save();

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret, // Frontend uses this
      isSubscribed: true, // Not confirmed yet
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: error.message });
  }
});
//pin storage
// GET /has-pin?email=someone@example.com
app.get("/has-pin", async (req, res) => {
  const { email } = req.query;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ hasPin: false });
  return res.json({ hasPin: !!user.pin });
});

// POST /set-pin
app.post("/set-pin", async (req, res) => {
  const { email, pin } = req.body;
  if (!email || !pin)
    return res.status(400).json({ error: "Email and PIN required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "User not found" });

  const hashedPin = await bcrypt.hash(pin, 10);
  user.pin = hashedPin;
  await user.save();

  res.json({ message: "PIN set successfully" });
});

// POST /validate-pin
app.post("/validate-pin", async (req, res) => {
  const { email, pin } = req.body;

  // Check if email and PIN are provided
  if (!email || !pin) {
    return res.status(400).json({ error: "Email and PIN are required" });
  }

  try {
    // Fetch the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare the entered PIN with the hashed PIN stored in the database
    const isPinValid = await bcrypt.compare(pin, user.pin);

    if (!isPinValid) {
      return res.status(401).json({ error: "Invalid PIN" });
    }

    // If PIN is valid, return success and user public key
    return res.json({
      message: "PIN validated successfully",
      publicKey: user.publicKey, // Assuming publicKey is stored in the user document

    });
  } catch (error) {
    console.error("Error validating PIN:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

//Recoer-pin-logic
app.post("/update-password-with-pin", async (req, res) => {
  const { email, pin, newPassword } = req.body;

  if (!email || !pin || !newPassword) {
    return res
      .status(400)
      .json({ error: "Email, PIN, and new password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isPinValid = await bcrypt.compare(pin, user.pin);
    if (!isPinValid) return res.status(401).json({ error: "Invalid PIN" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error updating password:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("/status/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check subscription status
    const isSubscribed =
      user.subscription.active && user.subscription.endDate > new Date();

    res.json({
      isSubscribed,
      subscriptionDetails: isSubscribed ? user.subscription : null,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/subscribe", async (req, res) => {
  res.send("Subscription route working!");
});

// Login endpoint
app.post("/login", async (req, res) => {
  const { email, password, pin } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check if the password is correct
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // If PIN is provided, check if the PIN is correct
    if (pin) {
      const isPinMatch = await bcrypt.compare(pin, user.pin);
      if (!isPinMatch) {
        return res.status(400).json({ error: "Invalid PIN" });
      }
    }

    // Generate a token
    const token = jwt.sign({ id: user._id }, "your_jwt_secret", {
      expiresIn: "1h",
    });

    // Respond with all necessary data
    res.json({
      token,
      userId: user._id,
      walletAddress: user.walletAddress,  // ✅ Ensure this exists in your schema
      privateKey: user.privateKey,        // ✅ Make sure to securely store this
      publicKey: user.publicKey,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Error during login" });
  }
});


app.get("/getAllUsers", async (req, res) => {
  try {
    const users = await User.find({}, "email publicKey");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

//recover wallet
// POST /recover-wallet
router.post("/recover-wallet", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await User.findOne({ email });

    if (!user || !user.wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.status(200).json({
      publicKey: user.wallet.publicKey,
      privateKey: user.wallet.privateKey, // Only if you want to send it (consider encrypting it or avoid sending in plaintext)
    });
  } catch (err) {
    console.error("Recover wallet error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Generate Wallet endpoint (only for generating keys)
app.post("/generateWallet", async (req, res) => {
  const { email } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate the keys and mnemonic if not already available
    if (!user.publicKey || !user.privateKey || !user.mnemonic) {
      const mnemonic = bip39.generateMnemonic(); // Generate new mnemonic
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const keypair = nacl.sign.keyPair.fromSeed(seed.slice(0, 32));

      const publicKey = bs58.encode(keypair.publicKey);
      const privateKey = bs58.encode(keypair.secretKey);

      user.publicKey = publicKey;
      user.privateKey = privateKey;
      user.mnemonic = mnemonic; // Save mnemonic in DB
      await user.save();
    }

    res.json({
      mnemonic: user.mnemonic, // Return mnemonic
      publicKey: user.publicKey,
      privateKey: user.privateKey,
    });
  } catch (error) {
    console.error("Error generating wallet:", error);
    res.status(500).json({ error: "Error generating wallet" });
  }
});

// Get Wallet Data endpoint (fetch public/private keys securely)
app.get("/getWalletData", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user's public key and private key (now stored directly)
    res.json({
      publicKey: user.publicKey,
      privateKey: user.privateKey, // Return the raw private key (Base58 encoded)
    });
  } catch (error) {
    console.error("Error fetching wallet data: ", error);
    res.status(500).json({ error: "Error fetching wallet data" });
  }
});

// Endpoint to sin a transaction securely on the backend
app.post("/signTransaction", async (req, res) => {
  const { email, destinationAddress, amount } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const privateKey = bs58.decode(user.privateKey); // Decode the private key from Base58
    const senderKeypair = nacl.sign.keyPair.fromSecretKey(privateKey);

    const destinationPublicKey = new PublicKey(destinationAddress);
    const lamports = amount * 1000000000; // Convert SOL to lamports

    // Create the transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: destinationPublicKey,
        lamports,
      })
    );

    // Sign the transaction with the private key
    await transaction.sign(senderKeypair);

    // Serialize the transaction for transmission
    const signedTransaction = transaction.serialize();

    // Store transaction in the database

    await newTransaction.save();

    res.json({ signedTransaction: signedTransaction.toString("base64") });
  } catch (error) {
    console.error("Error signing transaction: ", error);
    res.status(500).json({ error: "Error signing transaction" });
  }
});

//transction

// POST /totalUsers/saveTransaction
router.post("/saveTransaction", async (req, res) => {
  try {
    const { email, txid, amount, fee, destinationAddress, date } = req.body;

    const transaction = new TransactionModel({
      email,
      txid,
      amount,
      fee,
      destinationAddress,
      date,
    });

    await transaction.save();

    res.status(200).json({ success: true, message: "Transaction saved" });
  } catch (err) {
    console.error("Error saving transaction:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to save transaction" });
  }
});

// Endpoint to get the total number of registered users
app.get("/totalUsers", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ totalUsers });
  } catch (error) {
    console.error("Error fetching total users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to get the total number of registered users
app.get("/getWalletData", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.mnemonic) {
      return res.status(404).json({ error: "Mnemonic not found" });
    }

    res.json({ mnemonic: user.mnemonic });
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
const port = 5000;
app.listen(port, "0.0.0.0", () => {
  console.log(
    `Server running on port ${port} and accessible on all network interfaces`
  );
});
