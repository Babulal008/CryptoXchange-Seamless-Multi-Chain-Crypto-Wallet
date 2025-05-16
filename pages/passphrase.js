import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PassphrasePage() {
  const router = useRouter();
  const { email, mnemonic: passedMnemonic, publicKey, privateKey } = router.query;

  const [mnemonic, setMnemonic] = useState(passedMnemonic || '');
  const [isChecked1, setIsChecked1] = useState(false);
  const [isChecked2, setIsChecked2] = useState(false);
  const [mnemonicError, setMnemonicError] = useState('');
  const [wordIndex, setWordIndex] = useState(null);

  useEffect(() => {
    if (!mnemonic && email) {
      fetchMnemonic();
    } else if (mnemonic) {
      setWordIndex(Math.floor(Math.random() * 12));
    }
  }, [email, mnemonic]);

  const fetchMnemonic = async () => {
    try {
      const res = await fetch(`https://walletbe.stellans.com/getWalletData?email=${email}`);
      const data = await res.json();
      if (data.mnemonic) {
        setMnemonic(data.mnemonic);
        setWordIndex(Math.floor(Math.random() * 12));
      } else {
        alert('Mnemonic not found for this email.');
      }
    } catch (err) {
      console.error('Error fetching mnemonic:', err);
      alert('An error occurred while fetching mnemonic.');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mnemonic);
      alert('Mnemonic copied to clipboard!');
    } catch (err) {
      alert('Failed to copy mnemonic.');
    }
  };

  const sanitizeMnemonic = (str) => str.replace(/\s+/g, ' ').trim();

  const handleConfirm = () => {
    const sanitized = sanitizeMnemonic(mnemonic);
    const words = sanitized.split(' ');

    if (words.length !== 12) {
      setMnemonicError('Mnemonic must have exactly 12 words.');
      return;
    }

    setMnemonicError('');
    router.push({
      pathname: '/success',
      query: {
        email,
        mnemonic,
        publicKey,
        privateKey,
        wordIndex,
      },
    });
  };

  const isFormValid = isChecked1 && isChecked2;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start pt-10 px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 animate-gradient bg-gradient-to-br from-green-200 via-blue-100 to-green-100 bg-[length:400%_400%]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
       {/* <div className="flex items-center w-full px-4 mb-4">
        <button onClick={() => router.back()} className="text-green-700 text-xl mr-4">
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800">Your Passphrase</h1>
      </div> */}

        {/* <p className="text-gray-700 text-sm mb-4">12 words</p> */}

        {/* Card */}
        <div className="bg-white shadow-xl rounded-xl p-6">
          <div className="border-2 border-green-500 rounded-md p-4 mb-4 bg-gray-50">
            <p className="text-center font-semibold text-gray-800 text-sm">
              {mnemonic ? mnemonic : 'Fetching mnemonic...'}
            </p>
          </div>

          <button
            onClick={copyToClipboard}
            disabled={!mnemonic}
            className="w-full bg-green-200 text-gray-800 py-2 mb-4 rounded hover:bg-green-300 transition"
          >
            Copy
          </button>

          {mnemonicError && (
            <p className="text-red-600 text-center font-semibold mb-4">{mnemonicError}</p>
          )}

          <p className="text-red-600 text-sm text-center font-medium mb-6">
            Your passphrase will not be shown again. You will lose access to your wallet without the passphrase.
          </p>

          {/* Checkboxes */}
          <div className="space-y-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                className="mr-2 mt-1"
                checked={isChecked1}
                onChange={() => setIsChecked1(!isChecked1)}
              />
              <span className="text-gray-700">
                I have written down or otherwise securely stored my passphrase.
              </span>
            </label>
            <label className="flex items-start">
              <input
                type="checkbox"
                className="mr-2 mt-1"
                checked={isChecked2}
                onChange={() => setIsChecked2(!isChecked2)}
              />
              <span className="text-gray-700">I agree to the Terms of Service.</span>
            </label>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!isFormValid}
            className={`w-full mt-6 py-2 rounded text-white font-semibold transition ${
              isFormValid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
