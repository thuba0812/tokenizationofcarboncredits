import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { createClient } from "@supabase/supabase-js";
import { parseUnits } from "ethers";

// --- Config (Hardcoded for stability) ---
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
  console.log("🛠️  CREATING TEST DATA FOR BUY FLOW");
  console.log("========================================\n");

  const projectCode = "PRJ-TEST-" + Math.floor(Math.random() * 1000);
  const vintageYear = 2024;
  const creditAmount = 500;
  const pricePerToken = 10; // 10 USDT

  // 1. Create Project in Supabase
  console.log(`1️⃣  Creating project ${projectCode} in Supabase...`);
  const { data: project, error: pError } = await supabase
    .from("PROJECTS")
    .insert({
      project_code: projectCode,
      project_name: "DỰ ÁN TEST MUA BÁN",
      project_description: "Dự án giả lập để kiểm tra tính năng mua tín chỉ carbon.",
      country: "Vietnam",
      sector: "Forestry",
      owner_organization_id: 1, // Assuming organization 1 exists
      start_date: "2024-01-01",
      end_date: "2030-12-31",
      project_status: "ACTIVE",
      thumbnail_url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80"
    })
    .select()
    .single();

  if (pError) {
    console.error("❌ Failed to create project:", pError);
    return;
  }
  const projectId = project.project_id;

  // 2. Create Vintage in Supabase
  console.log("2️⃣  Creating vintage in Supabase...");
  const { data: vintage, error: vError } = await supabase
    .from("PROJECT_VINTAGES")
    .insert({
      project_id: projectId,
      vintage_year: vintageYear,
      credit_code: projectCode + "-V24",
      verified_co2_reduction: creditAmount, // Required by schema
      issued_creadit_amount: creditAmount,
      status: "MINTED",
      token_id: projectId * 10000 + vintageYear
    })
    .select()
    .single();

  if (vError) {
    console.error("❌ Failed to create vintage:", vError);
    return;
  }
  const vintageId = vintage.project_vintage_id;
  const tokenId = Number(vintage.token_id);

  // 3. Mint Tokens On-Chain
  console.log("3️⃣  Minting tokens on-chain...");
  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS, deployer);
  await CarbonToken.mintProjectYearBatchSoft([{
    to: deployer.address,
    tokenId: tokenId,
    projectId: projectCode,
    serialId: projectCode + "-V24",
    vintageYear: vintageYear,
    amount: creditAmount,
    cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE"
  }]);
  console.log("   ✅ Tokens minted to deployer.");

  // 4. Create Listing in Supabase
  console.log("4️⃣  Creating listing in Supabase...");
  const { data: listing, error: lError } = await supabase
    .from("LISTINGS")
    .insert({
      project_vintage_id: vintageId,
      seller_wallet_id: 1, // Organization 1 wallet
      price_per_unit: pricePerToken,
      listed_amount: creditAmount,
      listing_status: "ACTIVE",
    })
    .select()
    .single();

  if (lError) {
    console.error("❌ Failed to create listing in DB:", lError);
    return;
  }
  const dbListingId = listing.listing_id;

  // 5. Create Listing On-Chain
  console.log("5️⃣  Creating listing on-chain...");
  const Marketplace = await hre.ethers.getContractAt("CarbonMarketplace", MARKETPLACE_ADDRESS, deployer);
  await CarbonToken.setApprovalForAll(MARKETPLACE_ADDRESS, true);
  const tx = await Marketplace.createListing(tokenId, parseUnits(pricePerToken.toString(), USDT_DECIMALS), creditAmount);
  await tx.wait();
  console.log(`   ✅ Listing created on-chain! ID: ${dbListingId}`);

  // 6. Fund Buyer
  console.log("\n6️⃣  Funding your wallet with ETH and USDT...");
  await deployer.sendTransaction({ to: TARGET_WALLET, value: parseUnits("1", 18) });
  const MockUSDT = await hre.ethers.getContractAt("MockUSDT", MOCK_USDT_ADDRESS, deployer);
  await MockUSDT.mint(TARGET_WALLET, parseUnits("10000", USDT_DECIMALS));

  console.log("\n========================================");
  console.log("🎉 TEST DATA READY!");
  console.log(`🚀 Project: ${projectCode}`);
  console.log(`   Vui lòng mở trang Marketplace và tìm dự án: ${projectCode}`);
  console.log("========================================");
}

main().catch(console.error);

main().catch(console.error);
