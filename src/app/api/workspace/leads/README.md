# Workspace Leads API

JSON-API für die Workspace-Leads-UI unter `/[locale]/workspace/leads`. Server-only, Clerk-authentifiziert, allowlist-gated.

> **Quelle der Wahrheit für den Contract:** dieses Dokument. Bei Änderungen an Endpunkten, Statuscodes oder Bodies wird diese Datei im selben Commit aktualisiert.

## Auth

Jeder Handler ist mit `withWorkspaceApiAuth(handler)` aus `src/lib/auth/api.ts` gewrappt:

1. Clerk `auth()` → kein `userId` ⇒ `401 UNAUTHORIZED`.
2. `currentUser()` → primäre E-Mail (lowercase, trim).
3. `isEmailAllowed(email)` aus `src/lib/auth/allowlist.ts` → `false` ⇒ `404 NOT_FOUND`.

Allowlist via ENV `WORKSPACE_ALLOWED_EMAILS` (Komma-getrennt). API-Antworten sind ausschließlich JSON, niemals Redirects oder HTML.

## Fehlerformat

```json
{ "error": "<MACHINE_CODE>", "message": "<human-readable>", "details": <optional> }
```

| Status | `error`-Code          | Bedeutung                                              |
| ------ | --------------------- | ------------------------------------------------------ |
| 400    | `VALIDATION_ERROR`    | Zod-Validation. `details` enthält Feld-Pfade           |
| 401    | `UNAUTHORIZED`        | Kein Clerk-User                                        |
| 404    | `NOT_FOUND`           | Lead existiert nicht **oder** User nicht auf Allowlist |
| 409    | `EMAIL_EXISTS`        | Duplicate Email beim Create oder Update                |
| 409    | `COMPANY_NAME_EXISTS` | Duplicate company name beim Create oder Update         |
| 500    | `INTERNAL`            | Unerwarteter Fehler. Stacktrace nur im Server-Log      |

`message` ist auf Englisch, knapp, ohne PII. `details` enthält keine E-Mails, Telefonnummern oder Lead-Inhalte.

---

## `GET /api/workspace/leads`

Listet Leads gefiltert, sortiert und paginiert.

### Query-Params

| Param       | Typ                                                                                                        | Default        | Notiz                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| `status`    | `'all' \| 'new' \| 'contacted' \| 'qualified' \| 'proposal' \| 'on_hold' \| 'won' \| 'lost' \| 'archived'` | —              | Standard schließt `archived` aus, wenn nicht explizit gesetzt                             |
| `source`    | `'webform' \| 'manual' \| 'import'`                                                                        | —              |                                                                                           |
| `category`  | `string` (UUID aus `lead_categories.id`)                                                                   | —              | Slugs werden aktuell nicht akzeptiert                                                     |
| `search`    | `string`                                                                                                   | —              | Free-Text auf `display_name`, `email`, `first_name`, `last_name`, `company_name`, `owner` |
| `score_min` | `number` (0-100)                                                                                           | —              |                                                                                           |
| `date_from` | `string`                                                                                                   | —              | Inklusive `created_at >= date_from`                                                       |
| `date_to`   | `string`                                                                                                   | —              | Inklusive `created_at <= date_to`                                                         |
| `page`      | `number`                                                                                                   | `1`            | 1-basiert                                                                                 |
| `sort`      | `'created_desc' \| 'score_asc' \| 'score_desc' \| 'name_asc' \| 'name_desc'`                               | `created_desc` |                                                                                           |

### Response `200`

```json
{
  "rows": [LeadSummaryDto, ...],
  "total": 137,
  "page": 1,
  "perPage": 25
}
```

`LeadSummaryDto` → `packages/common/src/contracts/leads/lead-summary.dto.ts`.

Kategorien liefern stabile technische Werte aus `lead_categories`: `id`, `slug` und `label_key`. Die API gibt keine
lokalisierten Kategorie-Labels aus; die Workspace-UI löst `label_key` locale-spezifisch über Dictionaries auf.
`label_key` bleibt slug-kompatibel und ist ein stabiler Lookup-Key, kein sichtbarer Label-Text.

### Fehler

- `400 VALIDATION_ERROR` bei ungültigen Query-Param-Werten.

---

## `POST /api/workspace/leads`

