# Task 64 — Baustein-Katalog und Vorlagen pflegen

> **Vor dem Start lesen:** [`README.md`](./README.md), [`63-datenmodell-und-regeln.md`](./63-datenmodell-und-regeln.md)
> (Tabellen, Konstanten, Patterns — hier vorausgesetzt), [`64a-standardkatalog.md`](./64a-standardkatalog.md) (Seed-Inhalt
> dieses Teil-PRs), `../00-entscheidungen.md`, `../AGENTS.md`, scoped `AGENTS.md` unter
> `apps/workspace/src/server/`, `src/server/workspace/crm/`, `src/components/workspace/crm/`,
> `src/app/[locale]/(app)/crm/`.

> **Status:** offen · **Teil-PR:** 15.2 · **Branch:** `feat/crm-onboarding-2-katalog`
> **Abhängigkeiten:** Task 63 (15.1) gemerged · **Aufwand:** 3–4 T. · **Dateien:** 90–110
> **Migration:** ja, eine Seed-Migration für den Standardkatalog (siehe T5)

## Ziel

Das Team pflegt im CRM einen **Katalog von Bausteinen** (Blöcke mit Feldern, Optionen, Übersetzungen, Bedingungen,
Gruppen) und **Vorlagen** (geordnete Blockauswahl). Nach dem Merge gibt es eine neue Seite „Onboarding-Vorlagen“ neben
dem Leistungskatalog, befüllt mit dem Standardkatalog und den Vorlagen „Landingpage kompakt“ und „Landingpage
ausführlich“. Bögen existieren noch nicht (Task 65).

Der **Block-Editor** dieses Tasks wird in Task 65 unverändert für Bogenblöcke wiederverwendet. Er wird deshalb von
Beginn an **owner-neutral** gebaut: Er kennt nur einen `OnboardingBlockDto` und eine injizierte Schreib-API.

## Entscheidungen

| Bereich                      | Entscheidung                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vorbild                      | Leistungskatalog: Seite `crm/line-item-templates`, Komponenten `components/workspace/crm/line-item-templates/*`, Dialog-Modus per Query-Parameter (`line-item-template-dialog-query.ts`), Client-Service `line-item-templates-api-service.ts`                                                        |
| Route                        | `SITE_ROUTES.CRM_ONBOARDING_TEMPLATES = "/crm/onboarding-templates"` mit Tabs über `?tab=blocks` bzw. `?tab=templates` (`TabList`); Editor-Seiten `/crm/onboarding-templates/blocks/[blockId]` und `/crm/onboarding-templates/templates/[templateId]` (Pfad-Helfer in `SITE_ROUTES`, keine Literale) |
| Warum eigene Editor-Seite    | Ein Block hat bis zu 60 Felder mit Übersetzungen; ein Dialog wäre zu eng. Die Liste bleibt schlank, der Editor bekommt die volle Breite                                                                                                                                                              |
| Sidebar                      | Eintrag direkt unter „Leistungskatalog“ in `workspace-sidebar.tsx`, sichtbar mit `onboarding_templates.read`                                                                                                                                                                                         |
| Rechte                       | Lesen `onboarding_templates.read`, alles Schreibende `onboarding_templates.write`. Workspace-weit (kein `canOn`, keine Kundenbindung); Endpunkte in `CRM_ENDPOINT_ACCESS_RULES` wie `LineItemTemplates`                                                                                              |
| Schreibgranularität          | Block (Kopf + Übersetzungen), Feld (Konfiguration + Übersetzungen + Optionen in **einem** Request), Feldreihenfolge, Vorlage (Kopf + Blockliste in einem Request). Jeder Request versioniert über `updateVersioned`                                                                                  |
| Optionen                     | Werden mit dem Feld gespeichert (ersetzen). Stabil über `key`; eine Option, die als Bedingungsauslöser genutzt wird, kann nicht entfernt werden (`ONBOARDING_INVALID_CONDITION`)                                                                                                                     |
| Feste Optionen               | `yes_no` legt serverseitig genau die Optionen `yes`/`no` an, `scale` genau `low`/`high` (Beschriftungen pflegbar, Keys fest); Stufen der Skala: `ONBOARDING_LIMITS` (5)                                                                                                                              |
| Übersetzungen                | Sprach-Tabs aus `SUPPORTED_LOCALES` im Editor. Speichern verlangt **mindestens eine** Locale je Element; fehlende Locales werden je Block als Hinweis-Badge gezeigt, blockieren aber nicht                                                                                                           |
| Löschen im Katalog           | Felder und Optionen sind löschbar (Bögen haben Kopien). Ein Block, der in einer Vorlage steckt, kann nicht gelöscht werden → nur archivieren. Unbenutzte Blöcke dürfen gelöscht werden                                                                                                               |
| Archiv                       | Archivierte Blöcke und Vorlagen sind in Auswahllisten (Vorlagen-Editor, Task 65) nicht mehr wählbar, bleiben lesbar und reaktivierbar                                                                                                                                                                |
| Blockschlüssel               | `key` wird beim Anlegen aus dem Titel vorgeschlagen, ist editierbar, im Katalog eindeutig                                                                                                                                                                                                            |
| Duplizieren und Kopierdienst | „Block duplizieren“ im Katalog braucht eine tiefe Kopie. Dieser Task liefert dafür den owner-neutralen Server-Service `onboardingBlockCopyService` (Kopie in einen Ziel-Owner: Katalog oder Bogen). Task 65 nutzt denselben Service für Vorlage → Bogen und Katalogblock → Bogen                     |
| Vorschau                     | Kein Portal-Rendering in diesem Task (Portal-Komponenten entstehen in Task 66). Der Editor zeigt eine kompakte Strukturansicht                                                                                                                                                                       |

