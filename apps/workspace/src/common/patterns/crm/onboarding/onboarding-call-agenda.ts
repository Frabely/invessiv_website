import { OnboardingClarificationMode } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { listOnboardingClarificationBlocks } from "@invessiv/common/patterns/crm/onboarding/onboarding-review";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { OnboardingCallAgenda } from "@/common/contracts/crm/onboarding/onboarding-call-agenda";
import type { OnboardingCallAgendaTexts } from "@/common/contracts/crm/onboarding/onboarding-call-agenda-texts";
import { questionnaireBlockName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";

type AgendaSource = Pick<
  OnboardingFormDto,
  "blocks" | "servicesChangedSinceConfirmation" | "servicesNote"
>;

/** What the call has to settle: the questions kept for it and the two hints on the services. */
export function buildOnboardingCallAgenda(
  form: AgendaSource,
  locale: Locale,
): OnboardingCallAgenda {
  return {
    points: listOnboardingClarificationBlocks(
      form.blocks,
      OnboardingClarificationMode.Call,
    ).map((step) => ({
      blockId: step.block.id,
      title: questionnaireBlockName(step.block, locale),
      note: step.reviewNote ?? "",
    })),
    servicesChanged: form.servicesChangedSinceConfirmation,
    servicesNote: form.servicesNote,
  };
}

export function isOnboardingCallAgendaEmpty(
  agenda: OnboardingCallAgenda,
): boolean {
  return (
    agenda.points.length === 0 &&
    !agenda.servicesChanged &&
    agenda.servicesNote === null
  );
}

const singleLine = (text: string) => text.replace(/\s+/g, " ").trim();

/** The agenda as plain text for the clipboard: a heading, then one line per item. */
export function formatOnboardingCallAgenda(
  agenda: OnboardingCallAgenda,
  projectTitle: string,
  texts: OnboardingCallAgendaTexts,
): string {
  const items = agenda.points.map(
    (point) => `${point.title}: ${singleLine(point.note)}`,
  );
  if (agenda.servicesChanged) items.push(texts.servicesChanged);
  if (agenda.servicesNote !== null)
    items.push(`${texts.servicesNote}: ${singleLine(agenda.servicesNote)}`);
  return [
    formatMessage(texts.textHeading, { project: projectTitle }),
    "",
    ...items.map((item) => `- ${item}`),
  ].join("\n");
}
