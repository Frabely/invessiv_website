import "server-only";

import { and, asc, eq } from "drizzle-orm";

import type { LeadCategoryDto } from "@invessiv/common/contracts/leads/lead-category.dto";
import { leadCategories } from "@invessiv/db/record-configuration";
import type { CrmDatabaseExecutor } from "@/server/workspace/crm/crm-types";

/** The foreign key accepts inactive categories, the dialog only offers active ones. */
async function isActive(
  executor: CrmDatabaseExecutor,
  categoryId: string,
): Promise<boolean> {
  const [row] = await executor
    .select({ id: leadCategories.id })
    .from(leadCategories)
    .where(
      and(
        eq(leadCategories.id, categoryId),
        eq(leadCategories.is_active, true),
      ),
    )
    .limit(1);

  return Boolean(row);
}

async function listActive(
  executor: CrmDatabaseExecutor,
): Promise<LeadCategoryDto[]> {
  const rows = await executor
    .select({
      id: leadCategories.id,
      slug: leadCategories.slug,
      label_key: leadCategories.label_key,
    })
    .from(leadCategories)
    .where(eq(leadCategories.is_active, true))
    .orderBy(asc(leadCategories.sort_order), asc(leadCategories.slug));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    labelKey: row.label_key,
  }));
}

export const customerCategoryService = {
  isActive,
  listActive,
} as const;
