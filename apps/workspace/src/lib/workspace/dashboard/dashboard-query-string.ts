type SearchParamsInput = Record<string, string | string[] | undefined>;

export function serializeDashboardSearchParams(
  searchParams: SearchParamsInput,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
      continue;
    }
    params.append(key, value);
  }
  return params.toString();
}

export function buildDashboardHref(
  basePath: string,
  queryString: string,
  overrides: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams(queryString);
  for (const [key, value] of Object.entries(overrides)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }
  const nextQuery = params.toString();
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
}
