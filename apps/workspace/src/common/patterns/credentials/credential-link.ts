const LINK_PROTOCOLS: readonly string[] = ["https:", "http:"];

/**
 * The URL field is free text. It becomes a link only when it parses as http(s); everything else
 * (`javascript:`, bare host names, notes) stays plain text.
 */
export function toCredentialLink(url: string | null): string | null {
  if (!url) return null;
  try {
    return LINK_PROTOCOLS.includes(new URL(url).protocol) ? url : null;
  } catch {
    return null;
  }
}
