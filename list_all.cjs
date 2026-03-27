const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Listing ALL rows in TOKEN_BALANCES...');
  const { data, error } = await supabase
    .from('TOKEN_BALANCES')
    .select('balance_id, wallet_id, project_vintage_id, current_amount')
    .order('balance_id', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total Rows:', data.length);
  console.table(data);
}

check();
