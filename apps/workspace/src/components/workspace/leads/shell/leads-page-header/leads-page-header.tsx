"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faPlus } from "@fortawesome/free-solid-svg-icons";
import type {
  LeadsImportDictionary,
  LeadsShellDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { useNavigationContext } from "@/hooks/workspace/use-navigation-context";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import { ImportLeadsDialog } from "@/components/workspace/leads/import/import-leads-dialog/import-leads-dialog";
import styles from "./leads-page-header.module.css";

type LeadsPageHeaderProps = {
  content: LeadsShellDictionary;
  addLeadHref: string;
  importContent?: LeadsImportDictionary;
};

export function LeadsPageHeader({
  addLeadHref,
  content,
  importContent,
}: LeadsPageHeaderProps) {
  const router = useRouter();
  const startTransition = useNavigationContext();

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{content.title}</h1>
          <span className={styles.privacyBadge} title={content.privacyBadge}>
            <span aria-hidden="true" className={styles.privacyBadgeIcon}>
              <FontAwesomeIcon icon={faLock} />
            </span>
            {content.privacyBadge}
          </span>
        </div>
        <p className={styles.description}>{content.description}</p>
      </div>
      <div className={styles.actionsRow}>
        {importContent && <ImportLeadsDialog content={importContent} />}
        <PrimaryCtaButton
          className={styles.addButton}
          onClick={() =>
            startTransition(() => router.push(addLeadHref, { scroll: false }))
          }
        >
          <span aria-hidden="true" className={styles.addButtonIcon}>
            <FontAwesomeIcon icon={faPlus} />
          </span>
          {content.addLeadButton}
        </PrimaryCtaButton>
      </div>
    </header>
  );
}
