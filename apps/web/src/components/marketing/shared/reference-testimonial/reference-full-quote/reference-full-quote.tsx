import styles from "./reference-full-quote.module.css";
import { QuaternaryCta } from "@invessiv/ui";

type ReferenceFullQuoteProps = {
  collapseLabel: string;
  expandLabel: string;
  quote: string;
};

export function ReferenceFullQuote({
  collapseLabel,
  expandLabel,
  quote,
}: ReferenceFullQuoteProps) {
  return (
    <details className={styles.details}>
      <QuaternaryCta as="summary" className={styles.summary}>
        <span className={styles.expandLabel}>{expandLabel}</span>
        <span className={styles.collapseLabel}>{collapseLabel}</span>
      </QuaternaryCta>
      <blockquote className={styles.quote}>
        <p className={styles.text}>{quote}</p>
      </blockquote>
    </details>
  );
}
