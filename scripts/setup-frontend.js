import fs from "fs";
import path from "path";

async function main() {
  const mockUSDTPath = "./artifacts/contracts/mockusdt.sol/MockUSDT.json";
  const carbonTokenPath = "./artifacts/contracts/token.sol/CarbonToken.json";
  const marketplacePath = "./artifacts/contracts/Marketplace.sol/CarbonMarketplace.json";

  const usdtJson = JSON.parse(fs.readFileSync(mockUSDTPath, "utf8"));
  const carbonJson = JSON.parse(fs.readFileSync(carbonTokenPath, "utf8"));
  const marketplaceJson = JSON.parse(fs.readFileSync(marketplacePath, "utf8"));

  const configContent = `// Tự động sinh bởi Hardhat Scripts
export const CONTRACT_ADDRESSES = {
  MOCK_USDT: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  CARBON_TOKEN: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  MARKETPLACE: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
};

export const MOCK_USDT_ABI = ${JSON.stringify(usdtJson.abi, null, 2)};

export const CARBON_TOKEN_ABI = ${JSON.stringify(carbonJson.abi, null, 2)};

export const MARKETPLACE_ABI = ${JSON.stringify(marketplaceJson.abi, null, 2)};
`;

  const configDir = path.resolve("./src/config");
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  fs.writeFileSync(path.join(configDir, "contracts.ts"), configContent);
  console.log("Đã tạo file cấu hình thành công: src/config/contracts.ts");
}

main().catch(console.error);
