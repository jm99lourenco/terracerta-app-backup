/**
 * upload_regulations.js
 * Bulk PDF Upload Script for TerraCerta
 * 
 * Usage:
 *   1. Place PDFs in /scripts/pdfs/ with naming convention: MunicipalityName_DocType.pdf
 *      Examples: Lisboa_PDM.pdf, Faro_RAN.pdf, Porto_REN.pdf
 *   2. Set environment variables:
 *      export SUPABASE_URL="https://your-project.supabase.co"
 *      export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
 *   3. Run: node scripts/upload_regulations.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Config ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'regulations_pdfs';
const TABLE_NAME = 'municipality_regulations';
const PDF_DIR = path.join(__dirname, 'pdfs');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables.');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- Helpers ---
function parsePdfFilename(filename) {
  // Expected format: MunicipalityName_DocType.pdf (e.g., Lisboa_PDM.pdf)
  const base = path.basename(filename, '.pdf');
  const parts = base.split('_');

  if (parts.length < 2) {
    return null;
  }

  const documentType = parts.pop().toUpperCase();
  const municipalityName = parts.join('_'); // Handles names like "Vila_Nova_de_Gaia"

  if (!['PDM', 'RAN', 'REN'].includes(documentType)) {
    return null;
  }

  return { municipalityName, documentType };
}

function getPublicUrl(filePath) {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}

// --- Main ---
async function main() {
  console.log('');
  console.log('🏛️  TerraCerta — Bulk Regulation Upload');
  console.log('━'.repeat(50));

  // Check if PDF directory exists
  if (!fs.existsSync(PDF_DIR)) {
    console.log(`📁 Creating PDF directory at: ${PDF_DIR}`);
    fs.mkdirSync(PDF_DIR, { recursive: true });
    console.log('   Place your PDFs there and re-run this script.');
    console.log('   Naming: MunicipalityName_DocType.pdf (e.g., Lisboa_PDM.pdf)');
    process.exit(0);
  }

  // Read all PDFs
  const files = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));

  if (files.length === 0) {
    console.log('⚠️  No PDF files found in /scripts/pdfs/');
    console.log('   Add files with naming: MunicipalityName_DocType.pdf');
    process.exit(0);
  }

  console.log(`📄 Found ${files.length} PDF file(s) to process.\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const parsed = parsePdfFilename(file);

    if (!parsed) {
      console.log(`⏭️  Skipping "${file}" — invalid naming format (expected: Name_TYPE.pdf)`);
      skipped++;
      continue;
    }

    const { municipalityName, documentType } = parsed;
    const storagePath = `${municipalityName}/${documentType}.pdf`;
    const localPath = path.join(PDF_DIR, file);

    console.log(`📤 Uploading: ${file}`);
    console.log(`   → Municipality: ${municipalityName} | Type: ${documentType}`);

    try {
      // 1. Upload to Supabase Storage
      const fileBuffer = fs.readFileSync(localPath);
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: 'application/pdf',
          upsert: true, // Overwrite if exists
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

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

      if (dbError) {
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      console.log(`   ✅ Done → ${publicUrl}\n`);
      uploaded++;
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}\n`);
      failed++;
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
