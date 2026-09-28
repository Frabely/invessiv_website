import { isHttpUrl } from "@invessiv/common/patterns/url/parse-http-url";

export function isOpenableUrl(value: string): boolean {
  return isHttpUrl(value.trim());
}

export function openExternalUrl(value: string) {
  if (!isOpenableUrl(value)) {
    return;
  }

  globalThis.open?.(value.trim(), "_blank", "noopener,noreferrer");
}
