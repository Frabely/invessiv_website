# KI-Workflow-Demo Umsetzungsplan

## Ziel und Scope

Geplant wird eine neue Marketing-Landingpage für einen kostenlosen Prozess-Check rund um KI-gestützte
LinkedIn-Content-Workflows:

- Öffentliche Route: `/[locale]/services/ai-workflows`
- Deutsche URL: `/de/services/ai-workflows`
- Englische URL: `/en/services/ai-workflows`
- Zielgruppe: Solo-Dienstleister, Berater, Coaches und kleine B2B-Selbstständige, die regelmäßig auf LinkedIn sichtbar
  sein wollen, aber keinen stabilen Content-Prozess haben.
- Problem: LinkedIn bleibt liegen, weil aus Kundenfragen, Projektalltag, Notizen, Sprachnotizen und Fachwissen keine
  wiederholbare Posting-Routine entsteht.
- Angebot: kostenloser Content-Workflow-Check für 5 passende Selbstständige.
- Anschlussangebot: bezahlte Mini-Piloten ab 1.500 € netto mit klar begrenztem Scope.

Diese Datei ist ausschließlich ein Umsetzungsplan. Die konkrete Task-Ausführung steht in
`apps/web/plans/ai-workflows/umsetzungsplan-steps.md`.

## Nicht-Ziele für V1

- Kein kostenloser LinkedIn-Post-Generator als Hauptversprechen.
- Keine vollautomatische Veröffentlichung auf LinkedIn.
- Kein Content-Kalender-SaaS, kein Login, kein Dashboard.
- Keine Kalenderbuchung als Pflichtschritt.
- Keine Pflichtfelder für Telefonnummer oder Budget.
- Keine Wiederverwendung der bestehenden Projektanfrage als versteckte Workflow-Anfrage.
- Keine Verarbeitung sensibler Kundendaten, vertraulicher Dokumente oder personenbezogener Daten Dritter.
- Kein Upload in V1; Beispiele werden als anonymisierte Textbeschreibung abgefragt.

## Positionierung

Die Landingpage verkauft keine einzelnen KI-Texte. Sie verkauft den Einstieg in einen wiederholbaren Content-Prozess:

> Beschreibe kurz, warum LinkedIn bei dir liegen bleibt. Wir prüfen, ob aus deinem vorhandenen Material ein
> wiederholbarer KI-Content-Workflow werden kann, und skizzieren dir einen passenden Mini-Pilot.

Der wichtigste Unterschied:

- Nicht: "Wir generieren dir kostenlos Posts."
- Sondern: "Wir prüfen, ob dein Content-Material und deine Arbeitsweise zu einem wiederholbaren Workflow taugen."

## Landingpage Content und UX

### Hero

Kerncopy:

- Mini-Eyebrow: "LinkedIn-Content-Workflow"
- Headline als Frage: "Kosten dich LinkedIn-Posts zu viel Zeit?"
- Subheadline: "Kostenloser Check für 5 Selbstständige: Wir prüfen, ob aus deinen Ideen ein wiederholbarer
  Content-Workflow werden kann."
- Primary CTA: "Content-Workflow prüfen"
- Secondary CTA: "Was du bekommst" nur auf Desktop/Tablet; Mobile zeigt nur den Primary CTA.
- Trust-Chips unter dem CTA: "Kostenloser Check", "Klare Workflow-Einschätzung".

Der Hero muss auf Mobile sofort Zielgruppe, Problem, Angebot und nächsten Schritt erklären. Genau eine H1 pro Seite.

### Geplante V1-Seitenstruktur

1. Hero mit konkreter Frage zu LinkedIn-Konsistenz.
2. Problem + Beispiele kombiniert: LinkedIn bleibt liegen, obwohl genug Fachwissen, Kundenfragen und Projektmaterial
   vorhanden wären.
3. Was du bekommst: Content-Workflow-Check mit kurzer Einschätzung, 1-2 Workflow-Ideen und Pilot-Empfehlung.
4. Pricing/Pilot-Frame: kostenloser Kurz-Check, Mini-Pilot ab 1.500 € netto, erweiterter Pilot 2.500-3.500 € netto,
   Ausbau ab 5.000 € netto.
