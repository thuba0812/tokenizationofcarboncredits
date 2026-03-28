import { parseUnits, MaxUint256 } from "ethers";
const MOCK_USDT_ADDRESS = "0x5f3f1dBD7B74C6B46e8c44f98792A1dAf8d69154";
const MARKETPLACE_ADDRESS = "0xCD8a1C3ba11CF5ECfa6267617243239504a98d90";
const USDT_DECIMALS = 6;

async function main() {
  const signers = await hre.ethers.getSigners();
  const MockUSDT = await hre.ethers.getContractAt("MockUSDT", MOCK_USDT_ADDRESS, signers[0]);

  for (const signer of signers) {
    const targetWallet = signer.address;
    console.log("========================================");
    console.log("💰 FUNDING WALLET: " + targetWallet);
    console.log("========================================\n");

    // 1. Send ETH
    console.log("1️⃣  Sending 10 ETH for gas...");
    const ethAmount = parseUnits("10", 18);
    const txEth = await signers[0].sendTransaction({
      to: targetWallet,
      value: ethAmount
    });
    await txEth.wait();
    console.log("   ✅ ETH Sent! Hash: " + txEth.hash);

    // 2. Mint USDT
    console.log("\n2️⃣  Minting 1,000,000 USDT...");
    const usdtAmount = parseUnits("1000000", USDT_DECIMALS);
    const txUsdt = await MockUSDT.mint(targetWallet, usdtAmount);
    await txUsdt.wait();
    // 3. Pre-approve Marketplace (to avoid Spend Limit popup in UI)
    console.log("\n3️⃣  Pre-approving Marketplace...");
    const txApprove = await MockUSDT.connect(signer).approve(MARKETPLACE_ADDRESS, MaxUint256);
    await txApprove.wait();
    console.log("   ✅ Marketplace pre-approved! Hash: " + txApprove.hash);
  }

  console.log("\n========================================");
  console.log("🎉 ALL WALLETS FUNDED SUCCESSFULLY!");
  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
