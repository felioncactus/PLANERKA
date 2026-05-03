import { pool } from "../config/db.js";

export async function createUploadedFile({
  category,
  ownerUserId = null,
  originalFilename,
  mimeType,
  sizeBytes,
  data,
}) {
  const result = await pool.query(
    `INSERT INTO uploaded_files (category, owner_user_id, original_filename, mime_type, size_bytes, data)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, category, owner_user_id, original_filename, mime_type, size_bytes, created_at;`,
    [category, ownerUserId, originalFilename, mimeType, sizeBytes, data]
  );
  return result.rows[0];
}

export async function getUploadedFileById({ category, fileId }) {
  const result = await pool.query(
    `SELECT id, category, owner_user_id, original_filename, mime_type, size_bytes, data, created_at
     FROM uploaded_files
     WHERE category = $1 AND id = $2
     LIMIT 1;`,
    [category, fileId]
  );
  return result.rows[0] || null;
}

export async function deleteUploadedFileById(fileId) {
  if (!fileId) return null;
  const result = await pool.query(
    `DELETE FROM uploaded_files
     WHERE id = $1
     RETURNING id;`,
    [fileId]
  );
  return result.rows[0] || null;
}

export async function deleteUploadedFilesByIds({ fileIds, ownerUserId = null }) {
  const ids = [...new Set((fileIds || []).filter(Boolean))];
  if (!ids.length) return [];

  const params = [ids];
  let ownerClause = "";
  if (ownerUserId) {
    params.push(ownerUserId);
    ownerClause = ` AND owner_user_id = $2`;
  }

  const result = await pool.query(
    `DELETE FROM uploaded_files
     WHERE id = ANY($1::uuid[])
     ${ownerClause}
     RETURNING id;`,
    params
  );
  return result.rows;
}
