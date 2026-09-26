import { describe, expect, it } from "vitest";
import {
  MessageSenderSide,
  MessageType,
} from "@invessiv/common/constants/crm/message-types";
import type { MessageDto } from "@invessiv/common/contracts/crm/message.dto";
import { PendingMessageStatus } from "@/common/constants/ui/pending-message-statuses";
import { ThreadMessageItemKind } from "@/common/constants/ui/thread-message-item-kinds";
import type { ThreadMessageItem } from "@/common/contracts/ui/thread-message-item";
import {
  describeThreadDay,
  groupThreadMessages,
  sortThreadMessageItems,
  threadDayKey,
} from "./group-thread-messages";

function localIso(day: number, hour: number, minute: number): string {
  return new Date(2026, 8, day, hour, minute).toISOString();
}

function message(
  id: string,
  createdAt: string,
  overrides: Partial<MessageDto> = {},
): ThreadMessageItem {
  return {
    kind: ThreadMessageItemKind.Message,
    message: {
      id,
      conversationId: "conversation",
      type: MessageType.Text,
      body: id,
      metadata: null,
      senderSide: MessageSenderSide.Customer,
      senderDisplayName: "Anna",
      isOwn: false,
      createdAt,
      redactedAt: null,
      ...overrides,
    },
  };
}

describe("groupThreadMessages", () => {
  it("sorts a failed send between older and newer confirmed messages", () => {
    const items = sortThreadMessageItems([
      message("older", localIso(20, 10, 0)),
      message("newer", localIso(20, 10, 2)),
      {
        kind: ThreadMessageItemKind.Pending,
        pending: {
          clientId: "pending",
          body: "Unsent",
          createdAt: localIso(20, 10, 1),
          status: PendingMessageStatus.Failed,
        },
      },
    ]);

    expect(
      items.map((item) =>
        item.kind === ThreadMessageItemKind.Message
          ? item.message.id
          : item.pending.clientId,
      ),
    ).toEqual(["older", "pending", "newer"]);
  });

  it("groups one speaker within five minutes and splits after a pause", () => {
    const days = groupThreadMessages(
      [
        message("a", localIso(20, 10, 0)),
        message("b", localIso(20, 10, 4)),
        message("c", localIso(20, 10, 10)),
      ],
      "Me",
    );

    expect(days).toHaveLength(1);
    expect(days[0].groups.map((group) => group.items.length)).toEqual([2, 1]);
    expect(days[0].groups[0].key).toBe("a");
  });

  it("starts a new group for another speaker and keeps system events alone", () => {
    const days = groupThreadMessages(
      [
        message("a", localIso(20, 10, 0)),
        message("b", localIso(20, 10, 1), {
          senderSide: MessageSenderSide.Internal,
          senderDisplayName: "Me",
          isOwn: true,
        }),
        message("s", localIso(20, 10, 2), {
          type: MessageType.System,
          senderSide: MessageSenderSide.System,
          senderDisplayName: "System",
        }),
        message("c", localIso(20, 10, 3)),
      ],
      "Me",
    );

    const groups = days[0].groups;
    expect(groups.map((group) => group.key)).toEqual(["a", "b", "s", "c"]);
    expect(groups[1].isOwn).toBe(true);
    expect(groups[2].isSystem).toBe(true);
  });

  it("adds pending rows to the viewer's own group", () => {
    const days = groupThreadMessages(
      [
        message("a", localIso(20, 10, 0), { isOwn: true }),
        {
          kind: ThreadMessageItemKind.Pending,
          pending: {
            clientId: "p1",
            body: "Pending",
            createdAt: localIso(20, 10, 1),
            status: PendingMessageStatus.Sending,
          },
        },
      ],
      "Me",
    );

    expect(days[0].groups).toHaveLength(1);
    expect(days[0].groups[0].items).toHaveLength(2);
  });

  it("separates calendar days", () => {
    const days = groupThreadMessages(
      [message("a", localIso(19, 23, 58)), message("b", localIso(20, 0, 1))],
      "Me",
    );

    expect(days.map((day) => day.dayKey)).toEqual(["2026-09-19", "2026-09-20"]);
  });
});

describe("describeThreadDay", () => {
  const labels = { today: "Today", yesterday: "Yesterday" };
  const now = new Date(2026, 8, 26, 12, 0);

  it("names today and yesterday and formats older days by locale", () => {
    expect(describeThreadDay(localIso(26, 8, 0), now, "en", labels)).toBe(
      "Today",
    );
    expect(describeThreadDay(localIso(25, 23, 0), now, "en", labels)).toBe(
      "Yesterday",
    );
    expect(describeThreadDay(localIso(20, 9, 0), now, "de", labels)).toBe(
      "20. September 2026",
    );
    expect(describeThreadDay(localIso(20, 9, 0), now, "en", labels)).toBe(
      "September 20, 2026",
    );
  });

  it("uses the local calendar day", () => {
    expect(threadDayKey(localIso(3, 0, 5))).toBe("2026-09-03");
  });
});
