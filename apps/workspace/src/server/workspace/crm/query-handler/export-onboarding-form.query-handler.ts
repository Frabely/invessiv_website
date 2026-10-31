import "server-only";

import { and, inArray } from "drizzle-orm";

import {
  ONBOARDING_EXPORT_FILES_FOLDER,
  ONBOARDING_EXPORT_MANIFEST_NAME,
  ONBOARDING_EXPORT_README_NAME,
} from "@invessiv/common/constants/crm/onboarding/onboarding-export-format";
import { OnboardingExportFileStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-export-file-statuses";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { OnboardingExportFileDto } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-file.dto";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { files } from "@invessiv/db/record-configuration";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import { FileArchiveEntryStatus } from "@/common/constants/files/file-archive-entry-status";
import {
  MAX_ARCHIVE_BYTES,
  MAX_ARCHIVE_FILES,
} from "@/common/constants/files/file-archive-limits";
import { businessToday } from "@/common/patterns/time/business-today";
import { fileArchiveService } from "@/server/shared/files/file-archive-service";
import type {
  ArchiveEntry,
  ArchiveRow,
} from "@/server/shared/files/file-object-service-types";
import { onboardingFormReadService } from "@/server/shared/services/onboarding/onboarding-form-read-service";
import { fileAccessService } from "@/server/workspace/crm/services/files/file-access-service";
import { onboardingExportMappingService } from "@/server/workspace/crm/services/onboarding/onboarding-export-mapping-service";
import { ONBOARDING_EXPORT_README } from "@/server/workspace/crm/services/onboarding/onboarding-export-readme";
import type { OnboardingExportArchive } from "@/server/workspace/crm/services/onboarding/onboarding-export-types";
import type { OnboardingExportFileLocation } from "@invessiv/common/contracts/crm/onboarding/export/onboarding-export-file-location";
import { onboardingFormAccessService } from "@/server/workspace/crm/services/onboarding/onboarding-form-access-service";
import { onboardingFormSchemas } from "@/server/workspace/crm/services/onboarding/onboarding-form-schemas";

const { toExportFile } = onboardingExportMappingService;

const STREAMED_STATUS: Record<
  FileArchiveEntryStatus,
  OnboardingExportFileStatus
> = {
  [FileArchiveEntryStatus.Included]: OnboardingExportFileStatus.Included,
  [FileArchiveEntryStatus.Link]: OnboardingExportFileStatus.Link,
  [FileArchiveEntryStatus.Timeout]: OnboardingExportFileStatus.Timeout,
  [FileArchiveEntryStatus.Unreadable]: OnboardingExportFileStatus.Unreadable,
};

/** Why a file stays out of the archive before streaming starts; null when it goes in. */
function skipReason(
  row: ArchiveRow | undefined,
  streamedCount: number,
  streamedBytes: number,
): OnboardingExportFileStatus | null {
  if (!row) return OnboardingExportFileStatus.Unreadable;
  if (!row.storageKey) return OnboardingExportFileStatus.Link;
  if (row.assetKind === AssetKind.Video)
    return OnboardingExportFileStatus.Video;
  if (
    streamedCount >= MAX_ARCHIVE_FILES ||
    streamedBytes + (row.sizeBytes ?? 0) > MAX_ARCHIVE_BYTES
  )
    return OnboardingExportFileStatus.SizeLimit;
  return null;
}

/**
 * Decides per file whether it goes into the archive; a file used by several questions is planned,
 * counted and packed once. Nothing here fails the export: what does not fit is named in the
 * manifest instead.
 */
function planFiles(
  links: readonly QuestionnaireAnswerFileDto[],
  stored: ReadonlyMap<string, ArchiveRow>,
  locations: ReadonlyMap<string, OnboardingExportFileLocation>,
) {
  const usedIn = (file: FileAttachmentDto) =>
    locations.get(file.id)?.usedIn ?? [];
  const decided = new Map<string, OnboardingExportFileDto>();
  const streamed: FileAttachmentDto[] = [];
  const entries: ArchiveEntry[] = [];
  let bytes = 0;
  for (const file of new Map(
    links.map((link) => [link.file.id, link.file]),
  ).values()) {
    const row = stored.get(file.id);
    const skipped = skipReason(row, entries.length, bytes);
    if (skipped || !row) {
      decided.set(
        file.id,
        toExportFile(
          file,
          skipped ?? OnboardingExportFileStatus.Unreadable,
          usedIn(file),
        ),
      );
      continue;
    }
    bytes += row.sizeBytes ?? 0;
    streamed.push(file);
    entries.push({
      displayName: row.displayName,
      storageKey: row.storageKey,
      url: null,
      folder: locations.get(file.id)?.folder ?? ONBOARDING_EXPORT_FILES_FOLDER,
    });
  }
  return { decided, streamed, entries, usedIn };
}

/**
 * The export archive of a form in any status, or null when it is out of reach. Files follow
 * `files.read` exactly like the answers tab; a file the member may not open is only counted.
 */
export async function exportOnboardingForm(
  formId: string,
  actor: WorkspaceActor,
  locale: Locale,
): Promise<OnboardingExportArchive | null> {
  if (!onboardingFormSchemas.entityId.safeParse(formId).success) return null;
  const exportedAt = new Date();
  const db = getDrizzleDatabaseClient();
  const row = await onboardingFormAccessService.findReadableForm(
    db,
    formId,
    actor,
  );
  if (!row) return null;
  const [form, context] = await Promise.all([
    onboardingFormReadService.toFormDto(
      db,
      row,
      fileAccessService.readableCondition(actor),
    ),
    onboardingFormAccessService.findReadableContext(db, formId, actor),
  ]);
  if (!context) return null;

  const fileIds = [...new Set(form.answerFiles.map((link) => link.file.id))];
  const rows = fileIds.length
    ? await db
        .select(fileArchiveService.columns)
        .from(files)
        .where(
          and(
            inArray(files.id, fileIds),
            fileAccessService.readableCondition(actor),
          ),
        )
    : [];
  const { decided, streamed, entries, usedIn } = planFiles(
    form.answerFiles,
    new Map(rows.map((file) => [file.id, file])),
    onboardingExportMappingService.toFileLocations(form),
  );

  return {
    filename: `onboarding-${context.projectTitle}-${businessToday(exportedAt)}.zip`,
    entries,
    texts: [
      {
        name: ONBOARDING_EXPORT_README_NAME,
        content: ONBOARDING_EXPORT_README,
      },
    ],
    manifest: {
      name: ONBOARDING_EXPORT_MANIFEST_NAME,
      // Outcomes come in the order of `entries`, which is the order of `streamed`.
      build: (outcomes) => {
        const exported = new Map(decided);
        streamed.forEach((file, position) => {
          const outcome = outcomes[position];
          exported.set(
            file.id,
            toExportFile(
              file,
              outcome
                ? STREAMED_STATUS[outcome.status]
                : OnboardingExportFileStatus.Timeout,
              usedIn(file),
              outcome?.path,
            ),
          );
        });
        return JSON.stringify(
          onboardingExportMappingService.map({
            form,
            context,
            locale,
            exportedAt: exportedAt.toISOString(),
            files: exported,
          }),
          null,
          2,
        );
      },
    },
  };
}
