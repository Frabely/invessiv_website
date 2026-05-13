import "server-only";

import { z } from "zod";

import { LeadImportColumnKey } from "@/common/constants/leads/import/columns/lead-import-column-keys";
import { LeadImportWarningCode } from "@/common/constants/leads/import/warnings/lead-import-warning-codes";
import { LeadImportRowIssueCode } from "@/common/constants/leads/import/issues/lead-import-row-issue-codes";
import { LeadImportRowIssueSeverity } from "@/common/constants/leads/import/issues/lead-import-row-issue-severities";
import type { LeadImportRowIssueDto } from "@/common/contracts/leads";
import { leadOptionalTextSchema } from "@/server/workspace/leads/shared/lead-validation-core";
import { leadImportSocialProfileMapperService } from "@/server/workspace/leads/services/import/lead-import-social-profile-mapper-service";
import { leadImportFieldValidationService } from "@/server/workspace/leads/services/import/lead-import-field-validation-service";
import { deriveLeadDisplayName } from "@/server/workspace/leads/shared/lead-display-name";
import type { RawLeadImportRow } from "@/common/contracts/leads/import/csv/lead-import-raw-row";
import type { LeadImportValidationContext } from "@/common/contracts/leads/import/validation/lead-import-validation-context";
import type { LeadImportValidationResult } from "@/common/contracts/leads/import/validation/lead-import-validation-result";
import type { ValidatedLeadImportRow } from "@/common/contracts/leads/import/validation/lead-import-valid-row";

type LeadImportRowSchemaInput = z.infer<typeof leadImportRowSchema>;
type LeadImportIssueCode =
  | LeadImportRowIssueCode
  | (typeof LeadImportWarningCode)[keyof typeof LeadImportWarningCode];

