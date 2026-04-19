"use client";

import { useState } from "react";

import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import styles from "./q-and-a-accordion.module.css";

type QnaItem = NonNullable<LandingSectionCopy["qnaItems"]>[number];

type QAndAAccordionProps = {
  ariaLabel: string;
  id: string;
  items: QnaItem[];
};

export function QAndAAccordion({ ariaLabel, id, items }: QAndAAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    items.length > 0 ? 0 : null,
  );

  return (
    <ul aria-label={ariaLabel} className={styles.list}>
      {items.map((item, index) => {
        const questionId = `${id}-question-${index + 1}`;
        const answerId = `${id}-answer-${index + 1}`;
        const isOpen = openIndex === index;

        return (
          <li className={styles.item} key={questionId}>
            <button
              aria-controls={answerId}
              aria-expanded={isOpen}
              className={styles.disclosure}
              data-open={isOpen ? "true" : "false"}
              onClick={() => {
                setOpenIndex(isOpen ? null : index);
              }}
              type="button"
            >
              <span className={styles.summary} id={questionId}>
                <span className={styles.index} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.question}>{item.question}</span>
                <span className={styles.arrow} aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path
                      d="M3.5 8h9"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                    <path
                      className={styles.arrowVertical}
                      d="M8 3.5v9"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </span>
              </span>
              <span
                aria-hidden={isOpen ? undefined : true}
                aria-labelledby={questionId}
                className={styles.answerWrap}
                id={answerId}
              >
                <span className={styles.answer}>{item.answer}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
