"use client";

import { ClipboardErrorCode } from "@/common/constants/clipboard/clipboard-error-codes";

export async function copyTextToClipboard(value: string): Promise<void> {
  if (!navigator.clipboard) {
    throw new Error(ClipboardErrorCode.Unavailable);
  }

  await navigator.clipboard.writeText(value);
}
