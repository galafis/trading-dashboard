/**
 * Technical Indicators Module
 *
 * Implements common financial technical indicators used in trading analysis.
 * All functions accept arrays of candle objects with { close, high, low, volume } fields.
 */

/**
 * Simple Moving Average (SMA)
 * @param {number[]} data - Array of price values
 * @param {number} period - Lookback period
 * @returns {(number|null)[]} SMA values (null for insufficient data)
 */
export function sma(data, period) {
  const result = []
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
      continue
    }
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j]
    }
    result.push(sum / period)
  }
  return result
}

/**
 * Exponential Moving Average (EMA)
 * @param {number[]} data - Array of price values
 * @param {number} period - Lookback period
 * @returns {(number|null)[]} EMA values
 */
export function ema(data, period) {
  const result = []
  const multiplier = 2 / (period + 1)

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null)
      continue
    }
    if (i === period - 1) {
      // Seed EMA with SMA for the first value
      let sum = 0
      for (let j = 0; j < period; j++) sum += data[j]
      result.push(sum / period)
      continue
    }
    const prev = result[i - 1]
    if (prev === null) {
      result.push(null)
      continue
    }
    result.push((data[i] - prev) * multiplier + prev)
  }
  return result
}

/**
 * Relative Strength Index (RSI)
 * Uses Wilder's smoothing method.
 * @param {number[]} closes - Array of closing prices
 * @param {number} period - RSI period (default 14)
 * @returns {(number|null)[]} RSI values between 0-100
 */
export function rsi(closes, period = 14) {
  const result = []
  const gains = []
  const losses = []

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      result.push(null)
      continue
    }

    const change = closes[i] - closes[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)

    if (i < period) {
      result.push(null)
      continue
    }

    if (i === period) {
      const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
      const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
      if (avgLoss === 0) {
        result.push(100)
      } else {
        const rs = avgGain / avgLoss
        result.push(100 - 100 / (1 + rs))
      }
      continue
    }

    // Wilder's smoothing for subsequent values
    const prevRsi = result[i - 1]
    if (prevRsi === null) {
      result.push(null)
      continue
    }

    const currentGain = gains[gains.length - 1]
    const currentLoss = losses[losses.length - 1]

    // Reconstruct previous avgGain/avgLoss from previous RSI
    const prevRs = prevRsi === 100 ? Infinity : prevRsi / (100 - prevRsi)
    const prevAvgLoss = prevRs === Infinity ? 0 : 1 / (1 + prevRs)
    const prevAvgGain = prevRs === Infinity ? 1 : prevRs * prevAvgLoss

    const avgGain = (prevAvgGain * (period - 1) + currentGain) / period
    const avgLoss = (prevAvgLoss * (period - 1) + currentLoss) / period

    if (avgLoss === 0) {
      result.push(100)
    } else {
      const rs = avgGain / avgLoss
      result.push(100 - 100 / (1 + rs))
    }
  }

  return result
}

/**
 * Moving Average Convergence Divergence (MACD)
 * @param {number[]} closes - Array of closing prices
 * @param {number} fastPeriod - Fast EMA period (default 12)
 * @param {number} slowPeriod - Slow EMA period (default 26)
 * @param {number} signalPeriod - Signal line period (default 9)
 * @returns {{ macd: (number|null)[], signal: (number|null)[], histogram: (number|null)[] }}
 */
export function macd(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const fastEma = ema(closes, fastPeriod)
  const slowEma = ema(closes, slowPeriod)

  const macdLine = closes.map((_, i) => {
    if (fastEma[i] === null || slowEma[i] === null) return null
    return fastEma[i] - slowEma[i]
  })

  // Calculate signal line as EMA of MACD values (skip nulls)
  const validMacd = macdLine.filter(v => v !== null)
  const signalEma = ema(validMacd, signalPeriod)

  // Map signal back to original indices
  const signal = []
  let validIdx = 0
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signal.push(null)
    } else {
      signal.push(signalEma[validIdx] || null)
      validIdx++
    }
  }

  const histogram = closes.map((_, i) => {
    if (macdLine[i] === null || signal[i] === null) return null
    return macdLine[i] - signal[i]
  })

  return { macd: macdLine, signal, histogram }
}

/**
 * Bollinger Bands
 * @param {number[]} closes - Array of closing prices
 * @param {number} period - SMA period (default 20)
 * @param {number} stdDevMultiplier - Standard deviation multiplier (default 2)
 * @returns {{ upper: (number|null)[], middle: (number|null)[], lower: (number|null)[] }}
 */
export function bollingerBands(closes, period = 20, stdDevMultiplier = 2) {
  const middle = sma(closes, period)
  const upper = []
  const lower = []

  for (let i = 0; i < closes.length; i++) {
    if (middle[i] === null) {
      upper.push(null)
      lower.push(null)
      continue
    }

    // Calculate standard deviation for the window
    let sumSqDiff = 0
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - middle[i]
      sumSqDiff += diff * diff
    }
    const stdDev = Math.sqrt(sumSqDiff / period)

    upper.push(middle[i] + stdDevMultiplier * stdDev)
    lower.push(middle[i] - stdDevMultiplier * stdDev)
  }

  return { upper, middle, lower }
}

/**
 * Volume Weighted Average Price (VWAP)
 * @param {Array<{high: number, low: number, close: number, volume: number}>} candles
 * @returns {(number|null)[]}
 */
export function vwap(candles) {
  const result = []
  let cumulativeVolumePrice = 0
  let cumulativeVolume = 0

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3
    cumulativeVolumePrice += typicalPrice * candle.volume
    cumulativeVolume += candle.volume
    result.push(cumulativeVolume > 0 ? cumulativeVolumePrice / cumulativeVolume : null)
  }

  return result
}

/**
 * Calculate all indicators for a set of candles.
 * Useful for preparing chart data with overlays.
 */
export function calculateAllIndicators(candles) {
  const closes = candles.map(c => c.close)

  const sma20 = sma(closes, 20)
  const sma50 = sma(closes, 50)
  const ema12 = ema(closes, 12)
  const ema26 = ema(closes, 26)
  const rsi14 = rsi(closes, 14)
  const macdResult = macd(closes)
  const bbands = bollingerBands(closes)
  const vwapResult = vwap(candles)

  return candles.map((candle, i) => ({
    ...candle,
    sma20: sma20[i],
    sma50: sma50[i],
    ema12: ema12[i],
    ema26: ema26[i],
    rsi: rsi14[i],
    macd: macdResult.macd[i],
    macdSignal: macdResult.signal[i],
    macdHistogram: macdResult.histogram[i],
    bbUpper: bbands.upper[i],
    bbMiddle: bbands.middle[i],
    bbLower: bbands.lower[i],
    vwap: vwapResult[i],
  }))
}
