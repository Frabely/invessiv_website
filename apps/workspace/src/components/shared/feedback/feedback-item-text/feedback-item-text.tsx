"use client";

import { useId, useState } from "react";
import { ButtonControl, LinkedText } from "@invessiv/ui";
import styles from "./feedback-item-text.module.css";

export type FeedbackItemTextProps = {
  text: string;
  labels: { showMore: string; showLess: string };
};

// Longer texts start folded; the threshold keeps a typical item fully visible.
const FOLD_AFTER_CHARACTERS = 480;
const FOLD_AFTER_LINES = 6;

/** A customer's item text as plain text: paragraphs kept, links clickable, long texts folded. */
export function FeedbackItemText({ text, labels }: FeedbackItemTextProps) {
  const [expanded, setExpanded] = useState(false);
  const textId = useId();
  const foldable =
    text.length > FOLD_AFTER_CHARACTERS ||
    text.split("\n").length > FOLD_AFTER_LINES;

  return (
    <div className={styles.wrapper}>
      <p
        className={styles.text}
        data-folded={foldable && !expanded ? "true" : "false"}
        id={textId}
      >
        <LinkedText text={text} />
      </p>
      {foldable ? (
        <ButtonControl
          aria-controls={textId}
          aria-expanded={expanded}
          className={styles.toggle}
          onClick={() => setExpanded((current) => !current)}
          type="button"
          variant="ghost"
        >
          {expanded ? labels.showLess : labels.showMore}
        </ButtonControl>
      ) : null}
    </div>
  );
}
