"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpFromBracket,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  LEAD_IMPORT_COLUMN_KEY_VALUES,
  LeadImportColumnKey,
} from "@/common/constants/leads/import/columns/lead-import-column-keys";
import { LeadImportRowIssueSeverity } from "@/common/constants/leads/import/issues/lead-import-row-issue-severities";
import type {
  LeadImportCsvPreview,
  LeadImportDialogPhase,
} from "@/common/contracts/leads/import/lead-import-dialog-phase";
import { LeadImportDialogPhaseTag } from "@/common/contracts/leads/import/lead-import-dialog-phase";
import type { LeadsImportDictionary } from "@/i18n/dictionaries/workspace/leads";
import {
  getLeadImportErrorMessage,
  getLeadImportRowIssueMessage,
} from "@/client/leads/import/import-leads-error-message";
import { importLeadsService } from "@/client/leads/import/import-leads-service";
import { ButtonControl } from "@/components/shared/button/button";
import {
  focusFirstDialogElement,
  trapDialogFocus,
} from "../../shared/dialog-focus-trap";
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
  const fileInputId = useId();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<LeadImportDialogPhase>({
    tag: LeadImportDialogPhaseTag.Picking,
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [isDropActive, setIsDropActive] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  function resetState() {
    setPhase({ tag: LeadImportDialogPhaseTag.Picking });
    setFile(null);
    setFileSizeError(null);
    setIsDropActive(false);
    dragCounterRef.current = 0;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const closeDialog = useCallback(() => {
    resetState();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => {
      focusFirstDialogElement(dialogRef.current);
    });
  }, [open]);

  function handleTriggerClick() {
    setOpen(true);
  }

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }

  async function handleSelectedFile(selected: File | null | undefined) {
    if (!selected) {
      return;
    }

    if (selected.size > MAX_FILE_BYTES) {
      setFileSizeError(content.errors.client_too_large);
      setFile(null);
      setIsDropActive(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setFileSizeError(null);
    setFile(selected);
    setIsDropActive(false);

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

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    trapDialogFocus(event, dialogRef.current, closeDialog);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    await handleSelectedFile(event.target.files?.[0]);
  }

  function handleDropZoneDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounterRef.current += 1;
    setIsDropActive(true);
  }

  function handleDropZoneDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDropActive(true);
  }

  function handleDropZoneDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) {
      setIsDropActive(false);
    }
  }

  async function handleDropZoneDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounterRef.current = 0;
    setIsDropActive(false);
    await handleSelectedFile(event.dataTransfer.files?.[0]);
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
        className={styles.triggerButton}
        onClick={handleTriggerClick}
        variant="ghost"
      >
        <span aria-hidden="true" className={styles.triggerIcon}>
          <FontAwesomeIcon icon={faArrowUpFromBracket} />
        </span>
        {content.trigger.label}
      </ButtonControl>

      {open && (
        <div
          className={styles.overlay}
          onClick={handleOverlayClick}
          role="presentation"
        >
          <div
            aria-describedby={content.dialog.aria.descriptionId}
            aria-labelledby={content.dialog.aria.titleId}
            aria-modal="true"
            className={styles.dialog}
            onKeyDown={handleKeyDown}
            ref={dialogRef}
            role="dialog"
          >
            <header className={styles.header}>
              <div className={styles.heading}>
                <h2 className={styles.title} id={content.dialog.aria.titleId}>
                  {content.dialog.title}
                </h2>
                <p
                  className={styles.description}
                  id={content.dialog.aria.descriptionId}
                >
                  {content.dialog.description}
                </p>
              </div>
              <button
                aria-label={content.dialog.close}
                className={styles.closeButton}
                onClick={closeDialog}
                type="button"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
              </button>
            </header>

            <div className={styles.body}>
              <input
                accept=".csv,text/csv,application/vnd.ms-excel"
                className={styles.fileInput}
                id={fileInputId}
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
              />

              {phase.tag === LeadImportDialogPhaseTag.Picking && (
                <div className={styles.pickingPhase}>
                  <div
                    className={`${styles.dropzone} ${isDropActive ? styles.dropzoneActive : ""}`}
                    aria-describedby={`${content.dialog.aria.dropzoneLabelId} ${content.dialog.aria.dropzoneHintId}`}
                    aria-labelledby={content.dialog.aria.dropzoneLabelId}
                    role="group"
                    onDragEnter={handleDropZoneDragEnter}
                    onDragLeave={handleDropZoneDragLeave}
                    onDragOver={handleDropZoneDragOver}
                    onDrop={handleDropZoneDrop}
                  >
                    <label
                      className={styles.dropzoneLabelWrapper}
                      id={content.dialog.aria.dropzoneLabelId}
                      htmlFor={fileInputId}
                    >
                      <span aria-hidden="true" className={styles.dropzoneIcon}>
                        <FontAwesomeIcon icon={faArrowUpFromBracket} />
                      </span>
                      <span className={styles.dropzoneLabel}>
                        {content.dialog.dropzoneLabel}
                      </span>
                      <span
                        className={styles.dropzoneHint}
                        id={content.dialog.aria.dropzoneHintId}
                      >
                        {content.dialog.dropzoneHint}
                      </span>
                    </label>
                  </div>

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
                  <h3 className={styles.resultTitle}>
                    {content.summary.title}
                  </h3>

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
                              {getLeadImportRowIssueMessage(
                                issue.code,
                                content,
                              )}
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
          </div>
        </div>
      )}
    </>
  );
}
