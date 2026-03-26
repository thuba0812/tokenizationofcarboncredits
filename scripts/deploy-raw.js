import { ethers } from "ethers";
import fs from "fs";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  // Hardhat's default account #0 private key
  const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Deploying contracts with account:", wallet.address);

  // Deploy MockUSDT
  const usdtJson = JSON.parse(fs.readFileSync("./artifacts/contracts/mockusdt.sol/MockUSDT.json", "utf8"));
  const MockUSDTFactory = new ethers.ContractFactory(usdtJson.abi, usdtJson.bytecode, wallet);
  const usdt = await MockUSDTFactory.deploy(wallet.address);
  await usdt.waitForDeployment();
  console.log("MockUSDT deployed to:", await usdt.getAddress());

  // Deploy CarbonToken
  const carbonJson = JSON.parse(fs.readFileSync("./artifacts/contracts/token.sol/CarbonToken.json", "utf8"));
  const CarbonTokenFactory = new ethers.ContractFactory(carbonJson.abi, carbonJson.bytecode, wallet);
  const carbonToken = await CarbonTokenFactory.deploy(wallet.address);
  await carbonToken.waitForDeployment();
  console.log("CarbonToken deployed to:", await carbonToken.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
