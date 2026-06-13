# Plan: Lead-Kategorieverwaltung (CRUD) im Workspace

## Context

Im Workspace-Leads-Bereich sollen Kategorien über eine Oberfläche **angelegt, bearbeitet und gelöscht** werden können.
Aktuell ist das Datenmodell teilweise schon dynamisch (Tabelle `lead_categories`, FK `leads.category_id`, dynamischer
Filter + Form-Dropdown, Import löst per Slug auf), aber zentrale Stellen sind hardcoded oder statisch:

- **Labels** kommen aus statischen i18n-Dictionaries (`shared/{de,en}.json`, Schlüssel = `label_key`). Eine zur Laufzeit
  angelegte Kategorie hätte keinen Dictionary-Eintrag → Name würde nicht sauber gerendert.
- **Icon + Farbe** des Badges sind in `lead-category-badge.tsx` (`CATEGORY_CONFIG`) pro Slug hardcoded.
- Es existieren **keine** Create/Update/Delete-Handler, keine API-Routen und kein Verwaltungs-UI.
- Der **Import** identifiziert Kategorien noch über zwei Wege (Slug **oder** `category_id`).

Ziel: vollwertige Kategorieverwaltung mit dynamischen Labels (mehrsprachig), wählbarem Icon und **frei wählbarer Farbe
(Hex)**, dynamischem Filter und einem **slug-only** Import. Pro Operation ein eigener Command-Handler plus ein
Query-Handler für „get".

### Getroffene Entscheidungen

| Thema                 | Entscheidung                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Labels / i18n         | **Separate Localizations-Tabelle** `lead_category_localizations` (locale + label); Deutsch (`de`) required, Englisch (`en`) optional mit `de`-Fallback; Auflösung aus der DB |
| Icon & Farbe          | **Im Dialog wählbar**; Icon-Key + **freier Hex-Farbcode** auf der Kategorie-Zeile gespeichert (kuratierte Icon-Allowlist). Rendering der Farbe adaptiv via `color-mix`       |
| Farb-Rendering        | Gespeichert wird der rohe Hex; im UI über `color-mix(in srgb, <hex> X%, <surface>)` mit Theme-Surface gemischt, damit Kontrast in **Dark- und Light-Mode** brauchbar bleibt  |
| Löschen               | **Hard-Delete** (Zeile entfernen; Localizations cascaden; `leads.category_id` → null via bestehendem FK SET NULL)                                                            |
| Verwaltungs-UI        | **Eigene Settings-Route** `apps/workspace/src/app/[locale]/(app)/settings/categories/...`; Auth erbt aus dem `(app)`-Layout                                                  |
| Import-Identifikation | **Nur Slug** (`category_id`-Pfad aus Import entfernen)                                                                                                                       |
| Slug-Handhabung       | **Immer manuell** eingeben; bei Update standardmäßig gesperrt und nur über bewussten Schalter „Slug bearbeiten" aktivierbar                                                  |
| Berechtigung          | **Wie bestehende Lead-CRUD** (Workspace-Zugang über `(app)`-Layout; kein neues Rollen-Gate)                                                                                  |
| AGENTS-Regel #9       | **Anpassen** — Ausnahme für nutzergepflegte, dynamische Kategorie-Labels (Daten aus DB), statische Enum-Labels bleiben dictionary-basiert                                    |
| Aktiv/Inaktiv         | **`is_active` entfernen**; es gibt aktuell keinen klaren Use Case neben Hard-Delete und bestehender FK-Nullsetzung                                                           |

---

## Architektur-Überblick

Datenfluss (Anzeige): `lead_categories` (+ `lead_category_localizations`) → Query-Handler (locale-aufgelöst) → DTO
`{ id, slug, label, icon, color }` → Page → Toolbar/Filter, Tabelle/Badge, Form-Dropdown, Detail-Panel.

