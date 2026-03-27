const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('--- TRIGGER EXPERIMENT ---');
  // Get initial balance for bid 6
  const { data: b1 } = await supabase.from('TOKEN_BALANCES').select('current_amount').eq('balance_id', 6).single();
  console.log('Initial balance (bid 6):', b1.current_amount);

  // Insert a log that suggests -10 (but using a fake reference)
  console.log('Inserting dummy -10 log into TOKEN_ACTIVITY_LOGS...');
  const { error: logError } = await supabase.from('TOKEN_ACTIVITY_LOGS').insert({
    wallet_id: 3,
    project_vintage_id: 7, // Matches bid 6
    activity_type: 'RETIRE',
    delta_amount: -10,
    reference_id: 99999, // Fake
    reference_type: 'RETIREMENT'
  });

  if (logError) {
    console.error('Insert Log Error:', logError);
  } else {
    console.log('Log inserted successfully.');
    // Check balance again
    const { data: b2 } = await supabase.from('TOKEN_BALANCES').select('current_amount').eq('balance_id', 6).single();
    console.log('Final balance (bid 6):', b2.current_amount);
    
    if (Number(b2.current_amount) === Number(b1.current_amount) - 10) {
      console.log('TRIGGER DETECTED: Balance was updated automatically!');
    } else {
      console.log('NO TRIGGER: Balance remained the same.');
    }
    
    // Cleanup: Delete the fake log
    await supabase.from('TOKEN_ACTIVITY_LOGS').delete().eq('reference_id', 99999);
  }
}

check();
