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
      setSearchResults(res.data?.slice(0,6) || [])
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
    } catch(e) {
      setBuyError(e.message)
    }
  }

  const topGainer = DEFAULT_SYMBOLS.reduce((best, sym) => {
    const chg = getChange(getQuote(sym))
    return chg > getChange(getQuote(best)) ? sym : best
  }, DEFAULT_SYMBOLS[0])

  const portfolioGrowth = profile
    ? ((profile.current_balance - profile.starting_balance) / profile.starting_balance) * 100
    : 0

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
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--card)', padding: '4px 10px', borderRadius: 4 }}>
                🔴 Market Closed
              </span>
            )}
            {isGuest && (
              <span style={{ fontSize: 11, color: '#fb923c', background: 'rgba(249,115,22,0.1)', padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(249,115,22,0.2)' }}>
                Guest Session
              </span>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 28, display: 'flex', gap: 20 }}>
          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {/* Portfolio Value */}
              <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Portfolio Value</div>
                <div style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 4px' }}>
                  ${Number(profile?.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: portfolioGrowth >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                  {portfolioGrowth >= 0 ? '+' : ''}{portfolioGrowth.toFixed(2)}% all time
                </div>
                {isGuest && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Create an account to save progress.</div>}
              </div>

              {/* Market Trend */}
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Market Trend</div>
                <div style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 4px', color: 'var(--green)' }}>
                  {marketOpen ? 'Open' : 'Closed'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {marketOpen ? '▲ Live prices active' : 'Showing last known prices'}
                </div>
              </div>

              {/* Top Gainer */}
              <div className="card">
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Top Gainer</div>
                <div style={{ fontSize: 28, fontWeight: 700, margin: '6px 0 4px' }}>{topGainer}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>
                  {getChange(getQuote(topGainer)) >= 0 ? '+' : ''}{getChange(getQuote(topGainer)).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Stock table */}
            <div className="card-panel" style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Popular Stocks</h2>
                <div style={{ position: 'relative' }} ref={searchRef}>
                  <input
                    className="input" placeholder="🔍  Search stocks..."
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
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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
                        <span className={`risk-pill ${riskClass(sym)}`}>{RISK[sym] || 'Medium'}</span>

                        {/* Buy button */}
                        <button
                          className="btn btn-primary"
                          style={{ height: 34, padding: '0 14px', fontSize: 13, flexShrink: 0 }}
                          onClick={e => { e.stopPropagation(); setBuyModal({ symbol: sym, name: q?.name || sym }); setBuyShares(1); setBuyError('') }}
                        >Buy</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right trending panel */}
          <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 16, flexShrink: 0 }}>
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
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💡 Quick Tip</div>
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
            style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer' }}>✕</button>

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
                        setBuyShares(1); setBuyError(''); setPreview(null)
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
        return (
          <Modal onClose={() => setBuyModal(null)}>
            <ModalHeader title={`Buy ${buyModal.symbol}`} subtitle="Confirm your purchase." />
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Available Cash: <strong style={{ color: 'var(--text)' }}>${Number(profile?.current_balance || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <button onClick={() => setBuyShares(s => Math.max(1, s - 1))} className="btn btn-secondary" style={{ width: 44, height: 44, padding: 0, fontSize: 18 }}>−</button>
                <input type="number" className={`input ${buyError ? 'error' : ''}`} value={buyShares} min={1}
                  onChange={e => { setBuyShares(Math.max(1, Number(e.target.value))); setBuyError('') }}
                  style={{ textAlign: 'center', fontWeight: 700, fontSize: 16 }} />
                <button onClick={() => setBuyShares(s => s + 1)} className="btn btn-secondary" style={{ width: 44, height: 44, padding: 0, fontSize: 18 }}>+</button>
              </div>
              {buyError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{buyError}</div>}
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
              <button className="btn btn-secondary" onClick={() => setBuyModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleBuy}>Confirm Purchase</button>
            </ModalFooter>
          </Modal>
        )
      })()}
    </div>
  )
}
