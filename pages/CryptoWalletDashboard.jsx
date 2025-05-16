import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Connection, PublicKey } from '@solana/web3.js';

const CryptoWalletDashboard = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [image, setImage] = useState(
    'https://themewagon.github.io/pluto/images/layout_img/user_img.jpg'
  );
  const [username, setUsername] = useState('John Doe');
  const [solBalance, setSolBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const router = useRouter();
  const { email: queryEmail, publicKey, privateKey, mnemonic } = router.query;

  useEffect(() => {
    if (queryEmail && publicKey && privateKey && mnemonic) {
      setEmail(queryEmail);

      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const pubKey = new PublicKey(publicKey);

      const fetchBalance = async () => {
        try {
          const balance = await connection.getBalance(pubKey);
          setSolBalance(balance / 1e9);
        } catch (err) {
          console.error('Error fetching SOL balance:', err);
        }
      };

      const fetchTransactions = async () => {
        try {
          const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
          const detailedTxs = await Promise.all(
            signatures.map(async (sig) => {
              const tx = await connection.getTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0,
              });
              return {
                signature: sig.signature,
                date: new Date(sig.blockTime * 1000).toLocaleString(),
                status: sig.confirmationStatus,
                amount: tx?.meta?.postBalances
                  ? (tx.meta.postBalances[0] - tx.meta.preBalances[0]) / 1e9
                  : 0,
              };
            })
          );
          setTransactions(detailedTxs);
        } catch (err) {
          console.error('Error fetching transactions:', err);
        }
      };

      fetchBalance();
      fetchTransactions();
    }
  }, [queryEmail, publicKey, privateKey, mnemonic]);

  const handleSettingsClick = () => {
    setSettingsOpen(!settingsOpen);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgURL = URL.createObjectURL(file);
      setImage(imgURL);
      localStorage.setItem('userImage', imgURL);

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Image uploaded successfully', data);
        } else {
          console.error('Image upload failed');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  const handleWalletRedirect = () => {
    router.push({
      pathname: '/wallet',
      query: { email, publicKey, privateKey, mnemonic },
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Crypto Wallet</h1>
        <button onClick={handleSettingsClick} className="bg-blue-600 px-4 py-2 rounded">
          Settings
        </button>
      </header>

      {settingsOpen && (
        <div className="bg-gray-800 p-4 rounded mb-6">
          <h2 className="text-lg font-semibold mb-2">Update Profile</h2>
          <div className="mb-2">
            <label className="block mb-1">Upload Image:</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
          </div>
          <p>Email: {email}</p>
        </div>
      )}

      <section className="bg-gray-800 p-4 rounded mb-6">
        <div className="flex items-center">
          <img src={image} alt="User Avatar" className="w-12 h-12 rounded-full mr-4" />
          <div>
            <h2 className="text-lg font-semibold">{username}</h2>
            <p className="text-gray-400">{email}</p>
          </div>
        </div>
      </section>

      <section className="bg-gray-800 p-4 rounded mb-6">
        <h3 className="text-gray-400 mb-2">Total Balance (SOL)</h3>
        <p className="text-3xl font-bold">
          {solBalance !== null ? `${solBalance.toFixed(4)} SOL` : 'Loading...'}
        </p>
      </section>

      <section className="bg-gray-800 p-4 rounded mb-6">
        <h3 className="text-gray-400 mb-4">Recent Transactions</h3>
        {transactions.length > 0 ? (
          <ul>
            {transactions.map((tx, idx) => (
              <li key={idx} className="flex justify-between mb-2 text-sm">
                <div>
                  <div className="text-white">{tx.date}</div>
                  <div className="text-xs text-gray-400">{tx.signature.slice(0, 20)}...</div>
                </div>
                <div
                  className={`${
                    tx.amount > 0 ? 'text-green-400' : tx.amount < 0 ? 'text-red-400' : 'text-gray-300'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {tx.amount.toFixed(6)} SOL
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No transactions found.</p>
        )}
      </section>

      <button
        onClick={handleWalletRedirect}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Go to Wallet
      </button>
    </div>
  );
};

export default CryptoWalletDashboard;



