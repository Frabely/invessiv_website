export const UploadSide = {
  Internal: "internal",
  Customer: "customer",
} as const;
export type UploadSide = (typeof UploadSide)[keyof typeof UploadSide];
export const UPLOAD_SIDE_VALUES = [
  UploadSide.Internal,
  UploadSide.Customer,
] as const;
