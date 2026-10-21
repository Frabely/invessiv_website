export const DatabaseTarget = {
  Development: "development",
  Preview: "preview",
  Production: "production",
} as const;

export type DatabaseTarget =
  (typeof DatabaseTarget)[keyof typeof DatabaseTarget];

export const DATABASE_TARGET_VALUES = [
  DatabaseTarget.Development,
  DatabaseTarget.Preview,
  DatabaseTarget.Production,
] as const;
