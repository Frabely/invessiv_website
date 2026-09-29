import {
  faDownload,
  faUpRightFromSquare,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonControl, ButtonLink, FileKindIcon } from "@invessiv/ui";
import type { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { AttachmentChipKind } from "@invessiv/common/constants/ui/attachment-chip-kinds";
import styles from "./attachment-chip.module.css";

type AttachmentChipBaseProps = {
  /** Null shows the neutral icon of an entry the viewer may no longer see. */
  assetKind: AssetKind | null;
  /** File name, or the "no longer available" text without a name. */
  name: string;
};

export type AttachmentChipProps = AttachmentChipBaseProps &
  (
    | { kind: typeof AttachmentChipKind.Static; unavailable?: boolean }
    | {
        kind: typeof AttachmentChipKind.Removable;
        onRemoveAction: () => void;
        removeLabel: string;
      }
    | {
        kind: typeof AttachmentChipKind.Download;
        onDownloadAction: () => void;
        label: string;
      }
    | { kind: typeof AttachmentChipKind.Link; href: string; label: string }
  );

/** One file or link on a message or in the composer: type icon, name and at most one action. */
export function AttachmentChip(props: AttachmentChipProps) {
  const content = (
    <>
      <FileKindIcon assetKind={props.assetKind} />
      <span className={styles.name}>{props.name}</span>
    </>
  );

  switch (props.kind) {
    case AttachmentChipKind.Link:
      return (
        <ButtonLink
          aria-label={props.label}
          className={styles.chip}
          href={props.href}
          rel="noopener noreferrer"
          target="_blank"
          variant="ghost"
        >
          {content}
          <FontAwesomeIcon
            aria-hidden="true"
            className={styles.action}
            icon={faUpRightFromSquare}
          />
        </ButtonLink>
      );
    case AttachmentChipKind.Download:
      return (
        <ButtonControl
          aria-label={props.label}
          className={styles.chip}
          onClick={props.onDownloadAction}
          type="button"
          variant="ghost"
        >
          {content}
          <FontAwesomeIcon
            aria-hidden="true"
            className={styles.action}
            icon={faDownload}
          />
        </ButtonControl>
      );
    case AttachmentChipKind.Removable:
      return (
        <span className={styles.chip} data-removable="true">
          {content}
          <ButtonControl
            aria-label={props.removeLabel}
            className={styles.remove}
            onClick={props.onRemoveAction}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </ButtonControl>
        </span>
      );
    case AttachmentChipKind.Static:
      return (
        <span
          className={styles.chip}
          data-state={props.unavailable ? "unavailable" : undefined}
        >
          {content}
        </span>
      );
  }
}
