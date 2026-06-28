const express = require('express');
const { sql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /users — list all users except the current user (for transfer recipient selection)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, full_name, email
      FROM users
      WHERE id != ${req.user.userId}
      ORDER BY full_name ASC
    `;
    res.json({
      users: rows.map(u => ({
        id: u.id,
        name: u.full_name,
        email: u.email,
        avatar: u.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        account: '****' + u.id.slice(-4),
      })),
    });
  } catch (err) {
    console.error('Users error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;