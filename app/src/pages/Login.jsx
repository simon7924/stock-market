import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp, enterGuestMode } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signup') // 'signup' | 'login'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGuestConfirm, setShowGuestConfirm] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must contain at least 8 characters.'); return }
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, username)
        navigate('/create-portfolio')
      } else {
        await signIn(email, password)
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.message.includes('already')) setError('An account already uses this email.')
      else if (err.message.includes('credentials') || err.message.includes('password')) setError('Incorrect email or password.')
      else setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleGuestContinue() {
    enterGuestMode()
    navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: 20,
    }}>
      {/* Background graph lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04, pointerEvents: 'none' }}>
        <polyline points="0,400 200,320 400,380 600,260 800,300 1000,180 1200,240 1400,120" fill="none" stroke="#3b82f6" strokeWidth="2"/>
        <polyline points="0,500 200,460 400,490 600,380 800,420 1000,300 1200,360 1400,240" fill="none" stroke="#22c55e" strokeWidth="1.5"/>
      </svg>

      <div style={{ width: '100%', maxWidth: 900, display: 'flex', gap: 20, zIndex: 1 }}>
        {/* Logo + headline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 6,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            }}>📈</div>
            <span style={{ fontSize: 28, fontWeight: 700 }}>StockSim</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, marginBottom: 12 }}>
            Practice Investing<br /><span style={{ color: 'var(--blue)' }}>Risk-Free</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6 }}>
            Learn the stock market using virtual money. No risk, real experience.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', gap: 16, flex: 2 }}>
          {/* Guest panel */}
          <div style={{
            flex: 0.85, background: '#111723',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
            padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>Guest Mode</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Quickly try the simulator without creating an account.
            </div>
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 6, padding: 10, fontSize: 12,
            }}>
              <div style={{ fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>⚠ Progress will NOT save.</div>
              <div style={{ color: '#fca5a5' }}>Refreshing or closing the page will erase your portfolio.</div>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Instant access', 'No signup needed', 'No saved progress', 'No leaderboard access'].map(f => (
                <li key={f} style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>·</span> {f}
                </li>
              ))}
            </ul>
            <div style={{ flex: 1 }} />
            <button
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setShowGuestConfirm(true)}
            >
              Continue as Guest
            </button>
          </div>

          {/* Account panel */}
          <div style={{
            flex: 1.15, background: 'var(--panel)',
            border: '1px solid rgba(59,130,246,0.3)', borderRadius: 'var(--radius-lg)',
            padding: 24, boxShadow: '0 0 30px rgba(59,130,246,0.08)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>
              {mode === 'signup' ? 'Create Account' : 'Log In'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {mode === 'signup' ? 'Save your portfolio and compete on the leaderboard.' : 'Welcome back.'}
            </div>

            {mode === 'signup' && (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {['Save progress', 'Portfolio history', 'Leaderboards', 'Long-term growth tracking'].map(f => (
                  <li key={f} style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 6 }}>
                    <span style={{ color: 'var(--green)' }}>✔</span> {f}
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {mode === 'signup' && (
                <input className="input" placeholder="Username" value={username}
                  onChange={e => setUsername(e.target.value)} required />
              )}
              <input className="input" type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)} required />
              <div style={{ position: 'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} placeholder="Password"
                  value={password} onChange={e => setPassword(e.target.value)} required
                  style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
                  }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#fca5a5',
                }}>{error}</div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
                {loading ? 'Loading...' : mode === 'signup' ? 'Create Account' : 'Log In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              {mode === 'signup' ? (
                <>Already have an account?{' '}
                  <button onClick={() => { setMode('login'); setError('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 12 }}>
                    Log in
                  </button>
                </>
              ) : (
                <>Don't have an account?{' '}
                  <button onClick={() => { setMode('signup'); setError('') }}
                    style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 12 }}>
                    Sign up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Guest confirm popup */}
      {showGuestConfirm && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Guest Session</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Your progress will be erased when the page reloads or closes.
            </p>
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 6, padding: 10, marginBottom: 20, fontSize: 12, color: '#fca5a5',
            }}>
              ⚠ No data will be saved. Leaderboard is unavailable in guest mode.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowGuestConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGuestContinue}>Continue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
