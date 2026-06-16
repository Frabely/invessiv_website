# Tracking & Analyse — erklärt für Einsteiger

Dieses Dokument erklärt **jede neue Datei** rund um Tracking und Analyse, die auf dem Branch
`improve-landing-pages-service` dazugekommen ist — in einfacher Sprache, ohne Tracking-Vorwissen.

Ziel: Du sollst verstehen, **was passiert, warum, und welche Datei wofür zuständig ist.**

---

## 1. Das große Ganze in 2 Minuten

Auf **einer einzigen Seite** (der Landingpage `/services/landing-page` und ihrer „Danke"-Seite
`/services/landing-page/success`) messen wir, ob Werbung funktioniert. Auf dem **Rest der Website** passiert das **nicht
**.

Es gibt **drei** Mess-Systeme, die man nicht verwechseln darf:

| System                       | Was es misst                                                   | Cookies?           | Einwilligung nötig? |
| ---------------------------- | -------------------------------------------------------------- | ------------------ | ------------------- |
| **Vercel Analytics**         | Grobe Nutzung der ganzen Website (Seitenaufrufe, Klicks)       | Nein (cookielos)   | Nein                |
| **Google Analytics 4 (GA4)** | Detaillierter Verlauf auf der Landingpage (Absprünge, Quellen) | Ja, bei Zustimmung | Ja                  |
| **Google Ads Conversion**    | „Hat jemand aus einer Google-Anzeige angefragt?"               | Ja, bei Zustimmung | Ja                  |

Weil GA4 und Google Ads zustimmungspflichtig sind, brauchen wir einen **Cookie-Banner** und eine **Einwilligungs-Logik
**.
Das ist der größte Teil des Codes.

### Die zwei wichtigsten Begriffe

- **Consent (Einwilligung):** Die Ja/Nein-Entscheidung des Besuchers, ob er Analyse/Marketing erlaubt. Wir speichern sie
  im Browser und sagen sie Google.
- **gtag:** Eine kleine Funktion von Google im Browser (`window.gtag(...)`). Über sie schicken wir Google alle Signale —
  „der Nutzer hat zugestimmt", „hier ist ein Seitenaufruf", „hier ist eine Conversion".

### Google Consent Mode v2 (Advanced) — die zentrale Idee

Das Google-Skript wird **immer** geladen, aber startet mit der Einstellung **„alles abgelehnt" (denied)**.

- **Ohne Zustimmung:** Google bekommt nur **anonyme, cookielose Signale** (keine Cookies, keine Kennung). Daraus
  _schätzt_ Google die Zahlen statistisch.
- **Mit Zustimmung:** Wir schicken Google ein „Update" (`consent update`) und ab da wird voll gemessen.

Das ist Googles offiziell empfohlener Weg und der Grund, warum vor dem Klick nichts Persönliches gespeichert wird.

### Der Ablauf einer echten Anfrage (vereinfacht)

```
Besucher kommt über Google-Anzeige auf die Landingpage
   │
   ├─ Google-Skript lädt, Consent = "denied" (nur anonyme Pings)
   ├─ Cookie-Banner erscheint
   │     └─ "Alle akzeptieren" → wir speichern die Wahl + sagen Google "granted"
   │
   ├─ Besucher füllt Formular aus und sendet ab
   │     └─ Server antwortet "ok"
   │           └─ wir setzen ein kurzlebiges "Conversion kommt"-Flag
   │                 └─ Weiterleitung auf die Danke-Seite
   │
   └─ Auf der Danke-Seite:
         └─ Flag wird gelesen UND sofort gelöscht
               └─ Google-Ads-Conversion feuert genau EINMAL
                  (Reload/Zurück feuert nicht nochmal, weil Flag weg ist)
```

---

## 2. Die Dateien — nach Aufgabe gruppiert

Faustregel im Projekt:

