import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import Modal, { ModalHeader, ModalFooter, WarningBox } from '../components/Modal'

const CATEGORIES = ['Account','Portfolio','Appearance','Notifications','Privacy','Danger Zone']

export default function Settings() {
  const navigate = useNavigate()
  const { user, profile, isGuest, signOut } = useAuth()
  const { resetPortfolio } = usePortfolio()
  const [active, setActive] = useState('Account')
  const [showReset, setShowReset] = useState(false)
  const [resetInput, setResetInput] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [darkMode] = useState(true)
  const [accentColor, setAccentColor] = useState('#3b82f6')
  const [notifications, setNotifications] = useState({ price: true, market: true, email: false })

  async function handleReset() {
    if (resetInput !== 'RESET') return
    setResetLoading(true)
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
                    background: active === cat ? (cat === 'Danger Zone' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.15)') : 'transparent',
                    color: active === cat ? (cat === 'Danger Zone' ? 'var(--red)' : 'var(--blue)') : 'var(--text-secondary)',
                    border: active === cat ? `1px solid ${cat === 'Danger Zone' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}` : '1px solid transparent',
                    fontWeight: active === cat ? 600 : 400, fontSize: 13, cursor: 'pointer',
                  }}>
                  {cat === 'Account' && '👤'}
                  {cat === 'Portfolio' && '📊'}
                  {cat === 'Appearance' && '🎨'}
                  {cat === 'Notifications' && '🔔'}
                  {cat === 'Privacy' && '🔒'}
                  {cat === 'Danger Zone' && '⚠️'}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><div style={{ fontWeight: 600 }}>Dark Mode</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Default and recommended</div></div>
                      <div style={{ width: 48, height: 26, borderRadius: 13, background: 'var(--blue)', position: 'relative', cursor: 'pointer' }}>
                        <div style={{ position: 'absolute', right: 3, top: 3, width: 20, height: 20, borderRadius: '50%', background: 'white' }} />
                      </div>
                    </div>
                    <div className="card">
                      <div style={{ fontWeight: 600, marginBottom: 10 }}>Accent Color</div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {['#3b82f6','#22c55e','#8b5cf6','#f97316'].map(c => (
                          <button key={c} onClick={() => setAccentColor(c)}
                            style={{
                              width: 32, height: 32, borderRadius: '50%', background: c,
                              border: accentColor === c ? '3px solid white' : '3px solid transparent',
                              cursor: 'pointer', transition: 'border 0.15s',
                            }} />
                        ))}
                      </div>
                    </div>
                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><div style={{ fontWeight: 600 }}>Graph Animations</div></div>
                      <div style={{ width: 48, height: 26, borderRadius: 13, background: 'var(--blue)', position: 'relative', cursor: 'pointer' }}>
                        <div style={{ position: 'absolute', right: 3, top: 3, width: 20, height: 20, borderRadius: '50%', background: 'white' }} />
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
                      { key: 'email', label: 'Weekly Summary Emails', desc: 'Portfolio performance summary each week' },
                    ].map(n => (
                      <div key={n.key} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{n.label}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{n.desc}</div>
                        </div>
                        <div onClick={() => setNotifications(p => ({ ...p, [n.key]: !p[n.key] }))}
                          style={{
                            width: 48, height: 26, borderRadius: 13, cursor: 'pointer', transition: 'background 0.2s',
                            background: notifications[n.key] ? 'var(--blue)' : 'rgba(255,255,255,0.1)',
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
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Data Storage</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {isGuest
                        ? 'Your portfolio data exists in temporary session memory only. It will be lost when you close the page.'
                        : 'Your portfolio data is securely stored in your account database and synced on every action.'}
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ height: 38, fontSize: 13 }}>Clear Cached Data</button>
                </div>
              )}

              {active === 'Danger Zone' && (
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'var(--red)' }}>⚠ Danger Zone</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>These actions permanently affect your account.</p>
                  <div style={{
                    background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 6, padding: 20,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Reset Portfolio</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                      This will permanently erase your balance, stocks, transaction history, and leaderboard progress.
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
          <ModalHeader title="⚠ Reset Portfolio?" subtitle="This action permanently deletes your portfolio and cannot be undone." />
          <WarningBox
            title="You are about to permanently erase:"
            text="Your balance · Your stocks · Transaction history · Leaderboard progress"
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
