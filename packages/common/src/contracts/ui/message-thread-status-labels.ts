/** Texts of the state shown before a conversation's first page has arrived. */
export type MessageThreadStatusLabels = {
  /** Shown while the first page loads. */
  loading: string;
  /** Shown when the first page could not be loaded. */
  loadError: string;
  /** Button that retries the first load. */
  reload: string;
};
