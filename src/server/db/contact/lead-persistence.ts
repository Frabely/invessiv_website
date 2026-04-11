import "server-only";
import type { NeonQueryFunctionInTransaction } from "@neondatabase/serverless";
import type { PreparedLeadRecord } from "@/server/db/records/contact/prepared-lead-record";

export type PersistLeadResult = {
  persisted: boolean;
  leadId?: string;
};

export async function persistLead(
  tx: NeonQueryFunctionInTransaction<boolean, boolean>,
  lead: PreparedLeadRecord,
): Promise<PersistLeadResult> {
  const result = (await tx`
    INSERT INTO leads (
      id,
      first_name,
      last_name,
      email,
      lead_status,
      created_at,
      updated_at
    )
    VALUES (
      ${lead.id},
      ${lead.firstName},
      ${lead.lastName},
      ${lead.email},
      ${lead.leadStatus},
      ${lead.createdAt},
      ${lead.updatedAt}
    )
    ON CONFLICT ((LOWER(BTRIM(email))))
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      email = EXCLUDED.email,
      updated_at = EXCLUDED.updated_at
    RETURNING id
  `) as Array<{ id: string }>;

  const leadId = result[0]?.id ?? lead.id;

  return {
    leadId,
    persisted: true,
  };
}
