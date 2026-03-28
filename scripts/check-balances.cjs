const hre = require("hardhat");
const { createClient } = require("@supabase/supabase-js");

async function main() {
  const envPath = require('path').join(process.cwd(), '.env');
  const envText = require('fs').readFileSync(envPath, 'utf8');
  const getEnv = (name) => {
    const match = envText.match(new RegExp(`^${name}=(.+)$`, "m"));
    return match ? match[1].trim() : "";
  };
  const supabase = createClient(getEnv("VITE_SUPABASE_URL"), getEnv("VITE_SUPABASE_ANON_KEY"));
  
  const { data: vintages } = await supabase.from("PROJECT_VINTAGES").select("token_id, status");
  if (!vintages) {
    console.log("Error or no vintages");
    return;
  }
  const minted = vintages.filter(v => v.status === "MINTED");
  
  if (minted.length === 0) {
    console.log("No MINTED tokens in DB.");
    return;
  }
  
  const Token = await hre.ethers.getContractAt("CarbonToken", "0x53fF7837667a7158AFCAf3e93e3BCd9eD5bd0c8F");
  
  const wallets = [
    "0xA57c11E33a76AC1706E774E65eFE622d0ED24bf0", // Ent 1
    "0x86914E269fb759EB1fFEb16e3a2e56Bf02852aef"  // Ent 2
  ];

  for (const v of minted) {
    for (const w of wallets) {
       const balance = await Token.balanceOf(w, v.token_id);
       if (balance > 0n) {
          console.log(`Token ${v.token_id} | Wallet ${w}: ${balance.toString()}`);
       }
    }
  }
}

main().catch(console.error);
