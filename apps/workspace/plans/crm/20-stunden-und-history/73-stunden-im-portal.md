# Task 73 — Stunden im Portal

> **Merge-Einheit:** Ordner 20, PR 20.3 · **Branch:** `feat/crm-stunden-3-portal`
> **Aufwand:** M–L · **Abhängigkeiten:** PR 20.1 und 20.2 gemergt (Task 27 und 72)
> **Migration:** eine (nur Permission-Katalog); Nummer im Repository ermitteln
> **Zuerst lesen:** [README](./README.md), [Task 72](./72-zeitbuchungen-und-aufgaben.md),
> `apps/workspace/src/server/portal/AGENTS.md`, `apps/workspace/src/app/[locale]/(portal)/AGENTS.md`,
> `apps/workspace/src/components/portal/AGENTS.md`

- Das Dashboard-Widget „Stunden“ zeigt echte Werte statt „Bald verfügbar“.
- Der Kunde sieht je Projekt und gesamt: gekauft, verbraucht, übrig.
- Mit dem Detailrecht sieht er jede Buchung: Datum, Dauer, was getan wurde.
- Das Portal schreibt bei Stunden nie.

## Context

Die Frage „wie viele Stunden habe ich noch, und wofür sind die anderen draufgegangen?“ landet heute per Mail beim
Team. Mit diesem Task beantwortet sie das Portal. Der Wert liegt weniger in der Zahl als im Verlauf: Der Kunde liest
„1:00 — Umbau Hero-Section“ statt einer schrumpfenden Summe.

Das Widget `hours` steht seit Ordner 13 als Mock in `PORTAL_WIDGET_LAYOUT`
(`apps/workspace/src/common/constants/portal/portal-widget-layout.ts`, `order: 100`, `openMode: Dialog`). Es gibt
**keine eigene Portalseite** und keinen Navigationseintrag: Die Portal-Shell hat keine Navigationsleiste, Module
hängen als Widget im Dashboard (`apps/workspace/src/app/[locale]/(portal)/AGENTS.md`).

**Vorlage ist das Zugangsdaten-Widget** (Task 71), weil es denselben Schnitt hat — Zusammenfassung mit dem
Dashboard, Liste erst beim Öffnen des Dialogs:
`apps/workspace/src/server/portal/query-handler/get-portal-credentials-summary.query-handler.ts`,
`apps/workspace/src/server/portal/services/credentials/portal-credential-service.ts`,
`apps/workspace/src/app/api/portal/[customerId]/credentials/route.ts`,
`apps/workspace/src/components/portal/dashboard/widgets/portal-credentials-widget/`,
`apps/workspace/src/components/portal/credentials/portal-credentials-dialog/`,
`apps/workspace/src/hooks/portal/` (`usePortalCredentials`),
`apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/page.tsx` (`showsCredentials`).

## Entscheidungen

| Bereich           | Entscheidung                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permissions       | `portal.hours.read` und `portal.hours.entries.read` — Realm `portal`, `delegable: true`, `scopeAssignable: false`. Beide landen automatisch in `portal_standard` (abgeleitete Rolle)               |
| Owner-Portalsicht | Beide Rechte kommen in `PORTAL_READ_PERMISSION_VALUES`: Es sind reine Leserechte                                                                                                                   |
| Wann sichtbar     | `onlyWithContent: true`. Inhalt gibt es, sobald der Kunde mindestens eine Kaufbuchung **oder** eine Zeitbuchung hat. Ersetzt die alte Regel „nur bei laufendem Kontingent“                         |
| Summen            | Kundensummen zählen **alle** Zeilen des Kunden, unabhängig vom Projektstatus — sonst ginge die Rechnung für den Kunden nicht auf                                                                   |
| Projekte          | Einzeln mit Titel erscheinen nur Projekte, die das Portal ohnehin zeigt (`PORTAL_VISIBLE_PROJECT_STATUS_VALUES`). Alle übrigen mit Stunden werden zu **einer** Zeile „Frühere Projekte“ ohne Titel |
| Buchungen         | Jede Zeitbuchung ist sichtbar (kein Schalter). Buchungen nicht sichtbarer Projekte stehen ohne Projektbezug unter „Frühere Projekte“                                                               |
| Aufgabentitel     | Nur wenn die Aufgabe `visible_to_customer` ist **und** der Leser `portal.tasks.read` hat. Sonst steht nur die Beschreibung der Buchung da                                                          |
| Kulanz            | Sichtbar mit dem Zusatz „nicht berechnet“; zählt in keiner Summe                                                                                                                                   |
| Nie im DTO        | Mitglieds-IDs, Namen von Mitarbeitern, interne Zuweisungsnotizen, einzelne Zuweisungs- und Freigabezeilen, Versionen, Stundensatz, Budget                                                          |
| Überziehung       | Sachlich: „1:00 über dem Kontingent“ bzw. „Dieses Projekt hat 1:00 mehr verbraucht als zugewiesen.“ Kein Warnton, keine Handlungsaufforderung (die Anfrage kommt mit Ordner 13c)                   |
| Ansprache         | DE-Texte in Du-Form, freundlich, ohne Fachjargon („Kontingent“ ja, „Allokation“ nie)                                                                                                               |
| Fehlgriffe        | Fremde Firma, geratene ID, fehlendes Recht: immer 404, ununterscheidbar                                                                                                                            |

