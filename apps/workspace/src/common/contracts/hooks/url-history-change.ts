/** The navigation a mounted field must allow before its page may change. */
export type UrlHistoryChange = {
  previousUrl: URL;
  nextUrl: URL;
  /** Only true for local steps whose fields stay mounted, including hidden ones. */
  preservesFields: boolean;
};
