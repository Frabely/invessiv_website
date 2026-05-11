import "server-only";

import { LeadImportErrorCode } from "@/common/constants/leads/import/errors/lead-import-error-codes";
import { LeadImportRowIssueCode } from "@/common/constants/leads/import/issues/lead-import-row-issue-codes";
import { LeadImportRowIssueSeverity } from "@/common/constants/leads/import/issues/lead-import-row-issue-severities";
import { LeadSource } from "@/common/constants/leads/sources/lead-sources";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import type { LeadImportReportDto } from "@/common/contracts/leads/import/lead-import-report.dto";
import type { LeadImportResultDto } from "@/common/contracts/leads/import/lead-import-result.dto";
import type { LeadImportRowIssueDto } from "@/common/contracts/leads";
import type {
  RowEntry,
  ValidatedRowEntry,
} from "@/common/contracts/leads/import/validation/lead-import-row-entry";
import { getDrizzleDatabaseClient } from "@/server/db/core";
import {
  LeadCsvParseError,
  leadCsvParserService,
} from "@/server/workspace/leads/services/import/lead-csv-parser-service";
import { leadCsvMappingService } from "@/server/workspace/leads/services/import/lead-csv-mapping-service";
import { leadImportValidationService } from "@/server/workspace/leads/services/import/lead-import-validation-service";
import { leadImportExistingKeysLoaderService } from "@/server/workspace/leads/services/import/lead-import-existing-keys-loader-service";
import { getLeadCategories } from "@/server/workspace/leads/query-handler/list-lead-categories.query-handler";
import { createLeadCoreInTransaction } from "@/server/workspace/leads/shared/create-lead-core";
import { DuplicateEmailError } from "@/server/workspace/leads/shared/duplicate-email-error.class";
import type { ValidatedLeadImportRow } from "@/common/contracts/leads/import/validation/lead-import-valid-row";
import { isDuplicateExternalGuidError } from "@/server/workspace/leads/shared/is-duplicate-email-error";

const MAX_DATA_ROWS = 500;

function makeSkipIssue(
  rowIndex: number,
  code: LeadImportRowIssueCode,
): LeadImportRowIssueDto {
  return { rowIndex, code, severity: LeadImportRowIssueSeverity.Skip };
}

function makeErrorIssue(
  rowIndex: number,
  code: LeadImportRowIssueCode,
): LeadImportRowIssueDto {
  return { rowIndex, code, severity: LeadImportRowIssueSeverity.Error };
}

