import Link from "next/link";
import styles from "./breadcrumbs.module.css";

export type BreadcrumbsItem = {
  href?: string;
  isLink: boolean;
  label: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbsItem[];
  navLabel: string;
};

export function Breadcrumbs({ items, navLabel }: BreadcrumbsProps) {
  return (
    <nav aria-label={navLabel} className={styles.nav}>
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              aria-current={isLast ? "page" : undefined}
              className={styles.item}
              key={`${item.label}-${index}`}
            >
              {item.isLink && item.href ? (
                <Link className={styles.link} href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span className={styles.current}>{item.label}</span>
              )}
              {!isLast ? (
                <span aria-hidden="true" className={styles.separator} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
