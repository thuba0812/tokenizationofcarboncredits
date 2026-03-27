BEGIN;

ALTER TABLE public."LISTINGS"
DROP CONSTRAINT IF EXISTS chk_listings_available_amount;

ALTER TABLE public."LISTINGS"
DROP COLUMN IF EXISTS available_amount;

COMMIT;
