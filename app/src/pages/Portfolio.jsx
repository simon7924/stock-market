import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { usePortfolio } from '../context/PortfolioContext'
import { getBatchQuotes } from '../lib/twelvedata'
import SellModal from '../components/SellModal'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899']

function fmt(n, decimals = 2) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

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

  const cash = profile?.current_balance || 0
  const totalInvestedValue = holdings.reduce((sum, h) => sum + h.shares * getPrice(h.symbol), 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.shares * h.avg_price, 0)
  const investedGain = totalInvestedValue - totalCost
  const investedGainPct = totalCost > 0 ? (investedGain / totalCost) * 100 : 0
  const portfolioTotal = cash + totalInvestedValue
  const growthPct = profile?.starting_balance
    ? ((portfolioTotal - profile.starting_balance) / profile.starting_balance) * 100
    : 0

  // Distribution: all percentages are out of total portfolio (cash + holdings)
  const pieData = [
    ...holdings.map((h, i) => ({
      name: h.symbol,
      value: h.shares * getPrice(h.symbol),
      color: COLORS[i % COLORS.length],
      isCash: false,
    })).filter(d => d.value > 0),
    { name: 'Cash', value: cash, color: '#64748b', isCash: true },
  ].filter(d => d.value > 0)

  const bestHolding = holdings.length
    ? holdings.reduce((best, h) => {
        const gain = getPrice(h.symbol) - h.avg_price
        const bestGain = getPrice(best.symbol) - best.avg_price
        return gain > bestGain ? h : best
      }, holdings[0])
    : null

  const worstHolding = holdings.length
    ? holdings.reduce((worst, h) => {
        const gain = getPrice(h.symbol) - h.avg_price
        const worstGain = getPrice(worst.symbol) - worst.avg_price
        return gain < worstGain ? h : worst
      }, holdings[0])
    : null

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>My Portfolio</h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Track your investments and performance.
        </p>

        {/* Summary banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-end) 100%)',
          borderRadius: 10, padding: '24px 32px', marginBottom: 24,
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0 }}>
            {[
              {
                label: 'Total Value',
                value: `$${fmt(portfolioTotal)}`,
                sub: `Started with $${fmt(profile?.starting_balance || 10000)}`,
                color: 'var(--text)',
                big: true,
              },
              {
                label: 'All-Time Return',
                value: `${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(2)}%`,
                sub: `${growthPct >= 0 ? '+' : ''}$${fmt(Math.abs(portfolioTotal - (profile?.starting_balance || 10000)))} overall`,
                color: growthPct >= 0 ? 'var(--green)' : 'var(--red)',
              },
              {
                label: 'Invested Gain',
                value: `${investedGain >= 0 ? '+' : ''}$${fmt(Math.abs(investedGain))}`,
                sub: `${investedGainPct >= 0 ? '+' : ''}${investedGainPct.toFixed(2)}% on positions`,
                color: investedGain >= 0 ? 'var(--green)' : 'var(--red)',
              },
              {
                label: 'Cash',
                value: `$${fmt(cash)}`,
                sub: `${portfolioTotal > 0 ? ((cash / portfolioTotal) * 100).toFixed(1) : 0}% of portfolio`,
                color: 'var(--blue)',
              },
              {
                label: 'Positions',
                value: holdings.length,
                sub: holdings.length === 0 ? 'Buy your first stock' : `${holdings.reduce((s, h) => s + h.shares, 0)} total shares`,
                color: 'var(--text)',
              },
            ].map((s, i) => (
              <div key={s.label} style={{
                paddingLeft: i === 0 ? 0 : 24,
                borderLeft: i === 0 ? 'none' : '1px solid var(--border)',
              }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: s.big ? 28 : 20, fontWeight: 700, color: s.color, lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Best / worst row */}
          {bestHolding && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 32, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>Best position:</span>
                <span style={{ fontWeight: 700 }}>{bestHolding.symbol}</span>
                <span style={{ color: 'var(--green)', marginLeft: 8, fontWeight: 600 }}>
                  {((getPrice(bestHolding.symbol) - bestHolding.avg_price) / bestHolding.avg_price * 100).toFixed(2)}%
                </span>
              </div>
              {worstHolding && worstHolding.symbol !== bestHolding.symbol && (
                <div>
                  <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>Worst position:</span>
                  <span style={{ fontWeight: 700 }}>{worstHolding.symbol}</span>
                  <span style={{ color: 'var(--red)', marginLeft: 8, fontWeight: 600 }}>
                    {((getPrice(worstHolding.symbol) - worstHolding.avg_price) / worstHolding.avg_price * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Holdings */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Holdings</h2>
            {holdings.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                </div>
                <div>No stocks owned yet. Go to the market to buy your first shares.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {holdings.map(h => {
                  const price = getPrice(h.symbol)
                  const gain = (price - h.avg_price) * h.shares
                  const gainPct = h.avg_price > 0 ? ((price - h.avg_price) / h.avg_price) * 100 : 0
                  const value = h.shares * price
                  const pctOfTotal = portfolioTotal > 0 ? (value / portfolioTotal) * 100 : 0
                  return (
                    <div key={h.symbol} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                        background: `hsl(${h.symbol.charCodeAt(0)*20},60%,30%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14, color: 'white',
                      }}>{h.symbol[0]}</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700 }}>{h.company_name || h.symbol}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.shares} shares · {pctOfTotal.toFixed(1)}% of portfolio</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg Buy</div>
                        <div style={{ fontWeight: 600 }}>${fmt(h.avg_price)}</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current</div>
                        <div style={{ fontWeight: 600 }}>${fmt(price)}</div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Value</div>
                        <div style={{ fontWeight: 600 }}>${fmt(value)}</div>
                      </div>

                      <div style={{ textAlign: 'right', minWidth: 90 }}>
                        <div style={{ fontWeight: 700, color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {gain >= 0 ? '+' : ''}${fmt(gain)}
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
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Not invested · {portfolioTotal > 0 ? ((cash / portfolioTotal) * 100).toFixed(1) : 0}% of portfolio
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>
                ${fmt(cash)}
              </div>
            </div>
          </div>

          {/* Distribution chart */}
          {pieData.length > 0 && (
            <div style={{ width: 260, flexShrink: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Distribution</h2>
              <div className="card-panel" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <PieChart width={210} height={210}>
                    <Pie data={pieData} cx={105} cy={105} innerRadius={58} outerRadius={95} dataKey="value" strokeWidth={0} paddingAngle={2}>
                      {pieData.map((d, i) => (
                        <Cell key={d.name} fill={d.color}
                          style={{ filter: `drop-shadow(0 0 5px ${d.color}99)` }} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, name) => [`$${fmt(v)} (${portfolioTotal > 0 ? ((v / portfolioTotal) * 100).toFixed(1) : 0}%)`, name]}
                      contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12 }}
                    />
                  </PieChart>
                </div>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: d.isCash ? 'var(--text-secondary)' : 'var(--text)' }}>{d.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {portfolioTotal > 0 ? ((d.value / portfolioTotal) * 100).toFixed(1) : 0}%
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>${fmt(d.value, 0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
                  All percentages are out of your total portfolio value.
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
