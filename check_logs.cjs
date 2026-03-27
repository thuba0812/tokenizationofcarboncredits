const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Checking TOKEN_ACTIVITY_LOGS for wallet_id = 3...');
  const { data, error } = await supabase
    .from('TOKEN_ACTIVITY_LOGS')
    .select('activity_id, activity_type, delta_amount, created_at, reference_id')
    .eq('wallet_id', 3)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total Logs:', data.length);
  console.table(data);
}

check();
