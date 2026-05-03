import { pool } from "../config/db.js";

export async function createEmailVerificationCode({ userId, codeHash, expiresAt }) {
  const result = await pool.query(
    `INSERT INTO email_verification_codes (user_id, code_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, expires_at, created_at;`,
    [userId, codeHash, expiresAt]
  );
  return result.rows[0];
}

export async function getLatestEmailVerificationCode(userId) {
  const result = await pool.query(
    `SELECT id, user_id, code_hash, expires_at, consumed_at, created_at
     FROM email_verification_codes
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1;`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function consumeEmailVerificationCode(id) {
  await pool.query(
    `UPDATE email_verification_codes
     SET consumed_at = NOW()
     WHERE id = $1;`,
    [id]
  );
}

export async function createPasswordResetCode({ userId, codeHash, expiresAt }) {
  const result = await pool.query(
    `INSERT INTO password_reset_codes (user_id, code_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, expires_at, created_at;`,
    [userId, codeHash, expiresAt]
  );
  return result.rows[0];
}

export async function getLatestPasswordResetCode(userId) {
  const result = await pool.query(
    `SELECT id, user_id, code_hash, expires_at, consumed_at, created_at
     FROM password_reset_codes
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1;`,
    [userId]
  );
  return result.rows[0] || null;
}

export async function consumePasswordResetCode(id) {
  await pool.query(
    `UPDATE password_reset_codes
     SET consumed_at = NOW()
     WHERE id = $1;`,
    [id]
  );
}
