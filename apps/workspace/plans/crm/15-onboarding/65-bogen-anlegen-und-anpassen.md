# Task 65 — Onboarding je Projekt starten und anpassen

> **Vor dem Start lesen:** [`README.md`](./README.md), [`63-datenmodell-und-regeln.md`](./63-datenmodell-und-regeln.md),
> [`64-baustein-katalog-und-vorlagen.md`](./64-baustein-katalog-und-vorlagen.md) (Block-Editor, Listen-Editor,
> Definitions-Services, `questionnaireBlockCopyService` — hier wiederverwendet), `../00-entscheidungen.md`,
> `../AGENTS.md`, scoped `AGENTS.md` unter `src/server/workspace/crm/`, `src/components/workspace/crm/`,
> `src/app/[locale]/(app)/crm/`.

> **Status:** offen · **Teil-PR:** 15.3 · **Branch:** `feat/crm-onboarding-3-bogen-intern`
> **Abhängigkeiten:** Task 64 (15.2) gemerged · **Aufwand:** 2–3 T. · **Dateien:** 70–90
> **Migration:** keine

## Ziel

Am Projekt kann das Team **„Onboarding starten“**: Vorlage wählen → es entsteht ein Bogen im Status `draft` mit
eigenen Blockkopien, vorbefüllt aus dem letzten abgeschlossenen Bogen des Kunden und aus CRM-Daten. Der Bogen lässt
sich im **selben Editor** wie der Katalog zuschneiden: Blöcke entfernen, aus dem Katalog ergänzen, eigene Blöcke
anlegen, sortieren, Fragen hinzufügen, ändern oder entfernen.

Nach dem Merge ist das intern vollständig nutzbar. **Freigeben an den Kunden** gibt es noch nicht (kommt mit Task 67,
weil das Portal-Formular erst dann komplett ist) — kein toter Button, der Bogen bleibt `draft`.

## Entscheidungen