Legt einen Lead manuell an. Server setzt explizit `source='manual'` und `lead_status='new'`. Activity-Eintrag (`type='note'`) wird im selben Transaktions-Schritt erzeugt.

Der Request-Body ist das Shared DTO `CreateLeadRequestDto` aus
`packages/common/src/contracts/leads/create-lead-request.dto.ts`.
`FormValues` aus der UI werden vor dem `fetch` dorthin gemappt; serverintern bleibt Persistenz-Input ein eigener,
separater
Layer.

### Body — `CreateLeadRequestDto`

```jsonc
{
  "displayName": "string",             // pflichtig
  "first_name": "string",
  "last_name": "string",
  "company_name": "string",            // optional, wenn gesetzt eindeutig
  "email": "string (E-Mail-Format)",   // optional, wenn gesetzt eindeutig
  "phone": "string",
  "website_url": "string (URL)",
  "category_id": "uuid",
  "score": "number 0..100",
  "owner": "string",
  "notes": "string",
  "improvements": ["string", ...],
  "social_profiles": [
    { "platform": "linkedin" | "instagram" | "youtube", "profile_url": "string (URL)" }
  ]
}
```

Alle Felder außer `displayName` sind optional und werden von der UI nur bei vorhandenem Wert gesendet. Der Request
akzeptiert
keine serverinternen Persistenz-Shapes. Beim PATCH gilt die Semantik:

- `undefined` = keine Änderung
- `null` = Feld leeren
- `[]` = alle Listen-Einträge entfernen

`email` ist optional. Leere Eingaben werden clientseitig verhindert und serverseitig als `null` gespeichert.

`source` wird **nicht** vom Client gesetzt; der Server erzwingt `manual`.
Neue Persistenz-Records verwenden application-owned IDs: Server-Code setzt `id` explizit per `crypto.randomUUID()`;
DB-Defaults für neue Workspace-Leads-Tabellen sind im finalen Schema nicht vorgesehen. `0003` bleibt als bereits
angewendete Seed-Migration unverändert; `0007` entfernt die dort benötigten Defaults nachträglich.

### Response `201`

```json
{ "lead": LeadDetailDto }
```

`LeadDetailDto` → `packages/common/src/contracts/leads/lead-detail.dto.ts`.

### Fehler

- `400 VALIDATION_ERROR` — Zod-Fehler.
- `409 EMAIL_EXISTS` — bestehender Lead mit gleicher E-Mail (unique über `leads_email_lower_uidx`).
- `409 COMPANY_NAME_EXISTS` — bestehender Lead mit gleichem Firmennamen (unique über `leads_company_name_lower_uidx`).

---

## `GET /api/workspace/leads/[id]`

Lädt Lead inklusive Kategorie, Social-Profile, Activities (sortiert `occurred_at DESC`) und verknüpfte `lead_submissions`.

### Response `200`

```json
{ "lead": LeadDetailDto }
```

### Fehler

- `404 NOT_FOUND` — Lead existiert nicht.

---

## `PATCH /api/workspace/leads/[id]`

Aktualisiert Lead-Stammdaten, Status, Notes, Improvements und/oder Social-Profile. Setzt `updated_at` explizit. Bei Status-Änderung wird ein Activity-Eintrag (`type='status_change'`) erzeugt. Social-Profile werden per Replace-Set in derselben Transaktion synchronisiert.

### Body — Update-Input

Alle Felder optional. Erlaubte Keys: gleiche schreibbare Felder wie beim `CreateLeadRequestDto`, zusätzlich
`lead_status`. `source` ist im PATCH **nicht** veränderbar; `email` ist veränderbar und kollidierende E-Mails liefern
`409 EMAIL_EXISTS`.

```jsonc
{
  "displayName": "string",
  "first_name": "string | null",
  "last_name": "string | null",
  "company_name": "string | null",
  "phone": "string | null",
  "website_url": "string (URL) | null",
  "category_id": "uuid | null",
  "score": "number 0..100 | null",
  "lead_status": "new | contacted | qualified | proposal | on_hold | won | lost | archived",
  "owner": "string | null",
  "notes": "string | null",
  "improvements": ["string", ...],
  "social_profiles": [
    { "platform": "linkedin" | "instagram" | "youtube", "profile_url": "string (URL)" }
  ]
}
```

