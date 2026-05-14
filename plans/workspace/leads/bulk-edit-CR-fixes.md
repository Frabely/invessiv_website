# Bulk-Edit CR-Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alle 52 Code-Review-Punkte aus `deletable/CR.md` (Runden 1–5) auf Branch `bulk-edit` abarbeiten — Blocker, Konventionsverstöße, Architektur-Inkonsistenzen, A11y-Lücken, Theming-Lücken und Refactorings.

**Architecture:** Phasenweise: zuerst breaking renames (snake_case→camelCase DTOs) und Race-Fixes, dann Dead-Code-Entfernung, dann Architektur/Konventionen, dann UX/A11y/Theming, zuletzt Refactorings + Tests. Pro Phase eigener Commit, zwischen Phasen `npm run typecheck && npm run lint && npm run test` grün.

**Tech Stack:** Next.js 16 App-Router, React 19, Tailwind v4, Drizzle + Neon Postgres, Zod, Vitest, Playwright

**CR-Entscheidungen vorab getroffen:**

- #15 Activity-Typ-Strategie: **Shape-basiert** — `StatusChange` für reine Status-Änderungen (Single, Bulk-Edit-status-only, Bulk-Archive), `BulkEdit` nur für Mehr-Feld-Bulk-Ops
- #17 Improvements-Schema: **Form auf `string[]` migrieren** — `useFieldArray`-Wrapper raus
- #50 TS71007: erst reproduzieren via `npm run lint`, dann gezielt fixen

**Konvention für DB-Spalten vs. DTO-Felder (aus `src/common/CLAUDE.md`):**

- DB-Tabelle und `LeadCurrentState` (Row-Shape): **snake_case**, bleibt unverändert
- DTO `BulkEditLeadsPatch` (in `src/common/contracts/leads/`): **camelCase**
- Mapping camelCase→snake_case nur im DB-`set`-Clause des Command-Handlers

---

## Phase 0 — Vorbereitung

### Task 0.1: Baseline grün stellen

- [ ] **Step 1: Aktuellen Stand prüfen**

Run: `npm run typecheck`
Run: `npm run lint`
Run: `npm run test -- --run`

Expected: Tests grün oder dokumentierte Vorbedingung. Falls rot, erst stabilisieren, bevor Plan-Tasks starten.

- [ ] **Step 2: Working Tree clean / Commit der laufenden Änderungen**

```bash
git status
git diff
# Wenn ungebundene Änderungen: in einen "wip"-Commit oder stashen, damit Plan-Diffs sauber bleiben
```

---

## Phase 1 — Blocker (CR #1, #2, #5, #6)

Ziel: PR-Merge-Blocker beseitigen. Schema-Rename ist die zentrale, propagierende Änderung.

### Task 1.1 — DTO-Felder auf camelCase (CR #1)

**Files:**

- Modify: `src/common/contracts/leads/bulk-edit-leads-input.ts`
- Modify: `src/server/workspace/leads/api/bulk-action-schema.ts`
- Modify: `src/app/api/workspace/leads/bulk/route.ts`
- Modify: `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`
- Modify: `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-dialog.tsx`
- Modify: `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-service.ts`
- Modify alle Tests, die diese Keys benutzen: `src/server/tests/workspace/leads/command-handler/bulk-edit-leads.command-handler.test.ts`, `leads-bulk-route.test.ts` etc.

- [ ] **Step 1: DTO-Interface umbenennen**

```ts
// src/common/contracts/leads/bulk-edit-leads-input.ts
import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";

export interface BulkEditLeadsPatch {
  status?: ContactLeadStatus;
  categoryId?: string | null;
  score?: number | null;
  owner?: string | null;
  notesAppend?: string;
  improvementsAppend?: string[];
}

export interface BulkEditLeadsInput {
  ids: string[];
  patch: BulkEditLeadsPatch;
}
```

- [ ] **Step 2: Zod-Schema auf camelCase**

```ts
// src/server/workspace/leads/api/bulk-action-schema.ts
const bulkEditPatchSchema = z
  .object({
    status: z.enum(CONTACT_LEAD_STATUS_VALUES).optional(),
    categoryId: z.string().uuid().nullable().optional(),
    score: z.number().int().min(...).max(...).nullable().optional(),
    owner: optionalNullableTrimmedString(LeadFieldLimits.OwnerMaxLength).optional(),
    notesAppend: z.string().min(1).max(LeadFieldLimits.NotesMaxLength).optional(),
    improvementsAppend: z.array(
      z.string().min(1).max(LeadFieldLimits.ImprovementMaxLength),
    )
      .max(BulkEditLimits.MaxImprovementsPerRequest)
      .optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: LeadValidationIssueCode.BulkEditEmptyPatch,
  });
```

- [ ] **Step 3: Command-Handler camelCase → snake_case Mapping nur im set-Clause**

```ts
// src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts
if (hasOwn(patch, "categoryId")) {
  const next = patch.categoryId ?? null;
  if (current.category_id !== next) {
    setClause.category_id = next;
    changedFields.push(BulkEditFieldKey.CategoryId);
    ...
  }
}

if (patch.notesAppend) {
  const combined = combineNotes(current.notes, patch.notesAppend);
  setClause.notes = combined;
  ...
}

if (patch.improvementsAppend && patch.improvementsAppend.length > 0) {
  setClause.improvements = [
    ...(current.improvements ?? []),
    ...patch.improvementsAppend,
  ];
  ...
}
```

- [ ] **Step 4: Frontend buildPatch + Service umstellen**

```ts
// leads-bulk-edit-dialog.tsx — buildPatch
const patch: BulkEditLeadsPatch = {};
if (applyState.status) patch.status = values.status;
if (applyState.category) patch.categoryId = values.category ?? null;
if (applyState.score) patch.score = values.score;
if (applyState.owner) patch.owner = values.owner ?? null;
if (applyState.notesAppend && values.notesAppend.trim().length > 0) {
  patch.notesAppend = values.notesAppend.trim();
}
if (applyState.improvementsAppend && values.improvementsAppend.length > 0) {
  patch.improvementsAppend = values.improvementsAppend;
}
```

