import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { createClient } from "@supabase/supabase-js";
import { parseUnits, formatUnits } from "ethers";

// --- Config (Hardcoded for stability during restoration) ---
const CARBON_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const MOCK_USDT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const MARKETPLACE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const USDT_DECIMALS = 6;
const TARGET_WALLET = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("========================================");
  console.log("🚀 FULL STATE RESTORATION");
  console.log("========================================\n");

  // 1. Fund Wallet
  console.log("1️⃣  Funding target wallet...");
  await deployer.sendTransaction({ to: TARGET_WALLET, value: parseUnits("10", 18) });
  const MockUSDT = await hre.ethers.getContractAt("MockUSDT", MOCK_USDT_ADDRESS, deployer);
  await MockUSDT.mint(TARGET_WALLET, parseUnits("1000000", USDT_DECIMALS));
  console.log("   ✅ Target wallet now has 10 ETH and 1M USDT.\n");

  // 2. Sync Tokens
  console.log("2️⃣  Syncing tokens from Supabase...");
  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS, deployer);
  const { data: vintages } = await supabase
    .from("PROJECT_VINTAGES")
    .select(`*, PROJECTS ( project_code, ORGANIZATIONS ( WALLETS ( wallet_address ) ) )`)
    .eq("status", "MINTED");

  if (vintages) {
    let mintCount = 0;
    for (const v of vintages as any[]) {
      const tokenId = v.project_vintage_id;
      if (await CarbonToken.tokenExists(tokenId)) continue;

      const wallets = v.PROJECTS?.ORGANIZATIONS?.WALLETS;
      const addr = Array.isArray(wallets) ? wallets[0]?.wallet_address : wallets?.wallet_address;
      if (!addr) continue;

      await CarbonToken.mintProjectYearBatchSoft([{
        to: addr,
        tokenId: tokenId,
        projectId: v.PROJECTS.project_code,
        serialId: v.credit_code,
        vintageYear: v.vintage_year,
        amount: v.issued_creadit_amount || 1000,
        cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE"
      }]);
      mintCount++;
    }
    console.log(`   ✅ Minted ${mintCount} missing token types.\n`);
  }

  // 3. Sync Listings
  console.log("3️⃣  Syncing marketplace listings...");
  const Marketplace = await hre.ethers.getContractAt("CarbonMarketplace", MARKETPLACE_ADDRESS, deployer);
  const { data: listings } = await supabase
    .from("LISTINGS")
    .select(`*`)
    .eq("listing_status", "ACTIVE");

  if (listings) {
    // Approve Marketplace for all tokens by deployer (as we are acting as admin/sync script)
    // In real env, each seller must approve. For local fix, we'll try to just recreate listings.
    await CarbonToken.setApprovalForAll(MARKETPLACE_ADDRESS, true);

    let listCount = 0;
    for (const l of listings as any[]) {
      const tokenId = l.project_vintage_id;
      const price = parseUnits(l.price_per_unit.toString(), USDT_DECIMALS);
      const amount = l.listed_amount;

      try {
        // We mint enough tokens to the deployer so they can "list" them for the buyer to buy
        // This is a workaround to fix the "Inactive listing" error for the user (Buyer)
        await CarbonToken.mintProjectYearBatchSoft([{
          to: deployer.address,
          tokenId: tokenId,
          projectId: "SYNC",
          serialId: "SYNC",
          vintageYear: 2024,
          amount: amount,
          cid: "SYNC"
        }]);

        const tx = await Marketplace.createListing(tokenId, price, amount);
        await tx.wait();
        listCount++;
      } catch (e) {
        // Probably already listed or error
      }
    }
    console.log(`   ✅ Created ${listCount} listings on-chain.\n`);
  }

  console.log("========================================");
  console.log("🎉 RESTORATION COMPLETED!");
  console.log("========================================");
}

main().catch(console.error);
