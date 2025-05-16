import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const Home = () => {
  const router = useRouter();
  const { email } = router.query;

  const [mnemonic, setMnemonic] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');

  const generateWallet = async () => {
    try {
      const res = await axios.post('https://walletbe.stellans.com/generateWallet', { email });
      const result = res.data;

      if (result.publicKey && result.privateKey) {
        setMnemonic(result.mnemonic);
        setPublicKey(result.publicKey);
        setPrivateKey(result.privateKey);

        alert(`Mnemonic: ${result.mnemonic}`);

        router.push({
          pathname: '/passphrase',
          query: {
            email,
            publicKey: result.publicKey,
            privateKey: result.privateKey,
            mnemonic: result.mnemonic,
          },
        });
      } else {
        alert('Failed to generate wallet.');
      }
    } catch (error) {
      console.error('Generate wallet error:', error);
      alert('An error occurred. Check the console.');
    }
  };

  const fetchWalletData = async () => {
    try {
      const res = await axios.get(`https://walletbe.stellans.com/getWalletData?email=${email}`);
      const data = res.data;

      if (data.publicKey && data.privateKey) {
        setMnemonic(data.mnemonic);
        setPublicKey(data.publicKey);
        setPrivateKey(data.privateKey);

        alert('Wallet loaded successfully');

        router.push({
          pathname: '/passphrase',
          query: {
            email,
            publicKey: data.publicKey,
            privateKey: data.privateKey,
          },
        });
      } else {
        alert('No wallet found for this email.');
      }
    } catch (error) {
      console.error('Fetch wallet error:', error);
      alert('An error occurred. Check the console.');
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title} data-aos="flip-up">🚀 Solana Wallet Generator</h1>

      <div style={styles.cardContainer}>
        <div data-aos="flip-left" style={styles.card}>
          <h2 style={styles.cardTitle}>Create Wallet</h2>
          <button style={styles.button} onClick={generateWallet}>Generate Wallet</button>
        </div>

        <div data-aos="flip-right" style={styles.card}>
          <h2 style={styles.cardTitle}>Retrieve Wallet</h2>
          <button style={styles.button} onClick={fetchWalletData}>Fetch Wallet</button>
        </div>
      </div>

      <div data-aos="fade-up" style={{ marginTop: '2rem' }}>
        {mnemonic && <p style={styles.text}><strong>Mnemonic:</strong> {mnemonic}</p>}
        {publicKey && <p style={styles.text}><strong>Public Key:</strong> {publicKey}</p>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    backgroundColor: '#121212',
    color: '#fff',
    minHeight: '100vh',
    textAlign: 'center',
    fontFamily: 'sans-serif',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '2rem',
    color: '#68C481',
  },
  cardContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#1E2B27',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    width: '250px',
  },
  cardTitle: {
    fontSize: '1.2rem',
    marginBottom: '1rem',
    color: '#ffffff',
  },
  button: {
    backgroundColor: '#68C481',
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background 0.3s',
  },
  text: {
    marginTop: '1rem',
    fontSize: '16px',
    background: '#1e2b27',
    padding: '1rem',
    borderRadius: '8px',
    wordBreak: 'break-all',
  },
};

export default Home;
