export function getHashHref(href: string | null) {
  if (!href || !href.startsWith("#") || href.length < 2) {
    return null;
  }

  return href;
}

const GOOGLE_LINKER_SEARCH_PARAM_NAMES = new Set(["_ga", "_gl", "_up"]);

function isGoogleLinkerSearchParam(name: string) {
  return GOOGLE_LINKER_SEARCH_PARAM_NAMES.has(name) || name.startsWith("_ga_");
}

export function createInternalNavigationUrl(
  pathname: string,
  search: string,
  hash = "",
) {
  const searchParams = new URLSearchParams(search);

  for (const key of [...searchParams.keys()]) {
    if (isGoogleLinkerSearchParam(key)) {
      searchParams.delete(key);
    }
  }

  const sanitizedSearch = searchParams.toString();

  return `${pathname}${sanitizedSearch ? `?${sanitizedSearch}` : ""}${hash}`;
}

export function createAnchorHistoryUrl(
  pathname: string,
  search: string,
  hash: string,
) {
  return createInternalNavigationUrl(pathname, search, hash);
}

export function getLayoutDocumentTop(element: HTMLElement) {
  let top = 0;
  let current: HTMLElement | null = element;

  while (current) {
    const isSticky =
      typeof window !== "undefined" &&
      typeof HTMLElement !== "undefined" &&
      current instanceof HTMLElement &&
      window.getComputedStyle(current).position === "sticky";
    if (!isSticky) {
      top += current.offsetTop;
    }
    const parent: Element | null = current.offsetParent;
    current = parent && "offsetTop" in parent ? (parent as HTMLElement) : null;
  }

  return top;
}

export function getLayoutDocumentLeft(element: HTMLElement) {
  let left = 0;
  let current: HTMLElement | null = element;

  while (current) {
    left += current.offsetLeft;
    const parent: Element | null = current.offsetParent;
    current = parent && "offsetLeft" in parent ? (parent as HTMLElement) : null;
  }

  return left;
}

export function getAnchorScrollTop(
  anchorTop: number,
  currentScrollY: number,
  offset: number,
) {
  return Math.max(0, Math.round(anchorTop + currentScrollY - offset));
}
