"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { faArrowRight, faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  PORTAL_FILE_ORIGIN_VALUES,
  PortalFileOrigin,
} from "@invessiv/common/constants/portal/portal-file-origin";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { PortalFilesOverviewDto } from "@invessiv/common/contracts/portal/portal-files-overview.dto";
import { filePresentation } from "@invessiv/common/patterns/files/file-presentation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FileKindIcon, TabList, Widget } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import styles from "./portal-files-widget.module.css";

export type PortalFilesWidgetProps = {
  content: PortalDashboardDictionary["widgets"]["files"];
  /** Link to the files page; the tab of the newest entries is kept. */
  filesHref: string;
  locale: Locale;
  overview: PortalFilesOverviewDto;
};

/** The newest entries per origin; everything else, including uploads, lives on the files page. */
export function PortalFilesWidget({
  content,
  filesHref,
  locale,
  overview,
}: PortalFilesWidgetProps) {
  const [tab, setTab] = useState<PortalFileOrigin>(PortalFileOrigin.FromUs);
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const page = overview[tab];
  const rest = page.total - page.files.length;

  return (
    <Widget
      count={overview.fromUs.total + overview.fromYou.total}
      footer={
        <Link className={styles.all} href={filesHref}>
          {content.all}
          <FontAwesomeIcon aria-hidden="true" icon={faArrowRight} />
        </Link>
      }
      icon={faFolderOpen}
      openMode={WidgetOpenMode.None}
      title={content.title}
    >
      <TabList
        activeValue={tab}
        ariaLabel={content.tabsLabel}
        items={PORTAL_FILE_ORIGIN_VALUES.map((origin) => ({
          value: origin,
          id: `${baseId}-${origin}`,
          panelId,
          label: `${content[origin]} (${overview[origin].total})`,
          accessibleName: content[origin],
        }))}
        onSelectAction={setTab}
      />
      <div
        aria-labelledby={`${baseId}-${tab}`}
        className={styles.panel}
        id={panelId}
        role="tabpanel"
      >
        {page.files.length === 0 ? (
          <p className={styles.empty}>
            {tab === PortalFileOrigin.FromUs
              ? content.emptyFromUs
              : content.emptyFromYou}
          </p>
        ) : (
          <ul className={styles.list}>
            {page.files.map((file) => (
              <li className={styles.item} key={file.id}>
                <FileKindIcon
                  assetKind={file.assetKind}
                  extension={file.extension}
                />
                <span className={styles.name}>{file.displayName}</span>
                <time className={styles.date} dateTime={file.createdAt}>
                  {filePresentation.formatDate(file.createdAt, locale)}
                </time>
              </li>
            ))}
          </ul>
        )}
        {rest > 0 ? (
          <p className={styles.more}>
            {rest === 1
              ? content.moreOne
              : formatMessage(content.more, { count: String(rest) })}
          </p>
        ) : null}
      </div>
    </Widget>
  );
}
