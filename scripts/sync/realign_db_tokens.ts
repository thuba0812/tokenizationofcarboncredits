import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ghltbczennngxphbhxfy.supabase.co';
const supabaseAnonKey = 'sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUYER_WALLET = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'.toLowerCase();

async function main() {
  console.log("=========================================");
  console.log("🔄 REALIGNING DB TOKENS & BALANCES");
  console.log("=========================================\n");

  // 1. Get Wallet ID
  const { data: wallet } = await supabase.from('WALLETS').select('wallet_id').ilike('wallet_address', BUYER_WALLET).single();
  if (!wallet) return console.error("❌ Wallet not found");
  const walletId = wallet.wallet_id;

  // 2. Fetch all vintages
  const { data: vintages } = await supabase.from('PROJECT_VINTAGES').select('*');
  if (!vintages) return console.error("❌ No vintages found");

  for (const v of vintages) {
    // New format: (project_id * 10000) + vintage_year
    const newTokenId = (v.project_id * 10000) + v.vintage_year;
    
    console.log(`Updating PV ${v.project_vintage_id}: ${v.token_id} -> ${newTokenId}`);
    
    // Update token_id in DB
    await supabase.from('PROJECT_VINTAGES').update({ token_id: newTokenId }).eq('project_vintage_id', v.project_vintage_id);

    // Update/Insert balance
    const { data: existingBalance } = await supabase.from('TOKEN_BALANCES').select('balance_id').eq('wallet_id', walletId).eq('project_vintage_id', v.project_vintage_id).single();
    
    if (existingBalance) {
      await supabase.from('TOKEN_BALANCES').update({ current_amount: 5000, available_amount: 5000 }).eq('balance_id', existingBalance.balance_id);
    } else {
      await supabase.from('TOKEN_BALANCES').insert({
        wallet_id: walletId,
        project_vintage_id: v.project_vintage_id,
        current_amount: 5000,
        available_amount: 5000
      });
    }
  }

  console.log("\n✅ Realignment Complete!");
}

main().catch(console.error);
