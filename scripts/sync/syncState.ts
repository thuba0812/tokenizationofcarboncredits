import hre from "hardhat";
import { createClient } from "@supabase/supabase-js";
const CARBON_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("========================================");
  console.log("🔄 STARTING SYNC: Supabase -> Blockchain");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS, deployer);

  // 1. Fetch all minted tokens from Supabase
  console.log("1️⃣  Fetching tokens from Supabase...");
  const { data: vintages, error } = await supabase
    .from("PROJECT_VINTAGES")
    .select(`
      project_vintage_id,
      vintage_year,
      credit_code,
      issued_creadit_amount,
      PROJECTS!inner (
        project_code,
        ORGANIZATIONS!inner (
          WALLETS!inner ( wallet_address )
        )
      )
    `)
    .eq("status", "MINTED");

  if (error || !vintages) {
    console.error("❌ Failed to fetch tokens from Supabase:", error || "No data");
    return;
  }

  console.log(`   ✅ Found ${vintages.length} 'MINTED' vintage(s) in DB.\n`);

  if (vintages.length === 0) {
    console.log("No tokens to sync. Exiting.");
    return;
  }

  // 2. Prepare MintItems
  const mintItems: any[] = [];
  const processedTokens = new Set<number>();

  for (const vintage of vintages as any[]) {
    const tokenId = Number(vintage.project_vintage_id);
    if(processedTokens.has(tokenId)) continue;
    
    // Check if it already exists on blockchain (just in case)
    const exists = await CarbonToken.tokenExists(tokenId);
    if(exists) {
        console.log(`   ⏭️  Token ID ${tokenId} already exists on chain. Skipping.`);
        continue;
    }

    const orgs = vintage.PROJECTS?.ORGANIZATIONS;
    const wallets = Array.isArray(orgs) ? orgs[0]?.WALLETS : orgs?.WALLETS;
    const walletAddress = Array.isArray(wallets) ? wallets[0]?.wallet_address : wallets?.wallet_address;

    if (!walletAddress) {
      console.log(`   ⚠️  No wallet found for Project Vintage ${tokenId}. Skipping.`);
      continue;
    }

    const amount = Number(vintage.issued_creadit_amount) || 10000;

    mintItems.push({
      to: walletAddress,
      tokenId: tokenId,
      projectId: vintage.PROJECTS.project_code || "PRJ-UNKNOWN",
      serialId: vintage.credit_code || `CRD-${tokenId}`,
      vintageYear: Number(vintage.vintage_year) || 2024,
      amount: amount,
      cid: `QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-${tokenId}` // Fake CID for local testing
    });
    
    processedTokens.add(tokenId);
  }

  if (mintItems.length === 0) {
    console.log("2️⃣  No new tokens need to be minted. Done!");
    return;
  }

  console.log(`2️⃣  Ready to mint ${mintItems.length} token(s) to respective wallets...`);

  // 3. Execute Batch Mint on Smart Contract
  console.log("\n3️⃣  Executing transaction on CarbonToken contract...");
  try {
    const tx = await CarbonToken.mintProjectYearBatchSoft(mintItems);
    await tx.wait();
    console.log(`   ✅ Transaction successful! Hash: ${tx.hash}\n`);

    console.log("========================================");
    console.log("🎉 SYNC COMPLETED SUCCESSFULLY!");
    console.log("========================================");
    mintItems.forEach(item => {
        console.log(`   Minted ${item.amount} of ID ${item.tokenId} to ${item.to}`);
    });
    console.log("\nBạn có thể quay lại Web và ấn nút Tiêu hủy (Burn) thoải mái rồi nhé!");
  } catch (err) {
    console.error("❌ Transaction failed:", err);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
