import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = "https://ghltbczennngxphbhxfy.supabase.co";
const supabaseKey = "sb_publishable_ExXmhsbp9cqKvjVNU_UCDw_u46IwPMk";
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: wallets } = await supabase.from("WALLETS").select("*");
  const { data: projects } = await supabase.from("PROJECTS").select("*");
  const { data: vintages } = await supabase.from("PROJECT_VINTAGES").select("*");
  const { data: listings } = await supabase.from("LISTINGS").select("*");

  const state = { wallets, projects, vintages, listings };
  fs.writeFileSync("scripts/state.json", JSON.stringify(state, null, 2));
  console.log("State written to scripts/state.json");
}

main().catch(console.error);
