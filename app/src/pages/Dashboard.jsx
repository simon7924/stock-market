import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { getBatchQuotes, searchSymbol, isMarketOpen } from '../lib/twelvedata'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { useToast } from '../components/Toast'
import Modal, { ModalHeader, ModalFooter } from '../components/Modal'
import { supabase } from '../lib/supabase'

const DEFAULT_SYMBOLS = ['AAPL','TSLA','NVDA','MSFT','GOOGL','AMZN','META','NFLX']

const RISK = { AAPL:'Low', MSFT:'Low', GOOGL:'Low', AMZN:'Medium', META:'Medium', NVDA:'High', TSLA:'High', NFLX:'High', AMD:'High', INTC:'Medium', SPY:'Low', QQQ:'Low' }

function riskClass(s) {
  const r = RISK[s] || 'Medium'
  return r === 'Low' ? 'risk-low' : r === 'High' ? 'risk-high' : 'risk-med'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile, isGuest } = useAuth()
  const { holdings, buyStock } = usePortfolio()
  const { addToast } = useToast()
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [preview, setPreview] = useState(null)
  const [buyModal, setBuyModal] = useState(null)
  const [buyShares, setBuyShares] = useState(1)
  const [buyError, setBuyError] = useState('')
  const [showRiskWarning, setShowRiskWarning] = useState(false)
  const marketOpen = isMarketOpen()
  const searchRef = useRef()

  useEffect(() => { fetchQuotes() }, [])

  async function fetchQuotes() {
    setLoading(true)
    try {
      const data = await getBatchQuotes(DEFAULT_SYMBOLS)
      if (Array.isArray(data)) {
        const map = {}
        data.forEach(q => { map[q.symbol] = q })
        setQuotes(map)
      } else if (data && typeof data === 'object') {
        setQuotes(data)
      }
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    if (!searchQuery) { setSearchResults([]); setShowDropdown(false); return }
    const t = setTimeout(async () => {
      const res = await searchSymbol(searchQuery)
      const US_EXCHANGES = ['NASDAQ', 'NYSE', 'NYSE ARCA', 'NYSE MKT', 'BATS']
      const all = (res.data || []).filter(r => r.currency === 'USD')
      const seen = new Map()
      for (const r of all) {
        if (!seen.has(r.symbol)) {
          seen.set(r.symbol, r)
        } else if (US_EXCHANGES.includes(r.exchange) && !US_EXCHANGES.includes(seen.get(r.symbol).exchange)) {
          seen.set(r.symbol, r)
        }
      }
      setSearchResults([...seen.values()].slice(0, 6))
      setShowDropdown(true)
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  function getQuote(sym) {
    const q = quotes[sym]
    if (!q) return null
    return q
  }

  function getChange(q) {
    if (!q) return 0
    return parseFloat(q.percent_change || q.change_percent || 0)
  }

  function getPrice(q) {
    if (!q) return 0
    return parseFloat(q.close || q.price || 0)
  }

  function handleBuyClick() {
    const risk = RISK[buyModal.symbol] || 'Medium'
    if (risk === 'High' && !showRiskWarning) {
      setShowRiskWarning(true)
      return
    }
    handleBuy()
  }

  async function handleBuy() {
    setBuyError('')
    const price = getPrice(getQuote(buyModal.symbol))
    const cost = buyShares * price
    if (cost > profile.current_balance) {
      setBuyError('Insufficient funds for this purchase.')
      return
    }
    try {
      await buyStock(buyModal.symbol, buyModal.name, buyShares, price)
      addToast('Shares Purchased', 'success', `You bought ${buyShares} shares of ${buyModal.symbol}.`)
      setBuyModal(null)
      setBuyShares(1)
      setShowRiskWarning(false)
    } catch(e) {
      setBuyError(e.message)
    }
  }

  const portfolioGrowth = profile
    ? ((profile.current_balance - profile.starting_balance) / profile.starting_balance) * 100
    : 0

  const totalInvestedValue = holdings.reduce((sum, h) => {
    const q = quotes[h.symbol]
    const price = q ? parseFloat(q.close || q.price || 0) : 0
    return sum + h.shares * price
  }, 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avg_price, 0)
  const investedGain = totalInvestedValue - totalCost
  const totalPortfolioValue = (profile?.current_balance || 0) + totalInvestedValue

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '16px 28px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Today's Market</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Track stocks and build your virtual portfolio.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {!marketOpen && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--card)', padding: '4px 10px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg width="7" height="7" viewBox="0 0 7 7"><circle cx="3.5" cy="3.5" r="3.5" fill="var(--red)"/></svg>
                Market Closed
              </span>
            )}
            {isGuest && (
              <span style={{ fontSize: 11, color: '#fb923c', background: 'rgba(249,115,22,0.1)', padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(249,115,22,0.2)' }}>
                Guest Session
              </span>
            )}
          </div>
        </div>

        <div className="main-content" style={{ flex: 1, overflow: 'auto', padding: 28, display: 'flex', gap: 20 }}>
          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {/* Summary cards */}
            <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              {/* Portfolio Summary — big card */}
              <div style={{
                background: 'linear-gradient(135deg, #1a2e4a 0%, #111827 100%)',
                border: '1px solid rgba(59,130,246,0.25)',
                borderRadius: 10, padding: '22px 28px',
                display: 'flex', gap: 0,
              }}>
                {/* Left: main value */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    Total Portfolio
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>
                    ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 700,
                      color: portfolioGrowth >= 0 ? 'var(--green)' : 'var(--red)',
                      background: portfolioGrowth >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                      padding: '2px 10px', borderRadius: 999, display: 'inline-block',
                    }}>
                      {portfolioGrowth >= 0 ? '+' : ''}{portfolioGrowth.toFixed(2)}% all time
                    </div>
                  </div>
                  {isGuest && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Create an account to save progress.</div>}
                </div>
                {/* Right: breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center', paddingLeft: 28, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                  {[
                    { label: 'Cash', val: `$${Number(profile?.current_balance || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`, color: 'var(--blue)' },
                    { label: 'Invested', val: `$${totalInvestedValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, color: 'var(--text)' },
                    { label: 'Gain/Loss', val: `${investedGain >= 0 ? '+' : ''}$${Math.abs(investedGain).toFixed(2)}`, color: investedGain >= 0 ? 'var(--green)' : 'var(--red)' },
                    { label: 'Holdings', val: holdings.length, color: 'var(--text)' },
                  ].map(s => (
                    <div key={s.label} style={{ minWidth: 130 }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: s.color, marginTop: 1 }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Status — small card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Market</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 700, margin: '6px 0 4px', color: marketOpen ? 'var(--green)' : 'var(--text-secondary)' }}>
                    {marketOpen ? 'Open' : 'Closed'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {marketOpen ? '● Live prices active' : '◌ Last known prices'}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  NYSE/NASDAQ hours: 9:30–16:00 ET
                </div>
              </div>
            </div>

            {/* Stock table */}
            <div className="card-panel" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Popular Stocks</h2>
                <div style={{ position: 'relative' }} ref={searchRef}>
                  <input
                    className="input" placeholder="Search stocks..."
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    style={{ width: 220, height: 36, fontSize: 13 }}
                    onFocus={() => searchResults.length && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  />
                  {showDropdown && searchResults.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                      background: 'var(--panel)', border: '1px solid var(--border)',
                      borderRadius: 6, marginTop: 4, overflow: 'hidden',
                    }}>
                      {searchResults.map(r => (
                        <button key={r.symbol} onClick={() => navigate(`/stock/${r.symbol}`)}
                          style={{
                            width: '100%', padding: '10px 14px', background: 'transparent',
                            border: 'none', color: 'var(--text)', textAlign: 'left',
                            display: 'flex', justifyContent: 'space-between', fontSize: 13,
                            cursor: 'pointer', borderBottom: '1px solid var(--border)',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'var(--card)'}
                          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontWeight: 600 }}>{r.symbol}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.instrument_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading stocks...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {DEFAULT_SYMBOLS.map(sym => {
                    const q = getQuote(sym)
                    const price = getPrice(q)
                    const change = getChange(q)
                    const owned = holdings.find(h => h.symbol === sym)
                    return (
                      <div key={sym}
                        onClick={() => setPreview({ symbol: sym, name: q?.name || sym })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 16,
                          padding: '12px 16px', borderRadius: 6,
                          background: 'var(--card)', border: '1px solid var(--border)',
                          cursor: 'pointer', transition: 'border-color 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        {/* Logo */}
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                          background: `hsl(${sym.charCodeAt(0) * 20},60%,30%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13, color: 'white',
                        }}>{sym[0]}</div>

                        {/* Name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{q?.name || sym}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sym}</div>
                        </div>

                        {/* Price */}
                        <div style={{ textAlign: 'right', minWidth: 80 }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>${price.toFixed(2)}</div>
                          <div className="stock-price-label" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {!marketOpen ? 'Last known' : 'Live'}
                          </div>
                        </div>

                        {/* Change */}
                        <div style={{
                          minWidth: 70, textAlign: 'right',
                          color: change >= 0 ? 'var(--green)' : 'var(--red)',
                          fontWeight: 700, fontSize: 14,
                        }}>
                          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                        </div>

                        {/* Risk */}
                        <span className={`stock-risk-pill risk-pill ${riskClass(sym)}`}>{RISK[sym] || 'Medium'}</span>

                        {/* Buy button */}
                        <button
                          className="btn btn-primary"
                          style={{ height: 34, padding: '0 14px', fontSize: 13, flexShrink: 0 }}
                          onClick={e => { e.stopPropagation(); setBuyModal({ symbol: sym, name: q?.name || sym }); setBuyShares(1); setBuyError(''); setShowRiskWarning(false) }}
                        >Buy</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right trending panel */}
          <div className="stock-row-right-panel" style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
            <div className="card-panel" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Trending</div>
              {DEFAULT_SYMBOLS.slice(0,5).map(sym => {
                const change = getChange(getQuote(sym))
                return (
                  <div key={sym} onClick={() => navigate(`/stock/${sym}`)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{sym}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="card-panel" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Quick Tip
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Diversifying reduces risk. Spread investments across multiple sectors.
              </p>
            </div>

            <div className="card-panel" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Your Holdings</div>
              {holdings.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No stocks owned yet.</p>
              ) : holdings.slice(0,4).map(h => (
                <div key={h.symbol} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 12 }}>
                  <span style={{ fontWeight: 600 }}>{h.symbol}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{h.shares} shares</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview panel */}
      {preview && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '35%',
          background: 'var(--panel)', borderLeft: '1px solid var(--border)',
          zIndex: 500, padding: 24, overflowY: 'auto',
          animation: 'slideIn 0.25s ease',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
        }}>
          <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
          <button onClick={() => setPreview(null)}
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {(() => {
            const q = getQuote(preview.symbol)
            const price = getPrice(q)
            const change = getChange(q)
            const owned = holdings.find(h => h.symbol === preview.symbol)
            return (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{q?.name || preview.symbol}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{preview.symbol}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, margin: '8px 0 4px' }}>${price.toFixed(2)}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {change >= 0 ? '▲ +' : '▼ '}{Math.abs(change).toFixed(2)}% Today
                  </div>
                  {!marketOpen && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Market Closed — Last Known Price</div>}
                </div>

                {owned && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-secondary)' }}>YOUR POSITION</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shares</div><div style={{ fontWeight: 700 }}>{owned.shares}</div></div>
                      <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg Price</div><div style={{ fontWeight: 700 }}>${owned.avg_price.toFixed(2)}</div></div>
                      <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Value</div><div style={{ fontWeight: 700 }}>${(owned.shares * price).toFixed(2)}</div></div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Gain/Loss</div>
                        <div style={{ fontWeight: 700, color: (price - owned.avg_price) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {(price - owned.avg_price) >= 0 ? '+' : ''}${((price - owned.avg_price) * owned.shares).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button className="btn btn-primary" style={{ width: '100%' }}
                    onClick={() => navigate(`/stock/${preview.symbol}`)}>
                    View Full Details
                  </button>
                  <button
                    className={`btn ${owned ? 'btn-danger' : 'btn-secondary'}`}
                    style={{ width: '100%' }}
                    onClick={() => {
                      if (owned) {
                        navigate(`/stock/${preview.symbol}`)
                      } else {
                        setBuyModal({ symbol: preview.symbol, name: q?.name || preview.symbol })
                        setBuyShares(1); setBuyError(''); setShowRiskWarning(false); setPreview(null)
                      }
                    }}
                  >
                    {owned ? 'Sell (go to stock page)' : 'Buy'}
                  </button>
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Buy Modal */}
      {buyModal && (() => {
        const q = getQuote(buyModal.symbol)
        const price = getPrice(q)
        const totalCost = buyShares * price
        const isHighRisk = (RISK[buyModal.symbol] || 'Medium') === 'High'
        return (
          <Modal onClose={() => { setBuyModal(null); setShowRiskWarning(false) }}>
            <ModalHeader title={`Buy ${buyModal.symbol}`} subtitle="Confirm your purchase." />
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Available Cash: <strong style={{ color: 'var(--text)' }}>${Number(profile?.current_balance || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <button onClick={() => setBuyShares(s => Math.max(1, s - 1))} className="btn btn-secondary" style={{ width: 44, height: 44, padding: 0, fontSize: 18 }}>−</button>
                <input type="number" className={`input ${buyError ? 'error' : ''}`} value={buyShares} min={1}
                  onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setBuyShares(Math.max(1, v)); setBuyError('') }}
                  style={{ textAlign: 'center', fontWeight: 700, fontSize: 16 }} />
                <button onClick={() => setBuyShares(s => s + 1)} className="btn btn-secondary" style={{ width: 44, height: 44, padding: 0, fontSize: 18 }}>+</button>
              </div>
              {buyError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{buyError}</div>}
              {showRiskWarning && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
                  borderRadius: 6, padding: '10px 12px', marginBottom: 10,
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fca5a5', marginBottom: 2 }}>High Risk Stock</div>
                    <div style={{ fontSize: 11, color: '#fca5a5' }}>{buyModal.symbol} is classified as high risk due to high price volatility. You may lose a significant portion of your investment. Click confirm again to proceed.</div>
                  </div>
                </div>
              )}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Share Price</span>
                  <span>${price.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>× Quantity</span>
                  <span>{buyShares}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span>Total Cost</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>Investing involves risk.</p>
            </div>
            <ModalFooter>
              <button className="btn btn-secondary" onClick={() => { setBuyModal(null); setShowRiskWarning(false) }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBuyClick}>{showRiskWarning ? 'Confirm Anyway' : 'Confirm Purchase'}</button>
            </ModalFooter>
          </Modal>
        )
      })()}
    </div>
  )
}
