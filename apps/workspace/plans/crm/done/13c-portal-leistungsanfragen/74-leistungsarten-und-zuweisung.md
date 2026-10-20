# Task 74 — Leistungsarten und Zuweisung in einem Schritt (PR 13c.1)

> **Branch:** `feat/crm-leistungsanfragen-1-katalog` · **Basis:** `master` · **Aufwand:** M · **Dateien:** ≈ 60
> **Migration:** eine (Spalten, CHECKs, Katalogdaten) · **Abhängigkeiten:** Ordner 07, 16, 20 gemergt
> **Zuerst lesen:** `apps/workspace/src/server/workspace/crm/AGENTS.md`,
> `apps/workspace/src/components/workspace/crm/AGENTS.md`, `packages/db/AGENTS.md`,
> `packages/db/src/record-configuration/crm/AGENTS.md`, `packages/common/AGENTS.md`

Nach dem Merge: Der Katalog kennt Arten, Projektbezug und Portal-Freigabe. Wer im Cockpit eine Stunden-Vorlage
zuweist, gibt die Menge an und hat danach Projektleistung, Gutschrift und Projektzuweisung in einem Schritt. Wer
eine Zusatzrunden-Vorlage zuweist, hat einen Rundenschritt mehr. Nichts davon ist im Portal sichtbar.

## CRM-74-T1 — Schema und Contracts

```txt
packages/db/migrations/<nr>_add_line_item_kinds.sql
packages/db/src/record-configuration/crm/line-item-templates.ts          + 4 Spalten, CHECKs
packages/db/src/record-configuration/crm/project-line-items.ts           + kind, quantity_minutes, CHECKs
packages/db/src/record-configuration/crm/customer-hour-purchases.ts      nutzt HOUR_PURCHASE_SOURCE_VALUES (prüfen)
packages/db/src/constraint-names/crm/line-item-templates-constraint-names.ts   + neue Namen
packages/db/src/constraint-names/crm/project-line-items-constraint-names.ts    + neue Namen (auch den bisher
                                                                                 als Literal stehenden StatusCheck)
packages/db/src/constraint-names/constraint-names.test.ts                angepasst
packages/db/scripts/crm-smoke/line-item-checks.ts                        neu; in smoke-crm-constraints.ts einhängen
packages/db/scripts/seed-crm-fixture.ts                                  Vorlagen mit allen drei Arten, eine Stunden-Leistung

packages/common/src/constants/crm/line-item-kinds.ts                     LineItemKind { Standard, Hours, FeedbackRound } + VALUES + Test
packages/common/src/constants/crm/line-item-project-modes.ts             LineItemProjectMode { ExistingProject, NewProject } + VALUES + Test
packages/common/src/constants/crm/hour-purchase-sources.ts               + ProjectLineItem: "project_line_item" (Test in hours-constants.test.ts)
packages/common/src/constants/crm/forms/line-item-template-field-limits.ts   + PortalDescriptionMaxLength: 2000
packages/common/src/constants/crm/errors/project-line-item-error-codes.ts    + EffectNotPermitted, ProjectClosed,
                                                                               FeedbackRoundNotAvailable
packages/common/src/constants/crm/extra-feedback-round-blockers.ts       ExtraFeedbackRoundBlocker { ProjectApproved, LimitReached } + Test
packages/common/src/contracts/crm/line-item-template.dto.ts              + kind, projectMode, portalRequestable, portalDescription
packages/common/src/contracts/crm/create-line-item-template-request.dto.ts   dieselben vier Felder
packages/common/src/contracts/crm/update-line-item-template-request.dto.ts   dieselben vier Felder
packages/common/src/contracts/crm/rows/line-item-template-row.ts         folgt dem Modell
packages/common/src/contracts/crm/project-line-item.dto.ts               + kind, quantityMinutes
packages/common/src/contracts/crm/create-project-line-item-request.dto.ts    + quantityMinutes: number | null
packages/common/src/patterns/crm/extra-feedback-round.ts                 neu, + Test
packages/common/src/patterns/crm/project-line-item-value.ts              Stunden-Wert, + Testfälle
```

