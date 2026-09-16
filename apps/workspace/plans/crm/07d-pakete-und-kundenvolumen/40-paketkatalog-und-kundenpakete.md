# Task 40 — Paketkatalog und Kundenpakete

> **Merge-Einheit:** Ordner 07d · **Branch:** `feat/crm-pakete-und-kundenvolumen`
> **Aufwand:** M · **Abhängigkeiten:** Task 01 (Kundenschema), Task 09 (Projekte)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

- Katalog als versioniertes Const-Objekt in `packages/common`; keine Katalogtabelle, kein Pflege-UI.
- Gebuchte Positionen sind Snapshots und danach je Kunde frei editierbar.
- Kombipreise sind eigene Pakete, keine Rabattregel.
- Preise und Leistungspunkte werden nie überschrieben, sondern durch eine Nachfolgeposition ersetzt.
- Kundenwert und Projektwert sind berechnete Größen ohne eigene Spalte.

## Context

Im Alltag ist die Frage nie „wie lautet Angebot 2026-014", sondern „was hat der Kunde gebucht und was
zahlt er dafür". Der Kunde bucht heute eine Landingpage und einen Wartungsvertrag, in drei Monaten
kommt SEO dazu, im Jahr darauf eine zweite Landingpage. Preise steigen; ein Bestandskunde behält
seine Konditionen.

Angebote, Rechnungen und Zahlungen bleiben in Lexware. Dieser Task baut die Bausteine daneben: einen
Katalog typischer Pakete mit Preisständen und die gebuchten Positionen am Kunden.

Wie Task 01 und Task 09: nur Schema, Konstanten, DTOs, Mapper und Berechnung. Handler und UI folgen
in Task 41 und 42.

## Entscheidungen

