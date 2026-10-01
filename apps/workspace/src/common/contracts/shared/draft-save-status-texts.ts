/** Wording of the autosave status line; every user passes its own dictionary section. */
export interface DraftSaveStatusTexts {
  saving: string;
  /** Carries `{time}`. */
  saved: string;
  unsaved: string;
  failed: string;
  retry: string;
  /** Carries `{name}`. */
  editedBy: string;
  justNow: string;
  /** Carries `{count}`. */
  minutesAgo: string;
  /** Carries `{date}`. */
  at: string;
}
