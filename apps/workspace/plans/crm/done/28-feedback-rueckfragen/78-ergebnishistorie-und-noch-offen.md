# Task 78 — Ergebnishistorie und „Noch offen“ (Teil 28.1)

> **Branch:** `feat/crm-feedback-rueckfragen` (alle drei Teile) · **Basis:** `master` · **Aufwand:** M–L ·
> **Dateien:** ≈ 50 · **Migration:** eine (Tabelle `feedback_round_item_result_history`)
> **Zuerst lesen:** `README.md` dieses Ordners (Abschnitte 0–2, 7.1–7.4, 8), `apps/workspace/plans/crm/AGENTS.md`,
> `packages/db/AGENTS.md`, `packages/db/src/record-configuration/crm/AGENTS.md`, `packages/common/AGENTS.md`,
> `apps/workspace/src/server/AGENTS.md`, `apps/workspace/src/server/shared/AGENTS.md` (Abschnitt Feedbackrunden),
> `apps/workspace/src/components/workspace/crm/AGENTS.md`

**Nach dem Merge:** Im Cockpit lässt sich jedes Ergebnis eines Feedbackpunkts wieder auf „Noch offen“ setzen,
solange die Runde in `submitted`, `in_discussion` oder `in_progress` steht. Jede tatsächliche Ergebnisänderung
(setzen, ändern, zurücksetzen, automatische Rücknahme beim Bearbeiten eines zurückgegebenen Entwurfs) landet in einer
internen, unveränderlichen Historie, die am Punkt einklappbar angezeigt wird. Das Portal ändert sich nicht und
liefert die Historie nie aus. Es gibt keinen Schalter und keinen Backfill (README „Teilschritte“).

**Vorlagen im Code:**

- Tabelle mit FKs, Checks und Kaskade: `packages/db/migrations/0045_create_feedback_rounds.sql`
  (`feedback_round_items`, Zeilen ≈ 96–141) und `0056_create_hours.sql` (mehrzeiliges Format).
- Modell und Partial-Unique-Index: `packages/db/src/record-configuration/crm/feedback-rounds.ts`
  (`uniqueIndex(N.ActiveUnique).on(...).where(...)`), Namen nach
  `packages/db/src/constraint-names/crm/feedback-round-items-constraint-names.ts` samt `.test.ts`.
- Smoke-Modul: `packages/db/scripts/crm-smoke/hours-checks.ts` (Kontext `CredentialSmokeContext`), Aufruf in
  `packages/db/scripts/smoke-crm-constraints.ts`.
- Ergebnis-Command: `apps/workspace/src/server/workspace/crm/command-handler/set-feedback-item-result.command-handler.ts`.
- Mitgliedsnamen: Join `workspace_members.user_id → users.display_name` wie in
  `apps/workspace/src/server/workspace/access/query-handler/list-workspace-member-options.query-handler.ts`;
  Kontaktnamen über `apps/workspace/src/server/shared/services/load-portal-contact-names.ts`.

## Festlegungen für diesen Teil

### Ereignismodell

Ein Historieneintrag beschreibt den **Folgezustand** des aktiven Ergebnisses eines Punkts (README 7.2).

| `event_kind` | Wann                                                                                     | Ergebnis-Snapshot                                       | Akteur                                    | `command_id` / `request_version`    |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| `baseline`   | Vor der **ersten** Änderung eines bereits bewerteten Punkts ohne jegliche Historie       | gespeicherter Istzustand inkl. `result_set_by/at`       | `member` = ursprünglicher `result_set_by` | beide `NULL`                        |
| `set`        | Ergebnis oder Begründung tatsächlich geändert                                            | neuer Zustand (`result_set_by` = Akteur, `_at` = jetzt) | `member`                                  | gesetzt                             |
| `reset`      | „Noch offen“ für einen bewerteten Punkt; automatische Entwurfsrücknahme (Legacy, Portal) | alle Ergebnisfelder `NULL`                              | `member` bzw. `portal_contact`            | beim Command gesetzt, Legacy `NULL` |

- `item_version` eines `baseline` ist die beobachtete Punktversion **vor** der Änderung; `set`/`reset` tragen die
  Punktversion **nach** der Änderung (Rückgabe von `updateVersioned` bzw. `updateLockedVersioned`). Dadurch kollidieren
  Ausgangsstand und Ereignis nie; Lücken in der Versionsfolge sind erlaubt (Positions- oder Textänderungen).
