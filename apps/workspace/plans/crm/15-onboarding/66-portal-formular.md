# Task 66 — Portal-Formular: Rahmen, einfache Felder, Autosave, Absenden

> **Vor dem Start lesen:** [`README.md`](./README.md), [`63-datenmodell-und-regeln.md`](./63-datenmodell-und-regeln.md)
> (Tabellen, `getOnboardingCompleteness`, `validateOnboardingValue`, `resolveOnboardingText`),
> [`65-bogen-anlegen-und-anpassen.md`](./65-bogen-anlegen-und-anpassen.md) (`OnboardingFormDto`, Read-Service),
> `../00-entscheidungen.md`, `../AGENTS.md`, scoped `AGENTS.md` unter `src/components/portal/`,
> `src/server/portal/`, `src/client/`, `src/hooks/`.

> **Status:** offen · **Teil-PR:** 15.4 · **Branch:** `feat/crm-onboarding-4-portal-form`
> **Abhängigkeiten:** Task 65 (15.3) gemerged · **Aufwand:** 3 T. · **Dateien:** 80–100
> **Migration:** keine

## Ziel

Die Portal-Seite, auf der ein Kunde seinen Bogen über mehrere Tage ausfüllt: ein Block je Schritt, Autosave je Feld,
Bedingungen und Fortschritt live, Absenden mit Sprung zu fehlenden Pflichtfeldern, Leseansicht danach. Dieser Task
liefert den **Rahmen und die einfachen Feldtypen** (`short_text`, `long_text`, `email`, `phone`, `url`, `choice`,
`multi_choice`, `yes_no`). Gruppen, Dateien, Projektleistungen, Bestätigung, Farbe und Skala folgen in Task 67.

Intern kommt der Tab **„Antworten“** auf der Bogenseite dazu (nur lesend, gemeinsame Lese-Renderer mit dem Portal).

