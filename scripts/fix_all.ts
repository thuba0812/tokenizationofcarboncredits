import hre from "hardhat";
import { createClient } from "@supabase/supabase-js";
import { parseUnits } from "ethers";

// ─── Config ─────────────────────────────────────────────
const CARBON_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const MARKETPLACE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const MOCK_USDT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("========================================");
  console.log("🔄 FIX ALL: Sync Blockchain ← Supabase");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS, deployer);
  const Marketplace = await hre.ethers.getContractAt("CarbonMarketplace", MARKETPLACE_ADDRESS, deployer);
  const MockUSDT = await hre.ethers.getContractAt("MockUSDT", MOCK_USDT_ADDRESS, deployer);

  // ═══════════════════════════════════════════════════
  // STEP 1: Mint all MINTED tokens from Supabase
  // ═══════════════════════════════════════════════════
  console.log("1️⃣  Fetching MINTED vintages from Supabase...");
  const { data: vintages, error: vintageError } = await supabase
    .from("PROJECT_VINTAGES")
    .select(`
      project_vintage_id,
      vintage_year,
      credit_code,
      issued_creadit_amount,
      token_id,
      PROJECTS!inner (
        project_code,
        ORGANIZATIONS!inner (
          WALLETS!inner ( wallet_address )
        )
      )
    `)
    .eq("status", "MINTED");

  if (vintageError || !vintages) {
    console.error("❌ Failed to fetch vintages:", vintageError || "No data");
    return;
  }

  console.log(`   Found ${vintages.length} MINTED vintage(s) in DB.`);

  if (vintages.length > 0) {
    const mintItems: any[] = [];
    
    for (const vintage of vintages as any[]) {
      const tokenId = Number(vintage.token_id || vintage.project_vintage_id);
      
      const exists = await CarbonToken.tokenExists(tokenId);
      if (exists) {
        console.log(`   ⏭️  Token ID ${tokenId} already exists on chain. Skipping.`);
        continue;
      }

      const orgs = vintage.PROJECTS?.ORGANIZATIONS;
      const wallets = Array.isArray(orgs) ? orgs[0]?.WALLETS : orgs?.WALLETS;
      const walletAddress = Array.isArray(wallets) ? wallets[0]?.wallet_address : wallets?.wallet_address;

      if (!walletAddress) {
        console.log(`   ⚠️  No wallet found for vintage ${tokenId}. Skipping.`);
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
        cid: `QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-${tokenId}`,
      });
    }

    if (mintItems.length > 0) {
      console.log(`\n   🔨 Minting ${mintItems.length} token(s)...`);
      const mintTx = await CarbonToken.mintProjectYearBatchSoft(mintItems);
      await mintTx.wait();
      console.log("   ✅ All tokens minted successfully!\n");
      
      for (const item of mintItems) {
        console.log(`      Minted ${item.amount} of Token ID ${item.tokenId} → ${item.to}`);
      }
    } else {
      console.log("   No new tokens to mint.");
    }
  }

  // ═══════════════════════════════════════════════════
  // STEP 2: Create listings on-chain matching Supabase
  // ═══════════════════════════════════════════════════
  console.log("\n2️⃣  Fetching ACTIVE listings from Supabase...");
  const { data: listings, error: listingError } = await supabase
    .from("LISTINGS")
    .select(`
      listing_id,
      project_vintage_id,
      price_per_unit,
      listed_amount,
      seller_wallet_id,
      WALLETS!fk_listings_seller_wallet ( wallet_address ),
      PROJECT_VINTAGES!inner (
        token_id,
        project_vintage_id
      )
    `)
    .eq("listing_status", "ACTIVE")
    .order("listing_id", { ascending: true });

  if (listingError || !listings) {
    console.error("❌ Failed to fetch listings:", listingError || "No data");
    return;
  }

  console.log(`   Found ${listings.length} ACTIVE listing(s) in DB.`);

  if (listings.length === 0) {
    console.log("   No listings to sync. Done!");
    return;
  }

  // We need to create listings on-chain in the exact order so listing IDs match
  // On-chain listingId starts from 1 and increments
  const currentNextListingId = Number(await Marketplace.nextListingId());
  console.log(`   On-chain nextListingId = ${currentNextListingId}`);

  for (const listing of listings as any[]) {
    const dbListingId = Number(listing.listing_id);
    const tokenId = Number(listing.PROJECT_VINTAGES?.token_id || listing.project_vintage_id);
    const price = parseUnits(String(listing.price_per_unit), 6); // USDT 6 decimals
    const amount = Number(listing.listed_amount);
    const wallets = listing.WALLETS;
    const sellerAddress = Array.isArray(wallets) ? wallets[0]?.wallet_address : wallets?.wallet_address;

    if (!sellerAddress) {
      console.log(`   ⚠️  No seller wallet for listing ${dbListingId}. Skipping.`);
      continue;
    }

    console.log(`\n   📦 Listing #${dbListingId}: Token ${tokenId}, ${amount} units @ ${listing.price_per_unit} USDT`);
    console.log(`      Seller: ${sellerAddress}`);

    // Check if seller has enough balance
    const sellerBalance = await CarbonToken.balanceOf(sellerAddress, tokenId);
    console.log(`      Seller balance: ${sellerBalance}`);

    if (Number(sellerBalance) < amount) {
      console.log(`      ⚠️  Seller doesn't have enough tokens (has ${sellerBalance}, needs ${amount}). Skipping.`);
      continue;
    }

    // Impersonate seller account
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [sellerAddress],
    });

    // Fund the impersonated account with ETH for gas
    await deployer.sendTransaction({
      to: sellerAddress,
      value: hre.ethers.parseEther("1.0"),
    });

    const sellerSigner = await hre.ethers.getSigner(sellerAddress);

    // Approve marketplace for CarbonToken
    const carbonTokenAsSeller = CarbonToken.connect(sellerSigner);
    const isApproved = await carbonTokenAsSeller.isApprovedForAll(sellerAddress, MARKETPLACE_ADDRESS);
    if (!isApproved) {
      console.log(`      🔑 Approving marketplace...`);
      const approveTx = await carbonTokenAsSeller.setApprovalForAll(MARKETPLACE_ADDRESS, true);
      await approveTx.wait();
    }

    // Create listing on marketplace
    const marketplaceAsSeller = Marketplace.connect(sellerSigner);
    const tx = await marketplaceAsSeller.createListing(tokenId, price, amount);
    const receipt = await tx.wait();
    
    // Get the on-chain listing ID from the event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = Marketplace.interface.parseLog(log);
        return parsed?.name === "ListingCreated";
      } catch { return false; }
    });
    
    if (event) {
      const parsed = Marketplace.interface.parseLog(event);
      const onChainId = Number(parsed?.args?.listingId);
      console.log(`      ✅ Created on-chain listing ID: ${onChainId} (DB listing_id: ${dbListingId})`);
      
      if (onChainId !== dbListingId) {
        console.log(`      ⚠️  WARNING: On-chain ID ${onChainId} ≠ DB ID ${dbListingId}. Buy may fail!`);
      }
    }

    // Stop impersonating
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [sellerAddress],
    });
  }

  // ═══════════════════════════════════════════════════
  // STEP 3: Mint USDT for buyer account (for testing)
  // ═══════════════════════════════════════════════════
  console.log("\n3️⃣  Minting test USDT for buyer accounts...");
  
  // Fetch all wallets that could be buyers
  const { data: allWallets, error: walletError } = await supabase
    .from("WALLETS")
    .select("wallet_address");
    
  if (!walletError && allWallets) {
    for (const w of allWallets as any[]) {
      const addr = w.wallet_address;
      if (addr) {
        const balance = await MockUSDT.balanceOf(addr);
        if (Number(balance) === 0) {
          // Mint 100,000 USDT for testing
          const mintAmount = parseUnits("100000", 6);
          try {
            const tx = await MockUSDT.mint(addr, mintAmount);
            await tx.wait();
            console.log(`   💰 Minted 100,000 USDT to ${addr}`);
          } catch (err: any) {
            console.log(`   ⚠️  Could not mint USDT to ${addr}: ${err.message?.slice(0, 80)}`);
          }
        } else {
          console.log(`   ✅ ${addr} already has USDT balance.`);
        }
      }
    }
  }

  console.log("\n========================================");
  console.log("🎉 FIX ALL COMPLETED!");
  console.log("========================================");
  console.log("Bạn có thể quay lại Web:");
  console.log("  - Mua token (Buy) trên Marketplace");
  console.log("  - Tiêu hủy token (Retire/Burn)");
  console.log("========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