- Ein unveränderter Punkt (gleiches Ergebnis, gleiche normalisierte Begründung) erzeugt weder Write noch Eintrag;
  Bearbeiter, Zeitpunkt und Version bleiben stehen.
- „Noch offen“ auf einem Punkt mit `result = null` ist eine erfolgreiche unveränderte Antwort ohne Eintrag.
- `occurred_at` ist der fachliche Zeitpunkt (bei `baseline` der ursprüngliche `result_set_at`), `created_at` die
  technische Erfassungszeit (einziger erlaubter DB-Default).

### Idempotenz des Ergebnis-Commands

Der Request erhält optional `commandId` (UUID). Neue Clients senden immer eine pro expliziter Aktion erzeugte Kennung
und behalten sie bei Netzwerk-Retries; nach einem Versionskonflikt oder geänderter Eingabe entsteht eine neue
Kennung. Fehlt sie (alter, bereits geöffneter Tab), erzeugt der Server `randomUUID()` und die bisherige
Konfliktsemantik bleibt.

Ablauf unter Sperre (README 7.4): Replay → Version → No-op → Write.

1. **Replay:** Gibt es für diesen Punkt bereits einen Historieneintrag mit derselben `command_id`, ist der Request
   eine Wiederholung, wenn Ereignisart (`set` bzw. `reset`), `actor_member_id`, `request_version`, `result` und
   normalisierte `result_note` übereinstimmen. Dann wird der **aktuelle** Punkt ohne Write zurückgegeben (auch wenn
   sich der Punkt seither weiter geändert hat). Sonst Fehler `COMMAND_ID_REUSED` (409) ohne Mutation.
2. **Version:** Weicht `version` vom frisch gesperrten Punkt ab → 409 mit `VersionConflictDto` über dem aktuellen
   Punkt-DTO.
3. **No-op** (siehe oben) → 200 mit unverändertem Punkt.
4. **Write** in einem Savepoint: ggf. `baseline` einfügen → Punkt per `updateVersioned` schreiben → Ereignis mit der
   neuen Version einfügen. Meldet `updateVersioned` trotz Sperre einen Konflikt, wirft der Savepoint, sodass kein
   Historieneintrag stehen bleibt; danach wird der Konfliktstand gelesen und als 409 beantwortet.

## CRM-78-T1 — Schema, Constraint-Namen, Smoke, Seed

```txt
packages/db/migrations/<nr>_create_feedback_round_item_result_history.sql      neu (Stand 18.10.2026: nr = 0059)
packages/db/src/record-configuration/crm/feedback-round-item-result-history.ts  neu; Export im Barrel crm/index.ts
packages/db/src/constraint-names/crm/feedback-round-item-result-history-constraint-names.ts   neu (+ .test.ts)
packages/db/scripts/crm-smoke/feedback-result-history-checks.ts                 neu; in smoke-crm-constraints.ts aufrufen
packages/db/scripts/crm-fixture/seed-feedback-rounds.ts                        Historie für bewertete Beispielpunkte
packages/db/src/record-configuration/crm/AGENTS.md                              Abschnitt „Ergebnishistorie (Ordner 28)“
```

Migrationsnummer vor dem Anlegen in `packages/db/migrations/` ermitteln (`run-migrations.ts` sortiert per
`localeCompare` und registriert Dateinamen; die früheren Dateien `0059_create_service_requests.sql` /
`0060_add_portal_service_permissions.sql` wurden zu `0058_add_service_requests.sql` zusammengelegt und kollidieren
deshalb nicht).

Tabelle `feedback_round_item_result_history` (`CREATE TABLE IF NOT EXISTS`, Statements durch
`--> statement-breakpoint` getrennt, keine fachlichen Defaults, `id` und Versionen setzt die App):

