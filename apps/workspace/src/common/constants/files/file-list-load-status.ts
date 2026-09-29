export const FileListLoadStatus = {
  Loading: "loading",
  LoadingMore: "loading_more",
  Ready: "ready",
  Error: "error",
} as const;
export type FileListLoadStatus =
  (typeof FileListLoadStatus)[keyof typeof FileListLoadStatus];