Migration (Reihenfolge; jede Anweisung idempotent, `--> statement-breakpoint` dazwischen):

1. `ALTER TABLE … ADD COLUMN IF NOT EXISTS` für die sechs Spalten.
2. Je CHECK: `ALTER TABLE … DROP CONSTRAINT IF EXISTS <name>;` dann `ADD CONSTRAINT <name> CHECK (…)`.
   NULL-sicher schreiben, z. B. `kind IS DISTINCT FROM 'hours' OR pricing_mode = 'rate'`.
3. Quelle erweitern: `customer_hour_purchases_source_check` droppen und mit `('manual','project_line_item')` neu anlegen.
4. Katalogdaten: `UPDATE line_item_templates SET kind = 'hours' WHERE id = '9c8f1a10-1b1a-4a10-8e10-000000000007'
AND kind IS NULL AND pricing_mode = 'rate'` (Stundensatz); `SET project_mode = 'new_project' WHERE id =
'…000000000001' AND project_mode IS NULL` (Landingpage).
5. Neue Vorlage „Zusätzliche Feedbackrunde“ mit fester ID `9c8f1a10-1b1a-4a10-8e10-000000000008`, `one_time`,
   `kind = 'feedback_round'`, `price_cents = 0`, `status = 'active'`, `version = 1`, `ON CONFLICT (id) DO NOTHING`.
   Der Preis wird vor der Portal-Freigabe im Katalog gepflegt (kein erfundener Betrag in der Migration).

Patterns (reine Funktionen, mit Tests):

```ts
// extra-feedback-round.ts
findExtraFeedbackRoundBlocker(input: { positions: readonly number[]; rounds: readonly { status: FeedbackRoundStatus }[] }):
  ExtraFeedbackRoundBlocker | null
  // ProjectApproved, wenn eine Runde `approved` ist; LimitReached ab ProjectFieldLimits.FeedbackRoundsMax (20)
nextExtraFeedbackRoundPosition(input: { processSteps: readonly string[]; currentProcessStep: string; positions: readonly number[] }): number
  // max(letzte normalisierte Position, Index des aktuellen Schritts + 1); ohne Runden: Index + 1
  // normalisiert über normalizeFeedbackRoundPositions (feedback-round-positions.ts)
```

`calculateProjectLineItemValue`: bei `confirmed`, `pricingMode = rate` und `quantityMinutes !== null`
`oneTimeCents += Math.round(priceCents * quantityMinutes / 60)`.

- **Akzeptanz:** `pnpm --filter @invessiv/db db:smoke:crm` grün; der neue Smoke weist ab: `hours` ohne `rate`,
  `feedback_round` mit `recurring`, `hours` mit `new_project`, Freigabe ohne Kundentext, Menge ohne `hours`,
  `hours` ohne Menge, Menge 20, Quelle `foo`. Zweiter Migrationslauf ist folgenlos. Tests der Patterns decken:
  keine Runde, Runden voraus, Projekt hinter der letzten Runde, 20 Runden, abgenommene Runde.

## CRM-74-T2 — Server