function trimOptionalValue(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseDelimitedTokens(value: string | undefined): {
  tokens: string[];
  emptyTokenCount: number;
} {
  const trimmed = trimOptionalValue(value);
  if (trimmed === undefined) {
    return { tokens: [], emptyTokenCount: 0 };
  }

  const tokens: string[] = [];
  let emptyTokenCount = 0;

  for (const token of trimmed.split("|")) {
    const normalizedToken = token.trim();
    if (normalizedToken.length === 0) {
      emptyTokenCount += 1;
      continue;
    }

    tokens.push(normalizedToken);
  }

  return { tokens, emptyTokenCount };
}

const leadImportRowSchema = z.object({
  display_name: leadOptionalTextSchema,
  email: leadOptionalTextSchema,
  first_name: leadOptionalTextSchema,
  last_name: leadOptionalTextSchema,
  company_name: leadOptionalTextSchema,
  phone: leadOptionalTextSchema,
  owner: leadOptionalTextSchema,
  notes: leadOptionalTextSchema,
  external_guid: leadOptionalTextSchema,
  website_url: leadOptionalTextSchema,
  linkedin_url: leadOptionalTextSchema,
  instagram_url: leadOptionalTextSchema,
  youtube_url: leadOptionalTextSchema,
  category: leadOptionalTextSchema,
  category_id: leadOptionalTextSchema,
  score: leadOptionalTextSchema,
  status: leadOptionalTextSchema,
  improvements: leadOptionalTextSchema,
});

function createIssue(
  rowIndex: number,
  code: LeadImportIssueCode,
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

function validateOptionalExternalGuid(
  value: string | undefined,
  rowIndex: number,
): { value?: string; issue?: LeadImportRowIssueDto } {
  const trimmed = trimOptionalValue(value);
  if (trimmed === undefined) {
    return {};
  }

  if (trimmed.length > 128) {
    return {
      issue: createIssue(
        rowIndex,
        LeadImportRowIssueCode.InvalidExternalGuid,
        LeadImportRowIssueSeverity.Error,
        LeadImportColumnKey.ExternalGuid,
      ),
    };
  }

  return { value: trimmed };
}

function parseImprovements(
  value: string | undefined,
  rowIndex: number,
  issues: LeadImportRowIssueDto[],
): string[] {
  const { tokens, emptyTokenCount } = parseDelimitedTokens(value);

  for (let index = 0; index < emptyTokenCount; index += 1) {
    issues.push(
      createIssue(
        rowIndex,
        LeadImportWarningCode.EmptyImprovementToken,
        LeadImportRowIssueSeverity.Warning,
        LeadImportColumnKey.Improvements,
      ),
    );
  }

  return tokens;
}

function buildValidatedRow(
  raw: LeadImportRowSchemaInput,
  rowIndex: number,
  issues: LeadImportRowIssueDto[],
): ValidatedLeadImportRow {
  const explicitDisplayName = trimOptionalValue(raw.display_name);
  const email = trimOptionalValue(raw.email);
  const firstName = trimOptionalValue(raw.first_name);
  const lastName = trimOptionalValue(raw.last_name);
  const companyName = trimOptionalValue(raw.company_name);
  const phone = trimOptionalValue(raw.phone);
  const owner = trimOptionalValue(raw.owner);
  const notes = trimOptionalValue(raw.notes);
  const externalGuidResult = validateOptionalExternalGuid(
    raw.external_guid,
    rowIndex,
  );
  const categoryIdResult =
    leadImportFieldValidationService.validateImportOptionalUuid(
      raw.category_id,
      rowIndex,
      LeadImportColumnKey.CategoryId,
    );
  const categorySlug = trimOptionalValue(raw.category);
  const scoreResult =
    leadImportFieldValidationService.validateImportOptionalScore(
      raw.score,
      rowIndex,
    );
  const improvements = parseImprovements(raw.improvements, rowIndex, issues);
  const statusResult = leadImportFieldValidationService.validateImportStatus(
    raw.status,
    rowIndex,
  );
  const socialProfilesResult =
    leadImportSocialProfileMapperService.mapImportSocialProfiles(raw, rowIndex);

  if (categoryIdResult.issue) {
    issues.push(categoryIdResult.issue);
  }

  if (scoreResult.issue) {
    issues.push(scoreResult.issue);
  }

  if (externalGuidResult.issue) {
    issues.push(externalGuidResult.issue);
  }

  if (statusResult.issue) {
    issues.push(statusResult.issue);
  }

  issues.push(...socialProfilesResult.issues);

  const displayName =
    explicitDisplayName ??
    deriveLeadDisplayName({
      companyName,
      firstName,
      lastName,
    }) ??
    "";

  if (!displayName) {
    issues.push(
      createIssue(
        rowIndex,
        LeadImportRowIssueCode.MissingDisplayName,
        LeadImportRowIssueSeverity.Error,
      ),
    );
  }

  return {
    displayName,
    email,
    first_name: firstName,
    last_name: lastName,
    company_name: companyName,
    phone,
    owner,
    notes,
    external_guid: externalGuidResult.value,
    website_url: trimOptionalValue(raw.website_url),
    category_slug: categorySlug?.toLowerCase(),
    category_id: categoryIdResult.value,
    score: scoreResult.value,
    status: statusResult.value,
    improvements,
    social_profiles: socialProfilesResult.socialProfiles,
  };
}

function createDuplicateIssue(
  rowIndex: number,
  code: LeadImportRowIssueCode,
  column: LeadImportColumnKey,
): LeadImportRowIssueDto {
  return createIssue(rowIndex, code, LeadImportRowIssueSeverity.Skip, column);
}

function validateRow(
  raw: RawLeadImportRow,
  ctx: LeadImportValidationContext,
): LeadImportValidationResult {
  const parsed = leadImportRowSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Unexpected invalid raw import row shape");
  }

  const issues: LeadImportRowIssueDto[] = [];
  const emailResult = leadImportFieldValidationService.validateImportEmail(
    parsed.data.email,
    ctx.rowIndex,
  );
  if (emailResult.issue) {
    issues.push(emailResult.issue);
  }

  const validatedRow = buildValidatedRow(parsed.data, ctx.rowIndex, issues);

  if (emailResult.email !== undefined) {
    const emailKey = emailResult.email.toLowerCase();
    if (ctx.seenEmails.has(emailKey)) {
      issues.push(
        createDuplicateIssue(
          ctx.rowIndex,
          LeadImportRowIssueCode.DuplicateEmailInFile,
          LeadImportColumnKey.Email,
        ),
      );
    } else {
      ctx.seenEmails.add(emailKey);
    }
  }

  if (validatedRow.external_guid !== undefined) {
    if (ctx.seenExternalGuids.has(validatedRow.external_guid)) {
      issues.push(
        createDuplicateIssue(
          ctx.rowIndex,
          LeadImportRowIssueCode.DuplicateExternalGuidInFile,
          LeadImportColumnKey.ExternalGuid,
        ),
      );
    } else {
      ctx.seenExternalGuids.add(validatedRow.external_guid);
    }
  }

  const hasBlockingError = issues.some(
    (issue) => issue.severity === LeadImportRowIssueSeverity.Error,
  );

  if (hasBlockingError) {
    return {
      ok: false,
      issues,
    };
  }

  return {
    ok: true,
    value: validatedRow,
    issues,
  };
}

export const leadImportValidationService = {
  leadImportRowSchema,
  validateRow,
};
