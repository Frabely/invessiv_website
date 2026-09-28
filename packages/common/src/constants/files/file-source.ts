export const FileSource = { Upload: "upload", Link: "link" } as const;
export type FileSource = (typeof FileSource)[keyof typeof FileSource];
export const FILE_SOURCE_VALUES = [FileSource.Upload, FileSource.Link] as const;
