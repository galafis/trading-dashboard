import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { generateHistoricalData, getSymbols } from "./services/marketData.js";
import { calculateAllIndicators } from "./services/technicalIndicators.js";
import usePortfolioStore from "./stores/portfolioStore.js";
import "./workspace.css";

const symbols = getSymbols();
export default function App() {
  const [lang, setLang] = useState("en"),
    [symbol, setSymbol] = useState("AAPL"),
    [quantity, setQuantity] = useState("1"),
    [message, setMessage] = useState("");
  const tr = (en, pt) => (lang === "en" ? en : pt);
  const series = useMemo(
    () => calculateAllIndicators(generateHistoricalData(symbol, 120, "1h")),
    [symbol],
  );
  const latest = series.at(-1);
  const portfolio = usePortfolioStore();
  const money = (value) =>
    new Intl.NumberFormat(lang === "en" ? "en-US" : "pt-BR", {
      style: "currency",
      currency: "USD",
    }).format(value);
  useEffect(() => {
    document.documentElement.lang = lang === "en" ? "en" : "pt-BR";
  }, [lang]);
  useEffect(() => {
    usePortfolioStore
      .getState()
      .initializePortfolio(
        Object.fromEntries(
          symbols.map((item) => [
            item.symbol,
            {
              price: generateHistoricalData(item.symbol, 120, "1h").at(-1)
                .close,
            },
          ]),
        ),
      );
  }, []);
  function trade(side) {
    const price = Math.round(latest.close * 100) / 100;
    const ok =
      side === "BUY"
        ? portfolio.executeBuy(symbol, Number(quantity), price)
        : portfolio.executeSell(symbol, Number(quantity), price);
    setMessage(ok ? "filled" : "invalid");
  }
  return (
    <main className="workspace">
      <header className="top">
        <div>
          <span className="eyebrow">
            MARKET WORKSPACE · GABRIEL DEMETRIOS LAFIS
          </span>
          <h1>
            {tr(
              "Explore the market mechanics.",
              "Explore a dinâmica do mercado.",
            )}
          </h1>
          <p>
            {tr(
              "Reproducible charts, technical indicators and a paper portfolio.",
              "Gráficos reproduzíveis, indicadores técnicos e carteira simulada.",
            )}
          </p>
        </div>
        <button onClick={() => setLang(lang === "en" ? "pt" : "en")}>
          {lang === "en" ? "Português" : "English"}
        </button>
      </header>
      <div className="notice">
        {tr(
          "SIMULATION · Seed 42 · Synthetic data through 1 Jan 2026 · No live quotes or brokerage connection",
          "SIMULAÇÃO · Semente 42 · Dados fictícios até 1 jan. 2026 · Sem cotações ao vivo ou conexão com corretora",
        )}
      </div>
      <section className="stats">
        <article>
          <span>{tr("Cash available", "Saldo disponível")}</span>
          <strong>{money(portfolio.cashBalance)}</strong>
        </article>
        <article>
          <span>{tr("Holdings value", "Valor das posições")}</span>
          <strong>{money(portfolio.totalValue)}</strong>
        </article>
        <article>
          <span>{tr("Unrealized result", "Resultado não realizado")}</span>
          <strong>{money(portfolio.totalPnl)}</strong>
        </article>
      </section>
      <div className="layout">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>
                {symbol}{" "}
                <small>{symbols.find((s) => s.symbol === symbol).name}</small>
              </h2>
              <strong className="price">{money(latest.close)}</strong>
            </div>
            <label>
              {tr("Instrument", "Ativo")}
              <select
                value={symbol}
                onChange={(event) => {
                  setSymbol(event.target.value);
                  setMessage("");
                }}
              >
                {symbols.map((item) => (
                  <option key={item.symbol}>{item.symbol}</option>
                ))}
              </select>
            </label>
          </div>
          <p>
            {tr(
              "Close price and 20-period average · hourly bars · UTC",
              "Fechamento e média de 20 períodos · barras horárias · UTC",
            )}
          </p>
          <div
            className="chart"
            role="img"
            aria-label={tr(
              "Synthetic close price and moving average chart",
              "Gráfico de fechamento e média móvel com dados fictícios",
            )}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="#26364b" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(value) =>
                    new Date(value).toISOString().slice(5, 16).replace("T", " ")
                  }
                  minTickGap={50}
                  stroke="#b0bfd3"
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tickFormatter={(value) => value.toFixed(0)}
                  width={65}
                  stroke="#b0bfd3"
                />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toISOString()}
                  formatter={(value) => money(value)}
                  contentStyle={{
                    background: "#132236",
                    border: "1px solid #567",
                  }}
                />
                <Line
                  name={tr("Close", "Fechamento")}
                  type="monotone"
                  dataKey="close"
                  stroke="#5adbc6"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  name="SMA 20"
                  dataKey="sma20"
                  stroke="#e8b764"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="indicator-row">
            <span>
              RSI 14 <strong>{latest.rsi.toFixed(2)}</strong>
            </span>
            <span>
              MACD <strong>{latest.macd.toFixed(2)}</strong>
            </span>
            <span>
              VWAP <strong>{money(latest.vwap)}</strong>
            </span>
          </div>
        </section>
        <section className="panel">
          <h2>{tr("Paper order", "Ordem simulada")}</h2>
          <p>
            {tr(
              "Immediate fill at the displayed synthetic close, rounded to cents. No fees or slippage.",
              "Execução imediata no fechamento fictício exibido, arredondado em centavos. Sem taxas ou deslizamento.",
            )}
          </p>
          <label>
            {tr("Quantity", "Quantidade")}
            <input
              type="number"
              min="0.0001"
              step="any"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
          <p>
            {tr("Estimated value", "Valor estimado")}:{" "}
            {money(
              Number(quantity) > 0
                ? (Number(quantity) * Math.round(latest.close * 100)) / 100
                : 0,
            )}
          </p>
          <div className="actions">
            <button className="buy" onClick={() => trade("BUY")}>
              {tr("Buy", "Comprar")}
            </button>
            <button onClick={() => trade("SELL")}>
              {tr("Sell", "Vender")}
            </button>
          </div>
          <p role="status" aria-live="polite">
            {message === "filled"
              ? tr("Paper order filled.", "Ordem simulada executada.")
              : message === "invalid"
                ? tr(
                    "Check quantity, cash or available holdings.",
                    "Verifique quantidade, saldo ou posição disponível.",
                  )
                : ""}
          </p>
          <p className="muted">
            {tr(
              "Session memory only. Reload resets the portfolio. Synthetic history is not an investment return.",
              "Memória da sessão. Recarregar reinicia a carteira. Histórico fictício não representa retorno de investimento.",
            )}
          </p>
        </section>
      </div>
      <section className="panel">
        <h2>{tr("Portfolio positions", "Posições da carteira")}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {[
                  tr("Symbol", "Ativo"),
                  tr("Quantity", "Quantidade"),
                  tr("Average cost", "Custo médio"),
                  tr("Market value", "Valor de mercado"),
                  tr("Result", "Resultado"),
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((holding) => (
                <tr key={holding.id}>
                  <td>{holding.symbol}</td>
                  <td>{holding.shares}</td>
                  <td>{money(holding.avgPrice)}</td>
                  <td>{money(holding.value)}</td>
                  <td>{money(holding.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>{tr("Session transactions", "Transações da sessão")}</h2>
        {portfolio.transactions.length === 0 ? (
          <p>
            {tr(
              "Your simulated orders appear here.",
              "Suas ordens simuladas aparecem aqui.",
            )}
          </p>
        ) : (
          <ul>
            {portfolio.transactions.map((tx) => (
              <li key={tx.id}>
                {tx.type === "BUY" ? tr("Buy", "Compra") : tr("Sell", "Venda")}{" "}
                · {tx.symbol} · {tx.shares} × {money(tx.price)} ={" "}
                {money(tx.total)}
              </li>
            ))}
          </ul>
        )}
      </section>
      <footer>
        <a href="https://github.com/galafis/trading-dashboard">
          {tr(
            "Source, examples and validation",
            "Código, exemplos e validação",
          )}{" "}
          · GitHub
        </a>
      </footer>
    </main>
  );
}
