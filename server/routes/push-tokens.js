const express = require('express');
const { sql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /push-tokens — register or update device push token
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { token, platform = 'unknown' } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });

    await sql`
      INSERT INTO push_tokens (user_id, token, platform, updated_at)
      VALUES (${req.user.userId}, ${token}, ${platform}, NOW())
      ON CONFLICT (user_id)
      DO UPDATE SET token = EXCLUDED.token, platform = EXCLUDED.platform, updated_at = NOW()
    `;
    res.json({ ok: true });
  } catch (err) {
    console.error('Push token error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;