import type {
  ArchiveEntry,
  ArchiveManifest,
  ArchiveText,
} from "@/server/shared/files/file-object-service-types";

/** Everything the route needs to stream the export; the manifest is built once the files are in. */
export type OnboardingExportArchive = {
  filename: string;
  entries: ArchiveEntry[];
  manifest: ArchiveManifest;
  /** Fixed files next to the manifest, i.e. the README that explains it. */
  texts: ArchiveText[];
};