- [ ] **Step 5: Alle Tests aktualisieren**

Grep nach `category_id`, `notes_append`, `improvements_append` in Test-Files; ersetzen.

- [ ] **Step 6: Verifikation**

Run: `npm run typecheck`
Run: `npm run test -- bulk-edit`
Expected: alle bulk-edit-tests grün, Type-Check grün.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(leads/bulk): camelCase DTOs for BulkEditLeadsPatch (CR #1)"
```

### Task 1.2 — SELECT in Transaction (CR #2)

**Files:**

- Modify: `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`
- Modify: `src/server/tests/workspace/leads/command-handler/bulk-edit-leads.command-handler.test.ts`

- [ ] **Step 1: Failing test — Race-Re-Check innerhalb Tx**

Schreibe Test, der mock-`db.transaction` so simuliert, dass zwischen ursprünglichem (entferntem) SELECT und Tx-internem Re-SELECT die Notes verändert werden. Test prüft, dass Notes-Length-Check gegen aktuellen Stand läuft.

- [ ] **Step 2: Test rot laufen lassen**

Run: `npm run test -- bulk-edit-leads.command-handler`
Expected: FAIL.

- [ ] **Step 3: SELECT in Tx ziehen**

```ts
// bulkEditLeads loop:
for (const leadId of input.ids) {
  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ /* …gleiche Columns wie vorher… */ })
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);

      if (!current) return { updated: false, missing: true } as const;
      return processSingleLead(tx, current, input.patch, now);
    });

    if (result.updated) updatedCount += 1;
    else if ("failure" in result && result.failure) failedLeads.push(result.failure);
  } catch (error) {
    // Unknown-Pfad bleibt — aber Display-Name fehlt jetzt; entweder vor-Tx-SELECT nur für Display oder Unknown ohne Display
    ...
  }
}
```

Hinweis: Falls Display-Name für Unknown-Skip gebraucht wird (Tx-Fail ohne current), entweder
(a) Display-Name aus separater SELECT-Aufrufpfad (Best-Effort, akzeptiert Race auf Display-Only),
(b) Display-Name aus Tx-internem Catch-Block bauen (Caller-seitig in Tx),
(c) Tx-Body Catchen und current-Snapshot returnen.
Entscheidung: (c) — `processSingleLead` returns `current` even on failure, Outer-Catch nutzt es.

- [ ] **Step 4: Test grün**

Run: `npm run test -- bulk-edit-leads.command-handler`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git commit -am "fix(leads/bulk): move SELECT inside transaction to eliminate race (CR #2)"
```

### Task 1.3 — Workspace-Scope im where-Clause (CR #6)

**Files:**

- Modify: `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`
- Modify: `src/server/workspace/leads/command-handler/bulk-archive-leads.command-handler.ts`
- Modify: `src/server/workspace/leads/command-handler/bulk-delete-leads.command-handler.ts`
- Modify: alle Call-Sites in `src/app/api/workspace/leads/bulk/route.ts`
- Modify: zugehörige Tests

- [ ] **Step 1: Input erweitern**

```ts
// bulk-edit-leads-input.ts
export interface BulkEditLeadsInput {
  ids: string[];
  patch: BulkEditLeadsPatch;
  /** UserId (Clerk) zum Eingrenzen der Mutation auf Eigentum. */
  userId: string;
}
```

Analog für `BulkArchiveLeadsInput`, `BulkDeleteLeadsInput`.

- [ ] **Step 2: SELECT/UPDATE-where um userId/workspace-Filter erweitern**

```ts
const [current] = await tx
  .select({ ... })
  .from(leads)
  .where(and(eq(leads.id, leadId), eq(leads.user_id, input.userId)))
  .limit(1);
```

(Spalte verifizieren — falls Lead-Ownership anders heißt, anpassen.)

- [ ] **Step 3: Route-Handler — userId aus `withWorkspaceApiAuth`-Context durchreichen**

- [ ] **Step 4: Test — fremder Lead darf nicht editiert/archiviert/gelöscht werden**

```ts
it("ignoriert Leads anderer User", async () => {
  // Setup: zwei Leads, einer dem User, einer fremd
  const result = await bulkEditLeads({
    ids: [ownLeadId, foreignLeadId],
    patch: { status: ContactLeadStatus.Qualified },
    userId: ownUserId,
  });
  expect(result.updatedCount).toBe(1);
  // foreign lead: nicht in failedLeads, weil silently skipped
});
```

- [ ] **Step 5: Verifikation + Commit**

```bash
git commit -am "fix(leads/bulk): scope all bulk handlers by userId (CR #6)"
```

### Task 1.4 — Re-Export entfernen (CR #5)

**Files:**

- Modify: `src/server/workspace/leads/api/bulk-action-schema.ts` (Re-Export-Zeile löschen)
- Modify: `src/app/api/workspace/leads/bulk/route.ts` (direkt aus Constants importieren)

- [ ] **Step 1: Schema-Datei**

```ts
// vorher:
export { LeadBulkAction } from "@/common/constants/leads/bulk/lead-bulk-actions";
// löschen
```

- [ ] **Step 2: Route**

```ts
import { LeadBulkAction } from "@/common/constants/leads/bulk/lead-bulk-actions";
```

- [ ] **Step 3: Verifikation + Commit**

Run: `npm run typecheck`

```bash
git commit -am "refactor(leads/bulk): remove re-export of LeadBulkAction (CR #5)"
```

---

## Phase 2 — Dead Code Entfernen (CR #9, #24, #48)

### Task 2.1 — `BulkSkipReason.ImprovementTooLong` entfernen (CR #9)

**Files:**

- Modify: `src/common/constants/leads/bulk/bulk-skip-reasons.ts`
- Modify: `src/i18n/dictionaries/leads/bulk/{de,en}.json` — Eintrag entfernen
- Modify: ggf. Render-Pfad falls referenziert

- [ ] **Step 1: Grep auf `ImprovementTooLong`**

