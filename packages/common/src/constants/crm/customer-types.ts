export const CustomerType = {
  Company: "company",
  Individual: "individual",
} as const;

export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const CUSTOMER_TYPE_VALUES = [
  CustomerType.Company,
  CustomerType.Individual,
] as const;
