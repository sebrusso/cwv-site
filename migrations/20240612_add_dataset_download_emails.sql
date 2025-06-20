-- Migration: store emails used for dataset downloads
CREATE TABLE IF NOT EXISTS dataset_download_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
ALTER TABLE dataset_download_emails ENABLE ROW LEVEL SECURITY;
