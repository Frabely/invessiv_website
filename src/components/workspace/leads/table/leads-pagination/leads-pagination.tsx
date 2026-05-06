import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import type { LeadsPaginationDictionary } from "@/i18n/dictionaries/workspace/leads";
import {
  buildPaginationHref,
  getPaginationItems,
} from "./leads-pagination.utils";
import { PaginationItemKind } from "@/common/constants/leads/lead-pagination-item-kinds";
import styles from "./leads-pagination.module.css";

type LeadsPaginationProps = {
  basePath: string;
  currentPage: number;
  perPage: number;
  queryString: string;
  total: number;
  content: LeadsPaginationDictionary;
};

function formatSummary(
  template: string,
  from: number,
  to: number,
  total: number,
): string {
  return template
    .replace("{from}", String(from))
    .replace("{to}", String(to))
    .replace("{total}", String(total));
}

function getPageLabel(template: string, page: number): string {
  return template.replace("{page}", String(page));
}

type NavIconVariant = "first" | "previous" | "next" | "last";
type NavIconPlacement = "leading" | "trailing";

function getNavIcon(variant: NavIconVariant) {
  switch (variant) {
    case "first":
      return faAnglesLeft;
    case "previous":
      return faChevronLeft;
    case "next":
      return faChevronRight;
    case "last":
      return faAnglesRight;
  }
}

export function LeadsPagination({
  basePath,
  currentPage,
  content,
  perPage,
  queryString,
  total,
}: LeadsPaginationProps) {
  const isEmpty = total === 0;
  const totalPages = isEmpty ? 1 : Math.max(1, Math.ceil(total / perPage));
  const effectivePage = Math.min(Math.max(currentPage, 1), totalPages);
  const from = isEmpty ? 0 : (effectivePage - 1) * perPage + 1;
  const to = isEmpty ? 0 : Math.min(effectivePage * perPage, total);
  const items = getPaginationItems(effectivePage, totalPages);
  const firstHref = buildPaginationHref(basePath, queryString, 1);
  const previousPage = Math.max(1, effectivePage - 1);
  const nextPage = Math.min(totalPages, effectivePage + 1);
  const lastHref = buildPaginationHref(basePath, queryString, totalPages);

  function renderNavLink(
    label: string,
    href: string,
    disabled: boolean,
    iconVariant: NavIconVariant,
    iconPlacement: NavIconPlacement = "leading",
  ) {
    const icon = (
      <span aria-hidden="true" className={styles.navIcon}>
        <FontAwesomeIcon icon={getNavIcon(iconVariant)} />
      </span>
    );

    const commonContent = (
      <>
        {iconPlacement === "leading" ? icon : null}
        <span className={styles.navLabel}>{label}</span>
        {iconPlacement === "trailing" ? icon : null}
      </>
    );

    if (disabled) {
      return (
        <span
          aria-disabled="true"
          className={`${styles.navButton} ${styles.navButtonDisabled}`}
        >
          {commonContent}
        </span>
      );
    }

    return (
      <Link className={styles.navButton} href={href}>
        {commonContent}
      </Link>
    );
  }

  function renderPageItem(page: number) {
    const isCurrentPage = !isEmpty && page === effectivePage;

    if (isEmpty || isCurrentPage) {
      return (
        <span
          aria-current={isCurrentPage ? "page" : undefined}
          aria-disabled={isEmpty ? "true" : undefined}
          className={`${styles.pageButton} ${
            isCurrentPage ? styles.pageButtonActive : styles.pageButtonDisabled
          }`}
          key={page}
        >
          {page}
        </span>
      );
    }

    return (
      <Link
        aria-label={getPageLabel(content.pagination.page, page)}
        className={styles.pageButton}
        href={buildPaginationHref(basePath, queryString, page)}
        key={page}
      >
        {page}
      </Link>
    );
  }

  return (
    <nav
      aria-label={content.pagination.ariaLabel}
      className={styles.pagination}
    >
      <div className={styles.summaryRow}>
        <p className={styles.summary}>
          {formatSummary(content.pagination.showing, from, to, total)}
        </p>
        <div className={styles.controls}>
          {renderNavLink(
            content.pagination.first,
            firstHref,
            isEmpty || effectivePage === 1,
            "first",
          )}
          {renderNavLink(
            content.pagination.previous,
            buildPaginationHref(basePath, queryString, previousPage),
            isEmpty || effectivePage === 1,
            "previous",
          )}

          <div className={styles.pageStrip}>
            {items.map((item) =>
              item.kind === PaginationItemKind.Ellipsis ? (
                <span
                  aria-hidden="true"
                  className={styles.ellipsis}
                  key={item.id}
                >
                  …
                </span>
              ) : (
                renderPageItem(item.page)
              ),
            )}
          </div>

          {renderNavLink(
            content.pagination.next,
            buildPaginationHref(basePath, queryString, nextPage),
            isEmpty || effectivePage === totalPages,
            "next",
            "trailing",
          )}
          {renderNavLink(
            content.pagination.last,
            lastHref,
            isEmpty || effectivePage === totalPages,
            "last",
            "trailing",
          )}
        </div>
      </div>
    </nav>
  );
}
