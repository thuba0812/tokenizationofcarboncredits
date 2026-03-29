import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUYER_WALLET = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'.toLowerCase();

async function main() {
  console.log("=========================================");
  console.log("🔄 SYNCING DATABASE TO MATCH MOCKED BLOCKCHAIN");
  console.log("=========================================\n");

  // 1. Ensure Wallet exists
  const { data: wallet, error: wErr } = await supabase
    .from('WALLETS')
    .select('wallet_id')
    .ilike('wallet_address', BUYER_WALLET)
    .single();

  if (wErr || !wallet) {
    console.log("❌ Buyer wallet not found in DB. Please create it first.");
    return;
  }
  const wallet_id = wallet.wallet_id;

  // 2. Define the minted tokens mapping
  const mintedTokens = [
    { tokenId: 12023, year: 2023, project_id: 'PRJ-1' },
    { tokenId: 12024, year: 2024, project_id: 'PRJ-1' },
    { tokenId: 12025, year: 2025, project_id: 'PRJ-1' },
    { tokenId: 12026, year: 2026, project_id: 'PRJ-1' },
    { tokenId: 22023, year: 2023, project_id: 'PRJ-2' },
    { tokenId: 22024, year: 2024, project_id: 'PRJ-2' },
    { tokenId: 22025, year: 2025, project_id: 'PRJ-2' },
    { tokenId: 22026, year: 2026, project_id: 'PRJ-2' },
    { tokenId: 32022, year: 2022, project_id: 'PRJ-3' },
    { tokenId: 32023, year: 2023, project_id: 'PRJ-3' },
    { tokenId: 32024, year: 2024, project_id: 'PRJ-3' },
  ];

  for (const item of mintedTokens) {
    // A. Find or confirm the Project Vintage
    // Note: The user's friend might have different project_ids in DB. 
    // We should try to find by year and "some" logic. 
    // Better: Since the user asked to "coi lại database cho khớp", I will update ANY project_vintage 
    // that matches the year and has status 'MINTED' if we can find a reasonable match, 
    // OR create/update based on what's in the screenshot.
    
    // Let's first search for the vintage by year and token_id (since they already updated token_id)
    const { data: vintages, error: vErr } = await supabase
      .from('PROJECT_VINTAGES')
      .select('project_vintage_id, project_id, token_id')
      .eq('vintage_year', item.year)
      .eq('token_id', item.tokenId);

    if (vErr || !vintages || vintages.length === 0) {
      console.log(`⚠️  Warning: No PROJECT_VINTAGES found for TokenID ${item.tokenId} (Year ${item.year}). Skipping balance sync for this.`);
      continue;
    }

    const pvId = vintages[0].project_vintage_id;

    // B. Ensure TOKEN_BALANCES entry exists and has 5000
    const { data: balance, error: bErr } = await supabase
      .from('TOKEN_BALANCES')
      .select('balance_id')
      .eq('wallet_id', wallet_id)
      .eq('project_vintage_id', pvId)
      .single();

    if (bErr || !balance) {
      console.log(`➕ Inserting balance for TokenID ${item.tokenId}...`);
      await supabase.from('TOKEN_BALANCES').insert({
        wallet_id,
        project_vintage_id: pvId,
        current_amount: 5000,
        available_amount: 5000
      });
    } else {
      console.log(`🔄 Updating balance for TokenID ${item.tokenId}...`);
      await supabase.from('TOKEN_BALANCES')
        .update({
          current_amount: 5000,
          available_amount: 5000
        })
        .eq('balance_id', balance.balance_id);
    }
  }

  console.log("\n✅ Database sync complete!");
}

main().catch(console.error);
