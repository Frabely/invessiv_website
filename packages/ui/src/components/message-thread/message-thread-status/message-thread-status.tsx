import type { MessageThreadStatusLabels } from "@invessiv/common/contracts/ui/message-thread-status-labels";
import { ButtonControl } from "../../button/button";
import styles from "./message-thread-status.module.css";

export type MessageThreadStatusProps = {
  failed: boolean;
  labels: MessageThreadStatusLabels;
  onReloadAction: () => void;
};

/** Stands in for the thread until the first page arrives; a failure offers a manual reload. */
export function MessageThreadStatus({
  failed,
  labels,
  onReloadAction,
}: MessageThreadStatusProps) {
  return (
    <div className={styles.state} role={failed ? "alert" : "status"}>
      {failed ? (
        <>
          <p>{labels.loadError}</p>
          <ButtonControl
            className={styles.action}
            onClick={onReloadAction}
            type="button"
            variant="ghost"
          >
            {labels.reload}
          </ButtonControl>
        </>
      ) : (
        <p>{labels.loading}</p>
      )}
    </div>
  );
}
