import "server-only";

import { eq } from "drizzle-orm";
import type { z } from "zod";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import type { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { OnboardingTransitionSide } from "@invessiv/common/constants/crm/onboarding/onboarding-transition-sides";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { OnboardingCommandResult } from "@invessiv/common/contracts/crm/onboarding/results/onboarding-command-result";
import { canTransitionOnboardingForm } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import {
  type ContactDatabaseTransaction,
  getDrizzleDatabaseClient,
} from "@invessiv/db/core";
import { projects } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import type { OnboardingFormRow } from "@/server/shared/services/onboarding/onboarding-form-types";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { questionnaireCommandSupport } from "@/server/workspace/crm/services/questionnaire/questionnaire-command-support";
import { versionConflict } from "@/server/workspace/shared/version-conflict";
import { onboardingFormAccessService } from "./onboarding-form-access-service";
import { onboardingFormSchemas } from "./onboarding-form-schemas";

type FormResult = OnboardingCommandResult<OnboardingFormDto>;
type Rejection = Extract<FormResult, { ok: false }>;

type ParsedFormCommand<TSchema extends z.ZodType> =
  { ok: true; data: z.output<TSchema> } | { ok: false; result: Rejection };

const FORM_NOT_FOUND = {
  ok: false,
  code: OnboardingErrorCode.FormNotFound,
} as const;

/** The form id first, then the body: a malformed id answers as a missing form whatever the body says. */
function parse<TSchema extends z.ZodType>(
  formId: string,
  schema: TSchema,
  input: unknown,
): ParsedFormCommand<TSchema> {
  if (!onboardingFormSchemas.entityId.safeParse(formId).success)
    return { ok: false, result: FORM_NOT_FOUND };
  return questionnaireCommandSupport.parse(schema, input);
}

async function loadProjectTitle(
  tx: ContactDatabaseTransaction,
  form: OnboardingFormRow,
): Promise<string> {
  const [project] = await tx
    .select({ title: projects.title })
    .from(projects)
    .where(eq(projects.id, form.project_id))
    .limit(1);
  if (!project) throw new Error("Onboarding form without its project");
  return project.title;
}

/**
 * Runs a status change of a form the team triggers. The form is locked for the actor; the step is
 * checked before the version, so a form that already went there stays so whatever the client read.
 * `command` checks what is specific to the step and returns the rejection or the changed form;
 * the answer is the whole form, which also serves the current state on a stale version.
 */
async function runFormTransition(args: {
  formId: string;
  actor: WorkspaceActor;
  target: OnboardingFormStatus;
  expectedVersion: number;
  command: (
    tx: ContactDatabaseTransaction,
    form: OnboardingFormRow,
    toDto: (row: OnboardingFormRow) => Promise<OnboardingFormDto>,
  ) => Promise<Rejection | { next: OnboardingFormRow }>;
}): Promise<FormResult> {
  const { formId, actor, target, expectedVersion, command } = args;
  return getDrizzleDatabaseClient().transaction(async (tx) => {
    const form = await onboardingFormAccessService.lockWritableForm(
      tx,
      formId,
      actor,
    );
    if (!form) return FORM_NOT_FOUND;
    if (
      !canTransitionOnboardingForm(
        form.status,
        target,
        OnboardingTransitionSide.Internal,
      )
    )
      return { ok: false, code: OnboardingErrorCode.InvalidTransition };

    const toDto = (row: OnboardingFormRow) =>
      onboardingFormReadService.toFormDto(
        tx,
        row,
        fileAccessService.readableCondition(actor),
      );
    if (form.version !== expectedVersion)
      return versionConflict(form.version, await toDto(form));

    const result = await command(tx, form, toDto);
    if ("next" in result) return { ok: true, value: await toDto(result.next) };
    return result;
  });
}

export const onboardingFormCommandSupport = {
  loadProjectTitle,
  parse,
  runFormTransition,
} as const;
