INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expense-receipts',
  'expense-receipts',
  true,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Users can read their own expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own expense receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own expense receipts" ON storage.objects;

CREATE POLICY "Users can read their own expense receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'expense-receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own expense receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'expense-receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own expense receipts"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'expense-receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'expense-receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own expense receipts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'expense-receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
