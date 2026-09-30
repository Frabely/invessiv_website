import type { FileDto } from "../../files/file.dto";

/** What a form shows of an attached file; downloads go through the file endpoints of the viewer's side. */
export type OnboardingAttachment = Pick<
  FileDto,
  | "id"
  | "displayName"
  | "assetKind"
  | "source"
  | "extension"
  | "sizeBytes"
  | "url"
  | "note"
  | "createdAt"
>;
