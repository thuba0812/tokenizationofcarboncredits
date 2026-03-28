const hre = require("hardhat");
const { formatUnits, parseUnits } = require("ethers");

async function main() {
  const USDT_ADDRESS = "0xFD2Cf3b56a73c75A7535fFe44EBABe7723c64719";
  const MARKET_ADDRESS = "0x666D0c3da3dBc946D5128D06115bb4eed4595580";
  const WALLET_2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  const WALLET_3 = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

  const [deployer] = await hre.ethers.getSigners();
  const usdt = await hre.ethers.getContractAt("MockUSDT", USDT_ADDRESS, deployer);
  const market = await hre.ethers.getContractAt("CarbonMarketplace", MARKET_ADDRESS, deployer);

  console.log("========================================");
  console.log("🔍 FINAL VERIFICATION (V5)");
  console.log("========================================\n");

  const b2 = await usdt.balanceOf(WALLET_2);
  const b3 = await usdt.balanceOf(WALLET_3);
  console.log(`Wallet 2 Balance: ${formatUnits(b2, 6)} USDT`);
  console.log(`Wallet 3 Balance: ${formatUnits(b3, 6)} USDT`);

  const listing = await market.getListing(1);
  console.log("\nOn-chain Listing ID 1 Details:");
  console.log(`   Seller: ${listing.seller}`);
  console.log(`   TokenId: ${listing.tokenId}`);
  console.log(`   Price: ${formatUnits(listing.pricePerUnit, 6)} USDT`);
  console.log(`   Amount: ${listing.availableAmount}`);
  console.log(`   Active: ${listing.active}`);

  if (formatUnits(b2, 6) === "1000000.0" && listing.active === true) {
    console.log("\n✅ ALL CHECKS PASSED!");
  } else {
    console.log("\n❌ CHECKS FAILED! Balance or listing mismatch.");
  }
}

main().catch(console.error);