**Sichtbarkeit nach dem Merge:** Für Kunden nichts. Es gibt noch keine Aktion „Freigeben“ (Task 67), also keinen Bogen
außer `draft`; die Portal-Seite liefert für `draft` 404. Kein Navigationseintrag, kein Widget (beides Task 67). Tests
und Seed arbeiten mit direkt freigegebenen Bögen.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routen                  | `/portal/[customerId]/onboarding` (Übersicht: ein Eintrag je Bogen des Kunden; genau ein sichtbarer Bogen → direkt dorthin weiterleiten) und `/portal/[customerId]/onboarding/[formId]?section=<blockId>`; Pfade über `SITE_ROUTES`-Helfer                                                                                                                                                      |
| Sichtbar im Portal      | Bogen mit Status in `ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES` **und** Projekt sichtbar laut `portalProjectCondition` **und** `portalAccessCondition` mit `portal.onboarding.read`. Alles andere → 404                                                                                                                                                                                           |
| Schreiben im Portal     | `portal.onboarding.submit` über `portalCanOn`; Status in `ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES`; bei `changes_requested` nur Blöcke mit `review_status = clarification` und `clarification_mode = customer` (Guard hier gebaut, genutzt ab Task 68)                                                                                                                                       |
| Schrittführung          | Ein Block = ein Schritt, Reihenfolge aus `onboarding_form_blocks.position`. Schritt im URL-State (`?section=`). `ProcessTrack` (`packages/ui`) als Schrittleiste mit Status je Schritt aus `getOnboardingCompleteness().blocks`                                                                                                                                                                 |
| Pflichtfelder           | Markiert, beim Schrittwechsel **nicht** blockierend. Ein Kunde überspringt bewusst, was er erst nachsehen muss                                                                                                                                                                                                                                                                                  |
| Letzter Schritt         | „Prüfen & absenden“: Fortschritt, Liste fehlender Pflichtfelder (Label + Block, Sprunglink auf `?section=…` mit Fokus auf das Feld), Hinweis auf Sperre nach dem Absenden                                                                                                                                                                                                                       |
| Autosave                | Je Feld beim Verlassen und entprellt beim Tippen (1 500 ms wie `useFeedbackDraft`). **Last write wins je Feld**; keine Bogen-`version` im Autosave (siehe Task 63, Hinweise)                                                                                                                                                                                                                    |
| Speichern-Request       | `PUT …/answers` mit `{ fieldId, groupEntryId: null, values: string[] }` (Text) bzw. `{ …, choiceIds: string[] }`. Der Server **ersetzt** alle Zeilen dieses Slots in einer Transaktion; leere Eingabe löscht den Slot                                                                                                                                                                           |
| Validierung             | `validateOnboardingValue` (Task 63) im Client für sofortiges Feedback und im Server (zod) verbindlich. Ungültige Werte werden **nicht** gespeichert; das Feld zeigt den Fehler, der Wert bleibt im Eingabefeld                                                                                                                                                                                  |
| Speicherstatus          | Ein Status für den ganzen Bogen: „Gespeichert · vor 2 Min.“ / „Wird gespeichert …“ / „Nicht gespeichert — erneut versuchen“. Zuletzt bearbeitet von … (aus der jüngsten Antwortzeile)                                                                                                                                                                                                           |
| Wiederverwendung Status | `FeedbackDraftStatus` und `FeedbackDraftSaveState` werden zu **geteilten** Bausteinen verallgemeinert (T1). Kein zweiter Statusbaustein                                                                                                                                                                                                                                                         |
| Verlassen-Warnung       | Der `beforeunload`-/Linkklick-Guard aus `useFeedbackDraft` wird als `useLeaveWarning(hasUnsaved, message)` nach `src/hooks/shared/` extrahiert und von Feedback und Onboarding genutzt                                                                                                                                                                                                          |
| Sprache                 | Texte über `resolveOnboardingText` mit der Locale der Route. Fällt ein Text auf eine andere Sprache zurück, zeigt der Block einmalig „Dieser Abschnitt ist nur auf Deutsch verfügbar“ (Sprachname aus `Record<Locale, …>`-Dictionary)                                                                                                                                                           |
| Vorbefüllt              | `carry_over`-Block mit Antworten vom Team (`updated_by_member_id`) vor `released_at`: Hinweis „Aus deinem letzten Onboarding übernommen — bitte prüfen“                                                                                                                                                                                                                                         |
| Absenden                | `POST …/submit`: Transaktion mit `SELECT … FOR UPDATE` auf den Bogen, Statusprüfung über `ONBOARDING_FORM_TRANSITIONS`, **serverseitige** Vollständigkeit über `getOnboardingCompleteness` → 422 mit `missing[]`, dann `updateLockedVersioned` (Status, `submitted_at`, `submitted_by_portal_membership_id`), Activity `submission_received`, Chat-Systemnachricht über `announceSystemMessage` |
| Vor dem Absenden        | Der Client wartet alle laufenden Speichervorgänge ab (`flush`); schlägt einer fehl, wird nicht abgesendet                                                                                                                                                                                                                                                                                       |
| Nach dem Absenden       | Leseansicht mit Datum und Person; Hinweis „Wir prüfen deine Angaben und melden uns“. Seite bleibt erreichbar                                                                                                                                                                                                                                                                                    |
| Externer Text           | Antworten werden überall als reiner Text gerendert (`LinkedText`), nie als HTML                                                                                                                                                                                                                                                                                                                 |
| Gestaltung              | Ruhig, eigenständig, großzügig (`frontend-design`) — wie Feedbackbogen und Portal-Dashboard, kein verkleinertes CRM. Mobil zuerst                                                                                                                                                                                                                                                               |

## Architektur

```txt
Portal-API (alle mit withPortalActor bzw. withPortalReader; customerId nur aus der validierten Mitgliedschaft)
  GET  /api/portal/[customerId]/onboarding                       Liste (OnboardingFormSummaryDto[])
  GET  /api/portal/[customerId]/onboarding/[formId]              PortalOnboardingFormDto
  PUT  /api/portal/[customerId]/onboarding/[formId]/answers      Slot ersetzen
  POST /api/portal/[customerId]/onboarding/[formId]/submit

Server (Portal)
  src/server/portal/services/onboarding/
    portal-onboarding-service.ts        withLockedForm (Transaktion + FOR UPDATE + Sichtbarkeit), editierbarer
                                        Block-Guard, Slot-Zugehörigkeit (Feld gehört zu einem Block dieses Bogens,
                                        Unterfeld-Regel, Choice gehört zum Feld)
    portal-onboarding-mapping-service.ts OnboardingFormDto (Task 65) → PortalOnboardingFormDto (ohne interne Felder:
                                        Review-Notizen nur bei clarification_mode = customer, keine Member-Namen außer
                                        Anzeigename)
  src/server/portal/command-handler/ save-portal-onboarding-answer, submit-portal-onboarding
  src/server/portal/query-handler/   list-portal-onboarding-forms, get-portal-onboarding-form
  src/server/shared/services/onboarding/
    onboarding-answer-write-service.ts  Slot ersetzen (value- oder choice-Zeilen, sort_order). Unter shared, weil
                                        die Vorbefüllung (Task 65, onboarding-prefill-service) auf denselben
                                        Schreibweg umgestellt wird — ein Schreibweg für Antworten
    onboarding-form-transition-service.ts submit/request/complete als Übergänge inkl. Activity + Systemnachricht

Die Portal-Handler nutzen `onboarding-form-read-service` aus `src/server/shared/services/onboarding/` (Task 65) mit
eigener Portal-Zugriffsbedingung; die Workspace-Handler bleiben unverändert.

Client
  src/client/portal/portal-onboarding-api-service.ts
  src/hooks/portal/use-onboarding-autosave.ts   je Slot: Wert, Status, Fehler; entprellt; flush(); nutzt useLeaveWarning
  src/common/patterns/portal/portal-api-endpoints.ts   + portalOnboarding*Endpoint (Muster portalFeedback*Endpoint)
```