```txt
apps/workspace/src/server/workspace/crm/services/line-item-template-schemas.ts       + Felder, + Regeln
apps/workspace/src/server/workspace/crm/services/line-item-templates-mapper-service.ts    + vier Felder mit NULL-Fallback (+ Test)
apps/workspace/src/server/workspace/crm/command-handler/create-line-item-template.command-handler.ts   schreibt die vier Felder
apps/workspace/src/server/workspace/crm/command-handler/update-line-item-template.command-handler.ts   schreibt die vier Felder
apps/workspace/src/server/workspace/crm/services/project-line-item-schemas.ts        + quantityMinutes
apps/workspace/src/server/workspace/crm/services/project-line-items-mapper-service.ts    + kind, quantityMinutes (+ Test)
apps/workspace/src/server/workspace/crm/services/project-line-item-assignment-service.ts neu
apps/workspace/src/server/workspace/crm/services/project-line-item-assignment-types.ts   neu (Eingabe-/Ergebnistypen)
apps/workspace/src/server/workspace/crm/command-handler/create-project-line-item.command-handler.ts   ruft den Service
apps/workspace/src/server/workspace/crm/command-handler/update-project-line-item.command-handler.ts   Sperren für Automatik-Arten
apps/workspace/src/server/workspace/crm/services/feedback/feedback-round-service.ts  + addExtraRoundStep
apps/workspace/src/lib/workspace/crm/project-line-item-api-error.ts                  + drei Codes (403, 409, 409)
apps/workspace/src/server/tests/workspace/crm/project-line-items.integration.test.ts erweitert
apps/workspace/src/server/workspace/crm/AGENTS.md                                    Abschnitt „Leistungsarten (ab Task 74)“
```

Schema-Regeln der Vorlage (`refineKind` neben `refineIntervalConsistency`): `hours` ⇒ `rate`; `feedback_round` ⇒
`one_time`; beide ⇒ `existing_project`; `portalRequestable` ⇒ `portalDescription` nicht leer. Archivieren ändert
`portal_requestable` nicht — das Portal filtert später auf `status = active`, die Freigabe endet damit sofort.

**`projectLineItemAssignmentService.assign(tx, input)`** — einzige Stelle, die eine Projektleistung anlegt:

```ts
input: {
  actor: WorkspaceActor;
  project: { id: string; customerId: string; status: ProjectStatus };   // vom Aufrufer geladen und berechtigt
  template: { id: string; kind: LineItemKind };                         // aktiv, vom Aufrufer geprüft
  fields: { title; description; priceCents; pricingMode; recurringInterval; status; quantityMinutes: number | null };
}
→ { ok: true; row: ProjectLineItemRow } | { ok: false; code: ProjectLineItemErrorCode; errors?: ZodIssue[] }
```

1. `standard`: `quantityMinutes` muss `null` sein (sonst `ValidationError`); Insert wie bisher, `kind` gesetzt.
2. `hours`: `quantityMinutes` Pflicht, `pricingMode = rate`, sonst `ValidationError`;
   `canOn(actor, Permission.HoursManage, { customerId })` sonst `EffectNotPermitted`; Projektstatus in
   `HOURS_CLOSED_PROJECT_STATUS_VALUES` → `ProjectClosed`. Dann `hoursLedgerService.lockCustomer(tx, customerId)`,
   Insert der Leistung mit `status = confirmed`, `hoursLedgerService.insertPurchase` (`kind: Purchase`,
   `source: HourPurchaseSource.ProjectLineItem`, `purchasedOn: businessToday()`, `note`: Titel auf 200 Zeichen,
   `idempotencyKey`: ID der Leistung) und `insertAllocation` (`minutes`, `note: ""`, `idempotencyKey`: ID der
   Leistung), jeweils gefolgt von `hoursActivityService.recordPurchase` bzw. `recordAllocation`.
   Vorlagen: `create-hour-purchase.command-handler.ts`, `create-hour-allocation.command-handler.ts`.
3. `feedback_round`: `pricingMode = one_time`; `canOn(actor, Permission.ProjectsWrite, { customerId, projectId })`
   sonst `EffectNotPermitted`; `feedbackRoundService.addExtraRoundStep(tx, projectId, actor)`; bei Blocker
   `FeedbackRoundNotAvailable`; Insert mit `status = confirmed`.

`createProjectLineItem` behält Zugriffsprüfung und Vorlagen-Check, lädt zusätzlich `projects.status` und
`lineItemTemplates.kind` und läuft neu in **einer Transaktion** um `assign`.

