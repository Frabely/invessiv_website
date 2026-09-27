import { MessageTextSegmentKind } from "@invessiv/common/constants/ui/message-text-segment-kinds";

/** Plain-text part of a message body; links are recognised, nothing else is interpreted. */
export type MessageTextSegment =
  | { kind: typeof MessageTextSegmentKind.Text; value: string }
  | { kind: typeof MessageTextSegmentKind.Link; value: string };
