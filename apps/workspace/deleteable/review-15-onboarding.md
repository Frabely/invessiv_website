# Review Ordner 15 — Onboarding (Tasks 63–70)

**Stand:** 02.10.2026 · **Basis:** `88413718..HEAD` auf `master` (765 Dateien, +61.922/−1.553) · **Nichts geändert, nur dokumentiert.**

**Geprüft:** Migrationen 0047–0050 gegen die Drizzle-Modelle, `packages/common` (Patterns, Konstanten, Contracts),
alle Server-Services und Handler (CRM, Portal, shared), Routen und Fehler-Mapper, Client-Services, Hooks,
Portal- und CRM-Komponenten, Pages, Dictionaries, alle betroffenen `AGENTS.md`.

**Ausgeführt:** `pnpm -r typecheck` grün, `pnpm -r lint` grün (0 Fehler). DE/EN-Dictionaries schlüsselgleich, keine
ASCII-Umlaute, keine Sie-Form im Portal.
**Nicht ausgeführt:** Unit-/Integrationstests, `db:smoke:crm`, E2E. Alle Befunde stammen aus dem Lesen des Codes; kein
Befund wurde zur Laufzeit nachgestellt. Testdateien wurden nur auf Vorhandensein geprüft, nicht inhaltlich reviewt.

Schwere: **H** = echter Fehler im Ablauf, **M** = Regelverstoß oder Fehler im Randfall, **N** = Aufräumen.

---

## 1. Gesamtbild

Stimmig und sauber:

- Trennung `questionnaire` (Baukasten) / `onboarding` (Bogen) ist durchgezogen, im Code wie in den Ordnern.
- Sichtbarkeit, Pflicht und Fortschritt kommen wirklich nur aus `getQuestionnaireCompleteness` (Server, Portal, CRM).
- Portal- und Workspace-Handler sind getrennt, Zugriffsfilter stehen in der `WHERE`-Klausel, Fehlgriffe antworten 404.
- Jeder Schreibweg sperrt Bogen bzw. Block, Statuswechsel laufen über `ONBOARDING_FORM_TRANSITIONS`.
- Migration und Modell sind deckungsgleich, keine fachlichen DB-Defaults, Constraint-Namen zentral.
- Ein Block-Editor und ein Client (`forEndpoints`) für Katalog und Bogen, keine Kopie.
- Mapping-Services haben ihre Testdateien; Routen stehen in `CRM_ENDPOINT_ACCESS_RULES`.

Schwächen in einem Satz: mehrere Verhaltensfehler im Portal-Formular und beim Ändern eines freigegebenen Bogens, ein
Layering-Bruch `shared → workspace`, und viel von Hand wiederholtes Gerüst (Handler, Konfliktbehandlung, kleine Helfer).

---

## 2. Logik- und Verhaltensfehler

