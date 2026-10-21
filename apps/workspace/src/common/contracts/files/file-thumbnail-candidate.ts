import type { FileDto } from "@invessiv/common/contracts/files/file.dto";

/** Lists without thumbnail metadata remain valid and never trigger background refreshes. */
export type FileThumbnailCandidate = Pick<FileDto, "id"> &
  Partial<Pick<FileDto, "assetKind" | "source" | "extension" | "thumbnailUrl">>;
