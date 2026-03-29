import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRetire() {
  const walletAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const items = [{ vintageId: 3, quantity: 10 }];
  const txHash = "0x1234567890abcdef";

  console.log("Testing retireTokens with:", walletAddress, items);

  // Replicate logic
  const { data: walletData, error: walletError } = await supabase
      .from('WALLETS')
      .select('wallet_id, organization_id')
      .ilike('wallet_address', walletAddress)
      .single();

  if (walletError || !walletData) { console.error("Wallet error", walletError); return; }
  
  const walletId = Number(walletData.wallet_id);
  const orgId = Number(walletData.organization_id);
  
  console.log("Found Wallet:", walletId, "Org:", orgId);

  const { data: quotaData, error: qErr } = await supabase
      .from('CARBON_QUOTAS')
      .select('quota_id')
      .eq('organization_id', orgId)
      .limit(1);

  console.log("Quota:", quotaData, qErr);

  const quotaId = quotaData && quotaData.length > 0 ? quotaData[0].quota_id : null;

  const { data: retirement, error: retError } = await supabase
      .from('RETIREMENTS')
      .insert({
        organization_id: orgId,
        wallet_id: walletId,
        quota_id: quotaId,
        retirement_status: 'COMPLETED',
        retired_at: new Date().toISOString(),
        retirement_tx_hash: txHash,
      })
      .select('retirement_id')
      .single();

  if (retError) {
      console.error('Error inserting retirement:', retError);
      return false;
  }
  
  console.log("Success! Retirement ID:", retirement.retirement_id);
}

testRetire().catch(console.error);
