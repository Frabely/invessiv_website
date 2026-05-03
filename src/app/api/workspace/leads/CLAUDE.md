# CLAUDE — Workspace Leads API

Architektur-Wissen für die JSON-API unter `src/app/api/workspace/leads/`. Diese Datei ergänzt die Repo-Root `CLAUDE.md`, `src/app/CLAUDE.md` sowie die Workspace-Parent-Doku (`src/app/[locale]/workspace/CLAUDE.md` + `AGENTS.md`).

> **Status:** Phase 1 in Implementierung. Plan: `plans/workspace/leads/01-list-and-detail.md`. Endpunkt-Contract: siehe `README.md` im selben Ordner.

## Zweck

Server-API für die UI unter `/[locale]/workspace/leads`. Liefert Listen, Detaildaten, Mutationen (Create/Update/Soft-Delete) und Bulk-Aktionen. Konsumiert ausschließlich der eingeloggte, allowlist-berechtigte Workspace-Nutzer. Keine öffentliche API.

## Auth — `withWorkspaceApiAuth`

- API-Routen rufen **nicht** `requireWorkspaceAccess(locale)` aus dem UI-Layer auf. Stattdessen wickelt der HOC `withWorkspaceApiAuth(handler)` aus `src/lib/auth/api.ts` jeden Handler:
  1. `auth()` aus `@clerk/nextjs/server` → kein `userId` ⇒ `401 { error: "UNAUTHENTICATED" }`.
  2. `currentUser()` → primäre E-Mail, lowercase + trim.
  3. `isEmailAllowed(email)` aus `src/lib/auth/allowlist.ts` → falls `false` ⇒ `404 { error: "NOT_FOUND" }` (kein 403, damit die Existenz des Endpunkts nicht geleakt wird).
- Der Helper enthält **keine** Locale-Redirect-Semantik. API-Aufrufe geben immer JSON zurück, niemals HTML oder Redirects.
- `proxy.ts` wird nur dann für `/api/workspace/(.*)` erweitert, wenn die Clerk-Middleware nachweislich JSON-kompatibel bleibt. Andernfalls bleibt der HOC der maßgebliche API-Schutz.
- Authed Handler erhalten den userId/Email-Kontext ausschließlich für Activity-Logging — niemals als Bestandteil der Response.

## Endpunkte (Übersicht)

| Methode  | Pfad                        | Zweck                                            |
| -------- | --------------------------- | ------------------------------------------------ |
| `GET`    | `/api/workspace/leads`      | List + Filter + Pagination                       |
| `POST`   | `/api/workspace/leads`      | Create Lead (`source='manual'`)                  |
| `GET`    | `/api/workspace/leads/[id]` | Detail (Lead + Kategorie + Social + Activities)  |
| `PATCH`  | `/api/workspace/leads/[id]` | Update Lead-Stammdaten / Status / Notes / Social |
| `DELETE` | `/api/workspace/leads/[id]` | Soft-Delete (setzt `lead_status='archived'`)     |
| `POST`   | `/api/workspace/leads/bulk` | Bulk Status / Bulk Archive (atomic)              |

Vollständiger Contract (Query-Params, Request-/Response-Bodies, Statuscodes, Fehler-Codes, Beispiele) → `README.md`.

## Request-/Response-DTOs

- DTOs liegen in `src/common/contracts/leads/**` und sind UI + API geteilt:
  - `lead-summary.dto.ts` — Listenzeile (Response von `GET /leads`)
  - `lead-detail.dto.ts` — Response von `GET /leads/[id]`
  - `lead-write-fields.dto.ts` — gemeinsam genutzte schreibbare Felder
  - `create-lead.dto.ts` — Body von `POST /leads`
  - `update-lead.dto.ts` — Body von `PATCH /leads/[id]`
  - `lead-filter.dto.ts` — typisierte Query-Params
- Validierung passiert über Zod-Schemas im `lead-validation-service` (`src/server/workspace/leads/services/lead-validation-service.ts`).
- DB-nahe Row-Shapes liegen bei Bedarf unter `src/server/db/records/leads/**` und werden **nicht** über die API exposed.

## Fehlerformat

Einheitliches JSON-Schema:

```json
{ "error": "<MACHINE_CODE>", "message": "<human-readable>", "details": <optional> }
```

| Status | `error`-Code       | Bedeutung                                              |
| ------ | ------------------ | ------------------------------------------------------ |
| 400    | `VALIDATION_ERROR` | Zod-Fehler. `details` enthält Feld-Pfad-Liste          |
| 401    | `UNAUTHENTICATED`  | Kein Clerk-User                                        |
| 404    | `NOT_FOUND`        | Lead existiert nicht **oder** User nicht auf Allowlist |
| 409    | `EMAIL_EXISTS`     | Duplicate Email beim Create                            |
| 422    | `BUSINESS_RULE`    | Z.B. `last_name` und `company_name` beide leer         |
| 500    | `INTERNAL`         | Unerwarteter Fehler. Stacktrace nur im Server-Log      |

`message` ist auf Englisch, knapp und ohne PII. Details enthalten keine E-Mails, Telefonnummern oder andere Lead-Inhalte.

## Statuscodes