| Bereich                  | Entscheidung                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Katalogort               | Const-Objekt im Code, wie `TASK_TEMPLATES` (Task 12). Es gibt genau einen Pflegenden, und der deployt selbst                                                            |
| Warum keine Tabelle      | Ein Pflege-UI für Pakete, Versionen und Leistungspunkte wäre eine eigene Merge-Einheit. Die Historie hängt nicht am Katalog, weil Buchungen snapshotten                 |
| Später umstellbar        | Eine Katalogtabelle ist additiv nachrüstbar: gebuchte Positionen referenzieren den Katalog nur informativ über `source_package_key`                                     |
| Versionierung            | Je Paket ein aufsteigendes Array von Versionen mit `validFrom`; `versionNumber` ist Index plus eins                                                                     |
| Vorgeschlagene Version   | Nach Preisart getrennt: `recurring` und `rate` schlagen die **Ankerversion** des Kunden vor, `one_time` die **aktuelle** Katalogversion                                 |
| Warum getrennt           | Ein laufender Vertrag genießt Bestandsschutz. Eine neue Einmalleistung wird dagegen zur aktuellen Preisliste verkauft — der Altpreis wäre dort der falsche Default      |
| Konditionsanker          | `customers.customer_since`, ersatzweise das Anlagedatum                                                                                                                 |
| Wechsel der Version      | In beide Richtungen ein sichtbarer Schalter im Dialog, nie automatisch                                                                                                  |
| Snapshot                 | Bezeichnung, Leistungspunkte und Preise werden beim Buchen kopiert. Eine spätere Katalogänderung berührt gebuchte Zeilen nie                                            |
| Bezeichnungen            | `label_key` plus optionaler `label` — solange der Text aus dem Katalog stammt, rendert jede Sprache selbst; eigener Text gewinnt und setzt den Key auf `NULL`           |
| Warum                    | Dieselbe Regel wie bei Aufgaben-Vorlagen (Task 12). Ein fertig gerenderter deutscher Text in der DB wäre im englischen Kontext falsch                                   |
| Kombipakete              | Eigener Katalogeintrag (`maintenance_seo_combo`), kein Regelwerk. Zusätzlich ist jeder Preis je Position editierbar                                                     |
| Warum keine Regel        | „Wenn A und B, dann Preis C" ist eine Regel-Engine mit Reihenfolge-, Kündigungs- und Teilstornofällen. Zwei bis fünf Nutzer brauchen sie nicht                          |
| Preisänderung            | Laufende Position beenden und Nachfolger mit `replaces_package_id` anlegen                                                                                              |
| Warum                    | Ein überschriebener Preis macht jede Rückschau falsch. Zwei Zeilen erzählen „100 € bis Juni, danach 120 €"                                                              |
| Preisart                 | `pricing_mode`: `one_time`, `recurring` oder `rate`. Eine Tabelle für alle drei                                                                                         |
| Menge                    | `quantity` plus `unit_cents`; der Gesamtbetrag ist `quantity × unit_cents` und wird nie gespeichert                                                                     |
| Warum getrennt           | „2 Sections zu je 200 €" und „eine Section zu 400 €" sind verschiedene Sachverhalte. Ein Gesamtbetrag allein macht das später nicht mehr unterscheidbar                 |
| Nachbuchen               | Mehr Stück derselben Art zum neuen Preis ist eine **neue Position**, keine Mengenerhöhung der alten                                                                     |
| Warum                    | Sonst müsste eine Zeile zwei Preise tragen. Zwei Zeilen erzählen „2 × 200 € im März, 3 × 300 € im Oktober" — und die erste Buchung bleibt unverändert richtig           |
| Projektbezug             | `project_id` optional; eine zusammengesetzte Constraint erzwingt, dass das Projekt demselben Kunden gehört                                                              |
| Stundensatz              | Ein Katalogpaket mit `pricing_mode = 'rate'`. Buchen ordnet dem Kunden den aktuellen Satz zu, der beim Buchen individuell geändert werden kann                          |
| Warum keine Extratabelle | Eine eigene Historientabelle wäre ein zweiter Mechanismus mit eigener Zeitlogik. Als Paketart entsteht die Historie über denselben Weg wie bei allen anderen Positionen |
| Rate-Semantik            | Eine `rate`-Position zählt in **keine** Wertsumme — sie ist ein Preis, kein Umsatz. Höchstens eine aktive `rate`-Position je Kunde (partieller Unique-Index)            |
| Aktueller Satz           | Jüngste aktive `rate`-Position; `customers.default_hourly_rate_cents` wird in derselben Transaktion als Cache mitgeschrieben                                            |
| Warum der Cache bleibt   | Die Spalte ist gemerged und wird von der Projektanlage gelesen. Ihr Ausbau gehört in einen späteren Cleanup, nicht hierher                                              |
| Angebotsbezug            | `offer_reference text NULL` — die Lexware-Angebotsnummer als Freitext, ohne eigenes Angebotsobjekt                                                                      |
| Stand                    | Zweite Achse `stage`: `requested`, `offered`, `ordered`, `invoiced`, `paid`, `declined`                                                                                 |
| Warum zwei Achsen        | `status` beantwortet „läuft die Position noch", `stage` beantwortet „wo steht das Geschäft". Ein Wartungsvertrag ist gleichzeitig aktiv und monatlich berechnet         |
| Laufende Positionen      | Enden bei `ordered`. `invoiced` und `paid` sind dort verboten — monatliche Abrechnung bräuchte Zeilen je Periode, und das ist ein Abrechnungssystem                     |
| Rate-Positionen          | Haben keinen Stand (`stage IS NULL`). Ein Stundensatz wird nicht beauftragt oder bezahlt                                                                                |
| Führung                  | `invoiced` und `paid` sind **manuelle Vermerke, nicht führend** — Lexware bleibt die Wahrheit. Die UI beschriftet das sichtbar                                          |
| Warum trotzdem im CRM    | „Beauftragt, aber noch nicht berechnet" ist die Frage, die im Alltag Geld kostet. Genau dieses Feld füllt eine spätere Lexware-Anbindung automatisch                    |
| Reihenfolge              | Keine erzwungene Abfolge und kein Zustandsautomat; jeder Wechsel ist erlaubt und wird protokolliert                                                                     |
| Warum                    | Ein Angebot wird zurückgezogen, eine Rechnung storniert, ein Stand versehentlich gesetzt. Ein Automat erzeugt hier nur Umwege                                           |
| Seit wann                | `stage_changed_on date NOT NULL` — daraus entsteht „Angebot liegt seit 18 Tagen beim Kunden"                                                                            |
| Werte                    | Immer berechnet: `oneTimeTotalCents`, `monthlyRecurringCents`, `yearlyRecurringCents` und `pipelineCents` je Kunde und Projekt                                          |
| Was zählt als Umsatz     | Nur `ordered`, `invoiced` und `paid`. `requested` und `offered` zählen getrennt als `pipelineCents`, `declined` gar nicht                                               |
| Warum getrennt           | Sonst steigt der Kundenwert, sobald jemand etwas anfragt. Angefragt ist kein Umsatz                                                                                     |
| Rundung                  | Jahrespreise werden für die Monatsansicht kaufmännisch gerundet; maßgeblich für Jahrespositionen bleibt der Jahreswert                                                  |

