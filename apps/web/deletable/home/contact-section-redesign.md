# Teil 1: Kontakt-Frontend-Redesign

## Ziel und Grenze

Die Home-Kontaktsection wird auf ein klares Conversion-Muster umgebaut: Erstgespräch als immer sichtbare Hauptaktion,
Kurznachricht als aufklappbare Alternative. Das bestehende Projektanfrage-Formular wird nur aus dem Frontend entfernt.
Sein API-, DB- und Server-Stack bleibt für diesen Schritt unverändert, damit das Redesign isoliert reviewt und
zurückgerollt werden kann.

Nicht enthalten:

- Keine Löschung von `project_request`, `lead_project_requests` oder Projektanfrage-Contracts.
- Keine DB-Migration und keine Workspace-Änderung.
- Keine Umbenennung der bestehenden Service-Keys.

## UX-Entscheidungen

- Ein ruhiges, editoriales Zwei-Spalten-Layout: hochkantiges Portrait links ab Desktop, Erstgespräch rechts.
- Mobile: Portrait als kompakte Karte über dem Formular; keine Sticky- oder dekorativen Desktop-Effekte.
- Das Erstgespräch ist beim Eintritt sichtbar. Die Kurznachricht erscheint nur nach explizitem Klick oder über
  `#contact-email` aus der FAQ.
- Der Link zur Kurznachricht steht erst nach dem primären Formular. Der Öffnungszustand liegt ausschließlich in
  `ContactSection`; nach Öffnen erhält das Namensfeld Fokus.
- Texte in DE und EN konzentrieren sich auf Ergebnis und nächsten Schritt. Keine doppelte Erklärung von Dauer,
  Unverbindlichkeit und Ablauf.

## Dateien und Umsetzung

1. `contact-section.tsx` als schlanke Orchestrierung umbauen.
   - `ProjectRequestForm`, `contactForm`, `contactFormOffers`, Channel-Grid und sekundären Services-Link entfernen.
   - `DiscoveryCallPanel` immer als Primärformular rendern.
   - `QuickContactForm` in ein semantisch beschriftetes Disclosure verlegen.
   - Den bestehenden `hashchange`- und Dokument-Klick-Support für `CONTACT_EMAIL_SECTION_HREF` beibehalten.

2. Discovery-Call-Panel umgestalten, ohne dessen DTO oder API-Vertrag zu verändern.
   - Name, E-Mail, optionale Nachricht und Datenschutz bleiben funktional wie heute.
   - Keine neuen Felder wie Telefon oder Projektrahmen in Teil 1: Diese benötigen additive Server-, DB- und
     Calendly-Arbeit und gehören in ein eigenes, bewusst freigegebenes Feature.
   - Bestehende Calendly-Prefill- und Popup-Blocker-Logik behalten.

3. `quick-contact-form` auf reine Kurznachricht reduzieren.
   - Nur Name, E-Mail, Nachricht, Datenschutz und Submit.
   - Keine Kanal-Metadaten oder Copy-to-clipboard-UI, wenn sie im neuen Disclosure keinen Nutzen hat.

4. Neue Präsentationskomponenten anlegen.
   - `contact-portrait-card/` mit `next/image`, `suit-1.jpeg`, `loading="lazy"`, festem Seitenverhältnis und
     Dictionary-Texten.
   - `quick-contact-disclosure/` mit eigener Datei, CSS-Modul, `aria-expanded` und kontrolliertem Fokus.
   - Relative Bildreferenz von einem direkten Child unter `contact-section/`:
     `../../../../../../assets/home/suit-1.jpeg`.

5. Dictionaries in `marketing/home.ts` für DE und EN parallel verschlanken.
   - Den ungenutzten `contactForm`-Block erst in Teil 2 löschen, weil die Projektanfrage-Datei bis dahin weiter im
     Repository bleibt.
   - Neue/angepasste sichtbare Texte nur in `discoveryCallForm`, `quickContactForm` und den Portrait-/Disclosure-Keys.

6. Tests.
   - `contact-section.test.tsx`: Discovery-Call ist sichtbar, Projektanfrage nicht, `#contact-email` öffnet die
     Kurznachricht und setzt Fokus.
   - `discovery-call-panel.test.tsx`: Calendly bleibt mit Name, E-Mail und optionaler Nachricht vorbefüllt.
   - `quick-contact-disclosure.test.tsx`: Klick, Hash und Tastaturverhalten.
   - Responsive/A11y-Smoke bei 360, 768 und 1440 px sowie Dark/Light.

## Abnahme

- Kein Projektanfrage-Formular ist auf der Home sichtbar oder per Interaktion erreichbar.
- Erstgespräch bleibt primäre, funktionierende Conversion inklusive Analytics und Calendly-Redirect.
- Kurznachricht bleibt über CTA und FAQ-Hash erreichbar.
- Bestehende Projektanfrage-API und Tests laufen unverändert weiter.
- `pnpm --filter @invessiv/web typecheck`, relevante Tests und Web-Build sind grün.