## Architektur

```txt
Seiten (Server Components, noindex, force-dynamic)
  (app)/crm/onboarding-templates/page.tsx                        Tabs Bausteine | Vorlagen
  (app)/crm/onboarding-templates/blocks/[blockId]/page.tsx       Block-Editor (Katalog)
  (app)/crm/onboarding-templates/templates/[templateId]/page.tsx Vorlagen-Editor

API (workspace, Muster line-item-templates)
  GET    /api/workspace/crm/onboarding/blocks                    ?status=active|archived
  POST   /api/workspace/crm/onboarding/blocks                    Block anlegen (Titel, Key, carryOver)
  GET    /api/workspace/crm/onboarding/blocks/[blockId]
  PATCH  /api/workspace/crm/onboarding/blocks/[blockId]          Kopf, Übersetzungen, Status
  DELETE /api/workspace/crm/onboarding/blocks/[blockId]          nur unbenutzt
  POST   /api/workspace/crm/onboarding/blocks/[blockId]/duplicate
  POST   /api/workspace/crm/onboarding/blocks/[blockId]/fields   Feld anlegen (inkl. parentFieldId)
  PATCH  /api/workspace/crm/onboarding/fields/[fieldId]          Konfiguration + Übersetzungen + Optionen
  DELETE /api/workspace/crm/onboarding/fields/[fieldId]
  POST   /api/workspace/crm/onboarding/fields/[fieldId]/move     { direction: -1 | 1, expectedBlockVersion }
  GET/POST /api/workspace/crm/onboarding/templates
  GET/PATCH /api/workspace/crm/onboarding/templates/[templateId] Kopf + Blockliste

Die Feld- und Blockendpunkte prüfen den Owner: Sie bedienen hier ausschließlich Katalogblöcke
(owner_form_id IS NULL). Bogenblöcke bekommen in Task 65 eigene Endpunkte unter /forms/[formId]/…,
die dieselben Services aufrufen.

Server
  src/server/workspace/crm/services/onboarding/
    onboarding-definition-read-service.ts     Block inkl. Felder/Optionen/Übersetzungen laden → DTO
    onboarding-definition-write-service.ts    Block/Feld/Optionen/Übersetzungen schreiben, sortieren, löschen
                                              owner-neutral: bekommt tx + blockId, prüft Invarianten
    onboarding-definition-validation.ts       Typ-Konfiguration, Bedingungen, Gruppenebene, Limits
    onboarding-block-copy-service.ts          tiefe Kopie Block → Ziel-Owner (neue IDs, Bedingungen umhängen)
    onboarding-template-service.ts            Vorlage lesen/schreiben inkl. Blockliste
    onboarding-schemas.ts                     zod (nutzt validateOnboardingValue aus Task 63 nicht; nur Struktur)
    onboarding-mapper-service.ts              Zeilen → DTOs
  src/server/workspace/crm/command-handler/
    create-onboarding-block, update-onboarding-block, delete-onboarding-block, duplicate-onboarding-block,
    create-onboarding-field, update-onboarding-field, delete-onboarding-field, move-onboarding-field,
    create-onboarding-template, update-onboarding-template            (je *.command-handler.ts)
  src/server/workspace/crm/query-handler/
    list-onboarding-blocks, get-onboarding-block, list-onboarding-templates, get-onboarding-template
```

**Invarianten im Write-Service** (je mit Fehlercode aus Task 63, alle getestet):

- Feldtyp-Konfiguration passt zum Typ (`max_length` nur Text, `min/max_items` nur `files`/`group`/`multi_choice`,
  `accepted_asset_kinds` nur `files`, `prefill_source` nur zum passenden Typ laut
  `ONBOARDING_PREFILL_SOURCE_FIELD_TYPES`) → `ONBOARDING_INVALID_FIELD_CONFIG`.
