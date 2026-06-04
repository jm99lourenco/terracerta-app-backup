/**
 * dre_monitor.js
 * Automated monitoring script for Diário da República (DRE)
 * 
 * Usage:
 *   node scripts/dre_monitor.js [--dry-run]
 * 
 * Description:
 *   Simulates/queries the DRE to find new publications related to PDM, RAN, or REN.
 *   If it finds a publication matching a municipality, it inserts a warning into
 *   the `regulation_alerts` table in Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORTUGAL_GEO } from '../src/data/portugalGeo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config ---
// Since we are running outside the browser/Vite context, load .env.local manually if needed
// or rely on process.env
import 'dotenv/config'; 

// Prefer Service Role key for backend scripts, fallback to anon key for testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const isDryRun = process.argv.includes('--dry-run');

// Flatten all municipalities for easy searching
const allMunicipalities = Array.from(new Set(Object.values(PORTUGAL_GEO).flat())).sort((a, b) => a.localeCompare(b, 'pt'));

const KEYWORDS = [
  "Plano Diretor Municipal", "PDM", 
  "Reserva Ecológica Nacional", "REN",
  "Reserva Agrícola Nacional", "RAN"
];

// Mock DRE Search (in a real scenario, this would fetch from DRE RSS or API)
async function fetchRecentDREPublications() {
  console.log('🔍 Fetching recent publications from DRE...');
  
  // Here we simulate fetching from an RSS feed or API.
  // In a production environment with internet access, we would do:
  // const res = await fetch('https://diariodarepublica.pt/dr/api/pesquisa?...');
  // const data = await res.json();
  
  // For demonstration, we'll return mock data indicating a new PDM revision for "Aveiro"
  // and a RAN update for "Faro".
  return [
    {
      title: 'Aviso n.º 1234/2026 - Revisão do Plano Diretor Municipal de Aveiro',
      url: 'https://diariodarepublica.pt/dr/detalhe/aviso/1234-2026',
      date: new Date().toISOString().split('T')[0],
      summary: 'Aprova a revisão do Plano Diretor Municipal...'
    },
    {
      title: 'Aviso (extrato) n.º 5678/2026 - Alteração à delimitação da RAN do município de Faro',
      url: 'https://diariodarepublica.pt/dr/detalhe/aviso/5678-2026',
      date: new Date().toISOString().split('T')[0],
      summary: 'Torna pública a alteração à delimitação da Reserva Agrícola Nacional...'
    },
    {
      title: 'Portaria n.º 999/2026 - Aleatória não relacionada',
      url: 'https://diariodarepublica.pt/dr/detalhe/portaria/999-2026',
      date: new Date().toISOString().split('T')[0],
      summary: 'Aprova o regulamento de algo sem interesse...'
    }
  ];
}

function detectMunicipalityAndType(title, summary) {
  const text = (title + " " + summary).toUpperCase();
  
  // Check if it matches our keywords
  const isRelevant = KEYWORDS.some(kw => text.includes(kw.toUpperCase()));
  if (!isRelevant) return null;

  let documentType = 'PDM';
  if (text.includes('RAN') || text.includes('RESERVA AGRÍCOLA')) documentType = 'RAN';
  if (text.includes('REN') || text.includes('RESERVA ECOLÓGICA')) documentType = 'REN';

  // Find the municipality
  // We sort by length descending to match "Vila Nova de Gaia" before "Gaia" (if both existed)
  const sortedMunis = [...allMunicipalities].sort((a, b) => b.length - a.length);
  
  for (const muni of sortedMunis) {
    // Basic word boundary match to avoid partial matches
    const regex = new RegExp(`\\b${muni.toUpperCase()}\\b`, 'i');
    if (regex.test(title) || regex.test(summary)) {
      return { municipality: muni, documentType };
    }
  }

  return null;
}

async function main() {
  console.log('🏛️  TerraCerta — DRE Monitor');
  console.log('━'.repeat(50));
  
  if (isDryRun) {
    console.log('🧪 DRY RUN MODE ENABLED (No database writes)');
    console.log('━'.repeat(50));
  }

  const publications = await fetchRecentDREPublications();
  console.log(`📄 Found ${publications.length} recent publications.\n`);

  let alertsCreated = 0;

  for (const pub of publications) {
    const match = detectMunicipalityAndType(pub.title, pub.summary);
    if (match) {
      console.log(`⚠️  ALERT TRIGGERED:`);
      console.log(`   Municipality : ${match.municipality}`);
      console.log(`   Type         : ${match.documentType}`);
      console.log(`   DRE Title    : ${pub.title}`);
      
      if (!isDryRun) {
        // Check if an unresolved alert already exists for this municipality + type
        const { data: existing } = await supabase
          .from('regulation_alerts')
          .select('id')
          .eq('municipality_name', match.municipality)
          .eq('document_type', match.documentType)
          .eq('is_resolved', false)
          .limit(1);

        if (existing && existing.length > 0) {
          console.log(`   ℹ️  Unresolved alert already exists. Skipping insertion.\n`);
        } else {
          const { error } = await supabase
            .from('regulation_alerts')
            .insert({
              municipality_name: match.municipality,
              document_type: match.documentType,
              alert_type: 'new_publication',
              dre_title: pub.title,
              dre_url: pub.url,
              dre_date: pub.date,
              is_resolved: false
            });

          if (error) {
            console.error(`   ❌ Failed to insert alert: ${error.message}\n`);
          } else {
            console.log(`   ✅ Alert saved to database.\n`);
            alertsCreated++;
          }
        }
      } else {
        console.log(`   ✅ (Dry run) Would have saved alert.\n`);
      }
    }
  }

  console.log('━'.repeat(50));
  console.log(`🏁 Monitoring complete. ${alertsCreated} new alerts created.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
