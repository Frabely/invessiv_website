export function buildLeadHref(
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

  const nextQuery = params.toString().replace(/%2C/g, ",");
  return nextQuery ? `${basePath}?${nextQuery}` : basePath;
}

export function formatLeadCreatedAt(locale: string, createdAt: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(createdAt));
}
