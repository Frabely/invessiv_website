import Link from "next/link";
import { ServiceRequestInboxFilter as F } from "@/common/constants/crm/service-request-inbox-query-params";
import { buildServiceRequestInboxHref } from "@/common/patterns/crm/service-request-inbox-query";
import type { CrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./service-request-inbox-toolbar.module.css";
export function ServiceRequestInboxToolbar({
  basePath,
  filter,
  content,
}: {
  basePath: string;
  filter: F;
  content: CrmServiceRequestsDictionary;
}) {
  return (
    <nav aria-label={content.filters.label} className={styles.toolbar}>
      {[F.Open, F.All].map((value) => (
        <Link
          key={value}
          href={buildServiceRequestInboxHref(basePath, value)}
          aria-current={filter === value ? "page" : undefined}
        >
          {content.filters[value]}
        </Link>
      ))}
    </nav>
  );
}
