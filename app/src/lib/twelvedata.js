const API_KEY = import.meta.env.VITE_TWELVE_DATA_API_KEY
const BASE_URL = 'https://api.twelvedata.com'

const CACHE_TTL = 90_000 // 90 seconds — survives page reloads within the rate-limit window

function fromCache(key) {
  try {
    const raw = localStorage.getItem(`td_${key}`)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (Date.now() < entry.expiresAt) return entry.data
    localStorage.removeItem(`td_${key}`)
  } catch {}
  return null
}

function toCache(key, data) {
  try {
    localStorage.setItem(`td_${key}`, JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL }))
  } catch {}
}

// Simple in-flight deduplication: if a request for the same key is already
// in-flight, return the same promise instead of firing a second HTTP call.
const inflight = new Map()

async function fetchWithCache(key, url) {
  const cached = fromCache(key)
  if (cached) return cached

  if (inflight.has(key)) return inflight.get(key)

  const promise = fetch(url)
    .then(r => r.json())
    .then(data => {
      toCache(key, data)
      inflight.delete(key)
      return data
    })
    .catch(err => {
      inflight.delete(key)
      throw err
    })

  inflight.set(key, promise)
  return promise
}

export async function getQuote(symbol) {
  const key = `quote:${symbol}`
  return fetchWithCache(key, `${BASE_URL}/quote?symbol=${symbol}&apikey=${API_KEY}`)
}

export async function getTimeSeries(symbol, interval = '1day', outputsize = 90) {
  const key = `ts:${symbol}:${interval}:${outputsize}`
  return fetchWithCache(
    key,
    `${BASE_URL}/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${API_KEY}`
  )
}

export async function searchSymbol(query) {
  const res = await fetch(`${BASE_URL}/symbol_search?symbol=${query}&apikey=${API_KEY}`)
  return res.json()
}

// Uses /price endpoint (1 credit per symbol in batch, but returns just price)
// Falls back to parsing the returned object into a quote-like shape.
export async function getBatchQuotes(symbols) {
  const joined = symbols.join(',')
  const key = `batch:${joined}`
  const data = await fetchWithCache(key, `${BASE_URL}/quote?symbol=${joined}&apikey=${API_KEY}`)
  // /quote with multiple symbols returns { AAPL: { close, percent_change, ... }, TSLA: {...} }
  // Single symbol returns the quote object directly.
  if (data && typeof data === 'object' && !data.code) {
    const first = Object.values(data)[0]
    if (first && typeof first === 'object' && 'close' in first) {
      return Object.entries(data).map(([symbol, q]) => ({ symbol, ...q }))
    }
    // Single symbol response — wrap it
    if ('close' in data) {
      return [{ symbol: symbols[0], ...data }]
    }
  }
  return data
}

export function isMarketOpen() {
  const now = new Date()
  const day = now.getUTCDay()
  const totalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  // NYSE: Mon-Fri 13:30-20:00 UTC
  return day >= 1 && day <= 5 && totalMinutes >= 810 && totalMinutes < 1200
}
