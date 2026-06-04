import { createClient } from '@supabase/supabase-js';
import { PORTUGAL_GEO } from '../src/data/portugalGeo.js';

import 'dotenv/config'; 

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const TABLE_NAME = 'municipality_regulations';
const ALERTS_TABLE = 'regulation_alerts';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Flatten and sort the 308 municipalities
const allMunicipalities = Array.from(new Set(Object.values(PORTUGAL_GEO).flat())).sort((a, b) => a.localeCompare(b, 'pt'));

async function processMunicipality(muni, docType) {
  // 1. Generate real DRE search URL
  const dreSearchUrl = `https://diariodarepublica.pt/dr/pesquisa-avancada/-/pesquisa?q=plano+diretor+municipal+${encodeURIComponent(muni)}&tipo=dr`;
  
  // 2. Update Database with the DRE search URL instead of a fake PDF URL
  const { error: dbError } = await supabase
    .from(TABLE_NAME)
    .upsert(
      {
        municipality_name: muni,
        document_type: docType,
        pdf_url: dreSearchUrl,
      },
      { onConflict: 'municipality_name,document_type' }
    );

  if (dbError) throw new Error(`DB falhou: ${dbError.message}`);

  // 3. Resolve any pending DRE alerts
  await supabase
    .from(ALERTS_TABLE)
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq('municipality_name', muni)
    .eq('document_type', docType)
    .eq('is_resolved', false);

  return dreSearchUrl;
}

async function main() {
  console.log('🚀 Iniciando a Configuração Automática de Links Oficiais (308 Municípios)\n');
  
  // We'll map PDM for all 308 municipalities.
  const docType = 'PDM';
  const BATCH_SIZE = 10;
  
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allMunicipalities.length; i += BATCH_SIZE) {
    const batch = allMunicipalities.slice(i, i + BATCH_SIZE);
    console.log(`⏳ Processando lote ${i + 1} a ${i + batch.length} de ${allMunicipalities.length}...`);
    
    const promises = batch.map(async (muni) => {
      try {
        await processMunicipality(muni, docType);
        successCount++;
      } catch (err) {
        console.error(`❌ Erro [${muni}]: ${err.message}`);
        failCount++;
      }
    });

    await Promise.all(promises);
  }

  console.log('\n✅ Processo Automático Concluído!');
  console.log(`📊 Sucesso: ${successCount} | Falhas: ${failCount}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
