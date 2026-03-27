const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Checking RETIREMENTS and DETAILS for wallet_id = 3...');
  const { data: r, error: er } = await supabase
    .from('RETIREMENTS')
    .select('retirement_id, retired_at, organization_id')
    .eq('wallet_id', 3)
    .order('retired_at', { ascending: false });

  if (er) {
    console.error('Error RETIREMENTS:', er);
  } else {
    console.log('RETIREMENTS found:', r.length);
    console.table(r);
    
    if (r.length > 0) {
      const rid = r[0].retirement_id;
      const { data: rd, error: erd } = await supabase
        .from('RETIREMENT_DETAILS')
        .select('*')
        .eq('retirement_id', rid);
      if (erd) console.error('Error DETAILS:', erd);
      else console.table(rd);
    }
  }
}

check();
