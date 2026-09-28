export const FileStatus = { Pending: "pending", Ready: "ready" } as const;
export type FileStatus = (typeof FileStatus)[keyof typeof FileStatus];
export const FILE_STATUS_VALUES = [
  FileStatus.Pending,
  FileStatus.Ready,
] as const;
