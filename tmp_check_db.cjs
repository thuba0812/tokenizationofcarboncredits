const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envText = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envText.match(/^VITE_SUPABASE_URL=(.+)$/m)[1].trim();
const supabaseKey = envText.match(/^VITE_SUPABASE_ANON_KEY=(.+)$/m)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: vintages } = await supabase.from('PROJECT_VINTAGES').select('status, token_id');
  console.log("Vintages summary:", vintages.reduce((acc, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc; }, {}));
  const { data: listings } = await supabase.from('LISTINGS').select('listing_status');
  console.log("Listings summary:", listings.reduce((acc, l) => { acc[l.listing_status] = (acc[l.listing_status] || 0) + 1; return acc; }, {}));
}
check();
