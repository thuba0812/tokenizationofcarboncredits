const hre = require("hardhat");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Bắt đầu tạo 3 Dự án đặc biệt (mỗi dự án 5 năm)...");

  // 1. Setup Supabase
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

  // Lấy danh sách ví từ Hardhat
  const signers = await hre.ethers.getSigners();
  const admin = signers[0];
  const ent1 = signers[1];
  const ent2 = signers[2];
  const buyer = signers[3];

  console.log("🧹 Đang dọn dẹp Supabase...");
  // Không xóa ORGANIZATIONS, WALLETS, ACCOUNTS, CARBON_QUOTAS để đỡ phải tạo lại
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
    
    await supabase.from(t).delete().not(idCol, 'is', null);
  }

  // Lấy ORG IDs (chắc chắn đã có vì mình ko xóa)
  const { data: orgs } = await supabase.from("ORGANIZATIONS").select();
  const orgEnt1 = orgs.find(o => o.organization_code === "ORG-ENT-001");
  const orgEnt2 = orgs.find(o => o.organization_code === "ORG-ENT-002");

  if (!orgEnt1 || !orgEnt2) {
    throw new Error("Không tìm thấy dữ liệu Tổ chức! Hãy chạy lại file reset-and-seed.sql trên Supabase trước.");
  }

  // Tạo 3 Dự án mới hoàn toàn để không trùng mã cũ trên Blockchain
  console.log("🌍 Đang tạo 3 Dự án mới (Giai đoạn 2020-2024)...");
  const projectsData = [
    {
      project_code: `PRJ-LONG-ENT1-001`, project_name: `Dự án Biển Đảo Kéo Dài (Ent 1)`, sector: "RENEWABLE_ENERGY", country: "VIETNAM",
      owner_organization_id: orgEnt1.organization_id, project_status: "ACTIVE"
    },
    {
      project_code: `PRJ-LONG-ENT1-002`, project_name: `Dự án Sinh Khối Vĩnh Củu (Ent 1)`, sector: "ENERGY_EFFICIENCY", country: "VIETNAM",
      owner_organization_id: orgEnt1.organization_id, project_status: "ACTIVE"
    },
    {
      project_code: `PRJ-LONG-ENT2-001`, project_name: `Dự án Điện Gió Khổng Lồ (Ent 2)`, sector: "RENEWABLE_ENERGY", country: "VIETNAM",
      owner_organization_id: orgEnt2.organization_id, project_status: "ACTIVE"
    }
  ];

  const { data: projects } = await supabase.from("PROJECTS").insert(projectsData).select();

  // Tạo 5 Vintages (2020 -> 2024) cho mỗi dự án
  console.log("⚙️ Đang tạo 5 Mốc thời gian (Vintages) cho mỗi dự án...");
  const vintagesData = [];
  
  for (const p of projects) {
    for (const year of [2020, 2021, 2022, 2023, 2024]) {
      const amount = Math.floor(Math.random() * 5000) + 1000;
      vintagesData.push({
        project_id: p.project_id, 
        vintage_year: year, 
        credit_code: `CRD-${p.project_code}-${year}`,
        verified_co2_reduction: amount, 
        issued_creadit_amount: amount, 
        
        // Cố tình đặt trạng thái VERIFIED chờ Admin Mint
        status: "VERIFIED",
        
        // Bỏ trống toàn bộ thông tin Blockchain vì chưa Mint
        token_id: null, 
        mint_tx_hash: null, 
        minted_amount: null, 
        minted_at: null
      });
    }
  }

  await supabase.from("PROJECT_VINTAGES").insert(vintagesData);

  console.log("\n🎉 HOÀN TẤT! Đã Fake xong đúng 3 dự án, mỗi dự án 5 năm.");
  console.log("Tất cả đang ở trạng thái VERIFIED đang chờ Phát Hành (Mint).");
  console.log("Bạn hãy đăng nhập bằng ví Chính Phủ (Account 1) và bấm 'Phát hành token' trên Web nhé!");
}

main().catch((err) => {
  console.error("Lỗi:", err);
  process.exitCode = 1;
});