- **`lib/…`** = reine Logik ohne Bildschirm (gut testbar).
- **`components/…`** = sichtbare Bausteine (UI).
- **`hooks/…`** = wiederverwendbare React-Logik.
- **`i18n/dictionaries/…`** = Texte (DE/EN getrennt).
- Zu fast jeder Datei gibt es eine `*.test.ts(x)` daneben — das sind die automatischen Tests, die prüfen, dass die Logik
  stimmt. Die musst du nicht lesen, um es zu verstehen.

---

### Gruppe A — Einwilligungs-Logik (`src/lib/consent/`)

Das „Gehirn" der Einwilligung. Reine Logik, keine Optik.

#### `consent-types.ts`

**Wofür:** Definiert die Grundbegriffe als feste Typen.
**Was es tut:** Legt fest, dass es die Kategorien `analytics` und `marketing` gibt, dass ein Google-Signal nur
`granted` oder `denied` sein kann, und liefert fertige Voreinstellungen: `REJECT_ALL` (alles aus) und `ACCEPT_ALL`
(alles an). **Wichtig:** Die Standardwahl ist `REJECT_ALL` — vor einem Klick ist alles aus.

#### `consent-mode.ts`

**Wofür:** Übersetzt „der Nutzer hat zugestimmt" in Googles Sprache.
**Was es tut:** Wandelt die Ja/Nein-Wahl in die vier Google-Signale um
(`analytics_storage`, `ad_storage`, `ad_user_data`, `ad_personalization`). Enthält außerdem die Standard-Startwerte
(alles `denied`) und drei Begleitparameter:

- `ads_data_redaction: true` — schwärzt Werbe-Kennungen, solange abgelehnt ist.
- `url_passthrough: true` — reicht die Google-Klick-ID (`gclid`) sauber an Google weiter, falls Cookies abgelehnt sind.
- `wait_for_update: 500` — gibt der Einwilligung 0,5 s Vorsprung, bevor das erste Signal rausgeht.

#### `consent-storage.ts`

**Wofür:** Merkt sich die Wahl des Nutzers im Browser.
**Was es tut:** Liest/schreibt die Wahl in den `localStorage` (Schlüssel `invessiv-consent`). Speichert **nur**
`{ version, analytics, marketing, updatedAt }` — also keine persönlichen Daten. Das `version`-Feld erlaubt es, später
eine neue Einwilligung einzuholen, ohne den Code umzubauen. Defekte/alte Einträge werden ignoriert.

#### `consent-store.ts`

