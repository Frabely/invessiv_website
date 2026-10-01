# Task 63 — Datenmodell, Konstanten und Regeln des Onboardings

> **Vor dem Start lesen:** [`README.md`](./README.md) dieses Ordners (Ablauf, Fachmodell, Regeln, Merge-Gates),
> `../00-entscheidungen.md`, `../AGENTS.md`, `packages/db/AGENTS.md`,
> `packages/db/src/record-configuration/crm/AGENTS.md`, `packages/common/AGENTS.md`. Diese Task-Datei plus README sind
> vollständig; die früheren Pläne 44–47 (Ordner 15b/15c) gelten nicht.

> **Status:** läuft · **Teil-PR:** 15.1 · **Branch:** `feat/crm-onboarding-1-datenmodell`
> **Abhängigkeiten:** Ordner 07, 13a, 14, 16 gemerged · **Aufwand:** 2–3 T. · **Dateien:** 55–75
> **Migration:** ja, zwei (Schema + Permissions; Nummern im Repo ermitteln, zum Planungszeitpunkt war `0046` die
> höchste)

## Ziel

Unsichtbares Fundament für den Onboarding-Baukasten: Tabellen, Constraints, Const-Objekte, DTOs, zod-Schemas, die
reine Vollständigkeitsfunktion, ein generisches Listen-Pattern und die Permissions. Nach dem Merge ist **nichts**
sichtbar; bestehende Pfade verhalten sich unverändert (einzige Ausnahme: ein reiner Refactor von
`project-process-plan.ts`, siehe Ticket T4, ohne Verhaltensänderung).

## Kernentscheidungen

| Bereich                      | Entscheidung                                                                                                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalog vs. Bogen            | **Dieselben Definitionstabellen.** `questionnaire_blocks.owner_form_id IS NULL` = Katalogblock, sonst gehört der Block genau einem Bogen. Kein zweites Schema für „Vorlage“ und „Kopie“                                                                                |
| Snapshot                     | Ein Bogen enthält eigene Blockkopien (Kopierdienst `questionnaireBlockCopyService` aus Task 64). Katalogänderungen wirken nie auf bestehende Bögen                                                                                                                     |
| Herkunft                     | `source_block_id` zeigt auf den Katalogblock, aus dem kopiert wurde (`ON DELETE SET NULL`). Wird für die Vorbefüllung aus dem Vorbogen gebraucht (gleiche Herkunft = gleicher Block)                                                                                   |
| Feldtypen                    | Const-Objekt `QuestionnaireFieldType` + DB-CHECK über `sqlCheckIn`. Kein Postgres-`ENUM`, kein TS-`enum`                                                                                                                                                               |
| Übersetzungen                | Je übersetzbarem Element eine Lokalisierungstabelle mit PK `(element_id, locale)`, `locale` per CHECK aus `SUPPORTED_LOCALES`. Mindestens eine Zeile je Element prüft der Schreibpfad (nicht die DB)                                                                   |
| Gruppen                      | `questionnaire_fields.parent_field_id` → Gruppenfeld desselben Blocks; genau eine Ebene (Trigger-frei: CHECK im Schreibpfad + Smoke). Unterfelder dürfen weder `group` noch `project_services` sein                                                                    |
| Bedingungen                  | `condition_field_id` + `condition_choice_id`. Auslöser nur `choice`, `multi_choice`, `yes_no` **im selben Block** auf derselben Ebene (Blockebene oder dieselbe Gruppe) mit kleinerer Position; `yes_no` hat genau zwei feste Optionen (`yes`, `no` über `choice_key`) |
| Antworten                    | Relationale Zeilen, kein `jsonb`. Mehrfachauswahl = mehrere Zeilen. Auswahl referenziert `choice_id`, Text steht in `value`                                                                                                                                            |
| Dateien                      | Verknüpfungstabelle `onboarding_answer_files` statt Spalten an `files` (anders als bei Feedbackrunden), weil die Vorbefüllung dieselbe Datei an einen zweiten Bogen hängt                                                                                              |
| Ein Bogen je Projekt         | `UNIQUE (project_id)` an `onboarding_forms`                                                                                                                                                                                                                            |
| Status                       | `draft`, `open`, `submitted`, `changes_requested`, `completed`; Übergänge in `ONBOARDING_FORM_TRANSITIONS`                                                                                                                                                             |
| Review je Block              | Spalten an `onboarding_form_blocks`: `review_status` (`pending`, `complete`, `clarification`), `clarification_mode` (`call`, `customer`), Notiz, Wer, Wann                                                                                                             |
| Keine fachlichen DB-Defaults | Nur `created_at`/`updated_at DEFAULT now()`. `id` erzeugt der Code (`crypto.randomUUID()`), `version` setzt der Anleger auf `1`                                                                                                                                        |
| Aktivitäten                  | Keine neuen Activity-Typen. Genutzt werden bestehende: `created` (Bogen angelegt), `status_change` (Freigabe, Nachforderung, Abschluss), `submission_received` (Absenden), `phase_change` (Phase weitergeschaltet, Task 70)                                            |
| Permissions                  | Neu: `questionnaire_templates.read/write` (workspace-weit, nicht scopable, Muster `line_item_templates.*` aus `0034`), `portal.onboarding.read/submit` (Portal, Muster `0046`). Bogenarbeit intern über bestehende `projects.read/write`                               |

## Datenmodell

Migration `<nr>_create_onboarding.sql`, additiv und idempotent (`CREATE … IF NOT EXISTS`, `--> statement-breakpoint`,
Constraints über `DO $$ … IF NOT EXISTS`). SQL-Formatierung nach `packages/db/AGENTS.md` (einfache Spalten einzeilig).
Präfix-Regel: `onboarding_forms` ist Aggregat am Projekt; Katalogtabellen tragen das Präfix `onboarding_`, weil sie
fachlich zum Onboarding gehören (Eintrag in `00-entscheidungen.md`, Abschnitt Tabellennamen, ergänzen).

