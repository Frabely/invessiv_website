"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { CheckboxControl, PrimaryCtaLink } from "@invessiv/ui";

import type { CrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./line-item-templates-page-header.module.css";

type LineItemTemplatesPageHeaderProps = {
  archivedToggleHref: string;
  content: CrmLineItemTemplatesDictionary;
  /** Null without `line_item_templates.write`; the action is then not rendered at all. */
  createHref: string | null;
  includeArchived: boolean;
};

export function LineItemTemplatesPageHeader({
  archivedToggleHref,
  content,
  createHref,
  includeArchived,
}: LineItemTemplatesPageHeaderProps) {
  const router = useRouter();

  return (
    <header className={styles.header}>
      <div className={styles.intro}>
        <h1 className={styles.title}>{content.shell.title}</h1>
        <p className={styles.description}>{content.shell.description}</p>
      </div>
      <div className={styles.actions}>
        <label className={styles.archiveFilter}>
          <CheckboxControl
            checked={includeArchived}
            onChange={() => router.push(archivedToggleHref, { scroll: false })}
          />
          <span>{content.shell.includeArchived}</span>
        </label>
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
            {content.shell.createAction}
          </PrimaryCtaLink>
        ) : null}
      </div>
    </header>
  );
}
