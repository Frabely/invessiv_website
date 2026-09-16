-- Approved exception to the additive migration rule: customer type was never used by a
-- product workflow and is removed from the data model, not merely hidden in the UI.
ALTER TABLE customers
DROP
CONSTRAINT IF EXISTS customers_customer_type_check;

--> statement-breakpoint

ALTER TABLE customers
DROP
COLUMN IF EXISTS customer_type;