### Katalog- und Definitionstabellen

```txt
onboarding_forms                                  (zuerst anlegen, weil questionnaire_blocks darauf zeigt)
  id                                   uuid PK
  customer_id                          uuid NOT NULL
  project_id                           uuid NOT NULL
  source_template_id                   uuid NULL → questionnaire_templates.id ON DELETE SET NULL
  status                               text NOT NULL CHECK in ONBOARDING_FORM_STATUS_VALUES
  created_by_member_id                 uuid NOT NULL → workspace_members.id
  released_at                          timestamptz NULL
  released_by_member_id                uuid NULL → workspace_members.id
  submitted_at                         timestamptz NULL                   letztes Absenden
  submitted_by_portal_membership_id    uuid NULL → portal_memberships.id ON DELETE SET NULL
  services_confirmed_at                timestamptz NULL
  services_confirmed_by_portal_membership_id uuid NULL → portal_memberships.id ON DELETE SET NULL
  services_note                        text NULL CHECK (length(services_note) <= 2000)
  call_held_on                         date NULL
  completed_at                         timestamptz NULL
  completed_by_member_id               uuid NULL → workspace_members.id
  version                              integer NOT NULL CHECK (version > 0)
  created_at, updated_at               timestamptz NOT NULL DEFAULT now()

  FK   onboarding_forms_project_customer_fk (project_id, customer_id) → projects (id, customer_id) ON DELETE CASCADE
  UNIQUE onboarding_forms_project_uidx (project_id)
  UNIQUE onboarding_forms_id_customer_uidx (id, customer_id)          Ziel für Portal-Joins
  UNIQUE onboarding_forms_id_project_uidx (id, project_id)            Ziel des FK aus tasks (Task 68)
  INDEX  onboarding_forms_customer_idx (customer_id, completed_at DESC)   Vorbogen-Suche
  CHECK  status = 'draft'  ⇔ released_at IS NULL
  CHECK  released_at IS NULL OR released_by_member_id IS NOT NULL
  CHECK  status IN ('submitted','changes_requested','completed') ⇒ submitted_at IS NOT NULL
  CHECK  status = 'completed' ⇔ (completed_at IS NOT NULL AND completed_by_member_id IS NOT NULL AND call_held_on IS NOT NULL)
  CHECK  services_confirmed_by_portal_membership_id IS NULL OR services_confirmed_at IS NOT NULL

questionnaire_templates
  id                     uuid PK
  title                  text NOT NULL CHECK (btrim(title) <> '' AND length(title) <= 120)   intern, nicht übersetzt
  description            text NULL CHECK (length(description) <= 1000)
  status                 text NOT NULL CHECK in QUESTIONNAIRE_CATALOG_STATUS_VALUES ('active','archived')
  version                integer NOT NULL CHECK (version > 0)
  created_at, updated_at timestamptz NOT NULL DEFAULT now()

questionnaire_blocks
  id                     uuid PK
  owner_form_id          uuid NULL → onboarding_forms.id ON DELETE CASCADE      NULL = Katalog
  source_block_id        uuid NULL → questionnaire_blocks.id ON DELETE SET NULL    Herkunft der Kopie
  key                    text NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]{1,62}$')  interner Schlüssel, z. B. company_profile
  carry_over             boolean NOT NULL                                       firmenweit → Vorbefüllung
  status                 text NOT NULL CHECK in QUESTIONNAIRE_CATALOG_STATUS_VALUES
  version                integer NOT NULL CHECK (version > 0)
  created_at, updated_at timestamptz NOT NULL DEFAULT now()

  UNIQUE questionnaire_blocks_catalog_key_uidx (key) WHERE owner_form_id IS NULL
  UNIQUE questionnaire_blocks_id_owner_uidx (id, owner_form_id)        Ziel für form_blocks
  CHECK  owner_form_id IS NULL OR status = 'active'                  Bogenblöcke werden entfernt, nie archiviert
  CHECK  owner_form_id IS NOT NULL OR source_block_id IS NULL        Katalogblöcke haben keine Herkunft
  INDEX  questionnaire_blocks_owner_idx (owner_form_id)
  INDEX  questionnaire_blocks_source_idx (source_block_id) WHERE source_block_id IS NOT NULL

questionnaire_block_translations
  block_id               uuid NOT NULL → questionnaire_blocks.id ON DELETE CASCADE
  locale                 text NOT NULL CHECK in SUPPORTED_LOCALES
  title                  text NOT NULL CHECK (btrim(title) <> '' AND length(title) <= 120)
  intro                  text NULL CHECK (length(intro) <= 2000)          Hinweistext über dem Schritt
  PRIMARY KEY (block_id, locale)

questionnaire_fields
  id                     uuid PK
  block_id               uuid NOT NULL → questionnaire_blocks.id ON DELETE CASCADE
  parent_field_id        uuid NULL → questionnaire_fields.id ON DELETE CASCADE    Unterfeld einer Gruppe
  key                    text NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]{1,62}$')
  position               integer NOT NULL CHECK (position >= 0 AND position < 100)
  type                   text NOT NULL CHECK in QUESTIONNAIRE_FIELD_TYPE_VALUES
  requirement            text NOT NULL CHECK in QUESTIONNAIRE_FIELD_REQUIREMENT_VALUES ('required','optional')
  max_length             integer NULL CHECK (max_length BETWEEN 1 AND 50000)
  min_items              integer NULL CHECK (min_items BETWEEN 0 AND 100)
  max_items              integer NULL CHECK (max_items BETWEEN 1 AND 100)
  accepted_asset_kinds   text[] NULL                                  Teilmenge von ASSET_KIND_VALUES (files/asset-kind.ts), Anwendung prüft
  prefill_source         text NULL CHECK in QUESTIONNAIRE_PREFILL_SOURCE_VALUES
  condition_field_id     uuid NULL → questionnaire_fields.id ON DELETE SET NULL
  condition_choice_id    uuid NULL → questionnaire_field_choices.id ON DELETE SET NULL   (FK nach Anlage der Choices ergänzen)
  version                integer NOT NULL CHECK (version > 0)
  created_at, updated_at timestamptz NOT NULL DEFAULT now()

  UNIQUE questionnaire_fields_block_key_uidx (block_id, key)
  UNIQUE questionnaire_fields_position_uidx (block_id, parent_field_id, position) NULLS NOT DISTINCT
         DEFERRABLE INITIALLY IMMEDIATE                                Tauschen beim Sortieren
  CHECK  (condition_field_id IS NULL) = (condition_choice_id IS NULL)
  CHECK  min_items IS NULL OR max_items IS NULL OR min_items <= max_items
  CHECK  max_length IS NULL OR type IN ('short_text','long_text')
  CHECK  (min_items IS NULL AND max_items IS NULL) OR type IN ('files','group','multi_choice')
  CHECK  accepted_asset_kinds IS NULL OR type = 'files'
  CHECK  parent_field_id IS NULL OR type NOT IN ('group','project_services')
  INDEX  questionnaire_fields_block_idx (block_id, position)

questionnaire_field_translations
  field_id               uuid NOT NULL → questionnaire_fields.id ON DELETE CASCADE
  locale                 text NOT NULL CHECK in SUPPORTED_LOCALES
  label                  text NOT NULL CHECK (btrim(label) <> '' AND length(label) <= 300)
  help                   text NULL CHECK (length(help) <= 2000)
  PRIMARY KEY (field_id, locale)

questionnaire_field_choices
  id                     uuid PK
  field_id               uuid NOT NULL → questionnaire_fields.id ON DELETE CASCADE
  key                    text NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]{0,62}$')    yes/no bei yes_no; low/high bei scale
  position               integer NOT NULL CHECK (position >= 0 AND position < 50)
  version                integer NOT NULL CHECK (version > 0)
  UNIQUE questionnaire_field_choices_field_key_uidx (field_id, key)
  UNIQUE questionnaire_field_choices_position_uidx (field_id, position) DEFERRABLE INITIALLY IMMEDIATE
  UNIQUE questionnaire_field_choices_id_field_uidx (id, field_id)

questionnaire_choice_translations
  choice_id              uuid NOT NULL → questionnaire_field_choices.id ON DELETE CASCADE
  locale                 text NOT NULL CHECK in SUPPORTED_LOCALES
  label                  text NOT NULL CHECK (btrim(label) <> '' AND length(label) <= 200)
  PRIMARY KEY (choice_id, locale)

questionnaire_template_blocks
  template_id            uuid NOT NULL → questionnaire_templates.id ON DELETE CASCADE
  block_id               uuid NOT NULL → questionnaire_blocks.id ON DELETE RESTRICT
  position               integer NOT NULL CHECK (position >= 0 AND position < 100)
  PRIMARY KEY (template_id, block_id)
  UNIQUE questionnaire_template_blocks_position_uidx (template_id, position) DEFERRABLE INITIALLY IMMEDIATE
```

