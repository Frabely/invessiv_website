import { and, eq, inArray, like, or } from "drizzle-orm";
import { BlobNotFoundError, del } from "@vercel/blob";
import { type ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  activities,
  customers,
  files,
  lineItemTemplates,
  people,
  projects,
  roles,
} from "@invessiv/db/record-configuration";
import { PORTAL_E2E_PREFIX as PREFIX } from "@/common/constants/testing/portal-e2e-prefix";
export async function removeOldCustomers(tx: ContactDatabaseTransaction) {
  const oldCustomers = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(like(customers.display_name, `${PREFIX}%`));
  if (oldCustomers.length) {
    const customerIds = oldCustomers.map((row) => row.id);
    const storedFiles = await tx
      .select({ customerId: files.customer_id, storageKey: files.storage_key })
      .from(files)
      .where(inArray(files.customer_id, customerIds));
    if (storedFiles.some((row) => row.storageKey)) {
      for (const row of storedFiles) {
        if (!row.storageKey) continue;
        if (!row.storageKey.startsWith(`customers/${row.customerId}/`))
          throw new Error("Portal E2E file has an unexpected storage scope.");
        // Keep the database reference if storage cleanup fails so the next run can retry.
        try {
          await del(row.storageKey);
        } catch (error) {
          if (!(error instanceof BlobNotFoundError)) throw error;
        }
      }
    }
    const oldProjects = await tx
      .select({ id: projects.id })
      .from(projects)
      .where(inArray(projects.customer_id, customerIds));
    await tx.delete(activities).where(
      oldProjects.length > 0
        ? or(
            inArray(activities.customer_id, customerIds),
            inArray(
              activities.project_id,
              oldProjects.map((row) => row.id),
            ),
          )
        : inArray(activities.customer_id, customerIds),
    );
    await tx.delete(customers).where(inArray(customers.id, customerIds));
  }
  const oldPeople = await tx
    .select({ id: people.id })
    .from(people)
    .where(like(people.display_name, `${PREFIX}%`));
  if (oldPeople.length) {
    await tx.delete(people).where(
      inArray(
        people.id,
        oldPeople.map((row) => row.id),
      ),
    );
  }
  // Catalog entries belong to no customer; requests of an earlier run went with their customers.
  await tx
    .delete(lineItemTemplates)
    .where(like(lineItemTemplates.title, `${PREFIX}%`));
  // Custom roles of an earlier run; their memberships went with the customers above.
  await tx
    .delete(roles)
    .where(and(like(roles.name, `${PREFIX}%`), eq(roles.is_system, false)));
}
