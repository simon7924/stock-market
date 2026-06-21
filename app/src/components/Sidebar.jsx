import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'

const Icons = {
  Dashboard: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  Portfolio: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  History: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Learn: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Leaderboard: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6l4-4 4 4"/><path d="M12 2v10"/><path d="M4 14h4v6H4z"/><path d="M10 11h4v9h-4z"/><path d="M16 16h4v4h-4z"/></svg>,
  Settings: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Backtest: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.65"/></svg>,
  Lock: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', Icon: Icons.Dashboard },
  { path: '/portfolio', label: 'Portfolio', Icon: Icons.Portfolio },
  { path: '/backtest', label: 'Backtest', Icon: Icons.Backtest },
  { path: '/history', label: 'History', Icon: Icons.History },
  { path: '/learn', label: 'Learn', Icon: Icons.Learn },
  { path: '/leaderboard', label: 'Leaderboard', Icon: Icons.Leaderboard },
  { path: '/settings', label: 'Settings', Icon: Icons.Settings },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, isGuest, signOut } = useAuth()

  return (
    <aside className="sidebar" style={{
      width: 200, minHeight: '100vh', background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px', flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <span className="sidebar-logo-text" style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>StockSim</span>
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
              className="sidebar-nav-btn"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 6,
                background: active ? 'var(--blue)' : 'transparent',
                color: active ? 'white' : locked ? 'var(--text-muted)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400,
                fontSize: 13, transition: 'all 0.15s',
                border: 'none', cursor: locked ? 'not-allowed' : 'pointer',
                boxShadow: active ? '0 0 12px var(--blue-glow)' : 'none',
              }}
            >
              <item.Icon />
              <span className="sidebar-label">{item.label}</span>
              {locked && <span className="sidebar-label" style={{ marginLeft: 'auto', opacity: 0.6 }}><Icons.Lock /></span>}
            </button>
          )
        })}
      </nav>

      {/* Profile */}
      <div className="sidebar-profile" style={{
        borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8,
      }}>
        {isGuest && (
          <div style={{
            background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)',
            borderRadius: 4, padding: '6px 10px', marginBottom: 10, fontSize: 11,
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
