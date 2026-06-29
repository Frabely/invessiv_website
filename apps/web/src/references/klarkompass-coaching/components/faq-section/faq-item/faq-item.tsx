"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { KlarkompassFaqItem } from "@/references/klarkompass-coaching/i18n/content";
import styles from "./faq-item.module.css";

type FaqItemProps = {
  contentId: string;
  isOpen: boolean;
  item: KlarkompassFaqItem;
  onToggle: () => void;
  triggerId: string;
};

export function FaqItem({
  contentId,
  isOpen,
  item,
  onToggle,
  triggerId,
}: FaqItemProps) {
  const reduce = useReducedMotion();

  return (
    <div className={styles.item} data-open={isOpen}>
      <h3 className={styles.heading}>
        <button
          aria-controls={contentId}
          aria-expanded={isOpen}
          className={styles.trigger}
          id={triggerId}
          onClick={onToggle}
          type="button"
        >
          <span className={styles.question}>{item.question}</span>
          <span aria-hidden="true" className={styles.icon} data-open={isOpen}>
            <svg className={styles.chevron} fill="none" viewBox="0 0 20 20">
              <path
                d="M5 8 L10 13 L15 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            animate={reduce ? {} : { height: "auto", opacity: 1 }}
            aria-labelledby={triggerId}
            className={styles.panel}
            exit={reduce ? {} : { height: 0, opacity: 0 }}
            id={contentId}
            initial={reduce ? false : { height: 0, opacity: 0 }}
            key="panel"
            role="region"
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={styles.answer}>{item.answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
