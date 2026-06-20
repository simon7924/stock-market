import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { getQuote, getTimeSeries, isMarketOpen } from '../lib/twelvedata'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { useToast } from '../components/Toast'
import SellModal from '../components/SellModal'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const INTERVALS = ['1day', '1week', '1month']
const INTERVAL_LABELS = { '1day': '1D', '1week': '1W', '1month': '1M' }

export default function StockDetails() {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { holdings, buyStock } = usePortfolio()
  const { addToast } = useToast()
  const [quote, setQuote] = useState(null)
  const [series, setSeries] = useState([])
  const [interval, setInterval] = useState('1day')
  const [buyShares, setBuyShares] = useState(1)
  const [sellShares, setSellShares] = useState(1)
  const [buyError, setBuyError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showSellModal, setShowSellModal] = useState(false)
  const marketOpen = isMarketOpen()

  const owned = holdings.find(h => h.symbol === symbol)

  useEffect(() => {
    fetchData()
  }, [symbol, interval])

  async function fetchData() {
    setLoading(true)
    try {
      const [q, ts] = await Promise.all([
        getQuote(symbol),
        getTimeSeries(symbol, interval, 60)
      ])
      setQuote(q)
      if (ts.values) {
        setSeries(ts.values.map(v => ({
          date: v.datetime,
          price: parseFloat(v.close),
        })).reverse())
      } else if (ts.code === 429 || ts.status === 'error') {
        // Rate limited — retry once after 15s
        setTimeout(async () => {
          const retry = await getTimeSeries(symbol, interval, 60)
          if (retry.values) {
            setSeries(retry.values.map(v => ({
              date: v.datetime,
              price: parseFloat(v.close),
            })).reverse())
          }
        }, 15000)
      }
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  const price = parseFloat(quote?.close || quote?.price || 0)
  const change = parseFloat(quote?.percent_change || quote?.change_percent || 0)
  const isPositive = change >= 0

  async function handleBuy() {
    setBuyError('')
    const cost = buyShares * price
    if (cost > profile.current_balance) { setBuyError('Insufficient funds.'); return }
    try {
      await buyStock(symbol, quote?.name || symbol, buyShares, price)
      addToast('Shares Purchased', 'success', `You bought ${buyShares} shares of ${symbol}.`)
      setBuyShares(1)
    } catch(e) { setBuyError(e.message) }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        {/* Back */}
        <button onClick={() => navigate('/dashboard')} className="btn btn-ghost" style={{ marginBottom: 16, fontSize: 13 }}>
          ← Back to Market
        </button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Left: chart + info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Stock header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 700 }}>{quote?.name || symbol}</h1>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{symbol} • Technology</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 32, fontWeight: 700 }}>${price.toFixed(2)}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: isPositive ? 'var(--green)' : 'var(--red)' }}>
                    {isPositive ? '▲ +' : '▼ '}{Math.abs(change).toFixed(2)}% Today
                  </div>
                  {!marketOpen && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Market Closed — Last Known Price</div>}
                </div>
              </div>

              {/* Chart */}
              <div className="card-panel" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 12 }}>
                  {Object.entries(INTERVAL_LABELS).map(([k,v]) => (
                    <button key={k} onClick={() => setInterval(k)}
                      className="btn"
                      style={{
                        height: 30, padding: '0 12px', fontSize: 12,
                        background: interval === k ? 'var(--blue)' : 'transparent',
                        border: '1px solid var(--border)',
                        color: interval === k ? 'white' : 'var(--text-secondary)',
                        borderRadius: 4,
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false}
                      tickFormatter={d => d?.split(' ')[0]?.slice(5)} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false}
                      domain={['auto','auto']} tickFormatter={v => `$${v}`} width={60} />
                    <Tooltip
                      contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }}
                      labelStyle={{ color: 'var(--text-secondary)' }}
                      formatter={v => [`$${v.toFixed(2)}`, 'Price']}
                    />
                    <Line type="monotone" dataKey="price" stroke={isPositive ? '#22c55e' : '#ef4444'}
                      strokeWidth={2} dot={false}
                      isAnimationActive={window.__stocksimGraphAnimations !== false}
                      style={{ filter: `drop-shadow(0 0 6px ${isPositive ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'})` }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Info cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: '52W High', value: quote?.fifty_two_week?.high ? `$${parseFloat(quote.fifty_two_week.high).toFixed(2)}` : '—' },
                  { label: '52W Low', value: quote?.fifty_two_week?.low ? `$${parseFloat(quote.fifty_two_week.low).toFixed(2)}` : '—' },
                  { label: 'Day High', value: quote?.high ? `$${parseFloat(quote.high).toFixed(2)}` : '—' },
                  { label: 'Day Low', value: quote?.low ? `$${parseFloat(quote.low).toFixed(2)}` : '—' },
                ].map(info => (
                  <div key={info.label} className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{info.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{info.value}</div>
                  </div>
                ))}
              </div>

              {/* Company description */}
              <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 6, flexShrink: 0,
                  background: `hsl(${symbol.charCodeAt(0) * 20},60%,30%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 18, color: 'white',
                }}>{symbol[0]}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{quote?.name || symbol}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {symbol} is a publicly traded company listed on major stock exchanges.
                    It operates in the technology and financial markets sector.
                    Use the chart above to track its price history and performance over time.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: buy/sell panel */}
            <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Buy panel */}
              <div className="card-panel">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Buy Shares</h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                  Available Cash: <strong style={{ color: 'var(--text)' }}>
                    ${Number(profile?.current_balance || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <button onClick={() => setBuyShares(s => Math.max(1, s - 1))} className="btn btn-secondary" style={{ width: 36, height: 36, padding: 0 }}>−</button>
                  <input type="number" className={`input ${buyError ? 'error' : ''}`} value={buyShares} min={1}
                    onChange={e => { setBuyShares(Math.max(1, Number(e.target.value))); setBuyError('') }}
                    style={{ textAlign: 'center', fontWeight: 700 }} />
                  <button onClick={() => setBuyShares(s => s + 1)} className="btn btn-secondary" style={{ width: 36, height: 36, padding: 0 }}>+</button>
                </div>

                {buyError && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{buyError}</div>}

                <div style={{ fontSize: 13, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Share Price</span>
                    <span>${price.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>× Quantity</span>
                    <span>{buyShares}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Total Cost</span>
                    <span>${(buyShares * price).toFixed(2)}</span>
                  </div>
                </div>

                <button className="btn btn-primary" style={{ width: '100%', background: 'var(--green)' }} onClick={handleBuy}>
                  Confirm Purchase
                </button>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>Investing involves risk.</p>
              </div>

              {/* Your Position (only if owned) */}
              {owned && (
                <div className="card-panel">
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Your Position</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shares Owned</div><div style={{ fontWeight: 700 }}>{owned.shares}</div></div>
                    <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg Buy Price</div><div style={{ fontWeight: 700 }}>${owned.avg_price.toFixed(2)}</div></div>
                    <div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current Value</div><div style={{ fontWeight: 700 }}>${(owned.shares * price).toFixed(2)}</div></div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unrealized P/L</div>
                      <div style={{ fontWeight: 700, color: (price - owned.avg_price) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                        {(price - owned.avg_price) >= 0 ? '+' : ''}${((price - owned.avg_price) * owned.shares).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <button className="btn btn-danger" style={{ width: '100%' }} onClick={() => setShowSellModal(true)}>
                    Sell Shares
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showSellModal && owned && (
        <SellModal holding={owned} currentPrice={price} onClose={() => setShowSellModal(false)} />
      )}
    </div>
  )
}
