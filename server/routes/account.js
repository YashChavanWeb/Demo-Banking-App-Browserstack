const express = require('express');
const { sql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /account/profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [user] = await sql`
      SELECT id, full_name, email, role, kyc_status, created_at
      FROM users WHERE id = ${req.user.userId}
    `;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [account] = await sql`
      SELECT id, balance, currency FROM accounts WHERE user_id = ${req.user.userId}
    `;

    res.json({
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
      kycStatus: user.kyc_status,
      memberSince: user.created_at,
      account: account || null,
    });
  } catch (err) {
    console.error('Profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /account/balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const [account] = await sql`
      SELECT balance, currency FROM accounts WHERE user_id = ${req.user.userId}
    `;
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const balance = parseFloat(account.balance);
    res.json({
      balance,
      savings: Math.round(balance * 0.73 * 100) / 100,
      checking: Math.round(balance * 0.27 * 100) / 100,
      currency: account.currency,
    });
  } catch (err) {
    console.error('Balance error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /account/kyc  — mark KYC as verified
router.patch('/kyc', authMiddleware, async (req, res) => {
  try {
    await sql`UPDATE users SET kyc_status = 'verified' WHERE id = ${req.user.userId}`;
    res.json({ kycStatus: 'verified' });
  } catch (err) {
    console.error('KYC error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;