**Wofür:** Sorgt dafür, dass die UI sofort mitbekommt, wenn sich die Wahl ändert.
**Was es tut:** Eine Brücke zwischen `localStorage` und React (`useSyncExternalStore`). Funktioniert serverseitig sicher
(meldet „noch unbekannt", bis der Browser geladen hat) und synchronisiert sogar **über mehrere Browser-Tabs** hinweg.

#### `google-consent.ts`

**Wofür:** Sagt Google „die Wahl hat sich geändert".
**Was es tut:** `emitConsentUpdate(...)` ruft `gtag("consent", "update", …)` auf. Wenn `gtag` (noch) nicht da ist,
passiert einfach nichts (kein Fehler).

---

### Gruppe B — Cookie-Banner & Provider (sichtbare Einwilligung)

Hier wird die Logik aus Gruppe A für den Nutzer sichtbar.

#### `src/components/providers/consent-provider/consent-context.ts`

**Wofür:** Der „Verteiler", über den alle Banner-Teile an dieselben Daten/Funktionen kommen.
**Was es tut:** Definiert per React-Context, welche Werte (aktuelle Wahl, „ist Banner offen?") und Aktionen
(`acceptAll`, `rejectAll`, `saveChoice`, …) bereitstehen.

#### `src/components/providers/consent-provider/consent-provider.tsx`

**Wofür:** Die zentrale Steuerung des Banners. Umschließt die Landing- und die Danke-Seite.
**Was es tut:** Holt die gespeicherte Wahl, entscheidet, **ob der Banner gezeigt wird** (nur wenn noch keine Wahl
existiert), und stellt die Aktionen bereit. Bei jeder Wahl macht es drei Dinge: speichern → die UI informieren →
Google informieren.

#### `src/hooks/consent/use-consent.ts`

**Wofür:** Bequemer Zugriff auf den Verteiler.
**Was es tut:** Ein kleiner Hook `useConsent()`, den Banner-Bausteine aufrufen, um an Texte/Aktionen zu kommen. Wirft
einen klaren Fehler, falls er versehentlich außerhalb des Providers benutzt wird.

#### `src/components/consent/consent-banner/consent-banner.tsx`

**Wofür:** Der eigentliche Cookie-Banner unten am Bildschirm.
**Was es tut:** Zeigt Titel, Text, Datenschutz-Link und die Buttons **„Alle akzeptieren" / „Ablehnen" / „Einstellungen"
**.
Barrierefrei umgesetzt: `role="dialog"`, Tastatur-Bedienung, `Escape` schließt, Fokus wird gesetzt. **Akzeptieren und
Ablehnen sind gleich groß/gleich sichtbar** (gesetzliche Vorgabe).

#### `src/components/consent/consent-banner/consent-settings/consent-settings.tsx`

**Wofür:** Das Detail-Panel „Einstellungen" im Banner.
**Was es tut:** Zeigt die drei Kategorien (Notwendig / Analyse / Marketing) mit Schaltern und einem Button
„Auswahl speichern". Notwendig ist immer an; Analyse und Marketing starten **aus**.

#### `src/components/consent/consent-banner/consent-settings/consent-toggle-item/consent-toggle-item.tsx`

**Wofür:** Ein einzelner An/Aus-Schalter mit Beschriftung.
**Was es tut:** Stellt eine Kategorie als Checkbox/Schalter dar und meldet Klicks nach oben. Reiner Baustein.

#### `src/components/consent/cookie-settings-button/cookie-settings-button.tsx`

**Wofür:** Der „Cookie-Einstellungen"-Link im Footer.
**Was es tut:** Öffnet den Banner/die Einstellungen jederzeit wieder — damit man seine Wahl **widerrufen** kann
(gesetzlich Pflicht). Erscheint nur im Footer der Landing- und Danke-Seite.

#### `src/i18n/dictionaries/shared/consent/{de,en}.json` + `index.ts`

**Wofür:** Alle Texte des Banners — auf Deutsch und Englisch getrennt.
**Was es tut:** Enthält Banner-Titel, Beschreibung, Button-Beschriftungen und die Kategorie-Erklärungen. `index.ts` lädt
je nach Sprache die richtige Datei. **Hier ändert man Banner-Texte**, nicht im Code.

---

### Gruppe C — Google-Tag laden (GA4 + Google Ads Grundgerüst)

Bringt Googles Skript auf die Seite und richtet die zwei Ziele (GA4 + Ads) ein.

#### `src/lib/analytics/google-tag/google-tag-config.ts`

**Wofür:** Liest die Zugangsdaten aus den Umgebungsvariablen.
**Was es tut:** Holt `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` und
`…_LABEL`. Wenn eine ID fehlt, wird das jeweilige Ziel sauber **abgeschaltet** (kein Fehler). So läuft GA4 schon, auch
wenn die Google-Ads-Werte noch leer sind.

#### `src/lib/analytics/google-tag/google-tag-script.ts`

**Wofür:** Baut den Text der kleinen Start-Skripte, die ins HTML kommen.
**Was es tut:** Erzeugt zwei Code-Schnipsel:

1. **Bootstrap:** definiert `gtag`, setzt **Consent-Default „denied"** inkl. der Begleitparameter und liest eine
   bereits gespeicherte Wahl **sofort** ein — damit Wiederkehrer gleich den richtigen Stand haben.
2. **Config:** richtet GA4 ein (mit `send_page_view: false`, weil wir Seitenaufrufe selbst senden) und das
   Google-Ads-Ziel.

#### `src/components/providers/google-tag/google-tag.tsx`

**Wofür:** Fügt Googles Skript tatsächlich in die Seite ein.
**Was es tut:** Lädt das offizielle `gtag.js` plus die Schnipsel von oben — **nur** auf Landing-/Danke-Seite, nicht
global. Schickt außerdem bei jedem Seitenwechsel einen GA4-Seitenaufruf (`page_view`), weil die Weiterleitung zur
Danke-Seite sonst nicht gezählt würde.

---

### Gruppe D — Die Google-Ads-Conversion (das eigentliche Ziel)

Sorgt dafür, dass **genau eine** Conversion zählt, wenn jemand wirklich angefragt hat.

#### `src/lib/analytics/google-ads-conversion/conversion-guard.ts`

**Wofür:** Der „Türsteher", der Doppelzählungen und falsche Zählungen verhindert.
**Was es tut:** Setzt beim erfolgreichen Absenden ein kurzlebiges Flag im `sessionStorage` plus eine eindeutige
`transaction_id`. Auf der Danke-Seite wird das Flag **gelesen und im selben Schritt gelöscht** — dadurch zählt ein
Reload oder „Zurück" **nicht** erneut, und ein direkter Aufruf der Danke-Seite zählt gar nicht.

#### `src/lib/analytics/google-ads-conversion/conversion-event.ts`

**Wofür:** Schickt die Conversion an Google Ads.
**Was es tut:** Ruft `gtag("event", "conversion", { send_to: "<AW-ID>/<Label>", transaction_id })` auf. Fehlt die
Ads-Konfiguration oder `gtag`, passiert nichts (kein Fehler). Die `transaction_id` hilft Google, Doppelungen auch auf
seiner Seite zu erkennen.

#### `src/hooks/analytics/use-landing-conversion.ts`

**Wofür:** Verbindet Türsteher und Versand auf der Danke-Seite.
**Was es tut:** Beim Laden der Danke-Seite: Flag prüfen → wenn vorhanden, Conversion feuern. Sonst nichts.

#### `src/components/analytics/landing-conversion/landing-conversion.tsx`

**Wofür:** Der unsichtbare „Auslöser" auf der Danke-Seite.
**Was es tut:** Eine Mini-Komponente, die nichts anzeigt (`return null`) und nur den Hook von oben aktiviert. So bleibt
die Danke-Seite selbst eine einfache Server-Komponente.

---

### Gruppe E — Vercel-Analytics-Events (cookielos, ganze Website)

#### `src/lib/analytics/conversion-events.ts` _(bestand schon, hier erweitert)_

**Wofür:** Die Liste der erlaubten, cookielosen Klick-/Formular-Events für Vercel Analytics.
**Was es tut:** Pflegt eine **Whitelist** von Event-Namen (z. B. `cta_click`, `form_start`, neu:
`faq_exit_services_click`) und filtert die mitgeschickten Daten, damit **nie persönliche Daten** (E-Mail, Telefon) an
Analytics gehen. In diesem Branch kam nur der FAQ-Ausstiegslink-Event dazu.

#### `landing_page_section_view` — der Sektions-Funnel (Absprung-Messung)

**Wofür:** Sehen, **wo** Besucher abspringen, bevor sie das Formular erreichen.
**Problem vorher:** Wir sahen nur „Seite geladen" und „Formular fokussiert". Bei z. B. 110 Besuchern → 0
`form_start` war nicht erkennbar, ob sie am Hero, am Preis oder erst am Formular abgesprungen sind.
**Was es tut:** Sobald eine Sektion in den sichtbaren Bereich scrollt, wird **einmal** das cookielose Vercel-Event
`landing_page_section_view` mit `location = <Sektions-id>` gefeuert (`hero`, `solution`, `trust`, `audience`,
`process`, `pricing`, `faq`, `contact`). Jede Sektion zählt **maximal einmal pro Seitenaufruf** (Hoch- und
Runterscrollen feuert nicht erneut). Kein Consent nötig, keine persönlichen Daten.

**Warum der `landing_page_`-Prefix im Event-Namen?** Damit im Vercel-Dashboard jede Landingpage ein **eigener
Event-Eintrag** ist und du den Funnel pro Seite gebündelt und ohne Filter ablesen kannst. Eine künftige zweite
Landingpage bekäme einen eigenen Namen (z. B. `<seite>_section_view`), der zusätzlich in die Event-Allowlist
(`common/constants/analytics/conversion-event-names.ts`) aufgenommen wird. Die Sektionen bleiben dabei in der
`location`-Property — die Zahl der Event-Namen bleibt also niedrig (einer pro Seite).

Beteiligte Dateien:

- `src/config/navigation/landing.ts` — die einzige Quelle der Landing-Sektions-ids (`LANDING_SECTION_IDS`) und die
  daraus abgeleitete geordnete Funnel-Liste (`LANDING_FUNNEL_SECTION_IDS`). Dieselben ids werden in `landing-page.tsx`
  als Sektions-`id` gerendert — eine Umbenennung schlägt damit an beiden Stellen zugleich durch.
- `src/hooks/analytics/use-section-funnel-tracking.ts` — beobachtet die Sektionen per `IntersectionObserver` und
  feuert je Sektion genau einmal. Bekommt den Event-Namen als Parameter und ist damit pro Landingpage
  wiederverwendbar.
- `src/components/shared/analytics/landing-funnel-tracker/landing-funnel-tracker.tsx` — unsichtbare Komponente
  (`return null`), die den Hook mit `landing_page_section_view` auf der Landingpage aktiviert.

**So liest man den Funnel im Vercel-Dashboard:** Unter Analytics → Events den Eintrag `landing_page_section_view`
öffnen und die `location`-Werte absteigend nach Funnel-Reihenfolge mit den Seitenaufrufen und `form_start`
vergleichen. Der größte Sprung nach unten zwischen zwei Sektionen ist der Hauptabsprungpunkt. Erreicht `contact`
Besucher, bleibt `form_start` aber bei 0, liegt das Problem am Formular/CTA — nicht am Inhalt davor.

---

### Gruppe F — Hilfsmittel

#### `src/lib/observability/report-client-error.ts`

**Wofür:** Einheitliches, sicheres Fehler-Logging im Browser.
**Was es tut:** Schreibt eine Warnung in die Browser-Konsole, damit man Probleme (z. B. blockierter `localStorage`)
später nachvollziehen kann. In Tests bleibt es still. So „verschluckt" kein `try/catch` mehr Fehler unbemerkt.

---

## 3. Wo alles zusammengesteckt wird (zur Orientierung)

Diese Dateien sind **nicht neu**, aber hier wird der Tracking-Code eingehängt:

- `src/components/marketing/landing/landing-page/landing-page.tsx`
  → umschließt die Landingpage mit `ConsentProvider`, lädt `GoogleTag`, mountet `LandingFunnelTracker` (Sektions-Funnel)
  und gibt dem Formular `trackAdsConversion`.
- `src/app/[locale]/(marketing)/services/landing-page/success/page.tsx`
  → die Danke-Seite: `ConsentProvider` + `GoogleTag` + `LandingConversion` (feuert die Conversion), `noindex`.
- `src/components/shared/final-cta-section/final-cta-section.tsx`
  → setzt das Conversion-Flag **nur bei echtem Erfolg**; Honeypot (Bot-Falle) leitet gleich um, setzt das Flag aber
  **nicht**.
- `src/components/marketing/landing/faq-section/faq-section.tsx` + `i18n/.../faq/{de,en}.json`
  → der FAQ-Ausstiegslink trägt die `faq_exit_services_click`-Markierung.

---

## 4. Häufige Fragen

**Wird vor dem Klick schon getrackt?**
Nur anonyme, cookielose Signale an Google (Consent-Default „denied"). Nichts Persönliches, keine Cookies.

**Was, wenn die Google-Ads-Werte noch leer sind?**
Dann zählt keine Ads-Conversion (sauberes Nichtstun). GA4 und Vercel Analytics laufen trotzdem.

**Wo sehe ich später die Zahlen?**
GA4 → Berichte → Echtzeit (sofort); Google Ads → Conversions (mit Stunden Verzögerung); Vercel-Dashboard → Analytics.
Details stehen in `apps/web/plans/landing-page/after-merge-todos.md`.

**Wo ändere ich Banner-Texte?**
In `src/i18n/dictionaries/shared/consent/{de,en}.json` — nicht im Code.
