const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Checking TOKEN_BALANCES for wallet_id = 3...');
  const { data, error } = await supabase
    .from('TOKEN_BALANCES')
    .select('balance_id, project_vintage_id, current_amount')
    .eq('wallet_id', 3);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Results:');
  console.table(data);
  
  const b34 = data.find(r => r.balance_id == 34);
  if (b34) {
    console.log('SUCCESS: Found balance_id 34!', b34);
  } else {
    console.log('NOT FOUND: balance_id 34 is missing from this wallet.');
  }
}

check();
