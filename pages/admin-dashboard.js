import { useEffect, useState } from 'react';
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, transactions: 123.5, collections: 1805, comments: 54 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUsers, setShowUsers] = useState(false);
  const [userPublicKey, setUserPublicKey] = useState('');
  const [transactionDetails, setTransactionDetails] = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        const response = await axios.get('https://walletbe.stellans.com/totalUsers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(prev => ({ ...prev, totalUsers: response.data.totalUsers }));

        const usersResponse = await axios.get('https://walletbe.stellans.com/getAllUsers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(usersResponse.data);
      } catch (error) {
        alert('Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const fetchTransactions = async () => {
    if (!userPublicKey) return alert('Please enter a valid public key');
    setLoading(true);
    try {
      const connection = new Connection('https://api.devnet.solana.com');
      const publicKey = new PublicKey(userPublicKey);
      const signatures = await connection.getSignaturesForAddress(publicKey);

      if (!signatures.length) {
        alert('No transactions found');
      }

      const txns = await Promise.all(signatures.map(sig => connection.getTransaction(sig.signature)));
      setTransactionDetails(txns);
    } catch (err) {
      alert(`Error fetching transactions: ${err.message}`);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      <style jsx>{`
        .dashboard-container {
          display: flex;
          font-family: Arial, sans-serif;
        }

        .sidebar {
          width: 220px;
          background-color: #2c3e50;
          color: white;
          padding: 20px;
          height: 100vh;
        }

        .sidebar .profile-section {
          text-align: center;
        }

        .sidebar .profile-section img {
          width: 80px;
          height: 80px;
          border-radius: 50%;
        }

        .sidebar h2 {
          margin-top: 10px;
        }

        .sidebar .status {
          color: lightgreen;
        }

        .sidebar .menu div {
          margin: 10px 0;
          cursor: pointer;
          padding: 5px;
        }

        .sidebar .logout-button {
          margin-top: 20px;
          color: red;
        }

        .main-content {
          flex: 1;
          padding: 20px;
        }

        .loading {
          font-size: 18px;
          font-weight: bold;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .card {
          background-color: #ecf0f1;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          cursor: pointer;
        }

        .card .number {
          font-size: 24px;
          font-weight: bold;
        }

        .user-table {
          margin-top: 20px;
        }

        .user-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .user-table th,
        .user-table td {
          border: 1px solid #ccc;
          padding: 10px;
          text-align: left;
        }

        .transaction-section {
          margin-top: 30px;
        }

        .transaction-section input {
          padding: 10px;
          width: 300px;
          margin-right: 10px;
        }

        .transaction-section button {
          padding: 10px 15px;
          background-color: #2980b9;
          color: white;
          border: none;
          cursor: pointer;
        }

        .transactions {
          margin-top: 20px;
        }

        .transaction-card {
          background-color: #f7f7f7;
          border: 1px solid #ccc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 10px;
        }
      `}</style>

      <aside className="sidebar">
        <div className="profile-section">
          <img src="https://themewagon.github.io/pluto/images/layout_img/user_img.jpg" alt="Profile" />
          <h2>Shourav</h2>
          <p className="status">Online</p>
        </div>
        <nav className="menu">
          <div onClick={() => setShowUsers(!showUsers)}>Dashboard</div>
          <div>Widgets</div>
          <div>Elements</div>
          <div>Tables</div>
          <div>Apps</div>
          <div>Pricing Tables</div>
          <div>Contact</div>
          <div>Additional Pages</div>
          <div>Map</div>
          <div className="logout-button" onClick={handleLogout}>Logout</div>
        </nav>
      </aside>

      <main className="main-content">
        <h1>Admin Dashboard</h1>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : (
          <div className="stats-grid">
            <div className="card" onClick={() => setShowUsers(!showUsers)}>
              <p className="number">{stats.totalUsers}</p>
              <p>Total Users</p>
            </div>
            <div className="card">
              <p className="number">{stats.transactions}</p>
              <p>Transactions</p>
            </div>
            <div className="card">
              <p className="number">{stats.collections}</p>
              <p>Collections</p>
            </div>
            <div className="card">
              <p className="number">{stats.comments}</p>
              <p>Comments</p>
            </div>
          </div>
        )}

        {showUsers && (
          <div className="user-table">
            <h2>Registered Users</h2>
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Public Key</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr key={i}>
                    <td>{user.email}</td>
                    <td>{user.publicKey}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="transaction-section">
          <h2>Solana Transaction Explorer</h2>
          <input
            placeholder="Enter Public Key"
            value={userPublicKey}
            onChange={(e) => setUserPublicKey(e.target.value)}
          />
          <button onClick={fetchTransactions}>Fetch Transactions</button>
        </div>

        {transactionDetails.length > 0 && (
          <div className="transactions">
            {transactionDetails.map((tx, i) => (
              <div className="transaction-card" key={i}>
                <strong>Transaction {i + 1}</strong>
                <p>Signature: {tx.transaction.signatures[0]}</p>
                <p>Block Time: {new Date(tx.blockTime * 1000).toLocaleString()}</p>
                <p>Fee: {tx.meta.fee / 1000000000} SOL</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
