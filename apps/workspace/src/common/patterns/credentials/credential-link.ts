import { isHttpUrl } from "@invessiv/common/patterns/url/parse-http-url";

/**
 * The URL field is free text. It becomes a link only when it parses as http(s); everything else
 * (`javascript:`, bare host names, notes) stays plain text.
 */
export function toCredentialLink(url: string | null): string | null {
  return url && isHttpUrl(url) ? url : null;
}
