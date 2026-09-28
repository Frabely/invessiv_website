import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faFile,
  faFileCsv,
  faFileExcel,
  faFileImage,
  faFileLines,
  faFilePdf,
  faFilePowerpoint,
  faFileVideo,
  faFileWord,
  faFont,
  faLink,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import type { UploadExtension } from "@invessiv/common/constants/files/upload-extension";
import styles from "./file-kind-icon.module.css";

type FileKindIconProps = {
  assetKind: AssetKind | null;
  extension?: UploadExtension | null;
};

const ICON_BY_EXTENSION: Partial<Record<UploadExtension, IconDefinition>> = {
  pdf: faFilePdf,
  docx: faFileWord,
  xlsx: faFileExcel,
  pptx: faFilePowerpoint,
  csv: faFileCsv,
  txt: faFileLines,
};

const ICON_BY_KIND: Record<AssetKind, IconDefinition> = {
  [AssetKind.Document]: faFileLines,
  [AssetKind.Image]: faFileImage,
  [AssetKind.Video]: faFileVideo,
  [AssetKind.Font]: faFont,
  [AssetKind.Link]: faLink,
};

/** Decorative: the row always names the type in text as well. */
export function FileKindIcon({ assetKind, extension }: FileKindIconProps) {
  const icon =
    (extension ? ICON_BY_EXTENSION[extension] : undefined) ??
    (assetKind ? ICON_BY_KIND[assetKind] : faFile);
  return (
    <span
      aria-hidden="true"
      className={styles.icon}
      data-kind={assetKind ?? "unknown"}
    >
      <FontAwesomeIcon icon={icon} />
    </span>
  );
}
