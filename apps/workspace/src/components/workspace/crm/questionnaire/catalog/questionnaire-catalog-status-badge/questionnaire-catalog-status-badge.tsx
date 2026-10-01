import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArchive, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { BadgeTone } from "@invessiv/common/constants/ui/badge-tones";
import { Badge } from "@invessiv/ui";

type QuestionnaireCatalogStatusBadgeProps = {
  label: string;
  status: QuestionnaireCatalogStatus;
};

const STATUS_ICONS: Record<QuestionnaireCatalogStatus, IconDefinition> = {
  [QuestionnaireCatalogStatus.Active]: faCircleCheck,
  [QuestionnaireCatalogStatus.Archived]: faArchive,
};

const STATUS_TONES: Record<QuestionnaireCatalogStatus, BadgeTone> = {
  [QuestionnaireCatalogStatus.Active]: BadgeTone.Success,
  [QuestionnaireCatalogStatus.Archived]: BadgeTone.Neutral,
};

export function QuestionnaireCatalogStatusBadge({
  label,
  status,
}: QuestionnaireCatalogStatusBadgeProps) {
  return (
    <Badge
      icon={STATUS_ICONS[status]}
      kind="status"
      label={label}
      tone={STATUS_TONES[status]}
    />
  );
}
