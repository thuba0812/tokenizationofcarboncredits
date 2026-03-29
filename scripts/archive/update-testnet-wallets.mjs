import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials in .env");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Admin
  const adminAddress = "0xaDaff7fb87f2d43860Eb3f2144C5cD0F393Ca1e3";
  // Ent 1
  const ent1Address = "0xA57c11E33a76AC1706E774E65eFE622d0ED24bf0";
  // Ent 2
  const ent2Address = "0x86914E269fb759EB1fFEb16e3a2e56Bf02852aef";

  console.log("Cập nhật Database WALLETS...");

  // Update wallet 1 (Admin/Government)
  const { error: err1 } = await supabase
    .from("WALLETS")
    .update({ wallet_address: adminAddress, blockchain_network: "Sepolia Testnet" })
    .eq("wallet_id", 1);
  if (err1) console.error("Lỗi cập nhật ví 1:", err1.message);
  else console.log("Đã cập nhật ví ADMIN (1) thành", adminAddress);

  // Update wallet 2 (Ent 1)
  const { error: err2 } = await supabase
    .from("WALLETS")
    .update({ wallet_address: ent1Address, blockchain_network: "Sepolia Testnet" })
    .eq("wallet_id", 2);
  if (err2) console.error("Lỗi cập nhật ví 2:", err2.message);
  else console.log("Đã cập nhật ví Doanh nghiệp 1 (2) thành", ent1Address);

  // Update wallet 3 (Ent 2)
  const { error: err3 } = await supabase
    .from("WALLETS")
    .update({ wallet_address: ent2Address, blockchain_network: "Sepolia Testnet" })
    .eq("wallet_id", 3);
  if (err3) console.error("Lỗi cập nhật ví 3:", err3.message);
  else console.log("Đã cập nhật ví Doanh nghiệp 2 (3) thành", ent2Address);

  console.log("Hoàn tất!");
}

main().catch(console.error);
