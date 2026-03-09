/**
 * Market Data Simulation Service
 *
 * Generates realistic OHLCV price data using a geometric Brownian motion model
 * with mean reversion (Ornstein-Uhlenbeck process overlay). This produces
 * price series that exhibit realistic volatility clustering and trend behavior.
 */

const SYMBOLS = {
  AAPL:  { name: 'Apple Inc.',          sector: 'Technology',      basePrice: 189.50, volatility: 0.018, meanReversion: 0.02 },
  MSFT:  { name: 'Microsoft Corp.',     sector: 'Technology',      basePrice: 415.20, volatility: 0.016, meanReversion: 0.015 },
  GOOGL: { name: 'Alphabet Inc.',       sector: 'Technology',      basePrice: 175.80, volatility: 0.020, meanReversion: 0.018 },
  AMZN:  { name: 'Amazon.com Inc.',     sector: 'Consumer Cycl.',  basePrice: 198.40, volatility: 0.022, meanReversion: 0.020 },
  TSLA:  { name: 'Tesla Inc.',          sector: 'Automotive',      basePrice: 245.60, volatility: 0.035, meanReversion: 0.010 },
  NVDA:  { name: 'NVIDIA Corp.',        sector: 'Semiconductors',  basePrice: 880.50, volatility: 0.030, meanReversion: 0.012 },
  META:  { name: 'Meta Platforms Inc.', sector: 'Technology',      basePrice: 520.30, volatility: 0.024, meanReversion: 0.016 },
  JPM:   { name: 'JPMorgan Chase',      sector: 'Financial',       basePrice: 198.70, volatility: 0.014, meanReversion: 0.025 },
  V:     { name: 'Visa Inc.',           sector: 'Financial',       basePrice: 282.40, volatility: 0.012, meanReversion: 0.022 },
  WMT:   { name: 'Walmart Inc.',        sector: 'Consumer Def.',   basePrice: 168.90, volatility: 0.010, meanReversion: 0.030 },
  BTC:   { name: 'Bitcoin',             sector: 'Crypto',          basePrice: 68420.00, volatility: 0.040, meanReversion: 0.005 },
  ETH:   { name: 'Ethereum',            sector: 'Crypto',          basePrice: 3850.00,  volatility: 0.045, meanReversion: 0.008 },
}

function gaussianRandom() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

/**
 * Generate a single OHLCV candle from a starting price.
 * Uses geometric Brownian motion with mean reversion for realistic behavior.
 */
function generateCandle(prevClose, config, timestamp) {
  const { basePrice, volatility, meanReversion } = config

  // Ornstein-Uhlenbeck mean reversion component
  const reversion = meanReversion * (basePrice - prevClose)
  const drift = reversion / basePrice

  // Generate intra-candle price movements
  const returns = drift + volatility * gaussianRandom()
  const close = prevClose * (1 + returns)

  // Generate realistic OHLC relationships
  const range = prevClose * volatility * (0.5 + Math.random() * 1.5)
  const high = Math.max(prevClose, close) + range * Math.random() * 0.5
  const low = Math.min(prevClose, close) - range * Math.random() * 0.5

  // Volume follows a log-normal distribution, higher on larger moves
  const moveSize = Math.abs(returns) / volatility
  const baseVolume = 1000000 + Math.random() * 5000000
  const volumeMultiplier = 1 + moveSize * 0.5
  const volume = Math.floor(baseVolume * volumeMultiplier * (0.7 + Math.random() * 0.6))

  return {
    timestamp,
    open: Math.max(0.01, prevClose),
    high: Math.max(0.01, high),
    low: Math.max(0.01, low),
    close: Math.max(0.01, close),
    volume,
  }
}

/**
 * Generate historical OHLCV data for a given symbol.
 * @param {string} symbol - The ticker symbol
 * @param {number} periods - Number of candles to generate
 * @param {string} interval - Candle interval ('1m', '5m', '15m', '1h', '4h', '1d')
 * @returns {Array} Array of OHLCV candle objects
 */
export function generateHistoricalData(symbol, periods = 200, interval = '1h') {
  const config = SYMBOLS[symbol]
  if (!config) throw new Error(`Unknown symbol: ${symbol}`)

  const intervalMs = {
    '1m': 60000,
    '5m': 300000,
    '15m': 900000,
    '1h': 3600000,
    '4h': 14400000,
    '1d': 86400000,
  }

  const ms = intervalMs[interval] || 3600000
  const now = Date.now()
  const candles = []
  let prevClose = config.basePrice * (0.9 + Math.random() * 0.2)

  for (let i = periods - 1; i >= 0; i--) {
    const timestamp = now - i * ms
    const candle = generateCandle(prevClose, config, timestamp)
    candles.push(candle)
    prevClose = candle.close
  }

  return candles
}

/**
 * Generate a real-time tick update from the last known price.
 */
export function generateTick(symbol, lastPrice) {
  const config = SYMBOLS[symbol]
  if (!config) return null

  const tickVol = config.volatility * 0.1
  const reversion = config.meanReversion * 0.05 * (config.basePrice - lastPrice)
  const drift = reversion / config.basePrice
  const change = drift + tickVol * gaussianRandom()
  const newPrice = Math.max(0.01, lastPrice * (1 + change))

  return {
    symbol,
    price: newPrice,
    change: newPrice - lastPrice,
    changePercent: ((newPrice - lastPrice) / lastPrice) * 100,
    volume: Math.floor(1000 + Math.random() * 50000),
    timestamp: Date.now(),
    bid: newPrice * (1 - 0.0001 - Math.random() * 0.0003),
    ask: newPrice * (1 + 0.0001 + Math.random() * 0.0003),
  }
}

/**
 * Generate an order book snapshot for a given price.
 */
export function generateOrderBook(currentPrice, levels = 15) {
  const bids = []
  const asks = []
  const spreadPercent = 0.0005 + Math.random() * 0.001

  for (let i = 0; i < levels; i++) {
    const bidOffset = spreadPercent * (i + 1) + Math.random() * 0.0002
    const askOffset = spreadPercent * (i + 1) + Math.random() * 0.0002

    const bidPrice = currentPrice * (1 - bidOffset)
    const askPrice = currentPrice * (1 + askOffset)

    // Volume tends to decrease away from the spread
    const depthFactor = Math.exp(-i * 0.15)
    const bidSize = Math.floor((500 + Math.random() * 5000) * depthFactor)
    const askSize = Math.floor((500 + Math.random() * 5000) * depthFactor)

    bids.push({ price: bidPrice, size: bidSize, total: 0 })
    asks.push({ price: askPrice, size: askSize, total: 0 })
  }

  // Calculate cumulative totals
  let bidTotal = 0
  for (const bid of bids) {
    bidTotal += bid.size
    bid.total = bidTotal
  }

  let askTotal = 0
  for (const ask of asks) {
    askTotal += ask.size
    ask.total = askTotal
  }

  return { bids, asks, spread: asks[0].price - bids[0].price, spreadPercent: spreadPercent * 100 }
}

/**
 * Get the list of available symbols with metadata.
 */
export function getSymbols() {
  return Object.entries(SYMBOLS).map(([symbol, config]) => ({
    symbol,
    name: config.name,
    sector: config.sector,
    basePrice: config.basePrice,
  }))
}

/**
 * Get configuration for a specific symbol.
 */
export function getSymbolConfig(symbol) {
  return SYMBOLS[symbol] || null
}

export { SYMBOLS }
