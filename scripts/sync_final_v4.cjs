const hre = require("hardhat");
const { parseUnits } = require("ethers");
const { createClient } = require("@supabase/supabase-js");

async function main() {
  // --- NEW VERIFIED ADDRESSES from Step 2272 ---
  const USDT_ADDRESS = "0xFD2Cf3b56a73c75A7535fFe44EBABe7723c64719";
  const CT_ADDRESS = "0xB22C255250d74B0ADD1bfB936676D2a299BF48Bd";
  const MARKET_ADDRESS = "0x666D0c3da3dBc946D5128D06115bb4eed4595580";

  const WALLET_2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const WALLET_3 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

  const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
  const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [deployer, , sellerSigner] = await hre.ethers.getSigners();
  const usdt = await hre.ethers.getContractAt("MockUSDT", USDT_ADDRESS, deployer);
  const ct = await hre.ethers.getContractAt("CarbonToken", CT_ADDRESS, deployer);
  const market = await hre.ethers.getContractAt("CarbonMarketplace", MARKET_ADDRESS, sellerSigner);

  console.log("========================================");
  console.log("🚀 FINAL SYNC & FUNDING (V4 - VERIFIED)");
  console.log("========================================\n");

  // 1. FUNDING
  console.log("1️⃣  Funding Wallets...");
  // Wallet 2
  await (await deployer.sendTransaction({ to: WALLET_2, value: parseUnits("10", 18) })).wait();
  await (await usdt.mint(WALLET_2, parseUnits("1000000", 6))).wait();
  // Wallet 3
  await (await deployer.sendTransaction({ to: WALLET_3, value: parseUnits("10", 18) })).wait();
  await (await usdt.mint(WALLET_3, parseUnits("1000000", 6))).wait();
  console.log("   ✅ Both wallets funded with 10 ETH and 1M USDT.");

  // 2. TOKEN MINTING (Project 31 -> ID 95)
  console.log("\n2️⃣  Minting Project 31 Vintages to Wallet 3...");
  const tokenId = 95;
  const projectCode = "PRJ-S-E2-230731";
  const vintageYear = 2024;
  const amount = 5000;

  await (await ct.mintProjectYearBatchSoft([{
    to: WALLET_3,
    tokenId: tokenId,
    projectId: projectCode,
    serialId: "PRJ-S-E2-230731-2024-C5",
    vintageYear: vintageYear,
    amount: amount,
    cid: "QmSYNC-V4-95"
  }])).wait();
  console.log(`   ✅ Token ${tokenId} minted to Wallet 3.`);

  // 3. LISTING ON-CHAIN
  console.log("\n3️⃣  Creating On-chain Listing from Wallet 3...");
  await (await ct.connect(sellerSigner).setApprovalForAll(MARKET_ADDRESS, true)).wait();
  const priceWei = parseUnits("15", 6); // 15 USDT
  await (await market.createListing(tokenId, priceWei, amount)).wait();
  console.log("   ✅ Listing created on-chain (ListingID will be 1).");

  // 4. DATABASE UPDATE
  console.log("\n4️⃣  Updating Supabase with Listing Data...");
  await supabase.from("WALLETS").upsert({ wallet_id: 3, organization_id: 3, wallet_address: WALLET_3, blockchain_network: "Hardhat" });
  
  const { error: lError } = await supabase.from("LISTINGS").upsert({
    listing_id: 3,
    project_vintage_id: 95,
    seller_wallet_id: 3,
    price_per_unit: 15,
    listed_amount: amount,
    listing_status: "ACTIVE",
    onchain_listing_id: 1
  });

  if (lError) {
    console.error("   ❌ Supabase Error:", lError.message);
  } else {
    console.log("   ✅ Listing ID 3 inserted/updated in Supabase.");
  }

  await supabase.from("PROJECT_VINTAGES").update({ token_id: tokenId }).eq("project_vintage_id", 95);

  console.log("\n========================================");
  console.log("🎉 ALL SYSTEMS GO! Mời mày F5 web để check.");
  console.log("========================================");
}

main().catch(console.error);
