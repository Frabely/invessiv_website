export type CursorListPage<TEntry> = {
  entries: TEntry[];
  nextCursor: string | null;
};
