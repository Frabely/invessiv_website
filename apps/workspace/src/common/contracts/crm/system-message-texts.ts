import type { SystemMessageThreadTexts } from "./system-message-thread-texts";

/** The part of a chat dictionary (CRM or portal) that turns system events into text. */
export type SystemMessageTexts = {
  /** Template per `SystemMessageKey`, with `{param}` placeholders. */
  systemMessages: Readonly<Record<string, string>>;
  /** Display name per project phase value. */
  phases: Readonly<Record<string, string>>;
  thread: SystemMessageThreadTexts;
};