## Contract

```ts
// packages/common/src/constants/crm/service-package-keys.ts
export const ServicePackageKey = {
  LandingPage: "landing_page",
  WebsiteStandard: "website_standard",
  SubpageAddon: "subpage_addon",
  MaintenanceBasic: "maintenance_basic",
  SeoSetup: "seo_setup",
  SeoMaintenance: "seo_maintenance",
  MaintenanceSeoCombo: "maintenance_seo_combo",
  HourlyRate: "hourly_rate",
} as const;

export type ServicePackageKey =
  (typeof ServicePackageKey)[keyof typeof ServicePackageKey];
```

```ts
// packages/common/src/constants/crm/billing-intervals.ts
export const BillingInterval = {
  Monthly: "monthly",
  Quarterly: "quarterly",
  Yearly: "yearly",
} as const;

// packages/common/src/constants/crm/service-package-categories.ts
export const ServicePackageCategory = {
  Website: "website",
  Addon: "addon",
  Maintenance: "maintenance",
  Seo: "seo",
  Hosting: "hosting",
  Rate: "rate",
  Other: "other",
} as const;

// packages/common/src/constants/crm/pricing-modes.ts
export const PricingMode = {
  /** Einmalbetrag, z. B. Landingpage oder Zusatzsektion. */
  OneTime: "one_time",
  /** Wiederkehrend im gewaehlten Intervall, z. B. Wartung. */
  Recurring: "recurring",
  /** Konditionswert ohne Umsatz, z. B. Stundensatz. */
  Rate: "rate",
} as const;

// packages/common/src/constants/crm/customer-package-stages.ts
export const CustomerPackageStage = {
  /** Kunde hat danach gefragt, nichts ist zugesagt. */
  Requested: "requested",
  /** Angebot ist raus, Antwort steht aus. */
  Offered: "offered",
  /** Kunde hat zugesagt; ab hier zaehlt die Position als Umsatz. */
  Ordered: "ordered",
  /** Manueller Vermerk: in Lexware berechnet. Nicht fuehrend. */
  Invoiced: "invoiced",
  /** Manueller Vermerk: Zahlung eingegangen. Nicht fuehrend. */
  Paid: "paid",
  /** Kunde hat abgelehnt; zaehlt in keiner Summe. */
  Declined: "declined",
} as const;

/** Staende, die als Umsatz zaehlen. */
export const REVENUE_STAGES = [
  CustomerPackageStage.Ordered,
  CustomerPackageStage.Invoiced,
  CustomerPackageStage.Paid,
] as const;

/** Staende, die als offene Pipeline zaehlen. */
export const PIPELINE_STAGES = [
  CustomerPackageStage.Requested,
  CustomerPackageStage.Offered,
] as const;

/** Bei laufenden Positionen endet der Stand bei "beauftragt". */
export const RECURRING_ALLOWED_STAGES = [
  CustomerPackageStage.Requested,
  CustomerPackageStage.Offered,
  CustomerPackageStage.Ordered,
  CustomerPackageStage.Declined,
] as const;
```

