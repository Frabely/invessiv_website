/** Whether a catalog entry extends a project the customer already has or starts one of its own. */
export const LineItemProjectMode = {
  ExistingProject: "existing_project",
  NewProject: "new_project",
} as const;

export type LineItemProjectMode =
  (typeof LineItemProjectMode)[keyof typeof LineItemProjectMode];

export const LINE_ITEM_PROJECT_MODE_VALUES = [
  LineItemProjectMode.ExistingProject,
  LineItemProjectMode.NewProject,
] as const;
