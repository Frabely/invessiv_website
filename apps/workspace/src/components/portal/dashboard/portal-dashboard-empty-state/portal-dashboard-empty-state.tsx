import { faSeedling } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { EmptyState } from "@invessiv/ui";
import type { PortalDashboardDictionary } from "@/i18n/dictionaries/portal";
import styles from "./portal-dashboard-empty-state.module.css";

export type PortalDashboardEmptyStateProps = {
  content: PortalDashboardDictionary["widgets"]["project"];
};

/** Takes the project's place while no project is released yet; the contact widget stays reachable. */
export function PortalDashboardEmptyState({
  content,
}: PortalDashboardEmptyStateProps) {
  return (
    <div className={styles.frame}>
      <EmptyState
        alignment="start"
        description={content.emptyDescription}
        icon={<FontAwesomeIcon icon={faSeedling} />}
        title={content.emptyTitle}
      />
    </div>
  );
}
