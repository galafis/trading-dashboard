import test from "node:test";
import assert from "node:assert/strict";
import portfolio from "../src/stores/portfolioStore.js";
import orders from "../src/stores/orderStore.js";
test("invalid quantities cannot create cash or holdings", () => {
  const before = portfolio.getState().cashBalance;
  for (const qty of [-1, 0, NaN, Infinity]) {
    assert.equal(portfolio.getState().executeBuy("AAPL", qty, 10), false);
    assert.equal(portfolio.getState().executeSell("AAPL", qty, 10), false);
  }
  assert.equal(portfolio.getState().cashBalance, before);
});
test("trade summaries update immediately and cash is conserved", () => {
  portfolio.getState().initializePortfolio({});
  const before = portfolio.getState().cashBalance;
  const total = portfolio.getState().totalValue;
  assert.equal(portfolio.getState().executeBuy("DEMO", 2, 100), true);
  assert.equal(portfolio.getState().cashBalance, before - 200);
  assert.equal(portfolio.getState().totalValue, total + 200);
  assert.equal(portfolio.getState().executeSell("DEMO", 2, 100), true);
  assert.equal(portfolio.getState().cashBalance, before);
});
test("stop-limit trigger survives until the limit price is available", () => {
  orders.setState({ openOrders: [], orderHistory: [] });
  const order = orders
    .getState()
    .createOrder({
      symbol: "DEMO",
      side: "BUY",
      type: "STOP_LIMIT",
      quantity: 2,
      stopPrice: 100,
      price: 99,
    });
  order.price = 1000;
  assert.deepEqual(orders.getState().checkOrderFills("DEMO", 101), []);
  assert.equal(orders.getState().openOrders[0].triggered, true);
  const fills = orders.getState().checkOrderFills("DEMO", 98);
  assert.equal(fills.length, 1);
  assert.equal(fills[0].filledPrice, 98);
});
test("invalid order and invalid fill price are rejected", () => {
  assert.throws(() =>
    orders
      .getState()
      .createOrder({
        symbol: "X",
        side: "BUY",
        type: "LIMIT",
        quantity: -1,
        price: 10,
      }),
  );
  assert.throws(() => orders.getState().checkOrderFills("X", NaN));
});
