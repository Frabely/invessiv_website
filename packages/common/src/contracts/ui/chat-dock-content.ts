export type ChatDockContent = {
  /** Heading and rail label for this conversation. */
  title: string;
  /** Accessible label while the dock is closed. */
  expand: string;
  /** Accessible label while the dock is open. */
  collapse: string;
  /** Explains the current visibility of the conversation. */
  readAlong: string;
  /** Text shown when no real thread content is supplied. */
  body: string;
  /** Accessible name of the disabled mock composer. */
  inputLabel: string;
  /** Placeholder of the disabled mock composer. */
  inputPlaceholder: string;
  /** Accessible name of the disabled mock send button. */
  send: string;
};
