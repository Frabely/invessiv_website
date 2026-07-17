# Plan: Lead-Status-Verwaltung (CRUD) im Workspace

## Context

Lead-**Status** ist heute ein hartverdrahtetes Enum:

- Const-Objekt `ContactLeadStatus` / `CONTACT_LEAD_STATUS_VALUES` in `packages/common`.
- `leads.lead_status` ist `text` mit Check-Constraint (`leads_lead_status_check`) auf die feste 14er-Liste; Default
  `new`.
- Labels in Dictionaries (`shared/{de,en}.json`, `status.*`), Farbe/Icon in der app-weiten Status-Badge-Konfiguration
  und Messaging-Reihenfolge in `MESSAGING_STAGE_ORDER`.
- An ~36 Dateien referenziert (Schemas, Command-/Query-Handler, Badge, Dashboard, Import).

Ziel: Status anlegen/bearbeiten/löschen — mit DB-persistierten, mehrsprachigen Namen, frei wählbarer Farbe (Hex) und
wählbarem Icon. Es gibt eine **feste Basis** (die 14 aktuellen Status), die nicht löschbar ist; zusätzlich \*
\*Custom-Status\*\*,
die an Leads gespeichert werden können.

**Leitentscheidung — Slug als Identifier (wie bisher):** `leads.lead_status` bleibt ein **Text-Slug**. Es gibt **keinen
**
FK/UUID-Umbau der Lead-Spalte; die Migration ist additiv. Das hält URLs (`?status=…`), Funnel-Logik und Import
unverändert
und begrenzt den Refactor.

### Getroffene Entscheidungen

| Thema             | Entscheidung                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status-Referenz   | **Slug als Identifier** — `leads.lead_status` bleibt Text-Slug; kein FK/UUID-Umbau                                                                              |
| Slug-Handhabung   | Slug **nach Anlage fix** (Basis & Custom), da Leads den Slug speichern; nur Label/Farbe/Icon editierbar (kein Rename-Cascade in v1)                             |
| Basis-Status      | Die **14 aktuellen** als `is_system = true` seeden → **nicht löschbar**                                                                                         |
| Custom-Status     | Frei anlegbar, an Leads speicherbar, löschbar; **nie im Dashboard-Funnel**                                                                                      |
| Labels / i18n     | **Separate Localizations-Tabelle** `lead_status_localizations` (locale + name); Deutsch (`de`) required, Englisch (`en`) optional mit `de`-Fallback             |
| Icon & Farbe      | **Im Dialog wählbar**; Icon-Key (kuratierte Allowlist) + **freier Hex-Farbcode** auf der Status-Zeile; Rendering der Farbe adaptiv via `color-mix` (Dark+Light) |
| Löschen (Custom)  | Betroffene Leads vorher auf **`pending_review`** umhängen, dann Hard-Delete (Localizations cascaden)                                                            |
| Source-of-Truth   | `CONTACT_LEAD_STATUS_VALUES` bleibt für **Basis-Slugs** (Defaults, Funnel, Basis-Import-Synonyme); DB = Gesamtmenge (Basis + Custom) + Präsentation             |
| Write-Validierung | `z.enum(CONTACT_LEAD_STATUS_VALUES)` → Validierung gegen **aktive Status-Slugs aus der DB**                                                                     |
| Funnel/Dashboard  | **Unverändert** — gruppiert weiter per Slug; Basis-Slugs sind immutable, Custom-Slugs fallen automatisch heraus                                                 |
| Verwaltungs-UI    | **Eigene Settings-Route** `apps/workspace/src/app/[locale]/(app)/settings/statuses/...`; Auth erbt aus dem `(app)`-Layout                                       |
| Berechtigung      | **Wie bestehende Lead-CRUD** (Workspace-Zugang über `(app)`-Layout; kein neues Rollen-Gate)                                                                     |
| AGENTS-Regel #9   | **Anpassen** — nutzergepflegte dynamische Status-Labels sind Daten (DB); statische Enum-Labels (Source, Activity, Plattform) bleiben dictionary-basiert         |

> Hinweis: Dieser Plan baut auf dem Locale-Resolution-Pattern und den UI-/API-Mustern aus
> `lead-category-management.md` auf. Kategorien werden zuerst umgesetzt, Status danach (wiederverwendet das Muster).

