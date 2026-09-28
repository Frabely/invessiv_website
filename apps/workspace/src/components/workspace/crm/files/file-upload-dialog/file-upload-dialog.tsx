"use client";

import { useEffect, useRef, useState } from "react";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { UPLOAD_ACCEPT_ATTRIBUTE } from "@invessiv/common/constants/files/upload-accept";
import { UploadQueueItemStatus } from "@invessiv/common/constants/files/upload-queue-item-status";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  ButtonControl,
  Dialog,
  FileDropZone,
  FormField,
  PrimaryCtaButton,
} from "@invessiv/ui";
import { filesApiService } from "@/client/crm/files-api-service";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import type { Locale } from "@/config/i18n";
import { useUploadQueue } from "@/hooks/shared/use-upload-queue";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FileTargetSelect } from "../file-target-select/file-target-select";
import { FileVisibilityField } from "../file-visibility-field/file-visibility-field";
import { UploadQueueRow } from "../upload-queue-row/upload-queue-row";
import styles from "./file-upload-dialog.module.css";

type FileUploadDialogProps = {
  content: CrmFilesDictionary;
  customerId: string;
  /** Files dropped onto the section before the dialog opened. */
  initialFiles?: readonly File[];
  locale: Locale;
  projects: readonly FilesProjectOption[];
  /** Writable targets, null for customer-wide; never empty when the dialog is offered. */
  targets: readonly (string | null)[];
  defaultTarget: string | null;
  onCloseAction: () => void;
  onUploadedAction: (file: FileDto) => void;
};

/**
 * One upload batch: pick files, set project, visibility and note once for all of them, then
 * watch every file finish. The dialog cannot be closed while a transfer is running.
 */
export function FileUploadDialog({
  content,
  customerId,
  initialFiles,
  locale,
  projects,
  targets,
  defaultTarget,
  onCloseAction,
  onUploadedAction,
}: FileUploadDialogProps) {
  const [target, setTarget] = useState<string | null>(defaultTarget);
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState("");
  const queue = useUploadQueue(
    {
      createTicket: (file) =>
        filesApiService.createUpload(customerId, {
          displayName: file.name,
          sizeBytes: file.size,
          projectId: target,
          visibleToCustomer: visible,
          note: note.trim() || null,
        }),
      complete: filesApiService.completeUpload,
    },
    { onUploadedAction },
  );
  const stagedInitialRef = useRef(false);
  const { stage } = queue;

  useEffect(() => {
    if (stagedInitialRef.current || !initialFiles?.length) return;
    stagedInitialRef.current = true;
    stage(initialFiles);
  }, [initialFiles, stage]);

  const settingsLocked = queue.hasStarted;
  const total = queue.items.filter(
    (item) =>
      item.status !== UploadQueueItemStatus.Rejected &&
      item.status !== UploadQueueItemStatus.Cancelled,
  ).length;

  return (
    <Dialog
      busy={queue.isActive}
      closeLabel={content.upload.close}
      description={content.upload.description}
      footer={
        <div className={styles.footer}>
          {queue.isActive ? (
            <p className={styles.footerHint}>{content.upload.busyHint}</p>
          ) : null}
          <div className={styles.footerActions}>
            {settingsLocked && !queue.isActive ? (
              <>
                <ButtonControl
                  onClick={queue.reset}
                  type="button"
                  variant="ghost"
                >
                  {content.upload.more}
                </ButtonControl>
                <PrimaryCtaButton onClick={onCloseAction} type="button">
                  {content.upload.close}
                </PrimaryCtaButton>
              </>
            ) : null}
            {!settingsLocked ? (
              <>
                <ButtonControl
                  onClick={onCloseAction}
                  type="button"
                  variant="ghost"
                >
                  {content.upload.cancel}
                </ButtonControl>
                <PrimaryCtaButton
                  disabled={queue.stagedCount === 0}
                  onClick={queue.start}
                  type="button"
                >
                  {queue.stagedCount === 1
                    ? content.upload.startOne
                    : formatMessage(content.upload.start, {
                        count: String(queue.stagedCount),
                      })}
                </PrimaryCtaButton>
              </>
            ) : null}
          </div>
        </div>
      }
      onCloseAction={onCloseAction}
      size={DialogSize.Narrow}
      title={content.upload.title}
    >
      <div className={styles.body}>
        {!settingsLocked ? (
          <>
            <FileDropZone
              accept={UPLOAD_ACCEPT_ATTRIBUTE}
              hint={content.upload.dropHint}
              label={content.upload.dropLabel}
              multiple
              onFilesSelected={stage}
            />
            <p className={styles.largerHint}>{content.upload.largerHint}</p>
          </>
        ) : null}
        {queue.items.length > 0 ? (
          <ul aria-label={content.upload.queueLabel} className={styles.queue}>
            {queue.items.map((item) => (
              <UploadQueueRow
                content={content}
                item={item}
                key={item.id}
                locale={locale}
                onCancelAction={queue.cancel}
                onRemoveAction={queue.remove}
                onRetryAction={queue.retry}
              />
            ))}
          </ul>
        ) : null}
        <p aria-live="polite" className={styles.summary} role="status">
          {settingsLocked
            ? formatMessage(content.upload.summary, {
                done: String(queue.doneCount),
                total: String(total),
              })
            : null}
        </p>
        <fieldset className={styles.settings} disabled={settingsLocked}>
          <FileTargetSelect
            content={content}
            onChangeAction={setTarget}
            projects={projects}
            targets={targets}
            value={target}
          />
          <FileVisibilityField
            checked={visible}
            content={content}
            onChangeAction={setVisible}
          />
          <FormField
            inputProps={{
              maxLength: 200,
              onChange: (event) => setNote(event.target.value),
              placeholder: content.upload.notePlaceholder,
              value: note,
            }}
            kind={FormFieldKind.Text}
            label={content.upload.note}
          />
        </fieldset>
      </div>
    </Dialog>
  );
}
