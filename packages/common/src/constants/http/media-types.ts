export const MediaType = {
  Json: "application/json",
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];
