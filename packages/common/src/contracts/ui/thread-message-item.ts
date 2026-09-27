import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { ThreadMessageItemKind } from "@invessiv/common/constants/ui/thread-message-item-kinds";
import type { PendingThreadMessage } from "./pending-thread-message";

/** One rendered row of the thread: a confirmed message or an optimistic one. */
export type ThreadMessageItem =
  | { kind: typeof ThreadMessageItemKind.Message; message: MessageDto }
  | {
      kind: typeof ThreadMessageItemKind.Pending;
      pending: PendingThreadMessage;
    };