5. Datenschutz-Hinweis: keine sensiblen Kundendaten, keine vertraulichen Dokumente; anonymisierte Beispiele reichen.
6. Final CTA mit kurzem Formular.

Die Seite soll schlank bleiben. Ablaufdetails wie "Material beschreiben, Workflow-Ideen erhalten, Pilot-Scope
entscheiden" werden als kurze 3-Schritt-Zeile geführt, nicht als große Erklärstrecke.

### Geeignete Beispiel-Inputs

- Kundenfragen, die wiederholt auftauchen.
- Projektlearnings oder Vorher-/Nachher-Erfahrungen.
- Sprachnotizen, Stichpunkte oder Entwürfe.
- Bestehende Website-, Angebots- oder Beratungsinhalte.
- Google-Business- oder LinkedIn-Posts aus der Vergangenheit.
- Wiederkehrende Themen, die wichtig wären, aber nicht regelmäßig formuliert werden.

### Output des kostenlosen Checks

Der Besucher erhält per E-Mail:

1. eine kurze Einschätzung, warum der aktuelle Content-Prozess hakt,
2. 1-2 konkrete Workflow-Ideen für wiederholbare LinkedIn-Posts,
3. eine Empfehlung, welcher kleine Pilot sinnvoll wäre,
4. eine grobe Einschätzung, welches Material oder welche Vorlagen dafür nötig wären,
5. einen klaren nächsten Schritt, falls der Prozess geeignet ist.

Nicht versprechen:

- fertige Automatisierung,
- unbegrenzte Post-Erstellung,
- garantierte Reichweite,
- vollautomatische Veröffentlichung,
- technische Umsetzung ohne Klärungsgespräch.

## Formularverhalten

### Pflichtfelder

- E-Mail
- Tätigkeit/Positionierung oder Website
- Was hält dich aktuell davon ab, regelmäßig auf LinkedIn zu posten?
- Woraus könnten bei dir Beiträge entstehen?
- Aktueller Ablauf inklusive grober Häufigkeit oder Zeitaufwand
- Consent/Datenschutz

### Optionale Felder

- Name
- gewünschter Output, z. B. Post-Entwurf, Hook-Ideen, Carousel-Struktur oder Themenliste
- verwendete Tools/Vorlagen
- anonymisiertes Beispiel als Freitext
- wichtigstes Ziel: sichtbarer werden, schneller posten, klarer formulieren, Vertrauen aufbauen, Leads vorbereiten

### Nicht im ersten Formular abfragen

- Pflicht-Telefonnummer
- Pflicht-Budget
- detaillierter Tool-Stack
- Uploads
- mehrere Kanäle gleichzeitig
- verbindliches Interesse an einem bezahlten Piloten

## Backend- und Contact-Architektur

### Request-Art

Neue Anfrageart:

```ts
workflow_check;
```

Diese wird als neuer `CONTACT_REQUEST_KIND` modelliert und nicht auf bestehende Projektanfragen gemappt.

### Server-seitige Verarbeitung

- Body an der HTTP-Grenze gegen ein eigenes Workflow-Check-DTO validieren.
- Rate-Limit und Payload-Limit der bestehenden Contact-Route weiterverwenden.
- Spam-/Honeypot-Logik beibehalten.
- Anfrage an neuen Command-Handler weiterreichen.
- Anfrage speichern und interne Mail-Notification versenden.
- Optionaler serverseitiger KI-Service erzeugt eine strukturierte Content-Workflow-Einschätzung.
- Bei KI-Fehlern geht die Lead-Anfrage nicht verloren; der Check wird als manuell nachzufassen markiert.

### KI-Workflow-Backend

Für V1 ist ein serverseitiger KI-gestützter Check vorgesehen, aber keine öffentliche KI-Spielwiese.

Strukturierte Ausgabe:

- Problemzusammenfassung des aktuellen Content-Prozesses,
- 1-2 Content-Workflow-Ideen,
- mögliche Input-Quellen,
- empfohlener Pilot-Scope,
- offene Rückfragen.

## SEO und Indexierbarkeit

