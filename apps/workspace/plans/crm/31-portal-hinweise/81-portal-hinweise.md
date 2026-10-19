# Task 81 — Portal-Hinweise (Text, intern und im Portal)

> **Ordner:** 31 (Teil 31.1) · **Branch:** `feat/crm-portal-hinweise-1-text` · **Status:** offen ·
> **Dateien:** ≈ 75–90 · **Fachliche Regeln:** [`README.md`](./README.md)

## Ziel

Nach diesem Task kann das Team auf der CRM-Seite „Portal-Hinweise“ Hinweise mit Titel und Text anlegen, bearbeiten,
aktivieren und auf Behoben setzen, und zwar für alle Kunden oder für einen Kunden. Im Portal erscheint das
Hinweis-Widget ganz oben im Dashboard, solange mindestens ein sichtbarer Hinweis existiert. Ein Bild gibt es noch
nicht (Task 82).

## Vor dem Start

- `README.md` dieses Ordners, `00-entscheidungen.md` (Portal und Kommunikation, Wiederverwendete Muster) und die
  scoped `AGENTS.md` am Zielcode lesen.
- Migrationsnummer im Repository ermitteln (Stand Planung: höchste `0060`). Nie aus dem Plan übernehmen.
- Vorlage für alle Schichten ist das Leistungsarten-Feature (`line-item-templates`).

## T1 — Schema und Rechte

- `packages/db/migrations/00NN_create_portal_notices.sql`:
  - Tabelle `portal_notices`: `id uuid PK`, `audience text`, `customer_id uuid NULL REFERENCES customers(id)`,
    `severity text`, `status text`, `title text`, `body text`, `starts_at timestamptz NULL`,
    `ends_at timestamptz NULL`, `created_by_user_id uuid REFERENCES users(id)`,
    `updated_by_user_id uuid REFERENCES users(id)`, `version integer DEFAULT 1`, `created_at`, `updated_at`.
  - Benannte CHECKs (`portal_notices_<spalte>_check`): Wertelisten für `audience`, `severity` und `status`, die
    Kopplung `(audience = 'customer') = (customer_id IS NOT NULL)`, die Längen von Titel und Text,
    `ends_at > starts_at` (falls beide gesetzt) sowie `version > 0`.
  - Indizes: `portal_notices_status_audience_idx` und ein Partial-Index `portal_notices_customer_id_idx`
    `WHERE customer_id IS NOT NULL`.
  - Permissions `portal_notices.read` und `portal_notices.write` plus `role_permissions` für die Owner-Rolle
    (Muster `0057_add_portal_hours_permissions.sql`).
  - Alles idempotent (`IF NOT EXISTS`, `ON CONFLICT DO NOTHING`), getrennt mit `--> statement-breakpoint`.
- Drizzle-Modell `packages/db/src/record-configuration/crm/portal-notices.ts` plus Barrel-Export. Es muss
  deckungsgleich zur Migration sein (ausdrücklicher Review-Punkt).
- Constraint-Namen in `packages/db/src/constraint-names/crm/portal-notices-constraint-names.ts`.
- `packages/common/src/constants/auth/permissions.ts` (inkl. `PERMISSION_VALUES`) und `permission-definitions.ts`:
  `realm: Workspace`, `delegable: true`, `scopeAssignable: false`.
  `apps/workspace/src/common/constants/access/permission-groups.ts` ergänzen.
- `rbac-catalog-check` muss grün bleiben.
- Seed in `db:seed:crm`: ein aktiver Hinweis für alle (Art `incident`), ein aktiver Kundenhinweis (Art `maintenance`
  mit `ends_at`) und ein behobener Hinweis.

## T2 — Common-Bausteine

In `packages/common/src/`:

- `constants/crm/portal-notice-audiences.ts`, `portal-notice-severities.ts` und `portal-notice-statuses.ts`, jeweils
  als Const-Objekt mit `_VALUES`-Array und Test.
- `constants/crm/errors/portal-notice-error-codes.ts`: `not_found`, `customer_not_found`, `invalid_period` und
  `version_conflict` über das bestehende Muster.
