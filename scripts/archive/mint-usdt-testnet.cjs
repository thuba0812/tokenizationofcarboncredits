const hre = require("hardhat");

async function main() {
  console.log("Đang kết nối tới Sepolia...");
  
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  console.log("Account sử dụng phí gas:", deployer.address);

  // Addresses
  const ent1Address = "0xA57c11E33a76AC1706E774E65eFE622d0ED24bf0";
  const ent2Address = "0x86914E269fb759EB1fFEb16e3a2e56Bf02852aef";

  // MockUSDT Address on Sepolia (from previous deploy)
  const usdtAddress = "0xA20192c45deFB2FeB44a396c6Cef4a073cA296aB";
  
  const MockUSDT = await hre.ethers.getContractAt("MockUSDT", usdtAddress);

  // Mint 1,000,000 USDT each (6 decimals)
  const amount = hre.ethers.parseUnits("1000000", 6);

  console.log(`Đang mint 1,000,000 USDT cho Doanh nghiệp 1 (${ent1Address})...`);
  let tx1 = await MockUSDT.connect(deployer).mint(ent1Address, amount);
  await tx1.wait();
  console.log("✅ Xong cho Doanh nghiệp 1.");

  console.log(`Đang mint 1,000,000 USDT cho Doanh nghiệp 2 (${ent2Address})...`);
  let tx2 = await MockUSDT.connect(deployer).mint(ent2Address, amount);
  await tx2.wait();
  console.log("✅ Xong cho Doanh nghiệp 2.");

  console.log("🎉 Hoàn tất cấp vốn USDT!");
}

main().catch((error) => {
  console.error("Lỗi:", error);
  process.exitCode = 1;
});
