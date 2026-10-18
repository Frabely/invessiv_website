import type { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { FileAttachmentTexts } from "@/common/contracts/files/file-attachment-texts";

/** File actions shared by onboarding answers, editor steps and the read-only form. */
export type OnboardingReadFiles = {
  loadPreviewAction: (
    file: FileAttachmentDto,
    kind: FilePreviewKind,
  ) => Promise<string | null>;
  locale: string;
  onDownloadAction: (file: FileAttachmentDto) => void;
  texts: FileAttachmentTexts;
};
