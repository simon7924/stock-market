import { useState } from 'react'
import Modal, { ModalHeader, ModalFooter } from './Modal'
import { usePortfolio } from '../context/PortfolioContext'
import { useToast } from './Toast'

export default function SellModal({ holding, currentPrice, onClose }) {
  const { sellStock } = usePortfolio()
  const { addToast } = useToast()
  const [shares, setShares] = useState(1)
  const [loading, setLoading] = useState(false)

  const maxShares = holding.shares
  const totalValue = shares * currentPrice
  const gain = (currentPrice - holding.avg_price) * shares
  const gainPct = ((currentPrice - holding.avg_price) / holding.avg_price) * 100

  function setPercent(pct) {
    setShares(Math.max(1, Math.floor(maxShares * pct)))
  }

  async function handleSell() {
    setLoading(true)
    try {
      await sellStock(holding.symbol, holding.company_name, shares, currentPrice)
      addToast('Shares Sold', 'success', `You sold ${shares} shares of ${holding.symbol}.`)
      onClose()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Sell Shares" subtitle="Choose how many shares you want to sell." />

      {/* Owned shares card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shares Owned</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{maxShares}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Avg Buy Price</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>${holding.avg_price.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current Price</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>${currentPrice.toFixed(2)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unrealized P/L</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {gain >= 0 ? '+' : ''}${((currentPrice - holding.avg_price) * maxShares).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick % buttons */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[0.25, 0.5, 1].map(pct => (
          <button key={pct} onClick={() => setPercent(pct)}
            className="btn btn-secondary"
            style={{ flex: 1, height: 36, fontSize: 12 }}>
            {pct === 1 ? '100%' : pct === 0.5 ? '50%' : '25%'}
          </button>
        ))}
      </div>

      {/* Quantity selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => setShares(s => Math.max(1, s - 1))}
          className="btn btn-secondary" style={{ width: 44, height: 44, padding: 0, fontSize: 18 }}>−</button>
        <input
          type="number" className="input" value={shares} min={1} max={maxShares}
          onChange={e => {
            const v = parseInt(e.target.value, 10)
            if (!isNaN(v)) setShares(Math.min(maxShares, Math.max(1, v)))
          }}
          style={{ textAlign: 'center', fontWeight: 700, fontSize: 16 }}
        />
        <button onClick={() => setShares(s => Math.min(maxShares, s + 1))}
          className="btn btn-secondary" style={{ width: 44, height: 44, padding: 0, fontSize: 18 }}>+</button>
      </div>

      {/* Preview */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Shares selling</span>
          <span style={{ fontWeight: 600 }}>{shares}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Price per share</span>
          <span style={{ fontWeight: 600 }}>${currentPrice.toFixed(2)}</span>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Estimated proceeds</span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>${totalValue.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Realized gain/loss</span>
          <span style={{ fontWeight: 600, color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {gain >= 0 ? '+' : ''}${gain.toFixed(2)} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      <ModalFooter>
        <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={handleSell} disabled={loading || shares < 1 || shares > maxShares}>
          {loading ? 'Selling...' : 'Sell Shares'}
        </button>
      </ModalFooter>
    </Modal>
  )
}
