"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";
import {
  LEAD_IMPORT_COLUMN_KEY_VALUES,
  LeadImportColumnKey,
} from "@invessiv/common/constants/leads/import/columns/lead-import-column-keys";
import { LeadImportRowIssueSeverity } from "@invessiv/common/constants/leads/import/issues/lead-import-row-issue-severities";
import type {
  LeadImportCsvPreview,
  LeadImportDialogPhase,
} from "@invessiv/common/contracts/leads/import/lead-import-dialog-phase";
import { LeadImportDialogPhaseTag } from "@invessiv/common/contracts/leads/import/lead-import-dialog-phase";
import type { LeadsImportDictionary } from "@/i18n/dictionaries/workspace/leads";
import {
  getLeadImportErrorMessage,
  getLeadImportRowIssueMessage,
} from "@/client/leads/import/import-leads-error-message";
import { importLeadsService } from "@/client/leads/import/import-leads-service";
import { ButtonControl, Dialog, FileDropZone } from "@invessiv/ui";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import { ColumnPillGroup } from "../column-pill-group/column-pill-group";
import { DialogFooter } from "../dialog-footer/dialog-footer";
import styles from "./import-leads-dialog.module.css";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

type Props = {
  content: LeadsImportDictionary;
};

function detectSeparator(line: string): ";" | "," {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  return semicolons >= commas ? ";" : ",";
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

async function buildCsvPreview(file: File): Promise<LeadImportCsvPreview> {
  const slice = file.slice(0, 2048);
  const text = await slice.text();
  const stripped = stripBom(text);
  const firstLine =
    stripped.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";

  const sep = detectSeparator(firstLine);
  const headers = firstLine
    .split(sep)
    .map((h) =>
      h
        .trim()
        .replace(/^["']|["']$/g, "")
        .trim(),
    )
    .filter(Boolean);

  const validColumns = new Set<string>(LEAD_IMPORT_COLUMN_KEY_VALUES);
  const recognized = headers.filter((h) => validColumns.has(h));
  const ignored = headers.filter((h) => !validColumns.has(h));
  const hasRequiredColumns = recognized.includes(
    LeadImportColumnKey.DisplayName,
  );

  return { recognized, ignored, hasRequiredColumns };
}

function getSeverityClass(severity: LeadImportRowIssueSeverity): string {
  if (severity === LeadImportRowIssueSeverity.Error)
    return styles.severityError;
  if (severity === LeadImportRowIssueSeverity.Warning)
    return styles.severityWarning;
  if (severity === LeadImportRowIssueSeverity.Skip) return styles.severitySkip;
  return "";
}

export function ImportLeadsDialog({ content }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<LeadImportDialogPhase>({
    tag: LeadImportDialogPhaseTag.Picking,
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);

  function resetState() {
    setPhase({ tag: LeadImportDialogPhaseTag.Picking });
    setFile(null);
    setFileSizeError(null);
  }

  const closeDialog = useCallback(() => {
    resetState();
    setOpen(false);
  }, []);

  function handleTriggerClick() {
    setOpen(true);
  }

  async function handleSelectedFile(selected: File | null | undefined) {
    if (!selected) {
      return;
    }

    if (selected.size > MAX_FILE_BYTES) {
      setFileSizeError(content.errors.client_too_large);
      setFile(null);
      return;
    }

    setFileSizeError(null);
    setFile(selected);

    try {
      const preview = await buildCsvPreview(selected);
      setPhase({ tag: LeadImportDialogPhaseTag.Previewing, preview });
    } catch {
      setPhase({
        tag: LeadImportDialogPhaseTag.Error,
        message: content.errors.generic,
      });
    }
  }

  async function handleSubmit() {
    if (!file) {
      return;
    }

    setPhase({ tag: LeadImportDialogPhaseTag.Submitting });

    const result = await importLeadsService.submitImport(file);

    if (result.ok) {
      if (result.report.importedCount > 0) {
        router.refresh();
      }
      setPhase({ tag: LeadImportDialogPhaseTag.Result, report: result.report });
      return;
    }

    setPhase({
      tag: LeadImportDialogPhaseTag.Error,
      message: getLeadImportErrorMessage(result.error, content),
    });
  }

  function handleRetry() {
    resetState();
  }

  return (
    <>
      <ButtonControl
        aria-label={content.trigger.label}
        className={styles.triggerButton}
        onClick={handleTriggerClick}
        variant="ghost"
      >
        <span aria-hidden="true" className={styles.triggerIcon}>
          <FontAwesomeIcon icon={faArrowUpFromBracket} />
        </span>
        <span className={styles.triggerLabel}>{content.trigger.label}</span>
      </ButtonControl>

      {open && (
        <Dialog
          closeLabel={content.dialog.close}
          description={content.dialog.description}
          footer={null}
          onCloseAction={closeDialog}
          open={open}
          size={DialogSize.Wide}
          title={content.dialog.title}
        >
          <div className={styles.body}>
            {phase.tag === LeadImportDialogPhaseTag.Picking && (
              <div className={styles.pickingPhase}>
                <FileDropZone
                  accept=".csv,text/csv,application/vnd.ms-excel"
                  hint={content.dialog.dropzoneHint}
                  label={content.dialog.dropzoneLabel}
                  onFilesSelected={(files) => handleSelectedFile(files[0])}
                />

                {fileSizeError && (
                  <p className={styles.inlineError} role="alert">
                    {fileSizeError}
                  </p>
                )}
              </div>
            )}

            {phase.tag === LeadImportDialogPhaseTag.Previewing && (
              <div className={styles.previewingPhase}>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{file?.name}</span>
                  <button
                    className={styles.changeFileButton}
                    onClick={handleRetry}
                    type="button"
                  >
                    {content.dialog.changeFile}
                  </button>
                </div>

                {!phase.preview.hasRequiredColumns && (
                  <div className={styles.warningBanner} role="alert">
                    <strong>{content.preview.missingRequiredTitle}:</strong>{" "}
                    {content.preview.missingRequiredHint}
                  </div>
                )}

                <ColumnPillGroup
                  columns={phase.preview.recognized}
                  classNames={{
                    group: styles.columnGroup,
                    label: styles.columnGroupLabel,
                    pills: styles.columnPills,
                    pill: styles.columnPillRecognized,
                  }}
                  label={content.preview.recognizedColumns}
                />
                <ColumnPillGroup
                  columns={phase.preview.ignored}
                  classNames={{
                    group: styles.columnGroup,
                    label: styles.columnGroupLabel,
                    pills: styles.columnPills,
                    pill: styles.columnPillIgnored,
                  }}
                  label={content.preview.ignoredColumns}
                />

                <DialogFooter
                  className={styles.previewFooter}
                  actions={[
                    {
                      label: content.dialog.cancel,
                      onClick: closeDialog,
                      className: styles.cancelButton,
                    },
                    {
                      label: content.dialog.submit,
                      onClick: handleSubmit,
                      className: styles.submitButton,
                      disabled: !phase.preview.hasRequiredColumns,
                    },
                  ]}
                />
              </div>
            )}

            {phase.tag === LeadImportDialogPhaseTag.Submitting && (
              <div className={styles.submittingPhase}>
                <div
                  aria-live="polite"
                  className={styles.spinner}
                  role="status"
                >
                  <span aria-hidden="true" className={styles.spinnerIcon} />
                  <span className={styles.spinnerLabel}>
                    {content.dialog.submitting}
                  </span>
                </div>
              </div>
            )}

            {phase.tag === LeadImportDialogPhaseTag.Result && (
              <div className={styles.resultPhase}>
                <h3 className={styles.resultTitle}>{content.summary.title}</h3>

                <div className={styles.counters}>
                  <div className={styles.counter}>
                    <span className={styles.counterValue}>
                      {phase.report.importedCount}
                    </span>
                    <span className={styles.counterLabel}>
                      {content.summary.imported}
                    </span>
                  </div>
                  <div className={styles.counter}>
                    <span className={styles.counterValue}>
                      {phase.report.skippedCount}
                    </span>
                    <span className={styles.counterLabel}>
                      {content.summary.skipped}
                    </span>
                  </div>
                  <div className={styles.counter}>
                    <span className={styles.counterValue}>
                      {phase.report.errorCount}
                    </span>
                    <span className={styles.counterLabel}>
                      {content.summary.errors}
                    </span>
                  </div>
                  <div className={styles.counter}>
                    <span className={styles.counterValue}>
                      {phase.report.warningCount}
                    </span>
                    <span className={styles.counterLabel}>
                      {content.summary.warnings}
                    </span>
                  </div>
                </div>

                <ColumnPillGroup
                  columns={phase.report.ignoredColumns}
                  classNames={{
                    group: styles.columnGroup,
                    label: styles.columnGroupLabel,
                    pills: styles.columnPills,
                    pill: styles.columnPillIgnored,
                  }}
                  label={content.summary.ignoredColumns}
                />

                {phase.report.rowIssues.length > 0 && (
                  <details className={styles.rowIssuesDetails}>
                    <summary className={styles.rowIssuesSummary}>
                      {content.summary.rowIssues} (
                      {phase.report.rowIssues.length})
                    </summary>
                    <ul className={styles.rowIssuesList}>
                      {phase.report.rowIssues.map((issue, idx) => (
                        <li
                          className={`${styles.rowIssueItem} ${getSeverityClass(issue.severity)}`}
                          key={idx}
                        >
                          <span className={styles.rowIssueRow}>
                            {content.summary.rowPrefix} {issue.rowIndex}
                          </span>
                          {issue.column && (
                            <span className={styles.rowIssueColumn}>
                              {content.summary.columnPrefix}: {issue.column}
                            </span>
                          )}
                          <span className={styles.rowIssueMessage}>
                            {getLeadImportRowIssueMessage(issue.code, content)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                <DialogFooter
                  className={styles.resultFooter}
                  actions={[
                    {
                      label: content.dialog.close,
                      onClick: closeDialog,
                      className: styles.submitButton,
                    },
                  ]}
                />
              </div>
            )}

            {phase.tag === LeadImportDialogPhaseTag.Error && (
              <div className={styles.errorPhase}>
                <p className={styles.errorMessage} role="alert">
                  {phase.message}
                </p>
                <DialogFooter
                  className={styles.errorFooter}
                  actions={[
                    {
                      label: content.dialog.close,
                      onClick: closeDialog,
                      className: styles.cancelButton,
                    },
                    {
                      label: content.dialog.chooseFile,
                      onClick: handleRetry,
                      className: styles.submitButton,
                    },
                  ]}
                />
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