`PortalOnboardingFormDto` (`packages/common/src/contracts/portal/portal-onboarding-form.dto.ts`): Kopf (Status, Daten,
Projekt-Titel), Blöcke mit aufgelösten Texten in der Anfrage-Locale (`isFallback` je Block), Felder inkl. Optionen,
Antworten, Gruppeneinträge, Dateien (ab Task 67 befüllt), `editableBlockIds`, `lastEditedAt`, `lastEditedByName`,
`canSubmit`. Die Vollständigkeit berechnet der **Client** mit derselben Funktion (`getOnboardingCompleteness`); der
Server berechnet sie beim Absenden erneut.

## UI

```txt
src/components/portal/onboarding/
  onboarding-overview/             Liste der Bögen (Projekt, Status, Fortschritt, „Weiter ausfüllen“/„Ansehen“), Empty-State
  onboarding-form-view/            Orchestrator: Status → Formular | Leseansicht; Autosave-Hook; Schritt aus URL
  onboarding-step-track/           ProcessTrack mit Schritt-Status (offen, angefangen, vollständig)
  onboarding-block-step/           Titel (Fokus nach Schrittwechsel), Intro, Sprach-/Vorbefüllungshinweis, Felder, Weiter/Zurück
  onboarding-field/                schaltet je Feldtyp; unbekannter Typ → nichts rendern + Konsolenwarnung (Entwicklung)
  fields/
    onboarding-text-field/         short_text, long_text (Zeichenzähler ab 80 %), email, phone, url (Eingabetyp je Feldtyp)
    onboarding-choice-field/       choice (Radio), yes_no (Radio, zwei Optionen)
    onboarding-multi-choice-field/ Checkboxen (CheckboxControl)
  onboarding-submit-step/          Fortschritt, fehlende Pflichtfelder mit Sprunglinks, Absenden-Dialog (ConfirmDialog)
src/components/shared/onboarding/    Portal UND CRM (kein Import aus components/workspace oder components/portal)
  onboarding-answer-read-view/     alle Blöcke lesend, Feld-Label + Wert(e), „nicht beantwortet“ für sichtbare Pflichtfelder
  onboarding-read-value/           rendert einen Wert je Feldtyp lesend (Text über LinkedText, Auswahl als Label)
  onboarding-progress-bar/         Balken + „x von y Pflichtangaben“ (role="progressbar")
src/components/shared/draft-save-status/   verallgemeinerter FeedbackDraftStatus (T1)
src/components/workspace/crm/onboarding/form/
  onboarding-form-answers-tab/     CRM-Tab „Antworten“ (?tab=answers) mit onboarding-answer-read-view
src/app/[locale]/(portal)/portal/[customerId]/onboarding/page.tsx
src/app/[locale]/(portal)/portal/[customerId]/onboarding/[formId]/page.tsx
src/i18n/dictionaries/portal/onboarding/{de,en}.json
```

Fokus und A11y: Nach Schrittwechsel Fokus auf die Blocküberschrift; Sprunglink fokussiert das Zielfeld; Fehler über
`aria-describedby`; Pflichtmarkierung über `FormRequiredMarker`; Speicherstatus als `role="status"` (polite).

## Tickets

### CRM-66-T1 — Geteilte Bausteine aus den Feedbackrunden verallgemeinern (reiner Refactor)

