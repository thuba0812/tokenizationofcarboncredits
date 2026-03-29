BEGIN;

-- =========================================================
-- FUNCTION: AUTO UPDATE updated_at
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =========================================================
-- TABLE: ORGANIZATIONS
-- =========================================================
CREATE TABLE public."ORGANIZATIONS" (
  organization_id           BIGSERIAL PRIMARY KEY,
  organization_code         VARCHAR(100) NOT NULL,
  organization_name         VARCHAR(255) NOT NULL,
  organization_type         VARCHAR(30)  NOT NULL,
  business_registration_no  VARCHAR(100),
  tax_code                  VARCHAR(50),
  headquarters_address      TEXT,
  phone_number              VARCHAR(30),
  email                     VARCHAR(255),
  legal_representative      VARCHAR(255),
  operating_status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_organizations_organization_code UNIQUE (organization_code),
  CONSTRAINT uq_organizations_business_registration_no UNIQUE (business_registration_no),
  CONSTRAINT uq_organizations_tax_code UNIQUE (tax_code),
  CONSTRAINT uq_organizations_email UNIQUE (email),

  CONSTRAINT chk_organizations_organization_type
    CHECK (organization_type IN ('ENTERPRISE', 'REGULATORY_AGENCY')),

  CONSTRAINT chk_organizations_operating_status
    CHECK (operating_status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE'))
);

-- =========================================================
-- TABLE: WALLETS
-- =========================================================
CREATE TABLE public."WALLETS" (
  wallet_id            BIGSERIAL PRIMARY KEY,
  organization_id      BIGINT       NOT NULL,
  wallet_address       VARCHAR(255) NOT NULL,
  blockchain_network   VARCHAR(100),
  public_key           TEXT,
  wallet_status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_wallets_wallet_address UNIQUE (wallet_address),

  CONSTRAINT fk_wallets_organization
    FOREIGN KEY (organization_id)
    REFERENCES public."ORGANIZATIONS"(organization_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_wallets_wallet_status
    CHECK (wallet_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

-- =========================================================
-- TABLE: ACCOUNTS
-- 1-1 với WALLETS được thể hiện bằng UNIQUE(wallet_id)
-- =========================================================
CREATE TABLE public."ACCOUNTS" (
  account_id       BIGSERIAL PRIMARY KEY,
  wallet_id        BIGINT      NOT NULL,
  account_status   VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  account_role     VARCHAR(20) NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_accounts_wallet_id UNIQUE (wallet_id),

  CONSTRAINT fk_accounts_wallet
    FOREIGN KEY (wallet_id)
    REFERENCES public."WALLETS"(wallet_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_accounts_account_status
    CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'PERMANENTLY_LOCKED')),

  CONSTRAINT chk_accounts_account_role
    CHECK (account_role IN ('ORGANIZATION', 'ADMIN'))
);

-- =========================================================
-- TABLE: PROJECTS
-- =========================================================
CREATE TABLE public."PROJECTS" (
  project_id                 BIGSERIAL PRIMARY KEY,
  project_code               VARCHAR(100) NOT NULL,
  project_name               VARCHAR(255) NOT NULL,
  project_description        TEXT,
  sector                     VARCHAR(255),
  country                    VARCHAR(100),
  province_city              VARCHAR(150),
  ward_commune               VARCHAR(150),
  owner_organization_id      BIGINT       NOT NULL,
  start_date                 DATE,
  end_date                   DATE,
  registration_approved_at   TIMESTAMPTZ,
  project_status             VARCHAR(20)  NOT NULL DEFAULT 'REGISTERED',
  created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_projects_project_code UNIQUE (project_code),

  CONSTRAINT fk_projects_owner_organization
    FOREIGN KEY (owner_organization_id)
    REFERENCES public."ORGANIZATIONS"(organization_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_projects_project_status
    CHECK (project_status IN ('REGISTERED', 'ACTIVE', 'SUSPENDED', 'COMPLETED')),

  CONSTRAINT chk_projects_date_range
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- =========================================================
-- TABLE: PROJECT_VINTAGES
-- =========================================================
CREATE TABLE public."PROJECT_VINTAGES" (
  project_vintage_id         BIGSERIAL PRIMARY KEY,
  project_id                 BIGINT         NOT NULL,
  vintage_year               INTEGER        NOT NULL,
  credit_code                VARCHAR(100)   NOT NULL,
  verified_co2_reduction     NUMERIC(20,4)  NOT NULL,
  issued_creadit_amount      NUMERIC(20,4)  NOT NULL,
  status                     VARCHAR(20)    NOT NULL DEFAULT 'VERIFIED',
  token_id                   BIGINT,
  mint_tx_hash               VARCHAR(255),
  minted_amount              NUMERIC(20,4),
  minted_at                  TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_project_vintages_project_year UNIQUE (project_id, vintage_year),
  CONSTRAINT uq_project_vintages_credit_code UNIQUE (credit_code),
  CONSTRAINT uq_project_vintages_token_id UNIQUE (token_id),
  CONSTRAINT uq_project_vintages_mint_tx_hash UNIQUE (mint_tx_hash),

  CONSTRAINT fk_project_vintages_project
    FOREIGN KEY (project_id)
    REFERENCES public."PROJECTS"(project_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_project_vintages_status
    CHECK (status IN ('VERIFIED', 'MINTING', 'MINTED', 'ERROR')),

  CONSTRAINT chk_project_vintages_vintage_year
    CHECK (vintage_year >= 1900 AND vintage_year <= 3000),

  CONSTRAINT chk_project_vintages_verified_co2_reduction
    CHECK (verified_co2_reduction >= 0),

  CONSTRAINT chk_project_vintages_issued_creadit_amount
    CHECK (issued_creadit_amount >= 0),

  CONSTRAINT chk_project_vintages_minted_amount
    CHECK (minted_amount IS NULL OR minted_amount >= 0)
);

-- =========================================================
-- TABLE: LISTINGS
-- =========================================================
CREATE TABLE public."LISTINGS" (
  listing_id           BIGSERIAL PRIMARY KEY,
  project_vintage_id   BIGINT         NOT NULL,
  seller_wallet_id     BIGINT         NOT NULL,
  price_per_unit       NUMERIC(20,6)  NOT NULL,
  listed_amount        NUMERIC(20,4)  NOT NULL,
  listing_status       VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
  listing_tx_hash      VARCHAR(255),
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_listings_listing_tx_hash UNIQUE (listing_tx_hash),

  CONSTRAINT fk_listings_project_vintage
    FOREIGN KEY (project_vintage_id)
    REFERENCES public."PROJECT_VINTAGES"(project_vintage_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_listings_seller_wallet
    FOREIGN KEY (seller_wallet_id)
    REFERENCES public."WALLETS"(wallet_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_listings_price_per_unit
    CHECK (price_per_unit >= 0),

  CONSTRAINT chk_listings_listed_amount
    CHECK (listed_amount > 0),

  CONSTRAINT chk_listings_listing_status
    CHECK (listing_status IN ('ACTIVE', 'SOLD_OUT', 'CANCELLED', 'INACTIVE'))
);

-- =========================================================
-- TABLE: CARBON_QUOTAS
-- =========================================================
CREATE TABLE public."CARBON_QUOTAS" (
  quota_id            BIGSERIAL PRIMARY KEY,
  organization_id     BIGINT         NOT NULL,
  quota_year          INTEGER        NOT NULL,
  allocated_quota     NUMERIC(20,4)  NOT NULL,
  actual_emission     NUMERIC(20,4),
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_carbon_quotas_org_year UNIQUE (organization_id, quota_year),

  CONSTRAINT fk_carbon_quotas_organization
    FOREIGN KEY (organization_id)
    REFERENCES public."ORGANIZATIONS"(organization_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_carbon_quotas_quota_year
    CHECK (quota_year >= 1900 AND quota_year <= 3000),

  CONSTRAINT chk_carbon_quotas_allocated_quota
    CHECK (allocated_quota >= 0),

  CONSTRAINT chk_carbon_quotas_actual_emission
    CHECK (actual_emission IS NULL OR actual_emission >= 0)
);

-- =========================================================
-- TABLE: TOKEN_BALANCES
-- =========================================================
CREATE TABLE public."TOKEN_BALANCES" (
  balance_id            BIGSERIAL PRIMARY KEY,
  wallet_id             BIGINT         NOT NULL,
  project_vintage_id    BIGINT         NOT NULL,
  current_amount        NUMERIC(20,4)  NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_token_balances_wallet_project_vintage UNIQUE (wallet_id, project_vintage_id),

  CONSTRAINT fk_token_balances_wallet
    FOREIGN KEY (wallet_id)
    REFERENCES public."WALLETS"(wallet_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_token_balances_project_vintage
    FOREIGN KEY (project_vintage_id)
    REFERENCES public."PROJECT_VINTAGES"(project_vintage_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_token_balances_current_amount
    CHECK (current_amount >= 0)
);

-- =========================================================
-- TABLE: PURCHASES
-- =========================================================
CREATE TABLE public."PURCHASES" (
  purchase_id         BIGSERIAL PRIMARY KEY,
  project_id          BIGINT         NOT NULL,
  fee_amount          NUMERIC(20,6)  NOT NULL DEFAULT 0,
  purchase_status     VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
  buyer_wallet_id     BIGINT         NOT NULL,
  executed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  purchase_tx_hash    VARCHAR(255),

  CONSTRAINT uq_purchases_purchase_tx_hash UNIQUE (purchase_tx_hash),

  CONSTRAINT fk_purchases_project
    FOREIGN KEY (project_id)
    REFERENCES public."PROJECTS"(project_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_purchases_buyer_wallet
    FOREIGN KEY (buyer_wallet_id)
    REFERENCES public."WALLETS"(wallet_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_purchases_fee_amount
    CHECK (fee_amount >= 0),

  CONSTRAINT chk_purchases_purchase_status
    CHECK (purchase_status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

-- =========================================================
-- TABLE: PURCHASE_ITEMS
-- =========================================================
CREATE TABLE public."PURCHASE_ITEMS" (
  purchase_item_id    BIGSERIAL PRIMARY KEY,
  purchase_id         BIGINT         NOT NULL,
  listing_id          BIGINT         NOT NULL,
  purchased_amount    NUMERIC(20,4)  NOT NULL,
  unit_price          NUMERIC(20,6)  NOT NULL,

  CONSTRAINT uq_purchase_items_purchase_listing UNIQUE (purchase_id, listing_id),

  CONSTRAINT fk_purchase_items_purchase
    FOREIGN KEY (purchase_id)
    REFERENCES public."PURCHASES"(purchase_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_purchase_items_listing
    FOREIGN KEY (listing_id)
    REFERENCES public."LISTINGS"(listing_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_purchase_items_purchased_amount
    CHECK (purchased_amount > 0),

  CONSTRAINT chk_purchase_items_unit_price
    CHECK (unit_price >= 0)
);

-- =========================================================
-- TABLE: TOKEN_ACTIVITY_LOGS
-- =========================================================
CREATE TABLE public."TOKEN_ACTIVITY_LOGS" (
  activity_id          BIGSERIAL PRIMARY KEY,
  wallet_id            BIGINT         NOT NULL,
  project_vintage_id   BIGINT         NOT NULL,
  activity_type        VARCHAR(20)    NOT NULL,
  delta_amount         NUMERIC(20,4)  NOT NULL,
  created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  reference_id         BIGINT,
  reference_type       VARCHAR(20),

  CONSTRAINT fk_token_activity_logs_wallet
    FOREIGN KEY (wallet_id)
    REFERENCES public."WALLETS"(wallet_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_token_activity_logs_project_vintage
    FOREIGN KEY (project_vintage_id)
    REFERENCES public."PROJECT_VINTAGES"(project_vintage_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_token_activity_logs_activity_type
    CHECK (activity_type IN ('LIST', 'PURCHASE', 'MINT', 'RETIRE')),

  CONSTRAINT chk_token_activity_logs_reference_type
    CHECK (
      reference_type IS NULL
      OR reference_type IN ('MINT', 'LISTING', 'RETIREMENT', 'PURCHASE', 'UNLIST')
    )
);

-- =========================================================
-- TABLE: RETIREMENTS
-- =========================================================
CREATE TABLE public."RETIREMENTS" (
  retirement_id        BIGSERIAL PRIMARY KEY,
  organization_id      BIGINT       NOT NULL,
  wallet_id            BIGINT       NOT NULL,
  quota_id             BIGINT       NOT NULL,
  retirement_status    VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
  retired_at           TIMESTAMPTZ,
  retirement_tx_hash   VARCHAR(255),
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_retirements_retirement_tx_hash UNIQUE (retirement_tx_hash),

  CONSTRAINT fk_retirements_organization
    FOREIGN KEY (organization_id)
    REFERENCES public."ORGANIZATIONS"(organization_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_retirements_wallet
    FOREIGN KEY (wallet_id)
    REFERENCES public."WALLETS"(wallet_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_retirements_quota
    FOREIGN KEY (quota_id)
    REFERENCES public."CARBON_QUOTAS"(quota_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_retirements_retirement_status
    CHECK (retirement_status IN ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'))
);

-- =========================================================
-- TABLE: RETIREMENT_DETAILS
-- =========================================================
CREATE TABLE public."RETIREMENT_DETAILS" (
  retirement_detail_id   BIGSERIAL PRIMARY KEY,
  retirement_id          BIGINT         NOT NULL,
  project_vintage_id     BIGINT         NOT NULL,
  retirement_code        VARCHAR(64)    NOT NULL,
  retired_amount         NUMERIC(20,4)  NOT NULL,

  CONSTRAINT uq_retirement_details_retirement_project_vintage
    UNIQUE (retirement_id, project_vintage_id),

  CONSTRAINT uq_retirement_details_retirement_code
    UNIQUE (retirement_code),

  CONSTRAINT fk_retirement_details_retirement
    FOREIGN KEY (retirement_id)
    REFERENCES public."RETIREMENTS"(retirement_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_retirement_details_project_vintage
    FOREIGN KEY (project_vintage_id)
    REFERENCES public."PROJECT_VINTAGES"(project_vintage_id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT chk_retirement_details_retired_amount
    CHECK (retired_amount > 0)
);

-- =========================================================
-- TABLE: IPFS_FILES
-- object_id là tham chiếu đa hình nên không tạo FK cứng
-- =========================================================
CREATE TABLE public."IPFS_FILES" (
  ipfs_file_id     BIGSERIAL PRIMARY KEY,
  object_type      VARCHAR(30)  NOT NULL,
  object_id        BIGINT       NOT NULL,
  file_type        VARCHAR(40)  NOT NULL,
  cid              TEXT         NOT NULL,
  file_name        TEXT         NOT NULL,
  mime_type        VARCHAR(255),
  file_size        BIGINT,
  is_public        BOOLEAN      NOT NULL DEFAULT TRUE,
  uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_ipfs_files_cid UNIQUE (cid),

  CONSTRAINT chk_ipfs_files_object_type
    CHECK (object_type IN ('PROJECT', 'PROJECT_VINTAGE', 'RETIREMENT')),

  CONSTRAINT chk_ipfs_files_file_type
    CHECK (file_type IN ('PROJECT_DOCUMENT', 'MRV_REPORT', 'TOKEN_METADATA', 'RETIREMENT_CERTIFICATE')),

  CONSTRAINT chk_ipfs_files_file_size
    CHECK (file_size IS NULL OR file_size >= 0),

  CONSTRAINT chk_ipfs_files_object_file_pair
    CHECK (
      (object_type = 'PROJECT' AND file_type = 'PROJECT_DOCUMENT')
      OR
      (object_type = 'PROJECT_VINTAGE' AND file_type IN ('MRV_REPORT', 'TOKEN_METADATA'))
      OR
      (object_type = 'RETIREMENT' AND file_type = 'RETIREMENT_CERTIFICATE')
    )
);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX idx_wallets_organization_id
  ON public."WALLETS"(organization_id);

CREATE INDEX idx_projects_owner_organization_id
  ON public."PROJECTS"(owner_organization_id);

CREATE INDEX idx_project_vintages_project_id
  ON public."PROJECT_VINTAGES"(project_id);

CREATE INDEX idx_project_vintages_token_id
  ON public."PROJECT_VINTAGES"(token_id);

CREATE INDEX idx_listings_project_vintage_id
  ON public."LISTINGS"(project_vintage_id);

CREATE INDEX idx_listings_seller_wallet_id
  ON public."LISTINGS"(seller_wallet_id);

CREATE INDEX idx_listings_listing_status
  ON public."LISTINGS"(listing_status);

CREATE INDEX idx_carbon_quotas_organization_id
  ON public."CARBON_QUOTAS"(organization_id);

CREATE INDEX idx_token_balances_wallet_id
  ON public."TOKEN_BALANCES"(wallet_id);

CREATE INDEX idx_token_balances_project_vintage_id
  ON public."TOKEN_BALANCES"(project_vintage_id);

CREATE INDEX idx_purchases_project_id
  ON public."PURCHASES"(project_id);

CREATE INDEX idx_purchases_buyer_wallet_id
  ON public."PURCHASES"(buyer_wallet_id);

CREATE INDEX idx_purchases_purchase_status
  ON public."PURCHASES"(purchase_status);

CREATE INDEX idx_purchase_items_purchase_id
  ON public."PURCHASE_ITEMS"(purchase_id);

CREATE INDEX idx_purchase_items_listing_id
  ON public."PURCHASE_ITEMS"(listing_id);

CREATE INDEX idx_token_activity_logs_wallet_id
  ON public."TOKEN_ACTIVITY_LOGS"(wallet_id);

CREATE INDEX idx_token_activity_logs_project_vintage_id
  ON public."TOKEN_ACTIVITY_LOGS"(project_vintage_id);

CREATE INDEX idx_token_activity_logs_reference
  ON public."TOKEN_ACTIVITY_LOGS"(reference_type, reference_id);

CREATE INDEX idx_retirements_organization_id
  ON public."RETIREMENTS"(organization_id);

CREATE INDEX idx_retirements_wallet_id
  ON public."RETIREMENTS"(wallet_id);

CREATE INDEX idx_retirements_quota_id
  ON public."RETIREMENTS"(quota_id);

CREATE INDEX idx_retirement_details_retirement_id
  ON public."RETIREMENT_DETAILS"(retirement_id);

CREATE INDEX idx_retirement_details_project_vintage_id
  ON public."RETIREMENT_DETAILS"(project_vintage_id);

CREATE INDEX idx_ipfs_files_object
  ON public."IPFS_FILES"(object_type, object_id);

CREATE INDEX idx_ipfs_files_file_type
  ON public."IPFS_FILES"(file_type);

-- =========================================================
-- TRIGGERS: updated_at
-- =========================================================
CREATE TRIGGER trg_organizations_set_updated_at
BEFORE UPDATE ON public."ORGANIZATIONS"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_wallets_set_updated_at
BEFORE UPDATE ON public."WALLETS"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_accounts_set_updated_at
BEFORE UPDATE ON public."ACCOUNTS"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_projects_set_updated_at
BEFORE UPDATE ON public."PROJECTS"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_project_vintages_set_updated_at
BEFORE UPDATE ON public."PROJECT_VINTAGES"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_listings_set_updated_at
BEFORE UPDATE ON public."LISTINGS"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_carbon_quotas_set_updated_at
BEFORE UPDATE ON public."CARBON_QUOTAS"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_token_balances_set_updated_at
BEFORE UPDATE ON public."TOKEN_BALANCES"
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

COMMIT;
