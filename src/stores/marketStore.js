import { create } from 'zustand'
import { generateHistoricalData, generateTick, generateOrderBook, getSymbols } from '../services/marketData'
import { calculateAllIndicators } from '../services/technicalIndicators'

const useMarketStore = create((set, get) => ({
  // Current selected symbol
  selectedSymbol: 'AAPL',
  interval: '1h',

  // Price data
  candles: [],
  enrichedCandles: [],
  currentPrice: 0,
  previousClose: 0,
  dayChange: 0,
  dayChangePercent: 0,
  dayHigh: 0,
  dayLow: 0,
  dayVolume: 0,

  // Order book
  orderBook: { bids: [], asks: [], spread: 0, spreadPercent: 0 },

  // Ticker data for all symbols
  tickers: {},

  // Available symbols
  symbols: getSymbols(),

  // Watchlist
  watchlist: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'BTC', 'ETH'],

  // Real-time update interval
  updateInterval: null,

  // Indicator toggles
  showIndicators: {
    sma20: true,
    sma50: false,
    ema12: false,
    ema26: false,
    bollingerBands: false,
    volume: true,
  },

  // Initialize data for a symbol
  initializeSymbol: (symbol) => {
    const candles = generateHistoricalData(symbol, 200, get().interval)
    const enriched = calculateAllIndicators(candles)
    const lastCandle = candles[candles.length - 1]
    const firstCandle = candles[0]

    // Calculate daily stats
    let dayHigh = 0
    let dayLow = Infinity
    let dayVolume = 0
    const last24 = candles.slice(-24)
    for (const c of last24) {
      if (c.high > dayHigh) dayHigh = c.high
      if (c.low < dayLow) dayLow = c.low
      dayVolume += c.volume
    }

    set({
      selectedSymbol: symbol,
      candles,
      enrichedCandles: enriched,
      currentPrice: lastCandle.close,
      previousClose: firstCandle.close,
      dayChange: lastCandle.close - firstCandle.close,
      dayChangePercent: ((lastCandle.close - firstCandle.close) / firstCandle.close) * 100,
      dayHigh,
      dayLow,
      dayVolume,
      orderBook: generateOrderBook(lastCandle.close),
    })
  },

  // Update tickers for watchlist
  initializeTickers: () => {
    const tickers = {}
    const watchlist = get().watchlist
    for (const symbol of watchlist) {
      const candles = generateHistoricalData(symbol, 50, '1h')
      const last = candles[candles.length - 1]
      const prev = candles[candles.length - 2]
      tickers[symbol] = {
        symbol,
        price: last.close,
        change: last.close - prev.close,
        changePercent: ((last.close - prev.close) / prev.close) * 100,
        volume: last.volume,
        high: last.high,
        low: last.low,
        sparkline: candles.slice(-20).map(c => c.close),
      }
    }
    set({ tickers })
  },

  // Simulate real-time tick
  tick: () => {
    const state = get()
    const { selectedSymbol, currentPrice, candles, watchlist, tickers } = state

    // Update selected symbol
    const tickData = generateTick(selectedSymbol, currentPrice)
    if (!tickData) return

    const newCandles = [...candles]
    const lastCandle = { ...newCandles[newCandles.length - 1] }
    lastCandle.close = tickData.price
    lastCandle.high = Math.max(lastCandle.high, tickData.price)
    lastCandle.low = Math.min(lastCandle.low, tickData.price)
    lastCandle.volume += tickData.volume
    newCandles[newCandles.length - 1] = lastCandle

    const enriched = calculateAllIndicators(newCandles)

    // Update all watchlist tickers
    const newTickers = { ...tickers }
    for (const sym of watchlist) {
      if (sym === selectedSymbol) {
        newTickers[sym] = {
          ...newTickers[sym],
          price: tickData.price,
          change: tickData.change,
          changePercent: tickData.changePercent,
          volume: tickData.volume,
        }
      } else if (newTickers[sym]) {
        const t = generateTick(sym, newTickers[sym].price)
        if (t) {
          newTickers[sym] = {
            ...newTickers[sym],
            price: t.price,
            change: t.change,
            changePercent: t.changePercent,
            volume: t.volume,
          }
        }
      }
    }

    set({
      currentPrice: tickData.price,
      dayChange: tickData.price - state.previousClose,
      dayChangePercent: ((tickData.price - state.previousClose) / state.previousClose) * 100,
      dayHigh: Math.max(state.dayHigh, tickData.price),
      dayLow: Math.min(state.dayLow, tickData.price),
      dayVolume: state.dayVolume + tickData.volume,
      candles: newCandles,
      enrichedCandles: enriched,
      orderBook: generateOrderBook(tickData.price),
      tickers: newTickers,
    })
  },

  // Start real-time updates
  startRealtime: () => {
    const existing = get().updateInterval
    if (existing) clearInterval(existing)

    const interval = setInterval(() => {
      get().tick()
    }, 1500)

    set({ updateInterval: interval })
  },

  // Stop real-time updates
  stopRealtime: () => {
    const interval = get().updateInterval
    if (interval) {
      clearInterval(interval)
      set({ updateInterval: null })
    }
  },

  // Change selected symbol
  selectSymbol: (symbol) => {
    get().initializeSymbol(symbol)
  },

  // Change interval
  setInterval: (interval) => {
    set({ interval })
    get().initializeSymbol(get().selectedSymbol)
  },

  // Toggle indicator
  toggleIndicator: (indicator) => {
    set((state) => ({
      showIndicators: {
        ...state.showIndicators,
        [indicator]: !state.showIndicators[indicator],
      },
    }))
  },

  // Add/remove from watchlist
  addToWatchlist: (symbol) => {
    set((state) => {
      if (state.watchlist.includes(symbol)) return state
      return { watchlist: [...state.watchlist, symbol] }
    })
  },

  removeFromWatchlist: (symbol) => {
    set((state) => ({
      watchlist: state.watchlist.filter(s => s !== symbol),
    }))
  },
}))

export default useMarketStore
