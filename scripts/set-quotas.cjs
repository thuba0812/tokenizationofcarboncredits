const hre = require("hardhat");

async function main() {
  // Lấy các account test từ Hardhat (0 là Admin, 1 là Ent1, 2 là Ent2 theo config ví)
  const signers = await hre.ethers.getSigners();
  const admin = signers[0];
  const ent1 = signers[1];
  const ent2 = signers[2];
  
  // Địa chỉ CarbonToken deploy lúc nãy
  const tokenAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const CarbonToken = await hre.ethers.getContractFactory("CarbonToken");
  const token = CarbonToken.attach(tokenAddress);

  // Set quota 100,000 cho mỗi doanh nghiệp
  const quotaAmount = 100000;

  console.log(`Setting quota ${quotaAmount} for Ent1 (${ent1.address})...`);
  let tx = await token.connect(admin).setEnterpriseQuota(ent1.address, quotaAmount);
  await tx.wait();
  console.log("✅ OK");

  console.log(`Setting quota ${quotaAmount} for Ent2 (${ent2.address})...`);
  tx = await token.connect(admin).setEnterpriseQuota(ent2.address, quotaAmount);
  await tx.wait();
  console.log("✅ OK");

  console.log("🔥 Đã cấp hạn ngạch thành công! Bây giờ bạn có thể test chức năng Bù trừ (Burn).");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
