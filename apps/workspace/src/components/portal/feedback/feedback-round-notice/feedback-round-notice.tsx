import type { ReactNode } from "react";
import {
  type IconDefinition,
  faCircleCheck,
  faComments,
  faEye,
  faFlagCheckered,
  faPaperPlane,
  faPenToSquare,
  faRotateLeft,
  faScrewdriverWrench,
} from "@fortawesome/free-solid-svg-icons";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { PortalContactDto } from "@invessiv/common/contracts/portal/portal-contact.dto";
import type { PortalFeedbackRoundDto } from "@invessiv/common/contracts/portal/portal-feedback-round.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  FeedbackNoticeTone,
  type FeedbackNoticeTone as FeedbackNoticeToneValue,
} from "@/common/constants/portal/feedback-notice-tones";
import { PortalFeedbackPageState } from "@/common/constants/portal/portal-feedback-page-states";
import type { Locale } from "@/config/i18n";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { FeedbackContactWays } from "../feedback-contact-ways/feedback-contact-ways";
import { FeedbackStateNotice } from "../feedback-state-notice/feedback-state-notice";

type NoticeCopy = {
  description: string | null;
  icon: IconDefinition;
  title: string;
  tone: FeedbackNoticeToneValue;
};

export type FeedbackRoundNoticeProps = {
  /** The responsible member, for arranging a requested call. */
  contact: PortalContactDto | null;
  /** Below the text, e.g. the owner notice of a round the viewer may only read. */
  children?: ReactNode;
  content: PortalFeedbackDictionary;
  locale: Locale;
  /** Chat page for arranging a call; null without chat access. */
  messagesHref: string | null;
  /** The round shown. */
  round: PortalFeedbackRoundDto;
  /** What the page shows as a whole, from `portalFeedbackPageState`. */
  state: PortalFeedbackPageState;
  /** The round shown is the running one, or the newest when none runs. */
  latest: boolean;
};

function copyFor({
  content,
  locale,
  round,
  state,
  latest,
}: FeedbackRoundNoticeProps): NoticeCopy {
  const { states } = content;
  if (round.status === FeedbackRoundStatus.Approved)
    return {
      title: round.approvedAt
        ? formatMessage(states.approved.title, {
            date: formatMomentDay(round.approvedAt, locale),
          })
        : content.status.approved,
      description: states.approved.description,
      icon: faFlagCheckered,
      tone: FeedbackNoticeTone.Success,
    };
  if (!latest)
    return {
      ...(round.items.length > 0 ? states.past : states.pastEmpty),
      title: formatMessage(
        (round.items.length > 0 ? states.past : states.pastEmpty).title,
        { number: round.roundNumber },
      ),
      icon: faCircleCheck,
      tone: FeedbackNoticeTone.Neutral,
    };
  switch (round.status) {
    case FeedbackRoundStatus.Open:
      if (state === PortalFeedbackPageState.OpenReadOnly)
        return {
          title: states.readOnly.title,
          description: null,
          icon: faEye,
          tone: FeedbackNoticeTone.Info,
        };
      return round.customerNotice
        ? {
            ...states.returned,
            icon: faRotateLeft,
            tone: FeedbackNoticeTone.Warm,
          }
        : {
            ...states.open,
            icon: faPenToSquare,
            tone: FeedbackNoticeTone.Info,
          };
    case FeedbackRoundStatus.Submitted:
      return {
        ...states.submitted,
        icon: faPaperPlane,
        tone: FeedbackNoticeTone.Info,
      };
    case FeedbackRoundStatus.InDiscussion:
      return {
        title: states.discussion.title,
        description: states.discussion.description,
        icon: faComments,
        tone: FeedbackNoticeTone.Warm,
      };
    case FeedbackRoundStatus.InProgress:
      return {
        ...states.working,
        icon: faScrewdriverWrench,
        tone: FeedbackNoticeTone.Info,
      };
    default:
      return state === PortalFeedbackPageState.Exhausted
        ? {
            ...states.approvalDue,
            icon: faFlagCheckered,
            tone: FeedbackNoticeTone.Success,
          }
        : {
            title: formatMessage(states.completed.title, {
              number: round.roundNumber,
            }),
            description: states.completed.description,
            icon: faCircleCheck,
            tone: FeedbackNoticeTone.Success,
          };
  }
}

/**
 * Where the round shown stands and whose turn it is: the running round says what to do now,
 * the newest finished one what comes next, an earlier one that it is closed. A handed-back round
 * and a requested call carry the team's message and, for the call, the ways to arrange it.
 */
export function FeedbackRoundNotice(props: FeedbackRoundNoticeProps) {
  const { children, contact, content, messagesHref, round, latest } = props;
  const copy = copyFor(props);
  const withMessage =
    latest &&
    (round.status === FeedbackRoundStatus.InDiscussion ||
      round.status === FeedbackRoundStatus.Open);
  const discussion =
    latest && round.status === FeedbackRoundStatus.InDiscussion;

  return (
    <FeedbackStateNotice
      description={copy.description}
      icon={copy.icon}
      notice={withMessage ? round.customerNotice : null}
      noticeLabel={content.states.noticeLabel}
      title={copy.title}
      tone={copy.tone}
    >
      {discussion ? (
        <FeedbackContactWays
          chatHref={messagesHref}
          chatLabel={content.states.discussion.chatLink}
          contact={contact}
          content={content}
        />
      ) : null}
      {children}
    </FeedbackStateNotice>
  );
}
