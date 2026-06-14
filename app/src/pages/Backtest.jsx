import { useState, useRef } from 'react'
import Sidebar from '../components/Sidebar'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useToast } from '../components/Toast'

const API_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY
const BASE_URL = 'https://api.twelvedata.com'

const STEPS = { PICK_STOCK: 0, PICK_DATE: 1, TRADE: 2 }

function fmt(n) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function Backtest() {
  const { addToast } = useToast()

  // Setup state
  const [step, setStep] = useState(STEPS.PICK_STOCK)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [stock, setStock] = useState(null)       // { symbol, name, earliest }
  const [startDate, setStartDate] = useState('')
  const [loadingDates, setLoadingDates] = useState(false)
  const [earliestDate, setEarliestDate] = useState('')
  const searchTimer = useRef(null)

  // Session state
  const [cash, setCash] = useState(10000)
  const [shares, setShares] = useState(0)
  const [avgBuyPrice, setAvgBuyPrice] = useState(0)
  const [currentDate, setCurrentDate] = useState('')   // the date we're "at" in the past
  const [currentPrice, setCurrentPrice] = useState(null)
  const [jumpDate, setJumpDate] = useState('')
  const [jumping, setJumping] = useState(false)
  const [tradeQty, setTradeQty] = useState(1)
  const [history, setHistory] = useState([])           // [{ date, price, action, qty, cash, shares, portfolioValue }]
  const [allPrices, setAllPrices] = useState([])       // full price series for chart
  const [buyHoldStart, setBuyHoldStart] = useState(null) // price on session start date

  // ─── Search ───────────────────────────────────────────────────────────────
  function handleSearchInput(val) {
    setSearchQuery(val)
    clearTimeout(searchTimer.current)
    if (!val.trim()) { setSearchResults([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`${BASE_URL}/symbol_search?symbol=${encodeURIComponent(val)}&apikey=${API_KEY}`)
        const data = await res.json()
        setSearchResults((data.data || []).slice(0, 8).filter(r => r.instrument_type === 'Common Stock' || r.instrument_type === 'ETF'))
      } catch { setSearchResults([]) }
      setSearching(false)
    }, 400)
  }

  async function selectStock(r) {
    setSearchQuery(r.symbol + ' — ' + r.instrument_name)
    setSearchResults([])
    setLoadingDates(true)
    // Fetch earliest available date via a large time series request
    try {
      const res = await fetch(`${BASE_URL}/time_series?symbol=${r.symbol}&interval=1day&outputsize=5000&apikey=${API_KEY}`)
      const data = await res.json()
      if (data.values && data.values.length) {
        const earliest = data.values[data.values.length - 1].datetime.split(' ')[0]
        setEarliestDate(earliest)
        setStock({ symbol: r.symbol, name: r.instrument_name, earliest })
        setStep(STEPS.PICK_DATE)
      } else {
        addToast('No historical data available for this stock.', 'error')
      }
    } catch {
      addToast('Failed to fetch stock data.', 'error')
    }
    setLoadingDates(false)
  }

  // ─── Start session ─────────────────────────────────────────────────────────
  async function startSession() {
    if (!startDate) return
    setJumping(true)
    try {
      // Fetch full price series from start date to now
      const res = await fetch(`${BASE_URL}/time_series?symbol=${stock.symbol}&interval=1day&start_date=${startDate}&apikey=${API_KEY}&outputsize=5000`)
      const data = await res.json()
      if (!data.values || !data.values.length) { addToast('No data for this date range.', 'error'); setJumping(false); return }
      const prices = data.values.map(v => ({ date: v.datetime.split(' ')[0], price: parseFloat(v.close) })).reverse()
      setAllPrices(prices)
      const first = prices[0]
      setBuyHoldStart(first.price)
      setCurrentDate(first.date)
      setCurrentPrice(first.price)
      setJumpDate('')
      setCash(10000)
      setShares(0)
      setAvgBuyPrice(0)
      setHistory([{ date: first.date, price: first.price, action: 'START', qty: 0, cash: 10000, shares: 0, portfolioValue: 10000 }])
      setStep(STEPS.TRADE)
    } catch { addToast('Failed to load data.', 'error') }
    setJumping(false)
  }

  // ─── Jump to date ──────────────────────────────────────────────────────────
  async function jumpToDate() {
    if (!jumpDate || jumpDate <= currentDate) return
    setJumping(true)
    try {
      // Find price on/nearest to jumpDate in allPrices
      const future = allPrices.filter(p => p.date <= jumpDate)
      if (!future.length) { addToast('No data for that date.', 'error'); setJumping(false); return }
      const target = future[future.length - 1]
      setCurrentDate(target.date)
      setCurrentPrice(target.price)
      setJumpDate('')
      const portfolioValue = cash + shares * target.price
      setHistory(h => [...h, { date: target.date, price: target.price, action: 'JUMP', qty: 0, cash, shares, portfolioValue }])
    } catch { addToast('Failed to jump to date.', 'error') }
    setJumping(false)
  }

  // ─── Buy ───────────────────────────────────────────────────────────────────
  function handleBuy() {
    const qty = parseInt(tradeQty, 10)
    if (!qty || qty < 1) return
    const cost = qty * currentPrice
    if (cost > cash) { addToast('Insufficient funds.', 'error'); return }
    const newCash = cash - cost
    const newShares = shares + qty
    const newAvg = ((avgBuyPrice * shares) + (currentPrice * qty)) / newShares
    setCash(newCash)
    setShares(newShares)
    setAvgBuyPrice(newAvg)
    const portfolioValue = newCash + newShares * currentPrice
    setHistory(h => [...h, { date: currentDate, price: currentPrice, action: 'BUY', qty, cash: newCash, shares: newShares, portfolioValue }])
    addToast('Bought', 'success', `${qty} shares of ${stock.symbol} at $${fmt(currentPrice)}`)
  }

  // ─── Sell ──────────────────────────────────────────────────────────────────
  function handleSell() {
    const qty = parseInt(tradeQty, 10)
    if (!qty || qty < 1) return
    if (qty > shares) { addToast('Not enough shares.', 'error'); return }
    const proceeds = qty * currentPrice
    const newCash = cash + proceeds
    const newShares = shares - qty
    setCash(newCash)
    setShares(newShares)
    if (newShares === 0) setAvgBuyPrice(0)
    const portfolioValue = newCash + newShares * currentPrice
    setHistory(h => [...h, { date: currentDate, price: currentPrice, action: 'SELL', qty, cash: newCash, shares: newShares, portfolioValue }])
    addToast('Sold', 'success', `${qty} shares of ${stock.symbol} at $${fmt(currentPrice)}`)
  }

  // ─── Reset ─────────────────────────────────────────────────────────────────
  function resetSession() {
    setStep(STEPS.PICK_STOCK)
    setStock(null)
    setSearchQuery('')
    setSearchResults([])
    setStartDate('')
    setEarliestDate('')
    setCash(10000)
    setShares(0)
    setAvgBuyPrice(0)
    setCurrentDate('')
    setCurrentPrice(null)
    setJumpDate('')
    setHistory([])
    setAllPrices([])
    setBuyHoldStart(null)
    setTradeQty(1)
  }

  // ─── Derived stats ─────────────────────────────────────────────────────────
  const portfolioValue = currentPrice != null ? cash + shares * currentPrice : cash
  const totalReturn = portfolioValue - 10000
  const totalReturnPct = (totalReturn / 10000) * 100
  const isUp = totalReturn >= 0

  const latestDate = allPrices.length ? allPrices[allPrices.length - 1].date : null
  const buyHoldValue = buyHoldStart && latestDate
    ? (10000 / buyHoldStart) * (allPrices.find(p => p.date === currentDate)?.price || buyHoldStart)
    : null
  const buyHoldReturn = buyHoldValue ? ((buyHoldValue - 10000) / 10000) * 100 : null
  const beating = buyHoldReturn != null ? totalReturnPct - buyHoldReturn : null

  // Chart: show price line + portfolio value overlay
  const chartData = allPrices.filter(p => p.date >= (history[0]?.date || '') && p.date <= currentDate)

  // Min date for jump = day after currentDate
  const minJump = currentDate ? (() => {
    const d = new Date(currentDate); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })() : ''

  const maxJump = latestDate || new Date().toISOString().split('T')[0]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Backtest</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Travel back in time and simulate trades with real historical prices.
            </p>
          </div>
          {step === STEPS.TRADE && (
            <button className="btn btn-secondary" style={{ fontSize: 12, height: 36 }} onClick={resetSession}>
              Reset Session
            </button>
          )}
        </div>

        {/* ── STEP 0: Pick stock ── */}
        {step === STEPS.PICK_STOCK && (
          <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: 40 }}>
            <div className="card-panel">
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Choose a Stock</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Search any stock or ETF. We'll load all available historical data for it.
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  placeholder="Search symbol or company name..."
                  value={searchQuery}
                  onChange={e => handleSearchInput(e.target.value)}
                  autoFocus
                />
                {(searching || loadingDates) && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-muted)' }}>
                    {loadingDates ? 'Loading data...' : 'Searching...'}
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    background: 'var(--panel)', border: '1px solid var(--border)',
                    borderRadius: 6, marginTop: 4, overflow: 'hidden',
                  }}>
                    {searchResults.map(r => (
                      <button key={r.symbol + r.exchange} onClick={() => selectStock(r)}
                        style={{
                          width: '100%', padding: '10px 14px', background: 'transparent',
                          border: 'none', borderBottom: '1px solid var(--border)',
                          color: 'var(--text)', textAlign: 'left', cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--card)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{r.symbol}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{r.instrument_name}</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.exchange}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
                Tip: Try AAPL (1980), MSFT (1986), SPY (1993), or TSLA (2010).
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 1: Pick start date ── */}
        {step === STEPS.PICK_DATE && stock && (
          <div style={{ maxWidth: 560, margin: '0 auto', paddingTop: 40 }}>
            <div className="card-panel">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 8, flexShrink: 0,
                  background: `hsl(${stock.symbol.charCodeAt(0) * 20},60%,30%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 18, color: 'white',
                }}>{stock.symbol[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{stock.symbol}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stock.name}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Pick your starting date. Data available from <strong style={{ color: 'var(--text)' }}>{earliestDate}</strong>.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                You'll start with $10,000 in virtual cash and can jump forward to any future date.
              </div>
              <input
                className="input"
                type="date"
                value={startDate}
                min={earliestDate}
                max={new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]}
                onChange={e => setStartDate(e.target.value)}
                style={{ marginBottom: 16 }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetSession}>Back</button>
                <button className="btn btn-primary" style={{ flex: 2 }} disabled={!startDate || jumping} onClick={startSession}>
                  {jumping ? 'Loading...' : 'Start Backtest'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Trading interface ── */}
        {step === STEPS.TRADE && stock && (
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Left: chart + trade log */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Stock header */}
              <div className="card-panel">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700 }}>{stock.symbol}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{stock.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>${fmt(currentPrice)}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Price on {currentDate}</div>
                  </div>
                </div>

                {/* Chart */}
                {chartData.length > 1 && (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false}
                        tickFormatter={d => d?.slice(5)} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false}
                        domain={['auto', 'auto']} tickFormatter={v => `$${v}`} width={55} />
                      <Tooltip
                        contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 11 }}
                        formatter={v => [`$${v.toFixed(2)}`, 'Price']}
                      />
                      {history.filter(h => h.action === 'BUY').map((h, i) => (
                        <ReferenceLine key={`b${i}`} x={h.date} stroke="var(--green)" strokeDasharray="3 3" strokeOpacity={0.6} />
                      ))}
                      {history.filter(h => h.action === 'SELL').map((h, i) => (
                        <ReferenceLine key={`s${i}`} x={h.date} stroke="var(--red)" strokeDasharray="3 3" strokeOpacity={0.6} />
                      ))}
                      <Line type="monotone" dataKey="price" stroke="var(--blue)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Trade log */}
              <div className="card-panel" style={{ padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Trade Log</div>
                {history.length <= 1 ? (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No trades yet. Jump to a date and buy shares.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 240, overflowY: 'auto' }}>
                    {[...history].reverse().filter(h => h.action !== 'START' && h.action !== 'JUMP').map((h, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 12px', borderRadius: 6, background: 'var(--card)',
                        border: '1px solid var(--border)',
                      }}>
                        <div style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0,
                          background: h.action === 'BUY' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          color: h.action === 'BUY' ? 'var(--green)' : 'var(--red)',
                        }}>{h.action}</div>
                        <div style={{ flex: 1, fontSize: 12 }}>
                          <span style={{ fontWeight: 600 }}>{h.qty} shares</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>@ ${fmt(h.price)}</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: controls */}
            <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Portfolio summary */}
              <div className="card-panel">
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Your Backtest Portfolio</div>
                {[
                  { label: 'Cash', value: `$${fmt(cash)}`, color: 'var(--blue)' },
                  { label: 'Shares held', value: shares, color: 'var(--text)' },
                  { label: 'Portfolio value', value: `$${fmt(portfolioValue)}`, color: 'var(--text)' },
                  { label: 'Total return', value: `${isUp ? '+' : ''}${totalReturnPct.toFixed(2)}%`, color: isUp ? 'var(--green)' : 'var(--red)' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                    <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
                {shares > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Avg buy price</span>
                    <span style={{ fontWeight: 700 }}>${fmt(avgBuyPrice)}</span>
                  </div>
                )}
                {beating != null && (
                  <div style={{
                    marginTop: 10, padding: '8px 10px', borderRadius: 6,
                    background: beating >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${beating >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    fontSize: 12,
                  }}>
                    <div style={{ fontWeight: 700, color: beating >= 0 ? 'var(--green)' : 'var(--red)', marginBottom: 2 }}>
                      {beating >= 0 ? `+${beating.toFixed(2)}%` : `${beating.toFixed(2)}%`} vs buy & hold
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      Buy & hold from start: {buyHoldReturn != null ? `${buyHoldReturn >= 0 ? '+' : ''}${buyHoldReturn.toFixed(2)}%` : '—'}
                    </div>
                  </div>
                )}
              </div>

              {/* Jump to date */}
              <div className="card-panel">
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Jump to Date</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Currently viewing: <strong style={{ color: 'var(--text)' }}>{currentDate}</strong>
                </div>
                <input
                  className="input"
                  type="date"
                  value={jumpDate}
                  min={minJump}
                  max={maxJump}
                  onChange={e => setJumpDate(e.target.value)}
                  style={{ marginBottom: 10 }}
                />
                <button className="btn btn-primary" style={{ width: '100%', fontSize: 13 }}
                  disabled={!jumpDate || jumping} onClick={jumpToDate}>
                  {jumping ? 'Jumping...' : 'Jump Forward'}
                </button>
              </div>

              {/* Buy / Sell */}
              <div className="card-panel">
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Trade at {currentDate}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Price: <strong style={{ color: 'var(--text)' }}>${fmt(currentPrice)}</strong>
                  {shares > 0 && <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>· {shares} owned</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <button onClick={() => setTradeQty(q => Math.max(1, (parseInt(q,10)||1) - 1))}
                    className="btn btn-secondary" style={{ width: 36, height: 36, padding: 0, fontSize: 16 }}>−</button>
                  <input type="number" className="input" value={tradeQty} min={1}
                    onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v) && v >= 1) setTradeQty(v) }}
                    style={{ textAlign: 'center', fontWeight: 700 }} />
                  <button onClick={() => setTradeQty(q => (parseInt(q,10)||1) + 1)}
                    className="btn btn-secondary" style={{ width: 36, height: 36, padding: 0, fontSize: 16 }}>+</button>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  Cost: ${fmt((parseInt(tradeQty,10)||0) * currentPrice)}
                  {' · '}Proceeds: ${fmt((parseInt(tradeQty,10)||0) * currentPrice)}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" style={{ flex: 1, background: 'var(--green)', fontSize: 13 }} onClick={handleBuy}>
                    Buy
                  </button>
                  <button className="btn btn-danger" style={{ flex: 1, fontSize: 13 }} disabled={shares < 1} onClick={handleSell}>
                    Sell
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
