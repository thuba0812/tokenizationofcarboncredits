import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: vintages } = await supabase.from("PROJECT_VINTAGES").select("project_vintage_id, status, token_id, mint_tx_hash");
  
  if (!vintages) {
     console.log("No vintages found or error fetching");
     return;
  }
  const minted = vintages.filter(v => v.status === "MINTED");
  console.log(`Total Vintages: ${vintages.length}, MINTED: ${minted.length}`);
  if (minted.length > 0) {
    console.log("Sample Minted Token TX:", minted[0].mint_tx_hash);
  }
}
main().catch(console.error);
