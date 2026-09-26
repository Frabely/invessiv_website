"use client";

import { useId, useState } from "react";
import { faFolderOpen } from "@fortawesome/free-solid-svg-icons";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import { TabList, Widget } from "@invessiv/ui";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import { PortalMockPreview } from "../../portal-mock-preview/portal-mock-preview";
import styles from "./portal-files-widget.module.css";

const FilesTab = { FromYou: "fromYou", FromUs: "fromUs" } as const;
type FilesTab = (typeof FilesTab)[keyof typeof FilesTab];

export type PortalFilesWidgetProps = {
  badgeLabel: string;
  content: PortalDashboardDictionary["widgets"]["files"];
  onOpenAction: () => void;
};

/**
 * Mock until folders 15/15a: the two origins are already separated, so the later real lists slot
 * into the same tabs. The tabs are interactive, so the card is not clickable as a whole.
 */
export function PortalFilesWidget({
  badgeLabel,
  content,
  onOpenAction,
}: PortalFilesWidgetProps) {
  const [tab, setTab] = useState<FilesTab>(FilesTab.FromYou);
  const baseId = useId();
  const panelId = `${baseId}-panel`;

  return (
    <Widget
      icon={faFolderOpen}
      mock={{ badgeLabel }}
      onOpenAction={onOpenAction}
      openLabel={content.open}
      openMode={WidgetOpenMode.Dialog}
      title={content.title}
    >
      <TabList
        activeValue={tab}
        ariaLabel={content.tabsLabel}
        items={[
          {
            value: FilesTab.FromYou,
            id: `${baseId}-${FilesTab.FromYou}`,
            panelId,
            label: content.fromYou,
          },
          {
            value: FilesTab.FromUs,
            id: `${baseId}-${FilesTab.FromUs}`,
            panelId,
            label: content.fromUs,
          },
        ]}
        onSelectAction={setTab}
      />
      <div
        aria-labelledby={`${baseId}-${tab}`}
        className={styles.panel}
        id={panelId}
        role="tabpanel"
      >
        <PortalMockPreview
          teaser={
            tab === FilesTab.FromYou
              ? content.teaserFromYou
              : content.teaserFromUs
          }
        />
      </div>
    </Widget>
  );
}
