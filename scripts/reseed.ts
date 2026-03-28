import hre from "hardhat";
import { createClient } from "@supabase/supabase-js";
import { parseUnits, MaxUint256 } from "ethers";

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);

const WALLET_1 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Deployer / Minter
const WALLET_2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Buyer  (Org 2)
const WALLET_3 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Seller (Org 3)

async function main() {
  console.log("==================================================");
  console.log("🔄 RESEEDING BLOCKCHAIN & SUPABASE (WALLET 3 SELLS)");
  console.log("==================================================\n");

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0]; // Wallet 1
  const buyer    = signers[1]; // Wallet 2
  const seller   = signers[2]; // Wallet 3

  // 1️⃣ UPDATE SUPABASE STATE
  console.log("1️⃣ Updating Supabase Data...");
  // Project 1 now belongs to Org 3
  await supabase.from("PROJECTS").update({ owner_organization_id: 3 }).eq("project_id", 1);
  console.log("   ✅ Project 1 owner set to Org 3");

  // Listings 96, 97, 98 belong to Wallet 3
  await supabase.from("LISTINGS").update({ seller_wallet_id: 3 }).in("listing_id", [96, 97, 98]);
  console.log("   ✅ Listings 96, 97, 98 seller set to Wallet 3\n");

  // 2️⃣ REDEPLOY CONTRACTS
  console.log("2️⃣ Redeploying Contracts...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT", deployer);
  const mockupUSDT = await MockUSDT.deploy(deployer.address);
  await mockupUSDT.waitForDeployment();
  const usdtAddress = await mockupUSDT.getAddress();

  const CarbonToken = await hre.ethers.getContractFactory("CarbonToken", deployer);
  const carbonToken = await CarbonToken.deploy(deployer.address);
  await carbonToken.waitForDeployment();
  const ctAddress = await carbonToken.getAddress();

  const CarbonMarketplace = await hre.ethers.getContractFactory("CarbonMarketplace", deployer);
  const marketplace = await CarbonMarketplace.deploy(ctAddress, usdtAddress, deployer.address, deployer.address);
  await marketplace.waitForDeployment();
  const marketAddress = await marketplace.getAddress();

  console.log(`   ✅ Contracts Deployed!`);
  console.log(`      CarbonToken: ${ctAddress}`);
  console.log(`      USDT:        ${usdtAddress}`);
  console.log(`      Marketplace: ${marketAddress}\n`);

  // Update contract config file automatically
  const configPath = path.join(__dirname, '..', 'src', 'contracts', 'contractConfig.ts');
  let configStr = fs.readFileSync(configPath, 'utf8');
  configStr = configStr.replace(/export const CARBON_TOKEN_ADDRESS: string = '0x[0-9a-fA-F]+';/, `export const CARBON_TOKEN_ADDRESS: string = '${ctAddress}';`);
  configStr = configStr.replace(/export const MOCK_USDT_ADDRESS: string = '0x[0-9a-fA-F]+';/, `export const MOCK_USDT_ADDRESS: string = '${usdtAddress}';`);
  configStr = configStr.replace(/export const MARKETPLACE_ADDRESS: string = '0x[0-9a-fA-F]+';/, `export const MARKETPLACE_ADDRESS: string = '${marketAddress}';`);
  fs.writeFileSync(configPath, configStr);

  // 3️⃣ FUND WALLETS
  console.log("3️⃣ Funding Wallets...");
  
  const USDTDeployer = await hre.ethers.getContractAt("MockUSDT", usdtAddress, deployer);
  const USDTBuyer = await hre.ethers.getContractAt("MockUSDT", usdtAddress, buyer);

  // Wallet 2 (Buyer) gets USDT + ETH
  await (await USDTDeployer.mint(WALLET_2, parseUnits("1000000", 6))).wait();
  await (await deployer.sendTransaction({ to: WALLET_2, value: parseUnits("10", 18) })).wait();
  // Pre-approve marketplace for Buyer
  await (await USDTBuyer.approve(marketAddress, MaxUint256)).wait();

  // Wallet 3 (Seller) gets ETH
  await (await deployer.sendTransaction({ to: WALLET_3, value: parseUnits("10", 18) })).wait();

  console.log("   ✅ Wallets funded\n");

  // 4️⃣ FETCH LISTINGS & MINT TOKENS TO SELLER (Wallet 3)
  console.log("4️⃣ Minting Tokens to Wallet 3 (Seller)...");
  const { data: listings } = await supabase.from("LISTINGS").select("*, PROJECT_VINTAGES(*, PROJECTS(*))").eq("listing_status", "ACTIVE").eq("seller_wallet_id", 3);
  if (!listings) return;

  const CTokenDeployer = await hre.ethers.getContractAt("CarbonToken", ctAddress, deployer);
  const CTokenSeller = await hre.ethers.getContractAt("CarbonToken", ctAddress, seller);
  const MarketSeller = await hre.ethers.getContractAt("CarbonMarketplace", marketAddress, seller);

  let onchainId = 0;
  for (const item of listings as any[]) {
    const v = item.PROJECT_VINTAGES;
    const p = v.PROJECTS;
    
    // Generate fresh unique token IDs
    const newTokenId = Math.floor(Date.now() / 1000) + item.listing_id + Math.floor(Math.random() * 1000);
    const newVintageYear = 2000 + item.listing_id; // Unique year to avoid contract conflicts
    const uniqueCid = `QMSYNC-${newTokenId}-${item.listing_id}`;

    console.log(`   🪙 Minting Vintage ${v.project_vintage_id} (Project ${p.project_code})`);
    
    // Wallet 1 (deployer) mints to Wallet 3 (seller.address)
    await (await CTokenDeployer.mintProjectYearBatchSoft([{
      to: seller.address,
      tokenId: newTokenId,
      projectId: p.project_code,
      serialId: `SN-${item.listing_id}`,
      vintageYear: newVintageYear,
      amount: item.listed_amount,
      cid: uniqueCid
    }])).wait();

    console.log(`      ✅ Minted TokenID: ${newTokenId} directly to Seller (Wallet 3). Balance: ${await CTokenDeployer.balanceOf(seller.address, newTokenId)}`);

    // Wallet 3 Approves marketplace
    await (await CTokenSeller.setApprovalForAll(marketAddress, true)).wait();

    // Wallet 3 Lists on marketplace
    const priceWei = parseUnits(item.price_per_unit.toString(), 6);
    await (await MarketSeller.createListing(newTokenId, priceWei, item.listed_amount)).wait();
    console.log(`      ✅ Listed on Marketplace! ListingID: ${onchainId}`);

    // Update Supabase with NEW tokenId, vintageYear, and onchain listing ID
    await supabase.from("PROJECT_VINTAGES").update({ 
      token_id: newTokenId,
      vintage_year: newVintageYear // Must match blockchain for strict buy validation
    }).eq("project_vintage_id", v.project_vintage_id);

    await supabase.from("LISTINGS").update({
      onchain_listing_id: onchainId
    }).eq("listing_id", item.listing_id);

    onchainId++;
  }

  console.log("\n==================================================");
  console.log("🎉 DONE! BLOCKCHAIN IS READY VÀ SUPABASE ĐÃ ĐƯỢC CẬP NHẬT!");
  console.log("==================================================");
}

main().catch(console.error);
