"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./reference-quote.module.css";

type ReferenceQuoteProps = {
  collapseLabel: string;
  expandLabel: string;
  quote: string;
};

export function ReferenceQuote({
  collapseLabel,
  expandLabel,
  quote,
}: ReferenceQuoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const textElement = textRef.current;

    if (!textElement || isExpanded) {
      return;
    }

    const measure = () => {
      setIsClamped(textElement.scrollHeight - textElement.clientHeight > 4);
    };

    if (typeof ResizeObserver === "undefined") {
      measure();
      return;
    }

    const observer = new ResizeObserver(measure);
    observer.observe(textElement);

    return () => {
      observer.disconnect();
    };
  }, [isExpanded, quote]);

  return (
    <blockquote className={styles.quote}>
      <p className={styles.text} data-expanded={isExpanded} ref={textRef}>
        {quote}
      </p>
      {isClamped ? (
        <button
          aria-expanded={isExpanded}
          className={styles.toggle}
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          {isExpanded ? collapseLabel : expandLabel}
        </button>
      ) : null}
    </blockquote>
  );
}
