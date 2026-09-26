/** Up to two initials for a member avatar; falls back to "?" when the name has no letters to use. */
export function getMemberInitials(displayName: string): string {
  const letters = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}
