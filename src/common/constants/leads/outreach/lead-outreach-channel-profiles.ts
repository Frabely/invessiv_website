import { OutreachChannel } from "@/common/constants/leads/outreach/lead-outreach-channels";

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
    greeting: "Viele Gr\u00fc\u00dfe",
    requiresSubject: true,
    addressForm: "sie",
    toneDirective:
      `Kurze Erstnachricht. 1 nat\u00fcrlicher Anlass, 1 kleine Beobachtung, 1 weicher Abschluss. ` +
      `Keine Diagnose, kein "ich habe Ihre Startseite analysiert", kein Vorwissen vort\u00e4uschen.`,
  },
  [OutreachChannel.Email]: {
    maxChars: 900,
    greeting: "Viele Gr\u00fc\u00dfe",
    requiresSubject: true,
    addressForm: "sie",
    toneDirective:
      `Professionell und pers\u00f6nlich, 2-4 kurze Abs\u00e4tze. Betreff neugierig, aber unaufgeregt. ` +
      `Keine Analysefloskeln, kein Clickbait, kein Fake-"Re:".`,
  },
  [OutreachChannel.Instagram]: {
    maxChars: 500,
    greeting: "Liebe Gr\u00fc\u00dfe",
    requiresSubject: false,
    addressForm: "du",
    toneDirective:
      `Locker-freundlich, wie eine echte kurze DM. Weniger erkl\u00e4ren, mehr menschlich schreiben. ` +
      `Maximal 1 dezentes Emoji, nur wenn organisch.`,
  },
  [OutreachChannel.DirectMessage]: {
    maxChars: 250,
    greeting: null,
    requiresSubject: false,
    addressForm: "du",
    toneDirective:
      `Privat-pers\u00f6nlich, sehr kurz. Direkt mit Anlass starten. Kein Pitch, kein Vorstellungsblock, ` +
      `keine Signatur, kein vorheriger-Kontext-Gef\u00fchl.`,
  },
};
