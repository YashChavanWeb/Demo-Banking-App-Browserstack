const express = require('express');
const { sql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /shop/order — place an order (deduct balance, record transaction, save order)
router.post('/order', authMiddleware, async (req, res) => {
  try {
    const { items, total, description } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }
    if (!total || total <= 0) {
      return res.status(400).json({ error: 'A positive total is required' });
    }

    const [account] = await sql`SELECT id, balance FROM accounts WHERE user_id = ${req.user.userId}`;
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const balance = parseFloat(account.balance);
    if (balance < total) {
      return res.status(400).json({ error: `Insufficient balance. Available: $${balance.toFixed(2)}` });
    }

    const referenceId = 'ORD' + Date.now();
    const newBalance = Math.round((balance - total) * 100) / 100;

    await sql`UPDATE accounts SET balance = ${newBalance} WHERE id = ${account.id}`;

    const itemNames = items.map(i => i.name).join(', ');
    const note = description || `Shop order: ${itemNames}`;

    const [tx] = await sql`
      INSERT INTO transactions (account_id, merchant, category, amount, type, icon, note, reference_id)
      VALUES (
        ${account.id},
        ${'Shop Purchase'},
        ${'Shopping'},
        ${-total},
        ${'debit'},
        ${'bag-outline'},
        ${note},
        ${referenceId}
      )
      RETURNING id, merchant, category, amount, type, icon, note, reference_id, created_at
    `;

    const [order] = await sql`
      INSERT INTO orders (user_id, account_id, items, total, status, reference_id)
      VALUES (
        ${req.user.userId},
        ${account.id},
        ${JSON.stringify(items)},
        ${total},
        ${'paid'},
        ${referenceId}
      )
      RETURNING id, items, total, status, reference_id, created_at
    `;

    res.json({
      order: {
        id: order.id,
        items: order.items,
        total: parseFloat(order.total),
        status: order.status,
        referenceId: order.reference_id,
        date: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      },
      transaction: {
        id: tx.id,
        merchant: tx.merchant,
        category: tx.category,
        amount: parseFloat(tx.amount),
        referenceId: tx.reference_id,
        date: new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      },
      newBalance,
    });
  } catch (err) {
    console.error('Shop order error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /shop/orders — list orders for the authenticated user
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, items, total, status, reference_id, created_at
      FROM orders
      WHERE user_id = ${req.user.userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const orders = rows.map(r => ({
      id: r.id,
      items: r.items,
      total: parseFloat(r.total),
      status: r.status,
      referenceId: r.reference_id,
      date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
    res.json({ orders });
  } catch (err) {
    console.error('Shop orders error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;