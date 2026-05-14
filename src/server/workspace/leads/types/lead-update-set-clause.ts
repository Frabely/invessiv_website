import { leads } from "@/server/db/record-configuration";

export type LeadUpdateSetClause = Partial<typeof leads.$inferInsert>;