Run: `Grep pattern "ImprovementTooLong"`
Expected: alle Treffer sammeln, dann entfernen.

- [ ] **Step 2: Konstante + i18n-Keys löschen**

- [ ] **Step 3: Typecheck + Commit**

```bash
git commit -am "chore(leads/bulk): remove unreachable BulkSkipReason.ImprovementTooLong (CR #9)"
```

### Task 2.2 — `leadsService.bulkEditLeads` entfernen (CR #24, #26)

**Files:**

- Modify: `src/components/workspace/leads/form/lead-form-dialog/leads-service.ts:182-220`
- Modify: dazugehöriger Test `leads-service.test.ts`
- Modify: `isBulkEditLeadsSuccessPayload`-Guard und alle imports

- [ ] **Step 1: Funktion + Guard + Test ersatzlos löschen**

- [ ] **Step 2: Type-Check (keine externen Konsumenten)**

Run: `Grep pattern "bulkEditLeads"` im `src/components/` — sollte nur noch `submitBulkEdit` und Service in `leads-bulk-edit-service.ts` zeigen.

- [ ] **Step 3: Commit**

```bash
git commit -am "chore(leads): remove dead leadsService.bulkEditLeads (broken, unused) (CR #24/#26)"
```

### Task 2.3 — `lead-display-name.ts` Vereinfachung (CR #48)

**Files:**

- Modify: `src/server/workspace/leads/format/lead-display-name.ts`
- Modify: alle Call-Sites

- [ ] **Step 1: Prüfen, ob Helper noch von außerhalb der Bulk-Pfade gebraucht wird**

Run: `Grep pattern "formatLeadDisplayName"`

- [ ] **Step 2a: Wenn nur in Bulk verwendet → löschen**

In bulk-Handlern direkt `current.display_name` referenzieren.

- [ ] **Step 2b: Wenn an anderen Stellen mit echtem Nullable-Input verwendet → Helper behalten, aber Bulk-Pfad direkt zugreifen lassen.**

- [ ] **Step 3: Typecheck + Commit**

```bash
git commit -am "refactor(leads): drop redundant fallback in formatLeadDisplayName (CR #48)"
```

---

## Phase 3 — Architektur / Konventionen (CR #4, #11/#38, #37, #39, #40, #41, #43, #49, #51, #52)

### Task 3.1 — Inline-Typdefinitionen extrahieren (CR #4, #40)

**Files:**

- Create: `src/common/contracts/leads/bulk/bulk-archive-leads-input.ts` (mit `BulkArchiveLeadsInput`)
- Create: `src/common/contracts/leads/bulk/bulk-delete-leads-input.ts`
- Create: `src/server/workspace/leads/types/lead-update-types.ts` (`LeadUpdateSetClause`)
- Create: `src/common/contracts/leads/rows/lead-current-state-row.ts` (`LeadCurrentState`)
- Create: `src/common/contracts/leads/bulk/bulk-edit-activity-metadata.ts` (`BulkEditActivityMetadata`)
- Create: `src/components/workspace/leads/table/leads-bulk-edit-dialog/bulk-edit-submit-input.ts`
- Modify: alle Handler/Service-Files, die diese Typen vorher inline definiert hatten

- [ ] **Step 1: Pro Typ — neue Datei mit reinem `export type` Inhalt**

- [ ] **Step 2: Inline-Definition aus dem Original-File entfernen, import einfügen**

- [ ] **Step 3: Typecheck pro Extraktion**

Run: `npm run typecheck`

- [ ] **Step 4: Sammel-Commit**

```bash
git commit -am "refactor(leads/bulk): extract inline types per CLAUDE.md convention (CR #4/#40)"
```

### Task 3.2 — `BULK_API_ENDPOINT` zentralisieren (CR #11, #38)

**Files:**

- Create: `src/common/constants/leads/bulk/bulk-api-endpoint.ts` mit `export const BULK_API_ENDPOINT = "/api/workspace/leads/bulk";`
- Modify: `leads-bulk-edit-service.ts`, `leads-bulk-archive-confirm-dialog.tsx`, `leads-bulk-delete-confirm-dialog.tsx` — lokale Konstante durch Import ersetzen

- [ ] **Step 1: Konstanten-Datei anlegen**

- [ ] **Step 2: Drei Stellen umstellen**

- [ ] **Step 3: Typecheck + Commit**

```bash
git commit -am "refactor(leads/bulk): central BULK_API_ENDPOINT constant (CR #11/#38)"
```

### Task 3.3 — `BulkSubmitFailureKind` Const-Objekt (CR #37)

**Files:**

- Create: `src/common/constants/leads/bulk/bulk-submit-failure-kinds.ts`

```ts
export const BulkSubmitFailureKind = {
  Network: "network",
  Server: "server",
} as const;
export type BulkSubmitFailureKind =
  (typeof BulkSubmitFailureKind)[keyof typeof BulkSubmitFailureKind];
```

- Modify: `leads-bulk-edit-service.ts` — `BulkEditFailure.kind` Type referenziert `BulkSubmitFailureKind`
- Modify: `leads-bulk-edit-dialog.tsx` — Vergleiche über Const-Objekt statt String-Literal

- [ ] **Step 1: Datei + Type, Service umstellen, Dialog umstellen, Typecheck, Commit**

```bash
git commit -am "refactor(leads/bulk): const-object BulkSubmitFailureKind (CR #37)"
```

### Task 3.4 — `BulkDialogKind` extrahieren (CR #39)

**Files:**

- Create: `src/common/constants/leads/bulk/bulk-dialog-kinds.ts`
- Modify: `leads-bulk-action-bar.tsx` — lokale Definition löschen, Import einfügen

- [ ] **Step 1: Erstellen, ersetzen, Commit**

```bash
git commit -am "refactor(leads/bulk): extract BulkDialogKind const-object (CR #39)"
```

### Task 3.5 — `BulkEditField` extrahieren (CR #51)

**Files:**

- Create: `src/common/constants/leads/bulk/bulk-edit-fields.ts`
- Modify: `leads-bulk-edit-dialog.tsx`