| Spalte                       | Typ              | Regel                                                   |
| ---------------------------- | ---------------- | ------------------------------------------------------- |
| `id`                         | `UUID` PK        | von der App erzeugt                                     |
| `item_id`                    | `UUID` NN        | FK `feedback_round_items(id) ON DELETE CASCADE`         |
| `item_version`               | `INTEGER` NN     | `> 0`                                                   |
| `event_kind`                 | `TEXT` NN        | `IN ('baseline','set','reset')`                         |
| `result`                     | `TEXT`           | `IN (FEEDBACK_ITEM_RESULT_VALUES)`                      |
| `result_note`                | `TEXT`           | Länge ≤ 2000                                            |
| `result_set_by_member_id`    | `UUID`           | FK `workspace_members(id)` (ohne Kaskade, wie am Punkt) |
| `result_set_at`              | `TIMESTAMPTZ`    |                                                         |
| `actor_side`                 | `TEXT` NN        | `IN ('member','portal_contact')`                        |
| `actor_member_id`            | `UUID`           | FK `workspace_members(id)` (ohne Kaskade)               |
| `actor_portal_membership_id` | `UUID`           | FK `portal_memberships(id) ON DELETE SET NULL`          |
| `occurred_at`                | `TIMESTAMPTZ` NN |                                                         |
| `command_id`                 | `UUID`           |                                                         |
| `request_version`            | `INTEGER`        | `> 0`                                                   |
| `created_at`                 | `TIMESTAMPTZ` NN | `DEFAULT NOW()`                                         |

Benannte Constraints (Präfix `feedback_round_item_result_history_`, Konstanten `FeedbackRoundItemResultHistoryConstraintName`):

- `item_fk`, `result_set_by_fk`, `actor_member_fk`, `actor_portal_membership_fk`
- `item_version_uidx` = `UNIQUE (item_id, item_version)`; `item_command_uidx` = partieller Unique-Index
  `(item_id, command_id) WHERE command_id IS NOT NULL` (im Modell per `uniqueIndex(...).where(...)`).
- `event_kind_check`, `actor_side_check`, `result_check`, `result_note_length_check`, `item_version_check`,
  `request_version_check`
- `snapshot_check`: `reset` ⇒ `num_nonnulls(result, result_note, result_set_by_member_id, result_set_at) = 0`;
  sonst `num_nonnulls(result, result_set_by_member_id, result_set_at) = 3` und `result_note IS NULL OR result IS NOT NULL`.
- `result_reply_check`: wie `feedback_round_items_result_reply_check` (Antwortpflicht für `not_implemented`/`additional_service`).
- `actor_check`: `member` ⇒ `actor_member_id IS NOT NULL AND actor_portal_membership_id IS NULL`;
  `portal_contact` ⇒ `actor_member_id IS NULL` (Mitgliedschaft darf später per `SET NULL` verschwinden).
- `kind_actor_check`: `event_kind = 'reset' OR actor_side = 'member'`.
- `command_check`: `num_nonnulls(command_id, request_version) IN (0, 2)` und `event_kind <> 'baseline' OR command_id IS NULL`.

Wenn die Migration Ergebnis-Werte oder die Länge 2000 als Literale enthält, wird sie in einen Test nach Vorbild
`feedback-limits-migration.test.ts` aufgenommen (Literale = `FEEDBACK_LIMITS.noteMaxLength` bzw.
`FEEDBACK_ITEM_RESULT_VALUES`). Drizzle-Modell, Constraint-Namen und Migration sind deckungsgleich (Review-Punkt).

Smoke-Modul `runFeedbackResultHistoryChecks(context)`: je Check `expectRejected(name, run, constraint)` bzw.
`expectAccepted` für alle drei Ereignisarten, falsche Snapshot-Kombinationen, fehlende Antwort, Akteur-Kombinationen,
`baseline` mit Kennung, doppelte `(item_id, item_version)`, doppelte Kennung je Punkt, fehlende fachliche Werte
(`runMissingDefaultChecks`-Muster: `id`, `item_version`, `event_kind`, `actor_side`, `occurred_at` ohne Wert scheitern),
`SET NULL` beim Entfernen einer Portal-Mitgliedschaft und Kaskade beim Löschen des Punkts.

Seed: Für die bereits bewerteten Beispielpunkte aus `seedFeedbackRounds` je einen realistischen Verlauf anlegen
(z. B. `baseline` → `set` mit anderer Begründung → `reset` → `set`), Punktversionen passend hochzählen. Das Seed-Skript
bleibt optional; ohne Seed zeigt das Cockpit keinen Historienbereich.

## CRM-78-T2 — Common: Konstanten, Contracts, Fehlercode

