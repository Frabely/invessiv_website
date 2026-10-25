/** Ties a content area to the tab that shows it, so it can carry the tabpanel role. */
export type TabPanelBinding = {
  /** Id the tab points at with `aria-controls`. */
  id: string;
  /** Id of the active tab, which names the panel. */
  labelledBy: string;
};