- Eigene Metadata pro Locale.
- Canonicals:
  - `/de/services/ai-workflows`
  - `/en/services/ai-workflows`
- `alternates.languages` für DE/EN.
- OpenGraph-Texte aus Dictionaries.
- Service Structured Data aus locale-basierten Dictionaries oder typisierten Locale-Mappings.
- Interne crawlbare Verlinkung aus passenden Marketing-Bereichen.
- Sitemap/Robots prüfen.

Metadata-Title-Konvention: Unterseite als `Seitenthema | Invessiv`, z. B. `KI-Content-Workflows | Invessiv`.

## Tests

### Unit- und Integrationstests

- Route-Metadata für DE/EN inklusive Canonical und Alternates.
- Neue `SITE_ROUTES`-Konstante und locale path usage.
- Workflow-Check DTO/Zod-Validation:
  - required fields,
  - invalid email,
  - missing consent,
  - Honeypot/Spam,
  - Payload shape.
- Contact API Dispatch für `workflow_check`.
- Mapper/Persistenz-Input für Lead, Submission und Workflow-Check-Details.
- KI-Workflow-Service:
  - baut strukturierte Anfrage aus validierten Formularfeldern,
  - speichert strukturierte Auswertung,
  - behandelt KI-API-Fehler ohne Verlust der Lead-Anfrage.
- Mail-Template DE/EN enthält Content-Prozess, Materialquellen, Ziel, Datenschutzkontext und KI-Auswertung.
- Formular-Komponente:
  - Validation Errors,
  - Successful Submit State,
  - Submit Error State.

### E2E und Smoke

- `/de/services/ai-workflows` rendert.
- `/en/services/ai-workflows` rendert.
- Primary CTA scrollt zum Formular und fokussiert sinnvoll.
- Formular kann mit gültigen Daten abgesendet werden.
- Keyboard Navigation funktioniert.
- Fokuszustände sind sichtbar.
- Mobile Viewport ohne Textüberlauf oder überlappende UI.

## Akzeptanzkriterien

- Neue Route ist unter `/de/services/ai-workflows` und `/en/services/ai-workflows` erreichbar.
- Seite nutzt eigene Dictionaries für DE/EN.
- Keine sichtbaren UI-Texte inline in Page-Dateien oder Komponenten.
- Zielgruppe, Problem und Angebot sind konsistent auf Solo-Dienstleister mit LinkedIn-Content-Prozess ausgerichtet.
- Neue Formular-Anfrageart heißt `workflow_check`.
- Workflow-Check verwendet eigene DTOs und eigene serverseitige Validierung.
- Persistenz nutzt Lead + LeadSubmission + eigene Workflow-Check-Detaildaten.
- Upload ist in V1 nicht enthalten.
- KI-API-Keys, Prompt-Details und Auswertung bleiben ausschließlich im Backend.
- Bei KI-API-Fehlern geht die Lead-Anfrage nicht verloren.
- Keine Zweckentfremdung der Projektanfrage.
- Keine PII in Analytics-Payloads.
- SEO-Metadata, Canonical, Alternates und Service Structured Data sind vorhanden.
- Sitemap/Robots sind geprüft.
- Keine neue globale Section-CSS in `globals.css`.
- Keine URL-String-Konstruktion außerhalb zentraler Route-Konstanten/Helper.
- Dark Mode ist Default; Light Mode bleibt kompatibel.
- Mobile Layout ist ohne Überlauf und ohne überlappende UI nutzbar.

## Annahmen

- Die erste Kampagne fokussiert Solo-Dienstleister mit LinkedIn als primärem Kanal.
- Der kostenlose Check qualifiziert den Content-Prozess und bereitet einen Mini-Pilot vor.
- Kostenlos ist nur die Einschätzung, nicht die laufende Erstellung fertiger Posts.
- Bezahlte Mini-Piloten starten ab 1.500 € netto mit klar begrenztem Scope.
- Der erweiterte Pilot liegt bei 2.500-3.500 € netto.
- Ausbauprojekte starten ab 5.000 € netto.
- Die Route wird als indexierbare Marketing-Seite behandelt.