| Bereich                    | Entscheidung                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Einstieg                   | Projektbereich „Onboarding“ in `customer-projects-section` ersetzt den `MockSectionCard` für `PROJECT_FUTURE_AREAS = ["onboarding"]` (Konstante entfällt, wenn sie danach leer ist)                                                                                                                                                                                                  |
| Bogenseite                 | Eigene Seite `/crm/onboarding/[formId]` (`SITE_ROUTES`-Pfad-Helfer), noindex, `force-dynamic`. Tab „Aufbau“ in diesem Task; „Antworten“ (Task 66) und „Prüfung“ (Task 68) folgen als weitere Tabs                                                                                                                                                                                    |
| Berechtigt                 | Lesen `projects.read`, alles Schreibende `projects.write` — jeweils `crmAccessCondition.forScope(accessScope(actor, …), { customerId, projectId })` in der Query und `canOn` im Schreibpfad. Keine neue Permission                                                                                                                                                                   |
| Projektstatus              | Starten nur bei Projekten in `ONBOARDING_ELIGIBLE_PROJECT_STATUS_VALUES` (`planned`, `active`; neue Konstante unter `packages/common/src/constants/crm/onboarding/`), sonst 409 `ONBOARDING_PROJECT_NOT_ELIGIBLE` (Fehlercode in diesem Task ergänzen)                                                                                                                               |
| Ein Bogen je Projekt       | Zweites Starten → 409 `ONBOARDING_FORM_EXISTS` (Unique-Index aus Task 63 ist die letzte Absicherung, der Handler prüft vorher)                                                                                                                                                                                                                                                       |
| Anlegen                    | Eine Transaktion: Bogen (`draft`, `version 1`), je Vorlagenblock `questionnaireBlockCopyService.copy(tx, catalogBlockId, formId)`, `onboarding_form_blocks` mit Position und `review_status = pending`, Vorbefüllung, Activity `created` am Projekt                                                                                                                                  |
| Ohne Vorlage               | Erlaubt („Leer starten“): Bogen ohne Blöcke; Blöcke kommen aus dem Katalog oder werden neu angelegt                                                                                                                                                                                                                                                                                  |
| Strukturänderungen erlaubt | In `draft` und `open`. In `submitted`, `changes_requested`, `completed` gesperrt (`ONBOARDING_NOT_EDITABLE`) — geprüft wird gegen einen stabilen Stand. Fehlendes nach dem Absenden läuft über die Nachforderung (Task 68)                                                                                                                                                           |
| Feld mit Antworten löschen | Erlaubt, aber der Dialog nennt die Zahl betroffener Antworten und Dateien (`ConfirmDialog`, `tone: danger`); Antworten fallen per Cascade weg, **Dateien bleiben** im Dateibereich des Kunden (nur die Verknüpfung entfällt)                                                                                                                                                         |
| Eigene Blöcke              | „Eigener Baustein“ legt einen leeren Block direkt im Bogen an (`owner_form_id = formId`, `source_block_id NULL`). Er wird nie vorbefüllt                                                                                                                                                                                                                                             |
| Block aus Bogen in Katalog | Nicht in diesem Task (bewusst: Katalogpflege bleibt auf der Katalogseite)                                                                                                                                                                                                                                                                                                            |
| Vorbefüllung aus Vorbogen  | Quelle: jüngster Bogen desselben Kunden mit `status = completed` (anderes Projekt). Für jeden **neuen** Bogenblock mit `carry_over = true` und `source_block_id = S` wird der Block mit derselben `source_block_id` im Vorbogen gesucht                                                                                                                                              |
| Zuordnung                  | Felder über `key` (Unterfelder über Gruppen-`key` + eigenen `key`), Optionen über `key`, Gruppeneinträge in Reihenfolge. Nicht zuordenbare Werte werden verworfen, nie geraten                                                                                                                                                                                                       |
| Dateien bei Vorbefüllung   | Dieselbe `file_id` wird verknüpft (`onboarding_answer_files`), keine Kopie. Die Datei gehört demselben Kunden; Projektbindung der Datei bleibt unverändert                                                                                                                                                                                                                           |
| Kennzeichnung              | Vorbefüllte Antworten tragen `updated_by_member_id` des Anlegers. Keine neue Spalte für die Herkunft: Das Portal (Task 66) zeigt je `carry_over`-Block „Aus deinem letzten Onboarding übernommen — bitte prüfen“, solange Antworten des Blocks vor `released_at` entstanden und seitdem nicht vom Kunden geändert sind                                                               |
| CRM-Vorbelegung            | Nur für Felder ohne übernommene Antwort. Quellen laut `QuestionnairePrefillSource`: `customers.company_name`, Adresse (`street`, `postal_code`, `city`, `country` als mehrzeiliger Text), `vat_id`, `website_url`, Primärkontakt aus `customer_contact_assignments` (`is_primary`) + `people` (`display_name`, `business_email ?? primary_email`, `business_phone ?? primary_phone`) |
| Kein Zurückschreiben       | Weder Vorbefüllung noch spätere Antworten ändern CRM-Stammdaten                                                                                                                                                                                                                                                                                                                      |
| Vorlagenänderung danach    | Wirkt nicht auf bestehende Bögen (Snapshot). Kein „Aktualisieren aus Vorlage“                                                                                                                                                                                                                                                                                                        |

## Architektur