> **Stand 02.10.2026, Branch `fix/crm-onboarding-cr-fixes`:** L1–L4 sind behoben (ungecommittet).
>
> - **L1:** `onboardingAnswerDrafts.listInvalid` zählt nur sichtbare Felder; Hook nutzt es für `invalid` und `flush()`.
> - **L2:** Schrittwechsel während eines Uploads fragt nach; ein abgebautes Anhang-Feld bricht Uploads ab und hängt
>   nichts mehr an.
> - **L3:** Eine beantwortete Option lässt sich in einem freigegebenen Bogen nicht entfernen oder umbenennen
>   (`QUESTIONNAIRE_CHOICE_IN_USE`). Bewusst gesperrt statt „mit Bestätigung löschen“.
> - **L4:** Freigegebener Bogen behält das letzte Feld je Baustein/Gruppe (`QUESTIONNAIRE_LAST_FIELD`) und den letzten
>   Baustein mit Feld (`ONBOARDING_EMPTY_FORM`). Leere **neue** Bausteine/Gruppen bleiben erlaubt, sonst ließe sich ein
>   freigegebener Bogen nicht mehr erweitern.
>
> **Danach ebenfalls behoben (ungecommittet): L5–L8.**
>
> - **L5:** `OnboardingFormDto` und `PortalOnboardingFormDto` tragen `hiddenAnswerFiles` (nur Feld und Eintrag der
>   Verknüpfungen, deren Datei der Betrachter nicht öffnen darf). Alle Clients rechnen die Vollständigkeit damit;
>   CRM über `toOnboardingCompletenessInput` (erledigt D11 dort mit). Die Leseansicht nennt solche Felder mit
>   `filesHidden` statt „nicht beantwortet“.
> - **L6:** Start aus einer Vorlage mit archiviertem Baustein antwortet `ONBOARDING_TEMPLATE_BLOCK_ARCHIVED` (409).
> - **L7:** Der Editor meldet „veraltet“ an die Ansicht; sie lädt neu und startet den Editor mit dem frischen Stand.
>   Andere Refreshes lassen ihn in Ruhe.
> - **L8:** `normalizeQuestionnaireValue` ist die eine Definition des gespeicherten Werts; Prüfung und Schreibweg
>   nutzen sie.
>
> **Danach ebenfalls behoben (ungecommittet): L9, L10, A1, A2 und die Restlücke aus L5.**
>
> - **L5-Rest:** Das Dateifeld im Portal zählt versteckte Dateien bei Obergrenze und Mindestzahl mit (`hiddenCount`).
> - **L9:** Eine angekündigte, aber noch nicht geschriebene Anmerkung zu den Leistungen (`servicesRemarkOpen` in
>   `useOnboardingFormState`) lässt die Leistungen als unbestätigt zählen, auch nach einem Schrittwechsel.
> - **L10:** `OnboardingFieldUsageDto.entries` zählt die Einträge einer Gruppe; der Löschdialog nennt sie.
> - **A1:** `questionnaireDefinitionReadService`, `questionnaireMappingService` und die Zeilentypen liegen jetzt unter
>   `server/shared/services/questionnaire/`. Kein Import mehr von `shared`/`portal` in den CRM-Baukasten.
> - **A2:** Die Vorbefüllung schreibt Gruppeneinträge und Datei-Verknüpfungen über
>   `onboardingGroupEntryService.insertEntries` und `onboardingAttachmentService.insertLinks`.

### L1 (H) — Ungültiger Entwurf in einem ausgeblendeten Feld blockiert das Absenden

`hooks/portal/use-onboarding-autosave.ts:184-195, 200-216`
`invalid` und `flush()` prüfen jeden Entwurf, auch wenn das Feld durch eine Bedingung nicht mehr sichtbar ist.
Beispiel: „Ja“ wählen, im bedingten E-Mail-Feld „abc“ tippen, auf „Nein“ wechseln. Das Feld verschwindet, der Entwurf
bleibt. `flush()` liefert `false`, Absenden endet immer mit „ungültige Eingabe“, die Liste fehlender Angaben ist leer.
→ Entwürfe nicht sichtbarer Slots bei Validierung und Flush ausnehmen (Sichtbarkeit aus dem Pattern).

### L2 (H) — Upload-Sperre fällt beim Schrittwechsel weg

`components/portal/shared/portal-attachment-field/portal-attachment-field.tsx:115`
Das Cleanup meldet beim Unmount `active = false`, der Upload läuft aber weiter (`useUploadQueue` bricht nicht ab).
`OnboardingBlockStep` ist nach Block gekeyt und wird beim Schrittwechsel abgebaut. Folge: Kunde startet großen Upload,
klickt „Weiter“, sendet ab; der Upload endet danach, `attach` trifft auf `submitted` → `locked`. Die Datei liegt im
Dateibereich, hängt aber nicht am abgesendeten Bogen, ohne Meldung.
→ Upload-Zustand oberhalb des Schritts halten oder Schrittwechsel/Absenden während eines Uploads sperren.

### L3 (H) — Option entfernen oder umbenennen löscht Kundenantworten ohne Hinweis

`server/workspace/crm/services/questionnaire/questionnaire-definition-write-service.ts:150-165, 268-307`,
`components/workspace/crm/questionnaire/editor/questionnaire-choice-editor/questionnaire-choice-editor.tsx:105`
Optionen werden über `key` wiedererkannt. Ein geänderter `key` ist eine neue Option, die alte wird gelöscht; ihre
Antworten fallen per `ON DELETE CASCADE` weg. Der Aufbau ist im Status `open` editierbar, der `key` bestehender
Optionen ist im Editor frei änderbar. Für das Löschen eines Feldes gibt es den Usage-Dialog, hier nicht.
→ Betroffene Antworten vor dem Speichern zählen und bestätigen lassen; `key` bestehender Optionen in Bögen sperren.

