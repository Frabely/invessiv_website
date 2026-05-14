"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  CONTACT_LEAD_STATUS_VALUES,
  ContactLeadStatus,
  type ContactLeadStatus as ContactLeadStatusValue,
} from "@/common/constants/contact/contact-lead-statuses";
import { BulkEditLimits } from "@/common/constants/leads/bulk/bulk-edit-limits";
import {
  BULK_SKIP_REASON_VALUES,
  BulkSkipReason,
} from "@/common/constants/leads/bulk/bulk-skip-reasons";
import { LeadFieldLimits } from "@/common/constants/leads/forms/lead-field-limits";
import type { BulkEditLeadsPatch } from "@/common/contracts/leads/bulk-edit-leads-input";
import type { LeadCategoryOption } from "@/common/contracts/leads/lead-category-option";
import type { BulkEditLeadsFailedLead } from "@/common/contracts/leads/results/bulk-edit-leads-result";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { FormStatus } from "@/components/shared/form/form-status/form-status";
import { trapDialogFocus } from "@/components/workspace/leads/shared/dialog-focus-trap";
import type { ImprovementsListEditorContent } from "@/components/workspace/leads/shared/improvements-list-editor/improvements-list-editor";
import { ImprovementsListEditor } from "@/components/workspace/leads/shared/improvements-list-editor/improvements-list-editor";
import type {
  LeadsBulkDictionary,
  LeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";

import { submitBulkEdit } from "./leads-bulk-edit-service";

import styles from "./leads-bulk-edit-dialog.module.css";

type LeadsBulkEditDialogProps = {
  bulkContent: LeadsBulkDictionary;
  categories: LeadCategoryOption[];
  onCloseAction: () => void;
  onSuccessAction: () => void;
  selectedIds: string[];
  sharedContent: LeadsSharedDictionary;
};

const BulkEditField = {
  Status: "status",
  Category: "category",
  Score: "score",
  Owner: "owner",
  NotesAppend: "notesAppend",
  ImprovementsAppend: "improvementsAppend",
} as const;

type BulkEditField = (typeof BulkEditField)[keyof typeof BulkEditField];

const DialogId = {
  Title: "leads-bulk-edit-dialog-title",
  Description: "leads-bulk-edit-dialog-description",
} as const;

const STATUS_OPTIONS_EXCLUDING_ARCHIVED = CONTACT_LEAD_STATUS_VALUES.filter(
  (status) => status !== ContactLeadStatus.Archived,
);

type ApplyState = Record<BulkEditField, boolean>;

const INITIAL_APPLY_STATE: ApplyState = {
  [BulkEditField.Status]: false,
  [BulkEditField.Category]: false,
  [BulkEditField.Score]: false,
  [BulkEditField.Owner]: false,
  [BulkEditField.NotesAppend]: false,
  [BulkEditField.ImprovementsAppend]: false,
};

function formatTitle(template: string, count: number): string {
  return template.replace("{count}", String(count));
}

function buildImprovementsEditorContent(
  bulkContent: LeadsBulkDictionary,
): ImprovementsListEditorContent {
  return {
    addButton: bulkContent.improvementsEditor.addButton,
    addAriaLabel: bulkContent.improvementsEditor.addAriaLabel,
    fieldLabel: bulkContent.improvementsEditor.fieldLabel,
    fieldPlaceholder: bulkContent.improvementsEditor.fieldPlaceholder,
    confirmAdd: bulkContent.improvementsEditor.confirmAdd,
    confirmEdit: bulkContent.improvementsEditor.confirmEdit,
    cancel: bulkContent.improvementsEditor.cancel,
    edit: bulkContent.improvementsEditor.edit,
    remove: bulkContent.improvementsEditor.remove,
    emptyState: bulkContent.improvementsEditor.emptyAppendState,
    validation: {
      required: bulkContent.editDialog.validation.improvementRequired,
      tooLong: bulkContent.editDialog.validation.improvementTooLong,
      tooMany: bulkContent.editDialog.validation.tooManyImprovements,
    },
  };
}

function getSkipReasonLabel(
  bulkContent: LeadsBulkDictionary,
  reason: BulkEditLeadsFailedLead["reason"],
): string {
  const knownReason = BULK_SKIP_REASON_VALUES.find((value) => value === reason);
  const resolved = knownReason ?? BulkSkipReason.Unknown;
  return bulkContent.skipReasons[resolved];
}

export function LeadsBulkEditDialog({
  bulkContent,
  categories,
  onCloseAction,
  onSuccessAction,
  selectedIds,
  sharedContent,
}: LeadsBulkEditDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  const [applyState, setApplyState] = useState<ApplyState>(INITIAL_APPLY_STATE);
  const [statusValue, setStatusValue] = useState<ContactLeadStatusValue>(
    ContactLeadStatus.New,
  );
  const [categoryValue, setCategoryValue] = useState<string>("");
  const [scoreValue, setScoreValue] = useState<string>("");
  const [ownerValue, setOwnerValue] = useState<string>("");
  const [notesAppendValue, setNotesAppendValue] = useState<string>("");
  const [improvementsAppend, setImprovementsAppend] = useState<string[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [failedLeads, setFailedLeads] = useState<BulkEditLeadsFailedLead[]>([]);
  const [updatedCount, setUpdatedCount] = useState<number | null>(null);
  const [resultBannerShown, setResultBannerShown] = useState(false);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const container = dialogRef.current;
      if (!container) return;
      const focusable = container.querySelector<HTMLElement>(
        "input, select, textarea, button",
      );
      focusable?.focus();
    });
  }, []);

  if (typeof document === "undefined") {
    return null;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (isPending) {
      if (event.key === "Escape") event.preventDefault();
      return;
    }
    trapDialogFocus(event, event.currentTarget, onCloseAction);
  }

  function toggleApply(field: BulkEditField) {
    setApplyState((current) => ({ ...current, [field]: !current[field] }));
  }

  function buildPatch(): BulkEditLeadsPatch | null {
    const patch: BulkEditLeadsPatch = {};
    if (applyState[BulkEditField.Status]) {
      patch.status = statusValue;
    }
    if (applyState[BulkEditField.Category]) {
      patch.categoryId = categoryValue === "" ? null : categoryValue;
    }
    if (applyState[BulkEditField.Score]) {
      if (scoreValue.trim() === "") {
        patch.score = null;
      } else {
        const numeric = Number(scoreValue);
        if (
          !Number.isFinite(numeric) ||
          !Number.isInteger(numeric) ||
          numeric < LeadFieldLimits.ScoreMin ||
          numeric > LeadFieldLimits.ScoreMax
        ) {
          setScoreError(bulkContent.editDialog.validation.scoreOutOfRange);
          return null;
        }
        patch.score = numeric;
      }
    }
    if (applyState[BulkEditField.Owner]) {
      const trimmed = ownerValue.trim();
      patch.owner = trimmed.length === 0 ? null : trimmed;
    }
    if (applyState[BulkEditField.NotesAppend]) {
      const trimmed = notesAppendValue.trim();
      if (trimmed.length > 0) {
        patch.notesAppend = trimmed;
      }
    }
    if (
      applyState[BulkEditField.ImprovementsAppend] &&
      improvementsAppend.length > 0
    ) {
      patch.improvementsAppend = improvementsAppend;
    }
    return patch;
  }

  async function handleSubmit() {
    setErrorMessage(null);
    setScoreError(null);

    const anyApplied = Object.values(applyState).some(Boolean);
    if (!anyApplied) {
      setErrorMessage(bulkContent.editDialog.validation.atLeastOneField);
      return;
    }

    const patch = buildPatch();
    if (!patch) return;

    if (Object.keys(patch).length === 0) {
      setErrorMessage(bulkContent.editDialog.validation.atLeastOneField);
      return;
    }

    setIsPending(true);
    const result = await submitBulkEdit({ ids: selectedIds, patch });
    setIsPending(false);

    if (!result.ok) {
      setErrorMessage(
        result.kind === "network"
          ? bulkContent.errors.network
          : bulkContent.errors.generic,
      );
      return;
    }

    setUpdatedCount(result.updatedCount);
    setFailedLeads(result.failedLeads);
    setResultBannerShown(true);

    if (result.failedLeads.length === 0) {
      router.refresh();
      onSuccessAction();
    }
  }

  function handleCloseAfterPartialSuccess() {
    router.refresh();
    onSuccessAction();
  }

  const totalCount = selectedIds.length;
  const statusLabel = sharedContent.status;
  const improvementsEditorContent = buildImprovementsEditorContent(bulkContent);
  const saveLabel = bulkContent.editDialog.save.replace(
    "{count}",
    String(totalCount),
  );
  const titleLabel = formatTitle(bulkContent.editDialog.title, totalCount);
  const anyApplied = Object.values(applyState).some(Boolean);
  const submitDisabled = isPending || !anyApplied;
  const statusMessage = isPending ? bulkContent.editDialog.status.saving : null;
  const showSuccessBanner =
    resultBannerShown && updatedCount !== null && updatedCount > 0;
  const showFailureOnlyBanner =
    resultBannerShown && updatedCount !== null && updatedCount === 0;

  return createPortal(
    <div className={styles.overlay} role="presentation">
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
            <p className={styles.kicker}>{bulkContent.editDialog.kicker}</p>
            <h2 className={styles.title} id={DialogId.Title}>
              {titleLabel}
            </h2>
            <p className={styles.description} id={DialogId.Description}>
              {bulkContent.editDialog.description}
            </p>
          </div>
          <ButtonControl
            aria-label={bulkContent.editDialog.closeAriaLabel}
            className={styles.closeButton}
            disabled={isPending}
            onClick={onCloseAction}
            title={bulkContent.editDialog.closeAriaLabel}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </ButtonControl>
        </header>

        <FormStatus className={styles.statusBanner} message={statusMessage} />

        {showSuccessBanner ? (
          <p className={styles.successBanner} role="status">
            {bulkContent.editDialog.result.successBanner
              .replace("{updated}", String(updatedCount))
              .replace("{total}", String(totalCount))}
          </p>
        ) : null}
        {showFailureOnlyBanner ? (
          <p className={styles.errorBanner} role="alert">
            {bulkContent.editDialog.result.failureBannerOnly}
          </p>
        ) : null}

        {errorMessage ? (
          <p className={styles.errorBanner} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className={styles.body}>
          <section className={styles.fieldRow}>
            <label className={styles.applyCheckbox}>
              <input
                checked={applyState[BulkEditField.Status]}
                disabled={isPending}
                onChange={() => toggleApply(BulkEditField.Status)}
                type="checkbox"
              />
              <span>{bulkContent.editDialog.applyLabel}</span>
            </label>
            <div className={styles.fieldControl}>
              <span className={styles.fieldLabel}>
                {bulkContent.editDialog.fields.status.label}
              </span>
              <select
                className={styles.input}
                disabled={!applyState[BulkEditField.Status] || isPending}
                onChange={(event) =>
                  setStatusValue(event.target.value as ContactLeadStatusValue)
                }
                value={statusValue}
              >
                {STATUS_OPTIONS_EXCLUDING_ARCHIVED.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel[status]}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className={styles.fieldRow}>
            <label className={styles.applyCheckbox}>
              <input
                checked={applyState[BulkEditField.Category]}
                disabled={isPending}
                onChange={() => toggleApply(BulkEditField.Category)}
                type="checkbox"
              />
              <span>{bulkContent.editDialog.applyLabel}</span>
            </label>
            <div className={styles.fieldControl}>
              <span className={styles.fieldLabel}>
                {bulkContent.editDialog.fields.category.label}
              </span>
              <select
                className={styles.input}
                disabled={!applyState[BulkEditField.Category] || isPending}
                onChange={(event) => setCategoryValue(event.target.value)}
                value={categoryValue}
              >
                <option value="">
                  {bulkContent.editDialog.fields.category.noneOption}
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className={styles.fieldRow}>
            <label className={styles.applyCheckbox}>
              <input
                checked={applyState[BulkEditField.Score]}
                disabled={isPending}
                onChange={() => toggleApply(BulkEditField.Score)}
                type="checkbox"
              />
              <span>{bulkContent.editDialog.applyLabel}</span>
            </label>
            <div className={styles.fieldControl}>
              <span className={styles.fieldLabel}>
                {bulkContent.editDialog.fields.score.label}
              </span>
              <input
                className={styles.input}
                disabled={!applyState[BulkEditField.Score] || isPending}
                inputMode="numeric"
                max={LeadFieldLimits.ScoreMax}
                min={LeadFieldLimits.ScoreMin}
                onChange={(event) => {
                  setScoreValue(event.target.value);
                  setScoreError(null);
                }}
                placeholder={bulkContent.editDialog.fields.score.placeholder}
                type="number"
                value={scoreValue}
              />
              <small className={styles.hint}>
                {bulkContent.editDialog.fields.score.clearHint}
              </small>
              {scoreError ? (
                <small className={styles.error} role="alert">
                  {scoreError}
                </small>
              ) : null}
            </div>
          </section>

          <section className={styles.fieldRow}>
            <label className={styles.applyCheckbox}>
              <input
                checked={applyState[BulkEditField.Owner]}
                disabled={isPending}
                onChange={() => toggleApply(BulkEditField.Owner)}
                type="checkbox"
              />
              <span>{bulkContent.editDialog.applyLabel}</span>
            </label>
            <div className={styles.fieldControl}>
              <span className={styles.fieldLabel}>
                {bulkContent.editDialog.fields.owner.label}
              </span>
              <input
                className={styles.input}
                disabled={!applyState[BulkEditField.Owner] || isPending}
                maxLength={LeadFieldLimits.OwnerMaxLength}
                onChange={(event) => setOwnerValue(event.target.value)}
                placeholder={bulkContent.editDialog.fields.owner.placeholder}
                type="text"
                value={ownerValue}
              />
              <small className={styles.hint}>
                {bulkContent.editDialog.fields.owner.clearHint}
              </small>
            </div>
          </section>

          <section className={styles.fieldRow}>
            <label className={styles.applyCheckbox}>
              <input
                checked={applyState[BulkEditField.NotesAppend]}
                disabled={isPending}
                onChange={() => toggleApply(BulkEditField.NotesAppend)}
                type="checkbox"
              />
              <span>{bulkContent.editDialog.applyLabel}</span>
            </label>
            <div className={styles.fieldControl}>
              <span className={styles.fieldLabel}>
                {bulkContent.editDialog.fields.notesAppend.label}
              </span>
              <textarea
                className={styles.textarea}
                disabled={!applyState[BulkEditField.NotesAppend] || isPending}
                maxLength={LeadFieldLimits.NotesMaxLength}
                onChange={(event) => setNotesAppendValue(event.target.value)}
                placeholder={
                  bulkContent.editDialog.fields.notesAppend.placeholder
                }
                rows={4}
                value={notesAppendValue}
              />
              <small className={styles.hint}>
                {bulkContent.editDialog.fields.notesAppend.hint}
              </small>
            </div>
          </section>

          <section className={styles.fieldRow}>
            <label className={styles.applyCheckbox}>
              <input
                checked={applyState[BulkEditField.ImprovementsAppend]}
                disabled={isPending}
                onChange={() => toggleApply(BulkEditField.ImprovementsAppend)}
                type="checkbox"
              />
              <span>{bulkContent.editDialog.applyLabel}</span>
            </label>
            <div className={styles.fieldControl}>
              <span className={styles.fieldLabel}>
                {bulkContent.editDialog.fields.improvementsAppend.label}
              </span>
              <div
                aria-disabled={
                  !applyState[BulkEditField.ImprovementsAppend] || isPending
                }
                className={
                  !applyState[BulkEditField.ImprovementsAppend]
                    ? styles.disabledArea
                    : undefined
                }
              >
                <ImprovementsListEditor
                  content={improvementsEditorContent}
                  draftInputName="bulk_improvement_draft"
                  maxEntries={BulkEditLimits.MaxImprovementsPerRequest}
                  maxLengthPerEntry={LeadFieldLimits.ImprovementMaxLength}
                  onChange={setImprovementsAppend}
                  value={improvementsAppend}
                />
              </div>
              <small className={styles.hint}>
                {bulkContent.editDialog.fields.improvementsAppend.hint}
              </small>
            </div>
          </section>

          {failedLeads.length > 0 ? (
            <section className={styles.skipSection}>
              <h3 className={styles.skipHeader}>
                {bulkContent.editDialog.result.skippedHeader}
              </h3>
              <ul className={styles.skipList}>
                {failedLeads.map((failed) => (
                  <li className={styles.skipItem} key={failed.id}>
                    <strong>{failed.displayName}</strong>
                    <span>
                      {getSkipReasonLabel(bulkContent, failed.reason)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <footer className={styles.footer}>
          {resultBannerShown ? (
            <PrimaryCtaButton
              onClick={handleCloseAfterPartialSuccess}
              type="button"
            >
              {bulkContent.editDialog.result.close}
            </PrimaryCtaButton>
          ) : (
            <>
              <ButtonControl
                disabled={isPending}
                onClick={onCloseAction}
                type="button"
                variant="ghost"
              >
                {bulkContent.editDialog.cancel}
              </ButtonControl>
              <PrimaryCtaButton
                disabled={submitDisabled}
                onClick={handleSubmit}
                type="button"
              >
                {saveLabel}
              </PrimaryCtaButton>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
