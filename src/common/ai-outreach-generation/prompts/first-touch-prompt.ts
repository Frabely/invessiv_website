import {
  OUTREACH_DEFAULT_OWNER_FALLBACK,
  OUTREACH_MAX_IMPROVEMENTS,
} from "../outreach-defaults";
import { CHANNEL_PROFILES, type ChannelProfile } from "../channel-profiles";
import { COPYWRITING_GUIDELINES } from "../copywriting-guidelines";
import { OUTREACH_PROFILE } from "../outreach-profile";
import type { OutreachLeadFacts } from "../outreach-lead-facts";
import type { OutreachPromptMessages } from "../outreach-prompt-messages";
import type { OutreachPromptOptions } from "../outreach-prompt-options";
import {
  type OutreachPromptTemplate,
  OutreachTemplateInput,
} from "../outreach-prompt-template";
import type { PromptBuildContext } from "../prompt-build-context";

export const FIRST_TOUCH_PROMPT_TEMPLATE = {
  templateExample: `Hallo Anna,

mir ist bei ACME aufgefallen, dass Ihr Angebot schon klar positioniert wirkt. Falls die Website gerade Thema ist: Der Einstieg könnte noch schneller zeigen, für wen Sie die beste Wahl sind.

Wenn das für Sie relevant ist, schicke ich gern 2-3 konkrete Gedanken dazu.

Viele Grüße
Moritz`,
  templateInstructions: [
    "Nutze die Vorlage als Form- und Tonanker, nicht als starres Copy-Paste.",
    "Starte mit persönlicher Anrede, wenn ein Vorname vorhanden ist. Wenn kein Vorname vorhanden ist und eine Firma bekannt ist, nutze das Team der Firma.",
    "Ersetze die Beobachtung durch konkrete Lead-Daten aus Firma, Kategorie, Notizen oder Verbesserungshinweisen.",
    "Website-Hinweise nur verwenden, wenn keine Website gefunden wurde oder der Website-Status unbekannt ist. Wenn eine Website vorhanden ist, formuliere nicht 'keine Website gefunden'.",
    "Verbesserungen nur einbauen, wenn sie im Feld Verbesserungshinweise stehen und der Toggle includeImprovements aktiv ist.",
    "Zusatzkontext darf Stil, CTA oder Ansprache präzisieren, aber keine fehlenden Lead-Daten erfinden.",
    "Keine erfundenen Details, keine harten Claims, keine Unterstellung über Budget, Bedarf oder aktuelle Projekte.",
  ],
  requiredInputs: [
    OutreachTemplateInput.FirstName,
    OutreachTemplateInput.CompanyName,
    OutreachTemplateInput.WebsiteStatus,
    OutreachTemplateInput.CategoryLabel,
    OutreachTemplateInput.Notes,
    OutreachTemplateInput.Improvements,
    OutreachTemplateInput.ContextNote,
  ],
} satisfies OutreachPromptTemplate;

function hasExplicitInformalOverride(contextNote: string | null): boolean {
  if (contextNote === null) {
    return false;
  }

  return /(?:\bdu\-form\b|\bdu form\b|\bduzen\b|\bper du\b|\bin du\b|\bdu\-ansprache\b)/i.test(
    contextNote,
  );
}

function buildChannelInstructions(profile: ChannelProfile): string {
  const greetingLine =
    profile.greeting === null
      ? `Greeting: KEINS – Nachricht endet auf den Satz, ohne Schluss-Signatur, ohne Namen.`
      : `Greeting: „${profile.greeting}" in einer Zeile und darunter „${OUTREACH_DEFAULT_OWNER_FALLBACK}" als eigene Zeile am Ende.`;

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

function buildTemplateBlock(template: OutreachPromptTemplate): string {
  return `NACHRICHTEN-TEMPLATE

Beispielnachricht:
${template.templateExample}

Übertragungsregeln:
${template.templateInstructions.map((item) => `- ${item}`).join("\n")}

Benötigte Eingaben:
${template.requiredInputs.map((input) => `- ${input}`).join("\n")}`;
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

function getWebsiteStatus(websiteUrl: string | null): string {
  if (websiteUrl !== null) {
    return `Website vorhanden: ${websiteUrl}`;
  }

  return "Keine Website gefunden oder Website-Status unbekannt.";
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
  const explicitInformalOverride = hasExplicitInformalOverride(contextNote);
  const improvements = sanitizeImprovements(
    lead.improvements,
    options.includeImprovements,
  );

  lines.push(`Website-Status: ${getWebsiteStatus(websiteUrl)}`);

  if (firstName !== null) {
    lines.push(`Vorname: ${firstName}`);
  }
  if (companyName !== null) {
    lines.push(`Firma: ${companyName}`);
  }
  if (categoryLabel !== null) {
    lines.push(`Kategorie: ${categoryLabel}`);
  }
  if (notes !== null) {
    lines.push(`Notizen: ${notes}`);
  }
  if (improvements.length > 0) {
    lines.push(`Verbesserungshinweise: ${improvements.join(" | ")}`);
    lines.push(
      "Verbesserungsregel: Baue mindestens einen passenden Hinweis sichtbar ein, wenn er dem Kanal oder Zusatzkontext nicht widerspricht.",
    );
  } else {
    lines.push(
      "Verbesserungshinweise: nicht verwenden. Der Toggle ist deaktiviert oder es liegen keine Hinweise vor.",
    );
  }
  if (contextNote !== null) {
    const addressRule = explicitInformalOverride
      ? "Zusatzkontext erlaubt ausdrücklich die Du-Form. Folge dem Zusatzkontext auch dann, wenn er der Kanalvorgabe widerspricht."
      : "Kein expliziter Du-Override im Zusatzkontext. Verwende für LinkedIn und Email ausschließlich Sie; die Du-Form ist gesperrt.";
    lines.push(
      `Zusätzlicher Kontext vom Absender: ${contextNote}`,
      addressRule,
    );
  }

  lines.push(
    "Ersetzungsregeln: Fehlende Daten nicht durch Annahmen ersetzen. Wenn ein Feld fehlt, lasse den entsprechenden Vorlagenbaustein weg oder formuliere neutral.",
    "Website-Regel: Bei 'Website vorhanden' keinen Missing-Website-Hinweis schreiben. Bei 'Keine Website gefunden' oder unbekannt darfst du vorsichtig erwähnen, dass online keine eindeutige Website sichtbar war.",
    "Ausgabe: Schreibe nur die fertige Nachricht, kein Vorspann, keine Erklärung.",
  );

  return `LEAD-DATEN UND ERSETZUNGSREGELN

${lines.join("\n")}

Schreibe jetzt die Nachricht anhand des Templates.`;
}

function firstTouchPrompt(ctx: PromptBuildContext): OutreachPromptMessages {
  const profile = CHANNEL_PROFILES[ctx.channel];
  const channelInstructions = buildChannelInstructions(profile);

  const systemPrompt = `${OUTREACH_PROFILE}

${COPYWRITING_GUIDELINES}

${channelInstructions}

${buildTemplateBlock(FIRST_TOUCH_PROMPT_TEMPLATE)}`;

  const userPrompt = serializeLeadFacts(ctx.lead, ctx.options);

  return { systemPrompt, userPrompt };
}

export const aiOutreachGenerationService = {
  firstTouchPrompt,
} as const;
