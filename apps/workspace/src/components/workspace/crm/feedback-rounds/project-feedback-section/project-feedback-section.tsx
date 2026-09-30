"use client";

import { useState } from "react";
import { faCircleInfo, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FeedbackHandOverBlocker } from "@invessiv/common/constants/crm/feedback-hand-over-blockers";
import type { FeedbackRoundSummaryDto } from "@invessiv/common/contracts/crm/feedback-round-summary.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { PrimaryCtaButton } from "@invessiv/ui";
import { StatusRowTone } from "@/common/constants/ui/status-row-tones";
import type { FeedbackRoundsViewModel } from "@/common/contracts/crm/feedback-rounds-view-model";
import { FeedbackRoundStatusBadge } from "@/components/shared/feedback/feedback-round-status-badge/feedback-round-status-badge";
import { CollapsibleSection } from "@/components/workspace/crm/shared/collapsible-section/collapsible-section";
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import { StatusRow } from "@/components/workspace/shared/status-row/status-row";
import type { Locale } from "@/config/i18n";
import { useCockpitSelection } from "@/hooks/workspace/crm/use-cockpit-selection";
import type {
  CrmFeedbackRoundsDictionary,
  CrmFilesDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { formatCalendarDay } from "@/lib/i18n/format-calendar-day";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import { FeedbackHandoverDialog } from "../feedback-handover-dialog/feedback-handover-dialog";
import { FeedbackRoundDetail } from "../feedback-round-detail/feedback-round-detail";
import styles from "./project-feedback-section.module.css";

type ProjectFeedbackSectionProps = {
  content: CrmFeedbackRoundsDictionary;
  customerId: string;
  filesContent: CrmFilesDictionary;
  locale: Locale;
  viewModel: FeedbackRoundsViewModel;
};

/** The latest step of a round is what the list row tells; earlier dates live in the detail. */
function milestoneLabel(
  round: FeedbackRoundSummaryDto,
  texts: CrmFeedbackRoundsDictionary["row"],
  locale: Locale,
): string {
  if (round.approvedAt)
    return formatMessage(texts.approved, {
      date: formatMomentDay(round.approvedAt, locale),
    });
  if (round.submittedAt)
    return formatMessage(texts.submitted, {
      date: formatMomentDay(round.submittedAt, locale),
    });
  return formatMessage(texts.handedOver, {
    date: formatMomentDay(round.handedOverAt, locale),
  });
}

/**
 * Feedback rounds of one project: quota, every round, and either the handover or the reason why
 * none is possible. Which rounds may be handed over is decided on the server; the section only
 * shows the result.
 */
export function ProjectFeedbackSection({
  content,
  customerId,
  filesContent,
  locale,
  viewModel,
}: ProjectFeedbackSectionProps) {
  const { overview, detail, projectId } = viewModel;
  const selection = useCockpitSelection(customerId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const nextRoundNumber = overview.nextRoundNumber ?? overview.quota.used + 1;
  const blockerNumbers = {
    number:
      overview.handOverBlocker === FeedbackHandOverBlocker.RoundAlreadyActive
        ? (overview.quota.activeRoundNumber ?? nextRoundNumber)
        : nextRoundNumber,
    included: overview.quota.included,
  };

  function handedOver(roundId: string, alreadyRunning: boolean) {
    setDialogOpen(false);
    setAnnouncement(
      formatMessage(
        alreadyRunning
          ? content.announcements.alreadyActive
          : content.announcements.handedOver,
        { number: alreadyRunning ? blockerNumbers.number : nextRoundNumber },
      ),
    );
    selection.select({ projectId, feedbackRoundId: roundId });
  }

  const blocker =
    viewModel.canWrite && overview.handOverBlocker ? (
      <p className={styles.blocker}>
        <FontAwesomeIcon aria-hidden="true" icon={faCircleInfo} />
        {formatMessage(
          content.blockers[overview.handOverBlocker],
          blockerNumbers,
        )}
      </p>
    ) : null;

  return (
    <CollapsibleSection
      action={
        overview.canHandOver ? (
          <PrimaryCtaButton
            className={styles.action}
            onClick={() => setDialogOpen(true)}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPaperPlane} />
            {formatMessage(content.section.handOver, {
              number: nextRoundNumber,
            })}
          </PrimaryCtaButton>
        ) : null
      }
      after={
        <>
          <p aria-live="polite" className="sr-only" role="status">
            {announcement}
          </p>
          {dialogOpen ? (
            <FeedbackHandoverDialog
              content={content}
              defaultPreviewUrl={viewModel.defaultPreviewUrl}
              feedbackAreas={overview.feedbackAreas}
              included={overview.quota.included}
              onCloseAction={() => setDialogOpen(false)}
              onHandedOverAction={handedOver}
              projectId={projectId}
              roundNumber={nextRoundNumber}
            />
          ) : null}
        </>
      }
      count={formatMessage(
        overview.quota.used > 0
          ? content.section.count
          : content.section.countNone,
        { used: overview.quota.used, included: overview.quota.included },
      )}
      defaultExpanded
      labelCollapse={content.section.collapseLabel}
      labelExpand={content.section.expandLabel}
      title={content.section.title}
    >
      {detail ? (
        <FeedbackRoundDetail
          backHref={selection.hrefFor({ projectId })}
          canReadFiles={viewModel.canReadFiles}
          content={content}
          customerId={customerId}
          filesContent={filesContent}
          locale={locale}
          round={detail}
        />
      ) : overview.rounds.length === 0 ? (
        <>
          <SectionEmptyState
            description={
              viewModel.canWrite
                ? content.empty.description
                : content.empty.readOnlyDescription
            }
            title={content.empty.title}
          />
          {blocker}
        </>
      ) : (
        <>
          {blocker}
          <ul aria-label={content.section.listLabel} className={styles.list}>
            {overview.rounds.map((round) => (
              <StatusRow
                detailsClassName={styles.details}
                key={round.id}
                onOpenAction={() =>
                  selection.select({ projectId, feedbackRoundId: round.id })
                }
                openLabel={formatMessage(content.row.openNamed, {
                  number: round.roundNumber,
                })}
                status={
                  <FeedbackRoundStatusBadge
                    label={content.status[round.status]}
                    status={round.status}
                  />
                }
                tone={
                  round.unread ? StatusRowTone.Attention : StatusRowTone.Default
                }
              >
                <span className={styles.title}>
                  {formatMessage(content.row.title, {
                    number: round.roundNumber,
                  })}
                  {round.unread ? (
                    <span className={styles.unread}>{content.row.unread}</span>
                  ) : null}
                </span>
                <span>{milestoneLabel(round, content.row, locale)}</span>
                <span>
                  {round.dueOn
                    ? formatMessage(content.row.due, {
                        date: formatCalendarDay(round.dueOn, locale),
                      })
                    : null}
                </span>
                <span className={styles.count}>
                  {formatCountMessage(round.itemCount, {
                    none: content.row.itemsNone,
                    one: content.row.itemsOne,
                    many: content.row.items,
                  })}
                </span>
              </StatusRow>
            ))}
          </ul>
        </>
      )}
    </CollapsibleSection>
  );
}
