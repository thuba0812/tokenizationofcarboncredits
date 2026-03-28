const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Listing ALL rows in PROJECT_VINTAGES...');
  const { data, error } = await supabase
    .from('PROJECT_VINTAGES')
    .select('project_vintage_id, project_id, vintage_year, token_id')
    .order('project_vintage_id', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total Rows:', data.length);
  console.table(data);
}

check();
