"use client";

import { useId, useState } from "react";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonControl, LinkedText } from "@invessiv/ui";
import type { OnboardingCallAgenda as Agenda } from "@/common/contracts/crm/onboarding/onboarding-call-agenda";
import {
  formatOnboardingCallAgenda,
  isOnboardingCallAgendaEmpty,
} from "@/common/patterns/crm/onboarding/onboarding-call-agenda";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./onboarding-call-agenda.module.css";

export type OnboardingCallAgendaProps = {
  agenda: Agenda;
  content: CrmOnboardingDictionary["review"]["agenda"];
  /** Names the project in the copied text. */
  projectTitle: string;
};

/**
 * What the onboarding call has to settle: the questions the team kept for it and the two hints on
 * the booked services. Copying yields plain text for a calendar entry or a note.
 */
export function OnboardingCallAgenda({
  agenda,
  content,
  projectTitle,
}: OnboardingCallAgendaProps) {
  const headingId = useId();
  const [feedback, setFeedback] = useState<{
    text: string;
    failed: boolean;
  } | null>(null);
  const empty = isOnboardingCallAgendaEmpty(agenda);

  async function copy() {
    try {
      await navigator.clipboard.writeText(
        formatOnboardingCallAgenda(agenda, projectTitle, content),
      );
      setFeedback({ text: content.copied, failed: false });
    } catch {
      setFeedback({ text: content.copyFailed, failed: true });
    }
  }

  return (
    <section aria-labelledby={headingId} className={styles.agenda}>
      <div className={styles.head}>
        <h2 className={styles.title} id={headingId}>
          {content.title}
        </h2>
        {empty ? null : (
          <ButtonControl
            className={styles.copy}
            onClick={() => void copy()}
            type="button"
            variant="ghost"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faCopy} />
            {content.copy}
          </ButtonControl>
        )}
      </div>
      {empty ? (
        <p className={styles.empty}>{content.empty}</p>
      ) : (
        <ul className={styles.list}>
          {agenda.points.map((point) => (
            <li key={point.blockId}>
              <span className={styles.topic}>{point.title}</span>
              <span className={styles.text}>
                <LinkedText text={point.note} />
              </span>
            </li>
          ))}
          {agenda.servicesChanged ? (
            <li>
              <span className={styles.topic}>{content.servicesChanged}</span>
            </li>
          ) : null}
          {agenda.servicesNote !== null ? (
            <li>
              <span className={styles.topic}>{content.servicesNote}</span>
              <span className={styles.text}>
                <LinkedText text={agenda.servicesNote} />
              </span>
            </li>
          ) : null}
        </ul>
      )}
      <p
        aria-live="polite"
        className={styles.feedback}
        data-failed={feedback?.failed ? "true" : undefined}
        role="status"
      >
        {feedback?.text}
      </p>
    </section>
  );
}
