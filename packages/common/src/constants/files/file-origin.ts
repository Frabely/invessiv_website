export const FileOrigin = {
  Customer: "customer",
  Shared: "shared",
  Internal: "internal",
} as const;
export type FileOrigin = (typeof FileOrigin)[keyof typeof FileOrigin];
export const FILE_ORIGIN_VALUES = [
  FileOrigin.Customer,
  FileOrigin.Shared,
  FileOrigin.Internal,
] as const;