```txt
API (workspace)
  GET    /api/workspace/crm/projects/[projectId]/onboarding            projects.read  → OnboardingFormSummaryDto | null
  POST   /api/workspace/crm/projects/[projectId]/onboarding            projects.write { templateId | null }
  GET    /api/workspace/crm/onboarding/forms/[formId]                  projects.read  → OnboardingFormDto
  POST   /api/workspace/crm/onboarding/forms/[formId]/blocks           projects.write { catalogBlockId } | { title, key }
  DELETE /api/workspace/crm/onboarding/forms/[formId]/blocks/[blockId]
  POST   /api/workspace/crm/onboarding/forms/[formId]/blocks/[blockId]/move      { direction, expectedFormVersion }
  PATCH  /api/workspace/crm/onboarding/forms/[formId]/blocks/[blockId]           Kopf/Übersetzungen (Definition)
  POST   /api/workspace/crm/onboarding/forms/[formId]/blocks/[blockId]/fields
  PATCH  /api/workspace/crm/onboarding/forms/[formId]/fields/[fieldId]
  DELETE /api/workspace/crm/onboarding/forms/[formId]/fields/[fieldId]
  POST   /api/workspace/crm/onboarding/forms/[formId]/fields/[fieldId]/move
  GET    /api/workspace/crm/onboarding/forms/[formId]/fields/[fieldId]/usage     Zahl Antworten/Dateien (Löschdialog)

Jeder Bogenendpunkt lädt den Bogen mit crmAccessCondition (Kunde + Projekt) und prüft, dass Block/Feld
diesem Bogen gehört (owner_form_id = formId) → sonst 404. Danach ruft er dieselben Definitions-Services
aus Task 64 auf. Bogen-`version` wird bei jeder Strukturänderung über updateVersioned erhöht, damit
parallele Bearbeiter einen Konflikt sehen.

Server
  src/server/workspace/crm/services/onboarding/
    onboarding-form-access-service.ts     Bogen laden inkl. Zugriff, Status-Guard „Struktur editierbar“
    onboarding-form-create-service.ts     Anlegen inkl. Blockkopien (nutzt questionnaireBlockCopyService)
    onboarding-prefill-service.ts         Vorbogen suchen, Antworten/Gruppen/Dateien übertragen; CRM-Vorbelegung
  src/server/shared/services/onboarding/
    onboarding-form-read-service.ts       OnboardingFormDto zusammenbauen (Definition über den Read-Service
                                          aus Task 64, Antworten, Dateien, Gruppen, aktuelle Projektleistungen).
                                          Liegt unter shared, weil ab Task 66 auch Portal-Handler ihn nutzen; die
                                          Zugriffsbedingung bringt jeder Aufrufer selbst mit (src/server/shared/AGENTS.md)
  command-handler/ start-project-onboarding, add-onboarding-form-block, remove-onboarding-form-block,
                   move-onboarding-form-block, + Bogen-Varianten der Feld-/Block-Handler aus Task 64
                   (dünne Handler, eigene Zugriffsprüfung, gemeinsamer Service — kein kopierter Logikblock)
  query-handler/   get-project-onboarding-summary, get-onboarding-form, get-onboarding-field-usage
```

Die **aktuellen Projektleistungen** im `OnboardingFormDto` kommen aus `project_line_items` des Projekts mit Status
außer `rejected` (Konstante `ONBOARDING_VISIBLE_LINE_ITEM_STATUS_VALUES` in
`packages/common/src/constants/crm/onboarding/`), sortiert wie im Projekt; nach Abschluss (Task 70) stattdessen aus
`onboarding_form_services`. Die Auswahl dieser Quelle steckt ausschließlich im Read-Service.

## UI

```txt
apps/workspace/src/components/workspace/crm/onboarding/
  project/
    project-onboarding-section/      im Projektbereich: Empty-State + „Onboarding starten“ | Status, Fortschritt, Link
    onboarding-start-dialog/         FormDialog: Vorlage (CustomSelect, aktive Vorlagen + „Leer starten“), Hinweis
                                     „Firmenweite Angaben werden aus dem letzten Onboarding übernommen“, falls vorhanden
    onboarding-status-badge/         ein Badge für alle Bogenstatus (in Portal-Widget-Texten nicht wiederverwendet;
                                     Portal hat eigene Formulierungen)
  form/
    onboarding-form-page-view/       Kopf (Kunde, Projekt, Status, Vorlage), TabList (?tab=structure)
    onboarding-form-structure/       links: ordered-block-list-editor (Task 64) mit Blöcken des Bogens,
                                     „Aus Katalog hinzufügen“ (questionnaire-block-picker-dialog, Task 64),
                                     „Eigener Baustein“; rechts: questionnaire-block-editor (Task 64) für ?block=<id>
    onboarding-field-delete-dialog/  ConfirmDialog mit Nutzungszahlen
apps/workspace/src/client/crm/onboarding-form-api-service.ts
    implementiert QuestionnaireDefinitionClientApi (Task 64) für Bogenblöcke + Blocklisten-Operationen
apps/workspace/src/app/[locale]/(app)/crm/onboarding/[formId]/page.tsx
```

