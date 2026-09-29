import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { MAX_ARCHIVE_FILES } from "@/common/constants/files/file-archive-limits";

type ArchiveEntry = { id: string; assetKind: AssetKind };

function shownIds<TFile extends ArchiveEntry>(
  files: readonly TFile[],
): string[] {
  return files
    .filter((file) => file.assetKind !== AssetKind.Video)
    .map((file) => file.id);
}

function canSelect<TFile extends ArchiveEntry>(
  file: TFile,
  selectedIds: readonly string[],
): boolean {
  return (
    file.assetKind !== AssetKind.Video &&
    (selectedIds.length < MAX_ARCHIVE_FILES || selectedIds.includes(file.id))
  );
}

export const fileArchiveSelection = { shownIds, canSelect } as const;
