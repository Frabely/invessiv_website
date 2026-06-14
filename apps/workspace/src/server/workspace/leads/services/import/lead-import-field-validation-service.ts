import { LeadImportColumnKey } from "@invessiv/common/constants/leads/import/columns/lead-import-column-keys";
import { LeadImportWarningCode } from "@invessiv/common/constants/leads/import/warnings/lead-import-warning-codes";
import { LeadImportRowIssueCode } from "@invessiv/common/constants/leads/import/issues/lead-import-row-issue-codes";
import { LeadImportRowIssueSeverity } from "@invessiv/common/constants/leads/import/issues/lead-import-row-issue-severities";
import { LEAD_IMPORT_STATUS_SYNONYMS } from "@/common/constants/leads/import/status/lead-import-status-synonyms";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { LeadImportRowIssueDto } from "@invessiv/common/contracts/leads";
import {
  leadEmailSchema,
  leadScoreSchema,
  leadUuidSchema,
} from "@/server/workspace/leads/shared/lead-validation-core";

function createIssue(
  rowIndex: number,
  code:
    | LeadImportRowIssueCode
    | (typeof LeadImportWarningCode)[keyof typeof LeadImportWarningCode],
  severity: LeadImportRowIssueSeverity,
  column?: LeadImportColumnKey,
): LeadImportRowIssueDto {
  return {
    rowIndex,
    code,
    severity,
    ...(column !== undefined ? { column } : {}),
  };
}

function validateImportEmail(rawEmail: string | undefined, rowIndex: number) {
  const email = rawEmail?.trim();
  if (email === undefined || email.length === 0) {
    return {};
  }

  if (!leadEmailSchema.safeParse(email).success) {
    return {
      issue: createIssue(
        rowIndex,
        LeadImportRowIssueCode.InvalidEmail,
        LeadImportRowIssueSeverity.Error,
        LeadImportColumnKey.Email,
      ),
    };
  }

  return { email };
}

function validateImportOptionalUuid(
  value: string | undefined,
  rowIndex: number,
  column: LeadImportColumnKey,
) {
  const trimmed = value?.trim();
  if (trimmed === undefined) {
    return {};
  }

  if (!leadUuidSchema.safeParse(trimmed).success) {
    return {
      issue: createIssue(
        rowIndex,
        LeadImportRowIssueCode.UnknownCategoryId,
        LeadImportRowIssueSeverity.Error,
        column,
      ),
    };
  }

  return { value: trimmed };
}

function validateImportOptionalScore(
  value: string | undefined,
  rowIndex: number,
) {
  const trimmed = value?.trim();
  if (trimmed === undefined) {
    return {};
  }

  if (!leadScoreSchema.safeParse(Number(trimmed)).success) {
    return {
      issue: createIssue(
        rowIndex,
        LeadImportRowIssueCode.InvalidScore,
        LeadImportRowIssueSeverity.Error,
        LeadImportColumnKey.Score,
      ),
    };
  }

  return { value: Number(trimmed) };
}

function validateImportStatus(
  value: string | undefined,
  rowIndex: number,
): { value?: ContactLeadStatus; issue?: LeadImportRowIssueDto } {
  const trimmed = value?.trim();
  if (trimmed === undefined) {
    return {};
  }

  const resolved = LEAD_IMPORT_STATUS_SYNONYMS[trimmed.toLowerCase()];
  if (resolved !== undefined) {
    return { value: resolved };
  }

  return {
    value: ContactLeadStatus.PendingReview,
    issue: createIssue(
      rowIndex,
      LeadImportWarningCode.UnknownStatusFallback,
      LeadImportRowIssueSeverity.Warning,
      LeadImportColumnKey.Status,
    ),
  };
}

export const leadImportFieldValidationService = {
  validateImportEmail,
  validateImportOptionalUuid,
  validateImportOptionalScore,
  validateImportStatus,
};
