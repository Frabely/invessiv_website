import type { FileDto } from "@invessiv/common/contracts/files/file.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";

type PreviewFile = Pick<FileDto, "id" | "source" | "extension" | "sizeBytes">;

function list<TFile extends PreviewFile>(files: readonly TFile[]): TFile[] {
  return files.filter((file) => filePresentation.previewKindOf(file) !== null);
}

/** Resolves an id against the current list, so a removed file closes the preview. */
function indexOf(files: readonly PreviewFile[], fileId: string | null): number {
  return fileId === null ? -1 : files.findIndex((file) => file.id === fileId);
}

export const filePreviewSelection = { list, indexOf } as const;
