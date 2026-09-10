import test from "node:test";
import assert from "node:assert/strict";
import {
  sma,
  ema,
  rsi,
  macd,
  vwap,
} from "../src/services/technicalIndicators.js";
import { generateHistoricalData } from "../src/services/marketData.js";
test("Wilder smoothing preserves gain and loss magnitudes", () => {
  const values = rsi([10, 12, 11, 14, 12], 2);
  assert.equal(values[2], 100 - 100 / 3);
  assert.ok(Math.abs(values[3] - 88.8888888889) < 1e-8);
  assert.ok(Math.abs(values[4] - 47.0588235294) < 1e-8);
  const scaled = rsi([100, 120, 110, 140, 120], 2);
  values.forEach((value, i) =>
    value === null
      ? assert.equal(scaled[i], null)
      : assert.ok(Math.abs(value - scaled[i]) < 1e-10),
  );
});
test("flat RSI is neutral and zero MACD signal is retained", () => {
  assert.equal(rsi(Array(40).fill(10))[39], 50);
  const result = macd(Array(40).fill(10));
  assert.equal(result.signal[39], 0);
  assert.equal(result.histogram[39], 0);
});
test("known averages and insufficient data", () => {
  assert.deepEqual(sma([1, 2, 3, 4], 3), [null, null, 2, 3]);
  assert.deepEqual(ema([1, 2, 3, 4], 3), [null, null, 2, 3]);
  assert.deepEqual(vwap([{ high: 3, low: 1, close: 2, volume: 0 }]), [null]);
});
test("invalid indicator inputs fail explicitly", () => {
  for (const period of [0, -1, 1.5]) assert.throws(() => sma([1, 2], period));
  assert.throws(() => ema([1, NaN], 2));
  assert.throws(() => vwap([{ high: 3, low: 1, close: 2, volume: -1 }]));
});
test("synthetic candles reproduce exactly and obey OHLC invariants", () => {
  const first = generateHistoricalData("AAPL", 100, "1h");
  assert.deepEqual(first, generateHistoricalData("AAPL", 100, "1h"));
  assert.notDeepEqual(
    first,
    generateHistoricalData("AAPL", 100, "1h", { seed: 43 }),
  );
  for (const candle of first) {
    assert.ok(candle.low <= candle.close && candle.high >= candle.close);
    assert.ok(candle.volume > 0);
  }
});
