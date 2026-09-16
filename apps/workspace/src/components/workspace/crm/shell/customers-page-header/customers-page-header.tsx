import Link from "next/link";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PrimaryCtaLink } from "@invessiv/ui";

import type { CrmShellDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./customers-page-header.module.css";

type CustomersPageHeaderProps = {
  content: CrmShellDictionary;
  /** Null without `customers.write`; the action is then not rendered at all. */
  createHref: string | null;
};

export function CustomersPageHeader({
  content,
  createHref,
}: CustomersPageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.description}>{content.description}</p>
      </div>
      {createHref ? (
        <PrimaryCtaLink
          className={styles.createLink}
          href={createHref}
          linkComponent={Link}
          linkComponentProps={{ scroll: false }}
        >
          <FontAwesomeIcon
            aria-hidden="true"
            className={styles.icon}
            icon={faPlus}
          />
          {content.createCustomer}
        </PrimaryCtaLink>
      ) : null}
    </header>
  );
}
