import hre from "hardhat";
import { createClient } from "@supabase/supabase-js";

// ─── Config ─────────────────────────────────────────────
const CARBON_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("========================================");
  console.log("🔄 SYNC QUOTAS: Database → Blockchain");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS, deployer);

  console.log("1️⃣  Fetching quotas from Supabase...");
  
  const { data: quotas, error } = await supabase
    .from("CARBON_QUOTAS")
    .select(`
      allocated_quota,
      ORGANIZATIONS (
        WALLETS ( wallet_address )
      )
    `);

  if (error || !quotas) {
    console.error("❌ Failed to fetch quotas:", error || "No data");
    return;
  }

  console.log(`   Found ${quotas.length} quota record(s) in DB.\n`);

  for (const q of quotas as any[]) {
    const amount = Number(q.allocated_quota);
    const org = q.ORGANIZATIONS;
    const wallet = Array.isArray(org?.WALLETS) ? org.WALLETS[0] : org?.WALLETS;
    const address = wallet?.wallet_address;

    if (!address) {
      console.log("   ⚠️  No wallet found for a quota record. Skipping.");
      continue;
    }

    console.log(`   📝 Syncing Quota for ${address.slice(0, 10)}...`);
    console.log(`      Amount: ${amount.toLocaleString()} tCO2e`);

    try {
      // Check current on-chain quota to avoid redundant TXs
      const currentOnChain = await (CarbonToken as any).enterpriseQuotas(address);
      if (Number(currentOnChain) === amount) {
        console.log("      ✅ Already in sync. Skipping.");
        continue;
      }

      const tx = await (CarbonToken as any).setEnterpriseQuota(address, amount);
      await tx.wait();
      console.log("      🚀 On-chain quota updated!");
    } catch (err: any) {
      console.error(`      ❌ Error syncing: ${err.message}`);
    }
  }

  console.log("\n========================================");
  console.log("🎉 QUOTA SYNC COMPLETED!");
  console.log("========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
