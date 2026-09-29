import type { MessageThreadLabels } from "@invessiv/common/contracts/ui/message-thread-labels";
import type { ThreadMessageGroup } from "@invessiv/common/contracts/ui/thread-message-group";
import { threadMessageItemKey } from "@invessiv/common/patterns/ui/group-thread-messages";
import { MessageBubble } from "../message-bubble/message-bubble";
import styles from "./message-group.module.css";

type MessageGroupProps = {
  canRedact: boolean;
  group: ThreadMessageGroup;
  labels: MessageThreadLabels;
  onDownloadAttachmentAction?: (fileId: string) => void;
  onRedactAction?: (messageId: string) => void;
  onRetryAction: (clientId: string) => void;
  timeLabel: string;
};

/** One speaker turn: side, name and time are named once, so the side never depends on colour. */
export function MessageGroup({
  canRedact,
  group,
  labels,
  onDownloadAttachmentAction,
  onRedactAction,
  onRetryAction,
  timeLabel,
}: MessageGroupProps) {
  return (
    <section className={styles.group} data-own={group.isOwn}>
      <h3 className={styles.head}>
        <span className={styles.sender}>
          {group.isOwn ? labels.own : group.senderDisplayName}
        </span>
        <time className={styles.time} dateTime={group.startedAt}>
          {timeLabel}
        </time>
      </h3>
      <ul className={styles.list}>
        {group.items.map((item) => (
          <MessageBubble
            isOwn={group.isOwn}
            item={item}
            key={threadMessageItemKey(item)}
            labels={labels}
            onDownloadAttachmentAction={onDownloadAttachmentAction}
            onRedactAction={canRedact ? onRedactAction : undefined}
            onRetryAction={onRetryAction}
          />
        ))}
      </ul>
    </section>
  );
}
