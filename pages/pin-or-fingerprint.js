'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

export default function PinOrFingerprintScreen() {
  const [pin, setPin] = useState('');
  const [hasPin, setHasPin] = useState(false);
  const pinLength = 6;

  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email');
  const publicKey = searchParams.get('publicKey');
  const privateKey = searchParams.get('privateKey');
  const mnemonic = searchParams.get('mnemonic');

  useEffect(() => {
    const checkIfPinExists = async () => {
      if (!email) return;
      try {
        const res = await fetch(`https://walletbe.stellans.com/has-pin?email=${email}`);
        const data = await res.json();
        setHasPin(data.hasPin);
      } catch (error) {
        console.error('Error checking PIN:', error);
      }
    };
    checkIfPinExists();
  }, [email]);

  const handlePinPress = (digit) => {
    if (pin.length < pinLength) {
      setPin(pin + digit);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleSubmitPin = async () => {
    if (pin.length !== pinLength) {
      alert('PIN must be 6 digits long');
      return;
    }

    if (!email) {
      alert('Email is missing');
      return;
    }

    try {
      if (hasPin) {
        const response = await fetch('https://walletbe.stellans.com/validate-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, pin }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || 'Invalid PIN');
          return;
        }

        localStorage.setItem('userPin', pin);
        router.push(`/CryptoWalletDashboard?email=${email}&publicKey=${data.publicKey}&privateKey=${encodeURIComponent(privateKey)}&mnemonic=${encodeURIComponent(mnemonic)}`);
      } else {
        const response = await fetch('https://walletbe.stellans.com/set-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, pin }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(data.error || 'Failed to set PIN');
          return;
        }

        localStorage.setItem('userPin', pin);
        alert('PIN set successfully!');
        router.push(`/CryptoWalletDashboard?email=${email}&publicKey=${publicKey}&privateKey=${encodeURIComponent(privateKey)}&mnemonic=${encodeURIComponent(mnemonic)}`);
      }
    } catch (err) {
      console.error('PIN error:', err);
      alert('Network or server error.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white px-4 py-8 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('/asserts/bg.png')] bg-cover bg-center z-0" />
      {/* <div className="absolute inset-0 bg-black bg-opacity-60 z-0" /> */}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center shadow-lg"
      >
        <h2 className="text-2xl font-bold text-green-300 mb-4">
          {hasPin ? 'Enter Your PIN' : 'Set Up a New PIN'}
        </h2>

        <div className="flex justify-center space-x-2 mb-8">
          {[...Array(pinLength)].map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > index ? 'bg-green-400 border-green-400' : 'border-gray-400'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 w-60 mx-auto mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '←'].map((item, index) =>
            item === '' ? (
              <div key={index} />
            ) : (
              <button
                key={index}
                onClick={() => (item === '←' ? handleDelete() : handlePinPress(item.toString()))}
                className="w-full h-14 bg-white/20 hover:bg-white/30 text-xl text-white rounded-lg backdrop-blur transition"
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          onClick={handleSubmitPin}
          className="w-60 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition"
        >
          {hasPin ? 'Unlock Wallet' : 'Set PIN'}
        </button>
      </motion.div>
    </div>
  );
}