- Der Editor bekommt `readOnly`, wenn der Status keine Strukturänderung erlaubt; dann zeigt er einen Hinweis
  („Nach dem Absenden ist der Aufbau fest. Fehlendes forderst du in der Prüfung nach.“) statt Aktionen.
- Auswahl des Blocks im URL-State (`?block=`), damit Reload und geteilte Links funktionieren.
- Fortschritt im Projektbereich über `getQuestionnaireCompleteness` (Task 63) — keine eigene Berechnung. Das ist ein
  Pattern (reine Funktion, `packages/common`). Neu in diesem Task ist nur der `onboarding-form-read-service`, der die
  Eingaben dafür beschafft; er enthält keine Regel zu Sichtbarkeit, Pflicht oder Fortschritt (siehe README, Regeln).
- Dictionary: `src/i18n/dictionaries/workspace/crm/onboarding/{de,en}.json` erweitert um `project`, `form`,
  `structure`.

## Was aus Task 64 fertig bereitliegt (Stand 01.10.2026)

Damit Task 65 nur noch den Bogen-Rahmen baut und keine Logik des Baukastens wiederholt:

| Bereich                      | Fertig und owner-neutral                                                                                                                                                                                                             | Task 65 ergänzt nur                                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server, Bausteine und Felder | `questionnaireDefinitionWriteService`: `createBlock`, `updateBlock`, `deleteBlock`, `createField`, `updateField`, `deleteField`, `moveField`, jeweils mit Owner; `questionnaireBlockCopyService.copyBlock` für Kopien in einen Bogen | dünne Bogen-Handler: Bogen mit Zugriffsbedingung laden, Status prüfen (`ONBOARDING_NOT_EDITABLE`), Service mit der Bogen-ID aufrufen                                   |
| Server, Lesen                | `questionnaireDefinitionReadService.findBlock/findBlocks(…, owner)`, `isBlockKeyTaken(…, owner, key)`                                                                                                                                | `onboarding-form-read-service` (Eingaben für die Vollständigkeit)                                                                                                      |
| Server, Reihenfolge          | Feldreihenfolge im Service                                                                                                                                                                                                           | Reihenfolge der Bogenblöcke (`onboarding_form_blocks.position`): eigene Operation, die `moveListItem` und das aufgeschobene Positions-Constraint wie `moveField` nutzt |
| Client                       | `questionnaireDefinitionApiService.forEndpoints(paths)` baut `QuestionnaireDefinitionClientApi` aus den Pfaden des Owners                                                                                                            | `onboarding-form-api-service.ts`: die Pfade des Bogens plus Blocklisten-Operationen (Block hinzufügen, entfernen, verschieben)                                         |
| UI                           | `questionnaire-block-editor`, `questionnaire-block-head-form`, `block-list/ordered-block-list-editor`, `block-list/questionnaire-block-picker-dialog` (Texte über Props)                                                             | Rahmen: Seite, Tabs, Statushinweis `readOnly`, Löschdialog mit Nutzungszahlen, eigene Dictionary-Texte für Liste und Auswahl                                           |

Offene Punkte für Task 65:

- **Schlüssel im Bogen:** `isBlockKeyTaken` prüft im Bogen nur im Code; die Datenbank erzwingt es nur für den Katalog
  (`questionnaire_blocks_catalog_key_uidx`). Wird derselbe Katalogbaustein zweimal hinzugefügt, entstehen zwei
  Blöcke mit gleichem Schlüssel. Entweder die Auswahl blendet bereits enthaltene Bausteine aus (wie bei Vorlagen) oder
  `0047` bekommt einen Unique-Index `(owner_form_id, key) WHERE owner_form_id IS NOT NULL`; Entscheidung dort treffen.
- **Fehlercode `ONBOARDING_NOT_EDITABLE`:** Der geteilte Client (`QuestionnaireClientResult`) kennt nur
  `QuestionnaireErrorCode`; ein unbekannter Code wird zu `INTERNAL`. Der Editor ist im gesperrten Status `readOnly`,
  der Fall bleibt also ein Wettlauf. Soll er einen eigenen Text bekommen, den Code-Typ des Clients erweitern, nicht
  den Editor verzweigen.

