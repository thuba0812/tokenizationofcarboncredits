import hre from "hardhat";

const CARBON_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const BUYER_WALLET = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

async function main() {
  console.log("========================================");
  console.log("🛠️  MOCKING TOKENS FOR BURN TEST");
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS, deployer);

  const items = [
    { to: BUYER_WALLET, tokenId: 12023, projectId: "PRJ-1", serialId: "CRD-2023-1", vintageYear: 2023, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-1" },
    { to: BUYER_WALLET, tokenId: 12024, projectId: "PRJ-1", serialId: "CRD-2024-1", vintageYear: 2024, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-2" },
    { to: BUYER_WALLET, tokenId: 12025, projectId: "PRJ-1", serialId: "CRD-2025-1", vintageYear: 2025, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-3" },
    { to: BUYER_WALLET, tokenId: 12026, projectId: "PRJ-1", serialId: "CRD-2026-1", vintageYear: 2026, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-4" },
    { to: BUYER_WALLET, tokenId: 22023, projectId: "PRJ-2", serialId: "CRD-2023-2", vintageYear: 2023, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-5" },
    { to: BUYER_WALLET, tokenId: 22024, projectId: "PRJ-2", serialId: "CRD-2024-2", vintageYear: 2024, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-6" },
    { to: BUYER_WALLET, tokenId: 22025, projectId: "PRJ-2", serialId: "CRD-2025-2", vintageYear: 2025, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-7" },
    { to: BUYER_WALLET, tokenId: 22026, projectId: "PRJ-2", serialId: "CRD-2026-2", vintageYear: 2026, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-8" },
    { to: BUYER_WALLET, tokenId: 32022, projectId: "PRJ-3", serialId: "CRD-2022-3", vintageYear: 2022, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-9" },
    { to: BUYER_WALLET, tokenId: 32023, projectId: "PRJ-3", serialId: "CRD-2023-3", vintageYear: 2023, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-10" },
    { to: BUYER_WALLET, tokenId: 32024, projectId: "PRJ-3", serialId: "CRD-2024-3", vintageYear: 2024, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-11" },
    { to: BUYER_WALLET, tokenId: 32025, projectId: "PRJ-3", serialId: "CRD-2025-3", vintageYear: 2025, amount: 5000, cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-12" },
  ];

  console.log(`🔨 Minting ${items.length} tokens to ${BUYER_WALLET}...`);
  
  try {
    const tx = await CarbonToken.mintProjectYearBatchSoft(items);
    await tx.wait();
    console.log("✅ Tokens successfully minted! You can now test the Burn function.");
  } catch (error) {
    console.error("❌ Failed to mint tokens:", error);
  }
}

main().catch(console.error);