### L4 (H) — Freigegebener Bogen kann leer werden

`server/workspace/crm/services/onboarding/onboarding-form-structure-service.ts:195`,
`packages/common/src/patterns/crm/onboarding/onboarding-release-check.ts:12`
`isOnboardingFormReleasable` wird nur beim Freigeben geprüft. In `open` lassen sich danach der letzte Block, das
letzte Feld eines Blocks oder alle Unterfelder einer Gruppe entfernen, ebenso ein eigener leerer Block ergänzen.
Der Kunde sieht leere Schritte und kann absenden (`ratio = 1`). Ab `submitted` ist der Aufbau gesperrt, das Team kann
nichts mehr ergänzen. Bei null Blöcken ist auch `isOnboardingCallBookable` sofort wahr (`[].every`).
→ Dieselbe Prüfung in den Strukturbefehlen ausführen, solange der Status `open` ist.

### L5 (M) — Client-Vollständigkeit hängt von der Dateisichtbarkeit ab, die des Servers nicht

`components/workspace/crm/onboarding/form/onboarding-complete-dialog/onboarding-complete-dialog.tsx:73-80`,
`…/onboarding-form-page-view.tsx:197-204`, `components/portal/onboarding/onboarding-form-editor/onboarding-form-editor.tsx:103-122`
`toFormDto` liefert nur Datei-Verknüpfungen, die der Betrachter sehen darf; `toCompleteness` auf dem Server zählt alle
(so steht es auch im Kommentar des Read-Service). Ein Mitglied mit `projects.write` ohne `files.read` sieht ein
Pflicht-Dateifeld als „fehlt“, der Abschließen-Knopf bleibt gesperrt, obwohl der Server abschließen würde. Im Portal
gilt dasselbe für Kontakte ohne `portal.files.read` und für übernommene Dateien aus einem nicht sichtbaren Projekt.
→ Fortschritt/fehlende Felder vom Server liefern lassen oder Anzahl je Slot unabhängig von der Sichtbarkeit mitgeben.

### L6 (M) — Start aus Vorlage kopiert archivierte Bausteine

`server/workspace/crm/services/onboarding/onboarding-form-create-service.ts:24-50`
`findTemplateBlocks` prüft nur den Status der Vorlage. Ein archivierter Baustein, der in der Vorlage stehen bleiben
darf, landet als aktive Kopie in jedem neuen Bogen. `addOnboardingFormBlock` lehnt denselben Baustein mit
`BLOCK_NOT_FOUND` ab. Zwei Wege, zwei Regeln.
→ Archivierte Bausteine beim Start überspringen oder den Start mit klarem Fehlercode ablehnen.

### L7 (M) — Editor bleibt nach „veraltet“ auf altem Stand

`components/portal/onboarding/onboarding-form-editor/onboarding-form-editor.tsx:34-38, 205-213`,
`…/onboarding-form-view/onboarding-form-view.tsx:102`
Nach `required_missing` ruft der Editor nur `router.refresh()`. Er ist über `id:status` gekeyt, die Hooks lesen
Antworten, Gruppeneinträge und Dateien nur beim Mount. Hat ein zweiter Kontakt eine Antwort geleert, meldet der
Server „fehlt“, der Client zeigt weiter „vollständig“; ohne Neuladen der Seite geht es nicht weiter.
→ Nach veralteten Codes den Editor neu mounten (Zähler im `key`) oder den lokalen Stand aus den Props abgleichen.

### L8 (M) — Längen-, Farb- und Skalenprüfung auf dem ungetrimmten Wert

`packages/common/src/patterns/crm/questionnaire/questionnaire-field-value.ts:72-74, 90, 94`
Leer, E-Mail, Telefon und URL prüfen den getrimmten Wert, Länge, Farbe und Skala den rohen; gespeichert wird
(einzeilig) getrimmt. 300 Zeichen plus ein Leerzeichen bei Limit 300 → `too_long`; „ #ff0000“ → `invalid_color`.
→ Einheitlich auf dem Wert prüfen, der gespeichert wird.

