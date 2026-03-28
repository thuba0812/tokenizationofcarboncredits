import hre from "hardhat";
import { createClient } from "@supabase/supabase-js";

// ─── Config ─────────────────────────────────────────────
const CARBON_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("========================================");
  console.log("🔄 FULL SYNC: Database → Blockchain");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS, deployer);

  // 1️⃣  SYNC QUOTAS
  console.log("1. Syncing Quotas...");
  const { data: quotas } = await supabase.from("CARBON_QUOTAS").select(`
    allocated_quota,
    ORGANIZATIONS (
      WALLETS ( wallet_address )
    )
  `);

  if (quotas) {
    for (const q of quotas as any[]) {
      const amount = Number(q.allocated_quota);
      const org = q.ORGANIZATIONS;
      const wallet = Array.isArray(org?.WALLETS) ? org.WALLETS[0] : org?.WALLETS;
      const address = wallet?.wallet_address;

      if (address) {
        console.log(`   📝 Quota: ${address.slice(0, 10)}... -> ${amount}`);
        const tx = await (CarbonToken as any).setEnterpriseQuota(address, amount);
        await tx.wait();
      }
    }
  }
  console.log("   ✅ Quotas synced.\n");

  // 2️⃣  SYNC TOKENS (BALANCES)
  console.log("2. Syncing Token Balances (Minting)...");
  const { data: rawBalances, error: balError } = await supabase.from("TOKEN_BALANCES").select("*");
  console.log(`   Fetched ${rawBalances?.length || 0} total records from TOKEN_BALANCES.`);
  
  if (balError) console.error("   ❌ Error fetching TOKEN_BALANCES:", balError);

  const { data: balances, error: syncError } = await supabase.from("TOKEN_BALANCES").select(`
    current_amount,
    wallet_id,
    WALLETS ( wallet_address ),
    PROJECT_VINTAGES (
      project_vintage_id,
      token_id,
      vintage_year,
      credit_code,
      cid,
      status,
      PROJECTS (
        project_code
      )
    )
  `).gt("current_amount", 0);

  if (syncError) console.error("   ❌ Error fetching sync data:", syncError);

  if (balances && balances.length > 0) {
    const mintItems: any[] = [];
    for (const b of balances as any[]) {
      const address = b.WALLETS?.wallet_address;
      const vintage = b.PROJECT_VINTAGES;
      
      if (!address || !vintage) continue;

      const tokenId = Number(vintage.token_id || vintage.project_vintage_id);
      
      mintItems.push({
        to: address,
        tokenId: tokenId,
        projectId: vintage.PROJECTS?.project_code || "PRJ-SYNC",
        serialId: vintage.credit_code || `CRD-${tokenId}`,
        vintageYear: Number(vintage.vintage_year) || 2024,
        amount: Number(b.current_amount),
        cid: vintage.cid || `QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-${tokenId}`,
      });
    }

    if (mintItems.length > 0) {
      console.log(`   🔨 Minting ${mintItems.length} records to blockchain...`);
      const tx = await (CarbonToken as any).mintProjectYearBatchSoft(mintItems);
      await tx.wait();
      console.log("   ✅ Balances synced.\n");
    }
  } else {
    console.log("   ℹ️ No balances found to sync.\n");
  }

  console.log("========================================");
  console.log("🎉 FULL SYNC COMPLETED SUCCESSFULLY!");
  console.log("========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
