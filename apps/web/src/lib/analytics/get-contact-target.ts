export function getContactTarget(href: string | null): string | undefined {
  if (!href) {
    return undefined;
  }

  const normalizedHref = href.toLowerCase();

  if (normalizedHref.startsWith("mailto:")) {
    return "email";
  }

  if (normalizedHref.startsWith("tel:")) {
    return "phone";
  }

  if (
    normalizedHref.includes("calendly.com") ||
    normalizedHref.includes("/calendly")
  ) {
    return "calendly";
  }

  if (
    normalizedHref.includes("wa.me/") ||
    normalizedHref.includes("whatsapp.com/")
  ) {
    return "whatsapp";
  }

  return undefined;
}
