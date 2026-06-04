/**
 * upload_regulations.js
 * Enhanced Bulk PDF Upload Script for TerraCerta
 * 
 * Usage Modes:
 *   1. Local Directory: node scripts/upload_regulations.js
 *      Reads PDFs from /scripts/pdfs/ (Naming: MunicipalityName_DocType.pdf)
 * 
 *   2. From URLs (CSV): node scripts/upload_regulations.js --from-urls
 *      Reads scripts/municipality_pdf_sources.csv, downloads and uploads.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import 'dotenv/config'; 

// --- Config ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const BUCKET_NAME = 'regulations_pdfs';
const TABLE_NAME = 'municipality_regulations';
const ALERTS_TABLE = 'regulation_alerts';
const PDF_DIR = path.join(__dirname, 'pdfs');
const CSV_FILE = path.join(__dirname, 'municipality_pdf_sources.csv');

const isUrlMode = process.argv.includes('--from-urls');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Helpers ---
function parsePdfFilename(filename) {
  const base = path.basename(filename, '.pdf');
  const parts = base.split('_');

  if (parts.length < 2) return null;

  const documentType = parts.pop().toUpperCase();
  const municipalityName = parts.join('_');

  if (!['PDM', 'RAN', 'REN'].includes(documentType)) return null;

  return { municipalityName, documentType };
}

function getPublicUrl(filePath) {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

async function downloadPdfToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: Status ${res.statusCode}`));
        return;
      }
      const data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', err => reject(err));
  });
}

async function processUpload(municipalityName, documentType, fileBuffer) {
  const storagePath = `${municipalityName}/${documentType}.pdf`;
  
  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

  // 2. Get the public URL
  const publicUrl = getPublicUrl(storagePath);

  // 3. Upsert into the database table
  const { error: dbError } = await supabase
    .from(TABLE_NAME)
    .upsert(
      {
        municipality_name: municipalityName,
        document_type: documentType,
        pdf_url: publicUrl,
      },
      { onConflict: 'municipality_name,document_type' }
    );

  if (dbError) throw new Error(`Database insert failed: ${dbError.message}`);

  // 4. Resolve any pending alerts for this municipality and doc type
  const { error: alertError } = await supabase
    .from(ALERTS_TABLE)
    .update({ is_resolved: true })
    .eq('municipality_name', municipalityName)
    .eq('document_type', documentType)
    .eq('is_resolved', false);

  if (alertError) {
    console.warn(`   ⚠️  Failed to resolve alerts: ${alertError.message}`);
  }

  return publicUrl;
}

// --- Main ---
async function main() {
  console.log('');
  console.log('🏛️  TerraCerta — Bulk Regulation Upload');
  console.log('━'.repeat(50));

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  if (isUrlMode) {
    console.log('🌐 MODE: Downloading from URLs (CSV)');
    if (!fs.existsSync(CSV_FILE)) {
      console.error(`❌ CSV file not found at: ${CSV_FILE}`);
      process.exit(1);
    }

    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim() !== '');
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const [municipalityName, documentType, sourceUrl] = line.split(',').map(s => s.trim());
      
      if (!municipalityName || !documentType || !sourceUrl) {
        console.log(`⏭️  Skipping invalid line: ${line}`);
        skipped++;
        continue;
      }

      console.log(`📥 Downloading: ${municipalityName} | ${documentType} from ${sourceUrl}`);
      
      try {
        const fileBuffer = await downloadPdfToBuffer(sourceUrl);
        console.log(`📤 Uploading to Storage...`);
        const publicUrl = await processUpload(municipalityName, documentType, fileBuffer);
        console.log(`   ✅ Done → ${publicUrl}\n`);
        uploaded++;
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}\n`);
        failed++;
      }
    }
  } else {
    console.log('📁 MODE: Local Directory');
    if (!fs.existsSync(PDF_DIR)) {
      console.log(`📁 Creating PDF directory at: ${PDF_DIR}`);
      fs.mkdirSync(PDF_DIR, { recursive: true });
      console.log('   Place your PDFs there and re-run this script.');
      process.exit(0);
    }

    const files = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

    if (files.length === 0) {
      console.log('⚠️  No PDF files found in /scripts/pdfs/');
      process.exit(0);
    }

    console.log(`📄 Found ${files.length} PDF file(s) to process.\n`);

    for (const file of files) {
      const parsed = parsePdfFilename(file);

      if (!parsed) {
        console.log(`⏭️  Skipping "${file}" — invalid format`);
        skipped++;
        continue;
      }

      const { municipalityName, documentType } = parsed;
      const localPath = path.join(PDF_DIR, file);

      console.log(`📤 Uploading: ${file}`);
      console.log(`   → Municipality: ${municipalityName} | Type: ${documentType}`);

      try {
        const fileBuffer = fs.readFileSync(localPath);
        const publicUrl = await processUpload(municipalityName, documentType, fileBuffer);
        console.log(`   ✅ Done → ${publicUrl}\n`);
        uploaded++;
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}\n`);
        failed++;
      }
    }
  }

  // Summary
  console.log('━'.repeat(50));
  console.log(`✅ Uploaded: ${uploaded} | ⏭️ Skipped: ${skipped} | ❌ Failed: ${failed}`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
