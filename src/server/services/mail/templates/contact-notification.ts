import type { Locale } from "@/config/i18n";
import type { ContactSubmitInput } from "@/features/contact/contact.schema";

type ContactNotificationMessage = {
  html: string;
  subject: string;
  text: string;
};

const copyByLocale: Record<
  Locale,
  {
    detailsLabel: string;
    heading: string;
    labels: Record<string, string>;
    subjectPrefix: string;
    values: Record<string, Record<string, string>>;
  }
> = {
  de: {
    detailsLabel: "Projektbeschreibung / Anforderungen",
    heading: "Neue Projektanfrage",
    labels: {
      budgetKey: "Budgetrahmen",
      company: "Unternehmen",
      email: "E-Mail",
      fullName: "Name",
      goalKey: "Hauptziel",
      offerKey: "Angebot",
      pageKeys: "Benötigte Seiten",
      phone: "Telefon",
      preferredStartKey: "Gewünschter Start",
      role: "Rolle",
      website: "Website",
      workflowKey: "Anzahl Kern-Workflows",
    },
    subjectPrefix: "Projektanfrage",
    values: {
      budgetKey: {
        above_10000: "10.000 €+",
        below_1000: "Unter 1.000 €",
        between_1000_2500: "1.000 € - 2.500 €",
        between_2500_5000: "2.500 € - 5.000 €",
        between_5000_10000: "5.000 € - 10.000 €",
        open: "Noch offen",
      },
      goalKey: {
        generate_inquiries: "Anfragen erhalten",
        grow_newsletter: "Newsletter-Anmeldungen",
        increase_bookings: "Terminbuchungen erhöhen",
        sell_product: "Produkt verkaufen",
      },
      offerKey: {
        ai: "KI-Templates & Agents",
        landing: "Landingpages",
        maintenance: "Wartung & Support",
        process: "Prozess-Tools",
        upgrade: "Website-Upgrade",
        web: "Webseiten",
      },
      pageKeys: {
        about: "Über uns",
        blog: "Blog",
        careers: "Karriere",
        contact: "Kontakt",
        home: "Start",
        landing_page: "Landingpage",
        other: "Sonstiges",
        services: "Leistungen",
      },
      preferredStartKey: {
        immediately: "Sofort",
        later_flexible: "Später / flexibel",
        within_one_month: "Innerhalb von 1 Monat",
        within_two_weeks: "Innerhalb von 2 Wochen",
      },
      workflowKey: {
        one_workflow: "1 Workflow",
        three_plus_workflows: "3+ Workflows",
        two_workflows: "2 Workflows",
      },
    },
  },
  en: {
    detailsLabel: "Project description / requirements",
    heading: "New project request",
    labels: {
      budgetKey: "Budget range",
      company: "Company",
      email: "Email",
      fullName: "Name",
      goalKey: "Primary goal",
      offerKey: "Offer",
      pageKeys: "Required pages",
      phone: "Phone",
      preferredStartKey: "Preferred start",
      role: "Role",
      website: "Website",
      workflowKey: "Core workflows",
    },
    subjectPrefix: "Project request",
    values: {
      budgetKey: {
        above_10000: "€10,000+",
        below_1000: "Below €1,000",
        between_1000_2500: "€1,000 - €2,500",
        between_2500_5000: "€2,500 - €5,000",
        between_5000_10000: "€5,000 - €10,000",
        open: "Not defined yet",
      },
      goalKey: {
        generate_inquiries: "Generate inquiries",
        grow_newsletter: "Grow newsletter sign-ups",
        increase_bookings: "Increase booked calls",
        sell_product: "Sell a product",
      },
      offerKey: {
        ai: "AI Templates & Agents",
        landing: "Landing pages",
        maintenance: "Maintenance & Support",
        process: "Process tools",
        upgrade: "Website upgrade",
        web: "Websites",
      },
      pageKeys: {
        about: "About",
        blog: "Blog",
        careers: "Careers",
        contact: "Contact",
        home: "Home",
        landing_page: "Landing page",
        other: "Other",
        services: "Services",
      },
      preferredStartKey: {
        immediately: "Immediately",
        later_flexible: "Later / flexible",
        within_one_month: "Within 1 month",
        within_two_weeks: "Within 2 weeks",
      },
      workflowKey: {
        one_workflow: "1 workflow",
        three_plus_workflows: "3+ workflows",
        two_workflows: "2 workflows",
      },
    },
  },
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function mapValue(
  field: string,
  value: string | string[] | undefined,
  localeCopy: (typeof copyByLocale)[Locale],
) {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => localeCopy.values[field]?.[entry] ?? entry)
      .join(", ");
  }

  return localeCopy.values[field]?.[value] ?? value;
}

export function createContactNotificationMessage(
  payload: ContactSubmitInput,
): ContactNotificationMessage {
  const copy = copyByLocale[payload.locale];
  const localizedOffer =
    mapValue("offerKey", payload.offerKey, copy) ?? payload.offerKey;
  const subject = `[${copy.subjectPrefix}] ${sanitizeLine(localizedOffer)} | ${sanitizeLine(payload.fullName)}`;
  const rows = [
    [copy.labels.offerKey, mapValue("offerKey", payload.offerKey, copy)],
    [copy.labels.fullName, payload.fullName],
    [copy.labels.email, payload.email],
    [copy.labels.company, payload.company],
    [copy.labels.role, payload.role],
    [copy.labels.phone, payload.phone],
    [copy.labels.website, payload.website],
    [copy.labels.goalKey, mapValue("goalKey", payload.goalKey, copy)],
    [copy.labels.pageKeys, mapValue("pageKeys", payload.pageKeys, copy)],
    [copy.labels.budgetKey, mapValue("budgetKey", payload.budgetKey, copy)],
    [
      copy.labels.preferredStartKey,
      mapValue("preferredStartKey", payload.preferredStartKey, copy),
    ],
    [
      copy.labels.workflowKey,
      mapValue("workflowKey", payload.workflowKey, copy),
    ],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const textRows = rows.map(([label, value]) => `"${label}": ${value}`);
  const htmlRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;font-weight:600;vertical-align:top;">"${escapeHtml(label)}":</td><td style="padding:6px 0;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  return {
    html: [
      `<h1 style="font-size:20px;margin:0 0 16px;">${escapeHtml(copy.heading)}</h1>`,
      `<table style="border-collapse:collapse;margin-bottom:20px;">${htmlRows}</table>`,
      `<h2 style="font-size:16px;margin:0 0 8px;">${escapeHtml(copy.detailsLabel)}</h2>`,
      `<p style="margin:0;white-space:pre-wrap;">${escapeHtml(payload.projectDetails)}</p>`,
    ].join(""),
    subject,
    text: [
      copy.heading,
      "",
      ...textRows,
      "",
      `${copy.detailsLabel}:`,
      payload.projectDetails,
    ].join("\n"),
  };
}
