const hre = require("hardhat");
const { parseUnits } = require("ethers");
const { createClient } = require("@supabase/supabase-js");

async function main() {
  // --- Config ---
  const USDT_ADDRESS = "0xFD2Cf3b56a73c75A7535fFe44EBABe7723c64719";
  const CT_ADDRESS = "0xB22C255250d74B0ADD1bfB936676D2a299BF48Bd";
  const MARKET_ADDRESS = "0x666D0c3da3dBc946D5128D06115bb4eed4595580";

  const WALLET_2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
  const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const [deployer, sellerSigner] = await hre.ethers.getSigners();
  const ct = await hre.ethers.getContractAt("CarbonToken", CT_ADDRESS, deployer);
  const market = await hre.ethers.getContractAt("CarbonMarketplace", MARKET_ADDRESS, sellerSigner);

  console.log("========================================");
  console.log("🚀 WALLET 2 LISTING SYNC (V5)");
  console.log("========================================\n");

  // 1. TOKEN MINTING (Project 29 -> ID 85)
  console.log("1️⃣  Minting Project 29 Vintage (85) to Wallet 2...");
  const tokenId = 85;
  const projectCode = "PRJ-L-E1-230731";
  const vintageYear = 2024;
  const amount = 3000;

  await (await ct.mintProjectYearBatchSoft([{
    to: WALLET_2,
    tokenId: tokenId,
    projectId: projectCode,
    serialId: "PRJ-L-E1-230731-2024-C1",
    vintageYear: vintageYear,
    amount: amount,
    cid: "QmSYNC-V5-85"
  }])).wait();
  console.log(`   ✅ Token ${tokenId} minted to Wallet 2.`);

  // 2. LISTING ON-CHAIN
  console.log("\n2️⃣  Creating On-chain Listing from Wallet 2...");
  await (await ct.connect(sellerSigner).setApprovalForAll(MARKET_ADDRESS, true)).wait();
  const priceWei = parseUnits("20", 6); // 20 USDT
  await (await market.createListing(tokenId, priceWei, amount)).wait();
  console.log("   ✅ Listing created on-chain (ListingID will be 2).");

  // 3. DATABASE UPDATE
  console.log("\n3️⃣  Updating Supabase with Listing Data...");
  const { error: lError } = await supabase.from("LISTINGS").upsert({
    listing_id: 4, // Next ID
    project_vintage_id: 85,
    seller_wallet_id: 2,
    price_per_unit: 20,
    listed_amount: amount,
    listing_status: "ACTIVE",
    onchain_listing_id: 2
  });

  if (lError) {
    console.error("   ❌ Supabase Error:", lError.message);
  } else {
    console.log("   ✅ Listing ID 4 inserted/updated in Supabase.");
  }

  // Update token_id in PROJECT_VINTAGES
  await supabase.from("PROJECT_VINTAGES").update({ token_id: tokenId }).eq("project_vintage_id", 85);

  console.log("\n========================================");
  console.log("🎉 WALLET 2 LISTING READY!");
  console.log("========================================");
}

main().catch(console.error);
