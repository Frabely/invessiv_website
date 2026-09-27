import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonControl } from "@invessiv/ui";
import { PendingMessageStatus } from "@invessiv/common/constants/ui/pending-message-statuses";
import { MessageTextSegmentKind } from "@invessiv/common/constants/ui/message-text-segment-kinds";
import { ThreadMessageItemKind } from "@invessiv/common/constants/ui/thread-message-item-kinds";
import type { MessageThreadLabels } from "@invessiv/common/contracts/ui/message-thread-labels";
import type { ThreadMessageItem } from "@invessiv/common/contracts/ui/thread-message-item";
import { splitMessageLinks } from "@invessiv/common/patterns/ui/split-message-links";
import styles from "./message-bubble.module.css";

type MessageBubbleProps = {
  item: ThreadMessageItem;
  isOwn: boolean;
  labels: Pick<
    MessageThreadLabels,
    "failed" | "redact" | "redacted" | "retry" | "sending"
  >;
  onRedactAction?: (messageId: string) => void;
  onRetryAction: (clientId: string) => void;
};

function MessageText({ body }: { body: string }) {
  return splitMessageLinks(body).map((segment, index) =>
    segment.kind === MessageTextSegmentKind.Link ? (
      <a
        href={segment.value}
        key={index}
        rel="noopener noreferrer"
        target="_blank"
      >
        {segment.value}
      </a>
    ) : (
      <span key={index}>{segment.value}</span>
    ),
  );
}

export function MessageBubble({
  item,
  isOwn,
  labels,
  onRedactAction,
  onRetryAction,
}: MessageBubbleProps) {
  if (item.kind === ThreadMessageItemKind.Pending) {
    const failed = item.pending.status === PendingMessageStatus.Failed;
    return (
      <li className={styles.row} data-own="true">
        <p className={styles.bubble} data-state={item.pending.status}>
          <MessageText body={item.pending.body} />
        </p>
        <p className={styles.status} data-state={item.pending.status}>
          <span role={failed ? "alert" : undefined}>
            {failed ? labels.failed : labels.sending}
          </span>
          {failed ? (
            <ButtonControl
              className={styles.action}
              onClick={() => onRetryAction(item.pending.clientId)}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faRotateRight} />
              {labels.retry}
            </ButtonControl>
          ) : null}
        </p>
      </li>
    );
  }

  const { message } = item;
  // A redacted row never shows text, even if a stale body is still present.
  const body = message.redactedAt === null ? message.body : null;
  return (
    <li className={styles.row} data-own={isOwn}>
      <p
        className={styles.bubble}
        data-state={body === null ? "redacted" : "sent"}
      >
        {body === null ? labels.redacted : <MessageText body={body} />}
      </p>
      {onRedactAction && body !== null ? (
        <p className={styles.status}>
          <ButtonControl
            className={styles.action}
            data-tone="danger"
            onClick={() => onRedactAction(message.id)}
            type="button"
            variant="ghost"
          >
            {labels.redact}
          </ButtonControl>
        </p>
      ) : null}
    </li>
  );
}
