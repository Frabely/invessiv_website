import { DialogMessageTone } from "@/common/constants/ui/dialog-message-tones";
import styles from "./line-item-form-messages.module.css";

export type LineItemFormMessagesProps = {
  conflictMessage?: string;
  conflictDetail?: string;
  errorMessage?: string;
};

export function LineItemFormMessages({
  conflictMessage,
  conflictDetail,
  errorMessage,
}: LineItemFormMessagesProps) {
  return (
    <>
      {conflictMessage ? (
        <section
          className={styles.message}
          data-tone={DialogMessageTone.Conflict}
          role="alert"
        >
          <p className={styles.messageText}>{conflictMessage}</p>
          {conflictDetail ? (
            <p className={styles.messageDetail}>{conflictDetail}</p>
          ) : null}
        </section>
      ) : null}
      {errorMessage ? (
        <p
          className={styles.message}
          data-tone={DialogMessageTone.Error}
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </>
  );
}
