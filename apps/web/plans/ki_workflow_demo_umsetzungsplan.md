# KI-Workflow-Demo Umsetzungsplan

## Ziel und Scope

Geplant wird eine neue Marketing-Landingpage für einen kostenlosen Prozess-Check rund um KI-Workflows:

- Öffentliche Route: `/[locale]/services/ai-workflows`
- Deutsche URL: `/de/services/ai-workflows`
- Englische URL: `/en/services/ai-workflows`
- Zielgruppe: kleine Webdesign- und Marketingagenturen, die nach Erstgesprächen wiederkehrend Angebote, Follow-ups oder
  Leistungsbeschreibungen vorbereiten.
- Angebot: kostenloser KI-gestützter Kurz-Check für 5 passende Fälle.
- Anschlussangebot: bezahlte Mini-Piloten ab 1.500 € netto.

Diese Datei ist ausschließlich ein Umsetzungsplan. Es werden noch keine Landingpage, kein Formular und kein Backend
implementiert.

## Nicht-Ziele für V1

- Keine Kalenderbuchung als Pflichtschritt.
- Keine Pflichtfelder für Telefonnummer oder Budget.
- Keine Wiederverwendung der bestehenden Projektanfrage als versteckte Workflow-Anfrage.
- Kein SaaS-Dashboard-Fake oder simuliertes Produkt-UI.
- Keine unkontrollierte öffentliche KI-Spielwiese ohne Qualifizierung, Rate-Limit und Datenschutz-Hinweis.
- Keine Verarbeitung sensibler Kundendaten oder vertraulicher Dokumente.

## Geplante Dateien und Architektur

### Route

Neue Marketing-Route:

- `apps/web/src/app/[locale]/(marketing)/services/ai-workflows/page.tsx`

Die Route orchestriert nur Metadata, Dictionary-Laden und Section-Rendering. Sichtbare Texte werden nicht inline
gepflegt.

### Routen-Konstanten

`SITE_ROUTES` wird um eine eigene Route erweitert:

```ts
AI_WORKFLOWS_SERVICE: "/services/ai-workflows";
```

URL-Pfade werden ausschließlich über zentrale Route-Konstanten oder vorhandene Path-Helper zusammengesetzt.

### Content und i18n

Die Landingpage erhält eigene DE-/EN-Dictionaries analog zu bestehenden Marketing-Landing-Dictionaries.

Geplant:

- eigene Content-Keys für Hero, Sections, Pricing, Datenschutz-Hinweis, CTAs, Formular und Metadata
- identische Keys in Deutsch und Englisch
- keine locale-basierten Inline-Verzweigungen in `page.tsx`, Komponenten, SEO-Logik oder Structured Data
- vollständige parallele Pflege aller sichtbaren Texte in DE/EN

### Komponenten

Neue Komponenten liegen unter:

- `apps/web/src/components/marketing/ai-workflows/**`

Geplante Struktur:

- `ai-workflows-page/`
- `hero-section/`
- `problem-examples-section/`
- `offer-section/`
- `pricing-section/`
- `privacy-note-section/`
- `workflow-check-form/`

Für V1 wird die sichtbare Landingpage bewusst schlank gehalten. Proof/Expertise und Ablauf werden nicht als große eigene
Sections umgesetzt, sondern kompakt in `offer-section` oder `pricing-section` integriert.

Produktive Komponenten erhalten lokale CSS Modules oder vorhandene Utility-Patterns. Neue globale Section-CSS in
`globals.css` ist nicht vorgesehen.

### Formular

Das Workflow-Check-Formular wird als eigene Client Component umgesetzt:

- `workflow-check-form.tsx`
- `workflow-check-form.module.css`
- testnahe Form-Mapper/Form-Service-Dateien nach bestehendem Muster

Die Komponente nutzt zugängliche Fehlermeldungen, sichtbare Fokuszustände und einen Honeypot analog bestehender
Kontaktformulare.

## Landingpage Content und UX

### Hero

Kerncopy:

- Headline: „Bereitest du Angebote nach Erstgesprächen noch jedes Mal manuell vor?“
- Subheadline: kostenloser Kurz-Check für 5 Webdesign- oder Marketingagenturen.
- Primary CTA: „Aufgabe prüfen lassen“
- Preis-Microcopy: „Der Kurz-Check ist kostenlos. Bezahlte Mini-Piloten starten ab 1.500 € netto.“

Der Hero muss sofort Angebot, Zielgruppe und nächsten Schritt erklären. Genau eine H1 pro Seite.

### Sections

Geplante V1-Seitenstruktur:

