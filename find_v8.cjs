const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Searching for any balance for project_vintage_id = 8...');
  const { data, error } = await supabase
    .from('TOKEN_BALANCES')
    .select('balance_id, wallet_id, project_vintage_id, current_amount')
    .eq('project_vintage_id', 8);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Results:');
  console.table(data);
}

check();
