"use client";

import { useState } from "react";

import type {
  QnaIntroCopy,
  QnaItemCopy,
  QnaSecondaryContactCopy,
} from "@/common/contracts/marketing/qna-copy";
import { QnaAvatar } from "../qna-avatar/qna-avatar";
import { QnaContactCta } from "../qna-contact-cta/qna-contact-cta";
import { QnaIntroBubble } from "../qna-intro-bubble/qna-intro-bubble";
import { QnaQuestionBubble } from "../qna-question-bubble/qna-question-bubble";
import styles from "./qna-bubble-board.module.css";

type QnaBubbleBoardProps = {
  avatarAlt: string;
  id: string;
  intro: QnaIntroCopy;
  items: QnaItemCopy[];
  secondaryContact?: QnaSecondaryContactCopy;
  title: string;
};

export function QnaBubbleBoard({
  avatarAlt,
  id,
  intro,
  items,
  secondaryContact,
  title,
}: QnaBubbleBoardProps) {
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

  const entries = items.map((item, index) => ({
    answerId: `${id}-answer-${index + 1}`,
    item,
    questionId: `${id}-question-${index + 1}`,
  }));
  // Enough questions get arranged as a ring around the portrait rather than
  // two plain lists; short sets stay in the two side columns.
  const ringCount = entries.length >= 8 ? 2 : 0;
  const sideCount = entries.length - ringCount * 2;
  const leftCount = Math.ceil(sideCount / 2);
  const columns = (
    [
      { entries: entries.slice(0, ringCount), side: "top" },
      {
        entries: entries.slice(ringCount, ringCount + leftCount),
        side: "left",
      },
      {
        entries: entries.slice(ringCount + leftCount, ringCount + sideCount),
        side: "right",
      },
      { entries: entries.slice(ringCount + sideCount), side: "bottom" },
    ] as const
  ).filter((column) => column.entries.length > 0);

  return (
    <div className={styles.board}>
      <h2 className="sr-only">{title}</h2>

      <div className={styles.portrait}>
        <div className={styles.avatarSlot}>
          <QnaAvatar alt={avatarAlt} />
        </div>

        <div className={styles.introSlot}>
          <QnaIntroBubble primary={intro.primary} secondary={intro.secondary} />
        </div>
      </div>

      {columns.map((column) => (
        <ul
          className={styles.column}
          data-qna-column={column.side}
          key={column.side}
        >
          {column.entries.map((entry) => (
            <li
              className={styles.item}
              data-qna-side={column.side}
              key={entry.questionId}
            >
              <QnaQuestionBubble
                answerId={entry.answerId}
                isOpen={openQuestionId === entry.questionId}
                item={entry.item}
                onToggle={() => {
                  setOpenQuestionId(
                    openQuestionId === entry.questionId
                      ? null
                      : entry.questionId,
                  );
                }}
                questionId={entry.questionId}
              />
            </li>
          ))}
        </ul>
      ))}

      {secondaryContact ? (
        <div className={styles.ctaSlot}>
          <QnaContactCta
            hint={secondaryContact.hint}
            href={secondaryContact.href}
            label={secondaryContact.label}
          />
        </div>
      ) : null}
    </div>
  );
}
