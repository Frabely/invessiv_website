/** Chat-specific attachment texts; the CRM and the portal fill them from their messages dictionary. */
export type ChatAttachmentTexts = {
  attach: string;
  upload: string;
  pick: string;
  limitReached: string;
  uploadTitle: string;
  uploadDescription: string;
  pickerTitle: string;
  pickerDescription: string;
  /** Label of the picker's search field; only the CRM list can search. */
  search?: string;
  /** Placeholder of the search field. */
  searchPlaceholder?: string;
  empty: string;
  /** Empty state for a search without results. */
  emptySearch?: string;
  loading: string;
  loadError: string;
  retry: string;
  loadMore: string;
  confirm: string;
  confirmCount: string;
  cancel: string;
  close: string;
  selectNamed: string;
  /** A chip's download could not be started, e.g. the release was withdrawn meanwhile. */
  downloadError: string;
  /** Badge of an internal entry in the picker; only the CRM shows internal entries. */
  internalBadge?: string;
  /** Notice above the composer for one internal entry; only the CRM releases on send. */
  releaseNoticeOne?: string;
  /** Same notice for several internal entries. */
  releaseNoticeMany?: string;
  /** Explicit confirmation before the CRM releases an internal attachment. */
  releaseConfirmTitle?: string;
  releaseConfirmDescription?: string;
  releaseConfirmButton?: string;
};
