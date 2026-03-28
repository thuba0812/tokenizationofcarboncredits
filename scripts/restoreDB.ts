import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Reverting Supabase to old state from state.json...");

  // Revert Project 1
  await supabase.from("PROJECTS").update({ owner_organization_id: 2 }).eq("project_id", 1);
  
  // Revert Vintages
  await supabase.from("PROJECT_VINTAGES").update({ vintage_year: 2198, token_id: 1774693095 }).eq("project_vintage_id", 27);
  await supabase.from("PROJECT_VINTAGES").update({ vintage_year: 2025, token_id: 28 }).eq("project_vintage_id", 28);
  await supabase.from("PROJECT_VINTAGES").update({ vintage_year: 2196, token_id: 1774693093 }).eq("project_vintage_id", 29);

  // Revert Listings
  await supabase.from("LISTINGS").update({ seller_wallet_id: 2, onchain_listing_id: 1 }).eq("listing_id", 96);
  await supabase.from("LISTINGS").update({ seller_wallet_id: 2, onchain_listing_id: 2 }).eq("listing_id", 97);
  await supabase.from("LISTINGS").update({ seller_wallet_id: 2, onchain_listing_id: 3 }).eq("listing_id", 98);

  console.log("Database reverted to OLD state successfully!");
}

main().catch(console.error);
