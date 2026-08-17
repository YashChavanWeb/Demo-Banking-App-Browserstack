const express = require('express');
const { sql } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');

// Initialise Firebase Admin once (idempotent)
if (!admin.getApps().length) {
  const serviceAccount = require('../../yash-demo-banking-app-firebase-adminsdk-fbsvc-a1594354a1.json');
  admin.initializeApp({ credential: admin.cert(serviceAccount) });
}

const router = express.Router();

// ── Rate-limit helpers ────────────────────────────────────────────────────────
// 5 messages per sender per hour (across all recipients)
// 3 distinct recipients per sender per hour
async function checkRateLimits(senderId) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const [{ count: msgCount }] = await sql`
    SELECT COUNT(*)::int AS count FROM messages
    WHERE sender_id = ${senderId} AND created_at >= ${since}
  `;
  if (msgCount >= 5) {
    return { allowed: false, reason: 'You can only send 5 messages per hour.' };
  }

  const [{ count: recipientCount }] = await sql`
    SELECT COUNT(DISTINCT recipient_id)::int AS count FROM messages
    WHERE sender_id = ${senderId} AND created_at >= ${since}
  `;
  if (recipientCount >= 3) {
    return { allowed: false, reason: 'You can only message 3 different recipients per hour.' };
  }

  return { allowed: true };
}

// ── Send a message ────────────────────────────────────────────────────────────
// POST /messages
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { recipientId, body } = req.body;
    const senderId = req.user.userId;

    if (!recipientId || !body) {
      return res.status(400).json({ error: 'recipientId and body are required' });
    }
    if (recipientId === senderId) {
      return res.status(400).json({ error: 'You cannot message yourself' });
    }
    if (body.length > 100) {
      return res.status(400).json({ error: 'Message cannot exceed 100 characters' });
    }

    const limit = await checkRateLimits(senderId);
    if (!limit.allowed) {
      return res.status(429).json({ error: limit.reason });
    }

    // Verify recipient exists
    const [recipient] = await sql`
      SELECT id, full_name FROM users WHERE id = ${recipientId}
    `;
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const [message] = await sql`
      INSERT INTO messages (sender_id, recipient_id, body)
      VALUES (${senderId}, ${recipientId}, ${body})
      RETURNING id, sender_id, recipient_id, body, read, created_at
    `;

    // Fire-and-forget push notification to recipient
    sendPushToUser(recipientId, req.user.email, body).catch(() => {});

    res.json({ message });
  } catch (err) {
    console.error('Send message error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Get conversation with a specific user ─────────────────────────────────────
// GET /messages/conversation/:userId
router.get('/conversation/:userId', authMiddleware, async (req, res) => {
  try {
    const me = req.user.userId;
    const other = req.params.userId;

    const rows = await sql`
      SELECT m.id, m.sender_id, m.recipient_id, m.body, m.read, m.created_at,
             s.full_name AS sender_name
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      WHERE (m.sender_id = ${me} AND m.recipient_id = ${other})
         OR (m.sender_id = ${other} AND m.recipient_id = ${me})
      ORDER BY m.created_at ASC
    `;

    // Mark messages from other user as read
    await sql`
      UPDATE messages SET read = TRUE
      WHERE sender_id = ${other} AND recipient_id = ${me} AND read = FALSE
    `;

    res.json({ messages: rows });
  } catch (err) {
    console.error('Conversation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Get inbox — list of recent conversations ──────────────────────────────────
// GET /messages/inbox
router.get('/inbox', authMiddleware, async (req, res) => {
  try {
    const me = req.user.userId;

    // Latest message per conversation partner
    const rows = await sql`
      SELECT DISTINCT ON (partner_id)
        partner_id,
        partner_name,
        body,
        created_at,
        sender_id,
        unread_count
      FROM (
        SELECT
          CASE WHEN m.sender_id = ${me} THEN m.recipient_id ELSE m.sender_id END AS partner_id,
          CASE WHEN m.sender_id = ${me} THEN r.full_name ELSE s.full_name END AS partner_name,
          m.body,
          m.created_at,
          m.sender_id,
          (SELECT COUNT(*) FROM messages sub
           WHERE sub.sender_id != ${me}
             AND sub.recipient_id = ${me}
             AND sub.sender_id = CASE WHEN m.sender_id = ${me} THEN m.recipient_id ELSE m.sender_id END
             AND sub.read = FALSE) AS unread_count
        FROM messages m
        JOIN users s ON s.id = m.sender_id
        JOIN users r ON r.id = m.recipient_id
        WHERE m.sender_id = ${me} OR m.recipient_id = ${me}
      ) sub
      ORDER BY partner_id, created_at DESC
    `;

    res.json({ conversations: rows });
  } catch (err) {
    console.error('Inbox error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Unread count ──────────────────────────────────────────────────────────────
// GET /messages/unread-count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM messages
      WHERE recipient_id = ${req.user.userId} AND read = FALSE
    `;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Push helper (FCM via Firebase Admin SDK) ──────────────────────────────────
async function sendPushToUser(userId, senderEmail, body) {
  try {
    const [row] = await sql`
      SELECT token FROM push_tokens WHERE user_id = ${userId}
    `;
    if (!row?.token) {
      console.log(`[Push] No token found for user ${userId} — skipping push`);
      return;
    }
    console.log(`[Push] Sending FCM to token: ${row.token.slice(0, 30)}...`);

    const truncatedBody = body.length > 60 ? body.slice(0, 57) + '...' : body;

    const fcmMessage = {
      token: row.token,
      notification: {
        title: `New message from ${senderEmail}`,
        body: truncatedBody,
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'default',
        },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
      data: { type: 'chat', senderEmail },
    };

    const result = await getMessaging().send(fcmMessage);
    console.log('[Push] FCM message sent:', result);
  } catch (err) {
    console.error('[Push] FCM Error:', err.message);
  }
}

module.exports = router;