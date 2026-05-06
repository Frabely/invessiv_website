import { asc } from "drizzle-orm";
import { getDrizzleDatabaseClient } from "@/server/db/core";
import { leadCategories } from "@/server/db/record-configuration";
import type { LeadCategoryDto } from "@/common/contracts/leads/lead-category.dto";

export async function getLeadCategories(): Promise<LeadCategoryDto[]> {
  const db = getDrizzleDatabaseClient();

  const rows = await db
    .select({
      id: leadCategories.id,
      slug: leadCategories.slug,
      label_key: leadCategories.label_key,
    })
    .from(leadCategories)
    .orderBy(asc(leadCategories.sort_order), asc(leadCategories.slug));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    labelKey: row.label_key,
  }));
}
