BEGIN;

-- =========================================================
-- 1) ORGANIZATIONS
-- =========================================================
INSERT INTO public."ORGANIZATIONS" (
  organization_code,
  organization_name,
  organization_type,
  business_registration_no,
  tax_code,
  headquarters_address,
  phone_number,
  email,
  legal_representative,
  operating_status
)
VALUES
(
  'ORG-BCT-001',
  'BỘ NÔNG NGHIỆP VÀ MÔI TRƯỜNG',
  'REGULATORY_AGENCY',
  '0100100001',
  '0100100001',
  '54 Hai Bà Trưng, Hoàn Kiếm, Hà Nội',
  '02422222222',
  'carbon-registry@moit.gov.vn',
  'PHẠM NGỌC MỸ',
  'ACTIVE'
),
(
  'ORG-ENT-001',
  'Green Manufacturing Joint Stock Company',
  'ENTERPRISE',
  '0312345678',
  '0312345678',
  '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  '02838889999',
  'contact@greenmfg.vn',
  'TRẦN NGỌC CHÂU GIANG',
  'ACTIVE'
),
(
  'ORG-ENT-002',
  'Eco Energy Vietnam Co., Ltd',
  'ENTERPRISE',
  '0109988776',
  '0109988776',
  '88 Trần Duy Hùng, Cầu Giấy, Hà Nội',
  '02436668888',
  'admin@ecoenergy.vn',
  'LÊ PHƯỚC THỊNH',
  'ACTIVE'
);

-- =========================================================
-- 2) WALLETS
-- =========================================================
INSERT INTO public."WALLETS" (
  organization_id,
  wallet_address,
  blockchain_network,
  wallet_status
)
VALUES
(
  (SELECT organization_id FROM public."ORGANIZATIONS" WHERE organization_code = 'ORG-BCT-001'),
  '0xCB552C7A28773C2137bae7Cf8D189446bD4b52Bf',
  'SEPOLIA',
  'ACTIVE'
),
(
  (SELECT organization_id FROM public."ORGANIZATIONS" WHERE organization_code = 'ORG-ENT-001'),
  '0x34713EB1aD81e448c224da3c802b8e2b16614a88',
  'SEPOLIA',
  'ACTIVE'
),
(
  (SELECT organization_id FROM public."ORGANIZATIONS" WHERE organization_code = 'ORG-ENT-002'),
  '0xCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc03',
  'SEPOLIA',
  'ACTIVE'
);

-- =========================================================
-- 3) ACCOUNTS
-- =========================================================
INSERT INTO public."ACCOUNTS" (
  wallet_id,
  account_status,
  account_role
)
VALUES
(
  (SELECT wallet_id FROM public."WALLETS"
   WHERE wallet_address = '0xCB552C7A28773C2137bae7Cf8D189446bD4b52Bf'),
  'ACTIVE',
  'ADMIN'
),
(
  (SELECT wallet_id FROM public."WALLETS"
   WHERE wallet_address = '0x34713EB1aD81e448c224da3c802b8e2b16614a88'),
  'ACTIVE',
  'ORGANIZATION'
),
(
  (SELECT wallet_id FROM public."WALLETS"
   WHERE wallet_address = '0xCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc03'),
  'ACTIVE',
  'ORGANIZATION'
);

-- =========================================================
-- 4) PROJECTS
-- =========================================================
INSERT INTO public."PROJECTS" (
  project_code,
  project_name,
  project_description,
  sector,
  country,
  province_city,
  ward_commune,
  owner_organization_id,
  start_date,
  end_date,
  registration_approved_at,
  project_status
)
VALUES
(
  'PRJ-ENT001-2024-001',
  'Solar Rooftop Power Expansion Project',
  'Deployment of rooftop solar systems for industrial facilities to reduce grid electricity consumption and greenhouse gas emissions.',
  'RENEWABLE_ENERGY',
  'VIETNAM',
  'Ho Chi Minh City',
  'Tan Thuan Dong Ward',
  (SELECT organization_id FROM public."ORGANIZATIONS" WHERE organization_code = 'ORG-ENT-001'),
  DATE '2024-01-01',
  DATE '2030-12-31',
  NOW(),
  'ACTIVE'
),
(
  'PRJ-ENT002-2024-001',
  'Biomass Boiler Fuel Switching Project',
  'Replacement of fossil-fuel boilers with biomass-based boiler systems in manufacturing operations.',
  'ENERGY_EFFICIENCY',
  'VIETNAM',
  'Ha Noi',
  'Yen Hoa Ward',
  (SELECT organization_id FROM public."ORGANIZATIONS" WHERE organization_code = 'ORG-ENT-002'),
  DATE '2024-03-01',
  DATE '2029-12-31',
  NOW(),
  'ACTIVE'
);