- [ ] **Step 1: Bewerten — können `BulkEditField` und `BulkEditFieldKey` (in `bulk-edit-field-keys.ts`) zusammengelegt werden?**

Nach Phase 1 (camelCase-Rename) sollte einer der beiden über Daten-Mapping hinausgehen. Wenn UI-Apply-Keys den DTO-Keys 1:1 entsprechen → ein gemeinsames Const-Objekt; falls divergent → separat.

- [ ] **Step 2: Extrahieren + ggf. mit `BulkEditFieldKey` mergen, Imports anpassen**

- [ ] **Step 3: Commit**

```bash
git commit -am "refactor(leads/bulk): extract BulkEditField const-object (CR #51)"
```

### Task 3.6 — Route-Dispatcher als `switch` mit Exhaustiveness (CR #43)

**Files:**

- Modify: `src/app/api/workspace/leads/bulk/route.ts`

- [ ] **Step 1: Pattern**

```ts
switch (parsed.data.action) {
  case LeadBulkAction.BulkEdit:
    return handleBulkEdit(parsed.data, userId);
  case LeadBulkAction.Archive:
    return handleArchive(parsed.data, userId);
  case LeadBulkAction.Delete:
    return handleDelete(parsed.data, userId);
  default: {
    const _exhaustive: never = parsed.data;
    void _exhaustive;
    return leadApiError(LeadErrorCode.Internal, 500);
  }
}
```

- [ ] **Step 2: Typecheck + Commit**

```bash
git commit -am "refactor(leads/bulk): explicit switch dispatch with exhaustiveness check (CR #43)"
```

### Task 3.7 — `hasOwn` typisieren (CR #41)

**Files:**

- Modify: `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`

```ts
function hasOwn<K extends keyof BulkEditLeadsPatch>(
  patch: BulkEditLeadsPatch,
  key: K,
): boolean {
  return Object.prototype.hasOwnProperty.call(patch, key);
}
```

- [ ] **Step 1: Funktion umstellen, alle Calls profitieren über `keyof`-Constraint**

- [ ] **Step 2: Commit**

```bash
git commit -am "refactor(leads/bulk): type-safe hasOwn keys (CR #41)"
```

### Task 3.8 — `ImprovementsListEditorContent` auslagern (CR #49)

**Files:**

- Create: `src/components/workspace/leads/shared/improvements-list-editor/improvements-list-editor-content.ts`
- Modify: `improvements-list-editor.tsx`, alle Callers

- [ ] **Step 1: Type-Definition rausziehen, importieren**

- [ ] **Step 2: Typecheck + Commit**

```bash
git commit -am "refactor(leads): extract ImprovementsListEditorContent type (CR #49)"
```

### Task 3.9 — Skip-Reason direkter Import (CR #52)

**Files:**

- Modify: `leads-bulk-edit-dialog.tsx`

```ts
import { type BulkSkipReason } from "@/common/constants/leads/bulk/bulk-skip-reasons";

function getSkipReasonLabel(
  bulkContent: LeadsBulkDictionary,
  reason: BulkSkipReason,
): string { ... }
```

- [ ] **Step 1: Tausch + Commit**

```bash
git commit -am "refactor(leads/bulk): use BulkSkipReason direct import (CR #52)"
```

---

## Phase 4 — Sicherheit / Robustheit (CR #19, #25, #35, #36, #44)

### Task 4.1 — Archive-Bypass via Bulk-Edit schließen (CR #25)

**Files:**

- Modify: `src/server/workspace/leads/api/bulk-action-schema.ts`

```ts
status: z
  .enum(CONTACT_LEAD_STATUS_VALUES)
  .refine((s) => s !== ContactLeadStatus.Archived, {
    message: LeadValidationIssueCode.BulkEditStatusArchiveDisallowed,
  })
  .optional(),
```

- Modify: i18n-Dicts (DE/EN) + `LeadValidationIssueCode` um neuen Code
- Add test: payload `{action: "bulk_edit", patch: {status: "archived"}}` → 400

- [ ] **Step 1: Schema + Issue-Code + i18n**

- [ ] **Step 2: Test + Commit**

```bash
git commit -am "fix(leads/bulk): reject archived status in bulk_edit, force archive flow (CR #25)"
```

### Task 4.2 — Activity-Insert isoliert im Catch (CR #36)

**Files:**

- Modify: `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`

```ts
await tx.update(leads).set(setClause).where(eq(leads.id, current.id));
try {
  await createLeadActivity(tx, { ... });
} catch (activityError) {
  console.error("[bulk-edit-leads] activity insert failed", {
    leadId: current.id,
    error: activityError,
  });
}
```

- [ ] **Step 1: Try/Catch um Activity-Insert, Update soll nicht zurückrollen**

- [ ] **Step 2: Test — Activity-Insert mock wirft, Update bleibt persistiert, Lead nicht in `failedLeads`**

- [ ] **Step 3: Commit**

```bash
git commit -am "fix(leads/bulk): isolate activity insert errors from lead mutation (CR #36)"
```

### Task 4.3 — `LeadsTableSelectionProvider`: key-prop statt setState-during-render (CR #44)

**Files:**

- Modify: `src/components/workspace/leads/table/leads-table-selection-provider.tsx`
- Modify: `src/app/[locale]/workspace/leads/page.tsx` (Caller)

- [ ] **Step 1: Provider — `selectionResetKey`-Prop + Effekt-Reset entfernen**

```tsx
// page.tsx
<LeadsTableSelectionProvider key={queryString} rowIds={rowIds}>
  ...
</LeadsTableSelectionProvider>
```

- [ ] **Step 2: Re-Implementierung Provider pure**

- [ ] **Step 3: Test — Wechsel `queryString` triggert Mount + Selection-Reset**

- [ ] **Step 4: Commit**

```bash
git commit -am "refactor(leads/table): selection provider remount via key prop (CR #44)"
```

### Task 4.4 — Phantom-IDs filtern + selectedLeads-Guard (CR #19, #35)

