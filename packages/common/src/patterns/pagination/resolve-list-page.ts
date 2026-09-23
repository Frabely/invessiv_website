import type { ResolveListPageOptions } from "./resolve-list-page-options";
import type { ResolvedListPage } from "./resolved-list-page";

/** The one place a list handler decides which page to actually serve and where it starts. */
export function resolveListPage({
  perPage,
  requestedPage,
  total,
}: ResolveListPageOptions): ResolvedListPage {
  if (total <= 0) {
    return { offset: 0, page: 1 };
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(requestedPage, 1), totalPages);
  return { offset: (page - 1) * perPage, page };
}