## Tickets

### CRM-65-T1 — Anlegen, Kopieren, Vorbefüllen

- **Files:** `onboarding-form-create-service`, `onboarding-prefill-service`, `onboarding-form-access-service`,
  `start-project-onboarding` Handler + Route, Konstanten, Tests (Integration)
- **Skills:** `best-practices`, `test-driven-development`
- **Akzeptanz:**
  - Start mit Vorlage erzeugt je Vorlagenblock genau eine Kopie in Vorlagenreihenfolge; Katalogblöcke unverändert
  - Späteres Ändern eines Katalogfeldes ändert den Bogen nicht (Test)
  - Vorbefüllung: Antworten, Mehrfachauswahl, Gruppeneinträge und Datei-Links eines `carry_over`-Blocks werden aus dem
    jüngsten abgeschlossenen Bogen übernommen; nicht-`carry_over`-Blöcke und Kompakt↔Voll-Varianten nicht (Tests)
  - Ein Bogen im Status `open` desselben Kunden ist **keine** Quelle (nur `completed`)
  - CRM-Vorbelegung füllt nur leere Felder; Primärkontakt über `is_primary`, geschäftliche vor privater Adresse
  - Zweites Starten → 409; Projekt eines fremden Kunden / außerhalb des Zugriffsbereichs → 404; ohne
    `projects.write` → 403; Projekt `completed`/`cancelled`/`archived` → abgelehnt
  - Alles in einer Transaktion: Fehler beim Kopieren hinterlässt keinen Bogen

### CRM-65-T2 — Strukturänderungen am Bogen

- **Files:** Bogen-Handler und Routen (Blöcke, Felder, Verschieben, Nutzung), `CRM_ENDPOINT_ACCESS_RULES`,
  `CrmOperation`, `WorkspaceApiEndpoint`, Fehlerabbildung, Tests
- **Skills:** `best-practices`
- **Akzeptanz:**
  - Feld eines anderen Bogens oder des Katalogs über Bogenendpunkt → 404 (Owner-Prüfung)
  - Strukturänderung in `submitted` → 409 `ONBOARDING_NOT_EDITABLE`
  - Entfernen eines Blocks löscht seine Definition, Antworten und Verknüpfungen; die Dateien existieren weiter (Test)
  - Parallele Änderung mit veralteter `version` → 409 `VersionConflictDto`
  - Negativtests fremder Kunde, fremdes Projekt für jeden Endpunkt

### CRM-65-T3 — Projektbereich, Startdialog, Bogenseite

- **Files:** `project/*`, `form/*`, Seite, Client-Service, `SITE_ROUTES`, Dictionaries, Tests;
  `customer-projects-section.tsx` (Mock ersetzt)
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Akzeptanz:**
  - Ohne Bogen: Empty-State erklärt, wofür das Onboarding da ist, und bietet „Onboarding starten“ (nur mit
    `projects.write`)
  - Mit Bogen: Status, Fortschritt (dieselbe Funktion wie später Portal) und Link zur Bogenseite
  - Bogenseite nutzt `questionnaire-block-editor` und `ordered-block-list-editor` aus Task 64 **ohne** Kopie (Review-Punkt)
  - Löschdialog nennt betroffene Antworten und Dateien
  - Tastatur, Fokus nach Aktionen, Dark/Light, mobil ohne horizontales Scrollen

## Merge-Gate 15.3

- [ ] Onboarding je Projekt startbar (mit Vorlage oder leer), anpassbar, Vorbefüllung getestet.
- [ ] Kein Freigeben-Button; Bogen bleibt `draft`; Portal unverändert.
- [ ] Editor-Komponenten aus Task 64 wiederverwendet, Definitions-Services gemeinsam genutzt.
- [ ] Alle Endpunkte in `CRM_ENDPOINT_ACCESS_RULES` mit Negativtests (fremder Kunde, fremdes Projekt, ohne Recht).
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Workspace-Build grün.
