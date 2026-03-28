import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  console.log('Fetching active listings from Supabase...');
  const { data, error } = await supabase.from('LISTINGS').select('*').eq('listing_status', 'ACTIVE');
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No active listings found in DB. You are fully synced.');
    return;
  }
  
  console.log(`Found ${data.length} fake "Active" listings. Attempting to delete or mark them INACTIVE...`);
  
  // Try to update status to INACTIVE to hide them from the UI
  const { error: updateError } = await supabase
    .from('LISTINGS')
    .update({ listing_status: 'INACTIVE' })
    .eq('listing_status', 'ACTIVE');
    
  if (updateError) {
    console.error('Failed to update via API (likely RLS). You must delete them manually in Supabase SQL editor:', updateError);
  } else {
    console.log('✅ Successfully marked all stale listings as INACTIVE in Supabase! Reload your frontend.');
  }
}

clean().catch(console.error);