Datenfluss (Verwaltung): Settings-Route `(app)/settings/categories` (Edit-Ziel via Query-Param, z. B. `?edit=<id>`) →
Client-Service → API-Routen → Command-Handler → DB (Transaktion: Kategorie-Zeile + Localization-Zeilen).

### Locale-Resolution-Pattern für dynamische Stammdaten

Dieses Vorhaben führt ein generisches Pattern ein, das später für ähnliche dynamische Stammdaten wiederverwendet wird:

- **Storage:** Stammdaten-Zeile enthält technische Felder (`id`, `slug`, Icon/Farbe, Sortierung). Sichtbare Labels
  liegen
  in einer separaten `<entity>_localizations`-Tabelle mit `entity_id`, `locale`, `label`.
- **Default-Locale:** Deutsch (`de`) ist required und dient als Fallback. Englisch (`en`) soll gepflegt werden, ist aber
  nicht blockierend.
- **Display-DTO:** Anzeige-Queries geben immer ein bereits aufgelöstes `label` zurück. Fehlt die angeforderte Locale,
  fällt der Query-Handler auf `de` zurück; die Zeile wird nicht durch einen Inner Join versteckt.
- **Admin-DTO:** Verwaltungs-Queries geben alle vorhandenen Localizations zurück, damit der Dialog fehlende
  Übersetzungen sichtbar machen kann.
- **Dialog-UX:** Der Verwaltungsdialog zeigt die Sprachfelder für Deutsch und Englisch immer sichtbar an. Deutsch ist
  Pflicht, Englisch ist optional, aber aktiv pflegbar; fehlt Englisch, zeigt der Dialog klar den Fallback-Status auf
  Deutsch statt das Feld zu verstecken.
- **Locale-Quelle:** SSR-Routen reichen die Route-Locale explizit an Query-Handler weiter. Locale-neutrale API-Routen
  akzeptieren optional `?locale=<locale>` und validieren gegen `Locale`/`SUPPORTED_LOCALES` aus
  `packages/common/src/contracts/i18n/locale.ts`; ohne Parameter wird `de` verwendet.
- **Wiederverwendung:** Die Auflösung wird als kleiner Server-Helper modelliert, z. B.
  `resolveLocalizedLabel(localizations, locale, Locale.De)`, statt pro Query ad hoc Fallback-Logik zu schreiben.

---

## Umsetzungsschritte (kleine, reviewbare PRs)

### 1. Datenmodell + Migration + Seed — `packages/db`

- `record-configuration/lead-categories.ts`: Spalten **`icon text not null`** (Check: non-empty) und
  **`color text not null`** (Check: Hex-Pattern `^#[0-9a-fA-F]{6}$`) ergänzen. `label_key` bleibt in der ersten
  Migration noch bestehen, damit der App-Refactor schrittweise erfolgen kann.
- Neue Datei `record-configuration/lead-category-localizations.ts`:
  - `id uuid pk`, `category_id uuid` FK → `lead_categories.id` **ON DELETE CASCADE**, `locale text`,
    `label text not null` (Check non-empty), `created_at`/`updated_at`.
  - `uniqueIndex` auf `(category_id, locale)`.
- Migration 1 generieren: Spalten + neue Tabelle anlegen, bestehende 7 Zeilen backfillen (icon aus heutigem
  `CATEGORY_CONFIG`, **Farbe als Hex** aus den heutigen Tone-Tokens abgeleitet, Localizations aus heutigem
  `shared/{de,en}.json`).
- Erst nach App-Refactor und grünen Tests Migration 2 generieren: `label_key` und `is_active` droppen.
- `packages/db/scripts/seed-leads-fixture.ts`: `CATEGORY_FIXTURES` um `icon`, `color` (Hex),
  `localizations: { de: string; en?: string }` erweitern, `labelKey` und `isActive` entfernen.

### 2. Konstanten + Contracts — `packages/common`