Leere Listen werden als Lösch-Intent interpretiert. Wenn der Client keine Änderung senden möchte, lässt er das Feld
weg.

### Response `200`

```json
{ "lead": LeadDetailDto }
```

### Fehler

- `400 VALIDATION_ERROR`, `404 NOT_FOUND`, `409 EMAIL_EXISTS`, `409 COMPANY_NAME_EXISTS`.

---

## `DELETE /api/workspace/leads/[id]`

Soft-Delete: setzt `lead_status='archived'` und `updated_at`. Keine Zeile wird physisch gelöscht. Activity-Eintrag (`type='status_change'` mit `next_status='archived'`) wird erzeugt.

### Response `200`

```json
{ "ok": true, "status": "archived" }
```

### Fehler

- `404 NOT_FOUND`.

---

## `POST /api/workspace/leads/bulk`

Atomic Bulk-Aktion. Action-Discriminator im Body.

### Body — `set_status`

```json
{ "action": "set_status", "ids": ["<uuid>", ...], "status": "qualified" }
```

### Body — `archive`

```json
{ "action": "archive", "ids": ["<uuid>", ...] }
```

### Response `200`

```json
{
  "ok": true,
  "updatedCount": 3
}
```

### Fehler

- `400 VALIDATION_ERROR` — Body-Form, ungültige `status`, leere `ids`.

---

## Tests

Vitest-Route-Tests unter `src/server/tests/workspace/leads/api/`:

- `leads-route.test.ts` — `GET`, `POST` für `/leads`
- `lead-id-route.test.ts` — `GET`, `PATCH`, `DELETE` für `/leads/[id]`
- `leads-bulk-route.test.ts` — beide Bulk-Actions

Auth-Helper-Tests: `src/server/tests/lib/auth/api.test.ts` (authed/unauthed/non-allowlisted Calls).

E2E-Smoke: `e2e/workspace-leads.e2e.ts`.

## Server-Layer-Reuse

Routen rufen ausschließlich Handler aus `src/server/workspace/leads/**` auf:

- `query-handler/list-leads.query-handler.ts`
- `query-handler/get-lead-by-id.query-handler.ts`
- `command-handler/create-lead.command-handler.ts`
- `command-handler/update-lead.command-handler.ts`
- `command-handler/bulk-edit-leads.command-handler.ts`

Validation und Filter:

- `services/create-lead/create-lead-validation-service.ts`
- `services/update-lead/update-lead-validation-service.ts`
- `services/lead-filter/lead-filter.schema.ts`
- `utils/lead-url-normalization-service.ts`
- `services/lead-activity-service.ts`

Create-Lead-Datenfluss:

`AddLeadFormValues -> CreateLeadRequestDto -> createLead(...) -> serverinterner PersistenceInput -> DB`

Persistenz: `getDrizzleDatabaseClient()` + `ContactDatabaseTransaction` aus `src/server/db/core`.

## DTO-Verweise

| Contract               | Datei                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| `LeadSummaryDto`       | `packages/common/src/contracts/leads/lead-summary.dto.ts`           |
| `LeadDetailDto`        | `packages/common/src/contracts/leads/lead-detail.dto.ts`            |
| `CreateLeadRequestDto` | `packages/common/src/contracts/leads/create-lead-request.dto.ts`    |
| `CreateLeadResult`     | `packages/common/src/contracts/leads/results/create-lead-result.ts` |
| `UpdateLeadResult`     | `packages/common/src/contracts/leads/results/update-lead-result.ts` |
| `ListLeadsResult`      | `packages/common/src/contracts/leads/results/list-leads-result.ts`  |
| `BulkEditLeadsInput`   | `packages/common/src/contracts/leads/bulk-edit-leads-input.ts`      |

## Hinweise

- `Cache-Control: no-store` ist Default; keine Edge-Caches, kein `revalidate`.
- Logs enthalten niemals PII (E-Mails, Telefonnummern, Namen, Notes).
- Mehrtabellen-Schreibvorgänge laufen in einer einzigen Transaktion.
- Soft-Delete bleibt P1-Standard; Hard-Delete ist nicht erlaubt.

## Verweise

- `src/app/[locale]/workspace/leads/CLAUDE.md` — UI-Pendant.
- `plans/workspace/leads/01-list-and-detail.md` — Implementierungsplan.
