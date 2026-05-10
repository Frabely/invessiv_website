export const PaginationItemKind = {
  Ellipsis: "ellipsis",
  Page: "page",
} as const;

export type PaginationItemKind =
  (typeof PaginationItemKind)[keyof typeof PaginationItemKind];

export const LEAD_PAGINATION_ITEM_KIND_VALUES = [
  PaginationItemKind.Ellipsis,
  PaginationItemKind.Page,
] as const;