- `constants/crm/forms/portal-notice-field-limits.ts`: Titel 120, Text 2 000.
- `contracts/crm/portal-notice.dto.ts`, `create-portal-notice-request.dto.ts`, `update-portal-notice-request.dto.ts`,
  `results/{create,update,list}-portal-notice-result.ts` und `rows/portal-notice-row.ts`. Ein Contract je Datei, und
  jedes DTO-Feld bekommt einen Docstring.
- `contracts/portal/portal-notice.dto.ts`: die Portal-Sicht ohne interne Felder (keine User-IDs, kein Status, kein
  `audience`).

In `apps/workspace/src/common/`:

- `patterns/crm/portal-notice-dialog-query.ts` und `portal-notice-list-search-params.ts` für den URL-State, nach dem
  Muster der Leistungsarten.
- `constants/crm/portal-notice-severity-order.ts` für die Sortierung im Widget.

## T3 — Server intern

In `apps/workspace/src/server/workspace/crm/`:

- `command-handler/create-portal-notice.command-handler.ts`: Validierung mit zod und Kundenprüfung bei `customer`.
- `command-handler/update-portal-notice.command-handler.ts`: Feld- und Statusänderungen über `updateVersioned`, mit
  409 bei Konflikt.
- `query-handler/list-portal-notices.query-handler.ts` (Filter Status/Ziel) und
  `get-portal-notice-by-id.query-handler.ts`.
- `services/portal-notice-schemas.ts`, `portal-notice-mapping-service.ts` (snake_case → camelCase) und
  `portal-notice-read-service.ts`.
- Aufrufe ohne `customers.read` liefern im DTO keinen Kundennamen, sondern nur `audience = customer`.

## T4 — Server Portal

- `apps/workspace/src/server/portal/query-handler/list-portal-notices.query-handler.ts`:
  - Nimmt einen `PortalReader`; der Kunde kommt ausschließlich aus dem Reader.
  - `WHERE status = 'active' AND (audience = 'all' OR customer_id = reader.customerId)` plus Zeitraum mit DB-`now()`.
  - Sortierung nach Art, dann `created_at DESC`.
- Eigener Mapper in `src/server/portal/services/` auf `PortalNoticeDto`.
- Kein Schreib-Handler im Portal.

## T5 — API und Client

- `apps/workspace/src/app/api/workspace/crm/portal-notices/route.ts` (GET Liste, POST Anlegen) und
  `[id]/route.ts` (GET, PATCH).
- `crm-endpoint-access-rules.ts`: `PortalNoticesRead`, `PortalNoticeCreate` und `PortalNoticeUpdate`, jeweils mit
  `scope: "workspace"`.
- `WorkspaceApiEndpoint.CrmPortalNotices` in `api-endpoints.ts`; `CrmOperation`-Einträge für `logCrmFailure`.
- `src/lib/workspace/crm/portal-notice-api-error.ts`: die nicht exportierte Message-Map für die Fehlercodes.
- `src/client/crm/portal-notices-api-service.ts` mit `list`, `create` und `update`.

## T6 — CRM-Seite und Sidebar

- `src/app/[locale]/(app)/crm/portal-notices/page.tsx`: `requireWorkspacePermission(PortalNoticesRead)`,
  `robots` noindex, `dynamic = "force-dynamic"`, Dialog per Query-Parameter, `WorkspaceScrollablePageShell`.
- `SITE_ROUTES.CRM_PORTAL_NOTICES` und `crmPortalNoticesPathFor(locale)` in `src/lib/auth/routes.ts`.
- Sidebar:
  - Flag in `src/app/[locale]/(app)/layout.tsx` (in `hasCrmNavigation` aufnehmen).
  - Prop durch `workspace-shell.tsx` reichen.
  - `CrmChildLink` mit FA-Icon `bullhorn` in `workspace-sidebar.tsx`, plus Test.