- `constants/leads/categories/lead-category-error-codes.ts`: `LeadCategoryErrorCode` (`ValidationError`, `NotFound`,
  `SlugExists`, `Internal`) + `_VALUES`-Array (Const-Objekt-Pattern, PascalCase-Keys) + Konstanten-Test.
- `constants/leads/categories/lead-category-icons.ts`: `LeadCategoryIconKey` (kuratierte Allowlist, z. B.
  `ChalkboardUser`, `UserTie`, `Hammer`, `LocationDot`, `Briefcase`, `Camera`, `CircleQuestion`, `LayerGroup` …) +
  `_VALUES`-Array. **Nur String-Keys** (kein FontAwesome-Runtime hier).
- Farb-Validierung: kleiner Hex-Pattern-Helper (z. B. `patterns/leads/is-hex-color.ts`) + Test; kein `LeadBadgeTone`
  mehr für Kategorien.
- Contracts (camelCase):
  - `contracts/leads/lead-category.dto.ts` **ändern**: `{ id, slug, label, icon, color }` (statt `labelKey`).
  - `contracts/leads/lead-category-option.ts` an dieselbe Form angleichen (oder zugunsten des DTO konsolidieren).
  - `contracts/leads/lead-category-admin.dto.ts` **neu**:
    `{ id, slug, icon, color, sortOrder, localizations: { de: string; en?: string } }` (für den Verwaltungsdialog). Der
    Typ nutzt `Locale`/`SUPPORTED_LOCALES` aus `packages/common/src/contracts/i18n/locale.ts`; keinen neuen
    `SupportedLocale`-Paralleltyp einführen.
  - `contracts/leads/create-lead-category-request.dto.ts`:
    `{ slug, icon, color, sortOrder, localizations: { de: string; en?: string } }`.
  - `contracts/leads/update-lead-category-request.dto.ts`:
    `{ slug, slugChangeConfirmed?: boolean, icon, color, sortOrder, localizations: { de: string; en?: string } }`.
  - `contracts/leads/results/{create,update,delete}-lead-category-result.ts`:
    `{ ok: true, … } | { ok: false, code, errors? }`.
  - `contracts/leads/rows/lead-category-row.ts` **ändern**: `category_label_key` → `category_label`, plus
    `category_icon`, `category_color` (für den locale-aufgelösten Join in Lead-Queries).

### 3. Query-Handler + Mapper — `apps/workspace/src/server/workspace/leads`

- `query-handler/list-lead-categories.query-handler.ts` **ändern**: `getLeadCategories(locale)` → join
  `lead_category_localizations` für angeforderte Locale plus `de`-Fallback, Rückgabe
  `LeadCategoryDto { id, slug, label, icon, color }`, sortiert nach `sort_order`.
- `query-handler/list-lead-categories-admin.query-handler.ts` **neu**: `getLeadCategoriesForManagement()` →
  `LeadCategoryAdminDto[]` (alle vorhandenen Localizations je Kategorie, icon/color/sortOrder). Das ist der „get"
  -Query-Handler für den Dialog.
- `services/lead-category/lead-category-mapping-service.ts` **ändern**: Row (`category_label`/`category_icon`/
  `category_color`) → `LeadCategoryDto`. Plus neuer Admin-Mapper (Localization-Zeilen → `{ de: string; en?: string }`).
  Mapper-Tests entsprechend aktualisieren/ergänzen (AGENTS-Pflicht).
- **Lead-Anzeige locale-aware machen:** `listLeads`/`getLeadById` erhalten einen `locale`-Parameter und joinen
  Localizations mit `de`-Fallback, damit jeder Lead `category: { id, slug, label, icon, color } | null` trägt (Tabelle,
  Badge, Detail-Panel). SSR-Aufrufer (`page.tsx`) reichen die Route-Locale durch. Locale-neutrale API-Aufrufer
  validieren optional `?locale=<locale>` und fallen ohne Parameter auf `de` zurück.

### 4. Command-Handler + Validierung — `apps/workspace/src/server/workspace/leads`

