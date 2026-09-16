export const CustomerSort = {
  NumberAsc: "number_asc",
  NumberDesc: "number_desc",
  NameAsc: "name_asc",
  NameDesc: "name_desc",
  StatusAsc: "status_asc",
  StatusDesc: "status_desc",
  UpdatedAsc: "updated_asc",
  UpdatedDesc: "updated_desc",
} as const;

export type CustomerSort = (typeof CustomerSort)[keyof typeof CustomerSort];

export const CUSTOMER_SORT_VALUES = Object.values(
  CustomerSort,
) as readonly CustomerSort[];