### L9 (N) — Leistungsbestätigung: „Anmerkung“ ohne Text lässt „passt so“ stehen

`components/portal/onboarding/fields/onboarding-project-services-field/onboarding-project-services-field.tsx:58-69`
Wer von „Passt so“ auf „Anmerkung“ wechselt und nichts tippt, sieht den Pflichtfehler, kann aber absenden: Auf dem
Server gilt weiter die alte Bestätigung ohne Anmerkung.

### L10 (N) — Usage-Zahl beim Feld-Löschen zählt Gruppeneinträge nicht

`server/workspace/crm/query-handler/get-onboarding-field-usage.query-handler.ts`
Eine Gruppe mit Einträgen, aber ohne Antworten, meldet 0; die Einträge gehen beim Löschen trotzdem verloren.

---

## 3. Architektur und AGENTS-Regeln

### A1 (M) — `server/shared` importiert aus `server/workspace`

`server/shared/services/onboarding/onboarding-form-read-service.ts:22-23`, `…/onboarding-services-snapshot-service.ts:11`
Der geteilte Read-Service nutzt `questionnaireDefinitionReadService` und `QuestionnaireReadExecutor` aus
`server/workspace/crm/services/questionnaire/**`. Das Portal ruft den shared-Service auf und hängt damit am
Workspace-Pfad. Regel: Was beide Welten brauchen, liegt in `server/shared/`.
→ Read-Service, Mapping und Typen des Baukastens nach `server/shared/services/questionnaire/` verschieben.

### A2 (M) — Vorbefüllung umgeht die „einzigen Schreibwege“

`server/workspace/crm/services/onboarding/onboarding-prefill-service.ts:491-498`
`onboarding_group_entries` und `onboarding_answer_files` werden direkt per `tx.insert` geschrieben. Laut
`server/shared/AGENTS.md` sind `onboardingGroupEntryService` und `onboardingAttachmentService` der einzige Weg.
Nur die Antworten laufen korrekt über `insertSlots`.

### A3 (M) — Kein `useVersionedMutation` in der gesamten neuen CRM-Oberfläche

`components/workspace/crm/AGENTS.md` schreibt den Hook für versionierte Writes vor. Kopf-Formular, Feld-Dialog,
Vorlagen-Editor, Aufbau, Prüfung, Freigabe, Nachforderung und Abschluss behandeln Konflikte jeweils von Hand
(siehe D3). → Hook nutzen oder die Abweichung in der AGENTS.md begründen.

### A4 (M) — String-Unions als Literale statt Const-Objekt

- `common/contracts/crm/onboarding/onboarding-block-list-change.ts:3-4` (`"move"`, `"remove"`) — exportierter Contract
- `…/onboarding-form-structure/onboarding-form-structure.tsx:60-64` (`"picker"`, `"own"`, `"remove"`)
- `…/questionnaire-block-head-form.tsx:77-81` und `…/questionnaire-template-editor.tsx:53-57` (`"saved"`, `"conflict"`,
  `"failure"`) — identischer Typ `Outcome` zweimal

Andere Stellen derselben Einheit machen es richtig (`QuestionnaireEditorDialogKind`, `PendingFocusKind`).

### A5 (N) — Exportierte Nicht-`Props`-Typen aus Komponenten

`…/ordered-block-list-editor/ordered-block-list-editor.tsx:18, 25` (`OrderedBlockListItem`,
`OrderedBlockListEditorLabels`), `…/questionnaire-field-list/questionnaire-field-list.tsx:17`
(`QuestionnaireFieldListActions`). Keiner wird importiert: `export` streichen oder nach `common/contracts`.

### A6 (N) — Großer Inline-Typ als heimlicher Contract

`components/portal/onboarding/questionnaire-field/questionnaire-field.tsx:37-89`
`QuestionnaireFieldProps["form"]` (rund 45 Zeilen) wird per Indexzugriff im Editor und im Block-Schritt wiederverwendet.
→ Als benannter Contract nach `common/contracts/portal/`.

### A7 (N) — Geteilte Komponenten hängen an portal- und feedback-benannten Bausteinen