- Komponenten unter `src/components/workspace/crm/portal-notices/`, jeweils mit `.tsx`, `.module.css` und `.test.tsx`:
  - `portal-notices-page-header`: Titel und „Hinweis anlegen“ (nur mit write).
  - `portal-notices-list`: Filter, Empty-State mit Zweck, eigener Zustand für „keine Treffer“.
  - `portal-notice-row`: Art-Icon, Titel, Ziel, Status-Badge, Zeitraum, „aktiv seit“.
  - `portal-notice-status-badge`.
  - `portal-notice-form-dialog`: Ziel (Alle/Kunde mit Combobox), Art, Titel, Text, Zeitraum, Status und eine
    Live-Vorschau mit der Portal-Präsentationskomponente aus T7.
- Die Statusaktionen „Aktivieren“, „Behoben“ und „Zurück auf Entwurf“ als Schnellaktion in der Zeile, immer
  versioniert.

## T7 — Portal-Widget

- `PortalWidgetKey.Notices` in `src/common/constants/portal/portal-widget-keys.ts`.
- Eintrag in `portal-widget-layout.ts`: `order: 5`, Span voll auf allen Breakpoints, `openMode: None`,
  `mock: false`, `requiredPermission: Permission.PortalAccess`, `onlyWithContent: true`.
  `portal-widget-layout.test.ts` anpassen.
- `src/components/portal/dashboard/portal-notices-widget/`:
  - `<section>` mit `role="status"`, einer Liste der Hinweise und je Hinweis Icon und Badge nach Art.
  - Titel und Text über `LinkedText`. Langer Text wird nach drei Zeilen gekürzt und lässt sich aufklappen.
  - Die Farben kommen aus Theme-Tokens, Dark und Light gleichwertig, Zustände über `data-severity`.
- Die Präsentation eines einzelnen Hinweises (`portal-notice-card`) ist eine eigene Komponente, weil T6 sie für die
  Vorschau nutzt.
- `src/app/[locale]/(portal)/portal/[customerId]/page.tsx`: `listPortalNotices(reader)` in das bestehende
  `Promise.all` aufnehmen; bei Treffern `keysWithContent.add(PortalWidgetKey.Notices)`.
  `loading.tsx` darf das Widget nicht als Skelett zeigen.
- Dictionary-Texte im Portal-Dashboard-Dictionary (DE/EN): Widget-Label, Art-Badges, „Mehr anzeigen“.

## T8 — i18n und Copy

- `src/i18n/dictionaries/workspace/crm/portal-notices/{de,en}.json` anlegen und in
  `src/i18n/dictionaries/workspace/crm/index.ts` registrieren.
- Ergänzen: das Sidebar-Label, die Permission-Beschreibungen in den Settings und die Fehlermeldungen.
- Alle Texte mit dem `copywriting`-Skill. Das Portal spricht den Kunden in Du-Form an.

## T9 — Tests

- Unit: Konstanten, zod-Schemas (Zeitraum, Längen, Kopplung Ziel/Kunde), beide Mapper, Sortierung.
- Routen: 400 (Validierung), 403 (ohne write), 404 (ohne read, unbekannte ID) und 409 (Version).
- Integration `src/server/tests/workspace/crm/portal-notices.integration.test.ts`:
  - Sichtbarkeitsmatrix über Status × Zeitraum × Ziel.
  - Cross-Customer: Hinweis von A nicht bei B.
  - Die Owner-Sicht sieht dasselbe wie der Kunde.
- Komponenten: Widget (kein Render ohne Daten, Sortierung, `<script>` als Text, Aufklappen), Liste (beide
  Empty-States), Formular (Kundenfeld ohne `customers.read` gesperrt), Sidebar.
- E2E `apps/workspace/e2e/portal-notices.e2e.ts`: intern anlegen und aktivieren → im Portal sichtbar →
  „Behoben“ → im Portal verschwunden; ein Kundenhinweis ist bei einem zweiten Kunden nicht sichtbar.

## Abnahme

Alle Merge-Gates aus der README, die nicht mit „(31.2)“ markiert sind. Außerdem gilt: Sichtprüfung des Widgets in
Dark und Light sowie mobil und am Desktop, Keyboard-Fokus in Liste und Dialog.
