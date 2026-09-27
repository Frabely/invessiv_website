export const MessageTextSegmentKind = {
  Text: "text",
  Link: "link",
} as const;

export type MessageTextSegmentKind =
  (typeof MessageTextSegmentKind)[keyof typeof MessageTextSegmentKind];
