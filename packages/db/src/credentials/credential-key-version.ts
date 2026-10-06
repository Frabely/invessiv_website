const KEY_VERSION_PATTERN = /^[1-9]\d*$/;

/**
 * Canonical decimal only: no sign, no leading zero, no fraction. The keyring and the stored value
 * must agree on one spelling, otherwise `01` and `1` would name the same key twice.
 */
export function parseCredentialKeyVersion(text: string): number | null {
  if (!KEY_VERSION_PATTERN.test(text)) return null;
  const version = Number(text);
  return Number.isSafeInteger(version) ? version : null;
}
