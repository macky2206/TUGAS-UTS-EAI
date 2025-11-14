import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Wallet.css'

const API_BASE = '/api'

function Wallet({ user, onLogout }) {
  const [balance, setBalance] = useState(null)
  const [topupAmount, setTopupAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchBalance()
  }, [user])

  const fetchBalance = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id
      }
      const response = await axios.get(`${API_BASE}/wallets/balance`, { headers })
      setBalance(response.data.balance)
    } catch (err) {
      console.error('Error fetching balance:', err)
      setMessage('Error loading balance')
    }
  }

  const handleTopup = async (e) => {
    e.preventDefault()
    const amount = parseFloat(topupAmount)
    
    if (!amount || amount < 50000) {
      setMessage('Minimum top-up amount is Rp 50,000')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      console.log('Sending topup request:', { amount, userId: user.id })
      const response = await axios.post(
        `${API_BASE}/wallets/topup`,
        { amount },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )
      console.log('Topup response:', response.data)
      setBalance(response.data.new_balance)
      setTopupAmount('')
      setMessage('Top up successful!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Topup error:', err)
      if (err.code === 'ECONNABORTED') {
        setMessage('Request timeout - please try again')
      } else {
        setMessage(err.response?.data?.error || err.message || 'Top up failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="wallet-page">
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

      <div className="wallet-content">
        <h2>My Wallet</h2>

        <div className="wallet-card">
          <div className="wallet-header">
            <h3>Balance</h3>
            <div className="balance-display">
              Rp {balance?.toLocaleString('id-ID') || '0'}
            </div>
          </div>

          <div className="topup-section">
            <h4>Top Up Wallet</h4>
            <form onSubmit={handleTopup}>
              <div className="input-group">
                <span className="currency">Rp</span>
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="Enter amount (min. 50,000)"
                  min="50000"
                  step="1"
                  required
                />
              </div>
              {message && (
                <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
              <button type="submit" disabled={loading} className="topup-btn">
                {loading ? 'Processing...' : 'Top Up'}
              </button>
            </form>
          </div>
        </div>

        <div className="wallet-info">
          <h4>Wallet Information</h4>
          <div className="info-item">
            <span>Account Holder:</span>
            <span>{user?.fullName || user?.username}</span>
          </div>
          <div className="info-item">
            <span>User ID:</span>
            <span>{user?.id}</span>
          </div>
          <div className="info-item">
            <span>Currency:</span>
            <span>IDR (Indonesian Rupiah)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Wallet



