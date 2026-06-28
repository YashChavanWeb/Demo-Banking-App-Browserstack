const express = require('express');
const { sql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /transactions  — list all transactions for the user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [account] = await sql`SELECT id FROM accounts WHERE user_id = ${req.user.userId}`;
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const rows = await sql`
      SELECT id, merchant, category, amount, type, icon, note, reference_id, created_at
      FROM transactions
      WHERE account_id = ${account.id}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    const txs = rows.map(r => ({
      id: r.id,
      merchant: r.merchant,
      category: r.category,
      amount: parseFloat(r.amount),
      type: r.type,
      icon: r.icon,
      note: r.note || undefined,
      referenceId: r.reference_id,
      date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));

    res.json({ transactions: txs });
  } catch (err) {
    console.error('Transactions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /transactions/transfer  — send money to a recipient
router.post('/transfer', authMiddleware, async (req, res) => {
  try {
    const { recipientName, recipientId, amount, note } = req.body;
    if (!recipientName || !amount || amount <= 0) {
      return res.status(400).json({ error: 'recipientName and a positive amount are required' });
    }

    const [account] = await sql`SELECT id, balance FROM accounts WHERE user_id = ${req.user.userId}`;
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const balance = parseFloat(account.balance);
    if (balance < amount) {
      return res.status(400).json({ error: `Insufficient balance. Available: $${balance.toFixed(2)}` });
    }

    const referenceId = 'TXN' + Date.now();
    const newBalance = Math.round((balance - amount) * 100) / 100;

    // Deduct from sender
    await sql`UPDATE accounts SET balance = ${newBalance} WHERE id = ${account.id}`;

    // Record debit transaction for sender
    const [tx] = await sql`
      INSERT INTO transactions (account_id, merchant, category, amount, type, icon, note, reference_id)
      VALUES (
        ${account.id},
        ${recipientName},
        'Transfer',
        ${-amount},
        'debit',
        'swap-horizontal-outline',
        ${note || null},
        ${referenceId}
      )
      RETURNING id, merchant, category, amount, type, icon, note, reference_id, created_at
    `;

    // Credit recipient's account if recipientId provided
    if (recipientId) {
      const [recipientAccount] = await sql`SELECT id, balance FROM accounts WHERE user_id = ${recipientId}`;
      if (recipientAccount) {
        const [senderUser] = await sql`SELECT full_name FROM users WHERE id = ${req.user.userId}`;
        const senderName = senderUser ? senderUser.full_name : 'Someone';
        const recipientBalance = parseFloat(recipientAccount.balance);
        const newRecipientBalance = Math.round((recipientBalance + amount) * 100) / 100;
        await sql`UPDATE accounts SET balance = ${newRecipientBalance} WHERE id = ${recipientAccount.id}`;
        await sql`
          INSERT INTO transactions (account_id, merchant, category, amount, type, icon, note, reference_id)
          VALUES (
            ${recipientAccount.id},
            ${senderName},
            'Transfer Received',
            ${amount},
            'credit',
            'swap-horizontal-outline',
            ${note || null},
            ${'RCV' + Date.now()}
          )
        `;
      }
    }

    res.json({
      transaction: {
        id: tx.id,
        merchant: tx.merchant,
        category: tx.category,
        amount: parseFloat(tx.amount),
        type: tx.type,
        icon: tx.icon,
        note: tx.note || undefined,
        referenceId: tx.reference_id,
        date: new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      },
      newBalance,
    });
  } catch (err) {
    console.error('Transfer error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /transactions/payment  — record a Stripe card payment
router.post('/payment', authMiddleware, async (req, res) => {
  try {
    const { amount, description } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'A positive amount is required' });
    }

    const [account] = await sql`SELECT id, balance FROM accounts WHERE user_id = ${req.user.userId}`;
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const balance = parseFloat(account.balance);
    if (balance < amount) {
      return res.status(400).json({ error: `Insufficient balance. Available: $${balance.toFixed(2)}` });
    }

    const referenceId = 'TXN' + Date.now();
    const newBalance = Math.round((balance - amount) * 100) / 100;

    await sql`UPDATE accounts SET balance = ${newBalance} WHERE id = ${account.id}`;

    const [tx] = await sql`
      INSERT INTO transactions (account_id, merchant, category, amount, type, icon, note, reference_id)
      VALUES (
        ${account.id},
        ${description || 'Card Payment'},
        'Payment',
        ${-amount},
        'debit',
        'card-outline',
        ${description || null},
        ${referenceId}
      )
      RETURNING id, merchant, category, amount, type, icon, note, reference_id, created_at
    `;

    res.json({
      transaction: {
        id: tx.id,
        merchant: tx.merchant,
        category: tx.category,
        amount: parseFloat(tx.amount),
        type: tx.type,
        icon: tx.icon,
        note: tx.note || undefined,
        referenceId: tx.reference_id,
        date: new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      },
      newBalance,
    });
  } catch (err) {
    console.error('Payment record error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;