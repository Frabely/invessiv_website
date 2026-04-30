import "server-only";

const ALLOWED_EMAILS_ENV_KEY = "DASHBOARD_ALLOWED_EMAILS";

export function parseAllowedEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => entry.length > 0),
  );
}

let cachedRaw = process.env[ALLOWED_EMAILS_ENV_KEY];
let cachedSet: Set<string> = parseAllowedEmails(cachedRaw);

function getAllowedEmails(): Set<string> {
  const raw = process.env[ALLOWED_EMAILS_ENV_KEY];
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSet = parseAllowedEmails(raw);
  }
  return cachedSet;
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return getAllowedEmails().has(email.trim().toLowerCase());
}
