-- Pre-production schema correction: customer type was never used by a product workflow.
-- Dropping the column also removes its dependent check constraint.
ALTER TABLE customers
COLUMN IF EXISTS customer_type;
