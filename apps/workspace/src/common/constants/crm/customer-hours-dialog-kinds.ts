export const CustomerHoursDialogKind = {
  Purchase: "purchase",
  Allocation: "allocation",
} as const;

export type CustomerHoursDialogKind =
  (typeof CustomerHoursDialogKind)[keyof typeof CustomerHoursDialogKind];