## CRM-73-T1 — Katalog

```txt
packages/common/src/constants/auth/permissions.ts               + PortalHoursRead "portal.hours.read",
                                                                  PortalHoursEntriesRead "portal.hours.entries.read"
                                                                  (Objekt und PERMISSION_VALUES, hinter den PortalCredentials-Einträgen)
packages/common/src/constants/auth/permission-definitions.ts    + zwei Einträge (Realm Portal, delegable true, NOT_SCOPE_ASSIGNABLE);
                                                                  PORTAL_READ_PERMISSION_VALUES + beide
                                                                  (PORTAL_STANDARD_EXCLUDED_PERMISSION_VALUES bleibt unverändert)
packages/common/src/constants/auth/permissions.test.ts          angepasst
packages/common/src/constants/auth/system-role-definitions.test.ts   portal_standard enthält beide
packages/db/migrations/<nr>_add_portal_hours_permissions.sql
apps/workspace/src/common/constants/access/permission-groups.ts + beide in PermissionGroup.Portal
apps/workspace/src/i18n/dictionaries/workspace/settings/permissions/{de,en}.json   + Texte der beiden Permissions
apps/workspace/src/common/constants/portal/portal-access-preview-areas.ts          + { labelKey: PortalWidgetKey.Hours,
                                                                                     requiredPermission: Permission.PortalHoursRead }
apps/workspace/src/i18n/dictionaries/workspace/crm/portal-access/{de,en}.json      + Label für den neuen Vorschau-Bereich
```

Migration exakt nach `packages/db/migrations/0051_add_portal_task_requests.sql`:

```sql
INSERT INTO permissions (key, realm, delegable, scope_assignable, description)
VALUES ('portal.hours.read', 'portal', TRUE, FALSE, 'See purchased, used and remaining hours per project.'),
       ('portal.hours.entries.read', 'portal', TRUE, FALSE, 'See each time entry with date, duration and description.')
ON CONFLICT (key) DO NOTHING;
--> statement-breakpoint

INSERT INTO role_permissions (role_id, realm, role_is_system, role_scope_assignable, permission_key,
                              permission_delegable, permission_scope_assignable)
SELECT '7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a04', p.realm, TRUE, FALSE, p.key, p.delegable, p.scope_assignable
FROM permissions AS p
WHERE p.key IN ('portal.hours.read', 'portal.hours.entries.read')
ON CONFLICT (role_id, permission_key) DO NOTHING;
```

Die `description` in `permission-definitions.ts` ist wortgleich. `PORTAL_ACCESS_PREVIEW_AREAS` wird in
`components/workspace/crm/portal-access/invite-portal-contact-dialog/invite-portal-contact-dialog.tsx` gelesen; dort
nachsehen, aus welchem Dictionary-Zweig das Label für `PortalWidgetKey.Credentials` kommt, und `hours` genauso
versorgen (DE und EN).