Dass `questionnaire_template_blocks.block_id` nur auf Katalogblöcke zeigt, prüft der Schreibpfad (Task 64) und der Smoke;
ein CHECK über zwei Tabellen ist ohne Trigger nicht möglich.

### Bogentabellen

```txt
onboarding_form_blocks
  form_id                uuid NOT NULL → onboarding_forms.id ON DELETE CASCADE
  block_id               uuid NOT NULL
  position               integer NOT NULL CHECK (position >= 0 AND position < 100)
  review_status          text NOT NULL CHECK in ONBOARDING_BLOCK_REVIEW_STATUS_VALUES
  clarification_mode     text NULL CHECK in ONBOARDING_CLARIFICATION_MODE_VALUES ('call','customer')
  review_note            text NULL CHECK (length(review_note) <= 2000)
  reviewed_by_member_id  uuid NULL → workspace_members.id
  reviewed_at            timestamptz NULL
  version                integer NOT NULL CHECK (version > 0)
  PRIMARY KEY (form_id, block_id)
  FK   onboarding_form_blocks_block_owner_fk (block_id, form_id) → questionnaire_blocks (id, owner_form_id) ON DELETE CASCADE
  UNIQUE onboarding_form_blocks_position_uidx (form_id, position) DEFERRABLE INITIALLY IMMEDIATE
  CHECK (review_status = 'clarification') = (clarification_mode IS NOT NULL)
  CHECK review_status = 'pending' OR (reviewed_by_member_id IS NOT NULL AND reviewed_at IS NOT NULL)
  CHECK clarification_mode IS NULL OR btrim(coalesce(review_note,'')) <> ''

onboarding_group_entries
  id                     uuid PK                       vom Client erzeugt (stabil über Autosave)
  form_id                uuid NOT NULL → onboarding_forms.id ON DELETE CASCADE
  field_id               uuid NOT NULL → questionnaire_fields.id ON DELETE CASCADE   Gruppenfeld
  position               integer NOT NULL CHECK (position >= 0 AND position < 100)
  created_at, updated_at timestamptz NOT NULL DEFAULT now()
  UNIQUE onboarding_group_entries_position_uidx (field_id, position) DEFERRABLE INITIALLY IMMEDIATE
  UNIQUE onboarding_group_entries_id_form_uidx (id, form_id)

onboarding_answers
  id                     uuid PK
  form_id                uuid NOT NULL → onboarding_forms.id ON DELETE CASCADE
  field_id               uuid NOT NULL → questionnaire_fields.id ON DELETE CASCADE
  group_entry_id         uuid NULL
  choice_id              uuid NULL
  value                  text NULL CHECK (value IS NULL OR (btrim(value) <> '' AND length(value) <= 50000))
  sort_order             integer NOT NULL CHECK (sort_order >= 0 AND sort_order < 100)
  updated_by_portal_membership_id uuid NULL → portal_memberships.id ON DELETE SET NULL
  updated_by_member_id   uuid NULL → workspace_members.id
  created_at, updated_at timestamptz NOT NULL DEFAULT now()
  FK   onboarding_answers_entry_form_fk (group_entry_id, form_id) → onboarding_group_entries (id, form_id) ON DELETE CASCADE
  FK   onboarding_answers_choice_field_fk (choice_id, field_id) → questionnaire_field_choices (id, field_id) ON DELETE CASCADE
  UNIQUE onboarding_answers_slot_uidx (field_id, group_entry_id, sort_order) NULLS NOT DISTINCT
  CHECK num_nonnulls(value, choice_id) = 1
  CHECK num_nonnulls(updated_by_portal_membership_id, updated_by_member_id) <= 1
  INDEX onboarding_answers_form_idx (form_id)

onboarding_answer_files
  id                     uuid PK
  form_id                uuid NOT NULL → onboarding_forms.id ON DELETE CASCADE
  field_id               uuid NOT NULL → questionnaire_fields.id ON DELETE CASCADE
  group_entry_id         uuid NULL
  file_id                uuid NOT NULL → files.id ON DELETE CASCADE
  position               integer NOT NULL CHECK (position >= 0 AND position < 100)
  created_at             timestamptz NOT NULL DEFAULT now()
  FK   onboarding_answer_files_entry_form_fk (group_entry_id, form_id) → onboarding_group_entries (id, form_id) ON DELETE CASCADE
  UNIQUE onboarding_answer_files_slot_uidx (field_id, group_entry_id, file_id) NULLS NOT DISTINCT
  INDEX onboarding_answer_files_file_idx (file_id)

onboarding_form_services                          Snapshot beim Abschluss (Task 70)
  id                     uuid PK
  form_id                uuid NOT NULL → onboarding_forms.id ON DELETE CASCADE
  project_line_item_id   uuid NULL → project_line_items.id ON DELETE SET NULL
  title                  text NOT NULL
  description            text NULL
  position               integer NOT NULL CHECK (position >= 0)
  created_at             timestamptz NOT NULL DEFAULT now()
  UNIQUE onboarding_form_services_position_uidx (form_id, position)
```

