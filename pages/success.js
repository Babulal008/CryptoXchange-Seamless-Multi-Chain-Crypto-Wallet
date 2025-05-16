'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SuccessScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const wordIndex = parseInt(searchParams.get('wordIndex'));
  const publicKey = searchParams.get('publicKey');
  const privateKey = searchParams.get('privateKey');
  const mnemonic = searchParams.get('mnemonic');
  const email = searchParams.get('email');

  const [word, setWord] = useState('');
  const mnemonicWords = mnemonic ? mnemonic.split(' ') : [];
  const correctWord = mnemonicWords[wordIndex];

  const handleConfirm = () => {
    if (!publicKey || !privateKey || !mnemonic || !email) {
      alert('Missing wallet details. Please restart the process.');
      return;
    }

    if (word.trim().toLowerCase() !== correctWord.toLowerCase()) {
      alert('Incorrect Word. The word you entered does not match. Please try again.');
      return;
    }

    alert('Passphrase verified successfully!');
    router.push(
      `/pin-or-fingerprint?email=${email}&publicKey=${publicKey}&privateKey=${privateKey}&mnemonic=${mnemonic}`
    );
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 animate-gradient bg-gradient-to-br from-green-200 via-blue-100 to-green-100 bg-[length:400%_400%]" />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md bg-white bg-opacity-90 backdrop-blur-lg rounded-xl shadow-xl p-8"
      >
        <h1 className="text-2xl font-bold text-green-800 mb-6 text-center">
          Almost done! Enter the following word from your passphrase.
        </h1>

        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2 text-lg">
            Word #{wordIndex + 1}
          </label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter the word"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleConfirm}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
        >
          Confirm
        </motion.button>
      </motion.div>
    </div>
  );
}
