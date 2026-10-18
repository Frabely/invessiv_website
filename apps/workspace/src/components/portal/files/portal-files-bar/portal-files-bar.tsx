"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PrimaryCtaButton } from "@invessiv/ui";
import { PortalPageBar } from "@/components/portal/shared/portal-page-bar/portal-page-bar";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";

export type PortalFilesBarProps = {
  canUpload: boolean;
  content: PortalFilesDictionary;
  onAddAction: () => void;
};

/**
 * The one entry point for adding files, always in view; the ZIP actions float above it while
 * files are selected.
 */
export function PortalFilesBar({
  canUpload,
  content,
  onAddAction,
}: PortalFilesBarProps) {
  if (!canUpload) return null;

  return (
    <PortalPageBar
      actions={
        <PrimaryCtaButton onClick={onAddAction} type="button">
          <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          {content.actions.add}
        </PrimaryCtaButton>
      }
    />
  );
}
