# Workspace Leads API

JSON-API für die Workspace-Leads-UI unter `/[locale]/workspace/leads`. Server-only, Clerk-authentifiziert, allowlist-gated.

> **Quelle der Wahrheit für den Contract:** dieses Dokument. Bei Änderungen an Endpunkten, Statuscodes oder Bodies wird diese Datei im selben Commit aktualisiert.

## Auth

Jeder Handler ist mit `withWorkspaceApiAuth(handler)` aus `src/lib/auth/api.ts` gewrappt:

1. Clerk `auth()` → kein `userId` ⇒ `401 UNAUTHENTICATED`.
2. `currentUser()` → primäre E-Mail (lowercase, trim).
3. `isEmailAllowed(email)` aus `src/lib/auth/allowlist.ts` → `false` ⇒ `404 NOT_FOUND`.

Allowlist via ENV `WORKSPACE_ALLOWED_EMAILS` (Komma-getrennt). API-Antworten sind ausschließlich JSON, niemals Redirects oder HTML.

## Fehlerformat

```json
{ "error": "<MACHINE_CODE>", "message": "<human-readable>", "details": <optional> }
```

| Status | `error`-Code       | Bedeutung                                              |
| ------ | ------------------ | ------------------------------------------------------ |
| 400    | `VALIDATION_ERROR` | Zod-Validation. `details` enthält Feld-Pfade           |
| 401    | `UNAUTHENTICATED`  | Kein Clerk-User                                        |
| 404    | `NOT_FOUND`        | Lead existiert nicht **oder** User nicht auf Allowlist |
| 409    | `EMAIL_EXISTS`     | Duplicate Email beim Create                            |
| 422    | `BUSINESS_RULE`    | Z.B. `last_name` und `company_name` beide leer         |
| 500    | `INTERNAL`         | Unerwarteter Fehler. Stacktrace nur im Server-Log      |

`message` ist auf Englisch, knapp, ohne PII. `details` enthält keine E-Mails, Telefonnummern oder Lead-Inhalte.

---

## `GET /api/workspace/leads`

Listet Leads gefiltert, sortiert und paginiert.

### Query-Params

| Param       | Typ                                                                                                 | Default           | Notiz                                                         |
| ----------- | --------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------- |
| `status`    | `'new' \| 'contacted' \| 'qualified' \| 'proposal' \| 'won' \| 'lost' \| 'archived'`                | —                 | Standard schließt `archived` aus, wenn nicht explizit gesetzt |
| `source`    | `'webform' \| 'manual' \| 'import'`                                                                 | —                 |                                                               |
| `category`  | `string` (UUID oder Slug aus `lead_categories`)                                                     | —                 |                                                               |
| `q`         | `string`                                                                                            | —                 | Free-Text auf `email`, `last_name`, `company_name`, `owner`   |
| `score_min` | `number` (0–100)                                                                                    | —                 |                                                               |
| `from`      | `string` (ISO-Date)                                                                                 | —                 | Inklusive `created_at >= from`                                |
| `to`        | `string` (ISO-Date)                                                                                 | —                 | Exklusive `created_at < to`                                   |
| `page`      | `number`                                                                                            | `1`               | 1-basiert                                                     |
| `per_page`  | `number`                                                                                            | `25`              | Max `100`                                                     |
| `sort`      | `'created_at:desc' \| 'created_at:asc' \| 'name:asc' \| 'name:desc' \| 'score:desc' \| 'score:asc'` | `created_at:desc` |                                                               |

### Response `200`

```json
{
  "rows": [LeadSummaryDto, ...],
  "total": 137,
  "page": 1,
  "perPage": 25
}
```

`LeadSummaryDto` → `src/common/contracts/leads/lead-summary.dto.ts`.

### Fehler

- `400 VALIDATION_ERROR` bei ungültigen Query-Param-Werten.

---

## `POST /api/workspace/leads`

Legt einen Lead manuell an. Server setzt explizit `source='manual'` und `lead_status='new'`. Activity-Eintrag (`type='note'`) wird im selben Transaktions-Schritt erzeugt.

### Body — `CreateLeadDto`

