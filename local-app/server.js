const express = require('express');
const path = require('path');
const app = express();
const PORT = 5000;

const data = require('./backend.json');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// GET /api/market — overall market index snapshot
app.get('/api/market', (req, res) => res.json(data.market));

// GET /api/stocks — full stock list
app.get('/api/stocks', (req, res) => res.json(data.stocks));

// GET /api/stocks/:ticker — single stock
app.get('/api/stocks/:ticker', (req, res) => {
  const stock = data.stocks.find(s => s.ticker === req.params.ticker.toUpperCase());
  if (!stock) return res.status(404).json({ error: 'Not found' });
  res.json(stock);
});

// GET /api/watchlist — watchlist tickers with full data
app.get('/api/watchlist', (req, res) => {
  const list = data.watchlist.map(t => data.stocks.find(s => s.ticker === t)).filter(Boolean);
  res.json(list);
});

// GET /api/portfolio — portfolio summary + holdings with current prices
app.get('/api/portfolio', (req, res) => {
  const holdings = data.portfolio.holdings.map(h => {
    const stock = data.stocks.find(s => s.ticker === h.ticker);
    const currentPrice = stock ? stock.price : h.avgCost;
    const value = currentPrice * h.shares;
    const gain = (currentPrice - h.avgCost) * h.shares;
    const gainPct = ((currentPrice - h.avgCost) / h.avgCost) * 100;
    return { ...h, currentPrice, value, gain: parseFloat(gain.toFixed(2)), gainPct: parseFloat(gainPct.toFixed(2)), name: stock?.name ?? h.ticker };
  });
  res.json({ ...data.portfolio, holdings });
});

app.listen(PORT, () => console.log(`[local-app] Stocks server running at http://localhost:${PORT}`));
