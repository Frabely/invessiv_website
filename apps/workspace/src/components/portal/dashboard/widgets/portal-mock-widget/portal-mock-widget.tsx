"use client";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import { Widget } from "@invessiv/ui";
import { PortalMockPreview } from "../../portal-mock-preview/portal-mock-preview";

type PortalMockWidgetBaseProps = {
  badgeLabel: string;
  icon: IconDefinition;
  onOpenAction: () => void;
  openLabel: string;
  teaser: string;
  title: string;
};

export type PortalMockWidgetProps = PortalMockWidgetBaseProps &
  (
    | { openMode: typeof WidgetOpenMode.Dialog }
    | {
        openMode: typeof WidgetOpenMode.Dock;
        controlsId: string;
        expanded: boolean;
      }
  );

/**
 * A placeholder for a feature of a later folder: marked "coming soon", illustrative shapes only,
 * and an open action that explains what the area will offer.
 */
export function PortalMockWidget(props: PortalMockWidgetProps) {
  const { badgeLabel, icon, onOpenAction, openLabel, teaser, title } = props;
  const body = <PortalMockPreview teaser={teaser} />;
  const common = {
    icon,
    mock: { badgeLabel },
    onOpenAction,
    openLabel,
    title,
    wholeCardClickable: true,
  };

  if (props.openMode === WidgetOpenMode.Dock) {
    return (
      <Widget
        {...common}
        controlsId={props.controlsId}
        expanded={props.expanded}
        openMode={WidgetOpenMode.Dock}
      >
        {body}
      </Widget>
    );
  }
  return (
    <Widget {...common} openMode={WidgetOpenMode.Dialog}>
      {body}
    </Widget>
  );
}