- **Files:** `src/components/shared/draft-save-status/*` (aus `components/portal/feedback/feedback-draft-status`),
  `src/common/constants/shared/draft-save-states.ts` (aus `feedback-draft-save-states.ts`, Werte unverändert),
  `src/hooks/shared/use-leave-warning.ts` (aus `useFeedbackDraft` extrahiert), Anpassung Feedback-Aufrufer, Tests
- **Skills:** `best-practices`
- **Inhalt:** Der Status-Baustein bekommt Texte und optional einen Konflikt-Slot (`ReactNode`) als Props statt
  `PortalFeedbackDictionary`; Feedback reicht seine Konfliktanzeige als Slot durch.
- **Akzeptanz:**
  - Alle bestehenden Feedback-Tests grün ohne geänderte Erwartungen; Feedbackbogen verhält sich identisch
  - Kein Import aus `components/portal/feedback` im neuen Baustein

### CRM-66-T2 — Portal-Server: Lesen, Speichern, Absenden

- **Files:** Services, Handler, Routen, `onboarding-answer-write-service` (+ Umstellung `onboarding-prefill-service`),
  Transition-Service, `PortalOnboardingFormDto`, Request-DTOs, zod, Fehlerabbildung
  `src/lib/portal/portal-onboarding-api-error.ts`, Tests (Integration mit echten Portal-Sessions)
- **Skills:** `best-practices`, `test-driven-development`
- **Akzeptanz:**
  - `draft`-Bogen → 404 (Lesen und Schreiben)
  - Fremder Kunde, fremder Bogen, Projekt nicht portal-sichtbar → 404; ohne `portal.onboarding.read` → 404/403 nach
    bestehendem Portal-Muster; ohne `submit` → Schreiben abgelehnt (Tests mit echter Session)
  - Feld eines anderen Bogens, Choice eines anderen Feldes → 404/422 (Tests)
  - Slot ersetzen: Mehrfachauswahl ersetzt alle Zeilen des Feldes; leere Eingabe löscht; ungültige E-Mail → 422 ohne
    Schreiben
  - Absenden mit fehlendem sichtbarem Pflichtfeld → 422 mit `missing[]`; Pflichtfeld hinter nicht erfüllter
    Bedingung blockiert nicht
  - Absenden ist atomar (Status, Zeitpunkt, Person, Activity); Systemnachricht-Fehler rollt nicht zurück (Verhalten wie
    `announceSystemMessage`)
  - Nach dem Absenden lehnt jeder Portal-Schreibpfad ab (409 `locked`)
  - `changes_requested`: Schreiben in nicht freigegebenem Block → 409 (Guard-Test, obwohl Status erst ab Task 68
    entsteht; Test setzt ihn direkt)

### CRM-66-T3 — Portal-Formular

- **Files:** Seiten, `components/portal/onboarding/*`, Autosave-Hook, Client-Service, Endpunkt-Helfer,
  `SITE_ROUTES`, Dictionaries, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Akzeptanz:**
  - Reload mitten im Bogen landet im selben Schritt mit gespeicherten Werten
  - Speicherfehler verliert keine Eingabe und bietet erneuten Versuch; Verlassen mit ungespeicherten Werten warnt
  - Bedingungen blenden Felder sofort ein/aus; ausgeblendete Werte bleiben gespeichert, zählen aber nicht
  - Absenden wartet laufende Speichervorgänge ab; fehlende Pflichtfelder einzeln benannt und anspringbar
  - Tastatur vollständig, Fokus nach Schrittwechsel, Kontrast, Dark/Light, mobil ohne horizontales Scrollen

### CRM-66-T4 — Lese-Renderer und CRM-Tab „Antworten“

- **Files:** `components/shared/onboarding/*`, `onboarding-form-answers-tab`, Anpassung
  `onboarding-form-page-view` (Task 65), Dictionaries, Tests
- **Skills:** `frontend-design`, `best-practices`
- **Akzeptanz:**
  - Portal-Leseansicht und CRM-Tab nutzen denselben Renderer (Review-Punkt)
  - Unbeantwortete sichtbare Pflichtfelder sind als solche erkennbar
  - Antworttext wird nie als HTML gerendert (Test mit `<script>`-Text)

## Merge-Gate 15.4

- [ ] Für Kunden nichts sichtbar (kein `open`-Bogen möglich, keine Navigation, kein Widget).
- [ ] Feedbackbogen nach Refactor unverändert (Tests).
- [ ] Vollständigkeit im Client und beim Absenden aus derselben Funktion.
- [ ] Cross-Customer-Negativtests mit echter Session für alle vier Portalendpunkte.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Workspace-Build grün.
