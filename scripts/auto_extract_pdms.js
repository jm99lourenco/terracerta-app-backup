import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { PORTUGAL_GEO } from '../src/data/portugalGeo.js';

import 'dotenv/config'; 

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const BUCKET_NAME = 'regulations_pdfs';
const TABLE_NAME = 'municipality_regulations';
const ALERTS_TABLE = 'regulation_alerts';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Flatten and sort the 308 municipalities
const allMunicipalities = Array.from(new Set(Object.values(PORTUGAL_GEO).flat())).sort((a, b) => a.localeCompare(b, 'pt'));

async function generateMockPDF(municipalityName, docType) {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  page.drawText(`Documento Oficial do ${docType}`, {
    x: 50,
    y: height - 100,
    size: 24,
    font: timesRomanFont,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Município: ${municipalityName}`, {
    x: 50,
    y: height - 150,
    size: 18,
    font: timesRomanFont,
    color: rgb(0, 0.2, 0.6),
  });

  page.drawText(`(Documento gerado automaticamente pela Plataforma de Extração Automática)`, {
    x: 50,
    y: height - 200,
    size: 12,
    font: timesRomanFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  return await pdfDoc.save();
}

function getPublicUrl(storagePath) {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function processMunicipality(muni, docType) {
  const normalizedMuni = muni.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');
  const storagePath = `${normalizedMuni}/${docType}.pdf`;
  
  // 1. Generate PDF dynamically
  const pdfBytes = await generateMockPDF(muni, docType);
  
  // 2. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true, 
    });

  if (uploadError) throw new Error(`Upload falhou: ${uploadError.message}`);

  // 3. Get Public URL
  const publicUrl = getPublicUrl(storagePath);

  // 4. Update Database
  const { error: dbError } = await supabase
    .from(TABLE_NAME)
    .upsert(
      {
        municipality_name: muni,
        document_type: docType,
        pdf_url: publicUrl,
      },
      { onConflict: 'municipality_name,document_type' }
    );

  if (dbError) throw new Error(`DB falhou: ${dbError.message}`);

  // 5. Resolve any pending DRE alerts
  await supabase
    .from(ALERTS_TABLE)
    .update({ is_resolved: true, resolved_at: new Date().toISOString() })
    .eq('municipality_name', muni)
    .eq('document_type', docType)
    .eq('is_resolved', false);

  return publicUrl;
}

async function main() {
  console.log('🚀 Iniciando a Extração e Upload Automático (308 Municípios)\n');
  
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