- **Akzeptanz:** `pnpm --filter @invessiv/db db:smoke:rbac` grün; `portal_standard` enthält beide Rechte in Code und
  Datenbank; `PORTAL_READ_PERMISSION_VALUES` enthält beide; bestehende Fixtures, die Portalrechte aufzählen, sind
  geprüft (`apps/workspace/src/server/tests/support/portal-membership-fixture.ts`,
  `apps/workspace/e2e/support/portal-e2e-database.ts`).

## CRM-73-T2 — Portal-Server

```txt
packages/common/src/contracts/portal/portal-hours.dto.ts                 PortalHoursDto
packages/common/src/contracts/portal/portal-hours-balance.dto.ts         PortalHoursBalanceDto
packages/common/src/contracts/portal/portal-project-hours.dto.ts         PortalProjectHoursDto
packages/common/src/contracts/portal/portal-earlier-projects-hours.dto.ts PortalEarlierProjectsHoursDto
packages/common/src/contracts/portal/portal-hour-purchase.dto.ts         PortalHourPurchaseDto
packages/common/src/contracts/portal/portal-time-entry.dto.ts            PortalTimeEntryDto
packages/common/src/contracts/portal/portal-time-entry-page.dto.ts       PortalTimeEntryPageDto
packages/common/src/contracts/portal/portal-hours-dto.test.ts            Typtest: verbotene Felder fehlen (Muster
                                                                         contracts/credentials/credential-dto.test.ts)

apps/workspace/src/server/portal/services/hours/portal-hours-service.ts          portalHoursService
apps/workspace/src/server/portal/services/hours/portal-hours-mapping-service.ts  portalHoursMappingService
apps/workspace/src/server/portal/query-handler/get-portal-hours.query-handler.ts
apps/workspace/src/server/portal/query-handler/list-portal-time-entries.query-handler.ts
apps/workspace/src/app/api/portal/[customerId]/hours/entries/route.ts            GET, withPortalReader
apps/workspace/src/common/patterns/portal/portal-api-endpoints.ts                + portalHoursEntriesEndpoint(customerId)
apps/workspace/src/lib/portal/portal-hours-api-error.ts                          not_found 404, validation 422, internal 500
apps/workspace/src/server/portal/AGENTS.md                                       + Abschnitt „Stunden (ab Task 73)“
```

```ts
PortalHoursBalanceDto { purchasedMinutes; usedMinutes; remainingMinutes; unassignedMinutes }
PortalProjectHoursDto { projectId; title; allocatedMinutes; usedMinutes; remainingMinutes }
PortalEarlierProjectsHoursDto { allocatedMinutes; usedMinutes; remainingMinutes }
PortalHourPurchaseDto { purchasedOn: string; minutes: number; isCorrection: boolean; note: string }

PortalHoursDto {
  balance: PortalHoursBalanceDto;
  /** Portal-visible projects that have an allocation or a time entry, in the dashboard's project order. */
  projects: PortalProjectHoursDto[];
  /** Everything booked on projects the portal does not show; null when there is nothing. Keeps the sums honest. */
  earlierProjects: PortalEarlierProjectsHoursDto | null;
  /** Newest first, capped at HoursLimits.HistoryPreviewSize. */
  purchases: PortalHourPurchaseDto[];
  /** True with portal.hours.entries.read; the dialog then offers the entry list. */
  canReadEntries: boolean;
}

PortalTimeEntryDto {
  /** Opaque list key; no endpoint addresses a single entry. */
  id: string;
  /** Null for entries on projects the portal does not show. */
  projectId: string | null;
  performedOn: string; durationMinutes: number; description: string; billable: boolean;
  /** Only for customer-visible tasks and readers with portal.tasks.read. */
  taskTitle: string | null;
}
PortalTimeEntryPageDto { entries: PortalTimeEntryDto[]; nextCursor: string | null }
```

**`portalHoursService`** (einzige Definition der Regeln; kein Handler wiederholt sie):

```ts
portalHoursService.can(reader, permission): boolean            // portalCanOn.forReader(reader, permission, { customerId })
portalHoursService.condition(reader, permission, columns): SQL // portalAccessCondition.forReader — FALSE without the right
portalHoursService.visibleProjectIds(reader): Promise<Set<string>>
  // projects of the reader's company in PORTAL_VISIBLE_PROJECT_STATUS_VALUES; status only, deliberately
  // NOT gated by portal.projects.read (rule in server/portal/AGENTS.md: project titles may appear as
  // navigation for an explicitly readable project-related area)
```

