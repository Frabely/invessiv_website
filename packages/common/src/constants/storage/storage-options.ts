export const StorageProvider = { VercelBlob: "vercel-blob" } as const;
export type StorageProvider =
  (typeof StorageProvider)[keyof typeof StorageProvider];
export const StorageDisposition = {
  Inline: "inline",
  Attachment: "attachment",
} as const;
export type StorageDisposition =
  (typeof StorageDisposition)[keyof typeof StorageDisposition];
