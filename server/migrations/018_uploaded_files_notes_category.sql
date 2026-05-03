ALTER TABLE uploaded_files
  DROP CONSTRAINT IF EXISTS uploaded_files_category_check;

ALTER TABLE uploaded_files
  ADD CONSTRAINT uploaded_files_category_check
  CHECK (category IN ('courses', 'tasks', 'chat', 'notes'));
