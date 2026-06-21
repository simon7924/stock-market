import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import Modal, { ModalHeader, ModalFooter, WarningBox } from '../components/Modal'
import { loadAppearance, saveAppearance, applyAccent, applyDarkMode } from '../lib/appearance'

const CATEGORIES = ['Account', 'Portfolio', 'Appearance', 'Notifications', 'Privacy']

const ACCENT_COLORS = ['#3b82f6', '#22c55e', '#8b5cf6', '#f97316']

export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, isGuest, signOut } = useAuth()
  const { resetPortfolio } = usePortfolio()
  const [active, setActive] = useState('Account')
  const [showReset, setShowReset] = useState(false)
  const [resetInput, setResetInput] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [notifications, setNotifications] = useState({ price: true, market: true, weekly: false })

  const saved = loadAppearance()
  const [darkMode, setDarkMode] = useState(saved.darkMode !== false)
  const [accentColor, setAccentColor] = useState(saved.accentColor || '#3b82f6')
  const [graphAnimations, setGraphAnimations] = useState(saved.graphAnimations !== false)

  function toggleDarkMode() {
    const next = !darkMode
    setDarkMode(next)
    applyDarkMode(next)
    const s = loadAppearance()
    saveAppearance({ ...s, darkMode: next })
  }

  function changeAccent(color) {
    setAccentColor(color)
    applyAccent(color)
    const s = loadAppearance()
    saveAppearance({ ...s, accentColor: color })
  }

  function toggleGraphAnimations() {
    const next = !graphAnimations
    setGraphAnimations(next)
    window.__stocksimGraphAnimations = next
    const s = loadAppearance()
    saveAppearance({ ...s, graphAnimations: next })
  }

  async function handleReset() {
    if (resetInput !== 'RESET') return
    setResetLoading(true)
    // Clear all localStorage cache entries too
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('quote_') || k.startsWith('ts_') || k.startsWith('search_')) {
        localStorage.removeItem(k)
      }
    })
    await resetPortfolio()
    setResetLoading(false)
    setShowReset(false)
    setResetInput('')
    navigate('/create-portfolio')
  }

  const growthPct = profile?.starting_balance
    ? ((profile.current_balance - profile.starting_balance) / profile.starting_balance) * 100
    : 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Customize your simulator experience.</p>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Category list */}
          <div style={{ width: 180, flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActive(cat)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 6, textAlign: 'left',
                    background: active === cat ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: active === cat ? 'var(--blue)' : 'var(--text-secondary)',
                    border: active === cat ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                    fontWeight: active === cat ? 600 : 400, fontSize: 13, cursor: 'pointer',
                  }}>
                  {cat === 'Account' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  {cat === 'Portfolio' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
                  {cat === 'Appearance' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/><path d="M12 8a4 4 0 0 1 0 8"/></svg>}
                  {cat === 'Notifications' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
                  {cat === 'Privacy' && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                  {' '}{cat}
                </button>
              ))}
            </div>
          </div>

          {/* Panel */}
          <div style={{ flex: 1 }}>
            <div className="card-panel">

              {active === 'Account' && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Account</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Username</label>
                      <input className="input" defaultValue={profile?.username || ''} style={{ maxWidth: 320 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
                      <input className="input" value={user?.email || 'guest@session.local'} disabled style={{ maxWidth: 320, opacity: 0.5, cursor: 'not-allowed' }} readOnly />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Password</label>
                      <button className="btn btn-secondary" style={{ height: 38, fontSize: 13 }}>Change Password</button>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Account Type</label>
                      <span className={`badge ${isGuest ? 'badge-beginner' : 'badge-intermediate'}`}>
                        {isGuest ? 'Guest' : 'Registered'}
                      </span>
                    </div>
                    <button className="btn btn-primary" style={{ maxWidth: 160, height: 40, fontSize: 13 }}>Save Changes</button>
                  </div>
                </div>
              )}

              {active === 'Portfolio' && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Portfolio</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card">
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Initial Balance</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>${Number(profile?.starting_balance || 10000).toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                        Starting balance cannot be changed after portfolio creation.
                      </div>
                    </div>
                    <div className="card">
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Current Balance</div>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>${Number(profile?.current_balance || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div className="card">
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>Total P/L</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: growthPct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {active === 'Appearance' && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Appearance</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    {/* Dark mode */}
                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>Dark Mode</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{darkMode ? 'Currently dark' : 'Currently light'}</div>
                      </div>
                      <div onClick={toggleDarkMode}
                        style={{
                          width: 48, height: 26, borderRadius: 13, cursor: 'pointer',
                          background: darkMode ? 'var(--blue)' : 'var(--toggle-off)',
                          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                        }}>
                        <div style={{
                          position: 'absolute', top: 3,
                          left: darkMode ? 'auto' : 3,
                          right: darkMode ? 3 : 'auto',
                          width: 20, height: 20, borderRadius: '50%', background: 'white',
                          transition: 'all 0.2s',
                        }} />
                      </div>
                    </div>

                    {/* Accent color */}
                    <div className="card">
                      <div style={{ fontWeight: 600, marginBottom: 12 }}>Accent Color</div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {ACCENT_COLORS.map(c => (
                          <button key={c} onClick={() => changeAccent(c)}
                            style={{
                              width: 34, height: 34, borderRadius: '50%', background: c,
                              border: accentColor === c ? '3px solid white' : '3px solid transparent',
                              boxShadow: accentColor === c ? `0 0 0 2px ${c}` : 'none',
                              cursor: 'pointer', transition: 'all 0.15s',
                            }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                        Changes buttons, highlights, and active states across the app.
                      </div>
                    </div>

                    {/* Graph animations */}
                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>Graph Animations</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{graphAnimations ? 'Charts animate on load' : 'Charts load instantly'}</div>
                      </div>
                      <div onClick={toggleGraphAnimations}
                        style={{
                          width: 48, height: 26, borderRadius: 13, cursor: 'pointer',
                          background: graphAnimations ? 'var(--blue)' : 'var(--toggle-off)',
                          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                        }}>
                        <div style={{
                          position: 'absolute', top: 3,
                          left: graphAnimations ? 'auto' : 3,
                          right: graphAnimations ? 3 : 'auto',
                          width: 20, height: 20, borderRadius: '50%', background: 'white',
                          transition: 'all 0.2s',
                        }} />
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {active === 'Notifications' && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Notifications</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { key: 'price', label: 'Price Alerts', desc: 'Get notified when stocks hit target prices' },
                      { key: 'market', label: 'Market Updates', desc: 'Daily market open/close reminders' },
                      { key: 'weekly', label: 'Weekly Summaries', desc: 'Portfolio performance summary each week' },
                    ].map(n => (
                      <div key={n.key} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{n.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.desc}</div>
                        </div>
                        <div onClick={() => setNotifications(p => ({ ...p, [n.key]: !p[n.key] }))}
                          style={{
                            width: 48, height: 26, borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                            background: notifications[n.key] ? 'var(--blue)' : 'var(--toggle-off)',
                            position: 'relative', flexShrink: 0,
                          }}>
                          <div style={{
                            position: 'absolute', top: 3,
                            left: notifications[n.key] ? 'auto' : 3,
                            right: notifications[n.key] ? 3 : 'auto',
                            width: 20, height: 20, borderRadius: '50%', background: 'white',
                            transition: 'all 0.2s',
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {active === 'Privacy' && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Privacy</h2>
                  <div className="card" style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Data Storage</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {isGuest
                        ? 'Your portfolio data exists in temporary session memory only. It will be lost when you close the page.'
                        : 'Your portfolio data is securely stored in your account database and synced on every action.'}
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 6, padding: 20,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Reset Portfolio</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                      Permanently erases your balance, stocks, transaction history, leaderboard progress, and all cached data.
                    </div>
                    <button className="btn" onClick={() => setShowReset(true)}
                      style={{ border: '1px solid var(--red)', color: 'var(--red)', background: 'transparent', height: 40, padding: '0 20px', fontSize: 13 }}>
                      Reset Portfolio
                    </button>
                    <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 8, opacity: 0.7 }}>This action cannot be undone.</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Reset modal */}
      {showReset && (
        <Modal onClose={() => { setShowReset(false); setResetInput('') }} danger unclosable>
          <ModalHeader title="Reset Portfolio?" subtitle="This action permanently deletes your portfolio and cannot be undone." />
          <WarningBox
            title="You are about to permanently erase:"
            text="Your balance · Your stocks · Transaction history · Leaderboard progress · Cached data"
          />
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              Type <strong style={{ color: 'var(--text)' }}>RESET</strong> to confirm
            </label>
            <input className="input" value={resetInput} onChange={e => setResetInput(e.target.value)}
              placeholder="Type RESET here" />
          </div>
          <ModalFooter>
            <button className="btn btn-secondary" onClick={() => { setShowReset(false); setResetInput('') }}>Cancel</button>
            <button className="btn btn-danger" disabled={resetInput !== 'RESET' || resetLoading} onClick={handleReset}>
              {resetLoading ? 'Resetting...' : 'Confirm Reset'}
            </button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  )
}
