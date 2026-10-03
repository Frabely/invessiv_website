import "server-only";

import { and, eq, inArray, type SQL } from "drizzle-orm";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { OnboardingBlockReviewRef } from "@invessiv/common/contracts/crm/onboarding/onboarding-block-review-ref";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import { listCustomerEditableOnboardingBlockIds } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import {
  type ContactDatabaseReader,
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import {
  onboardingFormBlocks,
  onboardingForms,
  projects,
} from "@invessiv/db/record-configuration";
import type { PortalActor } from "@/server/portal/auth/portal-actor";
import { isPortalOwnerView } from "@/server/portal/auth/portal-owner-view";
import type { PortalReader } from "@/server/portal/auth/portal-reader";
import { portalCanOn } from "@/server/portal/shared/portal-can-on";
import { portalProjectCondition } from "@/server/portal/shared/portal-project-condition";
import type { OnboardingFormRow } from "@/server/shared/services/onboarding/onboarding-form-types";
import { portalOnboardingSchemas } from "./portal-onboarding-schemas";
import type { PortalVisibleOnboardingForm } from "./portal-onboarding-types";

function canRead(reader: PortalReader): boolean {
  return portalCanOn.forReader(reader, Permission.PortalOnboardingRead, {
    customerId: reader.customerId,
  });
}

/** The owner view reads but never writes, whatever it holds. */
function canSubmit(reader: PortalReader): boolean {
  return (
    !isPortalOwnerView(reader) &&
    canRead(reader) &&
    portalCanOn.forActor(reader, Permission.PortalOnboardingSubmit, {
      customerId: reader.customerId,
    })
  );
}

/**
 * Attaching and detaching show files through the portal's file visibility, which needs
 * `portal.files.read`. Without it a contact could hang files onto a field and never see them again.
 */
function canAttach(reader: PortalReader): boolean {
  return (
    canSubmit(reader) &&
    portalCanOn.forReader(reader, Permission.PortalFilesRead, {
      customerId: reader.customerId,
    })
  );
}

function notFound(): PortalOnboardingResult<never> {
  return { ok: false, code: PortalOnboardingErrorCode.NotFound };
}

function validation(): PortalOnboardingResult<never> {
  return { ok: false, code: PortalOnboardingErrorCode.Validation };
}

/**
 * The single definition of "a form the portal shows to this reader": released, of the reader's
 * company and on a project the portal shows. Expects `projects` joined to the form.
 */
function visibleCondition(reader: PortalReader): SQL {
  return and(
    eq(onboardingForms.customer_id, reader.customerId),
    inArray(onboardingForms.status, [
      ...ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES,
    ]),
    portalProjectCondition(reader, Permission.PortalOnboardingRead),
  )!;
}

function selectVisibleForms(executor: ContactDatabaseReader, condition: SQL) {
  return executor
    .select({ form: onboardingForms, projectTitle: projects.title })
    .from(onboardingForms)
    .innerJoin(projects, eq(projects.id, onboardingForms.project_id))
    .where(condition);
}

/** The released form of one visible project, if present. */
async function findVisibleFormForProject(
  executor: ContactDatabaseReader,
  reader: PortalReader,
  projectId: string,
): Promise<PortalVisibleOnboardingForm | null> {
  const id = portalOnboardingSchemas.id.safeParse(projectId);
  if (!id.success) return null;
  const [row] = await selectVisibleForms(
    executor,
    and(eq(onboardingForms.project_id, id.data), visibleCondition(reader))!,
  ).limit(1);
  return row ?? null;
}

/** Every miss — guessed id, foreign company, draft, hidden project, missing permission — is null. */
async function findVisibleForm(
  executor: ContactDatabaseReader,
  reader: PortalReader,
  formId: string,
): Promise<PortalVisibleOnboardingForm | null> {
  const id = portalOnboardingSchemas.id.safeParse(formId);
  if (!id.success) return null;
  const [row] = await selectVisibleForms(
    executor,
    and(eq(onboardingForms.id, id.data), visibleCondition(reader))!,
  ).limit(1);
  return row ?? null;
}

/**
 * The frame of every portal form command: one transaction, the form locked first, a miss as
 * `not_found`. Autosaves and the submission of one form serialize on this lock, so nothing is
 * written into a form that was submitted a moment before.
 */
function withLockedForm<T>(
  actor: PortalActor,
  formId: string,
  run: (
    tx: ContactDatabaseTransaction,
    locked: PortalVisibleOnboardingForm,
  ) => Promise<PortalOnboardingResult<T>>,
): Promise<PortalOnboardingResult<T>> {
  const id = portalOnboardingSchemas.id.safeParse(formId);
  if (!canSubmit(actor) || !id.success) return Promise.resolve(notFound());
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const [locked] = await selectVisibleForms(
      tx,
      and(eq(onboardingForms.id, id.data), visibleCondition(actor))!,
    )
      .limit(1)
      .for("update", { of: onboardingForms });
    return locked ? run(tx, locked) : notFound();
  });
}

function editableBlockIds(
  reader: PortalReader,
  status: OnboardingFormStatus,
  blocks: readonly OnboardingBlockReviewRef[],
): string[] {
  return canSubmit(reader)
    ? listCustomerEditableOnboardingBlockIds(status, blocks)
    : [];
}

async function loadReviewRefs(
  executor: ContactDatabaseReader,
  formId: string,
): Promise<OnboardingBlockReviewRef[]> {
  return executor
    .select({
      blockId: onboardingFormBlocks.block_id,
      reviewStatus: onboardingFormBlocks.review_status,
      clarificationMode: onboardingFormBlocks.clarification_mode,
    })
    .from(onboardingFormBlocks)
    .where(eq(onboardingFormBlocks.form_id, formId));
}

/** The blocks the actor may write into right now, read under the form lock. */
async function listEditableBlockIds(
  tx: ContactDatabaseTransaction,
  actor: PortalActor,
  form: OnboardingFormRow,
): Promise<string[]> {
  return editableBlockIds(
    actor,
    form.status,
    await loadReviewRefs(tx, form.id),
  );
}

export const portalOnboardingAccessService = {
  canAttach,
  canRead,
  canSubmit,
  editableBlockIds,
  findVisibleForm,
  listEditableBlockIds,
  findVisibleFormForProject,
  loadReviewRefs,
  notFound,
  validation,
  withLockedForm,
} as const;