Hinweise:

- Bewusst **keine** Spalte „zuletzt bearbeitet“ am Bogenkopf: Das Autosave je Feld (Task 66) schreibt nur
  Antwortzeilen und würde sonst bei jedem Tastendruck die `version` des Bogens erhöhen und parallele interne
  Bearbeiter in Konflikte treiben. „Zuletzt bearbeitet von … um …“ wird aus der jüngsten Antwort-, Gruppen- bzw.
  Dateizeile abgeleitet (`updated_at`, `updated_by_*`).
- `onboarding_answers` enthält **keine** Zeilen für `files`, `group` und `project_services`: Dateien liegen in
  `onboarding_answer_files`, Gruppen in `onboarding_group_entries`, die Leistungsbestätigung an `onboarding_forms`.
- Dass eine Antwort bzw. Datei nur an einem Feld desselben Bogens hängt (`field.block.owner_form_id = form_id`), sichert
  der Schreibpfad; der Smoke prüft den Negativfall mit einem Feld eines fremden Bogens.
- Eine Datei, die an einem Bogen hängt, darf nicht gelöscht werden, solange der Bogen nicht `completed` ist — die
  Prüfung ergänzt Task 67 im bestehenden Datei-Löschpfad (`FILE_ONBOARDING_BOUND`, analog `FILE_FEEDBACK_BOUND`).

### Drizzle und Constraint-Namen

- Modelle in `packages/db/src/record-configuration/crm/` je Tabelle eine Datei (`onboarding-forms.ts`,
  `questionnaire-templates.ts`, `questionnaire-blocks.ts`, `questionnaire-block-translations.ts`, `questionnaire-fields.ts`,
  `questionnaire-field-translations.ts`, `questionnaire-field-choices.ts`, `questionnaire-choice-translations.ts`,
  `questionnaire-template-blocks.ts`, `onboarding-form-blocks.ts`, `onboarding-group-entries.ts`,
  `onboarding-answers.ts`, `onboarding-answer-files.ts`, `onboarding-form-services.ts`), Barrel `crm/index.ts`.
- Constraint- und Indexnamen je Tabelle als Const-Objekt in `packages/db/src/constraint-names/crm/onboarding-*.ts` (+
  Tests nach Muster `feedback-rounds-constraint-names.test.ts`). CHECKs für String-Unions über `sqlCheckIn` aus
  `@invessiv/db/core` mit den `_VALUES`-Arrays.
- Deckungsgleich zur Migration — expliziter Review-Punkt im PR.

### Permissions-Migration

`<nr+1>_add_onboarding_permissions.sql` nach Muster `0034` (workspace) und `0046` (portal):

- `questionnaire_templates.read`, `questionnaire_templates.write`: realm `workspace`, `delegable TRUE`,
  `scope_assignable FALSE`; dieselben Systemrollen wie `line_item_templates.*` in `0034`.
- `portal.onboarding.read`, `portal.onboarding.submit`: realm `portal`, in `portal_standard`
  (`7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04`). Eigene Portalrollen bekommen nichts.
