import { supabase } from '../database/supabase'

async function testQuery() {
  const { data, error } = await supabase
    .from('PROJECTS')
    .select(`
      *,
      ORGANIZATIONS (
        *,
        WALLETS ( wallet_address )
      ),
      PROJECT_VINTAGES (
        *,
        LISTINGS ( * )
      )
    `);

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Success, data length:', data?.length);
  }
}

testQuery();
