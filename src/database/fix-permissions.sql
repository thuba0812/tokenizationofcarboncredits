-- =========================================================================================
-- SCRIPT: FIX SUPABASE PERMISSIONS AND ADD ROW LEVEL SECURITY (RLS)
-- =========================================================================================

-- Enable RLS for all tables so we can define explicit read/write rules
ALTER TABLE "ORGANIZATIONS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WALLETS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ACCOUNTS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PROJECTS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PROJECT_VINTAGES" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LISTINGS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CARBON_QUOTAS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TOKEN_BALANCES" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PURCHASES" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PURCHASE_ITEMS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TOKEN_ACTIVITY_LOGS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RETIREMENTS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RETIREMENT_DETAILS" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IPFS_FILES" ENABLE ROW LEVEL SECURITY;

-- Grant usage on the public schema to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
-- Grant basic table access
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
-- Grant sequence usage (for the bigserial IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create policies to allow PUBLIC READ access to all data (for testing/anonymous fetching)
CREATE POLICY "Public Read Access" ON "ORGANIZATIONS" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "WALLETS" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "ACCOUNTS" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "PROJECTS" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "PROJECT_VINTAGES" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "LISTINGS" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "CARBON_QUOTAS" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "TOKEN_BALANCES" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "PURCHASES" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "PURCHASE_ITEMS" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "TOKEN_ACTIVITY_LOGS" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "RETIREMENTS" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "RETIREMENT_DETAILS" FOR SELECT USING (true);
CREATE POLICY "Public Read Access" ON "IPFS_FILES" FOR SELECT USING (true);

-- (Optional) If you also want to let the frontend INSERT data anonymously (for testing purposes), uncomment below:
-- CREATE POLICY "Public Insert Access" ON "PROJECTS" FOR INSERT WITH CHECK (true);
-- do the same for other tables as needed.