```txt
packages/common/src/constants/crm/feedback-result-history-event-kinds.ts   neu: FeedbackResultHistoryEventKind + VALUES
packages/common/src/constants/crm/feedback-result-actor-sides.ts           neu: FeedbackResultActorSide { Member, PortalContact } + VALUES
packages/common/src/contracts/crm/feedback-item-result-history-entry.dto.ts   neu
packages/common/src/contracts/crm/feedback-round-item.dto.ts               + resultHistory: FeedbackItemResultHistoryEntryDto[]
packages/common/src/contracts/crm/set-feedback-item-result-request.dto.ts  result: FeedbackItemResult | null; commandId?: string
packages/common/src/constants/crm/errors/feedback-round-error-codes.ts     + CommandIdReused: "COMMAND_ID_REUSED" (Objekt und VALUES)
packages/common/src/contracts/crm/results/set-feedback-item-result-result.ts   + CommandIdReused in der Fehler-Union
```

`FeedbackItemResultHistoryEntryDto` (Docstring auf jedem Feld): `id`, `kind`, `itemVersion`, `result`
(`FeedbackItemResult | null`), `resultNote`, `actorSide`, `actorName` (`string | null`; `null` = Akteur nicht mehr
auflösbar, die UI zeigt dann eine lokalisierte Rollenbezeichnung), `occurredAt` (ISO). Keine Member-/Membership-IDs,
keine Command-Kennungen.

## CRM-78-T3 — Server: Historien-Service und Schreibwege

```txt
apps/workspace/src/server/shared/services/feedback/feedback-result-history-service.ts   neu
apps/workspace/src/server/shared/services/feedback/feedback-service-types.ts             + Historien-Zeilentyp, Akteur-Typ
apps/workspace/src/server/shared/services/feedback/feedback-round-item-service.ts       updateItem historisiert den Legacy-Reset
apps/workspace/src/server/workspace/crm/services/feedback/feedback-round-schemas.ts     setItemResult: null + commandId
apps/workspace/src/server/workspace/crm/command-handler/set-feedback-item-result.command-handler.ts
apps/workspace/src/server/workspace/crm/services/feedback/feedback-round-mapping-service.ts   toItemDto + resultHistory
apps/workspace/src/server/workspace/crm/services/feedback/feedback-round-service.ts      toRoundDto lädt Historie gesammelt
apps/workspace/src/lib/workspace/crm/feedback-round-api-error.ts                         STATUS/MESSAGES + CommandIdReused (409)
apps/workspace/src/common/patterns/crm/feedback-processing-error.ts                      CommandIdReused → Changed
apps/workspace/src/server/shared/AGENTS.md                                               Abschnitt Feedbackrunden ergänzen
```

**`feedbackResultHistoryService`** (ein Service-Objekt, liegt in `server/shared`, weil Portal-Entwurfspfad und
Workspace-Handler ihn nutzen):

- `recordChange(tx, { stored, next, actor, command })` — `stored` ist die **unter `FOR UPDATE` gelesene**
  Punktzeile vor dem Write, `next` die Punktzeile nach dem Write (für `item_version` und Snapshot), `actor` ist
  `{ side: member, memberId }` oder `{ side: portal_contact, portalMembershipId }`, `command` ist
  `{ commandId, requestVersion } | null`. Legt einen `baseline` an, wenn `stored.result !== null` und für den Punkt
  noch kein Eintrag existiert, und danach das Ereignis (`set` bzw. `reset`, abgeleitet aus `next.result`).
- `findByCommand(tx, itemId, commandId)` — der eine Eintrag zu einer Kennung oder `null`.
- `loadByItems(reader, itemIds)` — eine Abfrage für alle Punkte, Join auf `workspace_members`/`users` für
  `display_name`; Portal-Kontaktnamen anschließend gesammelt über `loadPortalContactNames`. Sortierung
  `item_id, item_version`. Liefert `Map<itemId, FeedbackItemResultHistoryEntryDto[]>` über eine Mapping-Funktion im
  CRM-Mapping-Service (Mapping nicht inline; Mapping-Test Pflicht).

**`feedbackRoundSchemas.setItemResult`:** `strictObject({ version, commandId: z.uuid().optional(), result:
z.enum(FEEDBACK_ITEM_RESULT_VALUES).nullable(), resultNote: optionalText(noteMaxLength) })`. Refines: bestehende
Antwortpflicht; bei `result === null` muss `resultNote` `null` sein (Pfad `resultNote`). `commandId` wird wie andere
IDs kleingeschrieben normalisiert.

