export const ContactSearchParam = {
  Email: "email",
  Name: "name",
} as const;

export type ContactSearchParam =
  (typeof ContactSearchParam)[keyof typeof ContactSearchParam];
