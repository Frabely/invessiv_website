# Task 44 — Onboarding-Bogen: Katalog, Datenmodell und Absenden

> **Merge-Einheit:** Ordner 15b · **Branch:** `feat/crm-onboarding-bogen`
> **Aufwand:** M · **Abhängigkeiten:** Task 09/10 (Projekte), Task 20 (Portalzugang), Task 43 (Assets)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

- Fragenkatalog als typisierte Konstante im Code, drei Vorlagen zum Start.
- Antworten als relationale Zeilen je Feld; Mehrfachauswahl sind mehrere Zeilen.
- Entwurf serverseitig, genau einer je Projekt und Vorlage.
- Absenden ist atomar und macht den Bogen unveränderlich.
- Assets hängen über eine Verknüpfungstabelle am Feld, ohne den Scope-CHECK aus Ordner 14 zu ändern.

## Context

Bis hierher besteht das Onboarding aus fünf Kundenaufgaben mit Häkchen. Der Kunde kann abhaken, dass
er Texte geliefert hat — aber nirgends Texte schreiben. In der Praxis endet das in einem
Word-Dokument oder einer Mail, aus der jemand von Hand herauskopiert.

Dieser Task baut die Datenseite des Bogens: welche Fragen es gibt, wie Antworten liegen, wie ein
Entwurf entsteht und was beim Absenden passiert. Das Formular selbst folgt in Task 45.

## Entscheidungen

| Bereich                   | Entscheidung                                                                                                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fragenherkunft            | Const-Objekt im Code, wie `TASK_TEMPLATES` und `SERVICE_PACKAGES`                                                                                                                                                                                                       |
| Warum kein Baukasten      | Ein Pflege-UI müsste Feldtypen, Reihenfolge, Pflichtlogik **und zwei Sprachen je Frage** abbilden. Eine im Backoffice getippte Frage hat keine englische Fassung — der zweisprachige Portalbetrieb wäre gebrochen                                                       |
| Änderungshäufigkeit       | In den ersten Monaten oft, danach selten. Eine Frage ändern heißt: eine Zeile plus zwei Dictionary-Einträge, und der Pflegende deployt selbst                                                                                                                           |
| Später erweiterbar        | Blockweises An- und Abwählen je Projekt ist additiv nachrüstbar (`enabled_section_keys` am Bogen) und braucht kein neues Datenmodell                                                                                                                                    |
| Vorlagen                  | `website_new`, `website_relaunch`, `seo_start`                                                                                                                                                                                                                          |
| Aufbau                    | Vorlage → Abschnitte → Felder. Der Abschnitt ist die Seite im Formular                                                                                                                                                                                                  |
| Feldtypen                 | `short_text`, `long_text`, `choice`, `multi_choice`, `url`, `asset`, `media_link`                                                                                                                                                                                       |
| Texte                     | Nur Dictionary-Keys (`labelKey`, `helpKey`, `choiceKeys`), nie Text im Katalog                                                                                                                                                                                          |
| Antwortmodell             | Eine Zeile je Feld und Wert; Mehrfachauswahl erzeugt mehrere Zeilen mit `sort_order`                                                                                                                                                                                    |
| Warum kein jsonb          | Passt zur Linie des Plans und macht „welches Feld hat dieser Kunde nicht beantwortet" zu einer normalen Abfrage statt zu einer Dokumentanalyse                                                                                                                          |
| Schemaversion             | `schema_version` am Bogen; eine spätere Katalogänderung ändert abgesendete Bögen nie                                                                                                                                                                                    |
| Unbekannte Felder         | Antwortzeilen zu Feldern, die es im Katalog nicht mehr gibt, werden intern unter „nicht mehr im Katalog" angezeigt, nie verworfen                                                                                                                                       |
| Entwurf                   | Serverseitig, genau einer je Projekt und Vorlage, über partiellen Unique-Index erzwungen                                                                                                                                                                                |
| Warum Abweichung          | Für Feedbackrunden gilt `localStorage`, weil eine Runde in einem Zug entsteht. Ein Bogen mit 25 Feldern entsteht über Tage, an mehreren Geräten und oft zu zweit. Ein verlorener Entwurf heißt hier nicht „nochmal tippen", sondern „wird nicht noch einmal ausgefüllt" |
| Speichern                 | Feldweise über `PUT …/answers/[fieldKey]`, entprellt. Kein Gesamt-Submit für Zwischenstände                                                                                                                                                                             |
| Gleichzeitiges Arbeiten   | Letzter Schreibvorgang je Feld gewinnt; der Bogen zeigt „zuletzt bearbeitet von …". Kein Feldsperren                                                                                                                                                                    |
| Absenden                  | Transaktion: Status, Zeitstempel, absendendes Portalmitglied und Activity; die Outbox-Benachrichtigung wird in Ordner 20c ergänzt                                                                                                                                       |
| Pflichtfelder             | Serverseitig geprüft; die Antwort nennt die fehlenden `field_key`, damit das Formular direkt hinspringen kann                                                                                                                                                           |
| Unveränderlich            | Nach dem Absenden lehnt jeder Portal-Schreibpfad ab                                                                                                                                                                                                                     |
| Erneut öffnen             | Intern möglich, protokolliert, mit Begründung. Anders als eine Feedbackrunde ist der Bogen kein kundenseitiger Zeitstand, sondern Arbeitsgrundlage                                                                                                                      |
| Assets                    | Upload läuft über den Pfad aus Task 43; `onboarding_answer_files` verknüpft Datei und Feld                                                                                                                                                                              |
| Warum Verknüpfungstabelle | Der `files_exactly_one_scope`-CHECK aus Ordner 14 bleibt unverändert. Eine vierte Scope-Spalte wäre eine Constraint-Migration ohne Mehrwert                                                                                                                             |
| Rechte intern             | Lesen `projects.read`, Zuweisen und erneutes Öffnen `portal.manage`. Keine neue Permission                                                                                                                                                                              |

