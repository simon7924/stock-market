import { useState } from 'react'
import Sidebar from '../components/Sidebar'

const TOPICS = [
  {
    id: 'stock',
    icon: '📈',
    title: 'What Is a Stock?',
    difficulty: 'Beginner',
    description: 'Learn how owning shares gives you part ownership in a company.',
    progress: 0,
    content: [
      'A stock represents partial ownership in a company. When you buy a share, you own a small piece of that business.',
      'Companies sell shares to raise money. In return, shareholders can benefit from the company\'s growth.',
      'If the company does well, the stock price goes up. If it struggles, the price goes down.',
      'In StockSim, you can buy shares of real companies and see your ownership stake grow.',
    ],
    quiz: { question: 'What does owning a stock mean?', options: ['You lent money to a company','You own part of a company','You are an employee','You manage the company'], answer: 1 },
  },
  {
    id: 'risk',
    icon: '🛡',
    title: 'Understanding Risk',
    difficulty: 'Beginner',
    description: 'What risk means, how it relates to reward, and the low/medium/high risk scale.',
    progress: 0,
    content: [
      'Risk is the chance that your investment loses value. Higher risk means bigger potential gains — but also bigger potential losses.',
      'Low risk stocks (like large stable companies) move slowly. High risk stocks can jump or crash quickly.',
      'In StockSim, each stock shows a risk level: Low, Medium, or High — so you always know what you\'re getting into.',
      'A good rule: never put all your money into high-risk stocks.',
    ],
    quiz: { question: 'What does higher risk usually mean?', options: ['Guaranteed profit','Lower potential returns','Higher potential returns and losses','Safer investment'], answer: 2 },
  },
  {
    id: 'diversification',
    icon: '🥧',
    title: 'Diversification',
    difficulty: 'Intermediate',
    description: 'Why spreading investments across multiple stocks reduces risk and protects against losses.',
    progress: 0,
    content: [
      'Diversification means spreading your money across different stocks instead of putting it all in one.',
      'If one stock crashes, a diversified portfolio is protected — other stocks can offset the loss.',
      'Think of it like not putting all your eggs in one basket.',
      'In StockSim, the portfolio page shows your allocation breakdown so you can spot when you\'re too concentrated.',
    ],
    quiz: { question: 'Why is diversification important?', options: ['It guarantees profits','It reduces the impact of one stock crashing','It makes your portfolio worth more immediately','It removes all risk'], answer: 1 },
  },
  {
    id: 'compound',
    icon: '💰',
    title: 'Compound Growth',
    difficulty: 'Intermediate',
    description: 'How money grows over time when returns are reinvested, and why starting early matters.',
    progress: 0,
    content: [
      'Compound growth means your gains start earning gains. Your money grows on top of itself.',
      'Example: $1,000 at 10% growth = $1,100 after year 1. Year 2: $1,210. Year 3: $1,331 — without adding anything.',
      'The earlier you start investing, the more time compound growth has to work.',
      'Einstein reportedly called compound interest "the eighth wonder of the world."',
    ],
    quiz: { question: 'What makes compound growth powerful?', options: ['You never lose money','Your gains also earn gains over time','It only works with large amounts','It works instantly'], answer: 1 },
  },
]

