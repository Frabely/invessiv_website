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
  search: string;
  searchPlaceholder: string;
  empty: string;
  emptySearch: string;
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
};
