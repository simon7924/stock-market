import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⬛' },
  { path: '/portfolio', label: 'Portfolio', icon: '📊' },
  { path: '/history', label: 'History', icon: '📋' },
  { path: '/learn', label: 'Learn', icon: '📚' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, isGuest, signOut } = useAuth()

  return (
    <aside style={{
      width: 200, minHeight: '100vh', background: '#0d1117',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>📈</div>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>StockSim</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {navItems.map(item => {
          const active = location.pathname === item.path
          const locked = isGuest && item.path === '/leaderboard'
          return (
            <button
              key={item.path}
              onClick={() => {
                if (locked) return alert('Create an account to compete on the leaderboard.')
                navigate(item.path)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                background: active ? 'var(--blue)' : 'transparent',
                color: active ? 'white' : locked ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400,
                fontSize: 13, transition: 'all 0.15s',
                border: 'none', cursor: locked ? 'not-allowed' : 'pointer',
                boxShadow: active ? '0 0 12px var(--blue-glow)' : 'none',
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
              {locked && <span style={{ marginLeft: 'auto', fontSize: 11 }}>🔒</span>}
            </button>
          )
        })}
      </nav>

      {/* Profile */}
      <div style={{
        borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8,
      }}>
        {isGuest && (
          <div style={{
            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
            borderRadius: 8, padding: '6px 10px', marginBottom: 10, fontSize: 11,
            color: '#fb923c', textAlign: 'center',
          }}>
            Guest Session
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white',
          }}>
            {profile?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', truncate: true }}>
              {profile?.username || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>
              ${Number(profile?.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: 10, height: 36, fontSize: 12 }}
        >
          Log out
        </button>
      </div>
    </aside>
  )
}