**`setFeedbackItemResult`:**

1. Schema und ID prüfen (unverändert).
2. Runde wie bisher über den Join mit `crmAccessCondition` und `.for("share", { of: feedbackRounds })` sperren und
   `canOn` prüfen; danach den Punkt separat `select … where id … for("update")` **frisch** lesen. Nicht gefunden →
   `ItemNotFound`. Status außerhalb `RESULT_EDITABLE_FEEDBACK_ROUND_STATUS_VALUES` → `RoundLocked`.
3. Replay → Version → No-op → Write mit Historie (siehe „Idempotenz“). Die Historie des Punkts wird für die Antwort
   über `loadByItems` geladen.
4. Patch bei `result === null`: `result`, `result_note`, `result_set_by_member_id`, `result_set_at` auf `null`.

**`feedbackRoundItemService.updateItem`:** Bei `contentChanged` und `stored.result !== null` nach
`updateLockedVersioned` `recordChange` mit `actor_side portal_contact` (`portalMembershipId` aus
`replaceDraftItems`, das ihn bereits erhält) und `command: null` aufrufen. `updateLockedVersioned` muss dafür die
geschriebene Zeile liefern (prüfen; die Funktion gibt `VersionedRow` zurück). Unbewertete Punkte erzeugen keinen
Eintrag. Dieser Pfad greift nur für bereits global zurückgegebene Runden und bleibt nach Task 80 als Bestandsfall.

**Lesen:** `feedbackRoundService.toRoundDto` lädt zusätzlich zur bestehenden `loadByRound`-Abfrage die Historie aller
Punkte der Runde mit **einer** Abfrage und reicht sie an `feedbackRoundMappingService.toItemDto` weiter
(`LoadedFeedbackItem` bleibt unverändert; die Historie kommt als zweites Argument bzw. aus der Map). Der Portal-Pfad
(`portal-feedback-service.toRoundDtos`, `portal-feedback-mapping-service`) lädt und mappt keine Historie.

`server/shared/AGENTS.md`: Abschnitt „Feedbackrunden“ um `feedback-result-history-service.ts` ergänzen (einziger
Schreibweg der Historie; jeder Ergebnis-Schreibweg ruft `recordChange` in derselben Transaktion; nur intern lesbar).

## CRM-78-T4 — Cockpit-UI

```txt
apps/workspace/src/components/workspace/crm/feedback-rounds/feedback-item-result-select/feedback-item-result-select.tsx
apps/workspace/src/components/workspace/crm/feedback-rounds/feedback-item-row/feedback-item-row.tsx
apps/workspace/src/components/workspace/crm/feedback-rounds/feedback-result-history/feedback-result-history.tsx        neu
apps/workspace/src/components/workspace/crm/feedback-rounds/feedback-result-history/feedback-result-history.module.css neu
apps/workspace/src/components/workspace/crm/feedback-rounds/feedback-result-history/feedback-result-history.test.tsx   neu
apps/workspace/src/components/workspace/crm/feedback-rounds/feedback-item-result-select/feedback-item-result-select.test.tsx neu
apps/workspace/src/i18n/dictionaries/workspace/crm/feedback-rounds/de.json, en.json
apps/workspace/src/common/contracts/...   benannter Dictionary-Untertyp (Root-Regel „Benannte Typen“), falls die
                                          Komponente einen eigenen Ausschnitt statt des Ergebnis-Dictionaries bekommt
```

- **Select:** Die Option „Noch offen“ (`FeedbackResultChoice.Pending`, Icon wie bisher) ist immer sichtbar. Wahl bei
  bewertetem Punkt sendet sofort `setItemResult(item.id, { commandId, version, result: null, resultNote: null })`
  (kein Dialog), Wahl bei bereits offenem Punkt bleibt ohne Request.
- **Row:** erzeugt `commandId` per `crypto.randomUUID()` **pro expliziter Aktion** (Select-Wahl oder Dialog-Absenden)
  und verwendet sie bei einem automatischen Retry derselben Aktion weiter; der `FeedbackTextDialog`-`send`-Callback
  bekommt die Kennung aus der Row (Dialog-Schnittstelle bleibt generisch). Nach Erfolg `router.refresh()` wie bisher
  und Ansage in der bestehenden Live-Region (`announcements.resultReset` neu, `resultSaved` bleibt). Fehler
  `COMMAND_ID_REUSED` erscheint als `processingErrors.changed`.
