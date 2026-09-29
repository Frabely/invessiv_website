import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  smallint,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { MESSAGE_ATTACHMENTS_MAX } from "@invessiv/common/constants/crm/message-limits";
import { MessageFilesConstraintName as N } from "@invessiv/db/constraint-names/crm/message-files-constraint-names";
import { files } from "./files";
import { messages } from "./messages";

/** Immutable references from a message to file entries of the same customer. */
export const messageFiles = pgTable(
  "message_files",
  {
    id: uuid("id").primaryKey(),
    message_id: uuid("message_id").notNull(),
    file_id: uuid("file_id").notNull(),
    customer_id: uuid("customer_id").notNull(),
    position: smallint("position").notNull(),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: N.MessageCustomerForeignKey,
      columns: [t.message_id, t.customer_id],
      foreignColumns: [messages.id, messages.customer_id],
    }).onDelete("cascade"),
    foreignKey({
      name: N.FileCustomerForeignKey,
      columns: [t.file_id, t.customer_id],
      foreignColumns: [files.id, files.customer_id],
    }).onDelete("cascade"),
    unique(N.MessageFileUnique).on(t.message_id, t.file_id),
    unique(N.MessagePositionUnique).on(t.message_id, t.position),
    check(
      N.PositionCheck,
      sql`${t.position}
            >= 0 AND
            ${t.position}
            <
            ${sql.raw(String(MESSAGE_ATTACHMENTS_MAX))}`,
    ),
    index(N.FileIndex).on(t.file_id),
  ],
);
