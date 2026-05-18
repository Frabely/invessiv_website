import { OutreachChannel } from "./outreach-channels";

export type ChannelAddressForm = "du" | "sie";

export interface ChannelProfile {
  maxChars: number;
  greeting: string | null;
  requiresSubject: boolean;
  addressForm: ChannelAddressForm;
  toneDirective: string;
}

export const CHANNEL_PROFILES: Record<OutreachChannel, ChannelProfile> = {
  [OutreachChannel.Linkedin]: {
    maxChars: 300,
    greeting: "Viele Grüße",
    requiresSubject: true,
    addressForm: "sie",
    toneDirective: `Kurze Erstnachricht. 1 natürlicher Anlass, 1 kleine Beobachtung, 1 weicher Abschluss. Keine Diagnose, kein "ich habe Ihre Startseite analysiert", kein Vorwissen vortäuschen.`,
  },
  [OutreachChannel.Email]: {
    maxChars: 900,
    greeting: "Viele Grüße",
    requiresSubject: true,
    addressForm: "sie",
    toneDirective: `Professionell und persönlich, 2-4 kurze Absätze. Betreff neugierig, aber unaufgeregt. Keine Analysefloskeln, kein Clickbait, kein Fake-"Re:".`,
  },
  [OutreachChannel.Instagram]: {
    maxChars: 500,
    greeting: "Liebe Grüße",
    requiresSubject: false,
    addressForm: "du",
    toneDirective: `Locker-freundlich, wie eine echte kurze DM. Weniger erklären, mehr menschlich schreiben. Maximal 1 dezentes Emoji, nur wenn organisch.`,
  },
  [OutreachChannel.DirectMessage]: {
    maxChars: 250,
    greeting: null,
    requiresSubject: false,
    addressForm: "du",
    toneDirective: `Privat-persönlich, sehr kurz. Direkt mit Anlass starten. Kein Pitch, kein Vorstellungsblock, keine Signatur, kein vorheriger-Kontext-Gefühl.`,
  },
};