## Contract

```ts
// packages/common/src/constants/crm/onboarding-form-keys.ts
export const OnboardingFormKey = {
  WebsiteNew: "website_new",
  WebsiteRelaunch: "website_relaunch",
  SeoStart: "seo_start",
} as const;

// packages/common/src/constants/crm/onboarding-field-types.ts
export const OnboardingFieldType = {
  ShortText: "short_text",
  LongText: "long_text",
  Choice: "choice",
  MultiChoice: "multi_choice",
  Url: "url",
  Asset: "asset",
  MediaLink: "media_link",
} as const;
```

```ts
// packages/common/src/constants/crm/onboarding-forms.ts
export interface OnboardingField {
  readonly fieldKey: string;
  readonly type: OnboardingFieldType;
  readonly labelKey: string;
  readonly helpKey: string | null;
  readonly required: boolean;
  readonly choiceKeys: readonly string[] | null; // nur bei (multi_)choice
  readonly maxLength: number | null; // nur bei Textfeldern
}

export interface OnboardingSection {
  readonly sectionKey: string;
  readonly titleKey: string;
  readonly fields: readonly OnboardingField[];
}

export interface OnboardingFormDefinition {
  readonly key: OnboardingFormKey;
  readonly schemaVersion: number;
  readonly titleKey: string;
  readonly sections: readonly OnboardingSection[];
}

export const ONBOARDING_FORMS = {
  [OnboardingFormKey.WebsiteNew]: {
    key: OnboardingFormKey.WebsiteNew,
    schemaVersion: 1,
    titleKey: "websiteNew.title",
    sections: [
      {
        sectionKey: "brand",
        titleKey: "websiteNew.brand.title",
        fields: [
          {
            fieldKey: "logo",
            type: OnboardingFieldType.Asset,
            labelKey: "websiteNew.brand.logo.label",
            helpKey: "websiteNew.brand.logo.help",
            required: true,
            choiceKeys: null,
            maxLength: null,
          },
          // … Farben, Schriften, bestehende Unterlagen
        ],
      },
      // … goals, audience, content, pages, legal, tech
    ],
  },
  // website_relaunch, seo_start analog
} as const satisfies Record<OnboardingFormKey, OnboardingFormDefinition>;
```

