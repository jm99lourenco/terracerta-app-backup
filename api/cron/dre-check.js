import { createClient } from '@supabase/supabase-js';
import { PORTUGAL_GEO } from '../../src/data/portugalGeo.js';

export const maxDuration = 60; // Set function timeout to 60s

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const allMunicipalities = Array.from(new Set(Object.values(PORTUGAL_GEO).flat())).sort((a, b) => a.localeCompare(b, 'pt'));

const KEYWORDS = [
  "Plano Diretor Municipal", "PDM", 
  "Reserva Ecológica Nacional", "REN",
  "Reserva Agrícola Nacional", "RAN"
];

// Mock DRE Search
async function fetchRecentDREPublications() {
  // In a real scenario, this fetches from DRE RSS/API.
  return [
    {
      title: `Aviso n.º 1234/${new Date().getFullYear()} - Revisão do PDM (Automated Cron Check)`,
      url: 'https://diariodarepublica.pt/dr/pesquisa',
      date: new Date().toISOString().split('T')[0],
      summary: 'Aprova a revisão do Plano Diretor Municipal de Lisboa (Simulação Cron)'
    }
  ];
}

function detectMunicipalityAndType(title, summary) {
  const text = (title + " " + summary).toUpperCase();
  const isRelevant = KEYWORDS.some(kw => text.includes(kw.toUpperCase()));
  if (!isRelevant) return null;

  let documentType = 'PDM';
  if (text.includes('RAN') || text.includes('RESERVA AGRÍCOLA')) documentType = 'RAN';
  if (text.includes('REN') || text.includes('RESERVA ECOLÓGICA')) documentType = 'REN';

  const sortedMunis = [...allMunicipalities].sort((a, b) => b.length - a.length);
  for (const muni of sortedMunis) {
    const regex = new RegExp(`\\b${muni.toUpperCase()}\\b`, 'i');
    if (regex.test(title) || regex.test(summary)) {
      return { municipality: muni, documentType };
    }
  }
  return null;
}

export default async function handler(req, res) {
  try {
    // Verify auth header for Vercel Cron
    // (In production, verify the CRON_SECRET from Vercel headers, omitted for brevity in prototype)
    
    const publications = await fetchRecentDREPublications();
    let alertsCreated = 0;

    for (const pub of publications) {
      const match = detectMunicipalityAndType(pub.title, pub.summary);
      if (match) {
        const { data: existing } = await supabase
          .from('regulation_alerts')
          .select('id')
          .eq('municipality_name', match.municipality)
          .eq('document_type', match.documentType)
          .eq('is_resolved', false)
          .limit(1);

        if (!existing || existing.length === 0) {
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

          if (!error) alertsCreated++;
        }
      }
    }

    return res.status(200).json({ success: true, alertsCreated });
  } catch (error) {
    console.error('DRE check cron failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
