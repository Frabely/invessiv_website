import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRightArrowLeft,
  faComment,
  faFileImport,
  faInbox,
  faLayerGroup,
  faPenToSquare,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { CONTACT_LEAD_STATUS_VALUES } from "@/common/constants/contact/contact-lead-statuses";
import type { ContactRequestKind } from "@/common/constants/contact/contact-request-kind";
import { LeadDetailEntryKind } from "@/common/constants/leads/activity/lead-detail-entry-kinds";
import { LeadActivityType } from "@/common/constants/leads/activity/lead-activity-types";
import type { LeadActorType } from "@/common/constants/leads/activity/lead-actor-types";
import type { LeadActivityDto } from "@/common/contracts/leads/lead-activity.dto";
import type { LeadSubmissionDto } from "@/common/contracts/leads/lead-submission.dto";
import type { Locale } from "@/config/i18n";
import type {
  LeadsDetailDictionary,
  LeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadStatusBadge } from "@/components/workspace/leads/shared";
import styles from "./lead-detail-activities.module.css";

type LeadDetailActivitiesProps = {
  activities: LeadActivityDto[];
  submissions: LeadSubmissionDto[];
  locale: Locale;
  content: LeadsDetailDictionary;
  sharedContent: LeadsSharedDictionary;
};

type TimelineEntry =
  | {
      kind: typeof LeadDetailEntryKind.Activity;
      timestamp: string;
      sortKey: string;
      data: LeadActivityDto;
    }
  | {
      kind: typeof LeadDetailEntryKind.Submission;
      timestamp: string;
      sortKey: string;
      data: LeadSubmissionDto;
    };

type StatusChangeMetadata = {
  previous_status: ContactLeadStatus;
  next_status: ContactLeadStatus;
};

const ACTIVITY_TYPE_ICON: Record<LeadActivityType, IconDefinition> = {
  [LeadActivityType.Note]: faPenToSquare,
  [LeadActivityType.StatusChange]: faArrowRightArrowLeft,
  [LeadActivityType.InboundSubmission]: faInbox,
  [LeadActivityType.Import]: faFileImport,
  [LeadActivityType.BulkEdit]: faLayerGroup,
  [LeadActivityType.MessageDrafted]: faComment,
};

function getStatusChangeMetadata(
  metadata: unknown,
): StatusChangeMetadata | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const record = metadata as Record<string, unknown>;
  const previous = record.previous_status;
  const next = record.next_status;

  const validPrevious =
    typeof previous === "string" &&
    CONTACT_LEAD_STATUS_VALUES.includes(previous as ContactLeadStatus);
  const validNext =
    typeof next === "string" &&
    CONTACT_LEAD_STATUS_VALUES.includes(next as ContactLeadStatus);

  if (!validPrevious || !validNext) {
    return null;
  }

  return {
    previous_status: previous as ContactLeadStatus,
    next_status: next as ContactLeadStatus,
  };
}

function buildTimeline(
  activities: LeadActivityDto[],
  submissions: LeadSubmissionDto[],
): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...activities.map<TimelineEntry>((activity) => ({
      kind: LeadDetailEntryKind.Activity,
      timestamp: activity.occurredAt,
      sortKey: `${activity.occurredAt}:${activity.id}`,
      data: activity,
    })),
    ...submissions.map<TimelineEntry>((submission) => ({
      kind: LeadDetailEntryKind.Submission,
      timestamp: submission.createdAt,
      sortKey: `${submission.createdAt}:${submission.id}`,
      data: submission,
    })),
  ];

  return entries.sort((left, right) => {
    if (left.sortKey === right.sortKey) {
      return 0;
    }

    return left.sortKey < right.sortKey ? 1 : -1;
  });
}

