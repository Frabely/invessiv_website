export function isOpenableUrl(value: string): boolean {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  try {
    const url = new URL(trimmedValue);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function openExternalUrl(value: string) {
  if (!isOpenableUrl(value)) {
    return;
  }

  globalThis.open?.(value.trim(), "_blank", "noopener,noreferrer");
}
