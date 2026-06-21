import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function getBadge(growth) {
  if (growth >= 25) return { label: 'Expert', cls: 'badge-expert' }
  if (growth >= 10) return { label: 'Intermediate', cls: 'badge-intermediate' }
  return { label: 'Beginner', cls: 'badge-beginner' }
}

export default function Leaderboard() {
  const { user, profile } = useAuth()
  const [players, setPlayers] = useState([])
  const [filter, setFilter] = useState('All Time')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLeaderboard() }, [])

  async function fetchLeaderboard() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, starting_balance, current_balance')
      .order('current_balance', { ascending: false })
      .limit(50)
    if (data) {
      const ranked = data.map(p => ({
        ...p,
        growth: p.starting_balance ? ((p.current_balance - p.starting_balance) / p.starting_balance) * 100 : 0,
      })).sort((a, b) => b.growth - a.growth)
      setPlayers(ranked)
    }
    setLoading(false)
  }

  const top3 = players.slice(0, 3)
  const rest = players.slice(3)
  const myRank = players.findIndex(p => p.id === user?.id) + 1
  const myPlayer = players.find(p => p.id === user?.id)

  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3

  const podiumStyles = [
    { height: 110, border: 'var(--silver)', label: '2nd', rank: 2, color: 'var(--silver)' },
    { height: 140, border: 'var(--gold)',   label: '1st', rank: 1, color: 'var(--gold)', crown: true },
    { height: 110, border: 'var(--bronze)', label: '3rd', rank: 3, color: 'var(--bronze)' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Leaderboard</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Compete with other players and climb the rankings.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Daily','Weekly','Monthly','All Time'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="btn"
                style={{
                  height: 36, padding: '0 14px', fontSize: 12,
                  background: filter === f ? 'var(--blue)' : 'transparent',
                  border: '1px solid var(--border)',
                  color: filter === f ? 'white' : 'var(--text-secondary)',
                  borderRadius: 6,
                  boxShadow: filter === f ? '0 0 10px var(--blue-glow)' : 'none',
                }}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading rankings...</div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <div className="card-panel" style={{
                marginBottom: 24, textAlign: 'center',
                background: 'linear-gradient(180deg, var(--panel) 0%, var(--bg) 100%)',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Particle dots */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16, paddingBottom: 0, position: 'relative', zIndex: 1 }}>
                  {podiumOrder.map((player, i) => {
                    const style = podiumStyles[i]
                    if (!player) return null
                    const badge = getBadge(player.growth)
                    return (
                      <div key={player.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 160 }}>
                        {style.crown && <div style={{ marginBottom: 4, color: 'var(--gold)' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="var(--gold)" stroke="var(--gold)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h20M4 20l2-8 6 4 6-4 2 8"/><circle cx="12" cy="8" r="2"/></svg></div>}
                        <div style={{
                          width: 52, height: 52, borderRadius: '50%', marginBottom: 8,
                          background: `linear-gradient(135deg, ${style.color}44, ${style.color}22)`,
                          border: `2px solid ${style.color}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 700, color: style.color,
                        }}>{player.username?.[0]?.toUpperCase()}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{player.username}</div>
                        <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>
                          ${Number(player.current_balance).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 8 }}>
                          +{player.growth.toFixed(1)}%
                        </div>
                        <div style={{
                          width: '100%', height: style.height, borderRadius: '4px 4px 0 0',
                          background: `linear-gradient(180deg, ${style.color}22, ${style.color}11)`,
                          border: `1px solid ${style.color}`,
                          borderBottom: 'none',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12,
                        }}>
                          <div style={{ color: style.color, marginBottom: 2 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              {style.rank === 1 && <><circle cx="12" cy="8" r="6"/><path d="M12 14v6M9 20h6"/></>}
                              {style.rank === 2 && <><circle cx="12" cy="8" r="6"/><path d="M12 14v6M9 20h6"/><line x1="9" y1="14" x2="9" y2="14"/></>}
                              {style.rank === 3 && <><circle cx="12" cy="8" r="6"/><path d="M12 14v6M9 20h6"/></>}
                            </svg>
                          </div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: style.color }}>{style.label}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Rankings */}
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="card-panel" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700 }}>Global Rankings</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {players.map((player, i) => {
                      const isMe = player.id === user?.id
                      const badge = getBadge(player.growth)
                      return (
                        <div key={player.id} style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '12px 16px', borderRadius: 6,
                          background: isMe ? 'rgba(59,130,246,0.08)' : 'var(--card)',
                          border: isMe ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border)',
                          boxShadow: isMe ? '0 0 12px rgba(59,130,246,0.1)' : 'none',
                        }}>
                          <div style={{ width: 28, fontWeight: 700, fontSize: 15, color: i < 3 ? ['var(--gold)','var(--silver)','var(--bronze)'][i] : 'var(--text-muted)', flexShrink: 0, textAlign: 'center' }}>
                            #{i + 1}
                          </div>
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: `hsl(${player.username?.charCodeAt(0)*20},50%,30%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 13, color: 'white',
                          }}>{player.username?.[0]?.toUpperCase()}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {player.username}
                              {isMe && <span style={{ fontSize: 10, background: 'var(--blue)', color: 'white', padding: '1px 6px', borderRadius: 4 }}>YOU</span>}
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, minWidth: 90, textAlign: 'right' }}>
                            ${Number(player.current_balance).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </div>
                          <div style={{ minWidth: 70, textAlign: 'right', fontWeight: 700, color: player.growth >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {player.growth >= 0 ? '+' : ''}{player.growth.toFixed(1)}%
                          </div>
                          <span className={`badge ${badge.cls}`}>{badge.label}</span>
                        </div>
                      )
                    })}
                    {players.length === 0 && (
                      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        No players yet. Be the first to join!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats panel */}
              <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myRank > 0 && (
                  <div className="card-panel" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>YOUR RANK</div>
                    <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--blue)', lineHeight: 1 }}>#{myRank}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                      Top {Math.round((myRank / players.length) * 100)}% of players
                    </div>
                    {myPlayer && (
                      <div style={{ fontSize: 14, fontWeight: 700, color: myPlayer.growth >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 8 }}>
                        {myPlayer.growth >= 0 ? '+' : ''}{myPlayer.growth.toFixed(2)}% growth
                      </div>
                    )}
                  </div>
                )}

                <div className="card-panel">
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Quick Stats</div>
                  {[
                    { label: 'Total Players', value: players.length },
                    { label: 'Highest Balance', value: players[0] ? `$${Number(players[0].current_balance).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—' },
                    { label: 'Top Growth', value: players[0] ? `+${players[0].growth.toFixed(1)}%` : '—' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                      <span style={{ fontWeight: 600 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