**`feedbackRoundService.addExtraRoundStep(tx, projectId, actor)`**: Projekt `FOR UPDATE` (dieselbe Sperre wie
Übergabe und Projekt-Editor, Muster `lockPreviousState` in `update-project.command-handler.ts`), Rundenstatus des
Projekts lesen, `findExtraFeedbackRoundBlocker`, `nextExtraFeedbackRoundPosition`, dann `updateLockedVersioned`
mit `feedback_round_positions` (sortiert über `sortFeedbackRoundPositions`) und
`included_feedback_rounds = positions.length`. Eine Activity `field_change` (Feld `included_feedback_rounds`,
vorher/nachher) über `activityService`, Aufbau wie `hours-activity-service.ts`.

`updateProjectLineItem`: Bei gespeicherter Art `hours` oder `feedback_round` sind abweichender `status` und
abweichende `pricingMode` ein `ValidationError`; die Menge ist nicht Teil des Update-Schemas.

- **Akzeptanz (Integration, echte DB):**
  - Stunden-Vorlage, 5:00, Projekt A → genau eine Leistung (`confirmed`, 300 Minuten), eine Kaufzeile
    (`source = project_line_item`, 300), eine Zuweisung (300, Projekt A); `getCustomerHours` zeigt 5:00 gekauft,
    5:00 Projekt A, 0:00 frei
  - ohne `hours.manage` → `EffectNotPermitted`, **keine** Zeile in allen drei Tabellen
  - archiviertes Projekt → `ProjectClosed`, nichts geschrieben
  - Zusatzrunde: Positionen `[2,2]`, Projekt auf Schritt 1 → `[2,2,2]`, Kontingent 3; Projekt auf Schritt 2
    (hinter den Runden) → `[2,2,3]`; abgenommene Runde → `FeedbackRoundNotAvailable`; 20 Runden → ebenso
  - Standard-Vorlage mit Menge → `ValidationError`
  - fremder Kunde / fremdes Projekt → `ProjectNotFound` (bestehender Negativtest bleibt grün)
  - Änderung von Status an einer Stunden-Leistung → `ValidationError`

## CRM-74-T3 — UI intern

Skills: `frontend-design`, `impeccable`, `copywriting`.

```txt
apps/workspace/src/common/patterns/crm/line-item-template-form.ts (+ Test)           vier neue Felder, Zwangswerte je Art
apps/workspace/src/common/patterns/crm/project-line-item-form.ts (+ Test)            quantityMinutes, Status fest bei Automatik
apps/workspace/src/common/contracts/crm/…-form-values.ts                             folgen
apps/workspace/src/components/workspace/crm/line-item-templates/line-item-template-form-dialog/   Art, Projektbezug, Freigabe, Kundentext
apps/workspace/src/components/workspace/crm/line-item-templates/line-item-template-row/           Badges „Stunden“/„Zusatzrunde“, „Im Portal“
apps/workspace/src/components/workspace/crm/projects/project-line-item-form-dialog/               Menge, Hinweise, Sperrgründe
apps/workspace/src/components/workspace/crm/projects/project-line-items-section/                  Zeile „5:00 × 100,00 €“
apps/workspace/src/lib/workspace/crm/project-line-items-view-model.ts (+ Test)       canManageHours, extraRoundBlockerByProject
apps/workspace/src/i18n/dictionaries/workspace/crm/line-item-templates/{de,en}.json
apps/workspace/src/i18n/dictionaries/workspace/crm/project-line-items/{de,en}.json
apps/workspace/src/components/workspace/crm/AGENTS.md                                Abschnitt „Leistungsarten (ab Task 74)“
```

- **Vorlagen-Dialog:** Select „Art“ (Standard / Stunden / Zusätzliche Feedbackrunde). Bei „Stunden“ ist die
  Preisart fest „Satz“ und das Preisfeld heißt „Stundensatz“; bei „Zusatzrunde“ fest „Einmalig“. Select
  „Projektbezug“ (Ergänzt ein Projekt / Eigenes neues Projekt), bei beiden Automatik-Arten fest und erklärt.
  Haken „Im Kundenportal anfragbar“ blendet „Beschreibung für Kunden“ (Pflicht) ein; Hinweis darunter:
  „Kunden sehen Titel und diese Beschreibung, nie den Preis.“