**`getPortalHours(reader): Promise<PortalHoursDto | null>`**:

1. `null` ohne `portal.hours.read`.
2. Summen über `hoursBalanceService.loadCustomerSums(db, reader.customerId)` und `.loadProjectSums(…)` aus
   `server/shared/services/hours/` (seit Task 27). Kein Import aus `server/workspace/**`.
3. `null`, wenn es weder Kauf- noch Zeitbuchung gibt (`purchasedMinutes === 0 && usedMinutes === 0 &&
goodwillMinutes === 0` **und** keine Kaufzeile; eine Gutschrift mit anschließender Vollkorrektur zählt als Inhalt).
4. Projekte aufteilen: sichtbar (`visibleProjectIds`) → `projects`, nur mit Zuweisung oder Buchung; alle übrigen mit
   Zuweisung oder Buchung → Summe in `earlierProjects`.
5. `unassignedMinutes = purchased − Σ allocated`; `remainingMinutes = purchased − used`.
6. Kaufbuchungen: letzte 20, `isCorrection = kind === correction`.

**`listPortalTimeEntries(reader, query: { projectId?: string; cursor?: string }): Promise<PortalTimeEntryPageDto | null>`**:

- `null` ohne `portal.hours.entries.read` (Route → 404).
- Eine Abfrage: `project_time_entries` der Firma des Lesers (`condition`), `LEFT JOIN tasks`, Sortierung und Cursor
  wie in Task 72 (`time-entry-cursor` aus `@invessiv/common`), `limit 31`.
- `projectId` im Filter muss in `visibleProjectIds` liegen, sonst `validation`.
- Mapping: `projectId` nur, wenn sichtbar, sonst `null`; `taskTitle` nur bei `tasks.visible_to_customer` und
  `portalHoursService.can(reader, Permission.PortalTasksRead)`.

Die Route folgt `app/api/portal/[customerId]/credentials/route.ts` (GET-Zweig, `withPortalReader`).

- **Akzeptanz (Integrationstests mit echten Portal-Sessions über `createPortalSessionFixture` aus
  `apps/workspace/src/server/tests/support/portal-session-fixture.ts`; Datei
  `apps/workspace/src/server/tests/portal/hours/portal-hours.integration.test.ts`; Vorlage
  `…/tests/portal/feedback/portal-feedback-sessions.integration.test.ts`):**
  - Rechenbeispiel der README: `balance` 10:00 / 8:30 / 1:30, Projekt B mit Rest −1:00
  - dieselben Zeilen über `getCustomerHours` (Task 27) und `getPortalHours` ergeben dieselben Summen
  - archiviertes Projekt mit 2:00 Verbrauch: fehlt in `projects`, steht in `earlierProjects`, zählt in `balance`
  - Kontakt einer anderen Firma: `getPortalHours` der eigenen Firma, nie der fremden; `listPortalTimeEntries` mit
    fremder `projectId` → `validation`, ohne Filter nur eigene Zeilen
  - ohne `portal.hours.read` → `null`; mit `.read` ohne `.entries.read` → Stand ja, Liste `null`
  - Aufgabe mit `visible_to_customer = false` → `taskTitle: null`; sichtbar ohne `portal.tasks.read` → `null`
  - Kulanzbuchung erscheint mit `billable: false` und ändert `usedMinutes` nicht
  - serialisierte Antwort beider Handler enthält keinen der Schlüssel `memberId`, `performedByMemberId`,
    `createdByMemberId`, `version`, `hourlyRate`, `budget`
  - Owner-Sicht (`createPortalOwnerView`) liest beides
  - Kunde ohne jede Zeile → `null` (Widget fehlt)

## CRM-73-T3 — Widget und Dialog