1. Hero
2. Problem + Beispiele kombiniert: Gesprächsnotizen, Angebote, Follow-ups und Leistungsbeschreibungen kosten
   wiederkehrend Zeit; konkrete Beispiele sind Angebote aus Gesprächsnotizen, Follow-up-Mails, Leistungsbausteine,
   Projektbriefings und Referenzen.
3. Was du bekommst: KI-gestützter Prozess-Check mit 1-2 Workflow-Ideen, kurzer Einschätzung und Pilot-Empfehlung.
   Proof/Expertise wird hier knapp eingebettet, z. B. über den eigenen Social-Workflow als Beispiel für wiederholbare
   KI-Outputs im konsistenten Design.
4. Pricing/Pilot-Frame: kostenloser Kurz-Check, Mini-Pilot ab 1.500 € netto, erweiterter Pilot 2.500-3.500 € netto,
   Ausbau ab 5.000 € netto.
5. Datenschutz-Hinweis: keine sensiblen Kundendaten, keine vertraulichen Dokumente, anonymisierte oder bereinigte
   Beispiele reichen.
6. Final CTA mit Formular.

Die Seite soll für V1 nicht wie eine lange Service-Erklärseite wirken. Sie muss schnell verständlich machen: Problem
erkennen, kostenlosen Check verstehen, Formular ausfüllen. Ablaufdetails wie „Aufgabe beschreiben, Einschätzung
erhalten,
Pilot-Scope entscheiden“ werden als kurze 3-Schritt-Zeile innerhalb der Offer- oder Pricing-Section geführt, nicht als
eigener großer Seitenblock.

### Designrichtung

- Ruhige, hochwertige B2B-Service-Landingpage.
- Dark Mode als Default, Light Mode kompatibel.
- Keine überladene Dashboard-Ästhetik.
- Mobile-first mit klarer Tablet-/Desktop-Erweiterung.
- Lesbare, scannbare Abschnitte statt Textwände.
- Interaktive Elemente mit klaren Hover-, Active-, Disabled- und Focus-States.

### Animationen und Effektbibliothek

Vor Umsetzung müssen `animation_mockups/` und `animation_mockups/effects-catalog.json` geprüft werden.

Vorgesehene Effekte:

- `scroll_reveal_stagger` für Section-Aufbau.
- `gradient_border_grain` für Preis-/Pilotkarte.
- optional `svg_path_journey` nur, wenn der kompakte 3-Schritt-Ablauf dadurch nicht größer oder erklärbedürftiger wirkt.

Mobile Animationen werden reduziert. `prefers-reduced-motion` wird respektiert.

## Formularverhalten

### Felder

Pflichtfelder:

- E-Mail
- Tätigkeit/Unternehmensart oder Website
- Wiederkehrende Aufgabe
- Aktueller Ablauf inklusive grober Häufigkeit oder Zeitaufwand
- Consent/Datenschutz

Optionale Felder:

- Name
- gewünschter Output
- verwendete Tools/Vorlagen
- anonymisiertes Beispiel
- Upload eines anonymisierten Beispiels oder Dokuments

Nicht vorgesehen:

- Pflicht-Telefonnummer
- Pflicht-Budget
- Pflicht-Kalenderbuchung
- Upload sensibler Kundendaten, vertraulicher Verträge oder unbearbeiteter Kundendokumente

### Client-seitig

- Validierung mit zugänglichen Fehlermeldungen.
- Honeypot-Feld analog bestehender Kontaktformulare.
- Submit über die bestehende `/api/public/contact`-Route, erweitert um `workflow_check`.
- Erfolgszustand ohne automatische Kalenderpflicht.
- Fehlerzustand mit klarer, nicht technischer Meldung.
- Upload-Feld mit klarer Dateityp-, Größen- und Datenschutzkommunikation.
- Upload darf erst nach aktiver Datenschutz-/Consent-Bestätigung abgesendet werden.
- Client-seitig werden keine KI-Prompts gebaut und keine KI-API direkt aufgerufen.

### Analytics

Bestehende Conversion-Events werden weiterverwendet:

- `form_start`
- `form_submit_attempt`
- `lead_submit_success`
- `form_submit_error`
- CTA-Klicks

Pflicht-Kontext:

- `form_id: "workflow_check"`
- Locations wie `ai_workflows_hero`, `ai_workflows_form`, `ai_workflows_final_cta`

Analytics-Payloads enthalten keine PII.

## Backend- und Contact-Architektur

### Request-Art

Neue Anfrageart:

```ts
workflow_check;
```

Diese wird als neuer `CONTACT_REQUEST_KIND` modelliert und nicht auf bestehende Projektanfragen gemappt.

### Shared DTOs

Neue Shared DTOs/Form-Values:

- `packages/common/src/contracts/contact/workflow-check/**`

