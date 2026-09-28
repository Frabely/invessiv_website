export const FileInspectionStatus = { Unscanned: "unscanned" } as const;
export type FileInspectionStatus =
  (typeof FileInspectionStatus)[keyof typeof FileInspectionStatus];
export const FILE_INSPECTION_STATUS_VALUES =
  Object.values(FileInspectionStatus);
