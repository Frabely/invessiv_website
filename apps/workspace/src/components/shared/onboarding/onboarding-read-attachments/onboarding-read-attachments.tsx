import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { OnboardingReadFiles } from "@/common/contracts/shared/onboarding-read-files";
import { FileAttachmentList } from "@/components/shared/files/file-attachment-list/file-attachment-list";
import styles from "./onboarding-read-attachments.module.css";

export type OnboardingReadAttachmentsProps = {
  attachments: readonly FileAttachmentDto[];
  files?: OnboardingReadFiles;
  hidden: boolean;
  hiddenText: string;
  label: string;
};

/** Reading attachments keeps previews and downloads available without any upload actions. */
export function OnboardingReadAttachments({
  attachments,
  files,
  hidden,
  hiddenText,
  label,
}: OnboardingReadAttachmentsProps) {
  return (
    <>
      {attachments.length === 0 ? null : files ? (
        <FileAttachmentList
          attachments={attachments}
          label={label}
          loadPreviewAction={files.loadPreviewAction}
          locale={files.locale}
          onDownloadAction={files.onDownloadAction}
          texts={files.texts}
        />
      ) : (
        <ul aria-label={label} className={styles.names}>
          {attachments.map((file) => (
            <li key={file.id}>{file.displayName}</li>
          ))}
        </ul>
      )}
      {hidden ? <p className={styles.hidden}>{hiddenText}</p> : null}
    </>
  );
}
