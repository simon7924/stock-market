import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import CreatePortfolio from './pages/CreatePortfolio'
import Dashboard from './pages/Dashboard'
import StockDetails from './pages/StockDetails'
import Portfolio from './pages/Portfolio'
import History from './pages/History'
import Leaderboard from './pages/Leaderboard'
import Learn from './pages/Learn'
import Settings from './pages/Settings'
import Backtest from './pages/Backtest'

function ProtectedRoute({ children }) {
  const { user, isGuest, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1115', color: 'white', fontFamily: "'DM Sans', Arial, sans-serif" }}>Loading...</div>
  if (!user && !isGuest) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/create-portfolio" element={<CreatePortfolio />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/stock/:symbol" element={<ProtectedRoute><StockDetails /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/learn" element={<ProtectedRoute><Learn /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/backtest" element={<ProtectedRoute><Backtest /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
