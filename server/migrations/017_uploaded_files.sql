CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('courses', 'tasks', 'chat', 'notes')),
  owner_user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_category ON uploaded_files(category);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_owner_user_id ON uploaded_files(owner_user_id);