**Files:**

- Modify: `leads-table-selection-provider.tsx` — synchronisiere `selectedIds` mit `rowIds`
- Modify: `leads-bulk-action-bar.tsx` — Submit-Guard

- [ ] **Step 1: Provider — Effekt filtert ausgewählte Phantom-IDs**

```ts
useEffect(() => {
  setSelectedIds((ids) => ids.filter((id) => rowIds.includes(id)));
}, [rowIds]);
```

- [ ] **Step 2: Action-Bar — wenn `selectedLeads.length === 0` aber `selectionCount > 0`: automatisch reset + Hinweis-Toast**

- [ ] **Step 3: Test — Re-Render mit shrinkenden `rowIds` entfernt verwaiste IDs**

- [ ] **Step 4: Commit**

```bash
git commit -am "fix(leads/table): reconcile selection state with current rowIds (CR #19/#35)"
```

---

## Phase 5 — UX / Korrektheit (CR #7, #13, #14, #15, #18, #20, #22, #33, #46)

### Task 5.1 — Activity-Typ Shape-basiert (CR #15, #13, #14)

**Files:**

- Modify: `bulk-edit-leads.command-handler.ts` — wenn `changedFields === ["status"]` schreibe `StatusChange`-Activity (analog Single-Edit) mit gleicher Metadata-Shape, sonst `BulkEdit`
- Modify: `bulk-archive-leads.command-handler.ts` — bleibt `StatusChange` (bereits korrekt)
- Modify: `lead-detail-activities.tsx` — `renderBulkEdit`-Pfad ergänzen
- Modify: `bulk-edit-leads.command-handler.ts` — bei Bulk-Edit zusätzlich human-readable `body` mitschreiben

- [ ] **Step 1: Helper `buildBulkEditActivityBody(metadata, locale?)` server-seitig**

Bzw. nur structured-metadata persistieren und im UI lokalisiert rendern. Empfehlung: nur `metadata`, UI-seitig lokalisieren.

- [ ] **Step 2: Activity-Typ-Wahl im Handler**

```ts
const activityType =
  changedFields.length === 1 && changedFields[0] === BulkEditFieldKey.Status
    ? LeadActivityType.StatusChange
    : LeadActivityType.BulkEdit;
```

- [ ] **Step 3: `lead-detail-activities.tsx` — `renderBulkEdit`-Pfad**

Rendert `changedFields` als lokalisierte Liste, ggf. `before`/`after`-Diff-Anzeige.

- [ ] **Step 4: Test — bulk-edit-status-only → StatusChange-Activity; bulk-edit-multi-field → BulkEdit-Activity**

- [ ] **Step 5: Commit**

```bash
git commit -am "fix(leads/activity): shape-based activity type for bulk operations (CR #13/#14/#15)"
```

### Task 5.2 — Anwenden+leer → feldspezifischer Fehler (CR #7)

**Files:**

- Modify: `leads-bulk-edit-dialog.tsx` — Validation pro Apply-Field, ehe Patch entleert wird
- Modify: i18n-Dicts: neue Keys `notesAppendEmpty`, `improvementsAppendEmpty`

- [ ] **Step 1: Validation**

```ts
if (applyState.notesAppend && values.notesAppend.trim().length === 0) {
  setError("notesAppend", { message: bulkContent.errors.notesAppendEmpty });
  return;
}
if (applyState.improvementsAppend && values.improvementsAppend.length === 0) {
  setError("improvementsAppend", {
    message: bulkContent.errors.improvementsAppendEmpty,
  });
  return;
}
```

- [ ] **Step 2: DE + EN-Texte**

- [ ] **Step 3: Test — Dialog-Test, der Empty-Note + Anwenden erwartet, prüft inline-Error**

- [ ] **Step 4: Commit**

```bash
git commit -am "fix(leads/bulk): field-specific error for empty applied notes/improvements (CR #7)"
```

### Task 5.3 — Improvements-Cap konsistent (CR #18)

**Files:**

- Modify: `src/components/workspace/leads/form/lead-form-dialog/improvements-section/improvements-section.tsx` — `maxEntries={LeadFieldLimits.MaxImprovementsPerLead}` (oder eigene Konstante)
- Falls keine Single-Edit-Cap-Konstante existiert: neue in `src/common/constants/leads/forms/lead-field-limits.ts`

- [ ] **Step 1: Single-Edit-Editor mit `maxEntries` versorgen, gleichen Wert nutzen wie Bulk**

- [ ] **Step 2: Test — Single-Edit-Form-Test enforceed cap**

- [ ] **Step 3: Commit**

```bash
git commit -am "fix(leads/improvements): align single- and bulk-edit improvement caps (CR #18)"
```

### Task 5.4 — Activity-Metadata: angefügten Text speichern (CR #20)

**Files:**

- Modify: `bulk-edit-leads.command-handler.ts` — `metadata.notesAppendedText` (statt nur Länge), `metadata.improvementsAppendedItems`
- Modify: `bulk-edit-activity-metadata.ts` Type

- [ ] **Step 1: Metadata-Shape erweitern, alte Length-Felder behalten zur Telemetrie**

- [ ] **Step 2: Test bestätigt Inhalt persistiert**

- [ ] **Step 3: Commit**

```bash
git commit -am "fix(leads/activity): persist appended note/improvements content in bulk metadata (CR #20)"
```

### Task 5.5 — Auto-Focus-Target sinnvoll setzen (CR #22)

**Files:**

- Modify: `leads-bulk-edit-dialog.tsx`

- [ ] **Step 1: Ersten Apply-Field-Label-Button fokussieren statt Checkbox; Fallback Close-Button**

Konkret: ref auf dem Close-Button setzen, im `useLayoutEffect` `closeButtonRef.current?.focus()`.

- [ ] **Step 2: Test — `screen.activeElement` ist Close-Button bei Mount**

- [ ] **Step 3: Commit**

```bash
git commit -am "fix(leads/bulk-edit): focus close button on dialog open (CR #22)"
```

### Task 5.6 — Success-Banner-Pfad konsolidieren (CR #33)

