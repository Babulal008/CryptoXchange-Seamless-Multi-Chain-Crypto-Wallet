import React, { useState } from 'react';
import axios from 'axios';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [trialEnds, setTrialEnds] = useState(null);

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Invalid email format');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/register', { email, password, pin });
      setLoading(false);
      setSuccessMessage('🎉 Registration successful!');
      setTrialEnds(response.data.trialEnds);
    } catch (error) {
      setLoading(false);
      setErrorMessage(error.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create an Account</h2>

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
        <input
          style={styles.input}
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {/* Optional PIN field */}
        {/* <input
          style={styles.input}
          type="text"
          placeholder="PIN (optional)"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        /> */}

        {errorMessage && <div style={{ ...styles.message, ...styles.error }}>{errorMessage}</div>}
        {successMessage && <div style={{ ...styles.message, ...styles.success }}>{successMessage}</div>}
        {trialEnds && (
          <div style={styles.trial}>
            🎁 Your free trial ends on: {new Date(trialEnds).toLocaleDateString()}
          </div>
        )}

        <button
          style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'sans-serif',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
    width: '100%',
    maxWidth: '400px',
    animation: 'fadeInUp 0.5s ease',
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '24px',
    color: '#2a5298',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '16px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '14px',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2a5298',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  message: {
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
    textAlign: 'center',
    animation: 'popUp 0.3s ease-in-out',
  },
  error: {
    backgroundColor: '#ffd2d2',
    color: '#a10000',
  },
  success: {
    backgroundColor: '#d2ffd2',
    color: '#007500',
  },
  trial: {
    fontSize: '14px',
    marginBottom: '10px',
    textAlign: 'center',
    color: '#333',
  },
};

// Add this to globals.css or in a <style> tag
/* 
@keyframes popUp {
  0% {
    transform: scale(0.95);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
*/

export default RegisterScreen;
