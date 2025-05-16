'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
  SystemProgram,
  Transaction,
  Keypair,
} from '@solana/web3.js';
import bs58 from 'bs58';
import axios from 'axios';
import QRCode from 'react-qr-code'; // ✅ Use this!

export default function WalletScreen() {
  const router = useRouter();
  const { email, publicKey, privateKey: rawPrivateKey, mnemonic } = router.query;

  const [balance, setBalance] = useState(0);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const userPublicKey = publicKey ? new PublicKey(publicKey) : null;
  const OWNER_WALLET = new PublicKey('DUUr2mo7gTbVdDNnzVHsLZ9A8izpKMEc8rgb4BvJbKNG');

  let keypair = null;

  try {
    if (rawPrivateKey) {
      const decodedPrivateKey = bs58.decode(decodeURIComponent(rawPrivateKey));
      if (decodedPrivateKey.length === 64) {
        keypair = Keypair.fromSecretKey(decodedPrivateKey);
      } else {
        throw new Error('Private key must be 64 bytes');
      }
    }
  } catch (err) {
    console.error('Private key error:', err.message);
  }

  useEffect(() => {
    if (userPublicKey) {
      fetchBalance();
      const intervalId = setInterval(fetchBalance, 10000);
      return () => clearInterval(intervalId);
    }
  }, [userPublicKey]);

  const fetchBalance = async () => {
    try {
      const balance = await connection.getBalance(userPublicKey);
      setBalance(balance / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch balance');
    }
  };

  const sendSol = async () => {
    if (!recipientAddress || !amount) {
      alert('Please enter a valid recipient and amount');
      return;
    }

    if (!keypair) {
      alert('Invalid or missing private key');
      return;
    }

    try {
      setLoading(true);
      const totalAmount = parseFloat(amount);
      const commission = totalAmount * 0.00001;
      const amountAfterFee = totalAmount - commission;

      if (amountAfterFee <= 0) {
        alert('Amount too small after fee');
        return;
      }

      const lamports = Math.round(amountAfterFee * LAMPORTS_PER_SOL);
      const commissionLamports = Math.round(commission * LAMPORTS_PER_SOL);
      const recipientPublicKey = new PublicKey(recipientAddress);

      const { blockhash } = await connection.getRecentBlockhash();

      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: keypair.publicKey,
      });

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: recipientPublicKey,
          lamports,
        }),
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: OWNER_WALLET,
          lamports: commissionLamports,
        })
      );

      transaction.sign(keypair);

      const signature = await connection.sendTransaction(transaction, [keypair]);
      await connection.confirmTransaction(signature, 'confirmed');

      alert(`Sent ${amountAfterFee.toFixed(6)} SOL. TxID: ${signature}`);

      // await axios.post('https://walletbe.stellans.com/totalUsers/saveTransaction', {
      //   email,
      //   txid: signature,
      //   amount: amountAfterFee,
      //   fee: commission,
      //   destinationAddress: recipientAddress,
      //   date: new Date().toISOString(),
      // });

    //   setRecipientAddress('');
    //   setAmount('');
    //   fetchBalance();
    // } catch (err) {
    //   console.error(err);
    //   alert(`Transaction failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const goToBuySol = () => {
    router.push(
      `/buy?email=${email}&publicKey=${publicKey}&mnemonic=${mnemonic}&privateKey=${encodeURIComponent(rawPrivateKey)}`
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-center mb-4">Your Solana Wallet</h1>
          <p className="text-center text-sm break-all">Public Key:</p>
          <p className="text-center text-xs text-gray-400 break-words mb-4">{publicKey}</p>

          {publicKey && (
            <div className="flex justify-center p-4 rounded-lg my-4">
              <QRCode value={publicKey} size={160} />
            </div>
          )}

          <div className="text-center text-xl font-semibold text-green-400 mb-2">
            Balance: {balance.toFixed(4)} SOL
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={goToBuySol}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-5 py-2 rounded-full"
            >
              Buy SOL
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg space-y-4">
          <h2 className="text-xl font-bold text-center mb-2">Send SOL</h2>
          <input
            className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 text-white"
            placeholder="Recipient Address"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
          />
          <input
            type="number"
            className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 text-white"
            placeholder="Amount (SOL)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            onClick={sendSol}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-2 rounded-full"
          >
            {loading ? 'Sending...' : 'Send SOL'}
          </button>
        </div>
      </div>
    </div>
  );
}