- **Historie:** neue Komponente unter dem Ergebnis, nur wenn `item.resultHistory.length > 0`. Ein Disclosure-Button
  (`aria-expanded`, `aria-controls`, sichtbarer Fokus) „Ergebnisverlauf ({count})“, standardmäßig eingeklappt.
  Einträge aufsteigend nach `itemVersion`: Zeitpunkt (bestehende Datumsformatierung des Cockpits), Akteur
  (`actorName` oder lokalisierte Ersatzbezeichnung „Team“ / „Kunde“), Ereignis („Ausgangsstand: Umgesetzt“,
  „Ergebnis: Nicht umgesetzt“, „Zurückgesetzt auf Noch offen“) und Begründung als reiner Text über die bestehende
  Text-Komponente (`components/shared/feedback/feedback-item-text`), kein HTML/Markdown. Status als Text, nicht nur
  Farbe; Farben nur über bestehende Tokens, Zustände über `data-*`.
- **Texte (DE/EN, `copywriting`):** `result.history.{toggle, empty?, baseline, set, reset, actorTeam, actorCustomer,
actorRemoved}`, `announcements.resultReset`. Keine neuen Inline-Strings.

## Tests

```txt
apps/workspace/src/server/tests/workspace/crm/services/feedback/feedback-round-schemas.test.ts          null + Notiz, commandId, strict
apps/workspace/src/server/tests/workspace/crm/services/feedback/feedback-round-mapping-service.test.ts  resultHistory gemappt, Namen/Fallback
apps/workspace/src/server/tests/portal/services/feedback/portal-feedback-mapping-service.test.ts        kein resultHistory im Portal-DTO
apps/workspace/src/server/tests/workspace/crm/feedback-round-processing.integration.test.ts
apps/workspace/src/server/tests/shared/services/feedback/feedback-services.integration.test.ts          Legacy-Entwurfsreset historisiert
apps/workspace/src/server/tests/workspace/crm/api/feedback-round-processing-routes.test.ts              Body ohne commandId, 409 COMMAND_ID_REUSED
apps/workspace/src/server/tests/shared/services/feedback/feedback-round-fixtures.ts                      resultHistory in Fixtures
apps/workspace/src/components/workspace/crm/feedback-rounds/feedback-round-detail/feedback-round-detail.test.tsx  Fixtures + Historie
apps/workspace/src/components/workspace/crm/feedback-rounds/project-feedback-section/project-feedback-section.test.tsx  Fixtures
```

Integration (`CRM_DB_INTEGRATION=true`, echte Sperren):

- Erste Änderung eines bewerteten Punkts legt genau einen `baseline` mit ursprünglichem Bearbeiter/Zeitpunkt an,
  weitere Änderungen nicht.
- Zurücksetzen nach allen drei Ergebnisarten: aktive Felder leer, vorherige Begründung im Verlauf erhalten.
- No-op (gleiches Ergebnis, gleiche Begründung; „Noch offen“ auf offenem Punkt): keine Versionserhöhung, kein Eintrag.
- Replay mit gleicher Kennung nach zwischenzeitlicher weiterer Änderung liefert den aktuellen Punkt ohne Write;
  gleiche Kennung mit anderer Nutzlast → `COMMAND_ID_REUSED`, keine Mutation; neue Kennung nach Konflikt klappt.
- Alter Request ohne `commandId` funktioniert und historisiert.
- Veraltete Version → 409 mit aktuellem Punkt inkl. Historie.
- Fehler nach Historien-Insert (z. B. per erzwungenem Constraint-Bruch) hinterlässt weder Punktänderung noch Eintrag.
- Abgeschlossene/freigegebene Runde → `RoundLocked`; Rundenabschluss ist nach einem Zurücksetzen wieder durch
  `ResultsIncomplete` gesperrt.
- Löschen eines Entwurfspunkts kaskadiert seine Historie.
- Fremder Kunde/fremdes Projekt → `ItemNotFound` (bestehende Negativtests um `result: null` ergänzen).