**Files:**

- Modify: `leads-bulk-edit-dialog.tsx`
- Modify: ggf. zentrale Toast-Komponente

- [ ] **Step 1: Entscheidung — Toast-System nutzen (falls vorhanden) oder Dialog 1.5s offenhalten?**

Run: `Grep pattern "Toast"`-Suche; falls Toast-Komponente existiert → Option A.

- [ ] **Step 2a (Toast): Bei 100% Erfolg Toast einreihen, Dialog sofort schließen, Banner-State entfernen.**

- [ ] **Step 2b (Delayed close): Bei 100% Erfolg Banner zeigen, `setTimeout(onSuccessAction, 1500)`.**

- [ ] **Step 3: Test bestätigt User-Feedback im Erfolgsfall**

- [ ] **Step 4: Commit**

```bash
git commit -am "fix(leads/bulk-edit): consolidate success feedback path (CR #33)"
```

### Task 5.7 — Confirm-Dialog-Liste scrollbar statt Cap (CR #46)

**Files:**

- Modify: `leads-bulk-archive-confirm-dialog.module.css`, `leads-bulk-delete-confirm-dialog.module.css`
- Modify: zugehörige `.tsx` — `LEAD_LIST_MAX_VISIBLE` entfernen, "und N weitere"-Text entfernen
- Achtung: nach Task 6.6 (Merge der Confirm-Dialoge) nur eine Datei

- [ ] **Step 1: CSS — `max-height: 240px; overflow-y: auto`**

- [ ] **Step 2: Liste komplett rendern**