`components/shared/onboarding/onboarding-answer-read-view/onboarding-answer-read-view.tsx:5, 10, 17, 19-20`,
`…/onboarding-read-value/onboarding-read-value.tsx:8`
Die von CRM und Portal genutzte Leseansicht importiert `common/patterns/portal/onboarding-answer-drafts` (`slotKey`,
`isChoiceField`), `PortalOnboardingServiceDto`, `FeedbackAttachmentDto`, `FeedbackAttachmentTexts` und
`FeedbackAttachmentList`. → Neutrale Namen und Orte für das, was mehrere Bereiche nutzen (siehe D6, D7).

### A8 (N) — Reine Validierung liegt unter `server/`

`server/workspace/crm/services/questionnaire/questionnaire-definition-validation.ts`
Seiteneffektfrei, ohne `server-only`. Als Pattern in `packages/common` könnte der Editor dieselben Regeln vorab prüfen.

### A9 (N) — Importstil in `packages/common` uneinheitlich

Neue Dateien importieren `from "@invessiv/common"` (Barrel), teils zur Laufzeit (`questionnaire-translation.ts:1`,
`onboarding-release-check.ts:1`: `SUPPORTED_LOCALES`), `contracts/portal/results/portal-onboarding-result.ts` nutzt
`@invessiv/common/...`-Subpfade; der Rest des Pakets importiert relativ. Laufzeit-Import über das eigene Barrel
birgt Zyklen.

---

## 4. Duplikate

### D1 (M) — Gerüst der Statusbefehle viermal

`release-`, `request-onboarding-changes-`, `complete-onboarding-form-`, `review-onboarding-block.command-handler.ts`
Jeweils gleich: ID-Prüfung, Schema-Parse mit von Hand gebautem `VALIDATION_ERROR` (7 Handler, obwohl
`questionnaireCommandSupport.parse` dieselbe Form liefert), `FORM_NOT_FOUND`-Konstante (4 Dateien),
`lockWritableForm`, Übergangsprüfung, `toDto`-Closure mit `fileAccessService.readableCondition(actor)` (6×).
Der Projekttitel wird dreimal geladen (`loadProjectTitle` in release, inline in den beiden anderen).
→ Ein Rahmen `runFormTransition(...)` neben `runBlockListCommand`.

### D2 (M) — Versionskonflikt-Objekt siebenmal von Hand

`onboarding-form-structure-service.ts:122-131`, die vier Handler aus D1, `update-questionnaire-template.command-handler.ts`,
`blockConflict` im Write-Service. → Ein Helfer `versionConflict(current, version)`.

### D3 (M) — Konfliktbehandlung im Client sieben- bis achtmal

`busy`/`failure`-State, Aufruf, `ok` → Callback, `"current" in result` → Konflikttext + Übernahme, sonst Fehlertext:
`onboarding-release-dialog`, `onboarding-complete-dialog`, `onboarding-request-changes-dialog`,
`onboarding-review-controls`, `onboarding-form-structure` (`settle`), `questionnaire-block-editor`
(`settleListResult`, `submitField`), `questionnaire-block-head-form`, `questionnaire-template-editor`. Gehört zu A3.

### D4 (M) — Sammelaufgabe für Onboarding ist eine Kopie der Feedback-Variante

`server/shared/services/onboarding/onboarding-task-service.ts:23-116` gegenüber
`server/shared/services/feedback/feedback-round-task-service.ts:33-125`: gleicher Insert-Feldsatz, gleiche Warnung,
gleiches `recordCreated`, gleiches Done-Update mit `recordStatusChange`. → Gemeinsamer Baustein mit Herkunft als Parameter.

### D5 (M) — DTO → Row für Baustein-Definitionen doppelt

`questionnaire-definition-write-service.ts:199-230, 339-346, 393-400` und
`questionnaire-block-copy-service.ts:85-152` bauen Feldspalten sowie Block-, Feld- und Options-Übersetzungszeilen je
für sich. Gehört laut `server/AGENTS.md` als `map…ApiToDb` in den Mapping-Service.

### D6 (N) — Slot-Schlüssel zweimal

`packages/common/src/patterns/crm/questionnaire/questionnaire-completeness.ts:23` (`|`) und
`common/patterns/portal/onboarding-answer-drafts.ts:40` (`@`).

### D7 (N) — Zwei Contracts für dieselbe Datei-Form

