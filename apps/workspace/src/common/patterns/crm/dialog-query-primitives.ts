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

/**
 * Every CRM list dialog reads the same create/edit shape from the URL, differing only in which
 * query-param names, mode values and id field it uses. Domain call sites annotate the returned
 * function with their own `*DialogRequest` union so it keeps its exact, narrow type.
 */
export function createDialogRequestReader<
  TMode extends { Create: string; Edit: string },
  TIdKey extends string,
>(
  queryParam: { Mode: string; Edit: string },
  mode: TMode,
  idKey: TIdKey,
): (
  searchParams: DialogSearchParamsInput,
) =>
  | { mode: TMode["Create"] }
  | ({ mode: TMode["Edit"] } & Record<TIdKey, string>)
  | null {
  return (searchParams) => {
    const modeValue = readDialogSearchParam(searchParams, queryParam.Mode);

    if (modeValue === mode.Create) {
      return { mode: mode.Create };
    }

    const id = readDialogSearchParam(searchParams, queryParam.Edit);
    if (modeValue === mode.Edit && id) {
      return { mode: mode.Edit, [idKey]: id } as {
        mode: TMode["Edit"];
      } & Record<TIdKey, string>;
    }

    return null;
  };
}
