# AGENTS.md — Workspace Leads API

Diese Datei gilt für `src/app/api/workspace/leads/` und alle Subroutes darunter. Sie ergänzt die Repo-Root `AGENTS.md`, `src/app/AGENTS.md` und `src/app/[locale]/workspace/AGENTS.md`. Engere Regeln in tieferen Ordnern haben Vorrang.

## Codex-Arbeitsweise

- Bestehende Auth-, Persistenz- und Activity-Logik zuerst lesen (Server-Layer unter `src/server/workspace/leads/` und aktive Pläne unter `plans/workspace/leads/`) und respektieren.
- API-Routen klein halten. Business-Logik gehört in den Server-Layer, nicht in `route.ts`.
- Bei Unsicherheit über Auth, Caching, Datenzugriff oder Fehlerformat stoppen und den Nutzer fragen, bevor Schutzmechanismen abgeschwächt oder Contract-Garantien gebrochen werden.
- Wenn eine Architekturregel nicht sofort eingehalten werden kann, die konkrete Stelle mit Pfad, Regelbezug, Risiko und nächstem Schritt in `architecture-open-items.md` dokumentieren.

## Zweck und Geltungsbereich

- Server-seitige JSON-API für die Workspace-Leads-UI und alle künftigen Erweiterungen rund um den Lead-Lebenszyklus (Reads, Mutationen, Bulk-Aktionen, Import/Export, Outbound-Messaging-Endpunkte, dedizierte Sub-Routen).
- Konsumenten: ausschließlich die eingeloggte, allowlist-berechtigte Workspace-UI. Keine öffentliche Konsumentenklasse, kein CORS-Hardening über die Standardvorgaben hinaus.
- Vollständiger Endpunkt-Contract liegt in `README.md` und wird bei Änderungen im selben Commit aktualisiert.

## Mandatorische Regeln

1. **Auth über `withWorkspaceApiAuth`.** Jede Handler-Funktion in dieser Subtree wird mit `withWorkspaceApiAuth(handler)` aus `src/lib/auth/api.ts` umhüllt. Kein direkter `auth()`-Aufruf, kein `requireWorkspaceAccess(locale)` mit Locale-Redirect, keine eigene Allowlist-Implementierung.

2. **JSON-only.** API-Antworten sind ausnahmslos JSON. Keine HTML-Responses, keine Locale-aware Redirects, keine `notFound()`-Helper aus `next/navigation`. Auch Fehler liefern JSON mit dem einheitlichen Schema (`error`, `message`, optional `details`).

3. **Routen orchestrieren nur.** `route.ts` parst und validiert Eingaben, ruft Query-/Command-Handler auf und mappt das Ergebnis in das DTO. Persistenz, Transaktionen, Activity-Logging und Business-Regeln liegen unter `src/server/workspace/leads/**`.

4. **Validation ist Pflicht.** Bodies und Query-Params werden über zentrale Zod-Schemas im `lead-validation-service` (`src/server/workspace/leads/services/lead-validation-service.ts`) bzw. dedizierte Service-Files validiert. Keine ad-hoc-Schemas in `route.ts`. Validation-Fehler werden zu `400 VALIDATION_ERROR` mit Feld-Pfad-`details`.

5. **DTO-Trennung.** Request-/Response-Bodies basieren auf `src/common/contracts/leads/**`. Schreib-Operationen verwenden getrennte Command-DTOs (z. B. `create-lead.dto.ts`, `update-lead.dto.ts`); gemeinsame schreibbare Felder liegen in `lead-write-fields.dto.ts`. Kein generisches `save-lead.dto.ts`, keine vermischten Mega-DTOs.

6. **Kontrakt-Grenzen.** API-Routen importieren nur aus `src/common/contracts/leads/**` und `src/server/workspace/leads/**`. DB-nahe Records (`src/server/db/records/leads/**`) und Persistenz-Inputs (`src/server/db/contracts/leads/**`) bleiben server-intern und werden nie durch die API exposed.

7. **Transaktionen für mehrere Tabellen.** Operationen, die mehr als eine Lead-Tabelle berühren (z. B. `leads` + `lead_social_profiles` + `lead_activities`, oder spätere Message-/Import-Tabellen), laufen in einer einzigen `ContactDatabaseTransaction`. Keine Best-Effort-Mehrfachschreiber außerhalb von Transaktionen.

8. **Lead-Lifecycle ohne Hard-Delete.** Leads werden nicht physisch gelöscht. Lifecycle-Wechsel (Archivieren, Reaktivieren, spätere Lifecycle-Stufen) erfolgen über Status- bzw. Lifecycle-Felder und werden im Server-Layer als bewusste Operation modelliert. Auch Bulk-Operationen folgen diesem Prinzip.

