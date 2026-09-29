/** The page shape both the CRM and the portal list endpoints answer with. */
export type PagedFiles<TFile> = {
  files: TFile[];
  total: number;
  page: number;
  pageSize: number;
};