- `command-handler/create-lead-category.command-handler.ts`: validieren → Transaktion (Kategorie-Zeile +
  Localization-Zeilen). Unique-Slug-Verletzung → `SlugExists`.
- `command-handler/update-lead-category.command-handler.ts`: `NotFound` falls fehlend; Zeile updaten + Localizations
  upserten; Slug editierbar nur, wenn `slugChangeConfirmed === true`; sonst `ValidationError`. Unique-Slug-Verletzung →
  `SlugExists`.
- `command-handler/delete-lead-category.command-handler.ts`: Hard-Delete; `NotFound` falls fehlend.
- `services/create-lead-category/…-validation-service.ts` + `…schema.ts` (zod): `slug` (required, Pattern),
  `localizations.de` required, `localizations.en` optional aber bei Angabe non-empty,
  `icon ∈ LEAD_CATEGORY_ICON_KEY_VALUES`, `color` gültiger Hex (`#rrggbb`), `sortOrder ≥ 0`. Analog Update-Schema plus
  `slugChangeConfirmed`.
- Muster spiegeln: `create-lead.command-handler.ts:14-48`, `delete-lead.command-handler.ts`.

### 5. API-Routen — `apps/workspace/src/app/api/workspace/categories`

- `route.ts`: `GET` (Management-Liste via `getLeadCategoriesForManagement`) + `POST` (create). `withWorkspaceApiAuth` (
  gleiche Berechtigung wie Lead-CRUD).
- `[id]/route.ts`: `PATCH` (update) + `DELETE` (delete).
- `src/lib/workspace/leads/lead-category-api-error.ts`: `LeadCategoryErrorCode` → Message-Map (co-located `*-error.ts`,
  Map nicht exportiert).
- `api/workspace/categories/README.md`: Contract dokumentieren (analog Leads-README).
- Muster spiegeln: `api/workspace/leads/route.ts`, `api/workspace/leads/[id]/route.ts`, `lead-api-error.ts`.

### 6. Settings-Route + Verwaltungs-UI + Client-Service

- `src/app/[locale]/(app)/settings/categories/page.tsx` (dünn): lädt `getLeadCategoriesForManagement()`, rendert die
  Verwaltungskomponente; `metadata.robots = { index:false, follow:false }`, `dynamic = "force-dynamic"`.
- `src/client/leads/lead-categories-service.ts`: fetch-Wrapper list/create/update/delete (analog `leadsService`); nach
  Erfolg `router.refresh()` durch Aufrufer.
- `src/components/workspace/settings/categories/...` (eigene Ordner, `*.module.css`):
  - Liste der Kategorien (Badge-Vorschau mit Icon + Hex-Farbe) + Create/Edit-Dialog (Name DE required, Name EN optional,
    beide Sprachfelder immer sichtbar und editierbar, manueller Slug, Icon-Picker, **Hex-Colorpicker**, sortOrder),
    Löschen mit Bestätigung.
  - Sprachbereich mit klarer Feldgruppe: Deutsch als Pflicht-/Fallback-Sprache, Englisch als optionale Übersetzung mit
    Hinweis, dass bei leerem EN-Feld der deutsche Name angezeigt wird.
  - Bei Bearbeitung ist das Slug-Feld deaktiviert. Ein Schalter „Slug bearbeiten" aktiviert es bewusst; bei Änderung
    sendet der Client `slugChangeConfirmed: true` und zeigt eine kurze Warnung, dass alte CSVs/Workflows mit dem
    bisherigen Slug nicht mehr passen.
  - react-hook-form + zod (Client-Schema spiegelt Server); `dialog-focus-trap.ts` wiederverwenden; Muster
    `lead-form-dialog.tsx`.
  - Sinnvoll in Sub-Komponenten schneiden (Form, Icon-Picker, Color-Picker, Listenzeile), Dateien klein halten.