```ts
// packages/common/src/constants/crm/service-packages.ts
export interface ServicePackageVersion {
  readonly versionNumber: number;
  readonly validFrom: string; // ISO-Datum, aufsteigend
  readonly unitCents: number; // Preis je Einheit
  readonly recurringInterval: BillingInterval | null; // nur bei pricing_mode recurring
  readonly itemKeys: readonly string[]; // Dictionary-Keys der Leistungspunkte
}

export interface ServicePackageDefinition {
  readonly key: ServicePackageKey;
  readonly labelKey: string;
  readonly category: ServicePackageCategory;
  readonly pricingMode: PricingMode;
  /** Mengenangabe sinnvoll? Sektionen ja, Wartungsvertrag nein. */
  readonly quantifiable: boolean;
  readonly versions: readonly ServicePackageVersion[];
}

export const SERVICE_PACKAGES = {
  [ServicePackageKey.SubpageAddon]: {
    key: ServicePackageKey.SubpageAddon,
    labelKey: "subpageAddon",
    category: ServicePackageCategory.Addon,
    pricingMode: PricingMode.OneTime,
    quantifiable: true,
    versions: [
      {
        versionNumber: 1,
        validFrom: "2026-01-01",
        unitCents: 20_000,
        recurringInterval: null,
        itemKeys: ["layout", "copyIntegration", "responsiveCheck"],
      },
      {
        versionNumber: 2,
        validFrom: "2026-10-01",
        unitCents: 30_000,
        recurringInterval: null,
        itemKeys: ["layout", "copyIntegration", "responsiveCheck", "seoBasics"],
      },
    ],
  },
  [ServicePackageKey.MaintenanceBasic]: {
    key: ServicePackageKey.MaintenanceBasic,
    labelKey: "maintenanceBasic",
    category: ServicePackageCategory.Maintenance,
    pricingMode: PricingMode.Recurring,
    quantifiable: false,
    versions: [
      {
        versionNumber: 1,
        validFrom: "2026-01-01",
        unitCents: 10_000,
        recurringInterval: BillingInterval.Monthly,
        itemKeys: ["updates", "backup", "uptimeCheck", "smallChanges"],
      },
    ],
  },
  [ServicePackageKey.HourlyRate]: {
    key: ServicePackageKey.HourlyRate,
    labelKey: "hourlyRate",
    category: ServicePackageCategory.Rate,
    pricingMode: PricingMode.Rate,
    quantifiable: false,
    versions: [
      {
        versionNumber: 1,
        validFrom: "2026-01-01",
        unitCents: 9_500,
        recurringInterval: null,
        itemKeys: [],
      },
    ],
  },
  // weitere Pakete analog
} as const satisfies Record<ServicePackageKey, ServicePackageDefinition>;
```

```ts
// packages/common/src/patterns/crm/service-package-version.ts
/** Letzte Version mit validFrom <= anchorDate; ohne Treffer die aelteste. */
export function getServicePackageVersion(
  key: ServicePackageKey,
  anchorDate: string,
): ServicePackageVersion;
```

```ts
// packages/common/src/contracts/crm/customer-package.dto.ts
export interface CustomerPackageItemDto {
  id: string;
  sortOrder: number;
  labelKey: string | null;
  label: string | null;
}

export interface CustomerPackageDto {
  id: string;
  customerId: string;
  projectId: string | null;
  sourcePackageKey: ServicePackageKey | null;
  sourceVersionNumber: number | null;
  labelKey: string | null;
  label: string | null;
  category: ServicePackageCategory;
  pricingMode: PricingMode;
  quantity: number;
  unitCents: number;
  /** Abgeleitet: quantity × unitCents. Nie persistiert. */
  totalCents: number;
  recurringInterval: BillingInterval | null;
  stage: CustomerPackageStage | null;
  stageChangedOn: string | null;
  status: CustomerPackageStatus;
  startsOn: string;
  endsOn: string | null;
  replacesPackageId: string | null;
  offerReference: string | null;
  note: string | null;
  items: readonly CustomerPackageItemDto[];
  version: number;
  createdAt: string;
  updatedAt: string;
}
```

```ts
// packages/common/src/patterns/crm/customer-value.ts
export interface EngagementValue {
  oneTimeTotalCents: number;
  monthlyRecurringCents: number;
  yearlyRecurringCents: number;
  /** Angefragt und angeboten — noch kein Umsatz. */
  pipelineCents: number;
}

export function toMonthlyCents(
  amountCents: number,
  interval: BillingInterval,
): number;

/**
 * `on` ist der Stichtag; nur dort laufende Positionen zaehlen wiederkehrend.
 * Nur REVENUE_STAGES zaehlen als Umsatz, PIPELINE_STAGES getrennt als
 * pipelineCents, 'declined' gar nicht. Positionen mit pricing_mode 'rate'
 * zaehlen in keiner Summe — sie sind ein Preis, kein Umsatz.
 */
export function calculateEngagementValue(
  packages: readonly CustomerPackageDto[],
  on: string,
): EngagementValue;

/** Juengste aktive rate-Position; null, wenn der Kunde keinen eigenen Satz hat. */
export function getCurrentHourlyRateCents(
  packages: readonly CustomerPackageDto[],
  on: string,
): number | null;
```

## Tabellen

