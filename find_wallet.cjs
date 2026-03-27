const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const addr = '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';
  console.log('Searching for wallet:', addr);
  const { data, error } = await supabase
    .from('WALLETS')
    .select('wallet_id, organization_id')
    .ilike('wallet_address', addr)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Wallet Data:', data);
}

check();