- **Edit-State über URL** (AGENTS-Regel #4): Edit-Ziel via Query-Param der Settings-Route (z. B. `?edit=<id>`), kein
  globaler Store.
- Optionaler Link „Kategorien verwalten" aus der LeadsToolbar (`leads-toolbar.tsx`) zur Settings-Route — kein eigener
  Dialog mehr in der Toolbar.

### 7. Anzeige-Refactor (Badge/Tabelle/Detail) + Hardcoding entfernen

- `shared/lead-category-badge/lead-category-badge.tsx`: **`CATEGORY_CONFIG` entfernen**; Props `iconKey` + `color` (Hex)
  - `label`. Icon-Auflösung über neue Registry; **Akzentfarbe via `color-mix(in srgb, <color> X%, <surface>)`** statt
    Tone-Token, damit Dark/Light stimmt.
- `shared/lead-category-badge/lead-category-icon-registry.ts` **neu**: `Record<LeadCategoryIconKey, IconDefinition>` (
  FontAwesome-Imports liegen hier in der UI-Schicht).
- `table/leads-table-row/…`: Dictionary-Label-Auflösung entfernen; `lead.category.{label,icon,color}` direkt nutzen.
  Detail-Panel analog.
- `page.tsx`: `getLeadCategories(locale)` nutzen, `sharedContent.category[labelKey]`-Mapping-Block (Zeilen 166-175)
  entfernen; `locale` an `listLeads`/`getLeadById` durchreichen.
- `api/workspace/leads/route.ts`: optionalen `locale`-Query-Parameter für GET validieren und an `listLeads`
  durchreichen; ohne gültigen Parameter mit `ValidationError`, ohne Parameter mit `Locale.De`.

### 8. Import auf slug-only umstellen

- `services/import/lead-import-validation-service.ts`: `category_id` aus Schema + Validierung entfernen; nur
  `category` (Slug) behalten.
- `import-leads.command-handler.ts:157-175`: Kategorie-Auflösung auf reines Slug-Lookup vereinfachen (`category_id ??`
  -Zweig entfernen); `UnknownCategory`-Fehler beibehalten.
- Contract `import/validation/lead-import-valid-row.ts`: `category_id` entfernen. `LeadImportColumnKey.CategoryId` +
  zugehörige `validateImportOptionalUuid`-Nutzung entfernen; CSV-Mapping prüfen.
- Issue-Code `UnknownCategoryId` ggf. zu `UnknownCategorySlug` umbenennen (inkl. Import-Dictionary). Optional, aber
  sauberer.

### 9. i18n + Doku

- `i18n/dictionaries/workspace/settings/categories/{de,en}.json` + Loader: Seiten-/Dialog-Titel, Feld-Labels,
  Sprachgruppen-Labels, Fallback-Hinweis für fehlende EN-Übersetzung, Buttons, Lösch-Bestätigung,
  Validierungs-/Toast-Texte, Warntext für Slug-Änderung.
- `shared/{de,en}.json`: `category`-Block entfernen (Labels jetzt aus DB) — im selben Commit wie der Anzeige-Refactor.
- **Leads-UI-`AGENTS.md` Regel #9 anpassen:** Ausnahme dokumentieren — nutzergepflegte dynamische Kategorie-Labels sind
  Daten und liegen in `lead_category_localizations` (`de` required, andere Locales optional mit Fallback); statische
  Enum-Labels (Status [bis zur Status-Verwaltung], Source, Activity, Plattform) bleiben dictionary-basiert.

### 10. Tests + Gates (DoD)

- **Unit:** Create/Update/Delete-Command-Handler (Slug-Uniqueness, NotFound, Validierung, Localization-Upsert,
  Slug-Änderung nur mit `slugChangeConfirmed`); Validierungs-Schemas inkl. Hex-Validierung; aktualisierter
  Category-Mapper; beide Category-Query-Handler; Locale-Fallback `en → de`.
- **Bestehende Tests anpassen:** `list-leads`, `get-lead-by-id`, Category-Mapper, Import-Validation/-Command (
  category_id-Pfad raus), Bulk-Edit — auf neue Felder (`label`/`icon`/`color`, kein `label_key`).
- **Component:** jsdom-Test für die Settings-Verwaltungskomponente (Create/Edit/Delete, beide Locale-Felder sichtbar und
  pflegbar, DE required, EN optional mit Fallback-Hinweis, Icon/Color-Auswahl).
- **E2E (`e2e/`):** Kategorie verwalten (anlegen → erscheint in Filter + Form-Dropdown → bearbeiten → löschen);
  Import-by-Slug-Smoke mit dynamischer Kategorie inkl. Unknown-Slug-Fehler.

---

## Kritische Dateien (Referenz)

- DB: `packages/db/src/record-configuration/lead-categories.ts`, `lead-category-localizations.ts`, `leads.ts`,
  `packages/db/scripts/seed-leads-fixture.ts:79-95`
- Query/Command/Import: `apps/workspace/src/server/workspace/leads/query-handler/list-lead-categories.query-handler.ts`,
  `command-handler/{create,delete}-lead.command-handler.ts`, `command-handler/import-leads.command-handler.ts:113-175`,
  `services/import/lead-import-validation-service.ts:58-77,154-228`,
  `services/lead-category/lead-category-mapping-service.ts`
- API: `apps/workspace/src/app/api/workspace/leads/route.ts`, `leads/[id]/route.ts`, `categories/route.ts`,
  `categories/[id]/route.ts`, `src/lib/workspace/leads/lead-api-error.ts`,
  `src/lib/workspace/leads/lead-category-api-error.ts`
- UI: `apps/workspace/src/app/[locale]/(app)/settings/categories/page.tsx`,
  `apps/workspace/src/app/[locale]/(app)/leads/page.tsx:126,166-175`,
  `components/workspace/leads/shared/lead-category-badge/lead-category-badge.tsx:25-66`,
  `components/workspace/settings/categories/...`, `lead-form-dialog.tsx`, `shared/dialog-focus-trap.ts`
- i18n: `apps/workspace/src/i18n/dictionaries/workspace/leads/shared/{de,en}.json:19-27`,
  `apps/workspace/src/i18n/dictionaries/workspace/settings/categories/{de,en}.json`, `index.ts`
- Regeln: `apps/workspace/src/app/[locale]/(app)/leads/AGENTS.md` (Regel #9), `apps/workspace/src/server/AGENTS.md`,
  `packages/common/AGENTS.md`

## Verifikation

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build:workspace` grün.
- DB-Migration 1 generieren + anwenden; Seed prüfen; App-Refactor verifizieren; erst danach Drop-Migration für
  `label_key`/`is_active` generieren.
- Workspace-Dev starten: `(app)/settings/categories` öffnen → CRUD durchspielen → Lead-Filter + Form-Dropdown
  aktualisieren sich dynamisch → Badge zeigt gewähltes Icon und Hex-Farbe (in **Dark und Light** geprüft) → EN ohne
  Übersetzung fällt auf DE zurück → Slug-Änderung erst nach aktivem Schalter möglich → Import-CSV mit `category`
  -Slug-Spalte löst auf, unbekannter Slug erzeugt Zeilenfehler.
- A11y-Smoke des Dialogs (Fokus-Trap, Escape, Keyboard).

## Nicht-Ziele

- Keine Änderung am Auth-/Allowlist-Modell (kein neues Rollen-Gate).
- Keine Bulk-Reassignment-UI beim Löschen (Hard-Delete setzt `category_id` auf null).
- Keine Aktiv/Inaktiv-Archivierung für Kategorien; nicht mehr benötigte Kategorien werden gelöscht.
- Keine Erweiterung über DE/EN hinaus in diesem Vorhaben (Struktur bleibt aber locale-erweiterbar).