- Code: `Permission.QuestionnaireTemplatesRead/Write`, `Permission.PortalOnboardingRead/Submit` in
  `packages/common/src/constants/auth/permissions.ts`, Systemrollen in `system-role-definitions.ts`,
  `apps/workspace/src/common/constants/access/permission-groups.ts` (Gruppe wie `LineItemTemplates*`), Dictionary-Texte
  der Rechteverwaltung (DE/EN). `db:smoke` (Katalog-Gate `rbac-catalog-check.ts`) muss grün sein.

## Konstanten, Contracts, Patterns

`packages/common/src/constants/crm/onboarding/` (neuer Unterordner, weil mehr als fünf Dateien entstehen):

- `questionnaire-field-types.ts`: `QuestionnaireFieldType` (`ShortText`, `LongText`, `Email`, `Phone`, `Url`, `Choice`,
  `MultiChoice`, `YesNo`, `Scale`, `Color`, `Files`, `Confirmation`, `Group`, `ProjectServices`),
  `QUESTIONNAIRE_FIELD_TYPE_VALUES`, `QUESTIONNAIRE_CHOICE_FIELD_TYPE_VALUES` (Felder mit Optionen: choice, multi_choice, yes_no, scale),
  `QUESTIONNAIRE_CHOICE_ANSWER_TYPE_VALUES` (Antwort als `choice_id`: choice, multi_choice, yes_no),
  `QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES` (choice, multi_choice, yes_no), `QUESTIONNAIRE_TEXT_FIELD_TYPE_VALUES`.
- `questionnaire-field-requirements.ts`: `QuestionnaireFieldRequirement` (`Required`, `Optional`).
- `onboarding-form-statuses.ts`: `OnboardingFormStatus`, `ONBOARDING_FORM_STATUS_VALUES`,
  `ONBOARDING_CUSTOMER_EDITABLE_STATUS_VALUES` (`open`, `changes_requested`),
  `ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES` (alles außer `draft`).
- `onboarding-form-transitions.ts`: `ONBOARDING_FORM_TRANSITIONS` mit `from`, `to`, `side`:
  `draft→open` (intern, Freigabe), `open→submitted` (Kunde), `submitted→changes_requested` (intern),
  `changes_requested→submitted` (Kunde), `submitted→completed` (intern). Kein Weg zurück aus `completed`.
- `questionnaire-catalog-statuses.ts`: `QuestionnaireCatalogStatus` (`Active`, `Archived`).
- `onboarding-block-review-statuses.ts`: `OnboardingBlockReviewStatus` (`Pending`, `Complete`, `Clarification`).
- `onboarding-clarification-modes.ts`: `OnboardingClarificationMode` (`Call`, `Customer`).
- `questionnaire-prefill-sources.ts`: `QuestionnairePrefillSource` (`CustomerCompanyName`, `CustomerAddress`,
  `CustomerVatId`, `CustomerWebsiteUrl`, `PrimaryContactName`, `PrimaryContactEmail`, `PrimaryContactPhone`) plus
  `QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES`: `Record<QuestionnairePrefillSource, QuestionnaireFieldType>` (welcher Feldtyp zu
  welcher Quelle passt).
- `questionnaire-yes-no-choice-keys.ts`: `QuestionnaireYesNoChoiceKey` (`Yes: "yes"`, `No: "no"`),
  `questionnaire-scale-choice-keys.ts` (`Low: "low"`, `High: "high"`). Bei `scale` sind die beiden Optionen nur die
  **Pol-Beschriftungen**; die Antwort ist eine Stufe in `value` (`"1"` … `"5"`), keine `choice_id`.
- `questionnaire-limits.ts`: `QUESTIONNAIRE_LIMITS` (Blöcke je Owner 60, Felder je Block 60, Unterfelder je Gruppe 30,
  Optionen je Feld 30, Gruppeneinträge 50, Dateien je Feld 30, Standard-`max_length` short 300 / long 5 000,
  Titel 120, Label 300, Hilfe 2 000, Notiz 2 000, Skalenstufen 5).
- `errors/onboarding-error-codes.ts` (in `packages/common/src/constants/crm/errors/`): `ONBOARDING_FORM_NOT_FOUND`,
  `QUESTIONNAIRE_TEMPLATE_NOT_FOUND`, `QUESTIONNAIRE_BLOCK_NOT_FOUND`, `QUESTIONNAIRE_FIELD_NOT_FOUND`,
  `ONBOARDING_FORM_EXISTS`, `ONBOARDING_INVALID_TRANSITION`, `ONBOARDING_NOT_EDITABLE`, `QUESTIONNAIRE_TRANSLATION_REQUIRED`,
  `QUESTIONNAIRE_INVALID_CONDITION`, `QUESTIONNAIRE_INVALID_FIELD_CONFIG`, `QUESTIONNAIRE_BLOCK_IN_USE`,
  `ONBOARDING_REQUIRED_MISSING`, `ONBOARDING_REVIEW_INCOMPLETE`, `ONBOARDING_CALL_DATE_REQUIRED`,
  `QUESTIONNAIRE_LIMIT_REACHED`, `ONBOARDING_FILE_NOT_ATTACHABLE`, `VALIDATION_ERROR` (+ Test nach Muster
  `project-error-codes.test.ts`).
- `packages/common/src/constants/portal/portal-onboarding-error-codes.ts` (Muster `portal-feedback-error-codes.ts`):
  `not_found`, `locked`, `validation`, `required_missing`, `limit_reached`, `not_attachable`.

`packages/common/src/contracts/crm/onboarding/`:

- `onboarding-definition.dto.ts`: `QuestionnaireChoiceDto` (`id`, `key`, `position`, `labels: Partial<Record<Locale,
string>>`), `QuestionnaireFieldDto` (alle Spalten + `translations: Partial<Record<Locale, {label, help}>>`, `choices`,
  `children: QuestionnaireFieldDto[]` bei Gruppen), `QuestionnaireBlockDto` (`id`, `key`, `carryOver`, `status`,
  `sourceBlockId`, `translations`, `fields`, `version`).
