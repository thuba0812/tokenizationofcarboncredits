import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("========================================");
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("========================================\n");

  // 1. Deploy MockUSDT
  console.log("1️⃣  Deploying MockUSDT...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy(deployer.address);
  await mockUSDT.waitForDeployment();
  const mockUSDTAddress = await mockUSDT.getAddress();
  console.log("   ✅ MockUSDT deployed at:", mockUSDTAddress);

  // 2. Deploy CarbonToken
  console.log("\n2️⃣  Deploying CarbonToken...");
  const CarbonToken = await hre.ethers.getContractFactory("CarbonToken");
  const carbonToken = await CarbonToken.deploy(deployer.address);
  await carbonToken.waitForDeployment();
  const carbonTokenAddress = await carbonToken.getAddress();
  console.log("   ✅ CarbonToken deployed at:", carbonTokenAddress);

  // 3. Deploy CarbonMarketplace
  console.log("\n3️⃣  Deploying CarbonMarketplace...");
  const CarbonMarketplace = await hre.ethers.getContractFactory("CarbonMarketplace");
  const marketplace = await CarbonMarketplace.deploy(
    carbonTokenAddress,  // _carbonToken
    mockUSDTAddress,     // _usdt
    deployer.address,    // _owner
    deployer.address     // _feeRecipient (deployer receives fees for now)
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("   ✅ CarbonMarketplace deployed at:", marketplaceAddress);

  // Summary
  console.log("\n========================================");
  console.log("🎉 ALL CONTRACTS DEPLOYED SUCCESSFULLY!");
  console.log("========================================");
  console.log("MockUSDT:          ", mockUSDTAddress);
  console.log("CarbonToken:       ", carbonTokenAddress);
  console.log("CarbonMarketplace: ", marketplaceAddress);
  console.log("Owner/Deployer:    ", deployer.address);
  console.log("========================================\n");

  // Auto-update contractConfig.ts
  const configPath = path.join(__dirname, "..", "src", "contracts", "contractConfig.ts");
  
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, "utf-8");
    
    // Replace placeholder addresses
    configContent = configContent.replace(
      /export const CARBON_TOKEN_ADDRESS: string = '0x[0-9a-fA-F]+';/,
      `export const CARBON_TOKEN_ADDRESS: string = '${carbonTokenAddress}';`
    );
    configContent = configContent.replace(
      /export const MOCK_USDT_ADDRESS: string = '0x[0-9a-fA-F]+';/,
      `export const MOCK_USDT_ADDRESS: string = '${mockUSDTAddress}';`
    );
    configContent = configContent.replace(
      /export const MARKETPLACE_ADDRESS: string = '0x[0-9a-fA-F]+';/,
      `export const MARKETPLACE_ADDRESS: string = '${marketplaceAddress}';`
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log("✅ contractConfig.ts updated automatically!");
  } else {
    console.log("⚠️  contractConfig.ts not found. Update addresses manually.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
