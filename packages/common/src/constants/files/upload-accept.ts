import { UPLOAD_EXTENSION_VALUES } from "./upload-extension";

/** Native picker hint only; `classifyUploadCandidate` remains the actual check. */
export const UPLOAD_ACCEPT_ATTRIBUTE = UPLOAD_EXTENSION_VALUES.map(
  (extension) => `.${extension}`,
).join(",");
