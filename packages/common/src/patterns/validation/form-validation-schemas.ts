import { z } from "zod";

const trimmedText = z.string().trim();

export const formValidationSchemas = {
  email: trimmedText.pipe(z.email()),
  httpUrl: trimmedText.pipe(z.url({ protocol: /^https?$/ })),
  trimmedText,
  url: trimmedText.pipe(z.url()),
  uuid: trimmedText.pipe(z.uuid()),
} as const;
