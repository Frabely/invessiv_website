import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";

export type PortalFileProjectLabelProps = {
  content: PortalFilesDictionary;
  file: PortalFileDto;
};

/** What a portal file belongs to: its project, or "general" without one. */
export function PortalFileProjectLabel({
  content,
  file,
}: PortalFileProjectLabelProps) {
  if (file.projectId === null) return <span>{content.row.general}</span>;
  return file.projectTitle ? <span>{file.projectTitle}</span> : null;
}
