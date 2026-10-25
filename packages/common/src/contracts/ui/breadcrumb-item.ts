/** One entry of a breadcrumb trail. */
export type BreadcrumbItem = {
  /** Visible wording; also the accessible name, so it must not be shortened behind an icon. */
  label: string;
  /** Target of the entry. Without it, or on the last entry, the entry is plain text. */
  href?: string;
};
