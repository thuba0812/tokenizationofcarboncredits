import hre from "hardhat";

const CARBON_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const BUYER_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

async function main() {
  console.log("--- ON-CHAIN DIAGNOSTIC ---");
  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS);

  const tokenIds = [12023, 12024, 12025, 12026, 22023, 22024, 22025, 22026, 32022, 32023, 32024, 32025];
  
  for (const id of tokenIds) {
    const exists = await CarbonToken.tokenExists(id);
    const balance = await CarbonToken.balanceOf(BUYER_WALLET, id);
    console.log(`Token ID ${id}: Exists=${exists}, Balance(Buyer)=${balance}`);
  }
}

main().catch(console.error);
