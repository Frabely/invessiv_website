-- Chat attachments reference existing file entries; composite keys keep message and file on one customer.
DO
$$
BEGIN
ALTER TABLE messages
    ADD CONSTRAINT messages_id_customer_unique UNIQUE (id, customer_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
DO
$$
BEGIN
ALTER TABLE files
    ADD CONSTRAINT files_id_customer_unique UNIQUE (id, customer_id);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS message_files
(
    id
    UUID
    PRIMARY
    KEY,
    message_id
    UUID
    NOT
    NULL,
    file_id
    UUID
    NOT
    NULL,
    customer_id
    UUID
    NOT
    NULL,
    position
    SMALLINT
    NOT
    NULL,
    created_at
    TIMESTAMPTZ
    NOT
    NULL
    DEFAULT
    NOW
(
),
    CONSTRAINT message_files_message_customer_fk FOREIGN KEY
(
    message_id,
    customer_id
)
    REFERENCES messages
(
    id,
    customer_id
) ON DELETE CASCADE,
    CONSTRAINT message_files_file_customer_fk FOREIGN KEY
(
    file_id,
    customer_id
)
    REFERENCES files
(
    id,
    customer_id
)
  ON DELETE CASCADE,
    CONSTRAINT message_files_message_file_unique UNIQUE
(
    message_id,
    file_id
),
    CONSTRAINT message_files_message_position_unique UNIQUE
(
    message_id,
    position
),
    CONSTRAINT message_files_position_check CHECK
(
    position
    >=
    0
    AND
    position <
    10
)
    );
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS message_files_file_idx ON message_files (file_id);
