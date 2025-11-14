import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Dashboard.css'

const API_BASE = '/api'

function Dashboard({ user, onLogout }) {
  const [balance, setBalance] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id
      }

      // Fetch balance
      const balanceRes = await axios.get(`${API_BASE}/wallets/balance`, { headers })
      setBalance(balanceRes.data.balance)

      // Fetch recent transactions
      const txRes = await axios.get(`${API_BASE}/transactions/history?limit=5`, { headers })
      setRecentTransactions(txRes.data.transactions || [])
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-content">
          <h1>E-Wallet</h1>
          <div className="nav-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/wallet">Wallet</Link>
            <Link to="/transactions">Transactions</Link>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Welcome, {user?.fullName || user?.username}!</h2>
          <p>Manage your digital wallet and transactions</p>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card balance-card">
                <h3>Current Balance</h3>
                <div className="balance-amount">
                  Rp {balance?.toLocaleString('id-ID') || '0'}
                </div>
              </div>
              <div className="stat-card">
                <h3>Recent Transactions</h3>
                <div className="stat-number">{recentTransactions.length}</div>
              </div>
            </div>

            <div className="recent-transactions">
              <h3>Recent Transactions</h3>
              {recentTransactions.length === 0 ? (
                <p className="no-data">No transactions yet</p>
              ) : (
                <div className="transaction-list">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="transaction-item">
                      <div className="tx-info">
                        <div className="tx-type">
                          {parseInt(tx.sender_id) === parseInt(user.id) ? 'Sent' : 'Received'}
                        </div>
                        <div className="tx-details">
                          <div className="tx-description">{tx.description || 'Payment'}</div>
                          <div className="tx-date">
                            {new Date(tx.created_at).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                      <div className={`tx-amount ${parseInt(tx.sender_id) === parseInt(user.id) ? 'sent' : 'received'}`}>
                        {parseInt(tx.sender_id) === parseInt(user.id) ? '-' : '+'}
                        Rp {parseFloat(tx.amount).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="quick-actions">
              <Link to="/wallet" className="action-btn">Manage Wallet</Link>
              <Link to="/transactions" className="action-btn">View All Transactions</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Dashboard



