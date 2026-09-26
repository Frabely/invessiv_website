export const MessageType = { Text: "text", System: "system" } as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];
export const MESSAGE_TYPE_VALUES = [
  MessageType.Text,
  MessageType.System,
] as const;

export const MessageSenderSide = {
  Internal: "internal",
  Customer: "customer",
  System: "system",
} as const;
export type MessageSenderSide =
  (typeof MessageSenderSide)[keyof typeof MessageSenderSide];
export const MESSAGE_SENDER_SIDE_VALUES = [
  MessageSenderSide.Internal,
  MessageSenderSide.Customer,
  MessageSenderSide.System,
] as const;
