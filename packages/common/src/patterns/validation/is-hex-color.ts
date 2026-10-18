const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Whether a value is a six-digit hex colour such as `#1A2B3C`. It is the only form a native colour
 * picker reads and writes, so a value that passes can be handed to one unchanged.
 */
export function isHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value);
}