- Auswahltypen haben mindestens zwei Optionen; `yes_no`/`scale` haben genau die festen Keys.
- Bedingung: Auslöser im selben Block, gleiche Ebene, kleinere Position, Auslösertyp in
  `ONBOARDING_CONDITION_TRIGGER_TYPE_VALUES`, Option gehört zum Auslöser → sonst `ONBOARDING_INVALID_CONDITION`.
  Verschieben eines Auslösers hinter ein abhängiges Feld wird abgelehnt.
- Unterfelder nur unter `group`, nie verschachtelt; `project_services` höchstens einmal je Block.
- Mindestens eine Übersetzung je Block, Feld und Option → `ONBOARDING_TRANSLATION_REQUIRED`.
- Limits aus `ONBOARDING_LIMITS` → `ONBOARDING_LIMIT_REACHED`.
- Vorlagen enthalten nur aktive Katalogblöcke, jeden höchstens einmal.

## UI

`apps/workspace/src/components/workspace/crm/onboarding/` (gruppierte Subfolder nach
`components/workspace/crm/AGENTS.md`):

```txt
catalog/
  onboarding-catalog-page-header/        Titel, Tabs, „Neuer Baustein“ / „Neue Vorlage“ (Muster line-item-templates-page-header)
  onboarding-block-list/                 Liste mit Titel, Key, Feldanzahl, firmenweit-Badge, fehlende Sprachen, Status
  onboarding-block-row/
  onboarding-template-list/
  onboarding-template-row/
  onboarding-block-create-dialog/        FormDialog: Titel (Locale des Nutzers), Key, firmenweit
  onboarding-template-create-dialog/
editor/                                  owner-neutral, in Task 65 wiederverwendet
  onboarding-block-editor/               Kopf (Titel/Intro je Sprache, carryOver), Feldliste, „Feld hinzufügen“
  onboarding-field-list/                 Reihenfolge ↑/↓, Gruppen eingerückt mit ihren Unterfeldern
  onboarding-field-row/                  Label, Typ-Icon, Pflicht, Bedingung als Kurztext, Bearbeiten/Löschen
  onboarding-field-dialog/               Typ, Pflicht, Sprach-Tabs (Label/Hilfe), typabhängige Konfiguration
  onboarding-field-config-fields/        schaltet je Typ: Grenzen, Dateiarten, Prefill-Quelle
  onboarding-choice-editor/              Optionen je Sprache, ↑/↓, hinzufügen/entfernen (feste Keys gesperrt)
  onboarding-condition-select/           Auslöserfeld + Option (nur gültige Kandidaten)
  onboarding-locale-tabs/                TabList über SUPPORTED_LOCALES mit Status „fehlt“
  onboarding-missing-locale-badge/
templates/
  onboarding-template-editor/            Titel, Beschreibung, Status, Blockliste
  ordered-block-list-editor/             generischer Listen-Editor: ↑/↓/entfernen/hinzufügen aus Katalog
                                         (nutzt moveListItem/removeListItem/insertListItem aus Task 63;
                                          Bedienmuster und aria-live wie ProcessStepEditor) — wird in Task 65
                                          für die Blockliste eines Bogens wiederverwendet
  onboarding-block-picker-dialog/        aktive Katalogblöcke durchsuchen und wählen
```

- **Injizierte Schreib-API:** `onboarding-block-editor` bekommt `api: OnboardingDefinitionClientApi` (Interface in
  `apps/workspace/src/common/contracts/crm/onboarding/onboarding-definition-client-api.ts`) mit
  `updateBlock`, `createField`, `updateField`, `deleteField`, `moveField`. Task 64 liefert die Katalog-Implementierung
  im Client-Service `src/client/crm/onboarding-catalog-api-service.ts`; Task 65 liefert die Bogen-Implementierung.
- Konflikt (409): Editor lädt den aktuellen Stand und zeigt einen Hinweis; eingegebene Dialogwerte bleiben erhalten
  (Muster `FeedbackTextDialog`).
- Endpunkte über `WorkspaceApiEndpoint` (`src/common/constants/api-endpoints.ts`), Operationen über `CrmOperation`.
- Dictionary: `src/i18n/dictionaries/workspace/crm/onboarding/{de,en}.json` (Namespace `catalog`, `editor`,
  `templates`, `fieldTypes`, `prefillSources`, `errors`). Feldtyp- und Prefill-Beschriftungen als
  `Record<OnboardingFieldType, string>`-Keys.
- Empty-States: Bausteine („Bausteine sind die Abschnitte eines Onboarding-Bogens …“, Aktion „Neuer Baustein“),
  Vorlagen, gefiltert „keine Treffer“.

## Tickets

