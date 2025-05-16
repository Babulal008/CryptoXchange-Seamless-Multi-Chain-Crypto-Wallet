import { useState } from 'react';

export default function RecoverWallet() {
  const [email, setEmail] = useState('');
  const [hasPin, setHasPin] = useState(null);
  const [pin, setPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const checkHasPin = async () => {
    setMessage('');
    setLoading(true);
    const res = await fetch(`https://walletbe.stellans.com/has-pin?email=${email}`);
    const data = await res.json();
    setHasPin(data.hasPin);
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    setLoading(true);
    const res = await fetch('https://walletbe.stellans.com/update-password-with-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pin, newPassword }),
    });
    const data = await res.json();
    setMessage(data.message || data.error);
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔐 Recover or Change Password</h2>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <button
          onClick={checkHasPin}
          style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
          disabled={loading}
        >
          {loading ? 'Checking...' : 'Check PIN'}
        </button>

        {hasPin && (
          <>
            <input
              type="text"
              placeholder="Enter your PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
            />
            <button
              onClick={handlePasswordChange}
              style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </>
        )}

        {message && <div style={styles.message}>{message}</div>}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    animation: 'fadeInUp 0.5s ease',
  },
  title: {
    fontSize: '22px',
    fontWeight: 600,
    marginBottom: '20px',
    color: '#333',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    margin: '10px 0',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '15px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2a5298',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'all 0.3s ease',
  },
  message: {
    marginTop: '15px',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#e9f7ef',
    color: '#256029',
    fontSize: '14px',
    animation: 'popUp 0.3s ease-in-out',
    textAlign: 'center',
  },
};