- [ ] **Step 3: Test — 100 Leads → alle DOM-präsent, Container scrollbar**

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(leads/bulk): scrollable confirm dialog lead list (CR #46)"
```

---

## Phase 6 — A11y (CR #21, #30, #31, #32, #47)

### Task 6.1 — Focus-Trap auch unter `isPending` (CR #21)

**Files:**

- Modify: `leads-bulk-edit-dialog.tsx`

- [ ] **Step 1: Logik**

```ts
if (event.key === "Escape" && isPending) {
  event.preventDefault();
  return;
}
trapDialogFocus(dialogRef, event);
```

(Tab-Handling bleibt unabhängig vom Pending-Zustand.)

- [ ] **Step 2: A11y-Test (Vitest + Testing-Library): Tab innerhalb Dialog während `isPending` bleibt innerhalb des Dialogs**

- [ ] **Step 3: Commit**

```bash
git commit -am "fix(leads/bulk-edit-dialog): keep focus trap active during pending (CR #21)"
```

### Task 6.2 — `ImprovementsListEditor` `disabled`-Prop (CR #30, #31)

**Files:**

- Modify: `improvements-list-editor.tsx` — neue Prop `disabled?: boolean`, alle internen Buttons/Inputs `disabled={disabled}`, `aria-disabled="true"`
- Modify: `leads-bulk-edit-dialog.tsx` — Prop statt CSS-Wrapper
- Modify: `improvements-list-editor.module.css` — `.disabledArea` löschen, falls obsolete

- [ ] **Step 1: Prop einführen, intern weitergeben**

- [ ] **Step 2: CSS-Wrapper im Dialog entfernen**

- [ ] **Step 3: A11y-Test — Tab-Reihenfolge überspringt disabled-Editor**

- [ ] **Step 4: Commit**

```bash
git commit -am "fix(leads/improvements): native disabled prop instead of pointer-events hack (CR #30/#31)"
```

### Task 6.3 — `addDisabled` auch bei offenem Editor (CR #32)

**Files:**

- Modify: `improvements-list-editor.tsx`

- [ ] **Step 1: Logik**

```ts
const addDisabled = maxEntries !== undefined && value.length >= maxEntries;
```

(`!editorOpen`-Branch entfernen.)

- [ ] **Step 2: Test — Plus-Button bleibt disabled, wenn Cap erreicht ist und Editor offen**

- [ ] **Step 3: Commit**

```bash
git commit -am "fix(leads/improvements): proactively disable add when max reached (CR #32)"
```

### Task 6.4 — `useId()` statt hardcoded DialogId (CR #47)

**Files:**

- Modify: `leads-bulk-delete-confirm-dialog.tsx`, `leads-bulk-archive-confirm-dialog.tsx` (bzw. nach Phase 8-Merge nur noch eine Datei)

- [ ] **Step 1: `const titleId = useId();` + `aria-labelledby={titleId}`**

- [ ] **Step 2: lokale `DialogId`-Konstante löschen**

- [ ] **Step 3: Commit**

```bash
git commit -am "fix(leads/bulk): useId for confirm dialog aria attributes (CR #47)"
```

---

## Phase 7 — CSS / Theming (CR #27, #28, #29, #34)

### Task 7.1 — Design-Tokens für Bulk-Komponenten (CR #27, #28)

**Files:**

- Modify: `src/app/globals.css` — neue CSS-Custom-Properties (`--color-surface`, `--color-surface-elevated`, `--color-text-primary`, `--color-text-muted`, `--color-border`, `--color-danger`, `--color-success`, `--color-accent`) im Light/Dark-Theme-Block
- Modify: alle Bulk-Modul-CSS-Dateien (`leads-bulk-edit-dialog.module.css`, `leads-bulk-action-bar.module.css`, `improvements-list-editor.module.css`, `leads-bulk-confirm-dialog.module.css`) — Farb-Literale durch `var(--…)` ersetzen

- [ ] **Step 1: Token-Inventar — Liste aller Farb-Literale in den 4 Modulen, deduplizieren, auf semantische Tokens mappen**

- [ ] **Step 2: Tokens in `globals.css` — Dark-Mode-Werte (bestehend) + Light-Mode-Werte ergänzen**

```css
:root[data-theme="light"] {
  --color-surface: #f7f2ec;
  --color-text-primary: #211d1a;
  ...
}
:root[data-theme="dark"] {
  --color-surface: #211d1a;
  --color-text-primary: #f7f2ec;
  ...
}
```

- [ ] **Step 3: Modul-CSS umstellen**

- [ ] **Step 4: Visuelle Verifikation in beiden Modi**

Run: `npm run dev`
Browser: `/de/workspace/leads`, Light + Dark, Bulk-Action-Bar, Bulk-Edit-Dialog, Confirm-Dialogs — Kontraste prüfen.

- [ ] **Step 5: Commit**

```bash
git commit -am "fix(theme): tokenize bulk components for light/dark mode (CR #27/#28)"
```

### Task 7.2 — `ButtonControl variant="danger"` (CR #29)

**Files:**

- Modify: `src/components/shared/button-control/button-control.tsx` (oder Pfad anpassen, falls anders)
- Modify: `leads-bulk-action-bar.tsx` — Delete-Button via `ButtonControl variant="danger"`
- Modify: `leads-bulk-archive-confirm-dialog.tsx`, `leads-bulk-delete-confirm-dialog.tsx`
- Modify: zugehörige CSS — `.deleteButton`, `.confirmButton` löschen, falls obsolete

- [ ] **Step 1: ButtonControl — danger-Variant Definition, Tests**

- [ ] **Step 2: Buttons umstellen**

- [ ] **Step 3: Commit**

```bash
git commit -am "feat(button-control): danger variant + use across bulk dialogs (CR #29)"
```

### Task 7.3 — Improvements-Section visueller Regress-Check (CR #34)

**Files:**

- Modify: `src/components/workspace/leads/form/lead-form-dialog/improvements-section/improvements-section.tsx` — ggf. Wrapper-`<section className={styles.section}>`
- Modify: re-add `improvements-section.module.css` falls Spacing-Token nötig

- [ ] **Step 1: Browser-Smoketest Single-Edit-Dialog — Vertical-Rhythm**

- [ ] **Step 2: Falls Bruch sichtbar → Wrapper + Spacing-Token aus globals.css einfügen**

- [ ] **Step 3: Commit (oder Skip mit Kommentar, falls kein Bruch)**

```bash
git commit -am "fix(leads/form): restore improvements-section spacing wrapper (CR #34)"
```

---

## Phase 8 — DRY / Refactoring (CR #16, #17, #42, #45, #50)

### Task 8.1 — `submitBulkArchive` + `submitBulkDelete` Services (CR #16)

**Files:**

- Create: `src/components/workspace/leads/table/services/leads-bulk-archive-service.ts`
- Create: `src/components/workspace/leads/table/services/leads-bulk-delete-service.ts`
- Modify: Archive/Delete-Confirm-Dialoge nutzen Service

- [ ] **Step 1: Services analog zu `submitBulkEdit` mit derselben `{ok:true,…} | {ok:false,kind}`-Form**

- [ ] **Step 2: Dialoge umbauen — kein `fetch`-Aufruf mehr inline**

- [ ] **Step 3: Tests pro Service**

- [ ] **Step 4: Commit**

```bash
git commit -am "refactor(leads/bulk): submit services for archive/delete (CR #16)"
```

### Task 8.2 — Merge Confirm-Dialoge (CR #45, fortsetzend mit 5.7 / 6.4)

**Files:**

- Create: `src/components/workspace/leads/table/leads-bulk-confirm-dialog/leads-bulk-confirm-dialog.tsx` mit Prop `variant: "archive" | "delete"`
- Create: `…/leads-bulk-confirm-dialog.module.css`
- Delete: `leads-bulk-archive-confirm-dialog.tsx`, `…delete-confirm-dialog.tsx`, deren Module
- Modify: `leads-bulk-action-bar.tsx` — eine Komponente, `action`-Prop

- [ ] **Step 1: Generische Component bauen, Texte/Service via Variant (Dictionary-Lookup)**

- [ ] **Step 2: Beide alten Dateien löschen, Tests konsolidieren**

- [ ] **Step 3: Commit**

```bash
git commit -am "refactor(leads/bulk): unify archive/delete confirm dialog (CR #45)"
```

### Task 8.3 — Form-Schema `string[]` (CR #17)

**Files:**

- Modify: `src/common/contracts/leads/forms/lead-form-values.ts` (`improvements: string[]`)
- Modify: `improvements-section.tsx` — `useFieldArray` raus, direkt `Controller` mit `value: string[]`
- Modify: alle Stellen, die `{value: string}[]` lesen/schreiben

- [ ] **Step 1: `LeadFormValues.improvements: string[]`**

- [ ] **Step 2: Mapping-Wrapper entfernen, Default-Values anpassen**

- [ ] **Step 3: Test — Single-Edit-Form speichert improvements korrekt**

- [ ] **Step 4: Commit**

```bash
git commit -am "refactor(leads/form): migrate improvements to string[] (CR #17)"
```

### Task 8.4 — Log-Tags als Konstanten (CR #42)

**Files:**

- Create: `src/server/workspace/leads/command-handler/bulk-edit-log-tags.ts`
- Modify: `bulk-edit-leads.command-handler.ts`

```ts
export const BulkEditLogTag = {
  PerLeadFailure: "[bulk-edit-leads] per-lead failure",
  ActivityInsertFailure: "[bulk-edit-leads] activity insert failed",
} as const;
```

- [ ] **Step 1: Konstanten, Substitution**

- [ ] **Step 2: Commit**

```bash
git commit -am "chore(leads/bulk): log-tag constants (CR #42)"
```

### Task 8.5 — TS71007 in `improvements-list-editor.tsx` (CR #50)

- [ ] **Step 1: Reproduzieren**

Run: `npm run lint`
Expected: TS71007-Meldung mit konkreter Stelle.

- [ ] **Step 2: Caller verifizieren — sind alle Konsumenten Client-Components (`"use client"`)?**

- [ ] **Step 3a (Caller sind Client → false positive): gezielter `// eslint-disable-next-line ...` mit Kommentar, warum**

- [ ] **Step 3b (Caller mischen Server/Client): `onChange` umbenennen zu `onChangeAction`**

- [ ] **Step 4: Lint grün, Commit**

```bash
git commit -am "fix(leads/improvements): resolve TS71007 lint warning (CR #50)"
```

---

## Phase 9 — Tests (CR #3, #10)

### Task 9.1 — Mock-Hygiene `mockClear` global (CR #10)

**Files:**

- Modify: `src/server/tests/workspace/leads/command-handler/bulk-edit-leads.command-handler.test.ts`

- [ ] **Step 1: `beforeEach(() => createLeadActivityMock.mockClear())`** (oder `vi.clearAllMocks()`)

- [ ] **Step 2: Pro-Test-`mockClear`-Calls entfernen**

- [ ] **Step 3: Test-Suite läuft grün, Cross-Test-Leak ausgeschlossen**

- [ ] **Step 4: Commit**

```bash
git commit -am "test(leads/bulk): global mockClear hygiene (CR #10)"
```

### Task 9.2 — Handler-Tests für Archive + Delete (CR #3)

**Files:**

- Create: `src/server/tests/workspace/leads/command-handler/bulk-archive-leads.command-handler.test.ts`
- Create: `src/server/tests/workspace/leads/command-handler/bulk-delete-leads.command-handler.test.ts`

- [ ] **Step 1: Happy-Path: 3 Leads, alle archiviert/gelöscht, korrekte Activities**

- [ ] **Step 2: Edge: leere ID-Liste, fremder User**

- [ ] **Step 3: Commit**

```bash
git commit -am "test(leads/bulk): handler tests for bulk-archive/bulk-delete (CR #3)"
```

### Task 9.3 — Mixed-Partial-Success-Test für Bulk-Edit (CR #3)

**Files:**

- Modify: `bulk-edit-leads.command-handler.test.ts`

- [ ] **Step 1: Drei Leads — einer Erfolg, einer Notes-Skip, einer Unknown (Activity wirft)**

Erwartung: `updatedCount = 1`, `failedLeads.length = 2`, Reasons korrekt.

- [ ] **Step 2: Commit**

```bash
git commit -am "test(leads/bulk-edit): mixed partial success coverage (CR #3)"
```

### Task 9.4 — Component-Tests (CR #3)

**Files:**

- Create: `leads-bulk-action-bar.test.tsx`
- Create: `leads-bulk-edit-dialog.test.tsx`
- Create: `leads-bulk-confirm-dialog.test.tsx` (Archive- und Delete-Variant)
- Create: `improvements-list-editor.test.tsx`

- [ ] **Step 1: Pro Component — Render, Interaction (Submit/Cancel), A11y-Snapshot (`aria-*`)**

- [ ] **Step 2: Commit pro Test-File (kleinere Diffs)**

```bash
git commit -am "test(leads/bulk): component coverage for action bar, dialogs, editor (CR #3)"
```

### Task 9.5 — Issue-Code-Assertion in Bulk-Route-Test (CR #3)

**Files:**

- Modify: `src/server/tests/workspace/leads/api/leads-bulk-route.test.ts`

- [ ] **Step 1: Leere-Patch-Test prüft `response.body.details.issues[0].code === LeadValidationIssueCode.BulkEditEmptyPatch`**

- [ ] **Step 2: Commit**

```bash
git commit -am "test(leads/bulk): assert BulkEditEmptyPatch issue code (CR #3)"
```

---

## Phase 10 — Doku / Tech-Debt (CR #8, #23)

### Task 10.1 — `lead-form-values.ts` snake_case Eintrag in ARCHITECTURE-open-items (CR #23)

**Files:**

- Modify: `ARCHITECTURE-open-items.md`

- [ ] **Step 1: Eintrag — File, Regel-Verweis (`src/common/CLAUDE.md` camelCase-DTO-Pflicht), Risk, Next-Step (Migrationsticket)**

- [ ] **Step 2: Commit**

```bash
git commit -am "docs: track lead-form-values snake_case migration (CR #23)"
```

### Task 10.2 — Bulk-Performance-Optimierung dokumentieren (CR #8)

- [ ] **Step 1: Entscheidung — jetzt umsetzen oder dokumentieren?**

Recommendation: dokumentieren. Aktueller User-Pfad mit ≤200 Leads pro Submit ist ok, Latenz-Optimierung kommt mit Replikat oder Batch-API.

- [ ] **Step 2: ARCHITECTURE-open-items-Eintrag — Per-Lead-Tx-Sequenz, mögliche Optimierung Pre-Fetch + Per-Lead-Tx**

- [ ] **Step 3: Commit**

```bash
git commit -am "docs: track bulk-edit roundtrip optimisation backlog (CR #8)"
```

---

## Phase 11 — Final Gate

- [ ] **Step 1: Full Verification**

Run: `npm run typecheck`
Run: `npm run lint`
Run: `npm run test -- --run`
Run: `npm run build`

Expected: alle grün.

- [ ] **Step 2: Browser-Smoketest (Dev-Server)**

Run: `npm run dev`
Manuell: Bulk-Edit-Dialog (Erfolg + Partial-Success), Bulk-Archive, Bulk-Delete, Light/Dark-Mode, Tab-Reihenfolge, Screen-Reader-Stichprobe.

- [ ] **Step 3: Migration-Validation**

Run: `npm run db:migrate:dev` (falls neue Migration aus #25 etc. dazugekommen wäre — sollte nicht der Fall sein, da nur Code-Änderungen)

- [ ] **Step 4: `deletable/CR.md` als done markieren oder löschen, kurze Zusammenfassung im PR**

- [ ] **Step 5: Final Commit + PR**

Branch ist bulk-edit; PR gegen master.

---

## Konvention für Sub-Skills

Pro Task gilt:

- Neue Features / nicht-triviales Refactor: `superpowers:test-driven-development` (Red → Green → Refactor)
- Bugfixes mit Repro-Test: `superpowers:systematic-debugging` zuerst, dann TDD
- Pre-Commit pro Task: `superpowers:verification-before-completion` (npm run typecheck + die für die Datei relevanten Tests)
- Vor Merge: `superpowers:requesting-code-review` für die Gesamtveränderung