### CRM-64-T1 — Definitions-Services und Kopierdienst

- **Files:** Services unter `services/onboarding/` + Tests (Integration gegen Test-DB wie bestehende Service-Tests)
- **Skills:** `best-practices`, `test-driven-development`
- **Akzeptanz:**
  - Jede Invariante oben hat einen Negativtest mit erwartetem Fehlercode
  - Kopie eines Blocks mit Gruppe und Bedingung: neue IDs überall, Bedingung zeigt auf das **kopierte** Auslöserfeld
    und die **kopierte** Option, `source_block_id` gesetzt, Übersetzungen vollständig
  - Kopie in der Transaktion des Aufrufers (bekommt `tx`), keine eigene Transaktion
  - Verschieben eines Feldes tauscht Positionen atomar (deferrable Unique-Index)

### CRM-64-T2 — Handler, Routen, Zugriff

- **Files:** Command-/Query-Handler, Routen, `CRM_ENDPOINT_ACCESS_RULES`, `CrmOperation`, `WorkspaceApiEndpoint`,
  Fehlerabbildung `src/lib/workspace/crm/onboarding-api-error.ts` (nicht exportierte Message-Map), Tests
- **Skills:** `best-practices`
- **Akzeptanz:**
  - Ohne `onboarding_templates.read` → 403 auf alle GET; ohne `write` → 403 auf alle Schreibpfade (Tests)
  - Katalog-Feldendpunkt auf ein Feld eines Bogenblocks → 404 (Owner-Prüfung; Test mit Seed-Bogen aus Task 63)
  - Löschen eines Blocks in einer Vorlage → 409 `ONBOARDING_BLOCK_IN_USE`
  - Versionskonflikt → 409 mit `VersionConflictDto`

### CRM-64-T3 — Katalogseite und Listen

- **Files:** Seite, `catalog/*`, `SITE_ROUTES`, Sidebar, Dictionaries, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Akzeptanz:**
  - Tab-Wechsel und Filter im URL-State; Reload landet im selben Tab
  - Fehlende Übersetzungen je Block sichtbar
  - Empty-States „noch nichts angelegt“ vs. „keine Treffer“ unterscheidbar
  - Tastatur, Fokus, Kontrast; Dark und Light

### CRM-64-T4 — Block- und Vorlagen-Editor

- **Files:** `editor/*`, `templates/*`, Client-Service, Client-API-Interface, Editor-Seiten, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Akzeptanz:**
  - Alle 14 Feldtypen anlegbar; typfremde Konfiguration ist im Dialog nicht sichtbar
  - Bedingungs-Auswahl bietet nur gültige Auslöser an
  - Gruppen-Unterfelder anlegen, sortieren, löschen
  - Vorlagen-Blockliste: hinzufügen aus Katalog, ↑/↓, entfernen; Änderungen per `aria-live` angesagt
  - `onboarding-block-editor` importiert keine Katalog-spezifischen Module (Test/Lint-Regel oder Review-Punkt), damit
    Task 65 ihn unverändert nutzen kann

### CRM-64-T5 — Standardkatalog als Seed-Migration

- **Files:** `packages/db/migrations/<nr>_seed_onboarding_standard_catalog.sql`, Test/Smoke
- **Skills:** `copywriting`
- **Inhalt:** Alle Blöcke, Felder, Optionen, Übersetzungen (DE **und** EN) und beide Vorlagen exakt nach
  [`64a-standardkatalog.md`](./64a-standardkatalog.md). Feste UUIDs (im SQL als Literale), `ON CONFLICT DO NOTHING`,
  damit ein zweiter Lauf folgenlos ist und im Katalog bearbeitete Inhalte nie überschrieben werden.
- **Warum Migration statt Seed-Skript:** Der Katalog ist Produktivinhalt, kein Testfixture; `db:seed:crm` ist in
  Produktion gesperrt.
- **Akzeptanz:**
  - Nach Migration existieren alle Blöcke aus 64a, jeder mit DE und EN; beide Vorlagen mit der dort genannten
    Reihenfolge (Smoke)
  - Jede Bedingung im Seed erfüllt die Invarianten aus T1 (Smoke lädt jeden Block über den Read-Service und prüft
    ihn mit der Validierung)

## Merge-Gate 15.2

- [ ] Seite „Onboarding-Vorlagen“ vollständig bedienbar, Standardkatalog und zwei Vorlagen vorhanden.
- [ ] Block-Editor owner-neutral (Schreib-API injiziert), Listen-Editor generisch.
- [ ] Alle neuen Endpunkte in `CRM_ENDPOINT_ACCESS_RULES`, Rechte-Negativtests grün.
- [ ] DE/EN-Dictionaries vollständig; Seed-Texte in DE und EN.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Workspace-Build grün.