```txt
apps/workspace/src/common/constants/portal/portal-widget-layout.ts            Eintrag Hours: mock: false,
                                                                              requiredPermission: Permission.PortalHoursRead,
                                                                              onlyWithContent: true
apps/workspace/src/common/constants/portal/portal-widget-layout.test.ts       angepasst
apps/workspace/src/common/patterns/portal/list-visible-portal-widgets.test.ts angepasst
apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/page.tsx         showsHours → getPortalHours; keysWithContent
apps/workspace/src/components/portal/dashboard/portal-dashboard/portal-dashboard.tsx
                                                                              Hours: echtes Widget statt mockDialog
apps/workspace/src/components/portal/dashboard/portal-widget-dialog-host/portal-widget-dialog-host.tsx
                                                                              + hoursDialog; Hours verlässt den Mock-Zweig
apps/workspace/src/components/portal/dashboard/widgets/portal-hours-widget/   Karte
apps/workspace/src/components/portal/hours/portal-hours-dialog/               Orchestrator des Dialogs
apps/workspace/src/components/portal/hours/portal-hours-summary/              Stand gesamt und je Projekt
apps/workspace/src/components/portal/hours/portal-hours-purchases/            Kaufhistorie
apps/workspace/src/components/portal/hours/portal-time-entry-list/            Buchungen, gruppiert, nachladbar
apps/workspace/src/hooks/portal/use-portal-time-entries.ts
apps/workspace/src/client/portal/portal-hours-api-service.ts                  (+ .test.ts)
apps/workspace/src/i18n/dictionaries/portal/hours/{de,en}.json
apps/workspace/src/i18n/dictionaries/portal/index.ts                          + getPortalHoursDictionary, PortalHoursDictionary
apps/workspace/src/i18n/dictionaries/portal/dashboard/{de,en}.json            widgets.hours: teaser/upcoming entfernen,
                                                                              echte Widget-Texte
apps/workspace/src/components/portal/AGENTS.md                                + Abschnitt „Stunden (ab Task 73)“
```

Skills: `frontend-design`, `impeccable`, `copywriting` (Pflicht laut Root-`AGENTS.md`).

**Seite** (`page.tsx`, Muster `showsCredentials`):

```ts
const showsHours = listVisiblePortalWidgets(
  reader.permissions,
  new Set([PortalWidgetKey.Hours]),
).some((entry) => entry.key === PortalWidgetKey.Hours);
// im Promise.all: showsHours ? getPortalHours(reader) : null
if (hours) keysWithContent.add(PortalWidgetKey.Hours);
```

`hours` und `getPortalHoursDictionary(activeLocale)` gehen als Props an `PortalDashboard`.

**Widget** (`QUARTER_ROW`, `order: 100` bleibt): große Zahl „1:30 übrig“ (`formatDuration`), darunter „8:30 von 10:00
verbraucht“ und ein schmaler Balken (`aria-hidden`, die Aussage steht als Text). Bei negativem Rest: „1:00 über dem
Kontingent“. Ist ein Projekt im Dashboard gewählt (`dashboard.selectedProjectId`) und in `hours.projects`, steht eine
zweite Zeile „In diesem Projekt: 2:30 übrig“. Öffnen über den Widget-Button (`?widget=hours`).

**Dialog** (`DialogSize.Wide`, lädt die Buchungen erst beim Öffnen):

1. `portal-hours-summary`: Gesamtzeile (Gekauft, Verbraucht, Übrig, „noch keinem Projekt zugewiesen“ nur wenn > 0),
   dann je Projekt eine Zeile (Titel, Zugewiesen, Verbraucht, Übrig), zuletzt ggf. „Frühere Projekte“. Als Tabelle
   mit `<th scope>`; unter 40rem als gestapelte Liste. Zahlen `tabular-nums`, rechtsbündig.
2. `portal-hours-purchases`: „Deine Stunden“ — Datum, `+10:00` bzw. `−1:00 (Korrektur)`, Notiz.
3. `portal-time-entry-list` (nur mit `canReadEntries`): „Wofür die Zeit verwendet wurde“ — Projektfilter als
   URL-State (`?hoursProject=<id>`, über `history.replaceState`), nach Monat gruppiert, je Zeile Datum, Dauer,
   Beschreibung, Aufgabentitel in zweiter Zeile, Zusatz „nicht berechnet“. „Weitere laden“ mit Live-Region.
   Ohne `canReadEntries` fehlt der Abschnitt vollständig (kein Hinweis auf fehlende Rechte).