- `questionnaire-template.dto.ts`: `QuestionnaireTemplateDto` (`id`, `title`, `description`, `status`, `blocks: {blockId,
position}[]`, `version`), `QuestionnaireTemplateSummaryDto`.
- `questionnaire-answer.dto.ts`: `QuestionnaireAnswerDto` (`fieldId`, `groupEntryId`, `sortOrder`, `value`, `choiceId`),
  `QuestionnaireAnswerFileDto` (`fieldId`, `groupEntryId`, `file: FileEntryDto`-Teilmenge, die das Dateimodul bereits
  nutzt), `QuestionnaireGroupEntryDto`.
- `onboarding-form.dto.ts`: `OnboardingFormDto` (Kopf, `blocks` mit Review-Spalten und Definition, `answers`,
  `answerFiles`, `groupEntries`, `services` = aktuelle Projektleistungen bzw. Snapshot, `version`),
  `OnboardingFormSummaryDto` (für Projektbereich und Widget: `id`, `status`, `progress`, `submittedAt`,
  `completedAt`).
- Request-DTOs entstehen in dem Task, der ihre Route baut.

`packages/common/src/patterns/crm/onboarding/` (seiteneffektfrei, vollständig getestet):

- `questionnaire-completeness.ts` — **die einzige Stelle** für Sichtbarkeit, Pflichtprüfung und Fortschritt:

  ```ts
  export interface QuestionnaireCompletenessInput {
    blocks: readonly QuestionnaireBlockDto[]; // in Bogenreihenfolge
    answers: readonly QuestionnaireAnswerDto[];
    answerFiles: readonly OnboardingAnswerFileRef[]; // { fieldId, groupEntryId }
    groupEntries: readonly QuestionnaireGroupEntryDto[];
    servicesConfirmed: boolean;
  }
  export interface QuestionnaireMissingField {
    blockId: string;
    fieldId: string;
    groupEntryId: string | null;
  }
  export interface QuestionnaireBlockProgress {
    blockId: string;
    answeredRequired: number;
    totalRequired: number;
  }
  export function isQuestionnaireFieldVisible(field, input): boolean;
  export function getQuestionnaireCompleteness(input): {
    missing: readonly QuestionnaireMissingField[];
    blocks: readonly QuestionnaireBlockProgress[];
    answeredRequired: number;
    totalRequired: number;
    ratio: number; // 0 bei totalRequired = 0, nie NaN
  };
  ```

  Regeln: Ein unsichtbares Feld (Bedingung nicht erfüllt, oder Auslöserfeld selbst unsichtbar) zählt nie.
  `required` bedeutet: Textfeld, `color`, `scale` mit Wert; `choice`/`yes_no` mit gewählter Option; `multi_choice`/`files`/`group` mit
  mindestens `max(1, min_items)` Einträgen; `confirmation` mit Wert `"true"`; `project_services` erfüllt, wenn
  `servicesConfirmed`. `min_items` gilt auch bei optionalen Feldern, sobald mindestens ein Eintrag existiert.
  Pflichtunterfelder einer Gruppe gelten je vorhandenem Eintrag.

- `questionnaire-field-value.ts`: `validateQuestionnaireValue(field, raw)` → `ok | { code }` für E-Mail, Telefon
  (lockeres Muster), URL (`https?://`), Farbe (`^#[0-9a-fA-F]{6}$`), Skala (ganze Zahl `1…QUESTIONNAIRE_LIMITS.scaleSteps`),
  `max_length`, `confirmation` (`"true"`).
  Wird von zod-Schemas (Server) und Feldkomponenten (Client) genutzt.
- `questionnaire-translation.ts`: `resolveQuestionnaireText(translations, preferred: Locale)` → `{ text, locale,
isFallback }` (Reihenfolge: bevorzugte Locale, dann `SUPPORTED_LOCALES`-Reihenfolge) und
  `missingQuestionnaireLocales(block)` → `Locale[]` (für die Sprachwarnung in Task 66/67).

`packages/common/src/patterns/shared/ordered-list.ts` (generisch, für Task 64/65/67 und `project-process-plan.ts`):

```ts
export function moveListItem<T>(
  items: readonly T[],
  index: number,
  direction: -1 | 1,
): T[];
export function removeListItem<T>(items: readonly T[], index: number): T[];
export function insertListItem<T>(
  items: readonly T[],
  index: number,
  item: T,
): T[];
```

## Tickets

### CRM-63-T1 — Konstanten, Fehlercodes, Contracts

- **Files:** Dateien unter `constants/crm/onboarding/`, `errors/onboarding-error-codes.ts`,
  `portal-onboarding-error-codes.ts`, Contracts unter `contracts/crm/onboarding/`, Tests
- **Skills:** `best-practices`
- **Akzeptanz:**
  - Jede String-Union als Const-Objekt + abgeleiteter Typ + `_VALUES`; kein `enum` (Test je Datei wie bestehende)
  - `ONBOARDING_FORM_TRANSITIONS` enthält keinen Übergang aus `completed` (Test)
  - `QUESTIONNAIRE_PREFILL_SOURCE_FIELD_TYPES` deckt jede Quelle ab (`satisfies Record<…>`)

### CRM-63-T2 — Migration, Modelle, Constraint-Namen, Seed, Smoke

- **Files:** zwei Migrationen, 14 `pgTable`-Dateien, Barrel, Constraint-Namen + Tests,
  `scripts/crm-fixture/**` bzw. `seed-crm-fixture.ts` (ein Beispielbogen im Status `open` mit Antworten, nur Seed),
  `scripts/smoke-crm-constraints.ts` (`runMissingDefaultChecks` + Onboarding-Negativfälle), Permissions im Code
