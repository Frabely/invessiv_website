/** Parse an absolute HTTP(S) URL. Callers decide whether to trim input first. */
export function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function isHttpUrl(value: string): boolean {
  return parseHttpUrl(value) !== null;
}
