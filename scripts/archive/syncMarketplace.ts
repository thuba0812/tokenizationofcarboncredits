import hre from "hardhat";
import "@nomicfoundation/hardhat-ethers";
import { createClient } from "@supabase/supabase-js";
import { parseUnits } from "ethers";

// --- Contract addresses (current running node) ---
const CARBON_TOKEN_ADDRESS = "0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575";
const MARKETPLACE_ADDRESS = "0xCD8a1C3ba11CF5ECfa6267617243239504a98d90";
const USDT_DECIMALS = 6;

const supabaseUrl = "";
const supabaseKey = "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("========================================");
  console.log("🏪 SYNC: Supabase LISTINGS -> Blockchain");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}\n`);

  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS, deployer);
  const Marketplace = await hre.ethers.getContractAt("CarbonMarketplace", MARKETPLACE_ADDRESS, deployer);

  // 1. Fetch all ACTIVE listings from Supabase
  console.log("1️⃣  Fetching ACTIVE listings from Supabase...");
  const { data: listings, error } = await supabase
    .from("LISTINGS")
    .select(`
      listing_id,
      project_vintage_id,
      price_per_unit,
      listed_amount,
      listing_status,
      PROJECT_VINTAGES (
        project_vintage_id,
        token_id,
        vintage_year,
        credit_code,
        issued_creadit_amount,
        status,
        PROJECTS ( project_code, project_name )
      )
    `)
    .eq("listing_status", "ACTIVE")
    .gt("listed_amount", 0);

  if (error || !listings || listings.length === 0) {
    console.error("❌ No active listings found or error:", error?.message || "No data");
    return;
  }

  console.log(`   ✅ Found ${listings.length} active listing(s) in Supabase.\n`);

  let created = 0;
  let skipped = 0;

  for (const item of listings as any[]) {
    const listingId = Number(item.listing_id);
    const vintage = item.PROJECT_VINTAGES;
    
    if (!vintage) {
      console.log(`   ⚠️  Listing ${listingId} has no vintage data. Skipping.`);
      skipped++;
      continue;
    }

    const tokenId = Number(vintage.token_id);
    const amount = Number(item.listed_amount);
    const price = Number(item.price_per_unit);
    const projectCode = vintage.PROJECTS?.project_code || "UNKNOWN";

    console.log(`\n📡 Listing ${listingId} | Token ${tokenId} | Project ${projectCode} | Qty ${amount} | Price ${price} USDT`);

    // 2. Check if this listing already exists on-chain (by iterating nextListingId)
    //    The blockchain auto-increments listing IDs from 1, so if the DB listing_id
    //    is higher than what's on-chain, we need to create it.
    try {
      const onChain = await Marketplace.getListing(listingId);
      if (onChain.active) {
        console.log(`   ⏭️  Already active on-chain. Skipping.`);
        skipped++;
        continue;
      }
    } catch {
      // Listing ID not found — proceed to create
    }

    // 3. Ensure token exists on-chain (mint if missing)
    const tokenExists = await CarbonToken.tokenExists(tokenId);
    if (!tokenExists) {
      console.log(`   🪙  Token ${tokenId} not on-chain. Minting...`);
      try {
        const tx = await CarbonToken.mintProjectYearBatchSoft([{
          to: deployer.address,
          tokenId: tokenId,
          projectId: projectCode,
          serialId: vintage.credit_code || `${projectCode}-SYNC`,
          vintageYear: Number(vintage.vintage_year),
          amount: amount,
          cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE"
        }]);
        await tx.wait();
        console.log(`   ✅ Token ${tokenId} minted.`);
      } catch (err: any) {
        console.error(`   ❌ Mint failed: ${err.reason || err.message}`);
        skipped++;
        continue;
      }
    } else {
      // Check deployer balance
      const balance = await CarbonToken.balanceOf(deployer.address, tokenId);
      const balanceNum = Number(balance);
      if (balanceNum < amount) {
        console.log(`   🪙  Deployer only has ${balanceNum} tokens. Minting ${amount - balanceNum} more...`);
        // Can't mint more of an existing tokenId — skip
        console.log(`   ⚠️  Cannot mint existing token ID. Skipping.`);
        skipped++;
        continue;
      }
    }
    
    // 4. Approve marketplace
    const isApproved = await CarbonToken.isApprovedForAll(deployer.address, MARKETPLACE_ADDRESS);
    if (!isApproved) {
      console.log(`   🔓 Approving Marketplace for CarbonToken...`);
      const approveTx = await CarbonToken.setApprovalForAll(MARKETPLACE_ADDRESS, true);
      await approveTx.wait();
      console.log(`   ✅ Approved.`);
    }

    // 5. Create listing on-chain
    const priceInSmallestUnit = parseUnits(price.toString(), USDT_DECIMALS);
    console.log(`   📝 Creating listing on-chain...`);
    try {
      const tx = await Marketplace.createListing(tokenId, priceInSmallestUnit, amount);
      await tx.wait();
      const nextId = Number(await Marketplace.nextListingId()) - 1;
      console.log(`   ✅ Created! On-chain Listing ID: ${nextId}`);
      created++;
    } catch (err: any) {
      console.error(`   ❌ Failed: ${err.reason || err.message}`);
      skipped++;
    }
  }

  console.log(`\n========================================`);
  console.log(`🎉 SYNC COMPLETED! Created: ${created} | Skipped: ${skipped}`);
  console.log(`========================================`);
  console.log(`\n⚠️  NOTE: On-chain listing IDs start from 1 and auto-increment.`);
  console.log(`   They may NOT match Supabase listing_ids.`);
  console.log(`   The buy flow uses Supabase listing_ids, so a mismatch is expected.`);
  console.log(`   The safest fix is to update Supabase listing_ids to match on-chain.`);
}

main().catch(console.error);
