const express = require('express');
const { sql } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /cards
router.get('/', authMiddleware, async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, label, number, holder, expiry, color, card_type, frozen, created_at
      FROM cards WHERE user_id = ${req.user.userId}
      ORDER BY created_at ASC
    `;
    res.json({ cards: rows.map(c => ({ ...c, cardType: c.card_type })) });
  } catch (err) {
    console.error('Cards error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /cards
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { label, number, holder, expiry, color, cardType } = req.body;
    if (!label || !number || !holder || !expiry) {
      return res.status(400).json({ error: 'label, number, holder and expiry are required' });
    }

    const [card] = await sql`
      INSERT INTO cards (user_id, label, number, holder, expiry, color, card_type)
      VALUES (${req.user.userId}, ${label}, ${number}, ${holder}, ${expiry}, ${color || '#4F46E5'}, ${cardType || 'visa'})
      RETURNING id, label, number, holder, expiry, color, card_type, frozen, created_at
    `;

    res.status(201).json({ card: { ...card, cardType: card.card_type } });
  } catch (err) {
    console.error('Create card error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /cards/:id  — update frozen status or label
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { frozen, label, color } = req.body;
    const { id } = req.params;

    // Verify ownership
    const [existing] = await sql`SELECT id FROM cards WHERE id = ${id} AND user_id = ${req.user.userId}`;
    if (!existing) return res.status(404).json({ error: 'Card not found' });

    const [card] = await sql`
      UPDATE cards
      SET
        frozen    = COALESCE(${frozen ?? null}, frozen),
        label     = COALESCE(${label || null}, label),
        color     = COALESCE(${color || null}, color)
      WHERE id = ${id}
      RETURNING id, label, number, holder, expiry, color, card_type, frozen, created_at
    `;

    res.json({ card: { ...card, cardType: card.card_type } });
  } catch (err) {
    console.error('Update card error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /cards/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const [existing] = await sql`SELECT id FROM cards WHERE id = ${id} AND user_id = ${req.user.userId}`;
    if (!existing) return res.status(404).json({ error: 'Card not found' });

    // Must keep at least one card
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM cards WHERE user_id = ${req.user.userId}`;
    if (parseInt(count) <= 1) {
      return res.status(400).json({ error: 'Cannot delete your only card' });
    }

    await sql`DELETE FROM cards WHERE id = ${id}`;
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete card error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;