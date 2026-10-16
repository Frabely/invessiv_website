"use client";

import { useId, useMemo } from "react";
import { faHourglassHalf } from "@fortawesome/free-solid-svg-icons";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FeedbackNoticeTone } from "@/common/constants/portal/feedback-notice-tones";
import { PortalFeedbackPageState } from "@/common/constants/portal/portal-feedback-page-states";
import {
  initialFeedbackRoundNumber,
  listFeedbackRoundSteps,
} from "@/common/patterns/portal/feedback-round-steps";
import { PortalOwnerNotice } from "@/components/portal/portal-owner-notice/portal-owner-notice";
import { PortalStepBar } from "@/components/portal/shared/portal-step-bar/portal-step-bar";
import type { Locale } from "@/config/i18n";
import { useFeedbackRoundNavigation } from "@/hooks/portal/use-feedback-round-navigation";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { FeedbackFinalApproval } from "../feedback-final-approval/feedback-final-approval";
import { FeedbackPageFrame } from "../feedback-page-frame/feedback-page-frame";
import { FeedbackQuotaNotice } from "../feedback-quota-notice/feedback-quota-notice";
import { FeedbackRoundNotice } from "../feedback-round-notice/feedback-round-notice";
import { FeedbackRoundStep } from "../feedback-round-step/feedback-round-step";
import { FeedbackStateNotice } from "../feedback-state-notice/feedback-state-notice";
import styles from "./feedback-reader.module.css";

export type FeedbackReaderProps = {
  backHref: string;
  /** CRM link for the owner view; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalFeedbackDictionary;
  customerId: string;
  /** Request dialog for a further round on this project; null when none can be requested. */
  extraRoundRequestHref: string | null;
  feedback: PortalProjectFeedbackDto;
  filesContent: PortalFilesDictionary;
  locale: Locale;
  messagesHref: string | null;
  onAnnounceAction: (message: string) => void;
  state: PortalFeedbackPageState;
};

/**
 * The feedback page whenever nothing is to be filled in: the latest round with where it stands
 * and what comes next, earlier rounds through the track. After a completed round the approval is
 * offered here, quietly while rounds are left, as the main action of the bar after the last one.
 */
export function FeedbackReader({
  backHref,
  cockpitHref,
  content,
  customerId,
  extraRoundRequestHref,
  feedback,
  filesContent,
  locale,
  messagesHref,
  onAnnounceAction,
  state,
}: FeedbackReaderProps) {
  const ownerNoticeId = useId();
  const entries = useMemo(() => listFeedbackRoundSteps(feedback), [feedback]);
  const latestNumber = initialFeedbackRoundNumber(feedback);
  const navigation = useFeedbackRoundNavigation(entries, latestNumber);
  const shown =
    entries.find((entry) => entry.roundNumber === navigation.current)?.round ??
    null;
  const latest = shown !== null && shown.roundNumber === latestNumber;
  // The approval refers to the newest round once it is implemented and nothing runs.
  const approvable =
    latest &&
    feedback.canSubmit &&
    feedback.activeRound === null &&
    shown.status === FeedbackRoundStatus.Completed;
  const lastRoundApproval = approvable && feedback.quota.remaining === 0;

  const readerHint = cockpitHref ? (
    <PortalOwnerNotice
      cockpitHref={cockpitHref}
      hint={content.page.ownerHint}
      id={ownerNoticeId}
      linkLabel={content.page.ownerLink}
    />
  ) : (
    <p className={styles.hint}>{content.page.readOnlyHint}</p>
  );
  const showReaderHint =
    latest &&
    (state === PortalFeedbackPageState.OpenReadOnly ||
      (state === PortalFeedbackPageState.Exhausted && !feedback.canSubmit));

  const approval =
    approvable && shown ? (
      <FeedbackFinalApproval
        content={content}
        customerId={customerId}
        key={`${shown.id}:${shown.version}`}
        onAnnounceAction={onAnnounceAction}
        remainingRounds={feedback.quota.remaining}
        round={shown}
      />
    ) : null;

  return (
    <FeedbackPageFrame
      backHref={backHref}
      bar={
        <PortalStepBar
          action={lastRoundApproval ? approval : undefined}
          backLabel={content.steps.back}
          nextLabel={
            navigation.next === null
              ? null
              : formatMessage(content.steps.nextTo, { number: navigation.next })
          }
          onBackAction={
            navigation.previous === null
              ? null
              : () => navigation.goTo(navigation.previous ?? 1)
          }
          onNextAction={() => navigation.goTo(navigation.next ?? 1)}
        />
      }
      bodyRef={navigation.bodyRef}
      content={content}
      current={navigation.current}
      entries={entries}
      onSelectAction={navigation.goTo}
      projectTitle={feedback.projectTitle}
      quota={feedback.quota}
    >
      {shown ? (
        <FeedbackRoundStep
          content={content}
          customerId={customerId}
          filesContent={filesContent}
          headingRef={navigation.headingRef}
          key={shown.id}
          locale={locale}
          notice={
            <FeedbackRoundNotice
              contact={feedback.contact}
              content={content}
              latest={latest}
              locale={locale}
              messagesHref={messagesHref}
              round={shown}
              state={state}
            >
              {showReaderHint ? readerHint : null}
            </FeedbackRoundNotice>
          }
          round={shown}
        >
          {lastRoundApproval ? null : approval}
          {latest && state === PortalFeedbackPageState.Exhausted ? (
            <FeedbackQuotaNotice
              contact={feedback.contact}
              content={content}
              messagesHref={messagesHref}
              requestHref={extraRoundRequestHref}
            />
          ) : null}
        </FeedbackRoundStep>
      ) : (
        <div className={styles.empty}>
          {state === PortalFeedbackPageState.Exhausted ? (
            <FeedbackQuotaNotice
              contact={feedback.contact}
              content={content}
              messagesHref={messagesHref}
              requestHref={extraRoundRequestHref}
            />
          ) : (
            <FeedbackStateNotice
              description={
                state === PortalFeedbackPageState.Between
                  ? content.states.between.description
                  : content.states.none.description
              }
              headingLevel={2}
              icon={faHourglassHalf}
              title={
                state === PortalFeedbackPageState.Between
                  ? content.states.between.title
                  : content.states.none.title
              }
              tone={FeedbackNoticeTone.Neutral}
            />
          )}
        </div>
      )}
    </FeedbackPageFrame>
  );
}
