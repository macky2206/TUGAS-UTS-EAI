import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Wallet from './pages/Wallet'
import Transactions from './pages/Transactions'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ?
              <Navigate to="/dashboard" /> :
              <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ?
              <Dashboard user={user} onLogout={handleLogout} /> :
              <Navigate to="/login" />
          }
        />
        <Route
          path="/wallet"
          element={
            isAuthenticated ?
              <Wallet user={user} onLogout={handleLogout} /> :
              <Navigate to="/login" />
          }
        />
        <Route
          path="/transactions"
          element={
            isAuthenticated ?
              <Transactions user={user} onLogout={handleLogout} /> :
              <Navigate to="/login" />
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  )
}

export default App



