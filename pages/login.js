import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('⚠️ Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        localStorage.setItem('adminToken', 'true');
        router.push('/admin-dashboard');
        return;
      }

      const response = await axios.post('https://walletbe.stellans.com/login', { email, password });
      const { userId, walletAddress, token, privateKey, publicKey } = response.data;

      localStorage.setItem('userToken', token);

      const pinResponse = await axios.get(`https://walletbe.stellans.com/has-pin?email=${email}`);
      const hasPin = pinResponse.data.hasPin;

      if (hasPin) {
        router.push({
          pathname: '/pin-or-fingerprint',
          query: {
            email,
            userId,
            walletAddress,
            privateKey,
            publicKey
          },
        });
      } else {
        const subResponse = await axios.get(`https://walletbe.stellans.com/status/${email}`);
        const isSubscribed = subResponse.data.subscribed;

        router.push({
          pathname: '/home',
          query: { email, userId, walletAddress, isSubscribed },
        });
      }
    } catch (error) {
      console.error('Login Error:', error.response?.data || error.message);
      setErrorMessage(error.response?.data?.error || '🚨 Invalid login credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
                <img src="asserts/Logo.jpg" alt="Logo" style={styles.logo} /> {/* 👈 your image here */}

        <h1 style={styles.title}>Welcome Back 👋</h1>

        <input
          style={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMessage && <p style={styles.error}>{errorMessage}</p>}

        <button style={styles.button} onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <p style={styles.link} onClick={() => router.push('/RegisterScreen')}>
          Don't have an account? <strong>Register here</strong>.
        </p>

        <p style={styles.adminText}>Admin Access</p>
        <button
          style={styles.adminButton}
          onClick={() => {
            setEmail(ADMIN_EMAIL);
            setPassword(ADMIN_PASSWORD);
          }}
        >
          Use Admin Credentials
        </button>

        <p style={styles.link} onClick={() => router.push('/recover')}>
          Forgot Wallet? <strong>Recover here</strong>.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: '100vh',
    background: 'url("asserts/bg.png")',
  backgroundSize: 'cover', // or 'contain' for full view without cropping
    animation: 'gradient 15s ease infinite',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',

  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 30,
    borderRadius: 16,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
    maxWidth: 400,
    width: '90%',
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  logo: {
  width: 100,
  height: 100,
  objectFit: 'contain',
  display: 'block',
  margin: '0 auto',
  marginBottom: 10,
 borderRadius: '100px',
},

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1e3c72',
  },
  input: {
    padding: 12,
    border: '1px solid #ccc',
    borderRadius: 8,
    fontSize: 16,
    outline: 'none',
    transition: '0.3s',
  },
  button: {
    backgroundColor: '#1e3c72',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    padding: 12,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  link: {
    color: '#1e3c72',
    textDecoration: 'underline',
    cursor: 'pointer',
    textAlign: 'center',
  },
  adminText: {
    textAlign: 'center',
    marginTop: 20,
    fontWeight: 'bold',
    color: '#444',
  },
  adminButton: {
    backgroundColor: '#555',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
  },
  error: {
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'center',
  },
};

// Global animation style - include this in your global CSS or <style jsx global>
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
  `;
  document.head.appendChild(style);
}
