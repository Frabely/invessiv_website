import styles from "./reference-full-quote.module.css";

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
      <summary className={styles.summary}>
        <span className={styles.expandLabel}>{expandLabel}</span>
        <span className={styles.collapseLabel}>{collapseLabel}</span>
      </summary>
      <blockquote className={styles.quote}>
        <p className={styles.text}>{quote}</p>
      </blockquote>
    </details>
  );
}
