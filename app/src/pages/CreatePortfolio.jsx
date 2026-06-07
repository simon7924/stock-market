import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const OPTIONS = [
  { amount: 1000, label: 'Beginner' },
  { amount: 5000, label: 'Casual' },
  { amount: 10000, label: 'Recommended' },
  { amount: 25000, label: 'High Capital' },
]

export default function CreatePortfolio() {
  const { user, setProfile } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(10000)
  const [custom, setCustom] = useState('')
  const [customError, setCustomError] = useState('')
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  const finalBalance = custom ? Number(custom) : selected
  const isCustomValid = !custom || (Number(custom) >= 500 && Number(custom) <= 50000)
  const canProceed = checked && isCustomValid && finalBalance >= 500

  function handleCustomChange(val) {
    setCustom(val)
    setSelected(null)
    if (val && (Number(val) < 500 || Number(val) > 50000)) {
      setCustomError('Amount must be between $500 and $50,000')
    } else {
      setCustomError('')
    }
  }

  async function handleCreate() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .update({ starting_balance: finalBalance, current_balance: finalBalance })
        .eq('id', user.id)
        .select()
        .single()
      setProfile(data)
      navigate('/dashboard')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1115',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: 20,
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'rgba(80,120,255,0.06)', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)', pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: 520,
        background: '#151922', borderRadius: 18, padding: 28,
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 1,
      }}>
        {/* Header */}
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
          Start Your Portfolio
        </h1>
        <p style={{ fontSize: 13, color: '#9aa4b2', marginTop: 6 }}>
          Choose your starting virtual balance to begin investing.
        </p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4, fontStyle: 'italic' }}>
          This is simulated money — no real currency is used.
        </p>

        {/* Balance label */}
        <div style={{ fontSize: 14, color: '#cbd5e1', marginTop: 22, marginBottom: 12, fontWeight: 500 }}>
          Starting Balance
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
          {OPTIONS.map(opt => {
            const isActive = selected === opt.amount && !custom
            return (
              <button
                key={opt.amount}
                onClick={() => { setSelected(opt.amount); setCustom(''); setCustomError('') }}
                style={{
                  height: 70, borderRadius: 12, padding: 12, cursor: 'pointer',
                  background: isActive ? '#202a3a' : '#1b2230',
                  border: isActive ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.06)',
                  textAlign: 'left', position: 'relative',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.15s',
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 18, height: 18, borderRadius: '50%',
                    background: '#3b82f6', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 10, color: 'white',
                  }}>✓</div>
                )}
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                  ${opt.amount.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: '#9aa4b2', marginTop: 2 }}>{opt.label}</div>
              </button>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '18px 0' }} />

        {/* Custom */}
        <div style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8, fontWeight: 500 }}>Custom Amount</div>
        <input
          className={`input ${customError ? 'error' : ''}`}
          placeholder="$500 - $50,000"
          type="number"
          value={custom}
          onChange={e => handleCustomChange(e.target.value)}
        />
        {customError && (
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>{customError}</div>
        )}

        {/* Warning */}
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 12, padding: 12, marginTop: 18,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>Important</div>
          <div style={{ fontSize: 12, color: '#fca5a5' }}>
            Your starting balance cannot be changed later. Choose carefully.
          </div>
        </div>

        {/* Checkbox */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer',
        }}>
          <input
            type="checkbox" checked={checked}
            onChange={e => setChecked(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#3b82f6' }}
          />
          <span style={{ fontSize: 12, color: '#cbd5e1' }}>
            I understand this is virtual money and cannot be withdrawn.
          </span>
        </label>

        {/* Button */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', height: 48, marginTop: 20, borderRadius: 12, fontSize: 15 }}
          disabled={!canProceed || loading}
          onClick={handleCreate}
        >
          {loading ? 'Creating...' : 'Create Portfolio'}
        </button>
      </div>
    </div>
  )
}
