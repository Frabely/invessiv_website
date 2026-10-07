/** Texts of a secret field. `{name}` is the field name, `{seconds}` a number. */
export type CredentialSecretFieldLabels = {
  show: string;
  hide: string;
  copy: string;
  copied: string;
  showNamed: string;
  hideNamed: string;
  copyNamed: string;
  /** Read instead of the mask dots. */
  masked: string;
  loading: string;
  countdown: string;
  /** Live-region texts; none of them may contain the value. */
  visibleAnnouncement: string;
  hiddenAnnouncement: string;
  copiedAnnouncement: string;
  clipboardFailed: string;
};
