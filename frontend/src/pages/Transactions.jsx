import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Transactions.css'

const API_BASE = '/api'

function Transactions({ user, onLogout }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentForm, setPaymentForm] = useState({
    recipientId: '',
    amount: '',
    description: ''
  })
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [user])

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id
      }
      const response = await axios.get(`${API_BASE}/transactions/history`, { headers })
      setTransactions(response.data.transactions || [])
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    const amount = parseFloat(paymentForm.amount)
    
    if (!amount || amount < 10000) {
      setMessage('Minimum payment amount is Rp 10,000')
      return
    }

    if (!paymentForm.recipientId) {
      setMessage('Please enter recipient ID')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id
      }
      await axios.post(
        `${API_BASE}/transactions/payment`,
        {
          recipientId: paymentForm.recipientId,
          amount: amount,
          description: paymentForm.description || 'Payment'
        },
        { headers }
      )
      setPaymentForm({ recipientId: '', amount: '', description: '' })
      setShowPaymentForm(false)
      setMessage('Payment successful!')
      setTimeout(() => setMessage(''), 3000)
      fetchTransactions()
    } catch (err) {
      setMessage(err.response?.data?.error || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="transactions-page">
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

      <div className="transactions-content">
        <div className="transactions-header">
          <h2>Transactions</h2>
          <button 
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="new-payment-btn"
          >
            {showPaymentForm ? 'Cancel' : 'New Payment'}
          </button>
        </div>

        {showPaymentForm && (
          <div className="payment-form-card">
            <h3>Send Payment</h3>
            <form onSubmit={handlePayment}>
              <input
                type="number"
                placeholder="Recipient User ID"
                value={paymentForm.recipientId}
                onChange={(e) => setPaymentForm({ ...paymentForm, recipientId: e.target.value })}
                required
              />
              <input
                type="number"
                placeholder="Amount (min. Rp 10,000)"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                min="10000"
                step="1"
                required
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
              />
              {message && (
                <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
              <button type="submit" disabled={loading} className="submit-payment-btn">
                {loading ? 'Processing...' : 'Send Payment'}
              </button>
            </form>
          </div>
        )}

        {loading && transactions.length === 0 ? (
          <div className="loading">Loading transactions...</div>
        ) : (
          <div className="transactions-list-card">
            <h3>Transaction History</h3>
            {transactions.length === 0 ? (
              <p className="no-data">No transactions yet</p>
            ) : (
              <div className="transactions-list">
                {transactions.map((tx) => (
                  <div key={tx.id} className="transaction-item">
                    <div className="tx-main-info">
                      <div className="tx-type-badge">
                        {parseInt(tx.sender_id) === parseInt(user.id) ? 'Sent' : 'Received'}
                      </div>
                      <div className="tx-details">
                        <div className="tx-description">
                          {tx.description || 'Payment'}
                        </div>
                        <div className="tx-meta">
                          <span>
                            {parseInt(tx.sender_id) === parseInt(user.id) 
                              ? `To: User #${tx.recipient_id}` 
                              : `From: User #${tx.sender_id}`}
                          </span>
                          <span className="tx-date">
                            {new Date(tx.created_at).toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`tx-amount ${parseInt(tx.sender_id) === parseInt(user.id) ? 'sent' : 'received'}`}>
                      {parseInt(tx.sender_id) === parseInt(user.id) ? '-' : '+'}
                      Rp {parseFloat(tx.amount).toLocaleString('id-ID')}
                    </div>
                    <div className={`tx-status ${tx.status}`}>
                      {tx.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Transactions