```ts
// packages/common/src/contracts/crm/onboarding-submission.dto.ts
export interface OnboardingAnswerDto {
  fieldKey: string;
  sortOrder: number;
  value: string;
}

export interface OnboardingSubmissionDto {
  id: string;
  customerId: string;
  projectId: string;
  formKey: OnboardingFormKey;
  schemaVersion: number;
  status: OnboardingSubmissionStatus;
  submittedAt: string | null;
  answers: readonly OnboardingAnswerDto[];
  assetFileIds: Readonly<Record<string, readonly string[]>>; // fieldKey → fileIds
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

```ts
// packages/common/src/patterns/crm/onboarding-progress.ts
export function getOnboardingProgress(
  form: OnboardingFormDefinition,
  submission: OnboardingSubmissionDto,
): { answeredRequired: number; totalRequired: number; ratio: number };
```

## Tabellen

```txt
onboarding_submissions
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  project_id  uuid NOT NULL → projects.id  ON DELETE CASCADE
  form_key text NOT NULL            CHECK in ONBOARDING_FORM_KEY_VALUES
  schema_version integer NOT NULL   CHECK (schema_version > 0)
  status text NOT NULL DEFAULT 'draft' CHECK in ONBOARDING_SUBMISSION_STATUS_VALUES
  submitted_at timestamptz NULL
  submitted_by_portal_membership_id uuid NULL → portal_memberships.id ON DELETE SET NULL
  reopened_at timestamptz NULL
  reopen_reason text NULL
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
  created_at / updated_at timestamptz NOT NULL DEFAULT now()
  CHECK ((status = 'submitted') = (submitted_at IS NOT NULL))
  FOREIGN KEY (project_id, customer_id) REFERENCES projects (id, customer_id)
  UNIQUE INDEX (project_id, form_key) WHERE status = 'draft'
  INDEX (customer_id, created_at desc)

onboarding_answers
  id uuid PK
  submission_id uuid NOT NULL → onboarding_submissions.id ON DELETE CASCADE
  field_key text NOT NULL
  sort_order integer NOT NULL DEFAULT 0
  value text NOT NULL               CHECK (btrim(value) <> '')
  updated_at timestamptz NOT NULL DEFAULT now()
  UNIQUE INDEX (submission_id, field_key, sort_order)

onboarding_answer_files
  submission_id uuid NOT NULL → onboarding_submissions.id ON DELETE CASCADE
  field_key text NOT NULL
  file_id   uuid NOT NULL → files.id ON DELETE CASCADE
  created_at timestamptz NOT NULL DEFAULT now()
  PRIMARY KEY (submission_id, field_key, file_id)
```

## Architektur

```txt
Intern
  POST  /api/workspace/crm/projects/[projectId]/onboarding        portal.manage   Bogen zuweisen
  POST  /api/workspace/crm/onboarding/[submissionId]/reopen       portal.manage   erneut oeffnen
  GET   /api/workspace/crm/onboarding/[submissionId]              projects.read

Portal
  GET   /api/portal/[customerId]/onboarding/[submissionId]
  PUT   /api/portal/[customerId]/onboarding/[submissionId]/answers/[fieldKey]
  POST  /api/portal/[customerId]/onboarding/[submissionId]/submit

submitOnboarding(actor, submissionId)
  ├─ Bogen gehoert zum Kunden der Session                sonst 404
  ├─ Status ist draft                                    sonst 409
  ├─ Pflichtfelder vollstaendig                          sonst 422 mit missingFieldKeys
  └─ Transaktion: Status, Zeitstempel, Mitglied und Activity; Benachrichtigung folgt in Ordner 20c
