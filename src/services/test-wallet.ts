import { supabase } from '../database/supabase'

async function checkWallet() {
  const address = '0x34713EB1aD81e448c224da3c802b8e2b16614a88'
  const { data, error } = await supabase
    .from('WALLETS')
    .select(`ORGANIZATIONS ( organization_type )`)
    .eq('wallet_address', address)
    .single()
  
  if (error) {
    console.error('Error fetching exact case:', error.message)
  } else {
    console.log('Exact case matched:', data)
  }

  const { data: dataIlike, error: errorIlike } = await supabase
    .from('WALLETS')
    .select(`ORGANIZATIONS ( organization_type )`)
    .ilike('wallet_address', address)
    .single()
  
  if (errorIlike) {
    console.error('Error fetching case-insensitive:', errorIlike.message)
  } else {
    console.log('Case-insensitive matched:', dataIlike)
  }
}

checkWallet()