```jsonc
{
  "first_name": "string | null",
  "last_name": "string | null",        // CHECK: last_name ODER company_name muss gesetzt sein
  "company_name": "string | null",
  "email": "string (E-Mail-Format)",   // pflichtig, eindeutig
  "phone": "string | null",
  "website_url": "string (URL) | null",
  "category_id": "uuid | null",
  "score": "number 0..100 | null",
  "owner": "string | null",
  "notes": "string | null",
  "improvements": ["string", ...] | null,
  "social_profiles": [
    { "platform": "linkedin" | "instagram" | "youtube", "profile_url": "string (URL)" }
  ] | null
}
```

`source` wird **nicht** vom Client gesetzt; der Server erzwingt `manual`.

### Response `201`

```json
{ "lead": LeadDetailDto }
```

`LeadDetailDto` → `src/common/contracts/leads/lead-detail.dto.ts`.

### Fehler

- `400 VALIDATION_ERROR` — Zod-Fehler.
- `409 EMAIL_EXISTS` — bestehender Lead mit gleicher E-Mail (unique über `leads_email_lower_uidx`).
- `422 BUSINESS_RULE` — z.B. `last_name` und `company_name` beide leer/whitespace.

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

### Body — `UpdateLeadDto`

Alle Felder optional. Erlaubte Keys: gleiche schreibbare Felder wie bei `CreateLeadDto`, zusätzlich `lead_status`. `source` und `email` sind im PATCH **nicht** veränderbar.

```jsonc
{
  "first_name": "string | null",
  "last_name": "string | null",
  "company_name": "string | null",
  "phone": "string | null",
  "website_url": "string (URL) | null",
  "category_id": "uuid | null",
  "score": "number 0..100 | null",
  "lead_status": "new | contacted | qualified | proposal | won | lost | archived",
  "owner": "string | null",
  "notes": "string | null",
  "improvements": ["string", ...] | null,
  "social_profiles": [
    { "platform": "linkedin" | "instagram" | "youtube", "profile_url": "string (URL)" }
  ] | null
}
```

### Response `200`

```json
{ "lead": LeadDetailDto }
```

### Fehler

- `400 VALIDATION_ERROR`, `404 NOT_FOUND`, `422 BUSINESS_RULE` (Personen-/Firmenname-Check).

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
{ "updated": 3 }
```

oder

```json
{ "archived": 2 }
```

### Fehler

- `400 VALIDATION_ERROR` — Body-Form, ungültige `status`, leere `ids`.
- `404 NOT_FOUND` — mindestens eine ID existiert nicht. Transaktion wird zurückgerollt, kein Lead wird verändert.

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
- `command-handler/update-lead-status.command-handler.ts`
- `command-handler/bulk-update-status.command-handler.ts`
- `command-handler/bulk-archive-leads.command-handler.ts`

Validation und Filter:

- `services/lead-validation-service.ts`
- `services/lead-filter-service.ts`
- `services/lead-url-normalization-service.ts`
- `services/lead-activity-service.ts`

Persistenz: `getDrizzleDatabaseClient()` + `ContactDatabaseTransaction` aus `src/server/db/client.ts`.

## DTO-Verweise

| DTO                  | Datei                                                 |
| -------------------- | ----------------------------------------------------- |
| `LeadSummaryDto`     | `src/common/contracts/leads/lead-summary.dto.ts`      |
| `LeadDetailDto`      | `src/common/contracts/leads/lead-detail.dto.ts`       |
| `LeadWriteFieldsDto` | `src/common/contracts/leads/lead-write-fields.dto.ts` |
| `CreateLeadDto`      | `src/common/contracts/leads/create-lead.dto.ts`       |
| `UpdateLeadDto`      | `src/common/contracts/leads/update-lead.dto.ts`       |
| `LeadFilterDto`      | `src/common/contracts/leads/lead-filter.dto.ts`       |

## Hinweise

- `Cache-Control: no-store` ist Default; keine Edge-Caches, kein `revalidate`.
- Logs enthalten niemals PII (E-Mails, Telefonnummern, Namen, Notes).
- Mehrtabellen-Schreibvorgänge laufen in einer einzigen Transaktion.
- Soft-Delete bleibt P1-Standard; Hard-Delete ist nicht erlaubt.

## Verweise

- `CLAUDE.md` (gleicher Ordner) — Architektur und Server-Layer-Reuse.
- `AGENTS.md` (gleicher Ordner) — mandatorische Regeln.
- `src/app/[locale]/workspace/leads/CLAUDE.md` — UI-Pendant.
- `plans/workspace/leads/01-list-and-detail.md` — Implementierungsplan.
