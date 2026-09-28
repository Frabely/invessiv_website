import { UNSAFE_FILE_LINK_CHARACTERS } from "../../constants/files/file-link-pattern";
import { parseHttpUrl } from "../url/parse-http-url";

export function validateFileLink(value: string): boolean {
  if (
    value.length > 2048 ||
    value !== value.trim() ||
    !value.startsWith("https://") ||
    UNSAFE_FILE_LINK_CHARACTERS.test(value)
  )
    return false;
  const url = parseHttpUrl(value);
  return (
    url?.protocol === "https:" &&
    !!url.hostname &&
    !url.username &&
    !url.password
  );
}