Geplant:

- Request-DTO
- Form-Values
- Zod-Schema
- typisierte Validierungsfehler nach bestehendem Pattern

### Server-seitige Verarbeitung

Die bestehende Contact-Route wird um `workflow_check` erweitert:

- Body an der HTTP-Grenze gegen das neue DTO validieren.
- Rate-Limit und Payload-Limit der bestehenden Contact-Route weiterverwenden.
- Spam-/Honeypot-Logik beibehalten.
- Anfrage an neuen Command-Handler weiterreichen.
- Mail-Notification mit eigener Workflow-Check-Vorlage versenden.
- Upload-Metadaten, erlaubte Dateitypen und Größenlimit serverseitig validieren.
- Upload-Inhalte nur serverseitig verarbeiten; keine KI-API-Keys oder Prompt-Details im Client.

### KI-Workflow-Backend

Für V1 ist eine echte KI-gestützte Backend-Auswertung vorgesehen.

Geplant:

- eigener serverseitiger Workflow-Check-Skill oder klar abgegrenztes Workflow-Modul
- serverseitiger KI-API-Aufruf nach erfolgreicher Validierung, Rate-Limit-Prüfung und Consent-Prüfung
- strukturierter Prompt aus Formularfeldern und optionalem anonymisiertem Upload-Kontext
- strukturierte Ausgabe, z. B. Problemzusammenfassung, 1-2 Workflow-Ideen, Aufwandseinschätzung, empfohlener Pilot-Scope
  und offene Rückfragen
- Persistenz der Anfrage und der erzeugten Auswertung nach bestehendem Lead-/Submission-Muster
- interne Mail mit Formularinhalt, Upload-Hinweis und KI-Auswertung
- Fehlerpfad, wenn KI-Auswertung scheitert: Anfrage trotzdem speichern und als manuell nachzufassenden Workflow-Check
  markieren

Die KI-Auswertung ist ein Backend-Prozess. Die Landingpage zeigt keine freie öffentliche Chat- oder Prompt-Oberfläche.

### Persistenz

Persistenz folgt der bestehenden Contact-Architektur:

- `Lead`
- `LeadSubmission`
- eigene Workflow-Check-Detaildaten
- optionaler Upload-/Attachment-Datensatz oder referenzierte Datei-Metadaten
- KI-Auswertung/Workflow-Check-Ergebnis als eigener strukturierter Datensatz oder klar abgegrenztes Feld im
  Workflow-Check-Kontext

Die bestehenden Projektanfrage-Detaildaten werden nicht zweckentfremdet.

### Mail-Notification

Eigene interne Mail-Vorlage für Workflow-Check-Anfragen:

- E-Mail
- Name, falls angegeben
- Website oder Unternehmensart
- wiederkehrende Aufgabe
- aktueller Ablauf
- Häufigkeit oder Zeitaufwand
- gewünschter Output, falls angegeben
- Tools/Vorlagen, falls angegeben
- anonymisiertes Beispiel, falls angegeben
- Upload-Hinweis, falls Datei übermittelt wurde
- KI-Auswertung mit Workflow-Ideen und Pilot-Empfehlung, falls erfolgreich erzeugt
- Datenschutzkontext: keine sensiblen Kundendaten, keine vertraulichen Dokumente

## SEO und Indexierbarkeit

Geplant:

- eigene Metadata pro Locale
- Canonical:
  - `/de/services/ai-workflows`
  - `/en/services/ai-workflows`
- `alternates.languages` für DE/EN
- OpenGraph-Texte aus Dictionaries
- Service Structured Data aus locale-basierten Dictionaries oder typisierten Locale-Mappings
- interne crawlbare Verlinkung aus passenden Marketing-Bereichen
- Sitemap prüfen und Route aufnehmen, falls sie nicht automatisch über Route-Konstanten läuft
- Robots prüfen, damit die Route indexierbar bleibt

Die Metadata-Title-Konvention wird eingehalten: Unterseite als `Seitenthema | Invessiv`.

## Tests

### Unit- und Integrationstests

Geplante Tests:

- Route-Metadata für DE/EN inklusive Canonical und Alternates.
- neue `SITE_ROUTES`-Konstante und locale path usage.
- Workflow-Check DTO/Zod-Validation:
  - required fields
  - invalid email
  - missing consent
  - Honeypot/Spam
  - Upload-Dateityp und Upload-Größe
  - Payload shape
- Contact API Dispatch für `workflow_check`.
- Mapper/Persistenz-Input für Lead, Submission und Workflow-Check-Details.
- KI-Workflow-Service:
  - baut strukturierte KI-Anfrage aus validierten Formular- und Upload-Daten
  - speichert strukturierte Auswertung
  - behandelt KI-API-Fehler ohne Verlust der Lead-Anfrage
