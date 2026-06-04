-- =====================================================
-- TerraCerta - Regulation Alerts Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL)
-- =====================================================

CREATE TABLE IF NOT EXISTS regulation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_name TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'PDM',
  alert_type TEXT NOT NULL DEFAULT 'new_publication',
  dre_title TEXT,
  dre_url TEXT,
  dre_date DATE,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index to quickly find unresolved alerts for a municipality
CREATE INDEX IF NOT EXISTS idx_regulation_alerts_municipality
  ON regulation_alerts (municipality_name)
  WHERE is_resolved = false;

ALTER TABLE regulation_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on regulation_alerts"
  ON regulation_alerts
  FOR SELECT
  USING (true);
