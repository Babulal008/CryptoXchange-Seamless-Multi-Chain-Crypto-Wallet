# 🔐 Solana Wallet App

A secure and user-friendly **Solana blockchain wallet** that lets users:

- 📤 Send SOL  
- 📥 Receive SOL  
- 💸 Buy and sell SOL with fiat via integrated payment gateway  
- 🔐 Create & restore wallets using a 12-word passphrase  
- 📊 View transaction history  
- 🛡️ Secure login using PIN or biometrics (mobile)

---

## 🚀 Features

| Feature            | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| 🔐 Wallet Creation | Generate or restore wallets using BIP39 seed phrases                        |
| 💸 Send/Receive SOL| Transfer SOL via Solana Web3.js with confirmation status                    |
| 💳 Buy/Sell SOL    | Integrated payment gateway (e.g., PayPal or Stripe test mode)               |
| 📄 Transaction Logs| All transactions stored in MongoDB and fetched by user email                |
| 🧠 Wallet Recovery | Restore wallet using passphrase                                              |
| 📱 Mobile Support  | Optional biometric login (React Native only)                                |

---

## 🛠 Tech Stack

- **Frontend:** React / React Native/next.js
- **Backend:** Node.js, Express.js
- **Blockchain:** Solana Web3.js, bip39, tweetnacl
- **Database:** MongoDB
- **Payments:** Stripe / PayPal (test mode)
- **Authentication:** JWT, bcrypt

---

## ⚙️ Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/solana-wallet.git
cd solana-wallet
