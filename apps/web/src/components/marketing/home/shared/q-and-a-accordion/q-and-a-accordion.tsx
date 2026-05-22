"use client";

import { useState } from "react";

import type { QnaItemCopy } from "@/i18n/dictionaries/marketing/home";
import styles from "./q-and-a-accordion.module.css";

type QnaItem = QnaItemCopy;

type QAndAAccordionProps = {
  ariaLabel: string;
  id: string;
  items: QnaItem[];
};

export function QAndAAccordion({ ariaLabel, id, items }: QAndAAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <ul aria-label={ariaLabel} className={styles.list}>
      {items.map((item, index) => {
        const questionId = `${id}-question-${index + 1}`;
        const answerId = `${id}-answer-${index + 1}`;
        const isOpen = openIndex === index;

        return (
          <li
            className={styles.item}
            data-open={isOpen ? "true" : "false"}
            key={questionId}
          >
            <button
              aria-controls={answerId}
              aria-expanded={isOpen}
              className={styles.disclosure}
              onClick={() => {
                setOpenIndex(isOpen ? null : index);
              }}
              type="button"
            >
              <span className={styles.summary} id={questionId}>
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
            </button>
            <div
              aria-hidden={isOpen ? undefined : true}
              aria-labelledby={questionId}
              className={styles.answerWrap}
              id={answerId}
            >
              <div className={styles.answerContent}>
                <p className={styles.answer}>{item.answer}</p>
                {item.link && isOpen ? (
                  <a className={styles.answerLink} href={item.link.href}>
                    {item.link.label}
                  </a>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
