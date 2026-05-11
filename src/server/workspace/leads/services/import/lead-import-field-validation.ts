import { LeadImportColumnKey } from "@/common/constants/leads/import/lead-import-column-keys";
import { LeadImportWarningCode } from "@/common/constants/leads/import/lead-import-warning-codes";
import { LeadImportRowIssueCode } from "@/common/constants/leads/import/lead-import-row-issue-codes";
import { LeadImportRowIssueSeverity } from "@/common/constants/leads/import/lead-import-row-issue-severities";
import { LEAD_IMPORT_STATUS_SYNONYMS } from "@/common/constants/leads/import/lead-import-status-synonyms";
import { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import type { LeadImportRowIssueDto } from "@/common/contracts/leads";
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

export function validateImportEmail(
  rawEmail: string | undefined,
  rowIndex: number,
) {
  const email = rawEmail?.trim();
  if (email === undefined) {
    return {
      issue: createIssue(
        rowIndex,
        LeadImportRowIssueCode.MissingEmail,
        LeadImportRowIssueSeverity.Error,
        LeadImportColumnKey.Email,
      ),
    };
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

export function validateImportOptionalUuid(
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

export function validateImportOptionalScore(
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

export function validateImportStatus(
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
    value: ContactLeadStatus.New,
    issue: createIssue(
      rowIndex,
      LeadImportWarningCode.UnknownStatusFallback,
      LeadImportRowIssueSeverity.Warning,
      LeadImportColumnKey.Status,
    ),
  };
}
