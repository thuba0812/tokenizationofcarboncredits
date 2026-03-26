import { network } from "hardhat";

async function main() {
  // @ts-ignore
  const { ethers } = await network.connect();
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MockUSDT
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy(deployer.address);
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("MockUSDT deployed to:", usdtAddress);

  // Deploy CarbonToken
  const CarbonToken = await ethers.getContractFactory("CarbonToken");
  const carbonToken = await CarbonToken.deploy(deployer.address);
  await carbonToken.waitForDeployment();
  const carbonTokenAddress = await carbonToken.getAddress();
  console.log("CarbonToken deployed to:", carbonTokenAddress);

  // Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("CarbonMarketplace");
  const marketplace = await Marketplace.deploy(carbonTokenAddress, usdtAddress, deployer.address, deployer.address);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("CarbonMarketplace deployed to:", marketplaceAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