- **Zuweisungs-Dialog:** Nach Wahl einer Stunden-Vorlage erscheint `hours/duration-field` (bestehender Adapter)
  als Pflichtfeld, darunter „Schreibt 5:00 gut und weist sie diesem Projekt zu.“ und der berechnete Betrag
  (`formatEuroCents`); das Statusfeld entfällt. Ohne `canManageHours` ist die Vorlage in der Auswahl deaktiviert
  mit Grund als Text. Bei einer Zusatzrunden-Vorlage steht „Fügt dem Projekt eine Feedbackrunde hinzu.“ bzw. der
  Sperrgrund aus `extraRoundBlockerByProject`. Der Client rechnet und entscheidet nichts selbst.
- **Leistungszeile:** Menge und Satz als Text; „Bearbeiten“ bietet bei Automatik-Arten kein Statusfeld.
- Nach dem Speichern `router.refresh()`; die Stunden-Sektion zeigt die neue Gutschrift ohne weiteres Zutun.

- **Akzeptanz (jsdom):** Stunden-Vorlage ohne Menge sendet nicht; Request enthält `quantityMinutes`; ohne
  `canManageHours` ist die Option deaktiviert und begründet; Freigabe ohne Kundentext sendet nicht; DE und EN
  vollständig.

## Deploy-Sicherheit 13c.1

1. **Sichtbar:** neue Felder im Katalog, Menge beim Zuweisen einer Stunden-Vorlage, Zusatzrunde per Zuweisung.
2. **Bricht nichts:** Nur neue nullable Spalten und ein erweiterter CHECK. Bestehende „Stundensatz“-Leistungen ohne
   Menge bleiben reine Konditionswerte.
3. **Rollback:** Code-Revert genügt; Spalten bleiben. Bereits entstandene Kaufzeilen mit
   `source = project_line_item` liest die Vorversion wie jede andere Kaufzeile (prüfen: der alte CHECK ist ersetzt,
   das alte Const-Objekt wird nur beim Schreiben verwendet).

## Nachtrag 11.10.2026 — Stunden frei oder am Projekt (mit dem Nutzer abgestimmt)

Stunden gehören dem Kunden und sind nicht immer für ein bestimmtes Projekt gedacht. Deshalb entscheidet die
Zuweisung, wohin sie gehen:

- Der Zuweisungs-Dialog hat bei einer Stunden-Vorlage den Haken **„Stunden diesem Projekt zuweisen“** (Standard an).
  Request-Feld `allocateHoursToProject` (fehlt = `true`).
- **An:** wie bisher — Leistung, Kaufbuchung und Zuweisung an das Projekt in einer Transaktion.
- **Aus:** Leistung und Kaufbuchung entstehen, **keine** Zuweisung. Die Stunden liegen im freien Bestand des Kunden
  und lassen sich im Abschnitt „Stunden“ später jedem Projekt zuweisen.
- Die Projektleistung bleibt in beiden Fällen an dem Projekt, in dem sie zugewiesen wurde: Sie dokumentiert den
  Verkauf (Menge × Satz), nicht den Verbrauchsort. Stunden ganz ohne Projektleistung bucht weiterhin „Stunden
  gutschreiben“.
- `PROJECT_CLOSED` gilt nur noch für die Zuweisung: Freie Stunden lassen sich auch an einem abgebrochenen oder
  archivierten Projekt verkaufen.
- **Katalog:** „Beschreibung für Kunden“ ist immer sichtbar und wird erst mit dem Haken „Im Kundenportal anfragbar“
  zum Pflichtfeld (vorher nur mit Haken sichtbar — das Feld wurde beim Bearbeiten nicht gefunden).

Folge für Task 75 und 76: Eine Stunden-Anfrage aus dem Portal darf „kein bestimmtes Projekt“ tragen
(`project_wish = undecided`). Der Annahme-Dialog bietet denselben Haken; das Projekt, an dem die Leistung
dokumentiert wird, wählt das Team trotzdem.
