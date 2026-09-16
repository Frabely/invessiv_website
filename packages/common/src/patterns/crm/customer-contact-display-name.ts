type ContactNameParts = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
};

/** "Anna" + "Berger" → "Anna Berger"; without any name the email stands in. */
export function resolveCustomerContactDisplayName({
  firstName,
  lastName,
  email,
}: ContactNameParts): string {
  const name = [firstName, lastName]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");

  return name || email?.trim() || "";
}
