# Abgelöst: Kontakt-Section und Projektanfrage

> Dieser Sammelplan wird nicht weiter umgesetzt. Die Arbeit ist in zwei unabhängig reviewbare Schritte aufgeteilt:
> [Teil 1: Kontakt-Frontend-Redesign](./contact-section-redesign.md) und
> [Teil 2: Projektanfrage-Stack entfernen](./remove-project-request-stack.md).
>
> Die Umbenennung aktiver Service-Keys (`landing`, `upgrade`, `web`) ist ausdrücklich nicht Teil von Teil 2, da sie auch
> die Services-Section und den LinkedIn-Generator betrifft. Sie benötigt einen separaten Refactor-Plan.

# Historischer Sammelplan: Kontakt-Section

## Context

Die Kontakt-Section ist die letzte Section der Startseite, die noch nicht überarbeitet wurde. Aktuell ist die Hierarchie
invertiert zum Geschäftsziel: Das dreistufige **Projektanfrage-Formular** (`project-request-form.tsx`, 1216 Zeilen)
dominiert die Section, während das **kostenlose Erstgespräch** nur als aufklappbarer Sekundär-Kanal neben "Kurze
Nachricht" versteckt ist.

Ziel: Das Erstgespräch (Calendly-Terminbuchung) wird die primäre Aktion, die Kurznachricht die sekundäre. Das
Projektanfrage-Formular entfällt vollständig — samt Backend, DB-Tabelle und den daran hängenden veralteten Konstanten.
Zusätzlich sind die Leistungs-Keys semantisch veraltet (`upgrade` heißt heute "Kompakte Website", `web` heißt "Business
Website") und werden projektweit durch sprechende Keys ersetzt.

**Kritischer Nebenaspekt:** Jede Formular-Absendung legt einen Lead im CRM (`apps/workspace`) an. Der Umbau darf diesen
Pfad nicht brechen.

### Vorab geprüfte Fakten (Ergebnis der Analyse)

| Frage                                                        | Befund                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nutzt das CRM die Projektanfrage-Details?                    | **Nein.** `apps/workspace/src/server/workspace/leads/query-handler/get-lead-by-id.query-handler.ts` joint nur `leads`, `lead_categories`, `lead_social_profiles`, `lead_activities`, `lead_submissions` — kein Join auf `lead_project_requests`. Alle Spezialfelder sind Schreiben-ohne-Lesen. |
| Teilt `apps/workspace` UI-Komponenten mit `apps/web`?        | **Nein.** `shared/form/**` und `shared/button/**` existieren in beiden Apps als **unabhängige Kopien** (Copy&Paste, kein Querimport). `packages/ui` enthält nur `CustomSelect`, das die Kontakt-Section nicht nutzt.                                                                           |
| Was koppelt beide Apps wirklich?                             | Ausschließlich `packages/common/src/constants/contact/**` + `packages/db`. Vom Workspace genutzt: `ContactLeadStatus`, `CONTACT_REQUEST_KIND`, `LeadSource`, `LeadActivityType`.                                                                                                               |
| Verschickt der Erstgespräch-Flow eine Benachrichtigungsmail? | **Nein.** `submit-discovery-call.command-handler.ts` ruft `sendMail` nicht auf — im Gegensatz zu Quick-Contact und Projektanfrage. Lücke, die mit der Beförderung zur Primärkonversion geschlossen wird.                                                                                       |
| Gibt es Discovery-Call-Infrastruktur?                        | **Ja, vollständig**: DTO, Zod-Schema, Validation-Service, Command-Handler, Mapper, `persistDiscoveryCallLead`, Tabelle `lead_call_contacts`, Calendly-Prefill, Analytics-Events. Wird erweitert, nicht neu gebaut.                                                                             |
| Ist die Section woanders eingebunden?                        | **Nein.** `ContactSection` wird nur in `home-page.tsx` gerendert. Es gibt keine `/contact`-Route.                                                                                                                                                                                              |
| Landingpage & LinkedIn-Seite betroffen?                      | **Nein.** Beide nutzen `FinalCtaSection` (`apps/web/src/components/shared/final-cta-section/`), die gegen `submitQuickContact` sendet und ein **Freitext-Feld** `CONTACT_FORM_FIELD_NAME.Goal` verwendet — **nicht** `CONTACT_GOAL_KEYS`. Keine Abhängigkeit zum Projektanfrage-Stack.         |
| Production-Daten vor der Migration                           | **Bestätigt leer.** Es gibt weder `lead_project_requests`-Zeilen noch `lead_submissions` mit `channel = 'project_request'`. Die Tabelle darf entfernt werden.                                                                                                                                  |

---

## Entscheidungen (bestätigt)

1. Projektanfrage **vollständig** entfernen inkl. `DROP TABLE lead_project_requests` (im CRM liegen noch keine Anfragen
   über diese Seite).
2. Projektrahmen: **neue DB-Spalte** auf `lead_call_contacts` **+ eigenes Calendly-Feld `a2`**.
3. Neue Keys: `landing_page`, `compact_website`, `business_website` + `unsure` (Default). Alte Keys entfallen
   projektweit.
4. Telefon (optional) im Erstgespräch-Formular; Textlink zur Kurznachricht am Ende des Primärformulars; Bild als
   Sticky-Spalte auf Desktop.
5. Benachrichtigungsmail für Erstgespräche ergänzen.
6. Services-Section auf neue Keys umstellen, Karte "Wartung & Support" entfernen, toten Event-Dispatch im
   LinkedIn-Generator entfernen.
7. `suit-1.jpeg` wird vorerst als Platzhalter genutzt (nur 238×318 px) und später gegen eine hochauflösende Version
   getauscht.
8. Kein Workspace-Feature in diesem Branch: Projektrahmen und Call-Nachricht werden gespeichert, aber noch nicht im CRM
   angezeigt. Als separaten CRM-Follow-up dokumentieren; vor einer Workspace-Änderung erneut abstimmen.

---

## Design

**Leitidee:** Ein einziger Blickfang — die Terminkarte. Links eine hochkant stehende Portrait-Spalte (auf Desktop
sticky), rechts das Buchungsformular. Alles andere bleibt ruhig. Der Projektrahmen wird als Chip-Reihe gesetzt, die die
Chips der Services-Section visuell zitiert: Wer oben eine Leistung gewählt hat, erkennt die Auswahl wieder — und die
Vorauswahl wird per Event übernommen.

**Was bewusst nicht passiert:** Kein neues Farbsystem, keine neue Typo-Ebene, keine zusätzliche Animation über den
bestehenden `useStaggeredSectionReveal` hinaus. Die Section soll konvertieren, nicht auffallen. Bestehende Tokens:
`--color-cta`, `--accent`, `--color-surface-1/2`, `--color-border`, `--font-size-section-title`, Light-Theme über
`:global([data-theme="light"])`.

### Layout (Desktop ≥ 1100 px)

```
┌───────────────────────────────────────────────────────────────┐
│  Kostenloses Erstgespräch                              (h2)   │
│  30 Minuten, unverbindlich. …                       (intro)   │
├──────────────────┬────────────────────────────────────────────┤
│ ┌──────────────┐ │ ┌────────────────────────────────────────┐ │
│ │              │ │ │ Name *            │ E-Mail *           │ │
│ │   Portrait   │ │ ├────────────────────────────────────────┤ │
│ │   (sticky)   │ │ │ Telefon (optional)                     │ │
│ │              │ │ ├────────────────────────────────────────┤ │
│ └──────────────┘ │ │ Projektrahmen *                        │ │
│  Moritz Hecht    │ │ [Landingpage][Kompakt][Business]       │ │
│  Invessiv        │ │ [Noch unsicher ✓]                      │ │
│                  │ ├────────────────────────────────────────┤ │
│  ✓ 30 Minuten    │ │ Worum geht es? (optional)              │ │
│  ✓ Unverbindlich │ │ [           textarea            ]      │ │
│  ✓ Klarer        │ ├────────────────────────────────────────┤ │
│    nächster      │ │ ☐ Datenschutz *                        │ │
│    Schritt       │ │ * Pflichtfelder                        │ │
│                  │ │ [   Weiter zur Terminauswahl   ]       │ │
│                  │ │ Noch nicht bereit? → Kurze Nachricht   │ │
│                  │ └────────────────────────────────────────┘ │
├──────────────────┴────────────────────────────────────────────┤
│  ▸ Lieber erst eine kurze Frage stellen?        (disclosure)  │
│    └ [Name *][E-Mail *][Nachricht *][☐ DS *][Nachricht senden]│
└───────────────────────────────────────────────────────────────┘
```

**Mobile (< 760 px):** Portrait als kompakte Karte über dem Formular (nicht sticky, `prefers-reduced-motion`-neutral),
Formular volle Breite, Disclosure darunter. Sticky-Verhalten erst ab 1100 px via `@media`.

### Copy (verdichtet — "auf den Punkt, was passiert")

Der bisherige Text ist zu wortreich (`subtitle` + `intro` + `detailPoints` sagen dreimal dasselbe). Neu:

| Element               | DE                                                                                                | EN                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Section-Titel         | Kostenloses Erstgespräch                                                                          | Free intro call                                                                          |
| Intro                 | 30 Minuten, unverbindlich. Du bekommst eine klare Einschätzung zu Umfang, Ablauf und Preisrahmen. | 30 minutes, no strings attached. You get a clear read on scope, process and price range. |
| Formular-Hinweis      | Nach dem Absenden öffnet sich die Terminauswahl — deine Angaben sind dort schon eingetragen.      | After you send this, the booking calendar opens with your details already filled in.     |
| Submit                | Weiter zur Terminauswahl                                                                          | Continue to booking                                                                      |
| Projektrahmen-Label   | Projektrahmen                                                                                     | Project scope                                                                            |
| Optionen              | Landingpage · Kompakte Website · Business Website · Noch unsicher                                 | Landing page · Compact website · Business website · Not sure yet                         |
| Nachricht (optional)  | Worum geht es? (optional)                                                                         | What's it about? (optional)                                                              |
| Textlink unten        | Noch nicht bereit für einen Termin? Kurze Nachricht schreiben                                     | Not ready to book? Send a short message instead                                          |
| Disclosure-Trigger    | Lieber erst eine kurze Frage stellen?                                                             | Rather ask a quick question first?                                                       |
| Kurznachricht-Hinweis | Antwort in der Regel innerhalb von 24 Stunden.                                                    | Usually answered within 24 hours.                                                        |
| Submit Kurznachricht  | Nachricht senden                                                                                  | Send message                                                                             |

`* Pflichtfelder`-Hinweis und blaue Sterne bleiben unverändert (`FormRequiredMarker`, `--color-cta`).

**Projektrahmen ist Pflichtfeld mit vorausgewähltem `unsure`** — der blaue Stern bleibt konsistent zur Konvention, der
Besucher hat aber null Reibung.

---

## Umsetzung

### Phase 1 — Neue Projektrahmen-Konstante

**Neu:** `packages/common/src/constants/contact/contact-project-scopes.ts`

```ts
export const CONTACT_PROJECT_SCOPE = {
  BusinessWebsite: "business_website",
  CompactWebsite: "compact_website",
  LandingPage: "landing_page",
  Unsure: "unsure",
} as const;

// Reihenfolge = Anzeigereihenfolge im Formular; Unsure zuletzt.
export const CONTACT_PROJECT_SCOPES = [
  CONTACT_PROJECT_SCOPE.LandingPage,
  CONTACT_PROJECT_SCOPE.CompactWebsite,
  CONTACT_PROJECT_SCOPE.BusinessWebsite,
  CONTACT_PROJECT_SCOPE.Unsure,
] as const;

// Die drei Leistungen der Services-Section (ohne Unsure).
export const CONTACT_SERVICE_SCOPES = [
  CONTACT_PROJECT_SCOPE.LandingPage,
  CONTACT_PROJECT_SCOPE.CompactWebsite,
  CONTACT_PROJECT_SCOPE.BusinessWebsite,
] as const;

export type ContactProjectScope = (typeof CONTACT_PROJECT_SCOPES)[number];
export type ContactServiceScope = (typeof CONTACT_SERVICE_SCOPES)[number];
```

- `contact-project-scopes.test.ts` (Werte-Liste stabil, `CONTACT_SERVICE_SCOPES ⊂ CONTACT_PROJECT_SCOPES`, `Unsure`
  nicht enthalten) — vorgeschrieben in `apps/web/common/AGENTS.md`.

**Gelöscht** (nur vom Projektanfrage-Formular genutzt, per Grep verifiziert):
`packages/common/src/constants/contact/contact-offer-keys.ts`, `contact-goal-keys.ts`, `contact-budget-keys.ts`,
`contact-page-keys.ts`, `contact-start-keys.ts`, `contact-workflow-keys.ts`,
`packages/common/src/contracts/contact/keys/contact-option-keys.ts`,
`apps/web/common/constants/marketing/contact-offer-groups.ts` (+ `.test.ts`).

`apps/web/common/contracts/marketing/primary-service-key.ts` wird gegen `CONTACT_SERVICE_SCOPES` neu typisiert.

### Phase 2 — DB-Migration

**Neu:** `packages/db/migrations/0020_discovery_call_scope_drop_project_requests.sql`

```sql
ALTER TABLE lead_submissions DROP CONSTRAINT IF EXISTS lead_submissions_channel_check;
--> statement-breakpoint
ALTER TABLE lead_submissions
    ADD CONSTRAINT lead_submissions_channel_check
        CHECK (channel IN ('quick_contact', 'discovery_call'));
--> statement-breakpoint
ALTER TABLE lead_call_contacts
    ADD COLUMN phone text;
--> statement-breakpoint
ALTER TABLE lead_call_contacts
    ADD COLUMN project_scope text;
--> statement-breakpoint
ALTER TABLE lead_call_contacts
    ADD CONSTRAINT lead_call_contacts_project_scope_check
        CHECK (project_scope IS NULL OR project_scope IN
                                        ('landing_page', 'compact_website', 'business_website', 'unsure'));
--> statement-breakpoint
DROP TABLE IF EXISTS lead_project_requests;
```

`project_scope` bleibt **nullable**, damit Altzeilen gültig bleiben und ein späterer Locale-/Feld-Umbau nicht blockiert.
Muster folgt Migration `0010` (nullable + CHECK statt NOT NULL mit Backfill).

> **Vor dem Ausrollen prüfen:** `SELECT count(*) FROM lead_submissions WHERE channel = 'project_request';` und
> `SELECT count(*) FROM lead_project_requests;`. Beide Abfragen wurden für Production mit `0` bestätigt. Falls eine
> Abfrage künftig einen Wert > 0 liefert, Migration nicht ausrollen, Daten sichern und zuerst entscheiden, ob sie
> migriert
> oder bewusst entfernt werden. Der Channel-CHECK wird vor dem Table-Drop gesetzt, damit ein unerwarteter Alt-Datensatz
> den destruktiven Schritt verhindert. Migrationen laufen **ohne** umschließende Transaktion (autocommit pro Statement,
> siehe `run-migrations.ts`) — bei Abbruch also Teilzustand prüfen.

**Schema-Anpassung:** `packages/db/src/record-configuration/lead-call-contacts.ts` bekommt
`phone: text("phone")` und `project_scope: text("project_scope", { enum: CONTACT_PROJECT_SCOPES })`.

**Gelöscht:** `packages/db/src/record-configuration/lead-project-requests.ts`,
`packages/db/src/contact/persist-project-request.ts`,
`packages/db/src/contracts/contact/project-request-persist-input.ts`,
`packages/db/src/contracts/contact/contact-lead-project-request-persist-record.ts` — plus Registrierung in
`record-configuration/index.ts`.

`packages/db/scripts/seed-leads-fixture.ts` wird bereinigt (nutzt aktuell `CONTACT_OFFER_KEY`, `CONTACT_GOAL_KEY`,
`CONTACT_BUDGET_KEY`, `CONTACT_START_KEY`, `CONTACT_WORKFLOW_KEY` und `lead_project_requests`).

### Phase 3 — Contracts, Server, Client

**Erweitert:**

- `packages/common/src/contracts/contact/discovery-call/save-discovery-call-dto.ts`: `+ phone?: string`,
  `+ projectScope: ContactProjectScope`
- `packages/common/src/contracts/contact/forms/discovery-call-form-values.ts`: `+ phone: string`,
  `+ projectScope: ContactProjectScope`
- `packages/common/src/defaults/contact/discovery-call-form-values.ts`: `phone: ""`,
  `projectScope: CONTACT_PROJECT_SCOPE.Unsure`
- `packages/db/src/contracts/contact/contact-lead-call-persist-record.ts`: `+ phone`, `+ project_scope`
- `apps/web/src/server/contact/validation/discovery-call/discovery-call.schema.ts`: `+ phone: optionalTrimmedString`,
  `+ projectScope: z.enum(CONTACT_PROJECT_SCOPES)`
- `apps/web/src/server/contact/mapper/contact-lead-mapper-service.ts` → `mapDiscoveryCallDtoToDbPersistInput`: `phone`
  an den Lead (Spalte `leads.phone` existiert), `phone` + `project_scope` an `call_contact`
- `packages/db/src/contact/persist-discovery-call.ts`: neue Spalten im Insert
- `packages/db/src/contact/shared/shared-lead-submission.ts`: Beim E-Mail-Upsert optionale leere Werte nicht mehr gegen
  bestehende CRM-Daten schreiben. `phone` und `notes` bleiben erhalten, wenn der neue Submit dafür keinen nichtleeren
  Wert enthält; ein vorhandener Lead verliert so durch ein Calendly-Formular ohne Nachricht/Telefon keine Daten.
- `apps/web/src/server/contact/handlers/submit-discovery-call.command-handler.ts`: Mailversand ergänzen, **exakt nach
  dem Muster von `submit-quick-contact.command-handler.ts`** — inneres `try/catch`, Fehler nur geloggt
  (`CONTACT_SUBMIT_LOG_PREFIX.DiscoveryCall` + `MailDeliveryFailed`), blockiert die Erfolgsantwort nicht.

**Neu:**

- `apps/web/src/server/services/mail/templates/discovery-call-notification.ts` (+ Test) — analog
  `quick-contact-notification.ts`; rendert Name, E-Mail, Telefon, Projektrahmen (lokalisiertes Label, Fallback =
  Rohwert), Nachricht. `escapeHtml`/`sanitizeLine` aus `template-utils.ts` verwenden.
- `apps/web/src/i18n/dictionaries/mail/discovery-call-notification/{de,en}.json` + Registrierung im
  Mail-Dictionary-Index.

**Client:**

- `apps/web/src/client/contact/mappers/map-discovery-call-form-to-dto.ts`: neue Felder durchreichen.
- `apps/web/src/client/contact/services/contact-form-service.ts`:
  - `createCalendlyPrefillHref` erhält `projectScopeLabel` und schreibt es nach `a2` (`projectScopeAnswerSlot = 2`,
    konfigurierbar über `CalendlyPrefillOptions`). `a1` bleibt die Nachricht. Leerer Label → `a2` wird gelöscht statt
    leer gesetzt (analog zur bestehenden `a1`-Logik).
  - **Architektur-Gate:** Die Datei exportiert derzeit freie Funktionen; `apps/web/src/client/AGENTS.md` verlangt ein
    benanntes Service-Objekt. Da wir sie ohnehin anfassen: Konsolidierung zu
    `contactFormService = { submitQuickContact, submitDiscoveryCall, createCalendlyPrefillHref }`, Aufrufer umstellen
    (`discovery-call-form.tsx`, `quick-contact-form.tsx`, `final-cta-section.tsx`).
- `packages/common/src/contracts/contact/options/calendly-prefill-options.ts`: `+ projectScopeLabel?`,
  `+ projectScopeAnswerSlot?`

**Gelöscht:**
`apps/web/src/client/contact/mappers/map-project-request-form-to-dto.ts`,
`apps/web/src/server/contact/handlers/submit-project-request.command-handler.ts`,
`apps/web/src/server/contact/validation/project-request/` (kompletter Ordner),
`apps/web/src/server/services/mail/templates/contact-notification.ts` (+ `.test.ts`),
`apps/web/src/i18n/dictionaries/mail/contact-notification/`,
`packages/common/src/contracts/contact/project-request/`,
`packages/common/src/contracts/contact/forms/project-request-form-values.ts`,
`packages/common/src/defaults/contact/project-request-form-values.ts`,
`packages/common/src/contracts/contact/options/map-project-request-form-to-dto-options.ts`,
`CONTACT_REQUEST_KIND.ProjectRequest` aus `contact-request-kind.ts` + Dispatch-Zweig in
`apps/web/src/app/api/public/contact/route.ts`,
`apps/web/src/server/services/mail/mappers/map-contact-to-mail.ts` und `CONTACT_SUBMIT_LOG_PREFIX.ProjectRequest`.

> Der Workspace-Dictionary-Key `activity.channels.project_request`
> (`apps/workspace/src/i18n/dictionaries/workspace/leads/detail/{de,en}.json`) wird mit entfernt. Der dort ebenfalls
> vorhandene Key `linkedin_post_delivery` ist bereits heute nicht Teil von `CONTACT_REQUEST_KINDS` — unangetastet
> lassen,
> das ist ein separater Fund.

### Phase 4 — Komponenten

Zielstruktur unter `apps/web/src/components/marketing/home/sections/contact-section/`:

```
contact-section.tsx / .module.css / .test.tsx      ← orchestriert, "use client"
discovery-call-form/                               ← umbenannt aus discovery-call-panel/
  discovery-call-form.tsx / .module.css / .test.tsx
  project-scope-field/
    project-scope-field.tsx / .module.css
contact-portrait-card/
  contact-portrait-card.tsx / .module.css          ← Server-Component (next/image, kein State)
quick-contact-disclosure/
  quick-contact-disclosure.tsx / .module.css
quick-contact-form/                                ← bleibt, Copy entschlackt
shared/                                            ← unverändert weiterverwendet
  contact-form-primitives.module.css
  contact-form-shell/ contact-helper-list/
  contact-identity-fields/ contact-message-field/
```

**`contact-section.tsx`** — deutlich schlanker als heute:

- Zwei-Spalten-Grid: `ContactPortraitCard` + `DiscoveryCallForm`, darunter `QuickContactDisclosure`.
- Der bestehende Button-Grid für "Kanäle" (`contactChannels`, `selectedChannelIndex`, `CONTACT_CHANNEL_MODES`)
  **entfällt** — es gibt nur noch einen Primär- und einen Sekundärpfad.
- Der `hashchange`/Document-Click-Listener auf `CONTACT_EMAIL_SECTION_HREF` (`#contact-email`) **bleibt erhalten**,
  steuert jetzt aber das Öffnen der `QuickContactDisclosure`. Wird von `qna-contact-cta.tsx` (FAQ-Section) genutzt —
  nicht brechen.
- `useStaggeredSectionReveal(sectionRef, title)` ergänzen, damit die Section zu den übrigen modernisierten Sections
  passt (sie hat aktuell als einzige keinen Reveal-Hook). `data-reveal-item` auf Header, Portrait, Formular, Disclosure.
- `contactSecondaryCta` ("Leistungsmodelle vergleichen") entfällt — der Textlink zur Kurznachricht ersetzt ihn.

**`project-scope-field.tsx`** — echte `input type="radio"`-Gruppe, visuell als Chips gestaltet, mit Fieldset/Legend und
`FormFieldLabel` mit `required`. Native Radios liefern die erwartete Pfeiltasten-Navigation ohne selbst gebaute
Roving-Tabindex-Logik. Visuell an `services-section.module.css` `.serviceChip` angelehnt, aber eigenes scoped Modul
(keine geteilten globalen Klassen).

**`contact-portrait-card.tsx`** — statischer Import
`import portraitPhoto from "../../../../../../assets/home/suit-1.jpeg";`
(relativer Pfad, wie in `home-hero-photo.tsx`; kein Alias vorhanden). `next/image` mit expliziten `width`/`height` statt
`fill`, weil die Quelle klein ist — so wird nicht hochskaliert. `sizes` gesetzt, `loading="lazy"`. Enthält Name, Rolle
und drei Scan-Punkte (aus dem Dictionary, nicht inline).

> **Bild-Follow-up:** `suit-1.jpeg` ist 238×318 px. Die Karte wird auf max. ~260 px Anzeigebreite begrenzt, damit es
> nicht sichtbar hochskaliert. Sobald eine höher aufgelöste Version als `apps/web/assets/home/suit-portrait.jpeg`
> (Ziel: ≥
> 800×1100, Hochformat) vorliegt, genügt der Austausch des Imports plus Anhebung der `max-width` in
> `contact-portrait-card.module.css`.

**`quick-contact-disclosure.tsx`** — Details/Summary-artiges Aufklappen (kein `<details>`, damit Animation und
`aria-expanded` kontrollierbar bleiben). `contact-section.tsx` ist der einzige Owner des Öffnungszustands und
verarbeitet sowohl Klick als auch `#contact-email`; nach dem Öffnen setzt ein übergebener Ref den Fokus auf das
Namensfeld der Kurznachricht.

**Telefonfeld im Erstgespräch:** Eigenes optionales `type="tel"`-Feld in `discovery-call-form/`, mit
`autoComplete="tel"`, Dictionary-Copy in DE/EN und derselben maximalen Länge wie die Server-Validierung. Das Feld bleibt
außerhalb von `ContactIdentityFields`, damit Name/E-Mail weiterhin unverändert von beiden Formularen geteilt werden.

**Vorauswahl aus der Services-Section:** `DiscoveryCallForm` hört auf `PROJECT_OFFER_CHANGE_EVENT`
(`apps/web/common/constants/marketing/project-offer-change-event.ts`) und setzt daraus `projectScope`.
`ProjectOfferSyncDetail` wird zu `{ projectScope?: ContactProjectScope; displayName?: string; email?: string }`
verschlankt (`offerKey`/`projectGoal` entfallen). Damit übernimmt das neue Formular exakt die Kopplung, die bisher
`project-request-form.tsx` hatte — die Services-Section behält ihren Nutzen.

**Gelöscht:** `project-request-form/` (kompletter Ordner: `.tsx` 1216 Zeilen, `.module.css` 354 Zeilen, `.test.tsx`),
`discovery-call-panel/` (geht in `discovery-call-form/` auf).

**Architektur-Gate (mit erledigen):** `contact-identity-fields.tsx` exportiert aktuell den Typ
`ContactIdentityFieldsValues` aus einer Komponenten-Datei — verstößt gegen `apps/web/src/components/AGENTS.md`.
Verschieben nach `packages/common/src/contracts/contact/fields/contact-identity-fields-values.ts`. (Der zweite Verstoß,
`export type ContactFormCopy` in `project-request-form.tsx`, verschwindet mit der Löschung.)

### Phase 5 — Services-Section & Aufräumen

- `services-section.tsx`: `PRIMARY_SERVICE_ORDER` → `CONTACT_SERVICE_SCOPES`, `DEFAULT_SERVICE_KEY` →
  `CONTACT_PROJECT_SCOPE.LandingPage`. Event-Dispatch sendet `projectScope` statt `offerKey`/`projectGoal`.
- `home-page.tsx`: Der Block, der `contactFormOffers` aus `[landing, maintenance]` baut und bei fehlenden Karten `throw`
  t (Zeilen ~195–225), entfällt komplett. `serviceDetailHrefs={{ landing: … }}` → `{ landing_page: … }`.
- `apps/web/src/i18n/dictionaries/marketing/home.ts`: Karten-Keys `landing`/`upgrade`/`web` → `landing_page`/
  `compact_website`/`business_website` in **DE und EN**. Karte `maintenance` entfernen (DE + EN),
  `SecondaryServiceCardKey` entfällt. Kompletter `contactForm`-Copy-Block (≈70 Keys) entfällt; `discoveryCallForm` und
  `quickContactForm` werden nach obiger Copy-Tabelle neu gefasst; `contactChannels` und `contactSecondaryCta` entfallen.
- `apps/web/src/i18n/dictionaries/marketing/home-ui.de.json` / `.en.json`: `servicesIntentOptions[].serviceKey` auf neue
  Keys; `servicesPrimaryCtaLabels` neu keyen; ggf. `maintenance`-Einträge entfernen.
- `apps/web/src/config/navigation/home.ts`: `CONTACT_CHANNEL_MODES` + `ContactChannelMode` entfallen (nur von der alten
  Kanal-Umschaltung genutzt). `CONTACT_EMAIL_SECTION_HREF` **bleibt**.
- `apps/web/src/i18n/get-dictionary.ts`: das alte `mail/contact-notification`-Import durch
  `mail/discovery-call-notification` ersetzen und den resultierenden Mail-Block wie bisher mit dem
  Quick-Contact-Mail-Dictionary zusammenführen.
- `generator-section.tsx` (LinkedIn): `PROJECT_OFFER_CHANGE_EVENT`-Dispatch mit `offerKey: CONTACT_OFFER_KEY.Process`
  entfernen — auf der LinkedIn-Seite läuft `FinalCtaSection`, dort hört niemand auf das Event; der Dispatch ist bereits
  heute wirkungslos.
- `public/services/*.svg`: Icon-Dateinamen prüfen und auf die neuen Keys ausrichten, falls sie referenziert werden
  (`iconSrc` im Dictionary).
- `apps/web/deletable/` enthält nur Notizen und WhatsApp-Bilder — separat aufräumen, nicht Teil dieses Umbaus.

**Nicht anfassen:** `FinalCtaSection` und der gesamte Landingpage-/LinkedIn-Funnel. Sie nutzen `submitQuickContact` und
das Freitextfeld `CONTACT_FORM_FIELD_NAME.Goal` — keine Berührung mit dem Projektanfrage-Stack. Nur der Aufrufer wird
auf `contactFormService` umgestellt (Phase 3).

### Phase 6 — Tests

**Anzupassen / neu:**

- `apps/web/src/app/api/public/contact/route.test.ts`: `project_request`-Fälle entfernen, Discovery-Call-Fälle um
  `projectScope`/`phone` und um "Mail-Fehler blockiert Erfolg nicht" erweitern.
- `apps/web/src/server/contact/mapper/contact-lead-mapper-service.test.ts`: Projektanfrage-Fälle raus,
  Discovery-Call-Mapping mit neuen Feldern rein.
- `apps/web/src/client/contact/services/contact-form-service.test.ts`: `a2`-Prefill (gesetzt / bei leerem Label
  gelöscht), Service-Objekt-Aufrufe.
- **Neu** `discovery-call-form.test.tsx`: Pflichtfeld-Fehler (Name, E-Mail, Consent), `projectScope`-Default `unsure`,
  Chip-Auswahl, Vorauswahl per `PROJECT_OFFER_CHANGE_EVENT`, Textlink öffnet die Disclosure.
- **Neu** `quick-contact-disclosure.test.tsx`: Öffnen per Klick und per `#contact-email`-Hash.
- `contact-section.test.tsx`: auf neue Struktur umschreiben.
- **Neu** `discovery-call-notification.test.ts` (Mail-Template).
- **Neu** `contact-project-scopes.test.ts`.
- `apps/web/e2e/contact-lead-persistence.e2e.ts`: SQL-Join auf `lead_project_requests` → `lead_call_contacts`; Flow
  bucht jetzt ein Erstgespräch. Calendly-Redirect im Test abfangen (`page.context().on("page", …)` oder
  Route-Interception), damit der Test nicht auf calendly.com landet.
- `services-localization.e2e.ts` prüfen — referenziert vermutlich die alten Service-Keys.
- `apps/web/src/server/services/mail/templates/contact-notification.test.ts` löschen.
- `apps/web/src/server/services/mail/mappers/map-contact-to-mail.ts` löschen; nach dem Entfernen darf kein Import des
  alten Templates, der alten Projektanfrage-DTOs oder von `CONTACT_SUBMIT_LOG_PREFIX.ProjectRequest` verbleiben.

---

## Verifikation

Reihenfolge beim Ausführen:

1. **Statisch:** `pnpm -r typecheck` — der Compiler ist hier das schärfste Werkzeug. Das Entfernen von
   `CONTACT_OFFER_KEY` & Co. erzeugt Fehler an **jeder** verbliebenen Fundstelle; erst wenn `typecheck` grün ist, ist
   der Tot-Code-Schnitt vollständig. Danach `pnpm -r lint`.
2. **Unit/Integration:** `pnpm -r test`.
3. **DB:** `pnpm --filter @invessiv/db db:migrate:dev`, danach `db:smoke:dev`. Vorher die `project_request`-Zählabfrage
   aus Phase 2 ausführen.
4. **Build:** `pnpm --filter @invessiv/web build` und `pnpm --filter @invessiv/workspace build` (der Workspace-Build
   beweist, dass die `packages/common`-Änderungen ihn nicht brechen).
5. **End-to-End manuell** gegen die lokale App:
   - Erstgespräch absenden → Lead landet in `leads` + `lead_submissions` (`channel = 'discovery_call'`) +
     `lead_call_contacts` mit `project_scope` und `phone`; Calendly öffnet sich mit `name`, `email`, `a1` (Nachricht),
     `a2` (Projektrahmen); Benachrichtigungsmail kommt an.
   - Lead im Workspace-CRM öffnen (`/leads`) → Name, E-Mail, optionales Telefon und der Timeline-Eintrag "Erstgespräch"
     sind sichtbar. Projektrahmen und Call-Nachricht bleiben in diesem Branch bewusst nur gespeichert; ihre Anzeige ist
     ein separater CRM-Follow-up.
   - Kurznachricht absenden → `channel = 'quick_contact'`, `lead_email_contacts` befüllt, Mail kommt an.
   - Landingpage `/services/landing-page` und `/services/linkedin-post` absenden → weiterhin funktionsfähig.
   - Services-Section: Leistung wählen → Projektrahmen im Erstgespräch-Formular ist vorausgewählt.
   - FAQ-CTA (`#contact-email`) → Kurznachricht klappt auf und bekommt Fokus.
6. **A11y/Responsive-Smoke:** 360 px / 768 px / 1440 px; Tastaturnavigation durch beide Formulare inkl. Chip-Gruppe
   (Pfeiltasten im `radiogroup`); sichtbare Focus-States; Dark und Light; `prefers-reduced-motion` respektiert.

## Manuelle Schritte außerhalb des Codes

- **Calendly:** Im Event `service-invessiv-cxf5/30min` eine **zweite** eigene Frage anlegen (z. B. "Projektrahmen").
  Ohne diese Frage wird der `a2`-Parameter von Calendly stillschweigend ignoriert — der Wert steht dann trotzdem im CRM,
  fehlt aber im Termin.
- **Bild:** hochauflösende Version des Anzugfotos als `apps/web/assets/home/suit-portrait.jpeg` nachreichen.

## Risiko & Rollback

| Risiko                                                                  | Abfederung                                                                                                                                                                                                  |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DROP TABLE lead_project_requests` ist irreversibel                     | Bestätigt: keine Anfragen im CRM. Vorab-Zählabfrage in Phase 2 als Sicherung.                                                                                                                               |
| CHECK-Rewrite auf `lead_submissions.channel` schlägt bei Altzeilen fehl | Fehler ist laut und blockierend, nicht still. Migration läuft ohne Transaktion — bei Abbruch Teilzustand prüfen und gezielt nachziehen.                                                                     |
| Calendly-Frage 2 fehlt                                                  | `a2` wird ignoriert; der Projektrahmen ist trotzdem in `lead_call_contacts.project_scope` und in der Benachrichtigungsmail. Kein Datenverlust.                                                              |
| Workspace-Build bricht durch `packages/common`-Änderungen               | Workspace nutzt nur `ContactLeadStatus`, `CONTACT_REQUEST_KIND`, `LeadSource`, `LeadActivityType`. Betroffen ist ausschließlich der Wegfall von `ProjectRequest` — Schritt 4 der Verifikation deckt das ab. |
| Projektrahmen/Nachricht sind im CRM noch nicht sichtbar                 | Bewusst kein Workspace-Feature in diesem Branch. Daten liegen pro Erstgespräch in `lead_call_contacts`; Darstellung als separaten CRM-Follow-up planen und vor Beginn erneut abstimmen.                     |
| Rollback                                                                | Code über `git revert` des Feature-Branch. DB: `lead_project_requests` müsste aus Migration `0002` neu angelegt werden — deshalb der Vorab-Check statt eines Backups.                                       |
