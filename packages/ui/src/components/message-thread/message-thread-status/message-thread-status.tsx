import { ButtonControl } from "../../button/button";
import styles from "./message-thread-status.module.css";

export type MessageThreadStatusProps = {
  errorLabel: string;
  failed: boolean;
  loadingLabel: string;
  onReloadAction: () => void;
  reloadLabel: string;
};

/** Stands in for the thread until the first page arrives; a failure offers a manual reload. */
export function MessageThreadStatus({
  errorLabel,
  failed,
  loadingLabel,
  onReloadAction,
  reloadLabel,
}: MessageThreadStatusProps) {
  return (
    <div className={styles.state} role={failed ? "alert" : "status"}>
      {failed ? (
        <>
          <p>{errorLabel}</p>
          <ButtonControl
            className={styles.action}
            onClick={onReloadAction}
            type="button"
            variant="ghost"
          >
            {reloadLabel}
          </ButtonControl>
        </>
      ) : (
        <p>{loadingLabel}</p>
      )}
    </div>
  );
}
