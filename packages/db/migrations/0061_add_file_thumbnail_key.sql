-- Paket L: storage key of the small WebP preview next to the original upload.
-- Additive and idempotent. NULL means no preview; the UI then shows the file kind icon.
-- No index: the key is only read per row, never searched.
ALTER TABLE files
    ADD COLUMN IF NOT EXISTS thumbnail_key TEXT;