`packages/common/src/contracts/crm/questionnaire/questionnaire-attachment.ts` (Pick aus `FileDto`) und
`…/crm/feedback-attachment.dto.ts` haben dieselben neun Felder. Die Leseansicht typisiert mit dem Feedback-DTO, die
Daten sind `QuestionnaireAttachment`.

### D8 (N) — Lese-Executor-Typ sechsmal neu definiert

`type ReadExecutor = Pick<ContactDatabaseTransaction, "select">` lokal in `onboarding-attachment-service.ts:15`,
`onboarding-group-entry-service.ts:10`, `onboarding-review-service.ts:16`, `project-responsible-member-service.ts:14`,
`portal-onboarding-service.ts:52`, dazu exportiert als `QuestionnaireReadExecutor`. Im Bestand gibt es bereits
`CrmDatabaseExecutor` (`server/workspace/crm/crm-types.ts:7`) und `FeedbackReadExecutor`.

### D9 (N) — Schritte eines Bogens dreimal abgefragt

`onboardingFormStructureService.listSteps` (138-147), `onboardingReviewService.listSteps` (19-28), `loadStructure` im
Read-Service (37-52). `removeStep` fragt den Schritt selbst ab statt über `onboardingReviewService.findStep`.
`getProjectOnboarding` lädt die Schritte dadurch pro Aufruf zweimal.

### D10 (N) — Positionsmuster je dreimal

„Löschen und aufrücken“: `onboardingAttachmentService.detach`, `onboardingGroupEntryService.remove`, `removeStep`.
„Nachbarn tauschen mit `set constraints … deferred`“: `moveField`, `moveStep`, `onboardingGroupEntryService.move`.

### D11 (N) — Vollständigkeits-Eingabe aus dem Bogen fünfmal von Hand

`servicesConfirmed: form.servicesConfirmedAt !== null` samt Blöcken, Antworten, Dateien, Einträgen in
`onboarding-complete-dialog.tsx:79`, `onboarding-form-answers-tab.tsx:48`, `onboarding-form-page-view.tsx:202`,
`onboarding-review-tab.tsx:146`, `portal-onboarding-mapping-service.ts:59`. → `toCompletenessInput(form)`.

### D12 (N) — Kleinteile

- `groupBy`/`byPosition`: `questionnaire-mapping-service.ts:18-29`, `questionnaire-completeness.ts:27-39`,
  `use-onboarding-form-state.ts:19-24`. Die Variante im Mapping-Service kopiert das Array je Zeile (quadratisch).
- `AUTOSAVE_DELAY_MS = 1_500` in `use-feedback-draft.ts:22` und `use-onboarding-autosave.ts:16`.
- `status_change`-Activity (Body `a → b`, `previous_status`/`next_status`) dreimal in
  `onboarding-form-transition-service.ts:96-108, 137-153, 200-212`.
- `VALIDATION`-Konstante in drei Portal-Handlern, inline in zwei weiteren; der Service bietet nur `notFound()`.

---

## 5. Dateigröße und Lesbarkeit

|          Zeilen | Datei                                                                                               | Vorschlag                                                                                |
| --------------: | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
|             617 | `services/questionnaire/questionnaire-definition-write-service.ts`                                  | Block-Befehle, Feld-Befehle und Options-Persistenz trennen; Zeilenbau in den Mapper (D5) |
|             501 | `services/onboarding/onboarding-prefill-service.ts`                                                 | Übernahme aus dem Vorbogen und CRM-Vorbelegung sind zwei Verantwortungen                 |
|             450 | `onboarding/form/onboarding-form-structure/onboarding-form-structure.tsx`                           | Fünf Befehle samt `settle` in einen Hook; die Komponente rendert nur noch                |
|             410 | `server/portal/services/onboarding/portal-onboarding-service.ts`                                    | Sichtbarkeit/Sperre, Schreibprüfung und DTO-Bau trennen                                  |
|             384 | `questionnaire/editor/questionnaire-block-editor/questionnaire-block-editor.tsx`                    | Befehle in einen Hook (löst auch D3)                                                     |
| 349 / 337 / 334 | `questionnaire-field-dialog.tsx`, `questionnaire-template-editor.tsx`, `onboarding-form-editor.tsx` | Grenzwertig, beobachten                                                                  |

