import hre from "hardhat";
import { createClient } from "@supabase/supabase-js";
import { parseUnits } from "ethers";

// ─── Config ─────────────────────────────────────────────
const CARBON_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const MARKETPLACE_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const MOCK_USDT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const DUMMY_TOKEN_ID = 999999;

const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("========================================");
  console.log("🔄 FIX ALL (PADDED): Sync Blockchain ← Supabase");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS, deployer);
  const Marketplace = await hre.ethers.getContractAt("CarbonMarketplace", MARKETPLACE_ADDRESS, deployer);
  const MockUSDT = await hre.ethers.getContractAt("MockUSDT", MOCK_USDT_ADDRESS, deployer);

  // ═══════════════════════════════════════════════════
  // STEP 1: Mint MINTED tokens + Dummy Token
  // ═══════════════════════════════════════════════════
  const { data: vintages } = await supabase
    .from("PROJECT_VINTAGES")
    .select("project_vintage_id, vintage_year, credit_code, issued_creadit_amount, token_id, PROJECTS!inner(project_code, ORGANIZATIONS!inner(WALLETS!inner(wallet_address)))")
    .eq("status", "MINTED");

  const mintItems: any[] = [];
  
  if (vintages) {
    for (const vintage of vintages as any[]) {
      const tokenId = Number(vintage.token_id || vintage.project_vintage_id);
      if (await CarbonToken.tokenExists(tokenId)) continue;

      const orgs = vintage.PROJECTS?.ORGANIZATIONS;
      const wallets = Array.isArray(orgs) ? orgs[0]?.WALLETS : orgs?.WALLETS;
      const walletAddress = Array.isArray(wallets) ? wallets[0]?.wallet_address : wallets?.wallet_address;

      if (walletAddress) {
        mintItems.push({
          to: walletAddress,
          tokenId: tokenId,
          projectId: vintage.PROJECTS.project_code || "PRJ-UNKNOWN",
          serialId: vintage.credit_code || `CRD-${tokenId}`,
          vintageYear: Number(vintage.vintage_year) || 2024,
          amount: Number(vintage.issued_creadit_amount) || 10000,
          cid: `QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-${tokenId}`,
        });
      }
    }
  }

  // Add dummy token for padding
  if (!(await CarbonToken.tokenExists(DUMMY_TOKEN_ID))) {
    mintItems.push({
      to: deployer.address,
      tokenId: DUMMY_TOKEN_ID,
      projectId: "PRJ-DUMMY",
      serialId: "CRD-DUMMY",
      vintageYear: 2024,
      amount: 100000, // Lots of dummy tokens
      cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE",
    });
  }

  if (mintItems.length > 0) {
    console.log(`🔨 Minting ${mintItems.length} token(s)...`);
    const mintTx = await CarbonToken.mintProjectYearBatchSoft(mintItems);
    await mintTx.wait();
  }

  // ═══════════════════════════════════════════════════
  // STEP 2: Create listed items WITH PADDING
  // ═══════════════════════════════════════════════════
  const { data: listings } = await supabase
    .from("LISTINGS")
    .select("listing_id, project_vintage_id, price_per_unit, listed_amount, WALLETS!fk_listings_seller_wallet(wallet_address), PROJECT_VINTAGES!inner(token_id)")
    .eq("listing_status", "ACTIVE")
    .order("listing_id", { ascending: true });

  if (listings && listings.length > 0) {
    const listingMap = new Map();
    let maxListingId = 0;

    for (const l of listings as any[]) {
      const id = Number(l.listing_id);
      listingMap.set(id, l);
      if (id > maxListingId) maxListingId = id;
    }

    console.log(`\n📦 Found ${listings.length} ACTIVE listings. Max DB ID is ${maxListingId}. Aligning on-chain state...`);

    // Prepare deployer for dummy padding
    const isDeployerApproved = await (CarbonToken as any).isApprovedForAll(deployer.address, MARKETPLACE_ADDRESS);
    if (!isDeployerApproved) {
      await (await (CarbonToken as any).setApprovalForAll(MARKETPLACE_ADDRESS, true)).wait();
    }

    let currentNext = Number(await Marketplace.nextListingId());

    for (let targetId = currentNext; targetId <= maxListingId; targetId++) {
      if (listingMap.has(targetId)) {
        // Create REAL listing
        const l = listingMap.get(targetId);
        const tokenId = Number(l.PROJECT_VINTAGES?.token_id || l.project_vintage_id);
        const price = parseUnits(String(l.price_per_unit), 6);
        const amount = Number(l.listed_amount);
        const wallets = l.WALLETS;
        const sellerAddress = Array.isArray(wallets) ? wallets[0]?.wallet_address : wallets?.wallet_address;

        if (sellerAddress) {
          await hre.network.provider.request({ method: "hardhat_impersonateAccount", params: [sellerAddress] });
          await deployer.sendTransaction({ to: sellerAddress, value: hre.ethers.parseEther("1.0") });
          const sellerSigner = await hre.ethers.getSigner(sellerAddress);
          
          const carbonTokenAsSeller = CarbonToken.connect(sellerSigner);
          if (!(await (carbonTokenAsSeller as any).isApprovedForAll(sellerAddress, MARKETPLACE_ADDRESS))) {
            await (await (carbonTokenAsSeller as any).setApprovalForAll(MARKETPLACE_ADDRESS, true)).wait();
          }

          const tx = await (Marketplace as any).connect(sellerSigner).createListing(tokenId, price, amount);
          await tx.wait();
          console.log(`   ✅ REAL Created on-chain ID: ${targetId} matches DB listing_id ${l.listing_id} (Token: ${tokenId}, Seller: ${sellerAddress.slice(0, 6)}...)`);
          
          await hre.network.provider.request({ method: "hardhat_stopImpersonatingAccount", params: [sellerAddress] });
        }
      } else {
        // Create DUMMY listing and CANCEL it
        const tx = await Marketplace.createListing(DUMMY_TOKEN_ID, 1000000, 1);
        await tx.wait();
        // Cancel it so it doesn't stay active
        const cancelTx = await Marketplace.cancelListing(targetId);
        await cancelTx.wait();
        console.log(`   🔸 PADDING: Created and cancelled dummy listing for on-chain ID: ${targetId}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // STEP 3: Mint test USDT
  // ═══════════════════════════════════════════════════
  console.log("\n3️⃣  Minting 100,000 test USDT for buyer accounts...");
  const { data: allWallets } = await supabase.from("WALLETS").select("wallet_address");
  if (allWallets) {
    for (const w of allWallets as any[]) {
      const addr = w.wallet_address;
      if (addr && Number(await MockUSDT.balanceOf(addr)) === 0) {
        try {
          await (await MockUSDT.mint(addr, parseUnits("100000", 6))).wait();
        } catch {}
      }
    }
  }

  console.log("\n========================================");
  console.log("🎉 ALIGNMENT COMPLETED!");
  console.log("Blockchain listing IDs now EXACTLY match your database!");
  console.log("========================================\n");
}

main().catch(console.error);
