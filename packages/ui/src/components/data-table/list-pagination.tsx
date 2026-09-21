import {
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./list-pagination.module.css";

export type ListPaginationProps = {
  basePath: string;
  content: {
    ariaLabel: string;
    first: string;
    last: string;
    next: string;
    page: string;
    previous: string;
    showing: string;
  };
  currentPage: number;
  perPage: number;
  queryString: string;
  total: number;
};

type PaginationItem = { page: number } | { id: string };

const PAGINATION_WINDOW_RADIUS = 1;
const PAGINATION_COMPACT_PAGE_COUNT = 7;

function buildPaginationHref(
  basePath: string,
  queryString: string,
  page: number,
) {
  const params = new URLSearchParams(queryString);
  params.set("page", String(page));
  const nextQuery = params.toString();
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
}

function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= PAGINATION_COMPACT_PAGE_COUNT) {
    return Array.from({ length: totalPages }, (_, index) => ({
      page: index + 1,
    }));
  }

  const pages = new Set([1, totalPages]);
  const start = Math.max(2, currentPage - PAGINATION_WINDOW_RADIUS);
  const end = Math.min(totalPages - 1, currentPage + PAGINATION_WINDOW_RADIUS);
  for (let page = start; page <= end; page += 1) pages.add(page);

  const sortedPages = [...pages].sort((left, right) => left - right);
  return sortedPages.flatMap((page, index) => {
    const previousPage = sortedPages[index - 1];
    const ellipsis =
      typeof previousPage === "number" && page - previousPage > 1
        ? [{ id: `ellipsis-${previousPage}-${page}` }]
        : [];
    return [...ellipsis, { page }];
  });
}

function formatPaginationSummary(
  template: string,
  from: number,
  to: number,
  total: number,
) {
  return template
    .replace("{from}", String(from))
    .replace("{to}", String(to))
    .replace("{total}", String(total));
}

export function ListPagination({
  basePath,
  content,
  currentPage,
  perPage,
  queryString,
  total,
}: ListPaginationProps) {
  const isEmpty = total === 0;
  const totalPages = isEmpty ? 1 : Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const from = isEmpty ? 0 : (page - 1) * perPage + 1;
  const to = isEmpty ? 0 : Math.min(page * perPage, total);
  const previousPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const items = getPaginationItems(page, totalPages);

  function navigationLink(
    label: string,
    targetPage: number,
    disabled: boolean,
    icon: typeof faAnglesLeft,
  ) {
    return disabled ? (
      <span aria-disabled="true" className={styles.button}>
        <FontAwesomeIcon aria-hidden="true" icon={icon} />
        <span className={styles.label}>{label}</span>
      </span>
    ) : (
      <a
        aria-label={label}
        className={styles.button}
        href={buildPaginationHref(basePath, queryString, targetPage)}
      >
        <FontAwesomeIcon aria-hidden="true" icon={icon} />
        <span className={styles.label}>{label}</span>
      </a>
    );
  }

  return (
    <nav aria-label={content.ariaLabel} className={styles.pagination}>
      <p className={styles.summary}>
        {formatPaginationSummary(content.showing, from, to, total)}
      </p>
      <div className={styles.actions}>
        {navigationLink(content.first, 1, isEmpty || page === 1, faAnglesLeft)}
        {navigationLink(
          content.previous,
          previousPage,
          isEmpty || page === 1,
          faChevronLeft,
        )}
        <div className={styles.pages}>
          {items.map((item) =>
            "id" in item ? (
              <span
                aria-hidden="true"
                className={styles.ellipsis}
                key={item.id}
              >
                …
              </span>
            ) : item.page === page ? (
              <span aria-current="page" className={styles.page} key={item.page}>
                {item.page}
              </span>
            ) : (
              <a
                aria-label={content.page.replace("{page}", String(item.page))}
                className={styles.page}
                href={buildPaginationHref(basePath, queryString, item.page)}
                key={item.page}
              >
                {item.page}
              </a>
            ),
          )}
        </div>
        {navigationLink(
          content.next,
          nextPage,
          isEmpty || page === totalPages,
          faChevronRight,
        )}
        {navigationLink(
          content.last,
          totalPages,
          isEmpty || page === totalPages,
          faAnglesRight,
        )}
      </div>
    </nav>
  );
}
