export const OwnableEntity = {
  Customer: "customer",
  Task: "task",
} as const;

export type OwnableEntity = (typeof OwnableEntity)[keyof typeof OwnableEntity];

export const OWNABLE_ENTITY_VALUES = [
  OwnableEntity.Customer,
  OwnableEntity.Task,
] as const;