---

## Architektur-Überblick

Datenfluss (Anzeige): `lead_statuses` (+ `lead_status_localizations`) → Query-Handler (locale-aufgelöst) →
Präsentations-Map
`slug → { name, color, icon }` → Page → an Badge/Tabelle/Detail/Toolbar/Form weitergereicht. `leads.lead_status` (Slug)
bleibt der Verknüpfungspunkt.

Datenfluss (Verwaltung): Settings-Route `(app)/settings/statuses` (Edit-Ziel via Query-Param `?edit=<id>`) →
Client-Service → API-Routen → Command-Handler → DB (Transaktion: Status-Zeile + Localization-Zeilen).

Die Locale-Auflösung nutzt denselben Server-Helper wie Kategorien (
`resolveLocalizedLabel(localizations, locale, Locale.De)`).

---

## Umsetzungsschritte (kleine, reviewbare PRs)

### 1. Datenmodell + Migration + Seed — `packages/db`

- Neue Datei `record-configuration/lead-statuses.ts`:
  - `id uuid pk`, `slug text not null` (unique, Check non-empty), `color text not null` (Check Hex
    `^#[0-9a-fA-F]{6}$`),
    `icon_key text not null` (Check non-empty), `is_system boolean not null default false`,
    `is_active boolean not null default true`, `sort_order integer not null` (Check `>= 0`), `created_at`/
    `updated_at`.
  - `uniqueIndex` auf `slug`.
- Neue Datei `record-configuration/lead-status-localizations.ts`:
  - `id uuid pk`, `status_id uuid` FK → `lead_statuses.id` **ON DELETE CASCADE**, `locale text`,
    `name text not null` (Check non-empty), `description text` (nullable), `created_at`/`updated_at`.
  - `uniqueIndex` auf `(status_id, locale)`.
- `record-configuration/leads.ts`: **Check-Constraint `leads_lead_status_check` entfernen** (Status sind nun dynamisch).
  Optional FK `leads.lead_status → lead_statuses.slug` (`ON DELETE RESTRICT`) für referentielle Integrität; Default
  `new`
  bleibt. `leads.lead_status` bleibt `text`.
- Migration generieren: Tabellen anlegen, **14 Basis-Status seeden** (`is_system = true`; `slug`, `color` als Hex aus
  heutigen `STATUS_CONFIG`-Tones abgeleitet, `icon_key` aus `STATUS_CONFIG`, `sort_order` = aktuelle Reihenfolge aus
  `CONTACT_LEAD_STATUS_VALUES`) + de/en-Localizations aus heutigem `shared/{de,en}.json` (`status.*`). Constraint
  entfernen; ggf. FK ergänzen. **Kein Backfill der `leads`-Werte** (Slugs unverändert).
- `packages/db/scripts/seed-leads-fixture.ts`: optional `STATUS_FIXTURES` ergänzen, falls Fixtures Status-Stammdaten
  brauchen.

### 2. Konstanten + Contracts — `packages/common`

- `CONTACT_LEAD_STATUS_VALUES` / `ContactLeadStatus` **bleiben** als kanonische Basis-Slugs (Defaults wie `new`/
  `pending_review`, Funnel-Konstanten, Basis-Import-Synonyme).
- `constants/leads/statuses/lead-status-error-codes.ts`: `LeadStatusErrorCode` (`ValidationError`, `NotFound`,
  `SlugExists`, `SystemStatusImmutable`, `Internal`) + `_VALUES`-Array + Test.
- `constants/leads/statuses/lead-status-icons.ts`: `LeadStatusIconKey` (kuratierte Allowlist, deckt mindestens die
  heutigen `STATUS_CONFIG`-Icons ab) + `_VALUES`-Array. Hex-Validierung über den geteilten Helper aus dem
  Kategorie-Plan (`patterns/leads/is-hex-color.ts`).
