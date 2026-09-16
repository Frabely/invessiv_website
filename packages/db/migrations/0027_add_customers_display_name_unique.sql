-- The display name is the only guard against creating the same customer twice
-- (decision of 13.09.2026). Normalized like every other name comparison, across all
-- statuses including archived, so a reactivated customer can never collide.
-- Purely additive: before this unit no application path writes customers.
CREATE UNIQUE INDEX IF NOT EXISTS customers_display_name_lower_uidx
    ON customers (LOWER (BTRIM(display_name)));
