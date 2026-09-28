import { MAX_SAFE_FILENAME_BYTES } from "../../constants/files/upload-limits";

export function sanitizeFilename(name: string): string {
  const leaf = name.normalize("NFC").split(/[\\/]/).pop() ?? "";
  // Remove controls, bidirectional formatting, reserved path characters and traversal sequences.
  const clean = Array.from(leaf)
    .filter((char) => {
      const point = char.codePointAt(0)!;
      return (
        point >= 32 &&
        !(point >= 127 && point <= 159) &&
        !(point >= 0x202a && point <= 0x202e) &&
        !(point >= 0x2066 && point <= 0x2069) &&
        !'<>:"|?*%'.includes(char)
      );
    })
    .join("")
    .replace(/\.{2,}/g, ".")
    .replace(/^ +|[. ]+$/g, "");
  const lastDot = clean.lastIndexOf(".");
  const rawExtension = lastDot >= 0 ? clean.slice(lastDot).toLowerCase() : "";
  // An implausibly long "extension" is almost certainly a stray dot inside a
  // dot-less name, not a real extension. Fall back to treating the whole
  // cleaned name as the stem instead of throwing, so this function always
  // returns a safe string like every other malformed-name case below.
  const hasExtension = new TextEncoder().encode(rawExtension).length <= 24;
  const extension = hasExtension ? rawExtension : "";
  let stem = (
    hasExtension && lastDot >= 0 ? clean.slice(0, lastDot) : clean
  ).replace(/^[. ]+/, "");
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(stem)) stem = "_" + stem;
  let result = "";
  for (const char of stem) {
    if (
      new TextEncoder().encode(result + char + extension).length >
      MAX_SAFE_FILENAME_BYTES
    )
      break;
    result += char;
  }
  return (result.trim() || "file") + extension;
}

export function createFileStorageKey(
  customerId: string,
  fileId: string,
  filename: string,
): string {
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(customerId) || !uuid.test(fileId))
    throw new Error("Invalid storage scope");
  return `customers/${customerId}/${fileId}/${sanitizeFilename(filename)}`;
}