- Contracts (camelCase):
  - `contracts/leads/lead-status.dto.ts` **neu**: `{ slug, name, color, icon, isSystem }` (Anzeige; Map-Key = `slug`).
  - `contracts/leads/lead-status-admin.dto.ts` **neu**:
    `{ id, slug, icon, color, isSystem, sortOrder, localizations: { de: string; en?: string } }`.
  - `contracts/leads/create-lead-status-request.dto.ts`:
    `{ slug, icon, color, sortOrder, localizations: { de: string; en?: string } }`.
  - `contracts/leads/update-lead-status-request.dto.ts`:
    `{ icon, color, sortOrder, localizations: { de: string; en?: string } }` (Slug **nicht** änderbar).
  - `contracts/leads/results/{create,update,delete}-lead-status-result.ts`: `{ ok, code?, errors? }`.

### 3. Query-Handler + Mapper — `apps/workspace/src/server/workspace/leads`

- `query-handler/list-lead-statuses.query-handler.ts` **neu**: `getLeadStatuses(locale)` → join
  `lead_status_localizations` (angeforderte Locale + `de`-Fallback), Rückgabe `LeadStatusDto[]` (`slug, name, color,
icon, isSystem`), sortiert nach `sort_order`. Daraus wird in der Page eine `slug → {name,color,icon}`-Map gebaut.
- `query-handler/list-lead-statuses-admin.query-handler.ts` **neu**: `getLeadStatusesForManagement()` →
  `LeadStatusAdminDto[]` (alle Localizations, icon/color/sortOrder/isSystem).
- `services/lead-status/lead-status-mapping-service.ts` **neu** + Mapper-Tests (AGENTS-Pflicht).
- **Anzeige:** Die Page lädt `getLeadStatuses(locale)` einmal und reicht die Präsentations-Map an Tabelle/Badge/Detail/
  Toolbar/Form weiter (analog zur Kategorie-Auflösung). `leads.lead_status` (Slug) bleibt das Lookup-Feld.

### 4. Command-Handler + Validierung — `apps/workspace/src/server/workspace/leads`

- `command-handler/create-lead-status.command-handler.ts`: validieren → Transaktion (Status-Zeile +
  Localization-Zeilen);
  `is_system = false`. Unique-Slug-Verletzung → `SlugExists`.
- `command-handler/update-lead-status.command-handler.ts`: `NotFound` falls fehlend; **Slug ist nie änderbar**; bei
  `is_system`-Zeilen nur Label/Farbe/Icon/sortOrder editierbar (kein Löschen). Localizations upserten.
- `command-handler/delete-lead-status.command-handler.ts`: nur für **Custom** (`is_system = false`); bei System →
  `SystemStatusImmutable`. Transaktion: betroffene `leads.lead_status = <slug>` → **`pending_review`** umhängen, dann
  Status-Zeile löschen.
- `services/create-lead-status/…-validation-service.ts` + `…schema.ts` (zod): `slug` (required, Pattern, lower-kebab),
  `localizations.de` required, `en` optional non-empty, `icon ∈ LEAD_STATUS_ICON_KEY_VALUES`, `color` gültiger Hex,
  `sortOrder ≥ 0`.

### 5. API-Routen — `apps/workspace/src/app/api/workspace/statuses`

- `route.ts`: `GET` (Management-Liste) + `POST` (create); `withWorkspaceApiAuth`.
- `[id]/route.ts`: `PATCH` (update) + `DELETE` (delete, nur Custom).
- `src/lib/workspace/leads/lead-status-api-error.ts`: `LeadStatusErrorCode` → Message-Map (co-located, nicht
  exportiert).
- `api/workspace/statuses/README.md`: Contract dokumentieren.

### 6. Settings-Route + Verwaltungs-UI + Client-Service

- `src/app/[locale]/(app)/settings/statuses/page.tsx` (dünn): lädt `getLeadStatusesForManagement()`, rendert
  Verwaltungskomponente; `robots noindex`, `dynamic = "force-dynamic"`.
