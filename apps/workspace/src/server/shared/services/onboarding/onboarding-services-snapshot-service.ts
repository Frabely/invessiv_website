import "server-only";

import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";

import { ONBOARDING_VISIBLE_LINE_ITEM_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-visible-line-item-statuses";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import {
  onboardingFormServices,
  projectLineItems,
} from "@invessiv/db/record-configuration";
import type { QuestionnaireReadExecutor } from "@/server/shared/services/questionnaire/questionnaire-definition-types";
import type {
  OnboardingFormRow,
  OnboardingServiceSource,
} from "./onboarding-form-types";

/** The booked services of a project as a form lists them, in the order they were booked. */
async function listLive(
  executor: QuestionnaireReadExecutor,
  projectId: string,
): Promise<OnboardingServiceSource[]> {
  const rows = await executor
    .select()
    .from(projectLineItems)
    .where(
      and(
        eq(projectLineItems.project_id, projectId),
        or(
          isNull(projectLineItems.status),
          inArray(projectLineItems.status, [
            ...ONBOARDING_VISIBLE_LINE_ITEM_STATUS_VALUES,
          ]),
        ),
      ),
    )
    .orderBy(asc(projectLineItems.created_at), asc(projectLineItems.id));
  return rows.map((row) => ({
    projectLineItemId: row.id,
    title: row.title,
    description: row.description,
  }));
}

async function listFrozen(
  executor: QuestionnaireReadExecutor,
  formId: string,
): Promise<OnboardingServiceSource[]> {
  const rows = await executor
    .select()
    .from(onboardingFormServices)
    .where(eq(onboardingFormServices.form_id, formId))
    .orderBy(asc(onboardingFormServices.position));
  return rows.map((row) => ({
    projectLineItemId: row.project_line_item_id,
    title: row.title,
    description: row.description,
  }));
}

/**
 * Copies what `listLive` shows right now into the snapshot. Writing from the same list the form
 * read a moment ago is what makes the frozen form show exactly what the customer confirmed.
 */
async function freeze(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
): Promise<void> {
  const services = await listLive(tx, form.project_id);
  if (services.length === 0) return;
  await tx.insert(onboardingFormServices).values(
    services.map((service, position) => ({
      id: crypto.randomUUID(),
      form_id: form.id,
      project_line_item_id: service.projectLineItemId,
      title: service.title,
      description: service.description,
      position,
    })),
  );
}

export const onboardingServicesSnapshotService = {
  freeze,
  listFrozen,
  listLive,
} as const;
