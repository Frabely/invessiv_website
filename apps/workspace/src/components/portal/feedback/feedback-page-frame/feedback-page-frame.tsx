"use client";

import { type ReactNode, type RefObject } from "react";
import type { FeedbackQuotaDto } from "@invessiv/common/contracts/crm/feedback-quota.dto";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { FeedbackRoundStepEntry } from "@/common/contracts/portal/feedback-round-step-entry";
import { PortalStepFrame } from "@/components/portal/shared/portal-step-frame/portal-step-frame";
import { PortalStepHeader } from "@/components/portal/shared/portal-step-header/portal-step-header";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { FeedbackRoundTrack } from "../feedback-round-track/feedback-round-track";
import styles from "./feedback-page-frame.module.css";

export type FeedbackPageFrameProps = {
  backHref: string;
  /** The bar under the round, outside the scroll area. */
  bar: ReactNode;
  bodyRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
  content: PortalFeedbackDictionary;
  /** Number of the round shown; null while none was handed over. */
  current: number | null;
  entries: readonly FeedbackRoundStepEntry[];
  onSelectAction: (roundNumber: number) => void;
  projectTitle: string;
  quota: FeedbackQuotaDto;
};

/**
 * The feedback page around one round, laid out like the onboarding form: the way back, the title
 * and how many rounds are left on top, the rounds as steps below, the round scrolling in between.
 */
export function FeedbackPageFrame({
  backHref,
  bar,
  bodyRef,
  children,
  content,
  current,
  entries,
  onSelectAction,
  projectTitle,
  quota,
}: FeedbackPageFrameProps) {
  const summary =
    quota.approvedRoundNumber !== null
      ? content.summary.approved
      : formatCountMessage(quota.remaining, {
          none: content.summary.remainingNone,
          one: content.summary.remainingOne,
          many: content.summary.remaining,
        });

  return (
    <PortalStepFrame
      bar={bar}
      header={
        <PortalStepHeader
          overviewHref={backHref}
          breadcrumbLabel={content.page.breadcrumb}
          overviewLabel={content.page.backShort}
          summary={<p className={styles.summary}>{summary}</p>}
          title={formatMessage(content.page.heading, { project: projectTitle })}
        >
          {entries.length > 0 ? (
            <FeedbackRoundTrack
              content={content}
              current={current}
              entries={entries}
              onSelectAction={onSelectAction}
            />
          ) : null}
        </PortalStepHeader>
      }
      ref={bodyRef}
    >
      {children}
    </PortalStepFrame>
  );
}
