import { LeadListQueryParam } from "@/common/constants/leads/list/lead-list-query-params";
import { PaginationItemKind } from "@/common/constants/leads/list/lead-pagination-item-kinds";

export type PaginationItemPage = {
  kind: typeof PaginationItemKind.Page;
  page: number;
};

export type PaginationItemEllipsis = {
  kind: typeof PaginationItemKind.Ellipsis;
  id: string;
};

export type PaginationItem = PaginationItemPage | PaginationItemEllipsis;

const PAGINATION_START_PAGE = 1;
const PAGINATION_EMPTY_PAGE_COUNT = 0;
const PAGINATION_MIN_WINDOW_PAGE = 2;
const PAGINATION_VISIBLE_WINDOW_RADIUS = 1;
const PAGINATION_MAX_COMPACT_PAGES = 7;
const PAGINATION_GAP_THRESHOLD = 1;

export function buildPaginationHref(
  basePath: string,
  queryString: string,
  page: number,
): string {
  const params = new URLSearchParams(queryString);
  params.set(LeadListQueryParam.Page, String(page));

  const nextQuery = params.toString();
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
}

export function getPaginationItems(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= PAGINATION_EMPTY_PAGE_COUNT) {
    return [];
  }

  if (totalPages <= PAGINATION_MAX_COMPACT_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => ({
      kind: PaginationItemKind.Page,
      page: index + PAGINATION_START_PAGE,
    }));
  }

  const pages = new Set<number>([PAGINATION_START_PAGE, totalPages]);
  const windowStart = Math.max(
    PAGINATION_MIN_WINDOW_PAGE,
    currentPage - PAGINATION_VISIBLE_WINDOW_RADIUS,
  );
  const windowEnd = Math.min(
    totalPages - PAGINATION_START_PAGE,
    currentPage + PAGINATION_VISIBLE_WINDOW_RADIUS,
  );

  for (let page = windowStart; page <= windowEnd; page += 1) {
    pages.add(page);
  }

  const sortedPages = [...pages].sort((left, right) => left - right);
  const items: PaginationItem[] = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];
    if (
      typeof previousPage === "number" &&
      page - previousPage > PAGINATION_GAP_THRESHOLD
    ) {
      items.push({
        kind: PaginationItemKind.Ellipsis,
        id: `ellipsis-${previousPage}-${page}`,
      });
    }

    items.push({
      kind: PaginationItemKind.Page,
      page,
    });
  });

  return items;
}
