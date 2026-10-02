import type { QuestionnaireValueErrorCode } from "@invessiv/common/constants/crm/questionnaire/questionnaire-value-error-codes";
import type { PortalOnboardingErrorCode } from "@invessiv/common/constants/portal/portal-onboarding-error-codes";
import type { QuestionnaireAnswerFileRefDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file-ref.dto";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireCompletenessInput } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness-input";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import type { PortalFileDto } from "@invessiv/common/contracts/portal/portal-file.dto";
import type { PortalOnboardingServiceDto } from "@invessiv/common/contracts/portal/portal-onboarding-service.dto";
import type { PortalOnboardingResult } from "@invessiv/common/contracts/portal/results/portal-onboarding-result";
import type { OnboardingAnswerDrafts } from "@/common/contracts/portal/onboarding-answer-drafts";
import type { OnboardingAnswerSlotRef } from "@/common/contracts/portal/onboarding-answer-slot-ref";
import type {
  PortalFilesDictionary,
  PortalOnboardingDictionary,
} from "@/i18n/dictionaries/portal";

/**
 * Everything a field of the portal form reads from and writes to the form it sits in. The editor
 * builds it once; every field, on block level or inside a group entry, gets the same object.
 */
export interface OnboardingFieldFormContext {
  /** Attached files of the whole form; a files field shows those of its own slot. */
  answerFiles: readonly QuestionnaireAnswerFileDto[];
  /** Where files hang that the contact may not open; a read-only block says so. */
  hiddenAnswerFiles: readonly QuestionnaireAnswerFileRefDto[];
  /** True while a group, file or services command is on its way. */
  busy: boolean;
  /** May attach and detach, which needs `portal.files.read` on top of the submit right. */
  canAttach: boolean;
  /** May upload as well, which needs `portal.files.write`. */
  canUpload: boolean;
  /** Texts of the onboarding form in the reader's locale. */
  content: PortalOnboardingDictionary;
  /** Company the form belongs to; uploads and file requests address it. */
  customerId: string;
  /** Typed text and selections by slot key. */
  drafts: OnboardingAnswerDrafts;
  /** Why the last command of a group failed, by field id. */
  errors: ReadonlyMap<string, PortalOnboardingErrorCode>;
  /** File texts and errors for uploads, downloads and previews. */
  filesContent: PortalFilesDictionary;
  /** The live state of the whole form; conditions are evaluated against it. */
  input: QuestionnaireCompletenessInput;
  /** Slots whose text cannot be saved, by slot key. */
  invalid: ReadonlyMap<string, QuestionnaireValueErrorCode>;
  /** Locale of the page, for dates and file sizes. */
  locale: Locale;
  /** Adds an entry to a group and returns its id, so the focus can move into it. */
  onAddEntryAction: (fieldId: string) => string;
  /** Says something to screen readers through the live region of the page. */
  onAnnounceAction: (message: string) => void;
  /** Hangs an uploaded file onto a files slot. */
  onAttachFileAction: (
    slot: OnboardingAnswerSlotRef,
    file: PortalFileDto,
  ) => Promise<PortalOnboardingResult<QuestionnaireAnswerFileDto>>;
  /** Takes typed text or a selection; `immediate` saves without the typing delay. */
  onChangeAction: (
    slotKey: string,
    entries: readonly string[],
    options?: { immediate?: boolean },
  ) => void;
  /** The field was left; what was typed is saved now. */
  onCommitAction: (slotKey: string) => void;
  /** Confirms the booked services; `note` null means they fit as shown. */
  onConfirmServicesAction: (note: string | null) => Promise<boolean>;
  /** The customer chose to leave a remark on the services but has not written it yet. */
  onOpenServicesRemarkAction: () => void;
  /** The form still waits for the text of an announced remark on the services. */
  servicesRemarkOpen: boolean;
  /** Unhooks a file from its slot by the id of the link. */
  onDetachFileAction: (
    link: QuestionnaireAnswerFileDto,
  ) => Promise<PortalOnboardingResult<unknown>>;
  /** Moves a group entry one step up or down. */
  onMoveEntryAction: (
    entry: QuestionnaireGroupEntryDto,
    direction: -1 | 1,
  ) => void;
  /** Removes a group entry with its answers and file links. */
  onRemoveEntryAction: (entry: QuestionnaireGroupEntryDto) => void;
  /** A slot started or finished uploading; the form holds its submission meanwhile. */
  onUploadActivityAction: (slotKey: string, active: boolean) => void;
  /** Project of the form; uploads land there. */
  projectId: string;
  /** Booked services a `project_services` field shows, without prices. */
  services: readonly PortalOnboardingServiceDto[];
  /** Why the last confirmation of the services failed; null while it is fine. */
  servicesError: PortalOnboardingErrorCode | null;
  /** The stored remark on the services; null when there is none. */
  servicesNote: string | null;
}
