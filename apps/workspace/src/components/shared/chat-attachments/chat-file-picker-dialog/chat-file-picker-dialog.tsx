import { useEffect, useId, useState } from "react";
import {
  ButtonControl,
  CheckboxControl,
  Dialog,
  DialogSize,
  FileKindIcon,
  PrimaryCtaButton,
} from "@invessiv/ui";
import type { ComposerAttachment } from "@invessiv/common/contracts/ui/composer-attachment";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FileListLoadStatus } from "@/common/constants/files/file-list-load-status";
import type { ChatAttachmentApi } from "@/common/contracts/files/chat-attachment-api";
import type { ChatAttachmentTexts } from "@/common/contracts/files/chat-attachment-texts";
import { mapPagedFiles } from "@/common/patterns/files/map-paged-files";
import { usePagedFiles } from "@/hooks/shared/use-paged-files";
import styles from "./chat-file-picker-dialog.module.css";

const SEARCH_DELAY_MS = 250;

export type ChatFilePickerDialogProps = {
  /** Entries already on the message; shown checked and not selectable twice. */
  attachedIds: readonly string[];
  labels: ChatAttachmentTexts;
  listFiles: NonNullable<ChatAttachmentApi<{ id: string }>["listFiles"]>;
  onCloseAction: () => void;
  onPickAction: (attachments: ComposerAttachment[]) => void;
  /** Free attachment slots of the message. */
  remaining: number;
  searchable: boolean;
};

// The shared paged list keys entries by `id`; the composer only ever receives `fileId`.
function withId(attachment: ComposerAttachment) {
  return { ...attachment, id: attachment.fileId };
}

function withoutId(file: ReturnType<typeof withId>): ComposerAttachment {
  const { fileId, displayName, assetKind, releasesOnSend } = file;
  return { fileId, displayName, assetKind, releasesOnSend };
}

/** Picks existing files and links the viewer may attach; the server checks every id again. */
export function ChatFilePickerDialog({
  attachedIds,
  labels,
  listFiles,
  onCloseAction,
  onPickAction,
  remaining,
  searchable,
}: ChatFilePickerDialogProps) {
  const searchId = useId();
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ComposerAttachment[]>([]);
  const list = usePagedFiles(query, async (page) =>
    mapPagedFiles(await listFiles(page, query), withId),
  );

  useEffect(() => {
    if (search.trim() === query) return;
    const timer = window.setTimeout(
      () => setQuery(search.trim()),
      SEARCH_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [query, search]);

  function toggle(file: ComposerAttachment) {
    setSelected((current) =>
      current.some((entry) => entry.fileId === file.fileId)
        ? current.filter((entry) => entry.fileId !== file.fileId)
        : [...current, file],
    );
  }

  const full = selected.length >= remaining;
  const loading =
    list.status === FileListLoadStatus.Loading ||
    list.status === FileListLoadStatus.LoadingMore;

  return (
    <Dialog
      closeLabel={labels.close}
      description={labels.pickerDescription}
      footer={
        <div className={styles.footer}>
          {full ? <p className={styles.hint}>{labels.limitReached}</p> : null}
          <ButtonControl onClick={onCloseAction} type="button" variant="ghost">
            {labels.cancel}
          </ButtonControl>
          <PrimaryCtaButton
            disabled={selected.length === 0}
            onClick={() => onPickAction(selected)}
            type="button"
          >
            {selected.length > 1
              ? formatMessage(labels.confirmCount, {
                  count: String(selected.length),
                })
              : labels.confirm}
          </PrimaryCtaButton>
        </div>
      }
      onCloseAction={onCloseAction}
      size={DialogSize.Narrow}
      title={labels.pickerTitle}
    >
      <div className={styles.body}>
        {searchable ? (
          <div className={styles.search}>
            <label htmlFor={searchId}>{labels.search}</label>
            <input
              id={searchId}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={labels.searchPlaceholder}
              type="search"
              value={search}
            />
          </div>
        ) : null}
        {list.status === FileListLoadStatus.Error ? (
          <div className={styles.status} role="alert">
            <p>{labels.loadError}</p>
            <ButtonControl onClick={list.reload} type="button" variant="ghost">
              {labels.retry}
            </ButtonControl>
          </div>
        ) : !loading && list.files.length === 0 ? (
          <p className={styles.status}>
            {query ? (labels.emptySearch ?? labels.empty) : labels.empty}
          </p>
        ) : (
          <ul aria-busy={loading} className={styles.list}>
            {list.files.map((file) => {
              const attached = attachedIds.includes(file.fileId);
              const checked =
                attached ||
                selected.some((entry) => entry.fileId === file.fileId);
              return (
                <li key={file.fileId}>
                  <label className={styles.row} data-checked={checked}>
                    <CheckboxControl
                      aria-label={formatMessage(labels.selectNamed, {
                        name: file.displayName,
                      })}
                      checked={checked}
                      disabled={attached || (!checked && full)}
                      onChange={() => toggle(withoutId(file))}
                    />
                    <FileKindIcon assetKind={file.assetKind} />
                    <span className={styles.name}>{file.displayName}</span>
                    {file.releasesOnSend && labels.internalBadge ? (
                      <span className={styles.badge}>
                        {labels.internalBadge}
                      </span>
                    ) : null}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {loading ? (
          <p aria-live="polite" className={styles.status} role="status">
            {labels.loading}
          </p>
        ) : null}
        {list.status === FileListLoadStatus.Ready && list.hasMore ? (
          <ButtonControl
            className={styles.more}
            onClick={() => void list.loadMore()}
            type="button"
            variant="ghost"
          >
            {labels.loadMore}
          </ButtonControl>
        ) : null}
      </div>
    </Dialog>
  );
}