Testdateien bis 958 Zeilen (`onboarding-form-view.fields.test.tsx`), sechs weitere über 600.

Performance-Hinweise (unkritisch bei heutiger Größe):

- Jeder Autosave läuft unter der Bogensperre durch rund zehn Abfragen, weil `findWritableField` den ganzen Block mit
  allen Feldern, Optionen und Übersetzungen lädt (`portal-onboarding-service.ts:206-243`). Mehrere Kontakte einer
  Firma warten dahinter.
- `isQuestionnaireFieldVisible` baut pro Aufruf den kompletten Index neu; Block-Schritt, Gruppe und Leseansicht rufen
  es je Feld und je Eintrag bei jedem Render.

---

## 6. Datenbank und Doku

- **DB1 (N)** `0047_create_onboarding.sql:119, 192, 233`: `locale IN ('de', 'en')` als Literal, das Modell nutzt
  `SUPPORTED_LOCALES`. Eine neue Sprache braucht eine Migration (README sagt „reine Datenpflege“), und Modell und
  Datenbank laufen dabei still auseinander. Für die Limits gibt es einen Abgleichstest, für die Locales nicht.
- **DB2 (N)** `0048_seed_onboarding_standard_catalog.sql`: kein `ON CONFLICT`, ein zweiter Lauf scheitert. Im Dateikopf
  begründet, weicht aber von „idempotent, zweiter Lauf folgenlos“ ab. In `packages/db/AGENTS.md` als Ausnahme festhalten.
- **DOC1 (N)** `README.md:93-94`, `69-…md:9`, `70-…md:9`: 15.7 und 15.8 stehen auf „im Review“, liegen aber auf
  `master`. Beide kamen ohne Merge-Commit direkt auf `master` (`43d36c87`, `31a76e72`, `6425fdb4`, `ceacc151`).
- **DOC2 (N)** `server/workspace/shared/AGENTS.md` nennt `updateVersioned` als einzigen Weg. `updateLockedVersionedBy`
  und `updateLockedVersionedSet` (erhöht Versionen ohne Vergleich) sind dort nicht beschrieben.

---

## 7. Kleinigkeiten

- Tote Codes: `OnboardingErrorCode.FileNotAttachable` liefert kein Handler. `QuestionnaireErrorCode.NotEditable`
  entsteht nur im Client (`OWNER_CODES`), Status und Text im Server-Mapper sind unerreichbar.
- `runQuestionnaireRoute` / `withQuestionnaireBody` (`lib/workspace/crm/questionnaire-api-response.ts`) werden von
  allen Onboarding-Routen genutzt; der Name passt nicht mehr.
- `onboarding-form-schemas.ts:39, 45`: die Schritt-Version heißt im Schema `expectedFormVersion`.
- `questionnaire-template-service.ts:89`: Variable `any`.
- `count-questionnaire-block-templates.query-handler.ts`: `isUuid`, alle anderen `entityId.safeParse`.
- `ONBOARDING_ERROR_CODE_VALUES` / `QUESTIONNAIRE_ERROR_CODE_VALUES` über `Object.values`, sonst explizite Arrays.
- Feste DOM-IDs statt `useId`: `onboarding-answers`, `onboarding-blocks-heading`, `onboarding-block-editor-heading`,
  `questionnaire-fields-heading`.
- `components/shared/onboarding/testing/portal-onboarding-form-fixture.ts`: Test-Fixture im Produktivbaum, einziger
  `testing/`-Ordner in `src`.
- `components/portal/onboarding/questionnaire-field/` neben `fields/onboarding-*-field`: gemischte Benennung.
- `usePortalFileDownloads<FeedbackAttachmentDto>` für Onboarding-Dateien (`onboarding-form-view.tsx:66`).

---

## 8. Reihenfolge-Vorschlag

1. L1–L4 (Kunde kann nicht absenden, verliert Antworten oder Dateien, sendet leeren Bogen).
2. L5–L8, A1, A2.
3. A3 mit D1–D3 zusammen: ein Server-Rahmen und der vorhandene Hook entfernen den größten Teil der Wiederholung.
4. D4, D5 und die großen Dateien aus Abschnitt 5.
5. Rest nach Gelegenheit.
