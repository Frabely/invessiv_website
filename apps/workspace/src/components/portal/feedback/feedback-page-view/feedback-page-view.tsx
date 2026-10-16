"use client";

import { useState } from "react";
import type { PortalProjectFeedbackDto } from "@invessiv/common/contracts/portal/portal-project-feedback.dto";
import { PortalFeedbackPageState } from "@/common/constants/portal/portal-feedback-page-states";
import { portalFeedbackPageState } from "@/common/patterns/portal/portal-feedback-page-state";
import type { Locale } from "@/config/i18n";
import type {
  PortalFeedbackDictionary,
  PortalFilesDictionary,
} from "@/i18n/dictionaries/portal";
import { FeedbackEditor } from "../feedback-editor/feedback-editor";
import { FeedbackReader } from "../feedback-reader/feedback-reader";
import styles from "./feedback-page-view.module.css";

export type FeedbackPageViewProps = {
  /** Uploading on a point needs `portal.files.write` on top of attaching. */
  canUpload: boolean;
  /** CRM link for the owner view; null for customer contacts. */
  cockpitHref: string | null;
  content: PortalFeedbackDictionary;
  customerId: string;
  dashboardHref: string;
  feedback: PortalProjectFeedbackDto;
  filesContent: PortalFilesDictionary;
  locale: Locale;
  /** Chat page for calls and the exhausted quota; null without chat access. */
  messagesHref: string | null;
  /** Request dialog for a further round on this project; null when none can be requested. */
  extraRoundRequestHref?: string | null;
};

/**
 * The feedback page of one project. Mount it with `key={customerId}`. Whoever may fill in the
 * open round gets the editor, keyed by round and status, so a submission elsewhere replaces it
 * instead of editing a locked round; everyone else and every other state gets the reader.
 */
export function FeedbackPageView({
  canUpload,
  cockpitHref,
  content,
  customerId,
  dashboardHref,
  feedback,
  filesContent,
  locale,
  messagesHref,
  extraRoundRequestHref = null,
}: FeedbackPageViewProps) {
  const [announcement, setAnnouncement] = useState("");
  const state = portalFeedbackPageState(feedback);
  const round = feedback.activeRound;

  return (
    <div className={styles.page} data-portal-fixed-head>
      {state === PortalFeedbackPageState.Sheet && round ? (
        <FeedbackEditor
          backHref={dashboardHref}
          canUpload={canUpload}
          content={content}
          customerId={customerId}
          feedback={feedback}
          filesContent={filesContent}
          key={`${round.id}:${round.status}`}
          locale={locale}
          messagesHref={messagesHref}
          onAnnounceAction={setAnnouncement}
          round={round}
        />
      ) : (
        <FeedbackReader
          backHref={dashboardHref}
          cockpitHref={cockpitHref}
          content={content}
          customerId={customerId}
          extraRoundRequestHref={extraRoundRequestHref}
          feedback={feedback}
          filesContent={filesContent}
          locale={locale}
          messagesHref={messagesHref}
          onAnnounceAction={setAnnouncement}
          state={state}
        />
      )}
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