- `200 OK` — erfolgreiche Reads/Updates.
- `201 Created` — `POST /leads`.
- Bei `DELETE` antwortet die Route mit `200 { ok: true, status: "archived" }` statt `204`, weil Soft-Delete einen sinnvollen Body hat.
- Bulk-Routen geben `200 { updated: <count> }` oder `200 { archived: <count> }` zurück. Atomic: alles oder nichts; bei Fehler `400`/`404` mit dem konkreten Code.

## No-PII-Logging

- `console.log`/`console.error` enthält **niemals** E-Mails, Telefonnummern, Lead-Namen, Firmen- oder Notes-Inhalte.
- Activity-Einträge in `lead_activities` speichern keine Lead-Inhalte. Erlaubte `metadata`-Keys in P1: `previous_status`, `next_status`, `submission_id`, `import_batch_id`. Actor-Felder (`actor_id`, `actor_label`) enthalten Clerk-User-IDs/Anzeigenamen, **keine** E-Mails.
- Vollständige Lead-Daten bleiben in den fachlichen Tabellen, nicht in Logs oder Audit-Metadaten.

## Server-Layer-Reuse

- Query-Handler: `src/server/workspace/leads/query-handler/list-leads.query-handler.ts`, `get-lead-by-id.query-handler.ts`.
- Command-Handler: `src/server/workspace/leads/command-handler/create-lead.command-handler.ts`, `update-lead.command-handler.ts`, `update-lead-status.command-handler.ts`, `bulk-update-status.command-handler.ts`, `bulk-archive-leads.command-handler.ts`.
- Services: `lead-validation-service`, `lead-filter-service`, `lead-url-normalization-service`, `lead-activity-service`.
- DB-Singleton: `getDrizzleDatabaseClient()` + `ContactDatabaseTransaction` aus `src/server/db/client.ts`.
- Activity-Logging zentral über `appendLeadActivity()` aus dem `lead-activity-service`. Routen rufen das **nicht** selbst auf, sondern delegieren an Command-Handler.

## Routing & Datenfluss (typischer Verb-Pfad)

```
route.ts (NextRequest) ──▶ withWorkspaceApiAuth(async (req, ctx) => {
  ├─ parse + validate Body / Query (Zod)
  ├─ Command-Handler oder Query-Handler aufrufen
  ├─ Mapping in DTO (LeadSummaryDto / LeadDetailDto)
  └─ Response.json(result, { status })
})
```

Routen orchestrieren nur. Business-Logik, Persistenz und Activity-Logging gehören in den Server-Layer (`src/server/workspace/leads/**`), nicht in `route.ts`.

## Tests

- Route-Tests unter `src/server/tests/workspace/leads/api/`:
  - `leads-route.test.ts` — `GET`, `POST` für `/leads`
  - `lead-id-route.test.ts` — `GET`, `PATCH`, `DELETE` für `/leads/[id]`
  - `leads-bulk-route.test.ts` — beide Bulk-Actions
- Auth-Helper-Tests: `src/server/tests/lib/auth/api.test.ts` (authed/unauthed/non-allowlisted).
- Command/Query-Handler-Tests separat in `src/server/tests/workspace/leads/{command-handler,query-handler,services}/`.
- Vor Merge: `npm run lint && npm run typecheck && npm run test && npm run build` grün.

## Kritische Dateien

| Pfad                                        | Zweck                              |
| ------------------------------------------- | ---------------------------------- |
| `src/app/api/workspace/leads/route.ts`      | `GET`/`POST /leads`                |
| `src/app/api/workspace/leads/[id]/route.ts` | `GET`/`PATCH`/`DELETE /leads/[id]` |
| `src/app/api/workspace/leads/bulk/route.ts` | `POST /leads/bulk`                 |
| `src/app/api/workspace/leads/README.md`     | API-Contract                       |
| `src/lib/auth/api.ts`                       | `withWorkspaceApiAuth`-HOC         |
| `src/lib/auth/allowlist.ts`                 | `isEmailAllowed()`                 |
| `src/server/workspace/leads/`               | Query-/Command-Handler, Services   |
| `src/server/db/client.ts`                   | DB-Singleton + Transaction-Helper  |
| `src/common/contracts/leads/`               | Geteilte DTOs                      |

## Was hier NICHT hingehört

- UI-Code, JSX, React-Komponenten.
- Direkte Drizzle-Queries in `route.ts` — Persistenz läuft über Command-/Query-Handler.
- Eigene Auth-Implementierungen, eigene Sessions, JWT-Logik.
- Public-API-Endpunkte → `src/app/api/public/`.
- E-Mails, Telefonnummern oder andere PII in Logs, Responses oder Activity-Metadaten.

## Verweise

- Repo-Root `CLAUDE.md` und `AGENTS.md`.
- `src/app/[locale]/workspace/CLAUDE.md` + `AGENTS.md` — Workspace-weite Auth-/SEO-/i18n-Regeln.
- `src/app/[locale]/workspace/leads/CLAUDE.md` + `AGENTS.md` — UI-Pendant.
- `src/app/api/workspace/leads/README.md` — vollständiger API-Contract.
- Implementierungsplan: `plans/workspace/leads/01-list-and-detail.md`.
