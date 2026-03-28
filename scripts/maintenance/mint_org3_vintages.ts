import hre from "hardhat";

async function main() {
  const CARBON_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const TARGET_WALLET = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

  console.log("========================================");
  console.log("🛠️  RESTORING MINTED TOKENS FOR ORG 3");
  console.log(`📡 Wallet: ${TARGET_WALLET}`);
  console.log("========================================\n");

  const [deployer] = await hre.ethers.getSigners();
  const CarbonToken = await hre.ethers.getContractAt("CarbonToken", CARBON_TOKEN_ADDRESS, deployer);

  // 1. Set Quota first
  console.log("1️⃣  Setting On-chain Quota to 4,200...");
  const quotaTx = await (CarbonToken as any).setEnterpriseQuota(TARGET_WALLET, 4200);
  await quotaTx.wait();
  console.log("   ✅ Quota set.\n");

  // 2. Mint Vintages (30, 31, 32)
  console.log("2️⃣  Minting 3 Vintages...");
  const mintItems = [
    {
      to: TARGET_WALLET,
      tokenId: 30,
      projectId: "PRJ-ENT002",
      serialId: "CRD-ENT002-2024-001",
      vintageYear: 2024,
      amount: 980,
      cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-30"
    },
    {
      to: TARGET_WALLET,
      tokenId: 31,
      projectId: "PRJ-ENT002",
      serialId: "CRD-ENT002-2025-001",
      vintageYear: 2025,
      amount: 1200,
      cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-31"
    },
    {
      to: TARGET_WALLET,
      tokenId: 32,
      projectId: "PRJ-ENT002",
      serialId: "CRD-ENT002-2026-001",
      vintageYear: 2026,
      amount: 1500,
      cid: "QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsBnE-32"
    }
  ];

  const mintTx = await (CarbonToken as any).mintProjectYearBatchSoft(mintItems);
  await mintTx.wait();
  console.log("   ✅ Tokens minted successfully!\n");

  console.log("========================================");
  console.log("🎉 ORG 3 SYNC COMPLETED!");
  console.log("========================================\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
