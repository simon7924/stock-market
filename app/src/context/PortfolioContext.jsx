import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const PortfolioContext = createContext({})

export function PortfolioProvider({ children }) {
  const { user, profile, isGuest, setProfile } = useAuth()
  const [holdings, setHoldings] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  // Guest state stored in memory only
  const [guestHoldings, setGuestHoldings] = useState([])
  const [guestTransactions, setGuestTransactions] = useState([])

  useEffect(() => {
    if (user) {
      fetchHoldings()
      fetchTransactions()
    } else if (!isGuest) {
      setHoldings([])
      setTransactions([])
    }
  }, [user, isGuest])

  async function fetchHoldings() {
    const { data } = await supabase.from('holdings').select('*').eq('user_id', user.id)
    setHoldings(data || [])
  }

  async function fetchTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setTransactions(data || [])
  }

  async function buyStock(symbol, companyName, shares, pricePerShare) {
    const totalCost = shares * pricePerShare
    const balance = isGuest ? profile.current_balance : profile.current_balance

    if (totalCost > balance) throw new Error('Insufficient funds')

    if (isGuest) {
      const existing = guestHoldings.find(h => h.symbol === symbol)
      if (existing) {
        const newShares = existing.shares + shares
        const newAvg = ((existing.avg_price * existing.shares) + (pricePerShare * shares)) / newShares
        setGuestHoldings(prev => prev.map(h =>
          h.symbol === symbol ? { ...h, shares: newShares, avg_price: newAvg } : h
        ))
      } else {
        setGuestHoldings(prev => [...prev, { symbol, company_name: companyName, shares, avg_price: pricePerShare }])
      }
      setGuestTransactions(prev => [{
        type: 'BUY', symbol, company_name: companyName, shares,
        price_per_share: pricePerShare, total_value: totalCost,
        created_at: new Date().toISOString(),
      }, ...prev])
      setProfile(p => ({ ...p, current_balance: p.current_balance - totalCost }))
      return
    }

    const newBalance = profile.current_balance - totalCost
    const { error: balErr } = await supabase
      .from('profiles')
      .update({ current_balance: newBalance })
      .eq('id', user.id)
    if (balErr) throw balErr

    const existing = holdings.find(h => h.symbol === symbol)
    if (existing) {
      const newShares = existing.shares + shares
      const newAvg = ((existing.avg_price * existing.shares) + (pricePerShare * shares)) / newShares
      await supabase.from('holdings').update({ shares: newShares, avg_price: newAvg })
        .eq('user_id', user.id).eq('symbol', symbol)
    } else {
      await supabase.from('holdings').insert({
        user_id: user.id, symbol, company_name: companyName,
        shares, avg_price: pricePerShare,
      })
    }

    await supabase.from('transactions').insert({
      user_id: user.id, type: 'BUY', symbol,
      shares, price_per_share: pricePerShare, total_value: totalCost,
    })

    setProfile(p => ({ ...p, current_balance: newBalance }))
    await fetchHoldings()
    await fetchTransactions()
  }

  async function sellStock(symbol, companyName, shares, pricePerShare) {
    const totalValue = shares * pricePerShare

    if (isGuest) {
      const existing = guestHoldings.find(h => h.symbol === symbol)
      if (!existing || existing.shares < shares) throw new Error('Not enough shares')
      const gain = (pricePerShare - existing.avg_price) * shares
      if (existing.shares === shares) {
        setGuestHoldings(prev => prev.filter(h => h.symbol !== symbol))
      } else {
        setGuestHoldings(prev => prev.map(h =>
          h.symbol === symbol ? { ...h, shares: h.shares - shares } : h
        ))
      }
      setGuestTransactions(prev => [{
        type: 'SELL', symbol, company_name: companyName, shares,
        price_per_share: pricePerShare, total_value: totalValue,
        realized_gain: gain, created_at: new Date().toISOString(),
      }, ...prev])
      setProfile(p => ({ ...p, current_balance: p.current_balance + totalValue }))
      return
    }

    const existing = holdings.find(h => h.symbol === symbol)
    if (!existing || existing.shares < shares) throw new Error('Not enough shares')
    const gain = (pricePerShare - existing.avg_price) * shares
    const newBalance = profile.current_balance + totalValue

    await supabase.from('profiles')
      .update({ current_balance: newBalance })
      .eq('id', user.id)

    if (existing.shares === shares) {
      await supabase.from('holdings').delete().eq('user_id', user.id).eq('symbol', symbol)
    } else {
      await supabase.from('holdings').update({ shares: existing.shares - shares })
        .eq('user_id', user.id).eq('symbol', symbol)
    }

    await supabase.from('transactions').insert({
      user_id: user.id, type: 'SELL', symbol,
      shares, price_per_share: pricePerShare, total_value: totalValue,
      realized_gain: gain,
    })

    setProfile(p => ({ ...p, current_balance: newBalance }))
    await fetchHoldings()
    await fetchTransactions()
  }

  async function resetPortfolio() {
    if (isGuest) {
      setGuestHoldings([])
      setGuestTransactions([])
      setProfile(p => ({ ...p, current_balance: p.starting_balance }))
      return
    }
    await supabase.from('holdings').delete().eq('user_id', user.id)
    await supabase.from('transactions').delete().eq('user_id', user.id)
    await supabase.from('profiles').update({
      current_balance: profile.starting_balance,
    }).eq('id', user.id)
    setProfile(p => ({ ...p, current_balance: p.starting_balance }))
    setHoldings([])
    setTransactions([])
  }

  const activeHoldings = isGuest ? guestHoldings : holdings
  const activeTransactions = isGuest ? guestTransactions : transactions

  return (
    <PortfolioContext.Provider value={{
      holdings: activeHoldings,
      transactions: activeTransactions,
      loading,
      buyStock,
      sellStock,
      resetPortfolio,
      refreshHoldings: isGuest ? () => {} : fetchHoldings,
    }}>
      {children}
    </PortfolioContext.Provider>
  )
}

export const usePortfolio = () => useContext(PortfolioContext)
