/** Escapes ILIKE wildcards so a literal `%`/`_`/`\` in a search term is matched as text. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
