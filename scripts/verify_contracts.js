import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  const MARKETPLACE = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
  const CARBON_TOKEN = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

  console.log("--- CONTRACT VERIFICATION ---");
  
  const marketplace = await ethers.getContractAt("CarbonMarketplace", MARKETPLACE);
  
  try {
    const fee = await marketplace.FIXED_FEE_BPS();
    console.log(`Address ${MARKETPLACE} is a Marketplace. Fee BPS: ${fee}`);
    
    const tokenAddr = await marketplace.carbonToken();
    console.log(`Marketplace points to CarbonToken at: ${tokenAddr}`);
    
    if (tokenAddr.toLowerCase() !== CARBON_TOKEN.toLowerCase()) {
      console.log("!!! MISMATCH: Marketplace points to different token.");
    }
  } catch(e) {
    console.log(`Address ${MARKETPLACE} is NOT the expected Marketplace contract: ${e.message}`);
  }

  const token = await ethers.getContractAt("CarbonToken", CARBON_TOKEN);
  try {
    const exists = await token.tokenExists(12025);
    console.log(`Address ${CARBON_TOKEN} is a CarbonToken. Token 12025 exists: ${exists}`);
  } catch(e) {
    console.log(`Address ${CARBON_TOKEN} is NOT the expected CarbonToken contract: ${e.message}`);
  }
}

main().catch(console.error);