- **Skills:** `best-practices`
- **Akzeptanz:**
  - Zweiter Bogen für dasselbe Projekt wird abgelehnt (Smoke)
  - Bogen mit Projekt eines fremden Kunden wird vom zusammengesetzten FK abgelehnt (Smoke)
  - `status = 'completed'` ohne `call_held_on` wird abgelehnt (Smoke)
  - Antwort mit `value` und `choice_id` gleichzeitig bzw. ohne beides wird abgelehnt (Smoke)
  - Choice eines anderen Feldes an einer Antwort wird vom FK abgelehnt (Smoke)
  - Jede neue Tabelle lehnt fehlende Fachwerte ab (`runMissingDefaultChecks`)
  - Zweiter Migrationslauf ist folgenlos; `db:smoke` inklusive RBAC-Katalog grün
  - Drizzle-Modelle deckungsgleich (Review-Punkt)

### CRM-63-T3 — Vollständigkeit, Wertvalidierung, Übersetzungsauflösung

- **Files:** drei Pattern-Dateien + Tests
- **Skills:** `best-practices`, `test-driven-development`
- **Akzeptanz (Tests):**
  - Leerer Bogen: `ratio = 0`, nicht `NaN`; Bogen ohne Pflichtfelder: `ratio = 1`
  - Pflichtfeld hinter nicht erfüllter Bedingung fehlt nicht; nach Erfüllen der Bedingung fehlt es
  - Verkettete Bedingung (Auslöser selbst unsichtbar) → Feld unsichtbar
  - Bedingung in einem Gruppenunterfeld wird je Gruppeneintrag ausgewertet
  - Gruppe mit `min_items = 2` und einem Eintrag → fehlt; Pflichtunterfeld leer in Eintrag 2 → fehlt mit
    `groupEntryId`
  - `project_services` Pflicht: fehlt ohne Bestätigung
  - `confirmation` nur mit `"true"` erfüllt
  - `resolveQuestionnaireText` liefert Fallback mit `isFallback = true`, wenn die bevorzugte Locale fehlt

### CRM-63-T4 — Generisches Listen-Pattern und Refactor

- **Files:** `packages/common/src/patterns/shared/ordered-list.ts` + Test,
  `apps/workspace/src/common/patterns/crm/project-process-plan.ts` (nutzt die neuen Funktionen intern, öffentliche API
  unverändert), bestehende Tests
- **Skills:** `best-practices`
- **Akzeptanz:**
  - Alle bestehenden Tests von `project-process-plan` grün ohne Änderung an Erwartungen
  - Verschieben über die Ränder hinaus ist ein No-op (Test)

### CRM-63-T5 — Dokumentation und scoped Regeln

- **Files:** `plans/crm/00-entscheidungen.md`; Ergänzung in `packages/db/src/record-configuration/crm/AGENTS.md`
  (Abschnitt „Onboarding“: Katalog und Bogen teilen Tabellen, Owner-Regel `owner_form_id`, tabellenübergreifende
  Regeln sichert der Schreibpfad, der Smoke deckt sie ab)
- **Skills:** —
- **Inhalt `00-entscheidungen.md`** (bereits bei der Planung am 30.09.2026 eingepflegt — in diesem Ticket nur
  prüfen und Abweichungen aus der Umsetzung nachziehen):
  - Abschnitt „Onboarding und Medien“: Absätze zum Bogen neu fassen (Baukasten in DB, Übersetzungstabellen,
    Snapshot je Projekt, Status `completed` statt Phasenableitung, keine Aufgaben-Verzahnung, keine Passwörter,
    Buchungslink bleibt).
  - Liste „Bewusst nicht Teil“: Zeile „Pflegeoberfläche für Onboarding-Fragen …“ entfernen.
  - Tabellenbaum und Tabellenliste: `onboarding_submissions`/`onboarding_answers`/`onboarding_answer_files` durch die
    Tabellen dieses Tasks ersetzen; Präfix-Absatz anpassen.
  - Statustabelle: Zeilen 15b und 15c durch eine Zeile `15 | offen | 15-onboarding | …` ersetzen.
- **Akzeptanz:** Kein Widerspruch zwischen `00-entscheidungen.md` und der README dieses Ordners (Review-Punkt)

## Umsetzungsnotizen (Abweichungen vom Plan, 30.09.2026)

Bei der Umsetzung nachgezogen; der Plan oben bleibt als Entstehungsstand stehen, maßgeblich ist der Code.

- **Migration `0047_create_onboarding.sql`** enthält Schema und Permissions. Reihenfolge der Tabellen: zuerst
  `questionnaire_templates`, dann `onboarding_forms` (der Bogen verweist auf die Vorlage), dann `questionnaire_blocks`.
- **Bedingung als ein zusammengesetzter Schlüssel** statt zweier einzelner `SET NULL`-Schlüssel:
  `questionnaire_fields_condition_choice_fk (condition_choice_id, condition_field_id) → questionnaire_field_choices (id,
field_id) ON DELETE SET NULL`. Zwei Einzelschlüssel hätten beim Löschen einer Option nur eine Spalte geleert,
  `condition_pair_check` verletzt und das Löschen abgebrochen. Der zusammengesetzte Schlüssel leert beide Spalten und
  erzwingt zusätzlich, dass die Option zum Auslöserfeld gehört.
- **Listen-Pattern** liegt unter `packages/common/src/patterns/collections/ordered-list.ts` (bestehender Ordner für
  generische Sammlungshelfer, neben `same-sequence.ts`) statt unter `patterns/shared/`.
- **Typen der Vollständigkeitsfunktion** (`QuestionnaireCompletenessInput`, `QuestionnaireMissingField`,
  `QuestionnaireBlockProgress`, `QuestionnaireCompleteness`) liegen nach der Export-Regel unter
  `contracts/crm/onboarding/`, nicht in der Pattern-Datei; `OnboardingAnswerFileRef` heißt
  `QuestionnaireAnswerFileRefDto`. `isQuestionnaireFieldVisible(field, input, groupEntryId = null)` nimmt den
  Gruppeneintrag als dritten Parameter, weil Bedingungen in Unterfeldern je Eintrag gelten.
