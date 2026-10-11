/** A normalized page; wrappers supply pagination and metadata. */
export type PagedListPage<TEntry, TPosition, TMetadata = undefined> = {
  entries: TEntry[];
  nextPage: TPosition | null;
  metadata: TMetadata;
};
