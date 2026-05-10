"use client";

import {
  type ChangeEvent,
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
} from "@/common/constants/leads/lead-import-column-keys";
import type { LeadImportReportDto } from "@/common/contracts/leads/import/lead-import-report.dto";
import type { LeadsImportDictionary } from "@/i18n/dictionaries/workspace/leads";
import {
  getLeadImportErrorMessage,
  getLeadImportRowIssueMessage,
} from "./import-leads-error-message";
import { submitLeadImport } from "./import-leads-service";
import styles from "./import-leads-dialog.module.css";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

type CsvPreview = {
  recognized: string[];
  ignored: string[];
  hasRequiredColumns: boolean;
};

type DialogPhase =
  | { tag: "picking" }
  | { tag: "previewing"; preview: CsvPreview }
  | { tag: "submitting" }
  | { tag: "result"; report: LeadImportReportDto }
  | { tag: "error"; message: string };

type Props = {
  content: LeadsImportDictionary;
};

function detectSeparator(line: string): ";" | "," {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  return semicolons >= commas ? ";" : ",";
}

async function buildCsvPreview(file: File): Promise<CsvPreview> {
  const slice = file.slice(0, 2048);
  const text = await slice.text();
  const stripped = text.startsWith("﻿") ? text.slice(1) : text;
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
  const hasRequiredColumns =
    recognized.includes(LeadImportColumnKey.Email) &&
    (recognized.includes(LeadImportColumnKey.LastName) ||
      recognized.includes(LeadImportColumnKey.CompanyName));

  return { recognized, ignored, hasRequiredColumns };
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        "[tabindex]:not([tabindex='-1'])",
      ].join(","),
    ),
  ).filter((el) => !el.hidden && el.tabIndex >= 0);
}

function getSeverityClass(severity: string): string {
  if (severity === "error") return styles.severityError;
  if (severity === "warning") return styles.severityWarning;
  if (severity === "skip") return styles.severitySkip;
  return "";
}

type ColumnPillGroupProps = {
  columns: string[];
  label: string;
  pillClass: string;
};

function ColumnPillGroup({ columns, label, pillClass }: ColumnPillGroupProps) {
  if (columns.length === 0) return null;
  return (
    <div className={styles.columnGroup}>
      <p className={styles.columnGroupLabel}>{label}</p>
      <div className={styles.columnPills}>
        {columns.map((col) => (
          <span className={pillClass} key={col}>
            {col}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ImportLeadsDialog({ content }: Props) {
  const router = useRouter();
  const fileInputId = useId();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<DialogPhase>({ tag: "picking" });
  const [file, setFile] = useState<File | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetState() {
    setPhase({ tag: "picking" });
    setFile(null);
    setFileSizeError(null);
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
      const focusable = dialogRef.current
        ? getFocusable(dialogRef.current)
        : [];
      focusable[0]?.focus();
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

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }

    const focusable = getFocusable(dialogRef.current);
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    if (selected.size > MAX_FILE_BYTES) {
      setFileSizeError(content.errors.client_too_large);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setFileSizeError(null);
    setFile(selected);

    try {
      const preview = await buildCsvPreview(selected);
      setPhase({ tag: "previewing", preview });
    } catch {
      setPhase({ tag: "error", message: content.errors.generic });
    }
  }

  async function handleSubmit() {
    if (!file) {
      return;
    }

    setPhase({ tag: "submitting" });

    const result = await submitLeadImport(file);

    if (result.ok) {
      if (result.report.importedCount > 0) {
        router.refresh();
      }
      setPhase({ tag: "result", report: result.report });
      return;
    }

    setPhase({
      tag: "error",
      message: getLeadImportErrorMessage(result.error, content),
    });
  }

  function handleRetry() {
    resetState();
  }

  const DialogId = {
    Title: "import-leads-dialog-title",
    Description: "import-leads-dialog-description",
  } as const;

  return (
    <>
      <button
        className={styles.triggerButton}
        onClick={handleTriggerClick}
        type="button"
      >
        <span aria-hidden="true" className={styles.triggerIcon}>
          <FontAwesomeIcon icon={faArrowUpFromBracket} />
        </span>
        {content.trigger.label}
      </button>

      {open && (
        <div
          className={styles.overlay}
          onClick={handleOverlayClick}
          role="presentation"
        >
          <div
            aria-describedby={DialogId.Description}
            aria-labelledby={DialogId.Title}
            aria-modal="true"
            className={styles.dialog}
            onKeyDown={handleKeyDown}
            ref={dialogRef}
            role="dialog"
          >
            <header className={styles.header}>
              <div className={styles.heading}>
                <h2 className={styles.title} id={DialogId.Title}>
                  {content.dialog.title}
                </h2>
                <p className={styles.description} id={DialogId.Description}>
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

              {phase.tag === "picking" && (
                <div className={styles.pickingPhase}>
                  <label className={styles.dropzone} htmlFor={fileInputId}>
                    <span aria-hidden="true" className={styles.dropzoneIcon}>
                      <FontAwesomeIcon icon={faArrowUpFromBracket} />
                    </span>
                    <span className={styles.dropzoneLabel}>
                      {content.dialog.dropzoneLabel}
                    </span>
                    <span className={styles.dropzoneHint}>
                      {content.dialog.dropzoneHint}
                    </span>
                  </label>

                  {fileSizeError && (
                    <p className={styles.inlineError} role="alert">
                      {fileSizeError}
                    </p>
                  )}
                </div>
              )}

              {phase.tag === "previewing" && (
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
                    label={content.preview.recognizedColumns}
                    pillClass={styles.columnPillRecognized}
                  />
                  <ColumnPillGroup
                    columns={phase.preview.ignored}
                    label={content.preview.ignoredColumns}
                    pillClass={styles.columnPillIgnored}
                  />

                  <footer className={styles.previewFooter}>
                    <button
                      className={styles.cancelButton}
                      onClick={closeDialog}
                      type="button"
                    >
                      {content.dialog.cancel}
                    </button>
                    <button
                      className={styles.submitButton}
                      disabled={!phase.preview.hasRequiredColumns}
                      onClick={handleSubmit}
                      type="button"
                    >
                      {content.dialog.submit}
                    </button>
                  </footer>
                </div>
              )}

              {phase.tag === "submitting" && (
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

              {phase.tag === "result" && (
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
                    label={content.summary.ignoredColumns}
                    pillClass={styles.columnPillIgnored}
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

                  <footer className={styles.resultFooter}>
                    <button
                      className={styles.submitButton}
                      onClick={closeDialog}
                      type="button"
                    >
                      {content.dialog.close}
                    </button>
                  </footer>
                </div>
              )}

              {phase.tag === "error" && (
                <div className={styles.errorPhase}>
                  <p className={styles.errorMessage} role="alert">
                    {phase.message}
                  </p>
                  <footer className={styles.errorFooter}>
                    <button
                      className={styles.cancelButton}
                      onClick={closeDialog}
                      type="button"
                    >
                      {content.dialog.close}
                    </button>
                    <button
                      className={styles.submitButton}
                      onClick={handleRetry}
                      type="button"
                    >
                      {content.dialog.chooseFile}
                    </button>
                  </footer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
