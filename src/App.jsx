import { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, PieChart } from 'lucide-react'
import './App.css'

// Mock data for demonstration
const generateMockData = () => {
  const data = []
  let price = 50000
  for (let i = 0; i < 30; i++) {
    price += (Math.random() - 0.5) * 1000
    data.push({
      time: `${i}:00`,
      price: price.toFixed(2),
      volume: Math.floor(Math.random() * 1000000)
    })
  }
  return data
}

const mockPortfolio = [
  { symbol: 'PETR4', shares: 1000, avgPrice: 35.20, currentPrice: 36.50, change: 3.69 },
  { symbol: 'VALE3', shares: 500, avgPrice: 68.40, currentPrice: 70.20, change: 2.63 },
  { symbol: 'ITUB4', shares: 2000, avgPrice: 28.90, currentPrice: 28.50, change: -1.38 },
  { symbol: 'BBDC4', shares: 1500, avgPrice: 15.60, currentPrice: 16.10, change: 3.21 },
]

function App() {
  const [chartData, setChartData] = useState(generateMockData())
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSD')
  const [currentPrice, setCurrentPrice] = useState(50245.32)

  useEffect(() => {
    // Simulate real-time price updates
    const interval = setInterval(() => {
      setCurrentPrice(prev => prev + (Math.random() - 0.5) * 100)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const totalValue = mockPortfolio.reduce((sum, item) => 
    sum + (item.shares * item.currentPrice), 0
  )

  const totalPnL = mockPortfolio.reduce((sum, item) => 
    sum + (item.shares * (item.currentPrice - item.avgPrice)), 0
  )

  const pnlPercentage = ((totalPnL / (totalValue - totalPnL)) * 100).toFixed(2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Trading Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Total Portfolio</p>
                <p className="text-xl font-bold">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className={`px-3 py-2 rounded-lg ${totalPnL >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <div className="flex items-center gap-1">
                  {totalPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-semibold">{pnlPercentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Current Price</p>
                <p className="text-2xl font-bold">$ {currentPrice.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">24h Change</p>
                <p className="text-2xl font-bold text-green-400">+2.34%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">24h Volume</p>
                <p className="text-2xl font-bold">$2.4B</p>
              </div>
              <Activity className="w-10 h-10 text-purple-500" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Open Positions</p>
                <p className="text-2xl font-bold">{mockPortfolio.length}</p>
              </div>
              <PieChart className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Price Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Price Chart</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="price" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Volume Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Volume</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="volume" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold mb-4">Portfolio</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Symbol</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-semibold">Shares</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-semibold">Avg Price</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-semibold">Current Price</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-semibold">P&L</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-semibold">Change</th>
                </tr>
              </thead>
              <tbody>
                {mockPortfolio.map((item) => {
                  const pnl = item.shares * (item.currentPrice - item.avgPrice)
                  return (
                    <tr key={item.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="py-4 px-4 font-semibold">{item.symbol}</td>
                      <td className="py-4 px-4 text-right">{item.shares.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right">R$ {item.avgPrice.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right">R$ {item.currentPrice.toFixed(2)}</td>
                      <td className={`py-4 px-4 text-right font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        R$ {pnl.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${item.change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(item.change).toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900/50 backdrop-blur-sm mt-8">
        <div className="container mx-auto px-4 py-6 text-center text-slate-400">
          <p>© 2025 Gabriel Demetrios Lafis. Professional Trading Dashboard.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
