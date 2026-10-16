"use client";

import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  type IconDefinition,
  faCircleCheck,
  faCommentDots,
  faComments,
  faEye,
  faFolderOpen,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { ProcessStepTone } from "@invessiv/common/constants/ui/process-step-tones";
import type { PortalOnboardingBlockDto } from "@invessiv/common/contracts/portal/portal-onboarding-block.dto";
import type { PortalOnboardingCallDto } from "@invessiv/common/contracts/portal/portal-onboarding-call.dto";
import type { PortalOnboardingFormDto } from "@invessiv/common/contracts/portal/portal-onboarding-form.dto";
import { getQuestionnaireCompleteness } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonLink } from "@invessiv/ui";
import { PORTAL_ONBOARDING_STATUS_SECTION } from "@/common/constants/portal/portal-onboarding-query-params";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import {
  OnboardingAnswerReadView,
  type OnboardingAnswerReadViewProps,
} from "@/components/shared/onboarding/onboarding-answer-read-view/onboarding-answer-read-view";
import type { Locale } from "@/config/i18n";
import { usePortalOnboardingStep } from "@/hooks/portal/use-portal-onboarding-step";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { OnboardingBookingCard } from "../onboarding-booking-card/onboarding-booking-card";
import { PortalStepHeader } from "@/components/portal/shared/portal-step-header/portal-step-header";
import { PortalStepBar } from "@/components/portal/shared/portal-step-bar/portal-step-bar";
import { PortalStepFrame } from "@/components/portal/shared/portal-step-frame/portal-step-frame";
import { PortalStepHeading } from "@/components/portal/shared/portal-step-heading/portal-step-heading";
import { OnboardingStepTrack } from "../onboarding-step-track/onboarding-step-track";
import styles from "./onboarding-form-reader.module.css";

// Nothing is visited, invalid or asked about while a form is only read.
const NONE: ReadonlySet<string> = new Set();

const STATUS_ICONS: Record<OnboardingFormStatus, IconDefinition> = {
  [OnboardingFormStatus.Draft]: faEye,
  [OnboardingFormStatus.Open]: faEye,
  [OnboardingFormStatus.Submitted]: faPaperPlane,
  [OnboardingFormStatus.ChangesRequested]: faCommentDots,
  [OnboardingFormStatus.Completed]: faCircleCheck,
};

const STATUS_TONES: Record<OnboardingFormStatus, ProcessStepTone> = {
  [OnboardingFormStatus.Draft]: ProcessStepTone.Neutral,
  [OnboardingFormStatus.Open]: ProcessStepTone.Neutral,
  [OnboardingFormStatus.Submitted]: ProcessStepTone.Info,
  [OnboardingFormStatus.ChangesRequested]: ProcessStepTone.Info,
  [OnboardingFormStatus.Completed]: ProcessStepTone.Success,
};

/** The heading of the status step, also the spoken status of its place in the track. */
function statusTitle(
  form: PortalOnboardingFormDto,
  content: PortalOnboardingDictionary,
  locale: Locale,
): string {
  const { states } = content;
  switch (form.status) {
    case OnboardingFormStatus.Completed:
      if (!form.completedAt) return states.open.title;
      return formatMessage(states.completed.title, {
        date: formatMomentDay(form.completedAt, locale),
      });
    case OnboardingFormStatus.Submitted:
      if (!form.submittedAt) return states.open.title;
      return formatMessage(states.submitted.title, {
        date: formatMomentDay(form.submittedAt, locale),
      });
    case OnboardingFormStatus.ChangesRequested:
      return states.changes_requested.title;
    default:
      return states.open.title;
  }
}

/** What the status means for the reader; the owner view gets its own notice instead. */
function statusText(
  form: PortalOnboardingFormDto,
  content: PortalOnboardingDictionary,
  ownerView: boolean,
): string | null {
  const { states } = content;
  switch (form.status) {
    case OnboardingFormStatus.Completed:
      return states.completed.description;
    case OnboardingFormStatus.Submitted:
      return states.submitted.description;
    case OnboardingFormStatus.ChangesRequested:
      return states.changes_requested.description;
    default:
      if (ownerView) return null;
      return content.page.readOnlyHint;
  }
}

export type OnboardingFormReaderProps = {
  backHref: string;
  /** The onboarding call once the team has reviewed the form; null until then and afterwards. */
  call: PortalOnboardingCallDto | null;
  /** The company's chat page; null without `portal.messages.read`. */
  chatHref: string | null;
  /** CRM link for the owner view; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalOnboardingDictionary;
  /** How attached files open: file texts, download and preview. */
  files: OnboardingAnswerReadViewProps["files"];
  /** The company's files page, where files go once the form is completed; null without `portal.files.read`. */
  filesHref: string | null;
  form: PortalOnboardingFormDto;
  locale: Locale;
  /** Shown above every step, e.g. why a download failed. */
  notice?: ReactNode;
  onAnnounceAction: (message: string) => void;
};

/**
 * A form nobody may write into right now, laid out like the form itself: the status first, with
 * what happens next, then one block per step with its answers as text. Reading needs no inputs,
 * so answers stay at full contrast and long text is never cut off.
 */
