-- =====================================================
-- TerraCerta - Municipality Regulations Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL)
-- =====================================================

-- 1. Create the municipality_regulations table
CREATE TABLE IF NOT EXISTS municipality_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('PDM', 'RAN', 'REN')),
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create an index for fast lookups by municipality name
CREATE INDEX IF NOT EXISTS idx_municipality_name
  ON municipality_regulations (municipality_name);

-- 3. Create a composite unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_municipality_doc_type
  ON municipality_regulations (municipality_name, document_type);

-- 4. Enable Row Level Security (read-only for anon users)
ALTER TABLE municipality_regulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON municipality_regulations
  FOR SELECT
  USING (true);

-- =====================================================
-- Supabase Storage Bucket
-- Create via Dashboard > Storage > New Bucket:
--   Name: regulations_pdfs
--   Public: ON (toggle enabled)
--
-- Or via SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('regulations_pdfs', 'regulations_pdfs', true);
-- =====================================================
