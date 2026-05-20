# Architecture — Open Items

Bewusste, dokumentierte Abweichungen von Konventionen oder zurückgestellte Refactorings. Jeder Eintrag: Datei/Bereich, Regel-Referenz, Risiko, Next-Step.

---

## 1. Bulk-Handler operieren ohne Per-Row-Ownership-Filter

**Datum:** 2026-05-14
**Bereich:**

- `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`
- `src/server/workspace/leads/command-handler/bulk-archive-leads.command-handler.ts`
- `src/server/workspace/leads/command-handler/bulk-delete-leads.command-handler.ts`

**Regel-Referenz:** Code-Review CR #6 (`deletable/CR.md`) — empfiehlt Defense-in-Depth via `where user_id = $callerId` zusätzlich zur Route-Auth, gegen zukünftige IDOR-Vektoren.

**Risiko:** Sobald Multi-Tenancy oder Per-User-Ownership eingeführt wird, könnte ein Client beliebige Lead-UUIDs senden und Cross-Workspace-Mutationen auslösen. Aktuell mitigiert durch Allowlist + Single-Tenant-Design (`src/app/[locale]/workspace/CLAUDE.md`: „Allowlist-User teilen sich den Leads-Workspace, DB-basierte ACL erst wenn >5 User oder dynamische Permissions").

**Next-Step:**

1. Wenn Rollen-Modell oder Multi-User-Trennung kommt → Migration `add user_id to leads` (NOT NULL FK auf Clerk-User-ID-Spalte) + Backfill-Strategie festlegen.
2. Gleichzeitig **alle** Lese-/Schreib-Pfade (Single-Edit, List, Detail, Bulk) auf `where user_id = $caller` umstellen — nicht selektiv nur Bulk.
3. TODO-Marker in den drei Bulk-Handlern verweisen auf diesen Eintrag.

---

## 2. `LeadFormValues.improvements` als `Array<{ value: string }>`

**Datum:** 2026-05-14
**Bereich:** `src/common/contracts/leads/forms/lead-form-values.ts`

**Regel-Referenz:** CR #17.

**Risiko:** Gemappt im Improvements-Section-Controller hin und zurück nach `string[]` — doppelte Repräsentation, zwei Migrationspunkte bei jeder Schema-Änderung.

**Next-Step:** Migration auf `string[]` (Phase 8 des `plans/workspace/leads/bulk-edit-CR-fixes.md`).

---

## 3. `LeadFormValues` mit snake_case-Feldnamen

**Datum:** 2026-05-14
**Bereich:** `src/common/contracts/leads/forms/lead-form-values.ts` (`lead_status`, `social_profiles`)

**Regel-Referenz:** `src/common/CLAUDE.md` — DTOs in `contracts/**/*.ts` müssen camelCase nutzen.

**Risiko:** Konventions-Verstoß, existierend vor CR. Neue Form-Felder ziehen Diskrepanz weiter; Refactoring berührt Form-Defaults, Validierung, Submit-Mapper.

**Next-Step:** Eigenes Refactoring-Ticket nach Bulk-Edit-CR-Cleanup. Migration in dedizierten Commit, da Form-weite Auswirkungen.

---

## 4. Bulk-Edit Performance: per-Lead-Roundtrip-Sequenz

**Datum:** 2026-05-14
**Bereich:** `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`

**Regel-Referenz:** CR #8.

**Risiko:** ~3 HTTP-Roundtrips pro Lead × ≤200 Leads = bis ~600 sequenzielle Neon-HTTP-Calls. Latenz spürbar bei großen Bulk-Operationen.

**Next-Step:** Erst bei Bedarf optimieren. Möglicher Plan: ein vorgelagertes `SELECT … WHERE id = ANY($1)` lädt alle Rows in den Speicher, dann pro Lead nur eine Tx mit UPDATE + Activity-INSERT (spart ~200 SELECT-Roundtrips). Würde aber das Race-Re-Read aus CR #2 wieder schwächen — Trade-off in eigener Brainstorm-Session evaluieren.