UI: Select bietet „Noch offen“ nach jedem Ergebnis an und sendet `null`; Historie eingeklappt, aufklappbar per
Tastatur, Reihenfolge, Ersatzbezeichnung bei `actorName = null`; DE/EN-Schlüssel vollständig (bestehende
Dictionary-Tests).

## Abnahme

- [ ] Migration idempotent (zweiter Lauf folgenlos) – nicht eigens geprüft; die Datei nutzt nur `IF NOT EXISTS`.
- [x] Modell deckungsgleich, Smoke grün (`pnpm db:smoke:crm`).
- [x] Alle Ergebnis-Schreibwege (`setFeedbackItemResult`, Legacy-Reset in `updateItem`) schreiben Historie in
      derselben Transaktion; kein anderer Code schreibt die Tabelle.
- [x] Portal-Read, Portal-Schreibantworten und Portal-Konfliktkörper enthalten keine Historie.
- [ ] „Noch offen“ im Cockpit bedienbar (Maus/Tastatur), Fokus bleibt am Punkt, Ansage in der Live-Region –
      im E2E-Ablauf abgedeckt, der Lauf steht aus.
- [ ] Beide Themes, mobile und Desktop geprüft.
- [x] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm db:smoke:crm`, `pnpm --filter @invessiv/workspace build` grün.
- [x] README-Tabelle „Teilschritte“: Status 28.1 gepflegt.

## Umsetzungsstand (18.10.2026)

Status: **läuft**, ungecommittet auf `feat/crm-feedback-rueckfragen`. Alle Teilaufgaben T1–T4 und die
Testliste sind umgesetzt.

**Abweichungen vom Plan (bewusst):**

- Der Ausgangsstand entsteht in `feedbackResultHistoryService.recordChange` nach dem Punkt-Write, im selben
  Savepoint. Er trägt die beobachtete Punktversion vor der Änderung, das Ereignis die neue Version; die Reihenfolge
  der Inserts hat dadurch keine fachliche Wirkung.
- Die Oberfläche erzeugt die `commandId` pro Aufruf. Der Client hat keine automatischen Retries; käme einer dazu,
  müsste er dieselbe Kennung weiterreichen.
- Das Mapping Zeile → DTO liegt in `server/shared/services/feedback/feedback-result-history-mapping-service.ts`,
  damit der geteilte Service nichts aus `server/workspace/**` importiert.
- Ein Kontakt mit entfernter Portalmitgliedschaft erscheint als „Entfernter Kontakt“, ein Mitglied ohne Namen als
  „Team“; der Schlüssel `actorCustomer` ist entfallen.
- Zusätzlich sichert `feedback-limits-migration.test.ts` die Literale aus Migration 0059 ab.
- Der Replay läuft vor der Statusprüfung (`RoundLocked`), nicht danach wie in T3 beschrieben. So bleibt eine
  Wiederholung auch nach dem Rundenabschluss idempotent und liefert den aktuellen Punkt. Den Vergleich der Nutzlast
  übernimmt `feedbackResultHistoryService.matchesCommand`.
- Testablage: Der Legacy-Entwurfsreset und die Kaskade sind in `feedback-result-history.integration.test.ts`
  geprüft statt in `feedback-services.integration.test.ts`. Der gemeinsame Helfer für eine eingereichte Runde liegt in
  `src/server/tests/support/feedback/submitted-feedback-round.ts`.

**Ausgeführte Prüfungen:**

| Prüfung                                     | Ergebnis                                                             |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `pnpm -r typecheck`                         | grün                                                                 |
| `pnpm -r lint`                              | grün (zwei ältere Warnungen in `apps/web` und `update-project`-Test) |
| `pnpm -r test`                              | grün                                                                 |
| `pnpm db:smoke:crm` (Dev-DB, 0059 migriert) | grün: 341 Constraint-Checks, 42 Integrationsdateien mit 484 Tests    |
| `pnpm --filter @invessiv/workspace build`   | grün (bestehende Turbopack-Warnung zu `packages/db/src/core/env.ts`) |

**Offen:**

- E2E-Lauf `pnpm --filter @invessiv/workspace test:e2e:portal` (der Ablauf ist in `portal-feedback.e2e.ts` ergänzt).
- Sichtprüfung beider Themes, mobil und Desktop.
- Prüfung, dass ein zweiter Migrationslauf folgenlos bleibt.
