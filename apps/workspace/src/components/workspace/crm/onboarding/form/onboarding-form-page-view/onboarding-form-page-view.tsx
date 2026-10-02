"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState } from "react";
import {
  faArrowLeft,
  faCircleCheck,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { OnboardingTransitionSide } from "@invessiv/common/constants/crm/onboarding/onboarding-transition-sides";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import type { OnboardingFormContextDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-context.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import { canTransitionOnboardingForm } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { summarizeOnboardingReview } from "@invessiv/common/patterns/crm/onboarding/onboarding-review";
import { getQuestionnaireCompleteness } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { PrimaryCtaButton, TabList } from "@invessiv/ui";
import {
  ONBOARDING_FORM_TAB_VALUES,
  OnboardingFormTab,
} from "@/common/constants/crm/onboarding/onboarding-form-tabs";
import {
  buildOnboardingFormTabHref,
  defaultOnboardingFormTab,
  readOnboardingFormTab,
} from "@/common/patterns/crm/onboarding/onboarding-form-query";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import { describeOnboardingReviewSummary } from "@/common/patterns/crm/onboarding/onboarding-review-summary-text";
import { OnboardingProgressBar } from "@/components/shared/onboarding/onboarding-progress-bar/onboarding-progress-bar";
import type { Locale } from "@/config/i18n";
import type {
  CrmOnboardingDictionary,
  CrmFilesDictionary,
  CrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { OnboardingStatusBadge } from "../../project/onboarding-status-badge/onboarding-status-badge";
import { OnboardingReviewTab } from "../../review/onboarding-review-tab/onboarding-review-tab";
import { OnboardingCompleteDialog } from "../onboarding-complete-dialog/onboarding-complete-dialog";
import { OnboardingFormAnswersTab } from "../onboarding-form-answers-tab/onboarding-form-answers-tab";
import { OnboardingFormStructure } from "../onboarding-form-structure/onboarding-form-structure";
import { OnboardingReleaseDialog } from "../onboarding-release-dialog/onboarding-release-dialog";
import styles from "./onboarding-form-page-view.module.css";

export type OnboardingFormPageViewProps = {
  /** The project tab of the customer's cockpit this form belongs to. */
  backHref: string;
  canWrite: boolean;
  catalogBlocks: readonly QuestionnaireBlockSummaryDto[];
  content: CrmOnboardingDictionary;
  context: OnboardingFormContextDto;
  /** File texts for the attachments on the answers tab. */
  filesContent: CrmFilesDictionary;
  fixedChoiceLabels: QuestionnaireFixedChoiceLabels;
  form: OnboardingFormDto;
  locale: Locale;
  questionnaireContent: CrmQuestionnaireDictionary;
};

/**
 * The internal page of one form: where it belongs, its status, the release of a draft and its tabs.
 * The tab is URL state, so a reload and a shared link open the same view. Once released, the head
 * shows how far the customer has got; once submitted, how far the review is and the way to
 * complete it. A completed form opens on its answers and names the call and the completion.
 */
export function OnboardingFormPageView({
  backHref,
  canWrite,
  catalogBlocks,
  content,
  context,
  filesContent,
  fixedChoiceLabels,
  form: initialForm,
  locale,
  questionnaireContent,
}: OnboardingFormPageViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const baseId = useId();
  const tabId = (tab: OnboardingFormTab) => `${baseId}-tab-${tab}`;
  const panelId = `${baseId}-panel`;
  const titleRef = useRef<HTMLHeadingElement>(null);
  // A conflict can bring a form whose status changed; the head follows it.
  const [form, setForm] = useState(initialForm);
  // The structure editor keeps its own copy; a form that arrives from outside it restarts it.
  const [structureSeed, setStructureSeed] = useState({
    form: initialForm,
    revision: 0,
  });
  const defaultTab = defaultOnboardingFormTab(form.status);
  const activeTab = readOnboardingFormTab(searchParams, defaultTab);
  const tabHref = (tab: OnboardingFormTab) =>
    buildOnboardingFormTabHref(
      pathname,
      searchParams.toString(),
      tab,
      defaultTab,
    );
  const [releasing, setReleasing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const text = content.form;
  const released = form.status !== OnboardingFormStatus.Draft;
  const completable = canTransitionOnboardingForm(
    form.status,
    OnboardingFormStatus.Completed,
    OnboardingTransitionSide.Internal,
  );
  const reviewSummary =
    form.submittedAt === null
      ? null
      : describeOnboardingReviewSummary(
          summarizeOnboardingReview(form.blocks),
          content.review.summary,
        );
  const errorTexts = {
    onboarding: content.errors,
    questionnaire: questionnaireContent.errors,
  };

  /** Takes over a form the release answered with, in the head and in the structure editor. */
  function adopt(next: OnboardingFormDto) {
    setForm(next);
    setStructureSeed((current) => ({
      form: next,
      revision: current.revision + 1,
    }));
  }

  return (
    <div className={styles.page}>
      <Link className={styles.back} href={backHref}>
        <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
        {text.back}
      </Link>
      <header className={styles.header}>
        <h1 className={styles.title} ref={titleRef} tabIndex={-1}>
          {formatMessage(text.title, { project: context.projectTitle })}
        </h1>
        <dl className={styles.meta}>
          <div className={styles.metaItem}>
            <dt>{text.customer}</dt>
            <dd>{context.customerName}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>{text.template}</dt>
            <dd>{context.templateTitle ?? text.templateNone}</dd>
          </div>
          {form.callHeldOn ? (
            <div className={styles.metaItem}>
              <dt>{text.callHeldOn}</dt>
              <dd>{formatCalendarDay(form.callHeldOn, locale)}</dd>
            </div>
          ) : null}
          {form.completedAt ? (
            <div className={styles.metaItem}>
              <dt>{text.completedAt}</dt>
              <dd>{formatMomentDay(form.completedAt, locale)}</dd>
            </div>
          ) : null}
        </dl>
        <OnboardingStatusBadge
          label={content.status[form.status]}
          status={form.status}
        />
        {canWrite && !released ? (
          <PrimaryCtaButton
            className={styles.release}
            onClick={() => setReleasing(true)}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPaperPlane} />
            {content.release.action}
          </PrimaryCtaButton>
        ) : null}
        {canWrite && completable ? (
          <PrimaryCtaButton
            className={styles.release}
            onClick={() => setCompleting(true)}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faCircleCheck} />
            {content.complete.action}
          </PrimaryCtaButton>
        ) : null}
        {released && form.blocks.length > 0 ? (
          <div className={styles.progress}>
            <OnboardingProgressBar
              progress={getQuestionnaireCompleteness({
                blocks: form.blocks.map((step) => step.block),
                answers: form.answers,
                answerFiles: form.answerFiles,
                groupEntries: form.groupEntries,
                servicesConfirmed: form.servicesConfirmedAt !== null,
              })}
              texts={content.answers.progress}
            />
          </div>
        ) : null}
        {reviewSummary ? (
          <p className={styles.review}>
            <span>{reviewSummary.reviewed}</span>
            <span>{reviewSummary.clarifications}</span>
          </p>
        ) : null}
      </header>
      <div className={styles.tabs}>
        <TabList
          activeValue={activeTab}
          ariaLabel={text.tabs.ariaLabel}
          items={ONBOARDING_FORM_TAB_VALUES.map((tab) => ({
            value: tab,
            id: tabId(tab),
            panelId,
            label: text.tabs[tab],
          }))}
          onSelectAction={(tab) =>
            router.replace(tabHref(tab), { scroll: false })
          }
        />
      </div>
      <div aria-labelledby={tabId(activeTab)} id={panelId} role="tabpanel">
        {activeTab === OnboardingFormTab.Answers ? (
          <OnboardingFormAnswersTab
            content={content}
            filesContent={filesContent}
            form={form}
            locale={locale}
          />
        ) : null}
        {activeTab === OnboardingFormTab.Review ? (
          <OnboardingReviewTab
            canWrite={canWrite}
            content={content}
            errorTexts={errorTexts}
            filesContent={filesContent}
            form={form}
            locale={locale}
            onAnnounceAction={setAnnouncement}
            onFormChangeAction={adopt}
            projectTitle={context.projectTitle}
          />
        ) : null}
        <div hidden={activeTab !== OnboardingFormTab.Structure}>
          <OnboardingFormStructure
            canWrite={canWrite}
            catalogBlocks={catalogBlocks}
            content={content}
            fixedChoiceLabels={fixedChoiceLabels}
            form={structureSeed.form}
            key={structureSeed.revision}
            locale={locale}
            onFormChangeAction={setForm}
            questionnaireContent={questionnaireContent}
          />
        </div>
      </div>
      {releasing ? (
        <OnboardingReleaseDialog
          content={content.release.dialog}
          errorTexts={errorTexts}
          form={form}
          locale={locale}
          onCloseAction={() => setReleasing(false)}
          onConflictAction={adopt}
          onReleasedAction={(next) => {
            adopt(next);
            setReleasing(false);
            setAnnouncement(content.release.released);
            // The button that opened the dialog is gone with the draft status.
            titleRef.current?.focus();
          }}
        />
      ) : null}
      {completing ? (
        <OnboardingCompleteDialog
          answersHref={tabHref(OnboardingFormTab.Answers)}
          content={content.complete.dialog}
          errorTexts={errorTexts}
          form={form}
          locale={locale}
          onCloseAction={() => setCompleting(false)}
          onCompletedAction={(next) => {
            adopt(next);
            setCompleting(false);
            setAnnouncement(content.complete.completed);
            // The button that opened the dialog is gone with the submitted status.
            titleRef.current?.focus();
          }}
          onConflictAction={adopt}
          phaseAdvanceable={context.projectPhase === ProjectPhase.Onboarding}
        />
      ) : null}
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
