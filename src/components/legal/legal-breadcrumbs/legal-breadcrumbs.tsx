import Link from "next/link";

export type LegalBreadcrumbItem = {
  href?: string;
  isLink: boolean;
  label: string;
};

type LegalBreadcrumbsProps = {
  items: LegalBreadcrumbItem[];
  navLabel: string;
};

export function LegalBreadcrumbs({ items, navLabel }: LegalBreadcrumbsProps) {
  return (
    <nav aria-label={navLabel}>
      <ol className="legal-breadcrumbs">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              aria-current={isLast ? "page" : undefined}
              className="legal-breadcrumbs__item"
              key={`${item.label}-${index}`}
            >
              {item.isLink && item.href ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
              {!isLast ? <span aria-hidden="true" className="legal-breadcrumbs__separator">→</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
