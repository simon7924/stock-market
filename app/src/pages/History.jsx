import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { usePortfolio } from '../context/PortfolioContext'

export default function History() {
  const { transactions } = usePortfolio()
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const filtered = transactions.filter(t => {
    if (filter !== 'ALL' && t.type !== filter) return false
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalTrades = transactions.length
  const buys = transactions.filter(t => t.type === 'BUY')
  const sells = transactions.filter(t => t.type === 'SELL')
  const totalRealized = sells.reduce((s, t) => s + (t.realized_gain || 0), 0)
  const bestTrade = sells.reduce((best, t) => (t.realized_gain || 0) > (best?.realized_gain || -Infinity) ? t : best, null)
  const worstTrade = sells.reduce((worst, t) => (t.realized_gain || 0) < (worst?.realized_gain || Infinity) ? t : worst, null)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto', padding: 28, display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Transaction History</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Review all past trades.</p>

          {/* Filter bar */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            <input className="input" placeholder="Search symbol..." value={search}
              onChange={e => setSearch(e.target.value)} style={{ width: 180, height: 38, fontSize: 13 }} />
            {['ALL','BUY','SELL'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="btn"
                style={{
                  height: 38, padding: '0 16px', fontSize: 13,
                  background: filter === f ? 'var(--blue)' : 'transparent',
                  border: '1px solid var(--border)',
                  color: filter === f ? 'white' : 'var(--text-secondary)',
                  borderRadius: 6,
                }}>{f}</button>
            ))}
          </div>

          {/* Transaction cards */}
          {filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              <div style={{ marginBottom: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'center' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>
              </div>
              <div>No transactions yet. Start trading to see your history.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((t, i) => {
                const date = new Date(t.created_at)
                const gain = t.realized_gain
                return (
                  <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {/* Tag */}
                    <div style={{
                      padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, flexShrink: 0,
                      background: t.type === 'BUY' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: t.type === 'BUY' ? 'var(--green)' : 'var(--red)',
                    }}>{t.type}</div>

                    {/* Logo */}
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: `hsl(${t.symbol.charCodeAt(0)*20},60%,30%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 12, color: 'white',
                    }}>{t.symbol[0]}</div>

                    {/* Details */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{t.symbol}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {t.shares} shares @ ${Number(t.price_per_share).toFixed(2)}
                      </div>
                    </div>

                    {/* Total */}
                    <div style={{ textAlign: 'center', minWidth: 90 }}>
                      <div style={{ fontWeight: 700 }}>${Number(t.total_value).toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</div>
                    </div>

                    {/* Gain */}
                    {gain != null && (
                      <div style={{ textAlign: 'center', minWidth: 80 }}>
                        <div style={{ fontWeight: 700, color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Realized</div>
                      </div>
                    )}

                    {/* Date */}
                    <div style={{ textAlign: 'right', minWidth: 100 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{date.toLocaleDateString()}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Summary panel */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Total Trades', value: totalTrades, color: 'var(--text)' },
              { label: 'Total Buys', value: buys.length, color: 'var(--green)' },
              { label: 'Total Sells', value: sells.length, color: 'var(--red)' },
              { label: 'Realized Gain', value: `${totalRealized >= 0 ? '+' : ''}$${totalRealized.toFixed(2)}`, color: totalRealized >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.label}</div>
                <div style={{ fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
            {bestTrade && (
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Best Trade</div>
                <div style={{ fontWeight: 700, color: 'var(--green)' }}>{bestTrade.symbol}</div>
                <div style={{ fontSize: 12, color: 'var(--green)' }}>+${bestTrade.realized_gain.toFixed(2)}</div>
              </div>
            )}
            {worstTrade && (
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Worst Trade</div>
                <div style={{ fontWeight: 700, color: 'var(--red)' }}>{worstTrade.symbol}</div>
                <div style={{ fontSize: 12, color: 'var(--red)' }}>${worstTrade.realized_gain.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
