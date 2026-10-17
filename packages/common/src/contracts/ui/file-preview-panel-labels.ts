/** Texts of the side panel that previews one file next to a list. */
export interface FilePreviewPanelLabels {
  /** Accessible name of the panel. */
  label: string;
  /** Shown while no file is chosen. */
  empty: string;
  loading: string;
  error: string;
  /** Opens the file in the full-size preview. */
  expand: string;
  download: string;
  /** Opens a link entry in a new tab. */
  open: string;
  opensInNewTab: string;
}
