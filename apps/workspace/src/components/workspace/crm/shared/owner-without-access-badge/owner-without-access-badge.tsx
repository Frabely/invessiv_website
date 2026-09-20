import { ButtonControl } from "@invessiv/ui";

import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./owner-without-access-badge.module.css";

export type OwnerWithoutAccessBadgeProps = {
  content: CrmCockpitDictionary["ownerAccess"];
  onGrantAccessAction?: () => void;
};

export function OwnerWithoutAccessBadge({
  content,
  onGrantAccessAction,
}: OwnerWithoutAccessBadgeProps) {
  return (
    <span className={styles.badge}>
      <span>{content.observation}</span>
      {onGrantAccessAction ? (
        <ButtonControl
          className={styles.action}
          onClick={onGrantAccessAction}
          type="button"
          variant="ghost"
        >
          {content.grantAccess}
        </ButtonControl>
      ) : null}
    </span>
  );
}