4. Empty-States: keine Buchung („Bisher wurde keine Zeit gebucht. Sobald wir für dich arbeiten, steht hier, wofür.“)
   und kein Treffer im Projektfilter sind zwei unterscheidbare Texte.

Beschreibungen und Notizen werden nur als Text gerendert (kein HTML, kein Markdown). Keine Schreibaktion, deshalb
auch kein Owner-Hinweis nötig. Clientzustand über `key={customerId}` an die Firma gebunden.

- **Akzeptanz (jsdom + bestehende Dashboard-Tests):**
  - `listVisiblePortalWidgets`: ohne Recht kein `hours`; mit Recht ohne Inhalt kein `hours`; mit beidem ja
  - `portal-dashboard.test.tsx`: kein „Bald verfügbar“ mehr am Stunden-Widget
  - Dialog ohne `canReadEntries` ruft den Listen-Endpunkt nie auf
  - negativer Rest steht als Text, nicht nur als Farbe
  - Texte DE und EN vollständig, DE in Du-Form

## CRM-73-T4 — E2E und Seed

```txt
apps/workspace/e2e/portal-hours.e2e.ts
apps/workspace/playwright.portal.config.ts            testMatch-Regex um `hours` erweitern
apps/workspace/e2e/support/portal-e2e-database.ts     Fixture: Gutschrift, zwei Projekte, Buchungen (eine Kulanz)
apps/workspace/e2e/support/portal-e2e-fixture.ts      ggf. Pfad-Helfer
apps/workspace/e2e/portal-dashboard.e2e.ts            Zeile 71 (`?widget=hours` als Mock) anpassen
apps/workspace/package.json                           db:smoke:crm + src/server/tests/portal/hours
```

E2E (Vorlage `e2e/portal-credentials.e2e.ts`, echte Clerk-Dev-Sessions): Kontakt mit Standardrolle öffnet das
Widget, sieht Stand und Buchungen; Kontakt einer zweiten Firma sieht deren eigenen Stand; anonymer Aufruf des
Listen-Endpunkts → 404; Kontakt mit einer Rolle ohne `portal.hours.entries.read` sieht den Stand, aber keine Liste.

## Deploy-Sicherheit

1. **Live sichtbar:** Im Portal-Dashboard zeigt das Widget „Stunden“ echte Werte, sobald ein Kunde Stunden oder
   Buchungen hat. Kunden ohne beides sehen das Widget nicht mehr (bisher: Mock-Karte).
2. **Bricht nichts:** Die Migration fügt nur Katalogzeilen ein. `portal_standard` wächst um zwei Leserechte; jeder
   bestehende Kontakt sieht damit ab dem Deploy Stand **und** Buchungen seines Kunden. Das ist gewollt — vor dem
   Merge prüfen, ob in der Produktion bereits Buchungen mit Texten stehen, die so nicht für Kunden gedacht waren.
3. **Rollback:** Folge-PR, der den Registry-Eintrag wieder auf `mock: true` stellt und die Seite `getPortalHours`
   nicht mehr aufrufen lässt. Katalog, Rollen und Handler bleiben (ein vollständiger Revert würde Code und Datenbank
   im Permission-Katalog auseinanderlaufen lassen und `db:smoke:rbac` brechen).

## End-to-End-Akzeptanz

1. Kontakt mit Standardrolle sieht im Dashboard „1:30 übrig“ und öffnet den Dialog.
2. Der Dialog zeigt 10:00 gekauft, 8:30 verbraucht, 1:30 übrig; Projekt A 2:30 übrig, Projekt B 1:00 über dem
   zugewiesenen Umfang.
3. Die Buchungsliste nennt „1:00 — Umbau Hero-Section“ mit Datum; die Kulanzbuchung trägt „nicht berechnet“.
4. Ein Kontakt mit eigener Rolle ohne Detailrecht sieht Schritt 1 und 2, aber keine Buchungsliste.
5. Der Owner sieht dieselbe Ansicht lesend über „Portal ansehen“.
6. Ein Kunde ohne Stunden hat kein Stunden-Widget.
7. Alle Befehle aus dem Merge-Gate 20.3 der README sind grün.
