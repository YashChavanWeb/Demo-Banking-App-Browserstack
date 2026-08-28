const express = require('express');
const { sql } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
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
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

const PROTECTED_EMAILS = ['yash@gmail.com'];

// DELETE /account  — permanently delete the authenticated user's account and all data
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Fetch the user's email to check if it's protected
    const [userRow] = await sql`SELECT email FROM users WHERE id = ${userId}`;
    if (userRow && PROTECTED_EMAILS.includes(userRow.email.toLowerCase())) {
      return res.status(403).json({ error: 'This account cannot be deleted.' });
    }
    // Delete in dependency order: transactions → accounts → cards → orders → otps → push_tokens → user
    const [account] = await sql`SELECT id FROM accounts WHERE user_id = ${userId}`;
    if (account) {
      await sql`DELETE FROM transactions WHERE account_id = ${account.id}`;
    }
    await sql`DELETE FROM accounts WHERE user_id = ${userId}`;
    await sql`DELETE FROM cards WHERE user_id = ${userId}`;
    await sql`DELETE FROM orders WHERE user_id = ${userId}`;
    await sql`DELETE FROM otps WHERE email = (SELECT email FROM users WHERE id = ${userId})`;
    // Delete Cloudinary profile image if present
    const [profileRow] = await sql`SELECT avatar_url FROM users WHERE id = ${userId}`;
    if (profileRow?.avatar_url) {
      try {
        // Extract public_id from the Cloudinary URL (path after /upload/ without extension)
        const match = profileRow.avatar_url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
        if (match?.[1]) {
          await cloudinary.uploader.destroy(match[1]);
        }
      } catch (e) {
        console.warn('Cloudinary delete failed (non-fatal):', e?.message);
      }
    }
    await sql`DELETE FROM push_tokens WHERE user_id = ${userId}`;
    await sql`DELETE FROM users WHERE id = ${userId}`;
    res.json({ deleted: true });
  } catch (err) {
    console.error('Delete account error:', err.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// PATCH /account/kyc  — mark KYC as verified
router.patch('/kyc', authMiddleware, async (req, res) => {
  try {
    await sql`UPDATE users SET kyc_status = 'verified' WHERE id = ${req.user.userId}`;
    res.json({ kycStatus: 'verified' });
  } catch (err) {
    console.error('KYC error:', err.message);
    res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
  }
});

module.exports = router;