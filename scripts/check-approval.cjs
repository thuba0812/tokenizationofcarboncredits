const hre = require("hardhat");

async function main() {
  const marketplaceAddr = "0xF968995D66e80abf90C7F9c925cf0B78e49534dc";
  const tokenAddr = "0x53fF7837667a7158AFCAf3e93e3BCd9eD5bd0c8F";
  const Token = await hre.ethers.getContractAt("CarbonToken", tokenAddr);
  
  const wallets = [
    "0xA57c11E33a76AC1706E774E65eFE622d0ED24bf0", // Ent 1
    "0x86914E269fb759EB1fFEb16e3a2e56Bf02852aef"  // Ent 2
  ];

  for (const w of wallets) {
     const approved = await Token.isApprovedForAll(w, marketplaceAddr);
     console.log(`Wallet ${w} approved marketplace: ${approved}`);
  }
}

main().catch(console.error);
