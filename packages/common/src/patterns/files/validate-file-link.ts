export function validateFileLink(value: string): boolean {
  if (
    value.length > 2048 ||
    value !== value.trim() ||
    !value.startsWith("https://") ||
    /[\s\\]/u.test(value)
  )
    return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
