export default function Modal({ children, onClose, size = '', danger = false, unclosable = false }) {
  return (
    <div
      className="modal-overlay"
      onClick={unclosable ? undefined : onClose}
    >
      <div
        className={`modal ${size === 'sm' ? 'modal-sm' : size === 'lg' ? 'modal-lg' : ''}`}
        style={danger ? { boxShadow: '0 25px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(239,68,68,0.3)' } : {}}
        onClick={e => e.stopPropagation()}
      >
        {onClose && !unclosable && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              width: 32, height: 32, borderRadius: '50%',
              background: 'transparent', color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{subtitle}</p>}
    </div>
  )
}

export function ModalFooter({ children }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end', gap: 10,
      marginTop: 24, paddingTop: 16,
      borderTop: '1px solid var(--border)',
    }}>
      {children}
    </div>
  )
}

export function WarningBox({ title, text }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 6, padding: 12, marginBottom: 16,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#fca5a5', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#fca5a5' }}>{text}</div>
    </div>
  )
}
