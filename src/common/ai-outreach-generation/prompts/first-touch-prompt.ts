import { OUTREACH_MAX_IMPROVEMENTS } from "../outreach-defaults";
import { CHANNEL_PROFILES, type ChannelProfile } from "../channel-profiles";
import { COPYWRITING_GUIDELINES } from "../copywriting-guidelines";
import { OUTREACH_PROFILE } from "../outreach-profile";
import type { OutreachLeadFacts } from "../outreach-lead-facts";
import type { OutreachPromptMessages } from "../outreach-prompt-messages";
import type { OutreachPromptOptions } from "../outreach-prompt-options";
import type { PromptBuildContext } from "../prompt-build-context";

const SENDER_NAME = "Moritz";

function buildChannelInstructions(profile: ChannelProfile): string {
  const greetingLine =
    profile.greeting === null
      ? `Greeting: KEINS – Nachricht endet auf den Satz, ohne Schluss-Signatur, ohne Namen.`
      : `Greeting: „${profile.greeting}, ${SENDER_NAME}" (eigene Zeile am Ende).`;

  const subjectLine = profile.requiresSubject
    ? `Subject: ERFORDERLICH. Erste Zeile = „Betreff: <Betreff>" (< 60 Zeichen), dann Leerzeile, dann Body.`
    : `Subject: nicht erforderlich. Nur Body ausgeben.`;

  const addressLine =
    profile.addressForm === "du"
      ? `Anrede: "du" (informell, kleingeschrieben)`
      : `Anrede: "Sie" (formell, großgeschrieben)`;

  return `KANAL-PROFIL
- maxChars: ${profile.maxChars} (harte Obergrenze, inkl. Greeting; bei Email zählt Body ohne Betreffzeile)
- ${addressLine}
- ${greetingLine}
- ${subjectLine}
- Tonalität: ${profile.toneDirective}`;
}

function sanitizeImprovements(
  improvements: string[],
  includeImprovements: boolean,
): string[] {
  if (!includeImprovements) {
    return [];
  }
  return improvements
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, OUTREACH_MAX_IMPROVEMENTS);
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function serializeLeadFacts(
  lead: OutreachLeadFacts,
  options: OutreachPromptOptions,
): string {
  const lines: string[] = [];

  const firstName = trimOrNull(lead.firstName);
  const companyName = trimOrNull(lead.companyName);
  const websiteUrl = trimOrNull(lead.websiteUrl);
  const categoryLabel = trimOrNull(lead.categoryLabel);
  const notes = trimOrNull(lead.notes);
  const contextNote = trimOrNull(options.contextNote);
  const improvements = sanitizeImprovements(
    lead.improvements,
    options.includeImprovements,
  );

  if (firstName !== null) {
    lines.push(`Vorname: ${firstName}`);
  }
  if (companyName !== null) {
    lines.push(`Firma: ${companyName}`);
  }
  if (websiteUrl !== null) {
    lines.push(`Website: ${websiteUrl}`);
  }
  if (categoryLabel !== null) {
    lines.push(`Kategorie: ${categoryLabel}`);
  }
  if (notes !== null) {
    lines.push(`Notizen: ${notes}`);
  }
  if (improvements.length > 0) {
    lines.push(`Verbesserungshinweise: ${improvements.join(" | ")}`);
  }
  if (contextNote !== null) {
    lines.push(`Zusätzlicher Kontext vom Absender: ${contextNote}`);
  }

  if (lines.length === 0) {
    return "Keine konkreten Lead-Daten verfügbar. Formuliere eine sehr knappe, neutrale Erstkontakt-Nachricht ohne erfundene Details und ohne Personalisierung.";
  }

  return `LEAD-DATEN

${lines.join("\n")}

Schreibe jetzt die Nachricht – nur den fertigen Text, kein Vorspann, keine Erklärung.`;
}

function firstTouchPrompt(ctx: PromptBuildContext): OutreachPromptMessages {
  const profile = CHANNEL_PROFILES[ctx.channel];
  const channelInstructions = buildChannelInstructions(profile);

  const systemPrompt = `${OUTREACH_PROFILE}

${COPYWRITING_GUIDELINES}

${channelInstructions}`;

  const userPrompt = serializeLeadFacts(ctx.lead, ctx.options);

  return { systemPrompt, userPrompt };
}

export const aiOutreachGenerationService = {
  firstTouchPrompt,
} as const;
