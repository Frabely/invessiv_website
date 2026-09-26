export const OwnableEntity = {
  Customer: "customer",
  Task: "task",
  Conversation: "conversation",
} as const;

export type OwnableEntity = (typeof OwnableEntity)[keyof typeof OwnableEntity];

export const OWNABLE_ENTITY_VALUES = [
  OwnableEntity.Customer,
  OwnableEntity.Task,
  OwnableEntity.Conversation,
] as const;
