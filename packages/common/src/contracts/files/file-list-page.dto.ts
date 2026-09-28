import type { FileDto } from "./file.dto";

export interface FileListPageDto {
  /** Ready entries of this page, newest first. */
  files: FileDto[];
  /** Number of entries matching the filters across all pages. */
  total: number;
  /** One-based page that was returned. */
  page: number;
  /** Page size the server applied. */
  pageSize: number;
}
