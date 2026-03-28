BEGIN;

-- Add missing Foreign Keys
ALTER TABLE public."WALLETS" ADD CONSTRAINT fk_wallets_organization FOREIGN KEY (organization_id) REFERENCES public."ORGANIZATIONS"(organization_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."ACCOUNTS" ADD CONSTRAINT fk_accounts_wallet FOREIGN KEY (wallet_id) REFERENCES public."WALLETS"(wallet_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."PROJECTS" ADD CONSTRAINT fk_projects_owner_organization FOREIGN KEY (owner_organization_id) REFERENCES public."ORGANIZATIONS"(organization_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."PROJECT_VINTAGES" ADD CONSTRAINT fk_project_vintages_project FOREIGN KEY (project_id) REFERENCES public."PROJECTS"(project_id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE public."LISTINGS" ADD CONSTRAINT fk_listings_project_vintage FOREIGN KEY (project_vintage_id) REFERENCES public."PROJECT_VINTAGES"(project_vintage_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public."LISTINGS" ADD CONSTRAINT fk_listings_seller_wallet FOREIGN KEY (seller_wallet_id) REFERENCES public."WALLETS"(wallet_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."CARBON_QUOTAS" ADD CONSTRAINT fk_carbon_quotas_organization FOREIGN KEY (organization_id) REFERENCES public."ORGANIZATIONS"(organization_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."TOKEN_BALANCES" ADD CONSTRAINT fk_token_balances_wallet FOREIGN KEY (wallet_id) REFERENCES public."WALLETS"(wallet_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public."TOKEN_BALANCES" ADD CONSTRAINT fk_token_balances_project_vintage FOREIGN KEY (project_vintage_id) REFERENCES public."PROJECT_VINTAGES"(project_vintage_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."PURCHASES" ADD CONSTRAINT fk_purchases_project FOREIGN KEY (project_id) REFERENCES public."PROJECTS"(project_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public."PURCHASES" ADD CONSTRAINT fk_purchases_buyer_wallet FOREIGN KEY (buyer_wallet_id) REFERENCES public."WALLETS"(wallet_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."PURCHASE_ITEMS" ADD CONSTRAINT fk_purchase_items_purchase FOREIGN KEY (purchase_id) REFERENCES public."PURCHASES"(purchase_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public."PURCHASE_ITEMS" ADD CONSTRAINT fk_purchase_items_listing FOREIGN KEY (listing_id) REFERENCES public."LISTINGS"(listing_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."TOKEN_ACTIVITY_LOGS" ADD CONSTRAINT fk_token_activity_logs_wallet FOREIGN KEY (wallet_id) REFERENCES public."WALLETS"(wallet_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public."TOKEN_ACTIVITY_LOGS" ADD CONSTRAINT fk_token_activity_logs_project_vintage FOREIGN KEY (project_vintage_id) REFERENCES public."PROJECT_VINTAGES"(project_vintage_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."RETIREMENTS" ADD CONSTRAINT fk_retirements_organization FOREIGN KEY (organization_id) REFERENCES public."ORGANIZATIONS"(organization_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public."RETIREMENTS" ADD CONSTRAINT fk_retirements_wallet FOREIGN KEY (wallet_id) REFERENCES public."WALLETS"(wallet_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public."RETIREMENTS" ADD CONSTRAINT fk_retirements_quota FOREIGN KEY (quota_id) REFERENCES public."CARBON_QUOTAS"(quota_id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE public."RETIREMENT_DETAILS" ADD CONSTRAINT fk_retirement_details_retirement FOREIGN KEY (retirement_id) REFERENCES public."RETIREMENTS"(retirement_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE public."RETIREMENT_DETAILS" ADD CONSTRAINT fk_retirement_details_project_vintage FOREIGN KEY (project_vintage_id) REFERENCES public."PROJECT_VINTAGES"(project_vintage_id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';

COMMIT;