-- =========================================================
-- 5) PROJECT_VINTAGES
-- =========================================================
INSERT INTO public."PROJECT_VINTAGES" (
  project_id,
  vintage_year,
  credit_code,
  verified_co2_reduction,
  issued_creadit_amount,
  status,
  token_id,
  mint_tx_hash,
  minted_amount,
  minted_at
)
VALUES
(
  (SELECT project_id FROM public."PROJECTS" WHERE project_code = 'PRJ-ENT001-2024-001'),
  2024,
  'CRD-ENT001-2024-001',
  1500.5000,
  1500.5000,
  'MINTED',
  1001,
  '0xminttxhash000000000000000000000000000000000000000000000000000001',
  1500.5000,
  NOW()
),
(
  (SELECT project_id FROM public."PROJECTS" WHERE project_code = 'PRJ-ENT001-2024-001'),
  2025,
  'CRD-ENT001-2025-001',
  1725.2500,
  1725.2500,
  'MINTING',
  NULL,
  NULL,
  NULL,
  NULL
),
(
  (SELECT project_id FROM public."PROJECTS" WHERE project_code = 'PRJ-ENT002-2024-001'),
  2024,
  'CRD-ENT002-2024-001',
  980.0000,
  980.0000,
  'MINTED',
  1002,
  '0xminttxhash000000000000000000000000000000000000000000000000000002',
  980.0000,
  NOW()
);

-- =========================================================
-- 6) CARBON_QUOTAS
-- =========================================================
INSERT INTO public."CARBON_QUOTAS" (
  organization_id,
  quota_year,
  allocated_quota,
  actual_emission
)
VALUES
(
  (SELECT organization_id FROM public."ORGANIZATIONS" WHERE organization_code = 'ORG-ENT-001'),
  2025,
  5000.0000,
  4720.2500
),
(
  (SELECT organization_id FROM public."ORGANIZATIONS" WHERE organization_code = 'ORG-ENT-002'),
  2025,
  4200.0000,
  3988.0000
);

-- =========================================================
-- 7) IPFS_FILES
-- Chỉ insert loại file hợp lệ theo CHECK constraint:
-- PROJECT -> PROJECT_DOCUMENT
-- PROJECT_VINTAGE -> MRV_REPORT | TOKEN_METADATA
-- =========================================================
INSERT INTO public."IPFS_FILES" (
  object_type,
  object_id,
  file_type,
  cid,
  file_name,
  mime_type,
  file_size,
  is_public
)
VALUES
(
  'PROJECT',
  (SELECT project_id FROM public."PROJECTS" WHERE project_code = 'PRJ-ENT001-2024-001'),
  'PROJECT_DOCUMENT',
  'bafybeigdyrztu4exampleprojectdoc0001',
  'solar_project_design_document.pdf',
  'application/pdf',
  2457600,
  TRUE
),
(
  'PROJECT',
  (SELECT project_id FROM public."PROJECTS" WHERE project_code = 'PRJ-ENT002-2024-001'),
  'PROJECT_DOCUMENT',
  'bafybeigdyrztu4exampleprojectdoc0002',
  'biomass_project_design_document.pdf',
  'application/pdf',
  1984500,
  TRUE
),
(
  'PROJECT_VINTAGE',
  (SELECT project_vintage_id
   FROM public."PROJECT_VINTAGES"
   WHERE credit_code = 'CRD-ENT001-2024-001'),
  'MRV_REPORT',
  'bafybeigdyrztu4examplemrvreport0001',
  'mrv_report_ent001_2024.pdf',
  'application/pdf',
  1843200,
  TRUE
),
(
  'PROJECT_VINTAGE',
  (SELECT project_vintage_id
   FROM public."PROJECT_VINTAGES"
   WHERE credit_code = 'CRD-ENT001-2024-001'),
  'TOKEN_METADATA',
  'bafybeigdyrztu4exampletokenmeta0001',
  'token_metadata_ent001_2024.json',
  'application/json',
  4096,
  TRUE
),
(
  'PROJECT_VINTAGE',
  (SELECT project_vintage_id
   FROM public."PROJECT_VINTAGES"
   WHERE credit_code = 'CRD-ENT002-2024-001'),
  'MRV_REPORT',
  'bafybeigdyrztu4examplemrvreport0002',
  'mrv_report_ent002_2024.pdf',
  'application/pdf',
  1765400,
  TRUE
),
(
  'PROJECT_VINTAGE',
  (SELECT project_vintage_id
   FROM public."PROJECT_VINTAGES"
   WHERE credit_code = 'CRD-ENT002-2024-001'),
  'TOKEN_METADATA',
  'bafybeigdyrztu4exampletokenmeta0002',
  'token_metadata_ent002_2024.json',
  'application/json',
  4200,
  TRUE
);

COMMIT;