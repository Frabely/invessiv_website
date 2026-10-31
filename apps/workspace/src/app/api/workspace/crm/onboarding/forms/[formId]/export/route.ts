import "server-only";

import type { NextRequest } from "next/server";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { OnboardingFormQueryParam } from "@/common/constants/crm/onboarding/onboarding-form-query-params";
import { ARCHIVE_TIME_BUDGET_MS } from "@/common/constants/files/file-archive-limits";
import { isSupportedLocale } from "@/config/i18n";
import { withCrmPermission } from "@/lib/auth/api";
import {
  fileArchiveResponse,
  privateFileResponse,
} from "@/lib/files/file-api-response";
import { DEFAULT_LOCALE } from "@/lib/site-metadata";
import { onboardingApiError } from "@/lib/workspace/crm/onboarding-api-error";
import { runQuestionnaireRoute } from "@/lib/workspace/crm/questionnaire-api-response";
import { fileArchiveService } from "@/server/shared/files/file-archive-service";
import { exportOnboardingForm } from "@/server/workspace/crm/query-handler/export-onboarding-form.query-handler";

export const runtime = "nodejs";
export const maxDuration = 120;

type RouteContext = { params: Promise<{ formId: string }> };

/** Read access is enough: the export is available in every status, drafts included. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const deadlineAt = Date.now() + ARCHIVE_TIME_BUDGET_MS;
  const { formId } = await params;
  return privateFileResponse(() =>
    withCrmPermission(
      CrmEndpointAccessRule.OnboardingForm,
      (authorized, actor) =>
        runQuestionnaireRoute(CrmOperation.ExportOnboardingForm, async () => {
          const requested = authorized.nextUrl.searchParams.get(
            OnboardingFormQueryParam.Locale,
          );
          const locale =
            requested && isSupportedLocale(requested)
              ? requested
              : DEFAULT_LOCALE;
          const archive = await exportOnboardingForm(formId, actor, locale);
          if (!archive)
            return onboardingApiError(OnboardingErrorCode.FormNotFound);
          return fileArchiveResponse(
            fileArchiveService.stream(archive.entries, authorized.signal, {
              deadlineAt,
              manifest: archive.manifest,
              texts: archive.texts,
            }),
            archive.filename,
          );
        }),
    )(request),
  );
}