export function OnboardingFormReader({
  backHref,
  call,
  chatHref,
  cockpitHref,
  content,
  files,
  filesHref,
  form,
  locale,
  notice,
  onAnnounceAction,
}: OnboardingFormReaderProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ownerNoticeId = useId();
  const blockHeadingId = useId();
  const [navigated, setNavigated] = useState(false);
  const sections = useMemo(
    () => [
      PORTAL_ONBOARDING_STATUS_SECTION,
      ...form.blocks.map((block) => block.id),
    ],
    [form.blocks],
  );
  const step = usePortalOnboardingStep(sections);
  const completeness = useMemo(
    () =>
      getQuestionnaireCompleteness({
        blocks: form.blocks,
        answers: form.answers,
        answerFiles: [...form.answerFiles, ...form.hiddenAnswerFiles],
        groupEntries: form.groupEntries,
        servicesConfirmed: form.servicesConfirmed,
      }),
    [form],
  );
  const { states } = content;
  const title = statusTitle(form, content, locale);
  const text = statusText(form, content, cockpitHref !== null);
  const completed = form.status === OnboardingFormStatus.Completed;
  const showSubmittedBy =
    form.status === OnboardingFormStatus.Submitted &&
    form.submittedByName !== null;
  const showLaterWays = completed && (filesHref !== null || chatHref !== null);

  const index = sections.indexOf(step.section);
  const block = form.blocks.find((entry) => entry.id === step.section);
  const next = form.blocks.find((entry) => entry.id === sections[index + 1]);
  const nextLabel = next
    ? formatMessage(content.steps.nextTo, { step: next.title })
    : null;
  const goBack = index > 0 ? () => goTo(sections[index - 1]) : null;

  // A new step starts at its top with the focus on its heading, once the reader navigated.
  useEffect(() => {
    if (!navigated) return;
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    headingRef.current?.focus();
  }, [navigated, step.section]);

  function goTo(section: string) {
    const position = sections.indexOf(section);
    setNavigated(true);
    step.goTo({ section });
    onAnnounceAction(
      formatMessage(content.announcements.step, {
        number: position + 1,
        total: sections.length,
        title: form.blocks[position - 1]?.title ?? content.steps.state,
      }),
    );
  }

  function renderBlockStep(shown: PortalOnboardingBlockDto) {
    return (
      <section
        aria-labelledby={blockHeadingId}
        className={styles.step}
        key={shown.id}
      >
        <PortalStepHeading id={blockHeadingId} ref={headingRef}>
          {shown.title}
        </PortalStepHeading>
        <OnboardingAnswerReadView
          answerFiles={form.answerFiles}
          answers={form.answers}
          blocks={[shown]}
          files={files}
          groupEntries={form.groupEntries}
          hiddenAnswerFiles={form.hiddenAnswerFiles}
          services={form.services}
          servicesConfirmed={form.servicesConfirmed}
          servicesNote={form.servicesNote}
          showBlockTitles={false}
          texts={content.read}
        />
      </section>
    );
  }

  function renderStatusStep() {
    return (
      <section className={styles.step}>
        <div className={styles.status} data-status={form.status}>
          <span aria-hidden="true" className={styles.statusIcon}>
            <FontAwesomeIcon icon={STATUS_ICONS[form.status]} />
          </span>
          <div className={styles.statusText}>
            <PortalStepHeading ref={headingRef}>{title}</PortalStepHeading>
            {showSubmittedBy && (
              <p className={styles.by}>
                {formatMessage(states.submitted.by, {
                  name: form.submittedByName ?? "",
                })}
              </p>
            )}
            {text !== null && <p className={styles.text}>{text}</p>}
          </div>
        </div>
        {showLaterWays && (
          <div className={styles.later}>
            <p className={styles.text}>{states.completed.more}</p>
            <div className={styles.links}>
              {filesHref !== null && (
                <ButtonLink
                  href={filesHref}
                  linkComponent={Link}
                  size={ButtonSize.Control}
                  variant={ButtonVariant.Ghost}
                >
                  <FontAwesomeIcon aria-hidden="true" icon={faFolderOpen} />
                  {states.completed.filesLink}
                </ButtonLink>
              )}
              {chatHref !== null && (
                <ButtonLink
                  href={chatHref}
                  linkComponent={Link}
                  size={ButtonSize.Control}
                  variant={ButtonVariant.Ghost}
                >
                  <FontAwesomeIcon aria-hidden="true" icon={faComments} />
                  {states.completed.chatLink}
                </ButtonLink>
              )}
            </div>
          </div>
        )}
        {call !== null && (
          <OnboardingBookingCard
            booking={call.booking}
            chatHref={chatHref}
            texts={content.call}
          />
        )}
        {cockpitHref !== null && (
          <PortalOwnerNotice
            cockpitHref={cockpitHref}
            hint={content.page.ownerHint}
            id={ownerNoticeId}
            linkLabel={content.page.ownerLink}
          />
        )}
      </section>
    );
  }

  return (
    <PortalStepFrame
      bar={
        <PortalStepBar
          backLabel={content.steps.back}
          nextLabel={nextLabel}
          onBackAction={goBack}
          onNextAction={() => next && goTo(next.id)}
        />
      }
      header={
        <PortalStepHeader
          backHref={backHref}
          backLabel={content.page.back}
          backShortLabel={content.page.backShort}
          title={formatMessage(content.page.heading, {
            project: form.projectTitle,
          })}
        >
          <OnboardingStepTrack
            blocks={form.blocks}
            completeness={completeness}
            content={content}
            current={step.section}
            invalidBlockIds={NONE}
            leadingStep={{
              key: PORTAL_ONBOARDING_STATUS_SECTION,
              label: content.steps.state,
              ratio: form.status === OnboardingFormStatus.Open ? 0 : 1,
              tone: STATUS_TONES[form.status],
              valid: completed,
              statusLabel: title,
            }}
            leftSections={NONE}
            onSelectAction={goTo}
            requestedBlockIds={NONE}
            withReview={false}
          />
        </PortalStepHeader>
      }
      ref={bodyRef}
    >
      {notice}
      {block ? renderBlockStep(block) : renderStatusStep()}
    </PortalStepFrame>
  );
}