function formatActivityTimestamp(locale: Locale, timestamp: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function getActorLabel(
  activity: LeadActivityDto,
  content: LeadsDetailDictionary,
): string {
  return (
    activity.actorLabel ??
    content.activity.actor[activity.actorType as LeadActorType]
  );
}

function getActivityTitle(
  activity: LeadActivityDto,
  content: LeadsDetailDictionary,
): string {
  return activity.title ?? content.activity.types[activity.type];
}

function getSubmissionChannelLabel(
  submission: LeadSubmissionDto,
  content: LeadsDetailDictionary,
): string {
  return (
    content.activity.channels[submission.channel as ContactRequestKind] ??
    submission.channel
  );
}

function renderStatusChange(
  activity: LeadActivityDto,
  content: LeadsDetailDictionary,
  sharedContent: LeadsSharedDictionary,
) {
  const metadata = getStatusChangeMetadata(activity.metadata);

  if (!metadata) {
    return (
      <p className={styles.bodyText}>
        {activity.body ?? content.activity.statusChange.fallbackBody}
      </p>
    );
  }

  return (
    <div className={styles.statusChange}>
      <LeadStatusBadge
        label={sharedContent.status[metadata.previous_status]}
        status={metadata.previous_status}
      />
      <span className={styles.statusSeparator} aria-hidden="true">
        {content.activity.statusChange.separator}
      </span>
      <LeadStatusBadge
        label={sharedContent.status[metadata.next_status]}
        status={metadata.next_status}
      />
    </div>
  );
}

function renderBulkEdit(
  activity: LeadActivityDto,
  content: LeadsDetailDictionary,
) {
  return (
    <p className={styles.bodyText}>
      {activity.body ?? content.activity.bulkEdit.fallbackBody}
    </p>
  );
}

function renderActivityEntry(
  activity: LeadActivityDto,
  content: LeadsDetailDictionary,
  sharedContent: LeadsSharedDictionary,
  locale: Locale,
) {
  const icon = ACTIVITY_TYPE_ICON[activity.type];
  const typeLabel = content.activity.types[activity.type];
  const title = getActivityTitle(activity, content);
  const actorLabel = getActorLabel(activity, content);
  const timestamp = formatActivityTimestamp(locale, activity.occurredAt);

  return (
    <article className={styles.entry}>
      <span className={styles.icon} aria-hidden="true">
        <FontAwesomeIcon icon={icon} />
      </span>

      <div className={styles.body}>
        <header className={styles.header}>
          <span className={styles.typeLabel}>{typeLabel}</span>
          <time className={styles.timestamp} dateTime={activity.occurredAt}>
            {timestamp}
          </time>
        </header>

        <h4 className={styles.title}>{title}</h4>
        {activity.type === LeadActivityType.StatusChange ? (
          renderStatusChange(activity, content, sharedContent)
        ) : activity.type === LeadActivityType.BulkEdit ? (
          renderBulkEdit(activity, content)
        ) : activity.body ? (
          <p className={styles.bodyText}>{activity.body}</p>
        ) : null}
        <p className={styles.actor}>{actorLabel}</p>
      </div>
    </article>
  );
}

function renderSubmissionEntry(
  submission: LeadSubmissionDto,
  content: LeadsDetailDictionary,
  locale: Locale,
) {
  const channelLabel = getSubmissionChannelLabel(submission, content);
  const timestamp = formatActivityTimestamp(locale, submission.createdAt);

  return (
    <article className={styles.entry}>
      <span className={styles.icon} aria-hidden="true">
        <FontAwesomeIcon icon={faInbox} />
      </span>

      <div className={styles.body}>
        <header className={styles.header}>
          <span className={styles.typeLabel}>
            {content.activity.types.inbound_submission}
          </span>
          <time className={styles.timestamp} dateTime={submission.createdAt}>
            {timestamp}
          </time>
        </header>

        <h4 className={styles.title}>
          {content.activity.submission.fallbackTitle}
        </h4>
        <p className={styles.bodyText}>{channelLabel}</p>
        <p className={styles.actor}>{content.activity.actor.system}</p>
      </div>
    </article>
  );
}

export function LeadDetailActivities({
  activities,
  submissions,
  locale,
  content,
  sharedContent,
}: LeadDetailActivitiesProps) {
  const timeline = buildTimeline(activities, submissions);

  if (timeline.length === 0) {
    return <p className={styles.empty}>{content.activity.empty}</p>;
  }

  return (
    <ol className={styles.timeline}>
      {timeline.map((entry, index) => (
        <li
          className={styles.item}
          data-index={index}
          data-kind={entry.kind}
          key={`${entry.kind}:${entry.data.id}`}
        >
          {entry.kind === LeadDetailEntryKind.Activity
            ? renderActivityEntry(entry.data, content, sharedContent, locale)
            : renderSubmissionEntry(entry.data, content, locale)}
        </li>
      ))}
    </ol>
  );
}
