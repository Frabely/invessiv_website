import "server-only";

import { and, eq } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { QuestionnairePrefillSource } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { validateQuestionnaireValue } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-field-value";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  customerContactAssignments,
  customers,
  people,
} from "@invessiv/db/record-configuration";
import { canOn } from "@/common/patterns/auth/can-on";
import type { PrefillRows, PrefillTarget } from "./onboarding-prefill-types";

function addressOf(customer: {
  street: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}): string {
  return [
    customer.street,
    [customer.postalCode, customer.city].filter(Boolean).join(" "),
    customer.country,
  ]
    .map((line) => line?.trim())
    .filter(Boolean)
    .join("\n");
}

/** Read-only: nothing from a form is ever written back to these columns. */
async function loadCrmValues(
  tx: ContactDatabaseTransaction,
  customerId: string,
): Promise<Record<QuestionnairePrefillSource, string | null>> {
  const [row] = await tx
    .select({
      companyName: customers.company_name,
      street: customers.street,
      postalCode: customers.postal_code,
      city: customers.city,
      country: customers.country,
      vatId: customers.vat_id,
      websiteUrl: customers.website_url,
      contactName: people.display_name,
      businessEmail: customerContactAssignments.business_email,
      personalEmail: people.primary_email,
      businessPhone: customerContactAssignments.business_phone,
      personalPhone: people.primary_phone,
    })
    .from(customers)
    .leftJoin(
      customerContactAssignments,
      and(
        eq(customerContactAssignments.customer_id, customers.id),
        eq(customerContactAssignments.is_primary, true),
      ),
    )
    .leftJoin(people, eq(people.id, customerContactAssignments.person_id))
    .where(eq(customers.id, customerId))
    .limit(1);
  return {
    [QuestionnairePrefillSource.CustomerCompanyName]: row?.companyName ?? null,
    [QuestionnairePrefillSource.CustomerAddress]: row ? addressOf(row) : null,
    [QuestionnairePrefillSource.CustomerVatId]: row?.vatId ?? null,
    [QuestionnairePrefillSource.CustomerWebsiteUrl]: row?.websiteUrl ?? null,
    [QuestionnairePrefillSource.PrimaryContactName]: row?.contactName ?? null,
    [QuestionnairePrefillSource.PrimaryContactEmail]:
      row?.businessEmail || row?.personalEmail || null,
    [QuestionnairePrefillSource.PrimaryContactPhone]:
      row?.businessPhone || row?.personalPhone || null,
  };
}

/**
 * Block-level fields with a source get the CRM value unless an answer was taken over. A value
 * that does not pass the field's own validation is left out rather than stored half right.
 */
async function fillFromCrm(
  tx: ContactDatabaseTransaction,
  target: PrefillTarget,
  blocks: readonly QuestionnaireBlockDto[],
  rows: PrefillRows,
): Promise<void> {
  // Customer master data needs the right to read the customer, which `projects.write` does not imply.
  if (
    !canOn(target.actor, Permission.CustomersRead, {
      customerId: target.form.customer_id,
    })
  )
    return;
  const answered = new Set(rows.answers.map((answer) => answer.slot.fieldId));
  const fields = blocks
    .flatMap((block) => block.fields)
    .filter((field) => field.prefillSource !== null && !answered.has(field.id));
  if (fields.length === 0) return;
  const values = await loadCrmValues(tx, target.form.customer_id);
  for (const field of fields) {
    const value = values[field.prefillSource!]?.trim();
    if (value && validateQuestionnaireValue(field, value).ok)
      rows.answers.push({
        slot: {
          formId: target.form.id,
          fieldId: field.id,
          groupEntryId: null,
        },
        content: { values: [value] },
      });
  }
}

export const onboardingPrefillCrmService = { fillFromCrm } as const;
