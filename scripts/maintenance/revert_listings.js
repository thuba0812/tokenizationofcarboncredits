import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function revert() {
  console.log('Fetching INACTIVE listings to revert...');
  
  // Fetch all INACTIVE listings
  const { data, error } = await supabase
    .from('LISTINGS')
    .select('listing_id, listing_status')
    .eq('listing_status', 'INACTIVE');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data?.length || 0} INACTIVE listing(s).`);
  
  if (!data || data.length === 0) return;
  
  // Revert one by one to avoid unique constraint issues
  for (const listing of data) {
    const { error: updateError } = await supabase
      .from('LISTINGS')
      .update({ listing_status: 'ACTIVE' })
      .eq('listing_id', listing.listing_id);
      
    if (updateError) {
      console.error(`Failed to revert listing ${listing.listing_id}:`, updateError.message);
    } else {
      console.log(`✅ Listing ${listing.listing_id} reverted to ACTIVE`);
    }
  }
}

revert().catch(console.error);
