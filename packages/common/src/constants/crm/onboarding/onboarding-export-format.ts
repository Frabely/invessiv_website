/** Raised whenever the shape of `OnboardingExportDto` changes, so a consumer can tell exports apart. */
export const ONBOARDING_EXPORT_SCHEMA_VERSION = 1;

/** Name of the JSON file at the root of the export archive. */
export const ONBOARDING_EXPORT_MANIFEST_NAME = "onboarding.json";

/** Name of the file at the root of the export archive that explains `onboarding.json`. */
export const ONBOARDING_EXPORT_README_NAME = "README.md";

/** Folder of the archive that holds the attached files; the manifest paths start with it. */
export const ONBOARDING_EXPORT_FILES_FOLDER = "files";

/** Folder below the files folder for a file attached to more than one question; packed once. */
export const ONBOARDING_EXPORT_SHARED_FOLDER = "shared";

/** Folder of one group entry below its group field, numbered from 1. */
export const ONBOARDING_EXPORT_ENTRY_FOLDER_PREFIX = "entry-";
