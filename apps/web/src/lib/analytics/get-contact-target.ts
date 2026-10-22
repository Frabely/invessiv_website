import { AnalyticsContactChannel } from "@/common/constants/analytics/analytics-contact-channel";

export function getContactTarget(
  href: string | null,
): AnalyticsContactChannel | undefined {
  if (!href) {
    return undefined;
  }

  const normalizedHref = href.toLowerCase();

  if (normalizedHref.startsWith("mailto:")) {
    return AnalyticsContactChannel.Email;
  }

  if (normalizedHref.startsWith("tel:")) {
    return AnalyticsContactChannel.Phone;
  }

  if (
    normalizedHref.includes("calendly.com") ||
    normalizedHref.includes("/calendly")
  ) {
    return AnalyticsContactChannel.Calendly;
  }

  if (
    normalizedHref.includes("wa.me/") ||
    normalizedHref.includes("whatsapp.com/")
  ) {
    return AnalyticsContactChannel.WhatsApp;
  }

  if (normalizedHref.includes("linkedin.com")) {
    return AnalyticsContactChannel.LinkedIn;
  }

  if (normalizedHref.includes("instagram.com")) {
    return AnalyticsContactChannel.Instagram;
  }

  return undefined;
}