- **`ratio` ist 1, wenn `totalRequired = 0`** (Akzeptanz T3 „Bogen ohne Pflichtfelder: ratio = 1“); der Kommentar
  „0 bei totalRequired = 0“ im Code-Skizzenblock oben war widersprüchlich. Ein unbeantworteter Bogen mit
  Pflichtfeldern hat `ratio = 0`. Optionale Felder, deren `min_items` nach dem ersten Eintrag greift, zählen in
  `totalRequired` mit, damit der Fortschritt nicht 100 % zeigt, solange etwas fehlt.
- **Zusätzliche Konstanten:** `onboarding-transition-sides.ts`, `questionnaire-key-patterns.ts` (Regex-Quelle für
  CHECK und Validierung), `questionnaire-confirmed-value.ts` (`"true"`), `questionnaire-value-error-codes.ts` (Codes von
  `validateQuestionnaireValue`), weitere Typgruppen in `questionnaire-field-types.ts` für die DB-CHECKs;
  `QUESTIONNAIRE_LIMITS` enthält zusätzlich die DB-Obergrenzen (`stored*`), abgesichert durch
  `questionnaire-limits-migration.test.ts`.
- **`portal.onboarding.read`** steht zusätzlich in `PORTAL_READ_PERMISSION_VALUES` (Owner-Portalsicht), weil Task 66
  die Leseseiten über `withPortalReader` baut. Die Katalog-Permissions liegen in der Rechtegruppe „Leistungen“ neben
  `line_item_templates.*`.
- **Constraint-Namen-Tests** laufen gebündelt in `onboarding-constraint-names.test.ts` (alle 14 Tabellen, inklusive
  Spalten-/Default-Abgleich mit der Migration) statt in 14 gleichförmigen Einzeldateien.
- **Smoke** liegt als eigenes Modul `packages/db/scripts/crm-smoke/onboarding-checks.ts` und wird von
  `smoke-crm-constraints.ts` aufgerufen. Der Negativfall „Antwort an einem Feld eines fremden Bogens“ ist ohne Trigger
  nicht DB-seitig prüfbar und gehört als Integrationstest zum Schreibpfad (Task 66); ebenso „Vorlage referenziert nur
  Katalogblöcke“ (Task 64).

## Umbenennung des Baukastens (01.10.2026)

Alles Fachneutrale heißt `questionnaire` statt `onboarding` (Begründung und Abgrenzung in der
[`README.md`](./README.md), Abschnitt „Benennung“). Für diesen Task heißt das:

- Definitionstabellen, ihre Drizzle-Modelle und Constraint-Namen: `questionnaire_*`. Die Migration heißt weiter
  `0047_create_onboarding.sql` und legt beide Tabellengruppen an.
- Konstanten, Contracts und Patterns des Baukastens liegen unter `…/crm/questionnaire/`; unter `…/crm/onboarding/`
  bleiben Bogenstatus, Übergänge, Seiten, Prüfstatus, Rückfrage-Modus und die Bogen-DTOs.
- Fehlercodes sind geteilt: `QuestionnaireErrorCode` (`QUESTIONNAIRE_*`, Vorlage/Baustein/Feld, Übersetzung,
  Bedingung, Feldkonfiguration, Limit, Schlüssel) und `OnboardingErrorCode` (`ONBOARDING_*`, Bogen).
- Die Bogen-Fehlercodes haben noch keine Route. Ihre Texte und HTTP-Zuordnung standen im Katalog-Dictionary bzw. in
  der Katalog-Fehlerzuordnung und wurden dort entfernt; Task 65 übernimmt sie in ein eigenes Onboarding-Dictionary
  und eine eigene `onboarding-api-error.ts`:

| Code                             | HTTP | DE                                            | EN                                          |
| -------------------------------- | ---- | --------------------------------------------- | ------------------------------------------- |
| `ONBOARDING_FORM_NOT_FOUND`      | 404  | Der Bogen existiert nicht mehr.               | The form no longer exists.                  |
| `ONBOARDING_FORM_EXISTS`         | 409  | Für dieses Projekt gibt es schon einen Bogen. | This project already has a form.            |
| `ONBOARDING_INVALID_TRANSITION`  | 409  | Dieser Statuswechsel ist nicht möglich.       | This status change is not possible.         |
| `ONBOARDING_NOT_EDITABLE`        | 409  | Der Bogen kann nicht mehr bearbeitet werden.  | The form can no longer be edited.           |
| `ONBOARDING_REQUIRED_MISSING`    | 422  | Es fehlen Pflichtangaben.                     | Required answers are missing.               |
| `ONBOARDING_REVIEW_INCOMPLETE`   | 409  | Die Prüfung ist noch nicht abgeschlossen.     | The review is not finished yet.             |
| `ONBOARDING_CALL_DATE_REQUIRED`  | 422  | Das Datum des Onboarding-Calls fehlt.         | The date of the onboarding call is missing. |
| `ONBOARDING_FILE_NOT_ATTACHABLE` | 422  | Die Datei kann nicht angehängt werden.        | The file cannot be attached.                |

## Merge-Gate 15.1

- [ ] Nichts sichtbar; `project-process-plan` verhält sich unverändert.
- [ ] Migrationen idempotent, Modelle deckungsgleich, keine fachlichen Defaults.
- [ ] `getQuestionnaireCompleteness` vollständig getestet (alle Feldtypen, Bedingungen, Gruppen).
- [ ] Permissions im Katalog und in `portal_standard`; `db:smoke` grün.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `db:smoke:crm`, Workspace-Build grün.