9. **Atomic Bulk-Operationen.** Bulk-Routen sind alles-oder-nichts. Bei einer ungültigen ID, Validation-Fehlern oder DB-Fehlern wird die Transaktion zurückgerollt und ein passender Fehlercode zurückgegeben. Teil-Erfolge werden nicht stillschweigend zurückgemeldet.

10. **No-PII-Logging.** Logs (`console.*`, externe Logger) enthalten niemals E-Mails, Telefonnummern, Lead-Namen, Firmen-, Nachrichten- oder Notes-Inhalte. Audit-/Activity-`metadata` und Actor-Felder enthalten keine PII; erlaubt sind ausschließlich stabile Schlüssel/IDs (z. B. Status-Werte, Submission-/Import-/Message-IDs). Actor-`actor_id` ist die Clerk-User-ID, `actor_label` ein optionaler PII-freier Anzeigename. Neue Activity-/Audit-Quellen erweitern diese Whitelist nur durch eine bewusste Plan-Entscheidung.

11. **Einheitliches Fehlerformat.** Alle Fehler folgen `{ error, message, details? }` mit den im `CLAUDE.md`/`README.md` dokumentierten Codes. Keine Stacktraces, keine internen Pfade, keine PII in Fehler-Responses.

12. **Statuscodes konsistent.** Erfolgreiche Reads/Updates: `200`. Erfolgreiche Creates: `201`. Validation: `400`. Unauthenticated: `401`. Nicht gefunden oder nicht-allowlistet: `404`. Konflikte (z. B. Email-Duplicate): `409`. Business-Rule-Verstöße: `422`. Unerwartete Fehler: `500`. Neue Statuscodes oder Konflikt-Klassen werden zentral in `CLAUDE.md`/`README.md` ergänzt.

13. **Keine Caching-Header.** Workspace-Daten sind user-spezifisch. `Cache-Control: no-store` ist Default, Static Generation ist tabu, `revalidate` ist nicht erlaubt.

14. **Tests gehören zur Definition of Done.** Jede Route bekommt mindestens einen Vitest-Route-Test unter `src/server/tests/workspace/leads/api/`. Auth-Helper, Validation-Services, Filter-Services und neue domänenspezifische Services haben eigene Unit-Tests. Vor Merge `npm run lint && npm run typecheck && npm run test && npm run build` grün.

15. **README pflegen.** Wenn ein Endpunkt, Statuscode, Fehlercode, Body-Feld oder Query-Param geändert wird, wird die `README.md` im selben Commit aktualisiert. Neue Subrouten (z. B. `/import`, `/export`, `/messages`) werden dort dokumentiert, bevor sie konsumiert werden.

## Workflow für API-Änderungen

1. Plan oder Ticket aktualisieren (Vertrag, Felder, Fehlerfälle, Auth-Erwartungen).
2. DTO unter `src/common/contracts/leads/**` ergänzen oder anpassen (UI + API geteilt).
3. Validation-Schema im passenden Service ergänzen, Tests dazu.
4. Server-Layer (Query- oder Command-Handler, ggf. neuer Service) anpassen, Tests dazu.
5. `route.ts` so dünn wie möglich anpassen, Route-Test ergänzen.
6. `README.md` im selben Commit aktualisieren.
7. `npm run lint && npm run typecheck && npm run test && npm run build` grün halten.

## Was hier nicht hingehört

- UI-Code, JSX, React-Komponenten.
- Direkte Drizzle-Queries in `route.ts`.
- Eigene Auth-, Session- oder JWT-Logik.
- Public-API-Endpunkte → `src/app/api/public/`.
- E-Mails, Telefonnummern, Klartext-Nachrichten oder andere PII in Logs, Activity-/Audit-Metadaten oder Fehlertexten.
- Locale-aware Redirects, HTML-Responses, Caching-Header.

## Verweise

- Repo-Root `AGENTS.md` und `CLAUDE.md`.
- `src/app/AGENTS.md` und `src/app/CLAUDE.md`.
- `src/app/[locale]/workspace/AGENTS.md` und `src/app/[locale]/workspace/CLAUDE.md`.
- `src/app/api/workspace/leads/CLAUDE.md` und `README.md`.
- `src/app/[locale]/workspace/leads/AGENTS.md` und `CLAUDE.md`.
- Aktive und kommende Pläne: `plans/workspace/leads/`.