- Mail-Template DE/EN enthält Aufgabe, Ablauf, Website/Unternehmensart, Upload-Hinweis, KI-Auswertung und
  Datenschutzkontext.
- Client Mapper/Form-Service sendet korrektes DTO.
- Formular-Komponente:
  - Validation Errors
  - Successful Submit State
  - Submit Error State
  - Upload-Validierung

### E2E und Smoke

Geplante E2E-/Smoke-Prüfungen:

- `/de/services/ai-workflows` rendert.
- `/en/services/ai-workflows` rendert.
- Primary CTA scrollt zum Formular und fokussiert sinnvoll.
- Formular kann mit gültigen Daten und optionalem anonymisiertem Upload abgesendet werden.
- Keyboard Navigation funktioniert.
- Fokuszustände sind sichtbar.
- Mobile Viewport ohne Textüberlauf oder überlappende UI.

### Quality Gates

Vor Merge:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

Bei Formular-/API-Änderungen zusätzlich relevante Integrationstests für die Contact API.

## Akzeptanzkriterien

- Neue Route ist unter `/de/services/ai-workflows` und `/en/services/ai-workflows` erreichbar.
- Seite nutzt eigene Dictionaries für DE/EN.
- Keine sichtbaren UI-Texte inline in Page-Dateien oder Komponenten.
- Neue Formular-Anfrageart heißt `workflow_check`.
- Workflow-Check verwendet eigene DTOs und eigene serverseitige Validierung.
- Persistenz nutzt Lead + LeadSubmission + eigene Workflow-Check-Detaildaten.
- Optionaler Upload ist vorhanden, begrenzt, serverseitig validiert und klar als anonymisiertes Beispiel kommuniziert.
- Eine echte KI-gestützte Auswertung läuft serverseitig nach Validierung, Rate-Limit und Consent-Prüfung.
- KI-API-Keys, Prompt-Details und Upload-Verarbeitung bleiben ausschließlich im Backend.
- Bei KI-API-Fehlern geht die Lead-Anfrage nicht verloren.
- Keine Zweckentfremdung der Projektanfrage.
- Keine PII in Analytics-Payloads.
- CTA-Events und Formular-Events enthalten `form_id: "workflow_check"`.
- SEO-Metadata, Canonical, Alternates und Service Structured Data sind vorhanden.
- Sitemap/Robots sind geprüft.
- Keine neue globale Section-CSS in `globals.css`.
- Keine URL-String-Konstruktion außerhalb zentraler Route-Konstanten/Helper.
- Dark Mode ist Default; Light Mode bleibt kompatibel.
- Mobile Layout ist ohne Überlauf und ohne überlappende UI nutzbar.

## Umsetzungsreihenfolge

1. Bestehende Marketing-, Contact- und Dictionary-Strukturen prüfen.
2. Route-Konstante und i18n-Content für DE/EN vorbereiten.
3. Statische Landingpage-Sections als Server Components aufbauen.
4. Design-Effekte aus `animation_mockups/` auswählen und integriert planen.
5. Workflow-Check DTOs und Request-Art ergänzen.
6. Formular als Client Component mit Validierung und Honeypot umsetzen.
7. Upload-Handling mit Dateityp-/Größenlimit und Datenschutzkommunikation ergänzen.
8. KI-Workflow-Backend mit Skill/Service, strukturierter Auswertung und Fehlerpfad ergänzen.
9. Contact API Dispatch, Command-Handler, Mapper, Persistenz und Mail-Notification erweitern.
10. SEO-Metadata, Structured Data, interne Links und Sitemap/Robots prüfen.
11. Unit-/Integrationstests ergänzen.
12. E2E-/Smoke-Tests für Routing, CTA, Upload und Formular ergänzen.
13. Quality Gates ausführen und Ergebnisse dokumentieren.

## Annahmen

- Die erste Kampagne fokussiert Webdesign- und Marketingagenturen mit Angebotsprozessen.
- Der kostenlose Check wird KI-gestützt ausgewertet und intern qualifiziert.
- Uploads sind in V1 erlaubt, aber nur als anonymisierte oder bereinigte Beispiele mit klaren Limits.
- Die KI-Auswertung dient als Prozess-Check und Pilot-Vorbereitung, nicht als frei nutzbares KI-Tool.
- Bezahlte Mini-Piloten starten ab 1.500 € netto mit klar begrenztem Scope.
- Der erweiterte Pilot liegt bei 2.500-3.500 € netto.
- Ausbauprojekte starten ab 5.000 € netto.
- Die Route wird als indexierbare Marketing-Seite behandelt.