```txt
customer_packages
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  project_id  uuid NULL     → projects.id  ON DELETE SET NULL
  source_package_key    text NULL    CHECK in SERVICE_PACKAGE_KEY_VALUES
  source_version_number integer NULL CHECK (source_version_number > 0)
  label_key text NULL
  label     text NULL
  category  text NOT NULL            CHECK in SERVICE_PACKAGE_CATEGORY_VALUES
  pricing_mode text NOT NULL         CHECK in PRICING_MODE_VALUES
  quantity   integer NOT NULL DEFAULT 1 CHECK (quantity > 0)
  unit_cents integer NOT NULL        CHECK (unit_cents >= 0)
  recurring_interval text NULL       CHECK in BILLING_INTERVAL_VALUES
  status text NOT NULL DEFAULT 'active' CHECK in CUSTOMER_PACKAGE_STATUS_VALUES
  stage  text NULL                   CHECK in CUSTOMER_PACKAGE_STAGE_VALUES
  stage_changed_on date NULL
  starts_on date NOT NULL
  ends_on   date NULL
  replaces_package_id uuid NULL → customer_packages.id ON DELETE SET NULL
  offer_reference text NULL
  note text NULL
  version integer NOT NULL DEFAULT 1 CHECK (version > 0)
  created_at / updated_at timestamptz NOT NULL DEFAULT now()

  CHECK (label_key IS NOT NULL OR label IS NOT NULL)
  CHECK ((pricing_mode = 'recurring') = (recurring_interval IS NOT NULL))
  CHECK (pricing_mode <> 'rate' OR quantity = 1)
  CHECK ((pricing_mode = 'rate') = (stage IS NULL))
  CHECK (stage IS NULL OR stage_changed_on IS NOT NULL)
  CHECK (pricing_mode <> 'recurring'
         OR stage IN ('requested','offered','ordered','declined'))
  CHECK (ends_on IS NULL OR ends_on >= starts_on)
  CHECK ((source_package_key IS NULL) = (source_version_number IS NULL))
  FOREIGN KEY (project_id, customer_id) REFERENCES projects (id, customer_id)
  UNIQUE INDEX (customer_id) WHERE pricing_mode = 'rate' AND status = 'active'
  INDEX (customer_id, status)
  INDEX (customer_id, stage) WHERE stage IN ('requested','offered','ordered')
  INDEX (project_id) WHERE project_id IS NOT NULL
  INDEX (customer_id, starts_on desc)

customer_package_items
  id uuid PK
  customer_package_id uuid NOT NULL → customer_packages.id ON DELETE CASCADE
  sort_order integer NOT NULL CHECK (sort_order >= 0)
  label_key text NULL
  label     text NULL
  CHECK (label_key IS NOT NULL OR label IS NOT NULL)
  UNIQUE INDEX (customer_package_id, sort_order)

```

Es gibt **keine** eigene Stundensatztabelle. Der Satz ist eine Position mit
`pricing_mode = 'rate'`; seine Historie entsteht über dieselbe Ersetzungskette wie bei jedem anderen
Preis. Der partielle Unique-Index stellt sicher, dass nie zwei aktive Sätze gleichzeitig gelten.

Der zusammengesetzte Fremdschlüssel zielt auf `projects_id_customer_uidx` aus Task 09 und schließt
aus, dass eine Position auf das Projekt eines anderen Kunden zeigt. Das ist dieselbe Absicherung, die
`tasks` und `feedback_rounds` für ihre denormalisierte `customer_id` verwenden.

Zusätzlich ergänzt die Migration `customers.customer_since date NULL` als Konditionsanker und
Beziehungsbeginn. Ohne Wert gilt `created_at::date`.

### Beispielverlauf eines Kunden

```txt
14.03.2026  Landingpage       one_time   1 × 2.000,00 €      bezahlt      Projekt "LP Kanzlei"
14.03.2026  Zusatzsektion     one_time   2 ×   200,00 €      bezahlt      Katalogversion 1
14.03.2026  Stundensatz       rate       1 ×    85,00 €      —            individuell vereinbart
01.05.2026  Wartung Basis     recurring  1 ×   100,00 €/Mon  beauftragt
12.10.2026  Zusatzsektion     one_time   3 ×   300,00 €      berechnet    Katalogversion 2
20.11.2026  SEO-Wartung       recurring  1 ×   200,00 €/Mon  angeboten

Umsatz:    einmalig 2.000 + 400 + 900 = 3.300,00 €  ·  laufend 100,00 €/Monat
Pipeline:  200,00 €/Monat (angeboten, noch nicht beauftragt)
Der Stundensatz zaehlt in keiner Summe und hat keinen Stand.
```

