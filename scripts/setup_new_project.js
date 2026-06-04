import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function setup() {
  console.log('Criando bucket regulations_pdfs...');
  const { data, error } = await supabase.storage.createBucket('regulations_pdfs', { public: true });
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket já existe!');
    } else {
      console.error('Erro ao criar bucket:', error);
    }
  } else {
    console.log('Bucket criado com sucesso!', data);
  }
}

setup();
