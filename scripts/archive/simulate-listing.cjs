const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const marketplaceAddr = "0xF968995D66e80abf90C7F9c925cf0B78e49534dc";
  const Marketplace = await ethers.getContractAt("CarbonMarketplace", marketplaceAddr);
  
  const Ent1 = "0xA57c11E33a76AC1706E774E65eFE622d0ED24bf0";
  // The token we know they have: 422024 (Balance 1145) from previous check
  const tokenIds = [422024];
  const prices = [ethers.parseUnits("1", 6)]; // 1 USDT
  const amounts = [10]; // Listing 10 tokens
  
  console.log(`Simulating createListingsBatch from ${Ent1}...`);
  try {
    const data = Marketplace.interface.encodeFunctionData("createListingsBatch", [tokenIds, prices, amounts]);
    
    // eth_call to see if it reverts
    const result = await ethers.provider.call({
      to: marketplaceAddr,
      from: Ent1,
      data: data
    });
    console.log("Simulation Result:", result);
    console.log("No revert!");
  } catch (error) {
    console.error("Simulation Reverted!");
    console.error(error.message);
  }
}

main().catch(console.error);