- `src/client/leads/lead-statuses-service.ts`: fetch-Wrapper list/create/update/delete; nach Erfolg `router.refresh()`.
- `src/components/workspace/settings/statuses/...` (eigene Ordner, `*.module.css`):
  - Liste: Basis vs. Custom klar getrennt; Basis-Zeilen zeigen „System" und haben **deaktivierten Slug + kein Löschen
    **.
  - Create/Edit-Dialog: Name DE required + EN optional (beide sichtbar), Slug (nur bei Anlage editierbar; bei Edit
    deaktiviert), **Hex-Colorpicker**, Icon-Picker, sortOrder.
  - Delete-Confirm nur für Custom mit Hinweis „Leads mit diesem Status werden auf ‚Zu prüfen' gesetzt".
  - react-hook-form + zod (spiegelt Server); `dialog-focus-trap.ts` wiederverwenden; sinnvoll in Sub-Komponenten
    schneiden (Form, Icon-Picker, Color-Picker, Listenzeile).
- **Edit-State über URL** (AGENTS-Regel #4): `?edit=<id>` der Settings-Route.
- Optionaler Link „Status verwalten" aus der LeadsToolbar zur Settings-Route.

### 7. Anzeige-Refactor (Badge) + Write-Validierung umstellen

- `shared/lead-status-badge/lead-status-badge.tsx`: **`STATUS_CONFIG` entfernen**; Props `iconKey` + `color` (Hex) +
  `label`. Icon-Auflösung über neue Status-Icon-Registry (`Record<LeadStatusIconKey, IconDefinition>` in der
  UI-Schicht);
  Akzentfarbe via `color-mix(in srgb, <color> X%, <surface>)`. Fallback für unbekannte Slugs.
- **Write-Validierung** überall von `z.enum(CONTACT_LEAD_STATUS_VALUES)` auf „Slug ∈ aktive Status-Slugs (DB)"
  umstellen:
  - betroffen: `lead-form-dialog.schema.ts`, `services/update-lead/update-lead.schema.ts`,
    `services/lead-filter/lead-filter.schema.ts`, `services/bulk-action.schema.ts`, `shared/lead-schema.ts`,
    `shared/create-lead-core.ts`.
  - Ansatz: kleiner Server-Helper `getActiveStatusSlugs()` (cached pro Request) + `superRefine`/Membership-Check an
    der
    Route-/Command-Grenze; die statischen `z.enum`-Stellen werden zu `z.string()` + Membership-Validierung.
  - Filter (`?status=`) akzeptiert künftig zusätzlich Custom-Slugs (plus `all`).

### 8. Messaging/Dashboard — unverändert (nur absichern)

- `MESSAGING_STAGE_ORDER` referenziert weiterhin **immutable Basis-Slugs**; die Aggregation ordnet nur bekannte
  System-Status einer Messaging-Stufe zu. Custom-Status bleiben ohne explizite Zuordnung außerhalb der Auswertung.
- Mapper-Test ergänzen/aktualisieren: Unbekannte Custom-Slugs verändern keine Messaging-Stufe.

### 9. Import

- `lead-import-status-synonyms.ts` (Basis-Synonyme) **bleibt** für die System-Status.
- `lead-import-field-validation-service.ts`: Auflösung erweitern — zuerst Basis-Synonym-Map, sonst Match gegen
  **aktive DB-Status** (Slug oder lokalisierter Name), sonst Fallback `pending_review` (bestehendes Verhalten).
- Import-Doku nachziehen.

### 10. i18n + Doku

- `i18n/dictionaries/workspace/settings/statuses/{de,en}.json` + Loader: Seiten-/Dialog-Titel, Feld-Labels,
  Sprachgruppen, Fallback-Hinweis, Buttons, Lösch-Bestätigung (inkl. „→ Zu prüfen"-Hinweis), Validierungs-/Toast-Texte.
- `shared/{de,en}.json` `status`-Block: bleibt vorerst als Seed-Quelle; nach dem Anzeige-Refactor (Badge liest aus DB)
  entfernen, sobald keine Komponente mehr `sharedContent.status[...]` nutzt.
- **Leads-UI-`AGENTS.md` Regel #9 anpassen:** dynamische Status-Labels sind Daten (`lead_status_localizations`).

### 11. Tests + Gates (DoD)

- **Unit:** Create/Update/Delete-Command (System-Lock → `SystemStatusImmutable`, Slug-Unique, Slug nicht änderbar bei
  Update, Delete-Custom → betroffene Leads auf `pending_review`); Validierungs-Schemas inkl. Hex; Status-Mapper; beide
  Status-Query-Handler; Locale-Fallback `en → de`.
- **Write-Validierung:** Tests, dass Lead-Create/Update/Bulk/Filter Custom-Slugs akzeptieren und unbekannte Slugs
  ablehnen.
- **Bestehende Tests anpassen:** viele Lead-/Dashboard-Tests setzen die feste 14er-Stringliste bzw. `z.enum` voraus →
  auf
  DB-/Seed-getriebene Validierung umstellen.
- **Funnel:** Basis-Status korrekt gezählt, Custom-Status nicht.
- **Component:** jsdom-Test für die Settings-Verwaltungskomponente (System-Lock sichtbar, Slug-Deaktivierung,
  Color/Icon-Auswahl, Delete-Hinweis).
- **E2E (`e2e/`):** Custom-Status anlegen → an Lead speichern → erscheint in Liste/Filter, **nicht** im Funnel;
  löschen →
  Lead steht auf `pending_review`. Basis-Status: Label/Farbe ändern wirkt überall, Löschen ist gesperrt.

---

## Kritische Dateien (Referenz)

- DB: `packages/db/src/record-configuration/lead-statuses.ts`, `lead-status-localizations.ts`, `leads.ts`,
  zugehörige Migration + `scripts/run-migrations.ts`
- Konstanten/Contracts: `packages/common/src/constants/contact/contact-lead-statuses.ts`,
  `constants/leads/statuses/*`, `contracts/leads/lead-status*.dto.ts`, `contracts/leads/results/*-lead-status-result.ts`
- Server: `apps/workspace/src/server/workspace/leads/query-handler/list-lead-statuses*.query-handler.ts`,
  `command-handler/{create,update,delete}-lead-status.command-handler.ts`,
  `services/lead-status/lead-status-mapping-service.ts`, Write-Schemas (`lead-form-dialog.schema.ts`,
  `update-lead.schema.ts`, `lead-filter.schema.ts`, `bulk-action.schema.ts`, `shared/lead-schema.ts`,
  `shared/create-lead-core.ts`)
- API/UI: `apps/workspace/src/app/api/workspace/statuses/{route.ts,[id]/route.ts}`,
  `src/lib/workspace/leads/lead-status-api-error.ts`,
  `src/app/[locale]/(app)/settings/statuses/page.tsx`, `components/workspace/settings/statuses/...`,
  `components/workspace/shared/lead-status-badge/lead-status-badge.tsx`
- Messaging/Import: `common/constants/dashboard/messaging-stage-order.ts`,
  `server/workspace/dashboard/services/messaging-conversion/messaging-conversion-mapping-service.ts`,
  `services/import/lead-import-field-validation-service.ts`,
  `packages/common/src/constants/leads/import/status/lead-import-status-synonyms.ts`
- Regeln: `apps/workspace/src/app/[locale]/(app)/leads/AGENTS.md` (Regel #9), `apps/workspace/src/server/AGENTS.md`

## Verifikation

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build:workspace` grün.
- Migration generieren + anwenden (`run-migrations`); Seed der 14 Basis-Status prüfen; alte Leads behalten ihren Slug.
- Workspace-Dev: `(app)/settings/statuses` → Basis-Status sind gelockt (kein Löschen, Slug fix), Label/Farbe/Icon
  editierbar; Custom-Status anlegen → an Lead speichern → in Liste/Filter sichtbar; Badge zeigt Hex-Farbe + Icon in
  **Dark und Light**; Custom löschen → betroffener Lead steht auf `pending_review`; Dashboard-Funnel zählt nur
  Basis-Status; Import mit Custom-Slug/Name löst auf, sonst Fallback `pending_review`.
- A11y-Smoke des Dialogs (Fokus-Trap, Escape, Keyboard).

## Nicht-Ziele

- **Kein** FK/UUID-Umbau von `leads.lead_status` (Slug bleibt Identifier).
- Kein Slug-Rename für bestehende Status (kein Cascade-Update der Leads in v1).
- Keine konfigurierbare Funnel-Rolle für Custom-Status (Custom bleiben außerhalb des Funnels).
- Keine Änderung am Auth-/Allowlist-Modell.
- Keine Erweiterung über DE/EN hinaus (Struktur bleibt locale-erweiterbar).
