export const OwnableEntity = {
  Customer: "customer",
} as const;

export type OwnableEntity = (typeof OwnableEntity)[keyof typeof OwnableEntity];

export const OWNABLE_ENTITY_VALUES = [OwnableEntity.Customer] as const;
