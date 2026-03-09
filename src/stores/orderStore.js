import { create } from 'zustand'
import { generateId } from '../lib/utils'

const useOrderStore = create((set, get) => ({
  // Open orders awaiting execution
  openOrders: [],

  // Order history (filled, cancelled)
  orderHistory: [],

  // Create a new order
  createOrder: ({ symbol, side, type, quantity, price, stopPrice }) => {
    const order = {
      id: generateId(),
      symbol,
      side,         // 'BUY' or 'SELL'
      type,         // 'MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'
      quantity,
      price: type === 'MARKET' ? null : price,
      stopPrice: type === 'STOP' || type === 'STOP_LIMIT' ? stopPrice : null,
      status: 'PENDING',
      filledQuantity: 0,
      filledPrice: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    if (type === 'MARKET') {
      // Market orders fill immediately at simulation price
      return order // Return for immediate execution by caller
    }

    set((state) => ({
      openOrders: [order, ...state.openOrders],
    }))

    return order
  },

  // Try to fill open orders based on current price
  checkOrderFills: (symbol, currentPrice) => {
    const state = get()
    const filledOrders = []
    const remainingOrders = []

    for (const order of state.openOrders) {
      if (order.symbol !== symbol) {
        remainingOrders.push(order)
        continue
      }

      let shouldFill = false

      if (order.type === 'LIMIT') {
        if (order.side === 'BUY' && currentPrice <= order.price) shouldFill = true
        if (order.side === 'SELL' && currentPrice >= order.price) shouldFill = true
      } else if (order.type === 'STOP') {
        if (order.side === 'BUY' && currentPrice >= order.stopPrice) shouldFill = true
        if (order.side === 'SELL' && currentPrice <= order.stopPrice) shouldFill = true
      } else if (order.type === 'STOP_LIMIT') {
        if (order.side === 'BUY' && currentPrice >= order.stopPrice && currentPrice <= order.price) shouldFill = true
        if (order.side === 'SELL' && currentPrice <= order.stopPrice && currentPrice >= order.price) shouldFill = true
      }

      if (shouldFill) {
        filledOrders.push({
          ...order,
          status: 'FILLED',
          filledQuantity: order.quantity,
          filledPrice: currentPrice,
          updatedAt: Date.now(),
        })
      } else {
        remainingOrders.push(order)
      }
    }

    if (filledOrders.length > 0) {
      set({
        openOrders: remainingOrders,
        orderHistory: [...filledOrders, ...state.orderHistory],
      })
    }

    return filledOrders
  },

  // Cancel an open order
  cancelOrder: (orderId) => {
    set((state) => {
      const order = state.openOrders.find(o => o.id === orderId)
      if (!order) return state

      return {
        openOrders: state.openOrders.filter(o => o.id !== orderId),
        orderHistory: [
          { ...order, status: 'CANCELLED', updatedAt: Date.now() },
          ...state.orderHistory,
        ],
      }
    })
  },

  // Cancel all orders for a symbol
  cancelAllOrders: (symbol) => {
    set((state) => {
      const toCancel = state.openOrders.filter(o => !symbol || o.symbol === symbol)
      const remaining = state.openOrders.filter(o => symbol && o.symbol !== symbol)
      const cancelled = toCancel.map(o => ({ ...o, status: 'CANCELLED', updatedAt: Date.now() }))

      return {
        openOrders: remaining,
        orderHistory: [...cancelled, ...state.orderHistory],
      }
    })
  },

  // Get all orders for a symbol (open + history)
  getOrdersBySymbol: (symbol) => {
    const state = get()
    const open = state.openOrders.filter(o => o.symbol === symbol)
    const history = state.orderHistory.filter(o => o.symbol === symbol)
    return { open, history }
  },

  // Seed some sample order history
  seedSampleOrders: () => {
    const sampleHistory = [
      { id: generateId(), symbol: 'AAPL', side: 'BUY', type: 'MARKET', quantity: 50, price: null, filledPrice: 185.20, filledQuantity: 50, status: 'FILLED', createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 3 },
      { id: generateId(), symbol: 'MSFT', side: 'BUY', type: 'LIMIT', quantity: 30, price: 410.00, filledPrice: 409.80, filledQuantity: 30, status: 'FILLED', createdAt: Date.now() - 86400000 * 2, updatedAt: Date.now() - 86400000 * 2 },
      { id: generateId(), symbol: 'GOOGL', side: 'SELL', type: 'MARKET', quantity: 20, price: null, filledPrice: 178.40, filledQuantity: 20, status: 'FILLED', createdAt: Date.now() - 86400000, updatedAt: Date.now() - 86400000 },
      { id: generateId(), symbol: 'TSLA', side: 'BUY', type: 'LIMIT', quantity: 15, price: 235.00, filledPrice: null, filledQuantity: 0, status: 'CANCELLED', createdAt: Date.now() - 86400000 * 5, updatedAt: Date.now() - 86400000 * 4 },
      { id: generateId(), symbol: 'NVDA', side: 'BUY', type: 'MARKET', quantity: 10, price: null, filledPrice: 850.60, filledQuantity: 10, status: 'FILLED', createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 7 },
    ]

    set({ orderHistory: sampleHistory })
  },
}))

export default useOrderStore
