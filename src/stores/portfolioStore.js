import { create } from "zustand";
import { generateId } from "../lib/utils.js";

const INITIAL_HOLDINGS = [
  { symbol: "AAPL", shares: 150, avgPrice: 172.3 },
  { symbol: "MSFT", shares: 80, avgPrice: 388.5 },
  { symbol: "GOOGL", shares: 120, avgPrice: 162.4 },
  { symbol: "AMZN", shares: 60, avgPrice: 178.9 },
  { symbol: "NVDA", shares: 45, avgPrice: 720.8 },
  { symbol: "TSLA", shares: 35, avgPrice: 220.1 },
  { symbol: "META", shares: 50, avgPrice: 480.6 },
  { symbol: "BTC", shares: 2.5, avgPrice: 52340.0 },
];

const usePortfolioStore = create((set, get) => ({
  // Portfolio holdings
  holdings: INITIAL_HOLDINGS.map((h) => ({
    ...h,
    id: generateId(),
    currentPrice: h.avgPrice,
    value: h.shares * h.avgPrice,
    pnl: 0,
    pnlPercent: 0,
    allocation: 0,
  })),

  // Portfolio summary
  totalValue: 0,
  totalCost: 0,
  totalPnl: 0,
  totalPnlPercent: 0,
  cashBalance: 50000,

  // Transaction history
  transactions: [],

  // Performance history for chart
  performanceHistory: [],

  // Initialize portfolio with current prices
  initializePortfolio: (tickers) => {
    const state = get();
    const holdings = state.holdings.map((h) => {
      const ticker = tickers[h.symbol];
      const currentPrice =
        ticker && Number.isFinite(ticker.price) && ticker.price > 0
          ? ticker.price
          : h.avgPrice;
      const value = h.shares * currentPrice;
      const cost = h.shares * h.avgPrice;
      const pnl = value - cost;
      const pnlPercent = (pnl / cost) * 100;

      return { ...h, currentPrice, value, pnl, pnlPercent };
    });

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalCost = holdings.reduce(
      (sum, h) => sum + h.shares * h.avgPrice,
      0,
    );

    // Calculate allocations
    const totalPortfolioValue = totalValue + state.cashBalance;
    const holdingsWithAllocation = holdings.map((h) => ({
      ...h,
      allocation: (h.value / totalPortfolioValue) * 100,
    }));

    // Generate performance history
    const performanceHistory = generatePerformanceHistory(totalValue);

    set({
      holdings: holdingsWithAllocation,
      totalValue,
      totalCost,
      totalPnl: totalValue - totalCost,
      totalPnlPercent: ((totalValue - totalCost) / totalCost) * 100,
      performanceHistory,
    });
  },

  // Update prices from tickers
  updatePrices: (tickers) => {
    const state = get();
    const holdings = state.holdings.map((h) => {
      const ticker = tickers[h.symbol];
      const currentPrice =
        ticker && Number.isFinite(ticker.price) && ticker.price > 0
          ? ticker.price
          : h.currentPrice;
      const value = h.shares * currentPrice;
      const cost = h.shares * h.avgPrice;
      const pnl = value - cost;
      const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

      return { ...h, currentPrice, value, pnl, pnlPercent };
    });

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalCost = holdings.reduce(
      (sum, h) => sum + h.shares * h.avgPrice,
      0,
    );
    const totalPortfolioValue = totalValue + state.cashBalance;

    const holdingsWithAllocation = holdings.map((h) => ({
      ...h,
      allocation:
        totalPortfolioValue > 0 ? (h.value / totalPortfolioValue) * 100 : 0,
    }));

    set({
      holdings: holdingsWithAllocation,
      totalValue,
      totalCost,
      totalPnl: totalValue - totalCost,
      totalPnlPercent:
        totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    });
  },

  // Execute a buy order
  executeBuy: (symbol, shares, price) => {
    if (
      typeof symbol !== "string" ||
      !/^[A-Z0-9.-]{1,12}$/.test(symbol) ||
      !Number.isFinite(shares) ||
      !Number.isFinite(price) ||
      shares <= 0 ||
      price <= 0 ||
      !Number.isFinite(shares * price)
    )
      return false;
    const state = get();
    const cost = shares * price;

    if (cost > state.cashBalance) return false;

    const existingIdx = state.holdings.findIndex((h) => h.symbol === symbol);
    let newHoldings;

    if (existingIdx >= 0) {
      newHoldings = [...state.holdings];
      const existing = newHoldings[existingIdx];
      const totalShares = existing.shares + shares;
      const totalCost = existing.shares * existing.avgPrice + cost;
      newHoldings[existingIdx] = {
        ...existing,
        shares: totalShares,
        avgPrice: totalCost / totalShares,
        currentPrice: price,
        value: totalShares * price,
      };
    } else {
      newHoldings = [
        ...state.holdings,
        {
          id: generateId(),
          symbol,
          shares,
          avgPrice: price,
          currentPrice: price,
          value: shares * price,
          pnl: 0,
          pnlPercent: 0,
          allocation: 0,
        },
      ];
    }

    const transaction = {
      id: generateId(),
      type: "BUY",
      symbol,
      shares,
      price,
      total: cost,
      timestamp: Date.now(),
      status: "FILLED",
    };

    set({
      holdings: newHoldings,
      cashBalance: state.cashBalance - cost,
      transactions: [transaction, ...state.transactions],
    });

    get().updatePrices({});
    return true;
  },

  // Execute a sell order
  executeSell: (symbol, shares, price) => {
    if (
      typeof symbol !== "string" ||
      !/^[A-Z0-9.-]{1,12}$/.test(symbol) ||
      !Number.isFinite(shares) ||
      !Number.isFinite(price) ||
      shares <= 0 ||
      price <= 0 ||
      !Number.isFinite(shares * price)
    )
      return false;
    const state = get();
    const existingIdx = state.holdings.findIndex((h) => h.symbol === symbol);

    if (existingIdx < 0) return false;
    const existing = state.holdings[existingIdx];
    if (existing.shares < shares) return false;

    const proceeds = shares * price;
    let newHoldings = [...state.holdings];

    if (existing.shares === shares) {
      newHoldings.splice(existingIdx, 1);
    } else {
      newHoldings[existingIdx] = {
        ...existing,
        shares: existing.shares - shares,
        currentPrice: price,
        value: (existing.shares - shares) * price,
      };
    }

    const transaction = {
      id: generateId(),
      type: "SELL",
      symbol,
      shares,
      price,
      total: proceeds,
      timestamp: Date.now(),
      status: "FILLED",
    };

    set({
      holdings: newHoldings,
      cashBalance: state.cashBalance + proceeds,
      transactions: [transaction, ...state.transactions],
    });

    get().updatePrices({});
    return true;
  },
}));

function generatePerformanceHistory(currentValue) {
  const history = [];
  const days = 30;
  let value = currentValue * 0.92;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const change = (Math.random() - 0.48) * currentValue * 0.015;
    value += change;
    value = Math.max(value, currentValue * 0.8);
    history.push({
      date: date.toISOString().split("T")[0],
      value: i === 0 ? currentValue : value,
    });
  }

  return history;
}

export default usePortfolioStore;