```

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_onboarding_submissions.sql
packages/db/src/record-configuration/crm/{onboarding-submissions,onboarding-answers,
  onboarding-answer-files}.ts
packages/common/src/constants/crm/{onboarding-form-keys,onboarding-field-types,
  onboarding-submission-statuses,onboarding-forms}.ts   (+ .test.ts)
packages/common/src/constants/crm/errors/onboarding-error-codes.ts
packages/common/src/contracts/crm/onboarding-submission.dto.ts
packages/common/src/patterns/crm/onboarding-progress.ts   (+ .test.ts)

apps/workspace/src/server/portal/command-handler/{save-onboarding-answer,
  submit-onboarding}.command-handler.ts
apps/workspace/src/server/portal/query-handler/get-onboarding-submission.query-handler.ts
apps/workspace/src/server/workspace/crm/command-handler/{assign-onboarding-form,
  reopen-onboarding}.command-handler.ts
apps/workspace/src/app/api/portal/[customerId]/onboarding/**
apps/workspace/src/app/api/workspace/crm/projects/[projectId]/onboarding/route.ts
apps/workspace/src/app/api/workspace/crm/onboarding/[submissionId]/**
apps/workspace/src/i18n/dictionaries/portal/onboarding/{de,en}.json
```

## Tickets

### CRM-44-T1 — Katalog und Konstanten

- **Files:** vier Konstantendateien plus Tests, DE/EN-Dictionary, Fehlercodes
- **Skills:** `best-practices`, `copywriting`
- **Inhalt:** Drei Vorlagen mit je fünf bis acht Abschnitten; Fragen als Keys
- **Akzeptanz:**
  - Test: jeder `labelKey`, `helpKey` und `choiceKey` existiert in DE und EN
  - Test: `fieldKey` ist je Vorlage eindeutig; `choiceKeys` nur bei Auswahlfeldern gesetzt
  - Test: jede Vorlage hat mindestens ein Pflichtfeld und keine leeren Abschnitte

### CRM-44-T2 — Migration, Modelle, Fortschritt

- **Files:** Migration, drei `pgTable`-Dateien, Constraint-Namen, DTO, `onboarding-progress.ts`,
  Seed-Erweiterung, Tests
- **Skills:** `best-practices`
- **Inhalt:** Tabellen wie oben; Fortschritt als reine Funktion
- **Akzeptanz:**
  - Zweiter Entwurf zu Projekt und Vorlage wird vom partiellen Unique-Index abgelehnt
  - `status = 'submitted'` ohne `submitted_at` wird von der CHECK-Constraint abgelehnt
  - Bogen mit Projekt eines fremden Kunden wird vom zusammengesetzten Fremdschlüssel abgelehnt
  - Fortschritt zählt nur Pflichtfelder und ist bei leerem Bogen 0, nicht `NaN`

### CRM-44-T3 — Handler, Routen und Absenden

- **Files:** zwei Portal-Command-Handler, ein Portal-Query-Handler, zwei Workspace-Command-Handler,
  Routen, Fehlerabbildung, Tests
- **Skills:** `best-practices`
- **Inhalt:** Feldweises Speichern, Absenden als Transaktion, Zuweisen und erneutes Öffnen
- **Akzeptanz:**
  - Speichern eines Feldes schreibt genau eine Zeile; Mehrfachauswahl ersetzt die Zeilen des Feldes
  - Absenden ohne Pflichtfeld liefert 422 mit `missingFieldKeys`
  - Schreibpfad auf einen abgesendeten Bogen liefert 409 (Negativtest)
  - Fremde `customerId` und fremder `submissionId` liefern 404, nicht 403
  - Erneutes Öffnen schreibt Grund und Actor in die Activity
