# Chat Feature — Rules & Configuration

## Overview
A 2-way in-app messaging system between registered users, with push notifications delivered via the Expo Push Notification Service (EPNS). Accessible from the Home screen Quick Actions → **Chat**.

---

## Messaging Rules (enforced server-side)

| Rule | Limit | Error message |
|---|---|---|
| Messages per sender per hour | **5** | "You can only send 5 messages per hour." |
| Unique recipients per sender per hour | **3** | "You can only message 3 different recipients per hour." |
| Max message length | **100 characters** | "Message cannot exceed 100 characters" |
| Self-messaging | Not allowed | "You cannot message yourself" |

Rate limits are calculated on a rolling 1-hour window using `created_at >= NOW() - INTERVAL '1 hour'`.

---

## Database Tables

### `messages`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `sender_id` | UUID | FK → users.id |
| `recipient_id` | UUID | FK → users.id |
| `body` | TEXT | CHECK: char_length ≤ 100 |
| `read` | BOOLEAN | Default FALSE |
| `created_at` | TIMESTAMPTZ | Auto-set |

Index: `idx_messages_sender_recipient` on `(sender_id, recipient_id)` for fast conversation lookup.

### `push_tokens`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK → users.id, UNIQUE (one token per user) |
| `token` | TEXT | Expo push token |
| `platform` | TEXT | `android` / `ios` |
| `updated_at` | TIMESTAMPTZ | Updated on each registration |

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/messages` | ✅ | Send a message (rate-limited) |
| `GET` | `/messages/conversation/:userId` | ✅ | Get full conversation + mark as read |
| `GET` | `/messages/inbox` | ✅ | Latest message per conversation partner |
| `GET` | `/messages/unread-count` | ✅ | Total unread message count |
| `POST` | `/push-tokens` | ✅ | Register / update device push token |

---

## Push Notification Flow

1. App launches → requests permission → gets `ExpoPushToken` → `POST /push-tokens` saves it to DB.
2. User A sends a message → server saves to `messages` table.
3. Server looks up recipient's push token from `push_tokens`.
4. Server calls `https://exp.host/--/api/v2/push/send` with the token, title, body, and `data: { type: 'chat' }`.
5. Expo delivers via FCM (Android) or APNs (iOS).
6. Recipient's device shows a notification banner.
7. Tapping the notification navigates to `/(banking)/chat` (handled in `app/_layout.tsx` via `addNotificationResponseReceivedListener`).

---

## Client-side Configuration

### `app/_layout.tsx`
- Dynamically imports `expo-notifications` (avoids bundler errors in Expo Go / web).
- Requests permission on first launch.
- Registers `ExpoPushToken` with the server.
- Sets up `addNotificationReceivedListener` (foreground banners).
- Sets up `addNotificationResponseReceivedListener` (tap → navigate to chat).

### `app.json` plugin
```json
["expo-notifications", {
  "icon": "./assets/images/icon.png",
  "color": "#1E3A8A",
  "sounds": []
}]
```

### `app/(banking)/_layout.tsx`
- `chat` screen is hidden from the bottom tab bar (`href: null`).
- Accessible only via Home → Quick Actions → Chat.
- Bottom tab bar height increased to 72px / paddingBottom 16px to avoid overlap with 3-button Android navigation bars.

---

## Packages
- `expo-notifications` — push token registration + notification listeners
- `expo-constants` — reads `projectId` from EAS config for token generation

Install: `npx expo install expo-notifications expo-constants`

---

## Security Notes
- All endpoints require a valid JWT (`Authorization: Bearer <token>`).
- Rate limits prevent spam and DB abuse.
- Push tokens are stored per-user (one row, upserted on each app launch).
- Messages are never deleted automatically — implement a cleanup job if needed for production.