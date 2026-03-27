import { portfolioRepository } from "../src/repositories/PortfolioRepository";
import { createClient } from "@supabase/supabase-js";

// Manually injecting client since script runs outside React context
const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);
(portfolioRepository as any).client = supabase;

async function testRetire() {
  const walletAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const items = [{ vintageId: 3, quantity: 10 }];
  const txHash = "0x1234567890abcdef";

  console.log("Testing retireTokens with:", walletAddress, items);
  const result = await portfolioRepository.retireTokens(walletAddress, items, txHash);
  console.log("Result:", result);
}

testRetire().catch(console.error);
