/** Path segments that CRM and portal file routes share. */
export const FileApiPath = {
  Files: "files",
  Uploads: "uploads",
  Links: "links",
  Archive: "archive",
  Complete: "complete",
  Cancel: "cancel",
  DownloadUrl: "download-url",
  Download: "download",
} as const;

export type FileApiPath = (typeof FileApiPath)[keyof typeof FileApiPath];
