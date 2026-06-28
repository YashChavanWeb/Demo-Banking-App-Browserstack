const { sql } = require('./db');

async function createSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name   TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'user',
      kyc_status  TEXT NOT NULL DEFAULT 'pending',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      balance     NUMERIC(15,2) NOT NULL DEFAULT 50000.00,
      currency    TEXT NOT NULL DEFAULT 'USD',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      account_id    UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      merchant      TEXT NOT NULL,
      category      TEXT NOT NULL,
      amount        NUMERIC(15,2) NOT NULL,
      type          TEXT NOT NULL CHECK (type IN ('credit','debit')),
      icon          TEXT NOT NULL DEFAULT 'swap-horizontal-outline',
      note          TEXT,
      reference_id  TEXT UNIQUE NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cards (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label       TEXT NOT NULL,
      number      TEXT NOT NULL,
      holder      TEXT NOT NULL,
      expiry      TEXT NOT NULL,
      color       TEXT NOT NULL DEFAULT '#4F46E5',
      card_type   TEXT NOT NULL DEFAULT 'visa',
      frozen      BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS otps (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email       TEXT NOT NULL,
      code        TEXT NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      used        BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log('✅ Schema created / verified');
}

module.exports = { createSchema };