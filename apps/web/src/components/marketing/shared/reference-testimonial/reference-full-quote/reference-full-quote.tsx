import styles from "./reference-full-quote.module.css";
import { TextCta } from "@/components/shared/text-cta/text-cta";

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
      <TextCta as="summary" variant="quaternary" className={styles.summary}>
        <span className={styles.expandLabel}>{expandLabel}</span>
        <span className={styles.collapseLabel}>{collapseLabel}</span>
      </TextCta>
      <blockquote className={styles.quote}>
        <p className={styles.text}>{quote}</p>
      </blockquote>
    </details>
  );
}
