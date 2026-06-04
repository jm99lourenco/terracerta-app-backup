/**
 * setup_supabase.js
 * Automated setup: creates the storage bucket and municipality_regulations table.
 * Run: node scripts/setup_supabase.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mlqhfltkheuntgvjkktw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1scWhmbHRraGV1bnRndmpra3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDUyMTIsImV4cCI6MjA5MzkyMTIxMn0.y5-tJXaXsOL56ozK9Rrxm3mwVWrWphA-kasnUs36tZg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log('🏛️  TerraCerta — Supabase Setup');
  console.log('━'.repeat(50));

  // Step 1: Create Storage Bucket
  console.log('\n📦 Step 1: Creating storage bucket "regulations_pdfs"...');
  const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('regulations_pdfs', {
    public: true,
  });

  if (bucketError) {
    if (bucketError.message?.includes('already exists')) {
      console.log('   ✅ Bucket already exists — skipping.');
    } else {
      console.error('   ❌ Bucket creation failed:', bucketError.message);
      console.log('   ℹ️  This likely requires the service_role key. See instructions below.');
    }
  } else {
    console.log('   ✅ Bucket created successfully:', bucketData);
  }

  // Step 2: Try to create the table via SQL using the rpc endpoint
  // Supabase doesn't expose DDL via PostgREST, so we'll try an alternative approach
  console.log('\n📊 Step 2: Creating table "municipality_regulations"...');

  // Try to query the table first to check if it exists
  const { data: testData, error: testError } = await supabase
    .from('municipality_regulations')
    .select('id')
    .limit(1);

  if (!testError) {
    console.log('   ✅ Table already exists — skipping.');
  } else if (testError.code === '42P01' || testError.message?.includes('does not exist') || testError.message?.includes('relation')) {
    console.log('   ⚠️  Table does not exist. Attempting creation via SQL...');
    
    // Try using the SQL endpoint (available in newer Supabase versions)
    try {
      const sqlResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            CREATE TABLE IF NOT EXISTS municipality_regulations (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              municipality_name TEXT NOT NULL,
              document_type TEXT NOT NULL CHECK (document_type IN ('PDM', 'RAN', 'REN')),
              pdf_url TEXT NOT NULL,
              created_at TIMESTAMPTZ DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_municipality_name ON municipality_regulations (municipality_name);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_municipality_doc_type ON municipality_regulations (municipality_name, document_type);
            ALTER TABLE municipality_regulations ENABLE ROW LEVEL SECURITY;
            CREATE POLICY IF NOT EXISTS "Allow public read access" ON municipality_regulations FOR SELECT USING (true);
          `
        }),
      });
      
      if (sqlResponse.ok) {
        console.log('   ✅ Table created successfully via SQL API.');
      } else {
        const body = await sqlResponse.text();
        console.log('   ❌ SQL API not available:', sqlResponse.status, body);
        console.log('   ℹ️  Table must be created manually. See instructions below.');
      }
    } catch (fetchErr) {
      console.error('   ❌ SQL API call failed:', fetchErr.message);
      console.log('   ℹ️  Table must be created manually. See instructions below.');
    }
  } else {
    console.error('   ❌ Unexpected error checking table:', testError.message);
  }

  // Final summary
  console.log('\n' + '━'.repeat(50));
  console.log('📋 MANUAL STEPS (if any step above failed):');
  console.log('');
  console.log('1. Go to: https://supabase.com/dashboard/project/mlqhfltkheuntgvjkktw');
  console.log('2. SQL Editor → Paste contents of scripts/schema.sql → Run');
  console.log('3. Storage → New Bucket → "regulations_pdfs" → Toggle Public ON');
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
