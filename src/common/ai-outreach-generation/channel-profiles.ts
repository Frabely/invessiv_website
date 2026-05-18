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
    toneDirective: `Professionell-persönlich, ruhig, kein Sales-Sprech. Wirke wie ein Mensch, der konkret hingeschaut hat – nicht wie ein Recruiter-Template. LinkedIn-Connect-Note-Stil: 1 Aufhänger + 1 Beobachtung + softer CTA. Mit Betreffzeile wie bei einer kurzen Nachricht. Anrede mit "Sie".`,
  },
  [OutreachChannel.Email]: {
    maxChars: 900,
    greeting: "Viele Grüße",
    requiresSubject: true,
    addressForm: "sie",
    toneDirective: `Professionell mit klarer Struktur. Betreff < 60 Zeichen, neugierig-machend, KEIN Clickbait, KEIN Fake-"Re:". Body 2–4 kurze Absätze: Aufhänger → Beobachtung → softer CTA. Anrede mit "Sie".`,
  },
  [OutreachChannel.Instagram]: {
    maxChars: 500,
    greeting: "Liebe Grüße",
    requiresSubject: false,
    addressForm: "du",
    toneDirective: `Locker-freundlich, leicht informell – wie ein Branchen-Peer, nicht wie eine Marke. Sparsame Emojis erlaubt (max. 1, nur wenn organisch). Anrede mit "du".`,
  },
  [OutreachChannel.DirectMessage]: {
    maxChars: 250,
    greeting: null,
    requiresSubject: false,
    addressForm: "du",
    toneDirective: `Privat-persönlich, "du". Schreibe, als kennt ihr euch bereits – KEIN Firmen-Pitch, KEIN Fremdeln, KEIN Vorstellungs-Block. Direkt mit dem Anlass einsteigen, kurz und konkret. Keine Schluss-Signatur, kein "Viele Grüße"-Block – die Nachricht endet auf den Satz.`,
  },
};
