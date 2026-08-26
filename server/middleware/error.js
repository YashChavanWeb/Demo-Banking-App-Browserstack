/**
 * Centralized error handler — Fix 6
 * Never expose raw DB/ORM error messages to the client.
 * Log the real error server-side only.
 */

/**
 * Send a safe 500 response and log the real error.
 * @param {import('express').Response} res
 * @param {unknown} err
 * @param {string} context  - short label for the log line (e.g. 'Cards GET')
 */
function serverError(res, err, context = 'Server') {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[${context}] ${message}`);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
}

module.exports = { serverError };
