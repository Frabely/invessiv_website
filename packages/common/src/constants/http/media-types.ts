export const MediaType = {
  Json: "application/json",
  Zip: "application/zip",
} as const;

export type MediaType = (typeof MediaType)[keyof typeof MediaType];
