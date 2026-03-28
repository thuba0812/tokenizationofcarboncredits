import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log("=========================================");
  console.log("🔍 DIAGNOSTIC: CHECKING DATABASE SYNC");
  console.log("=========================================\n");

  const walletAddr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'.toLowerCase();

  // 1. Check Wallet Ownership
  console.log("--- 1. WALLET ---");
  const { data: walletData, error: walletErr } = await supabase
    .from('WALLETS')
    .select('wallet_id, organization_id, wallet_address')
    .ilike('wallet_address', walletAddr)
    .single();

  if (walletErr) {
    console.log("❌ Error finding wallet:", walletErr.message);
  } else {
    console.log("✅ Wallet found:", walletData);
  }

  // 2. Check Carbon Quotas
  if (walletData) {
    console.log("\n--- 2. CARBON QUOTAS ---");
    const { data: quotaData, error: quotaErr } = await supabase
      .from('CARBON_QUOTAS')
      .select('*')
      .eq('organization_id', walletData.organization_id);
    
    if (quotaErr) {
      console.log("❌ Error finding quotas:", quotaErr.message);
    } else {
      console.log(`✅ Quotas found (${quotaData.length}):`, quotaData.map(q => ({ year: q.quota_year, quota: q.allocated_quota })));
    }
  }

  // 3. Check Project Vintages and Token IDs
  console.log("\n--- 3. PROJECT VINTAGES (MINTED) ---");
  const { data: vintageData, error: vintageErr } = await supabase
    .from('PROJECT_VINTAGES')
    .select('project_vintage_id, project_id, vintage_year, token_id, status')
    .eq('status', 'MINTED');

  if (vintageErr) {
    console.log("❌ Error finding vintages:", vintageErr.message);
  } else {
    console.log(`✅ Minted Vintages in DB:`, vintageData.map(v => ({ id: v.project_vintage_id, vintage: v.vintage_year, tokenId: v.token_id })));
  }

  // 4. Check Token Balances for the Wallet
  if (walletData) {
    console.log("\n--- 4. TOKEN BALANCES ---");
    const { data: balanceData, error: balanceErr } = await supabase
      .from('TOKEN_BALANCES')
      .select('project_vintage_id, current_amount')
      .eq('wallet_id', walletData.wallet_id);

    if (balanceErr) {
      console.log("❌ Error finding balances:", balanceErr.message);
    } else {
      console.log(`✅ Token Balances found (${balanceData.length}):`, balanceData);
    }
  }

  console.log("\n--- SUMMARY ---");
  console.log("Double check if the 'tokenId' in PROJECT_VINTAGES matches the Blockchain IDs I just minted (12023, 12024, etc.)");
}

main().catch(console.error);