export async function importLeads(file: File): Promise<LeadImportResultDto> {
  const text = await file.text();

  let headers: string[];
  let rows: string[][];

  try {
    const parsed = leadCsvParserService.parseLeadCsv(text, {
      maxDataRows: MAX_DATA_ROWS,
    });
    headers = parsed.headers;
    rows = parsed.rows;
  } catch (error) {
    if (error instanceof LeadCsvParseError) {
      return { ok: false, error: error.code };
    }
    return { ok: false, error: LeadImportErrorCode.Internal };
  }

  const totalRows = rows.length;
  const { columns, ignored: ignoredColumns } =
    leadCsvMappingService.mapHeadersToColumns(headers);

  const seenEmails = new Set<string>();
  const seenExternalGuids = new Set<string>();

  const validationEntries: RowEntry<ValidatedLeadImportRow>[] = rows.map(
    (row, index) => {
      const rowIndex = index + 1;
      const raw = leadCsvMappingService.mapRowToRaw(columns, row);
      const result = leadImportValidationService.validateRow(raw, {
        rowIndex,
        seenEmails,
        seenExternalGuids,
      });

      if (!result.ok) {
        return { ok: false, rowIndex, issues: result.issues };
      }

      return {
        ok: true,
        rowIndex,
        emailLower: result.value.email.toLowerCase().trim(),
        externalGuid: result.value.external_guid,
        validatedValue: result.value,
        issues: result.issues,
      };
    },
  );

  const successEntries = validationEntries.filter(
    (e): e is ValidatedRowEntry<ValidatedLeadImportRow> => e.ok,
  );
  const validEmails = successEntries.map((e) => e.emailLower);
  const validGuids = successEntries
    .map((e) => e.externalGuid)
    .filter((g): g is string => g !== undefined);

  let existingKeys: Awaited<
    ReturnType<typeof leadImportExistingKeysLoaderService.loadExistingKeys>
  >;
  let categorySlugToId: Map<string, string>;

  try {
    const [keys, categories] = await Promise.all([
      leadImportExistingKeysLoaderService.loadExistingKeys(
        validEmails,
        validGuids,
      ),
      getLeadCategories(),
    ]);
    existingKeys = keys;
    categorySlugToId = new Map(
      categories.map((c) => [c.slug.toLowerCase(), c.id]),
    );
  } catch {
    return { ok: false, error: LeadImportErrorCode.Internal };
  }

  const importBatchId = crypto.randomUUID();
  const db = getDrizzleDatabaseClient();
  const allRowIssues: LeadImportRowIssueDto[] = [];
  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const entry of validationEntries) {
    if (!entry.ok) {
      allRowIssues.push(...entry.issues);
      errorCount += 1;
      continue;
    }

    const { rowIndex, emailLower, externalGuid, validatedValue, issues } =
      entry;

    const hasSkipIssue = issues.some(
      (issue) => issue.severity === LeadImportRowIssueSeverity.Skip,
    );
    if (hasSkipIssue) {
      allRowIssues.push(...issues);
      skippedCount += 1;
      continue;
    }

    const categorySlug = validatedValue.category_slug;
    const resolvedCategoryId =
      validatedValue.category_id ??
      (categorySlug !== undefined
        ? categorySlugToId.get(categorySlug)
        : undefined);

    if (
      validatedValue.category_id === undefined &&
      categorySlug !== undefined &&
      resolvedCategoryId === undefined
    ) {
      allRowIssues.push(
        ...issues,
        makeErrorIssue(rowIndex, LeadImportRowIssueCode.UnknownCategoryId),
      );
      errorCount += 1;
      continue;
    }

    const existingByEmail = existingKeys.emailToLeadId.get(emailLower);
    const existingByGuid =
      externalGuid !== undefined
        ? existingKeys.guidToLeadId.get(externalGuid)
        : undefined;

    if (
      existingByEmail !== undefined &&
      existingByGuid !== undefined &&
      existingByEmail !== existingByGuid
    ) {
      allRowIssues.push(
        ...issues,
        makeSkipIssue(
          rowIndex,
          LeadImportRowIssueCode.ConflictEmailGuidMismatch,
        ),
      );
      skippedCount += 1;
      continue;
    }

    if (existingByEmail !== undefined) {
      allRowIssues.push(
        ...issues,
        makeSkipIssue(rowIndex, LeadImportRowIssueCode.DuplicateEmail),
      );
      skippedCount += 1;
      continue;
    }

    if (existingByGuid !== undefined) {
      allRowIssues.push(
        ...issues,
        makeSkipIssue(rowIndex, LeadImportRowIssueCode.DuplicateExternalGuid),
      );
      skippedCount += 1;
      continue;
    }

    try {
      await db.transaction((tx) =>
        createLeadCoreInTransaction(
          tx,
          {
            email: validatedValue.email,
            first_name: validatedValue.first_name,
            last_name: validatedValue.last_name,
            company_name: validatedValue.company_name,
            phone: validatedValue.phone,
            website_url: validatedValue.website_url,
            category_id: resolvedCategoryId,
            score: validatedValue.score,
            owner: validatedValue.owner,
            notes: validatedValue.notes,
            improvements: validatedValue.improvements,
            social_profiles: validatedValue.social_profiles,
          },
          {
            source: LeadSource.Import,
            activityType: LeadActivityType.Import,
            activityMetadata: {
              import_batch_id: importBatchId,
              row_index: rowIndex,
            },
            externalGuid,
            statusOverride: validatedValue.status,
          },
        ),
      );

      allRowIssues.push(...issues);
      importedCount += 1;
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        allRowIssues.push(
          ...issues,
          makeSkipIssue(rowIndex, LeadImportRowIssueCode.DuplicateEmail),
        );
        skippedCount += 1;
      } else if (isDuplicateExternalGuidError(error)) {
        allRowIssues.push(
          ...issues,
          makeSkipIssue(rowIndex, LeadImportRowIssueCode.DuplicateExternalGuid),
        );
        skippedCount += 1;
      } else {
        return { ok: false, error: LeadImportErrorCode.Internal };
      }
    }
  }

  const warningCount = allRowIssues.filter(
    (issue) => issue.severity === LeadImportRowIssueSeverity.Warning,
  ).length;

  const report: LeadImportReportDto = {
    totalRows,
    importedCount,
    skippedCount,
    errorCount,
    warningCount,
    ignoredColumns,
    rowIssues: allRowIssues,
    importBatchId,
  };

  return { ok: true, report };
}
