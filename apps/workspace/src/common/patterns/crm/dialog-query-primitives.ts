export type DialogSearchParamsInput = Record<
  string,
  string | string[] | undefined
>;

export function readDialogSearchParam(
  searchParams: DialogSearchParamsInput,
  key: string,
): string | null {
  const value = searchParams[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function buildDialogHref(
  basePath: string,
  params: URLSearchParams,
): string {
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
