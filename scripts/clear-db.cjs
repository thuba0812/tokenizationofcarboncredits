const hre = require("hardhat");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🧹 Bắt đầu dọn dẹp Supabase (Clear DB không seed data)...");

  const envPath = path.join(process.cwd(), ".env");
  const envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const getEnv = (name) => {
    const match = envText.match(new RegExp(`^${name}=(.+)$`, "m"));
    return match ? match[1].trim() : "";
  };
  const supabaseUrl = getEnv("VITE_SUPABASE_URL");
  const supabaseKey = getEnv("VITE_SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) throw new Error("Missing Supabase credentials in .env");
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("🧹 Xóa các Project, Token, Listing cũ...");
  const tablesToClear = [
    "TOKEN_ACTIVITY_LOGS", "PURCHASE_ITEMS", "PURCHASES", "LISTINGS",
    "TOKEN_BALANCES", "RETIREMENT_DETAILS", "RETIREMENTS", "PROJECT_VINTAGES",
    "IPFS_FILES", "PROJECTS"
  ];
  for (const t of tablesToClear) {
    let idCol = t.toLowerCase() + '_id';
    if (t === 'RETIREMENT_DETAILS') idCol = 'retirement_detail_id';
    if (t === 'IPFS_FILES') idCol = 'ipfs_file_id';
    if (t === 'TOKEN_ACTIVITY_LOGS') idCol = 'activity_id';
    if (t === 'PROJECT_VINTAGES') idCol = 'project_vintage_id';
    if (t === 'TOKEN_BALANCES') idCol = 'balance_id';
    if (t === 'PURCHASES') idCol = 'purchase_id';
    if (t === 'PURCHASE_ITEMS') idCol = 'purchase_item_id';
    if (t === 'LISTINGS') idCol = 'listing_id';
    if (t === 'PROJECTS') idCol = 'project_id';
    if (t === 'RETIREMENTS') idCol = 'retirement_id';
    
    const { error } = await supabase.from(t).delete().not(idCol, 'is', null);
    if (error) {
      console.warn(`⚠️ Lỗi khi xóa bảng ${t}:`, error.message);
    }
  }

  console.log("🎉 XÓA DỮ LIỆU CŨ THÀNH CÔNG! Giờ bạn có thể tự tạo Project mới từ UI.");
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exitCode = 1;
});
