export const MESSAGE_BODY_MAX_LENGTH = 10_000;
export const MESSAGE_PAGE_SIZE = 50;
/** Files and links one message may reference; also bounds the stored attachment position. */
export const MESSAGE_ATTACHMENTS_MAX = 10;
/** Messages one portal membership may send within any rolling window, not per clock hour. */
export const PORTAL_MESSAGES_PER_HOUR = 30;
/** Length of that rolling window; a message stops counting once it is older than this. */
export const PORTAL_MESSAGE_RATE_WINDOW_SECONDS = 60 * 60;
