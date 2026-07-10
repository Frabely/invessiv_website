const GENERATED_TRACKING_PARAM_NAMES = new Set([
  "_ga",
  "_gl",
  "_up",
  "gclid",
  "gbraid",
  "wbraid",
]);

function isGeneratedTrackingParam(name: string) {
  return (
    GENERATED_TRACKING_PARAM_NAMES.has(name) ||
    name.startsWith("_ga_") ||
    name.startsWith("_gl_")
  );
}

function sanitizeSearch(search: string) {
  const searchParams = new URLSearchParams(search);

  for (const key of [...searchParams.keys()]) {
    if (isGeneratedTrackingParam(key)) {
      searchParams.delete(key);
    }
  }

  return searchParams.toString();
}

export function createInternalNavigationUrl(
  pathname: string,
  search: string,
  hash = "",
) {
  const sanitizedSearch = sanitizeSearch(search);

  return `${pathname}${sanitizedSearch ? `?${sanitizedSearch}` : ""}${hash}`;
}

export function createAnchorHistoryUrl(pathname: string, hash: string) {
  return `${pathname}${hash}`;
}
