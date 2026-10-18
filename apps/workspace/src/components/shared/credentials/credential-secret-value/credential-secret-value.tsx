import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { CredentialSecretFieldLabels } from "@/common/contracts/credentials/credential-secret-field-labels";
import styles from "./credential-secret-value.module.css";

export type CredentialSecretValueProps = {
  /** Live-region text from `useCredentialSecret`; never the value itself. */
  announcement: string;
  autoHideSeconds: number;
  /** Tighter frame for a table cell. */
  compact?: boolean;
  labels: CredentialSecretFieldLabels;
  message: string | null;
  /** Keeps line breaks of a revealed note. */
  multiline?: boolean;
  secondsLeft: number;
  /** False when another value next to it already shows the same countdown. */
  showTimer?: boolean;
  /** Set only while visible. */
  value: string | null;
  visible: boolean;
};

// A fixed length: the mask must not hint at how long the value is.
const MASK = "••••••••••••";

/**
 * The display half of a secret: mask or plaintext, the draining countdown and the reason a request
 * failed. The actions live with the caller, so they can sit next to it or in another cell.
 */
export function CredentialSecretValue({
  announcement,
  autoHideSeconds,
  compact = false,
  labels,
  message,
  multiline = false,
  secondsLeft,
  showTimer = true,
  value,
  visible,
}: CredentialSecretValueProps) {
  return (
    <div className={styles.secret} data-compact={compact ? "true" : "false"}>
      <div
        className={styles.value}
        data-compact={compact ? "true" : "false"}
        data-multiline={multiline ? "true" : "false"}
        data-visible={visible ? "true" : "false"}
      >
        {visible ? (
          <span className={styles.plain}>{value}</span>
        ) : (
          <>
            <span aria-hidden="true" className={styles.mask}>
              {MASK}
            </span>
            <span className="sr-only">{labels.masked}</span>
          </>
        )}
      </div>
      {visible && showTimer ? (
        <div aria-hidden="true" className={styles.timer}>
          <progress
            className={styles.progress}
            max={autoHideSeconds}
            value={secondsLeft}
          />
          <span className={styles.countdown}>
            {formatMessage(labels.countdown, { seconds: secondsLeft })}
          </span>
        </div>
      ) : null}
      {message ? (
        <p className={styles.error} role="alert">
          {message}
        </p>
      ) : null}
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );
}
