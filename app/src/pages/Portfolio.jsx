import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { getBatchQuotes } from '../lib/twelvedata'
import SellModal from '../components/SellModal'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899']

export default function Portfolio() {
  const { profile } = useAuth()
  const { holdings } = usePortfolio()
  const [quotes, setQuotes] = useState({})
  const [sellTarget, setSellTarget] = useState(null)

  useEffect(() => {
    if (holdings.length) {
      getBatchQuotes(holdings.map(h => h.symbol)).then(data => {
        const map = {}
        if (Array.isArray(data)) data.forEach(q => { map[q.symbol] = q })
        else if (data && typeof data === 'object') Object.assign(map, data)
        setQuotes(map)
      })
    }
  }, [holdings])

  function getPrice(sym) {
    const q = quotes[sym]
    if (!q) return 0
    return parseFloat(q.close || q.price || 0)
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.shares * getPrice(h.symbol), 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avg_price, 0)
  const totalGain = totalValue - totalCost
  const portfolioTotal = (profile?.current_balance || 0) + totalValue
  const growthPct = profile?.starting_balance
    ? ((portfolioTotal - profile.starting_balance) / profile.starting_balance) * 100
    : 0

  const pieData = holdings.map(h => ({
    name: h.symbol,
    value: h.shares * getPrice(h.symbol),
  })).filter(d => d.value > 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>My Portfolio</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Track your investments and performance.
        </p>

        {/* Performance banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f, #162032)',
          borderRadius: 16, padding: '24px 32px', marginBottom: 24,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Total Portfolio Value</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>${portfolioTotal.toLocaleString('en-US', { maximumFractionDigits: 2 })}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Invested Gain/Loss</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: totalGain >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {totalGain >= 0 ? '+' : ''}${totalGain.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>All Time Growth</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: growthPct >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}%
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Holdings */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Holdings</h2>
            {holdings.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                <div>No stocks owned yet. Go to the market to buy your first shares.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {holdings.map(h => {
                  const price = getPrice(h.symbol)
                  const gain = (price - h.avg_price) * h.shares
                  const gainPct = ((price - h.avg_price) / h.avg_price) * 100
                  return (
                    <div key={h.symbol} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                        background: `hsl(${h.symbol.charCodeAt(0)*20},60%,30%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14, color: 'white',
                      }}>{h.symbol[0]}</div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700 }}>{h.company_name || h.symbol}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.shares} shares</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg Buy</div>
                        <div style={{ fontWeight: 600 }}>${h.avg_price.toFixed(2)}</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current</div>
                        <div style={{ fontWeight: 600 }}>${price.toFixed(2)}</div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: 90 }}>
                        <div style={{ fontWeight: 700, color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                        </div>
                        <div style={{ fontSize: 12, color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                        </div>
                      </div>

                      <button className="btn btn-secondary"
                        style={{ border: '1px solid var(--red)', color: 'var(--red)', height: 36, padding: '0 14px', fontSize: 13 }}
                        onClick={() => setSellTarget(h)}>
                        Sell
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Cash card */}
            <div className="card" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>Available Cash</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not invested</div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>
                ${Number(profile?.current_balance || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Pie chart */}
          {pieData.length > 0 && (
            <div style={{ width: 240, flexShrink: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Allocation</h2>
              <div className="card-panel" style={{ padding: 16 }}>
                <PieChart width={200} height={200}>
                  <Pie data={pieData} cx={100} cy={100} innerRadius={55} outerRadius={90} dataKey="value" strokeWidth={0}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]}
                        style={{ filter: `drop-shadow(0 0 6px ${COLORS[i % COLORS.length]}88)` }} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `$${v.toFixed(2)}`}
                    contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {pieData.map((d, i) => {
                    const total = pieData.reduce((s, x) => s + x.value, 0)
                    return (
                      <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                          <span style={{ fontWeight: 600 }}>{d.name}</span>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>{((d.value / total) * 100).toFixed(1)}%</span>
                      </div>
                    )
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 600 }}>Cash</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {(((profile?.current_balance || 0) / ((profile?.current_balance || 0) + totalValue)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {sellTarget && (
        <SellModal
          holding={sellTarget}
          currentPrice={getPrice(sellTarget.symbol)}
          onClose={() => setSellTarget(null)}
        />
      )}
    </div>
  )
}
