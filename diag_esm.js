import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  const MARKETPLACE = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
  const CARBON_TOKEN = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
  const sellerAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  console.log("--- ESM DIAGNOSTICS ---");
  const token = await ethers.getContractAt("CarbonToken", CARBON_TOKEN);
  const marketplace = await ethers.getContractAt("CarbonMarketplace", MARKETPLACE);

  const tokenId = 12025;

  try {
    const exists = await token.tokenExists(tokenId);
    console.log(`Token ${tokenId} exists: ${exists}`);
    
    const bal = await token.balanceOf(sellerAddr, tokenId);
    console.log(`Seller balance of ${tokenId}: ${bal.toString()}`);

    const isApp = await token.isApprovedForAll(sellerAddr, MARKETPLACE);
    console.log(`Is Marketplace approved: ${isApp}`);

    const marketTokenAddr = await marketplace.carbonToken();
    console.log(`Marketplace expects CarbonToken at: ${marketTokenAddr}`);
    
    if (marketTokenAddr.toLowerCase() !== CARBON_TOKEN.toLowerCase()) {
      console.log("!!! ADDRESS MISMATCH: Marketplace refers to a different CarbonToken contract.");
    }

  } catch (e) {
    console.log("Error during check:", e.message);
  }
}

main().catch(console.error);
