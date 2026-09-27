/** Error lines a conversation can show above its history. */
export type ThreadNoticeTexts = {
  /** The latest reload failed. */
  loadError: string;
  /** Loading an older page failed. */
  olderError: string;
  /** Only the portal is rate limited, so the CRM has no text for it. */
  rateLimited?: string;
};
