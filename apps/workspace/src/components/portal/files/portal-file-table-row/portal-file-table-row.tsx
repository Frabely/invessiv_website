"use client";

import type { MouseEvent } from "react";
import {
  faArrowUpRightFromSquare,
  faCircleArrowDown,
  faCircleArrowUp,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { PortalFileOrigin } from "@invessiv/common/constants/portal/portal-file-origin";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  Badge,
  ButtonControl,
  ButtonLink,
  CheckboxControl,
  DataTableCell,
  DataTableHeaderCell,
  DataTableRow,
  FileKindIcon,
} from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import { PortalFileProjectLabel } from "../portal-file-project-label/portal-file-project-label";
import styles from "./portal-file-table-row.module.css";

export type PortalFileTableRowProps = {
  /** The file shown in the side panel. */
  active: boolean;
  content: PortalFilesDictionary;
  file: PortalFileDto;
  locale: Locale;
  selected: boolean;
  /** Names the project; pointless while the page shows a single project. */
  showProject: boolean;
  /** With the side panel every entry opens there; without it links open directly. */
  withPanel: boolean;
  onDownloadAction: (file: PortalFileDto) => void;
  onOpenAction: (file: PortalFileDto) => void;
  /** Absent for entries that cannot go into a ZIP (videos, or the limit is reached). */
  onSelectAction?: (file: PortalFileDto) => void;
};

function isInteractiveDescendant(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.closest("a[href], button, input, label") !== null
  );
}

/**
 * One file of the portal table. A click anywhere in the row opens it like its name does; keyboard
 * users reach the same through the name, checkbox and action keep their own clicks.
 */
export function PortalFileTableRow({
  active,
  content,
  file,
  locale,
  selected,
  showProject,
  withPanel,
  onDownloadAction,
  onOpenAction,
  onSelectAction,
}: PortalFileTableRowProps) {
  const columns = content.table.columns;
  const name = { name: file.displayName };
  const linkUrl = file.source === FileSource.Link ? file.url : null;
  const opensDirectly = linkUrl !== null && !withPanel;
  const opens =
    !opensDirectly &&
    (withPanel || filePresentation.previewKindOf(file) !== null);
  const fromUs = file.origin === PortalFileOrigin.FromUs;

  function handleClick(event: MouseEvent<HTMLTableRowElement>) {
    if (isInteractiveDescendant(event.target)) return;
    if (opensDirectly && linkUrl)
      window.open(linkUrl, "_blank", "noopener,noreferrer");
    else if (opens) onOpenAction(file);
  }

  return (
    <DataTableRow
      className={styles.row}
      data-active={active ? "true" : "false"}
      data-opens={opens || opensDirectly ? "true" : "false"}
      data-selected={selected ? "true" : "false"}
      mobileCard
      onClick={handleClick}
    >
      <DataTableCell className={styles.selectCell} mobileCardSlot="selection">
        {onSelectAction ? (
          <CheckboxControl
            aria-label={formatMessage(content.archive.selectNamed, name)}
            checked={selected}
            onChange={() => onSelectAction(file)}
          />
        ) : null}
      </DataTableCell>
      <DataTableHeaderCell
        className={styles.nameCell}
        mobileCardSlot="primary"
        scope="row"
      >
        <span className={styles.identity}>
          <FileKindIcon assetKind={file.assetKind} extension={file.extension} />
          <span className={styles.text}>
            {opensDirectly && linkUrl ? (
              <a
                aria-label={`${file.displayName} (${content.row.opensInNewTab})`}
                className={styles.name}
                href={linkUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {file.displayName}
              </a>
            ) : opens ? (
              <button
                aria-current={active ? "true" : undefined}
                className={styles.name}
                onClick={() => onOpenAction(file)}
                type="button"
              >
                {file.displayName}
              </button>
            ) : (
              <span className={styles.name}>{file.displayName}</span>
            )}
            {file.note ? (
              <span className={styles.note}>{file.note}</span>
            ) : null}
          </span>
        </span>
      </DataTableHeaderCell>
      <DataTableCell mobileCardSlot="secondary">
        <Badge
          icon={fromUs ? faCircleArrowDown : faCircleArrowUp}
          label={content.origin[file.origin]}
          tone={fromUs ? BadgeTone.Primary : BadgeTone.Teal}
        />
      </DataTableCell>
      {showProject ? (
        <DataTableCell
          className={styles.projectCell}
          mobileCardSlot="supportingSecondary"
          mobileLabel={columns.project}
        >
          <PortalFileProjectLabel content={content} file={file} />
        </DataTableCell>
      ) : null}
      <DataTableCell
        className={styles.typeCell}
        mobileCardSlot="supportingPrimary"
        mobileLabel={columns.type}
      >
        {filePresentation.typeLabel(file, content.kinds[file.assetKind])}
      </DataTableCell>
      <DataTableCell
        className={styles.sizeCell}
        mobileCardSlot="supportingSecondary"
        mobileLabel={file.sizeBytes !== null ? columns.size : undefined}
      >
        {file.sizeBytes !== null
          ? filePresentation.formatSize(file.sizeBytes, locale)
          : null}
      </DataTableCell>
      <DataTableCell
        className={styles.dateCell}
        mobileCardSlot="supportingPrimary"
        mobileLabel={columns.added}
      >
        <time dateTime={file.createdAt}>
          {filePresentation.formatDate(file.createdAt, locale)}
        </time>
      </DataTableCell>
      <DataTableCell className={styles.actionCell} mobileCardSlot="actions">
        {linkUrl ? (
          <ButtonLink
            aria-label={formatMessage(content.row.openNamed, name)}
            href={linkUrl}
            rel="noopener noreferrer"
            size={ButtonSize.Icon}
            target="_blank"
            title={content.row.open}
            variant={ButtonVariant.Ghost}
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={faArrowUpRightFromSquare}
            />
          </ButtonLink>
        ) : (
          <ButtonControl
            aria-label={formatMessage(content.row.downloadNamed, name)}
            onClick={() => onDownloadAction(file)}
            size={ButtonSize.Icon}
            title={content.row.download}
            type="button"
            variant={ButtonVariant.Ghost}
          >
            <FontAwesomeIcon aria-hidden="true" icon={faDownload} />
          </ButtonControl>
        )}
      </DataTableCell>
    </DataTableRow>
  );
}