Die Buchung vom März bleibt unverändert bei 200 € je Sektion. Die Oktoberbuchung ist eine eigene
Position aus der aktuellen Katalogversion — nicht eine Mengenerhöhung der alten Zeile.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_customer_packages.sql
packages/db/src/record-configuration/crm/{customer-packages,customer-package-items}.ts
packages/db/src/constraint-names/crm/customer-packages-constraint-names.ts
packages/common/src/constants/crm/{service-package-keys,service-package-categories,
  billing-intervals,pricing-modes,customer-package-statuses,customer-package-stages,
  service-packages}.ts   (+ .test.ts)
packages/common/src/contracts/crm/customer-package.dto.ts
packages/common/src/patterns/crm/{service-package-version,customer-value}.ts   (+ .test.ts)
apps/workspace/src/i18n/dictionaries/workspace/crm/packages/{de,en}.json
```

## Tickets

### CRM-40-T1 — Konstanten und Katalog

- **Files:** fünf Konstantendateien plus Tests, `service-packages.ts` plus Test, DE/EN-Dictionary
- **Skills:** `best-practices`, `copywriting`
- **Inhalt:** Const-Objekt-Pattern mit abgeleitetem Typ und `*_VALUES`-Array; acht Startpakete
  einschließlich Kombipaket und Stundensatz; Leistungspunkte als Dictionary-Keys
- **Akzeptanz:**
  - Test prüft je Paket: `validFrom` streng aufsteigend, `versionNumber` lückenlos ab 1, mindestens
    eine Version, `unitCents >= 0`
  - Test prüft: `recurringInterval` ist genau bei `pricingMode = 'recurring'` gesetzt
  - Test prüft: `quantifiable` ist bei `pricingMode = 'rate'` immer `false`
  - Test prüft, dass jeder `labelKey` und jeder `itemKey` in DE **und** EN existiert
  - `satisfies Record<ServicePackageKey, ServicePackageDefinition>` bricht bei fehlendem Paket

### CRM-40-T2 — Migration und Drizzle-Modelle

- **Files:** Migration, zwei `pgTable`-Dateien, Constraint-Namen, Barrel, `smoke-crm-constraints.ts`
- **Skills:** `best-practices`
- **Inhalt:** Tabellen wie oben, additiv und idempotent; `customers.customer_since` ergänzen
- **Akzeptanz:**
  - Zweiter Migrationslauf ist folgenlos
  - Smoke weist jede CHECK-Constraint und den zusammengesetzten Fremdschlüssel nach
  - Negativtest: Position mit Projekt eines fremden Kunden wird von der DB abgelehnt
  - Negativtest: zweite aktive `rate`-Position je Kunde wird vom partiellen Unique-Index abgelehnt
  - Negativtest: `stage = 'paid'` an einer wiederkehrenden Position wird von der DB abgelehnt
  - Negativtest: gesetzter `stage` an einer `rate`-Position wird abgelehnt, fehlender ebenso bei den
    anderen beiden Preisarten
  - Modell und Migration deckungsgleich (ausdrücklicher Review-Punkt im PR)

### CRM-40-T3 — Versionsauflösung und Wertberechnung

- **Files:** `service-package-version.ts`, `customer-value.ts`, beide mit Test, DTO-Datei
- **Skills:** `best-practices`
- **Inhalt:** Ankerauflösung und Wertberechnung als reine Funktionen ohne DB-Zugriff
- **Akzeptanz:**
  - Anker vor der ersten Version liefert die älteste, nie `undefined`
  - Anker exakt auf `validFrom` liefert diese Version, nicht die vorherige
  - Beendete Positionen zählen zum Stichtag nicht mehr wiederkehrend, ihr einmaliger Anteil bleibt
  - `toMonthlyCents` ist für Quartal und Jahr getestet, inklusive kaufmännischer Rundung
  - Menge zählt: 3 × 300 € ergeben 900 €, nicht 300 €
  - `requested` und `offered` erhöhen den Umsatz nicht, sondern nur `pipelineCents`
  - `declined` erscheint in keiner Summe
  - `rate`-Positionen erscheinen in keiner der Summen (Regressionstest)
  - `getCurrentHourlyRateCents` liefert den kundeneigenen Satz, sonst `null` — nie den Katalogwert