export default function Learn() {
  const [activeTopic, setActiveTopic] = useState(null)
  const [quizAnswer, setQuizAnswer] = useState(null)
  const [progress, setProgress] = useState({})

  function openTopic(topic) { setActiveTopic(topic); setQuizAnswer(null) }
  function closeTopic() { setActiveTopic(null) }

  function completeLesson(id) {
    setProgress(p => ({ ...p, [id]: 100 }))
    closeTopic()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Hero banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f3d 100%)',
          padding: '40px 40px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05 }}>
            <svg width="100%" height="100%"><polyline points="0,80 150,40 300,70 450,20 600,50 750,10 900,40 1100,20" fill="none" stroke="#3b82f6" strokeWidth="2"/></svg>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Learn Investing</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
              Understand the stock market step-by-step.
            </p>
            <button className="btn btn-primary" style={{ height: 40, fontSize: 13 }}>
              Start Beginner Course
            </button>
          </div>
        </div>

        <div style={{ padding: 32, display: 'flex', gap: 28 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Topics</h2>

            {/* Topic grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
              {TOPICS.map(topic => {
                const pct = progress[topic.id] || 0
                const isIntermediate = topic.difficulty === 'Intermediate'
                return (
                  <button key={topic.id} onClick={() => openTopic(topic)}
                    style={{
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 14, padding: 20, textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.2s', color: 'var(--text)',
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ fontSize: 28 }}>{topic.icon}</div>
                      <span className={`badge ${isIntermediate ? 'badge-intermediate' : 'badge-beginner'}`}>
                        {topic.difficulty}
                      </span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{topic.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>
                      {topic.description}
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{pct}% Complete</div>
                  </button>
                )
              })}
            </div>

            {/* Featured lesson */}
            <div className="card-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Featured Lesson</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>What Is Diversification?</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                  Diversification is one of the most important concepts in investing. It means spreading your money across different assets to reduce risk.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  {['Reduces risk','Spreads investments','Protects against losses'].map(b => (
                    <li key={b} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--green)' }}>✓</span> {b}
                    </li>
                  ))}
                </ul>
                <button className="btn btn-primary" style={{ height: 38, fontSize: 13 }} onClick={() => openTopic(TOPICS[2])}>
                  Continue Lesson →
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="180" height="160" viewBox="0 0 180 160">
                  {/* Pie chart */}
                  <circle cx="90" cy="80" r="60" fill="#1b2230"/>
                  {[
                    { color: '#3b82f6', start: 0, end: 90 },
                    { color: '#22c55e', start: 90, end: 180 },
                    { color: '#f59e0b', start: 180, end: 270 },
                    { color: '#8b5cf6', start: 270, end: 360 },
                  ].map((seg, i) => {
                    const s = (seg.start * Math.PI) / 180, e = (seg.end * Math.PI) / 180
                    const x1 = 90 + 60 * Math.cos(s), y1 = 80 + 60 * Math.sin(s)
                    const x2 = 90 + 60 * Math.cos(e), y2 = 80 + 60 * Math.sin(e)
                    return <path key={i} d={`M90,80 L${x1},${y1} A60,60 0 0,1 ${x2},${y2} Z`} fill={seg.color} opacity="0.85"/>
                  })}
                  <text x="90" y="85" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">Diversified</text>
                  <text x="30" y="155" fill="#22c55e" fontSize="12">✓ Good</text>
                  <text x="100" y="155" fill="#ef4444" fontSize="12">✕ All in one</text>
                </svg>
              </div>
            </div>
          </div>

          {/* Progress panel */}
          <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card-panel" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Progress</div>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ display: 'block', margin: '0 auto' }}>
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--blue)" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40 * Object.values(progress).filter(v => v === 100).length / 4} ${2 * Math.PI * 40}`}
                  strokeLinecap="round" transform="rotate(-90 50 50)"/>
                <text x="50" y="55" textAnchor="middle" fill="white" fontSize="18" fontWeight="700">
                  {Math.round(Object.values(progress).filter(v => v === 100).length / 4 * 100)}%
                </text>
              </svg>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>Course Completion</div>
            </div>

            <div className="card-panel">
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Achievements</div>
              {[
                { icon: '🎯', label: 'First Lesson', earned: Object.keys(progress).length > 0 },
                { icon: '💼', label: 'First Investment', earned: false },
                { icon: '🏗', label: 'Portfolio Builder', earned: false },
              ].map(a => (
                <div key={a.label} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
                  opacity: a.earned ? 1 : 0.4,
                }}>
                  <span style={{ fontSize: 18 }}>{a.icon}</span>
                  <span style={{ fontSize: 12, color: a.earned ? 'var(--text)' : 'var(--text-muted)' }}>{a.label}</span>
                  {a.earned && <span style={{ marginLeft: 'auto', color: 'var(--green)', fontSize: 12 }}>✓</span>}
                </div>
              ))}
            </div>

            <div className="card-panel">
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>💡 Daily Tip</div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Investing small amounts consistently can grow significantly over time through compound growth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Topic modal */}
      {activeTopic && (
        <div className="modal-overlay" onClick={closeTopic}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflow: 'auto' }}>
            <button onClick={closeTopic} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>{activeTopic.icon}</span>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700 }}>{activeTopic.title}</h2>
                <span className={`badge ${activeTopic.difficulty === 'Intermediate' ? 'badge-intermediate' : 'badge-beginner'}`}>{activeTopic.difficulty}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {activeTopic.content.map((para, i) => (
                <p key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{para}</p>
              ))}
            </div>

            {/* Quiz */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Quick Check</div>
              <p style={{ fontSize: 14, marginBottom: 14 }}>{activeTopic.quiz.question}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeTopic.quiz.options.map((opt, i) => {
                  let bg = 'var(--card)'
                  let border = 'var(--border)'
                  if (quizAnswer !== null) {
                    if (i === activeTopic.quiz.answer) { bg = 'rgba(34,197,94,0.1)'; border = 'var(--green)' }
                    else if (i === quizAnswer) { bg = 'rgba(239,68,68,0.1)'; border = 'var(--red)' }
                  }
                  return (
                    <button key={i} onClick={() => setQuizAnswer(i)}
                      style={{ padding: '10px 14px', borderRadius: 8, background: bg, border: `1px solid ${border}`, color: 'var(--text)', textAlign: 'left', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {quizAnswer !== null && (
                <div style={{ marginTop: 10, fontSize: 13, color: quizAnswer === activeTopic.quiz.answer ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                  {quizAnswer === activeTopic.quiz.answer ? '✓ Correct!' : '✕ Not quite. The correct answer is highlighted.'}
                </div>
              )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => completeLesson(activeTopic.id)}>
              Mark as Complete ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
