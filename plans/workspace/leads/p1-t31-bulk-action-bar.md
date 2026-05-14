# P1-T31 — Bulk-Action-Bar + Bulk-Edit-Dialog (überarbeiteter Plan)

> **Übergeordneter Plan:** `plans/workspace/leads/01-list-and-detail.md`, Ticket P1-T31
> **Branch:** `feat/workspace-lead-section` (bestehend)
> **Skill für Implementierung:** `frontend-design:frontend-design` + `superpowers:test-driven-development`

---

## Context

Der ursprüngliche P1-T31-Plan war auf einen schlanken Bulk-Status-Setter

- Archive-Confirm zugeschnitten (zwei Server-Actions, eine einzige
  Sticky-Toolbar mit einem Status-Dropdown). Seit der ursprünglichen
  Planung sind drei Dinge dazugekommen:

1. **Fachlicher Scope ist größer geworden:** Bulk-Mutationen sollen
   zusätzlich Kategorie, Score, Owner, Notizen (anhängen) und
   Verbesserungen (anhängen) abdecken. Plus Hard-Delete und Archivieren
   als eigenständige destruktive Aktionen.
2. **Partial-Success-Semantik:** Pro Lead transaktional — wenn die
   Notiz-Verlängerung das 5000-Zeichen-Limit überschreitet, wird **der
   ganze Lead übersprungen** (auch alle anderen Feld-Änderungen). Skips
   werden Nutzer-freundlich mit Display-Name zurückgemeldet.
3. **Mehrfach-Verwendung der Improvements-Logik:** Die im Single-Edit
   bereits gute Improvements-List-Editor-UI wird in eine
   wiederverwendbare Shared-Komponente extrahiert und im
   Bulk-Edit-Dialog erneut benutzt.

Recherche-Ergebnis zur UX-Frage (Toolbar vs. Dialog): Bei 6+
Edit-Feldern + 2 destruktiven Aktionen ist Dialog-only der
CRM-Industriestandard (HubSpot, Pipedrive, Salesforce Lightning,
Airtable). Toolbar bleibt schlank mit den drei Whole-Row-Aktionen
(Bearbeiten… / Archivieren / Löschen) + Clear. Keine Feld-Doppelung
zwischen Toolbar und Dialog.

Ergebnis nach Umsetzung: Sticky-Bar erscheint bei ≥1 selektiertem Lead.
„Bearbeiten…" öffnet einen Bulk-Edit-Dialog mit per-Feld
Anwenden-Checkboxen für Status / Kategorie / Score / Owner /
Notiz-Append / Verbesserungen-Append. „Archivieren" und „Löschen"
öffnen jeweils Confirm-Dialoge mit Display-Name-Vorschau.
Partial-Success-Skips werden inline im Bulk-Edit-Dialog mit Display-Name

- Grund gezeigt.

---

## Architektur-Entscheidungen (final, aus Brainstorming)

| #   | Entscheidung                                                                                                              | Begründung                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | **Dialog für Feld-Edits, Toolbar nur für Whole-Row-Aktionen** (Archivieren, Löschen, Bearbeiten…, Auswahl aufheben)       | CRM-Standard, skaliert besser auf 6+ Felder + Mobile, ein Submit-Roundtrip pro Mehrfeld-Edit |
| 2   | **Per-Feld `Anwenden`-Checkbox im Dialog**                                                                                | Eindeutig: leer + Anwenden=true = `null` (Clear), nicht-anwenden = unverändert               |
| 3   | **Improvements: List-Editor mit `+ Eintrag hinzufügen`** wiederverwendet aus Single-Edit                                  | Konsistente Single/Bulk-UX, pro-Eintrag-500-Zeichen-Validation, einzeln entfernbar           |
| 4   | **Delete: Hard-Delete mit Confirm + Display-Name-Liste**                                                                  | Spiegelt `lead-delete-confirm-dialog`, Sichtbarkeit was gelöscht wird                        |
| 5   | **Owner: Freitext, leer + Anwenden=true clearet auf `null`**                                                              | Konsistent mit Single-Edit, kein neuer Datasource-Pfad                                       |
| 6   | **Notiz-Append: Newline nur, wenn bestehende Notiz nicht leer**                                                           | `<alt>\n<neu>` bzw. `<neu>` — keine führenden Leerzeilen bei leeren Leads                    |
| 7   | **Partial-Success: inline im Dialog mit Skip-Liste (Display-Name + Grund)**                                               | Voll sichtbar, kein Toast-Verlust, Dialog bleibt offen für Review                            |
| 8   | **Activity-Log: ein `BulkEdit`-Eintrag pro Lead pro Submit** mit JSON-Metadata (`changedFields`, structured values)       | Audit-fähig, kein Log-Spam, UI-Rendering locale-aware                                        |
| 9   | **Score-Clear + Owner-Clear via Anwenden=true + leer = `null`**                                                           | Erlaubt explizites Zurücksetzen, kein eigener Clear-Button nötig                             |
| 10  | **Improvements-List-Editor als Shared-Component** unter `src/components/workspace/leads/shared/improvements-list-editor/` | Eine Codepfad, verwendet von Single- und Bulk-Edit                                           |
| 11  | **Archive + Delete sind separate API-Actions** (nicht Teil von `bulk_edit`)                                               | Verschiedene Semantik (destruktiv, immer all-or-nothing, eigene Confirm-UX)                  |
| 12  | **`set_status` wird in `bulk_edit` aufgelöst** (Status ist optionales Feld in `bulk_edit`)                                | Schmaleres Schema, eine Action für Mehrfeld-Edits                                            |

---

## Diff zum ursprünglichen Plan (was bleibt / was ändert sich)

**Bleibt:**

- `selectionResetKey` als neue Prop im `LeadsTableSelectionProvider`
- Sticky-Position der Bar (fixed, viewport-bottom, mobile-responsive)
- Existierender Endpoint-Pfad `/api/workspace/leads/bulk`
- Existierende Test-Patterns (`leads-toolbar.test.tsx` als Vorlage)
- Existierende Dictionary-Loader-Konvention
- DE+EN parallel, alle Strings aus JSON

**Ändert sich:**

- Toolbar enthält **keinen** Status-Dropdown mehr — nur Buttons:
  `[Bearbeiten…] [Archivieren] [Löschen] [Auswahl aufheben]`
- Neuer **Bulk-Edit-Dialog** mit 6 Anwenden-Checkbox-Sektionen
- API-Schema: `set_status` → ersetzt durch erweiterte `bulk_edit`-Action; neu: `delete`-Action
- Command-Handler: Partial-Success + per-Lead-Transaktion + neuer Activity-Type `BulkEdit`
- API-Response: `{ ok, updatedCount, failedLeads: [{ id, displayName, reason }] }`
- Extraktion `ImprovementsSection` → Shared `improvements-list-editor/`-Komponente

---

## Datei-Struktur (geplant)

```
src/
├── common/constants/leads/
│   ├── activity/lead-activity-types.ts                      # EDIT (+ BulkEdit)
│   └── bulk/bulk-skip-reasons.ts                            # NEU
├── server/workspace/leads/
│   ├── api/bulk-action-schema.ts                            # EDIT (bulk_edit + delete)
│   ├── command-handler/
│   │   ├── bulk-edit-leads.command-handler.ts               # EDIT (Multi-Field + Partial-Success)
│   │   └── bulk-delete-leads.command-handler.ts             # NEU
│   └── types/bulk-edit-types.ts                             # NEU (Result-DTO)
├── app/api/workspace/leads/bulk/route.ts                    # EDIT (Dispatcher)
├── components/workspace/leads/
│   ├── shared/improvements-list-editor/                     # NEU (extrahiert)
│   │   ├── improvements-list-editor.tsx
│   │   ├── improvements-list-editor.module.css
│   │   └── improvements-list-editor.test.tsx
│   ├── form/lead-form-dialog/improvements-section/          # EDIT (Wrapper um Shared)
│   └── table/
│       ├── leads-bulk-action-bar/                           # NEU
│       │   ├── leads-bulk-action-bar.tsx
│       │   ├── leads-bulk-action-bar.module.css
│       │   └── leads-bulk-action-bar.test.tsx
│       ├── leads-bulk-edit-dialog/                          # NEU
│       │   ├── leads-bulk-edit-dialog.tsx
│       │   ├── leads-bulk-edit-dialog.module.css
│       │   └── leads-bulk-edit-dialog.test.tsx
│       ├── leads-bulk-archive-confirm-dialog/               # NEU
│       │   ├── leads-bulk-archive-confirm-dialog.tsx
│       │   └── leads-bulk-archive-confirm-dialog.module.css
│       ├── leads-bulk-delete-confirm-dialog/                # NEU
│       │   ├── leads-bulk-delete-confirm-dialog.tsx
│       │   └── leads-bulk-delete-confirm-dialog.module.css
│       ├── leads-table/leads-table.tsx                      # EDIT
│       └── leads-table-selection-provider/
│           └── leads-table-selection-provider.tsx           # EDIT
├── app/[locale]/workspace/leads/page.tsx                    # EDIT
└── i18n/dictionaries/workspace/leads/
    ├── bulk/{de,en}.json                                    # NEU (erweitert)
    └── index.ts                                             # EDIT
```

---

## Wiederverwendete Bausteine (kein Neubau)

| Baustein                                                                                            | Pfad                                                    | Wofür                              |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------- |
| `LeadsTableSelectionProvider` + Hook                                                                | `…/leads-table-selection-provider/`                     | Selection-State                    |
| `useFieldArray` + Form-Pattern aus `lead-form-dialog`                                               | `react-hook-form`                                       | Anwenden-Checkboxes + Improvements |
| Dialog-CSS-Module von `lead-form-dialog`                                                            | `…/form/lead-form-dialog/lead-form-dialog.module.css`   | Overlay, Surface, Sections, Inputs |
| `dialog-focus-trap.ts` + `createPortal`                                                             | bestehende Helper                                       | Confirm-Dialoge                    |
| `getLeadCategories()`                                                                               | `…/query-handler/list-lead-categories.query-handler.ts` | Kategorie-Dropdown                 |
| `LeadFieldLimits` (NotesMaxLength=5000, ImprovementMaxLength=500, OwnerMaxLength=120, ScoreMin/Max) | `src/common/constants/leads/forms/lead-field-limits.ts` | Validation client+server           |
| `CONTACT_LEAD_STATUS_VALUES` + `LeadsSharedDictionary.status`                                       | bestehend                                               | Status-Dropdown-Optionen + Labels  |
| `lead-api-error` Helper                                                                             | `src/lib/workspace/leads/lead-api-error.ts`             | API-Error-Responses                |
| `LeadActivityType` + `lead-activities` Drizzle-Schema                                               | bestehend                                               | Activity-Log                       |
| `lead-delete-confirm-dialog` Markup-/CSS-Pattern                                                    | `…/delete/lead-delete-confirm-dialog/`                  | Vorlage für Bulk-Confirm-Dialoge   |

---

## Backend-Schicht

### 1. ActivityType erweitern

**File:** `src/common/constants/leads/activity/lead-activity-types.ts`

```ts
export const LeadActivityType = {
  Note: "note",
  StatusChange: "status_change",
  InboundSubmission: "inbound_submission",
  Import: "import",
  BulkEdit: "bulk_edit", // NEU
} as const;
```

- `LEAD_ACTIVITY_TYPE_VALUES`-Array entsprechend ergänzen
- Drizzle-Migration prüfen: Enum-Spalte in `lead_activities.type` ist `text` mit CHECK auf `LEAD_ACTIVITY_TYPE_VALUES`.
  Migration via `drizzle-kit generate` neu erzeugen, falls Constraint regeneriert wird.

### 2. Skip-Reasons-Konstante

**File:** `src/common/constants/leads/bulk/bulk-skip-reasons.ts` (NEU)

```ts
export const BulkSkipReason = {
  NotesTooLong: "notes_too_long",
  ImprovementTooLong: "improvement_too_long",
  Unknown: "unknown",
} as const;
export type BulkSkipReason =
  (typeof BulkSkipReason)[keyof typeof BulkSkipReason];
```

Server liefert nur den Code zurück. Frontend mapped via `bulk/{de,en}.json` → human-readable Text.

### 3. Bulk-Action-Schema erweitern

**File:** `src/server/workspace/leads/api/bulk-action-schema.ts`

Aktuell: Discriminated Union `set_status` | `archive`.

Neu (`set_status` entfernt, `bulk_edit` + `delete` ergänzt):

```ts
export const LeadBulkAction = {
  BulkEdit: "bulk_edit",
  Archive: "archive",
  Delete: "delete",
} as const;

const bulkEditPatchSchema = z
  .object({
    status: z.enum(CONTACT_LEAD_STATUS_VALUES).optional(),
    category_id: z.string().uuid().nullable().optional(),
    score: z.number().int().min(0).max(100).nullable().optional(),
    owner: nullableTrimmedString(LeadFieldLimits.OwnerMaxLength).optional(),
    notes_append: z
      .string()
      .min(1)
      .max(LeadFieldLimits.NotesMaxLength)
      .optional(),
    improvements_append: z
      .array(z.string().min(1).max(LeadFieldLimits.ImprovementMaxLength))
      .max(20) // sanity-cap
      .optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "BULK_EDIT_EMPTY_PATCH",
  });

export const leadBulkActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(LeadBulkAction.BulkEdit),
    ids: z.array(z.string().uuid()).min(1).max(200),
    patch: bulkEditPatchSchema,
  }),
  z.object({
    action: z.literal(LeadBulkAction.Archive),
    ids: z.array(z.string().uuid()).min(1).max(200),
  }),
  z.object({
    action: z.literal(LeadBulkAction.Delete),
    ids: z.array(z.string().uuid()).min(1).max(200),
  }),
]);
```

### 4. Command-Handler — Multi-Field-Bulk-Edit mit Partial-Success

**File:** `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts` (REWRITE)

Algorithmus (in einer Drizzle-Transaktion, **aber per Lead in einer Sub-Transaktion** mit Try/Catch — Postgres erlaubt
`SAVEPOINT`):

```
result = { ok: true, updatedCount: 0, failedLeads: [] }
for each leadId in patch.ids:
    SAVEPOINT lead_<id>
    try:
        current = SELECT … FROM leads WHERE id = leadId
        if current.notes && patch.notes_append:
            combined = current.notes + "\n" + patch.notes_append
        elif patch.notes_append:
            combined = patch.notes_append
        else:
            combined = current.notes (unverändert)
        if combined && combined.length > 5000:
            ROLLBACK TO lead_<id>
            failedLeads.push({ id, displayName, reason: NotesTooLong })
            continue
        # improvements: jeden neuen Eintrag prüfen war Zod schon
        newImprovements = (current.improvements ?? []).concat(patch.improvements_append ?? [])
        # Build SQL SET-clause aus patch (nur gesetzte Keys)
        UPDATE leads SET … WHERE id = leadId
        INSERT INTO lead_activities (type=BulkEdit, lead_id, metadata={ changedFields, ... }, actor=user)
        updatedCount++
        RELEASE SAVEPOINT lead_<id>
    catch (err):
        ROLLBACK TO lead_<id>
        log.error({ leadId, err }, "bulk_edit per-lead failure")
        failedLeads.push({ id, displayName, reason: Unknown })
```

**Activity-Metadata-Shape:**

```jsonc
{
  "changedFields": ["status", "owner", "notes_appended", "improvements_added"],
  "before": { "status": "new", "owner": "Lisa" },
  "after": { "status": "qualified", "owner": "Moritz" },
  "notesAppendedChars": 123,
  "improvementsAddedCount": 2,
}
```

**Display-Name-Resolution für `failedLeads`:** Helper
`formatLeadDisplayName(lead)` (kleiner Helper unter
`src/server/workspace/leads/format/lead-display-name.ts`):
`displayName || companyName || trim(firstName + lastName) || email || "—"`.

**Result-DTO:** `src/server/workspace/leads/types/bulk-edit-types.ts` (NEU)

```ts
export type BulkEditLeadsResult = {
  ok: true;
  updatedCount: number;
  failedLeads: { id: string; displayName: string; reason: BulkSkipReason }[];
};
```

### 5. Command-Handler — Archive (existing, leicht refactored)

Bleibt all-or-nothing. Returns `{ ok, updatedCount }`. Activity-Type
bleibt `StatusChange` (kein BulkEdit-Event für Archive — Status-only).

### 6. Command-Handler — Bulk-Delete

**File:** `src/server/workspace/leads/command-handler/bulk-delete-leads.command-handler.ts` (NEU)

Hard-Delete in einer einzigen Transaktion. FK-Cascade auf
`lead_activities` (prüfen: bestehendes
`references(leads.id, { onDelete: "cascade" })` im
`lead-activities`-Schema). Falls nicht gesetzt, vorher
`DELETE FROM lead_activities WHERE lead_id IN (…)`.
Response: `{ ok: true, deletedCount: number }`. All-or-nothing — bei
DB-Fehler komplette Transaktion roll-backed.

### 7. API-Route Dispatcher

**File:** `src/app/api/workspace/leads/bulk/route.ts`

Discriminated-Switch auf `parsed.data.action`:

- `bulk_edit` → `bulkEditLeads(parsed.data)` → 200 mit `{ ok, updatedCount, failedLeads }`
- `archive` → `archiveLeads(parsed.data)` → 200 mit `{ ok, updatedCount }`
- `delete` → `deleteLeads(parsed.data)` → 200 mit `{ ok, deletedCount }`
- `BULK_EDIT_EMPTY_PATCH` Zod-Issue → 400 mit spezifischem Error-Code

Auth-/Authorization-Guards bleiben unverändert.

---

## Frontend-Schicht

### 1. Selection-Provider erweitern

**File:** `src/components/workspace/leads/table/leads-table-selection-provider/leads-table-selection-provider.tsx`

Erweitern um Prop `selectionResetKey: string`. Effect:
`setSelectedIds([])` bei Wechsel des Keys. Bestehende Methoden
(`toggleRow`, `toggleAll`, `clearSelection`, `isSelected`, `selectedIds`,
`selectedCount`, `allSelected`, `someSelected`) bleiben.

### 2. Shared `improvements-list-editor/` extrahieren

**Files (NEU):**

- `src/components/workspace/leads/shared/improvements-list-editor/improvements-list-editor.tsx`
- `…/improvements-list-editor.module.css`
- `…/improvements-list-editor.test.tsx`

**Schnittstelle (form-lib-agnostisch):**

```tsx
type ImprovementsListEditorProps = {
  value: string[]; // aktuelle Liste
  onChange: (next: string[]) => void; // controlled
  content: ImprovementsListEditorDictionary; // Labels, Placeholders, Validation-Messages
  maxLengthPerEntry?: number; // default LeadFieldLimits.ImprovementMaxLength
  maxEntries?: number; // default unbegrenzt (Single-Edit), Bulk setzt 20
  allowEmptyList?: boolean; // default true (Single-Edit erlaubt leer)
  emptyState?: "default" | "appendMode"; // Text-Variante: „keine vorhanden" vs. „nichts anhängen"
};
```

Komponente intern: lokaler State `pendingEntry: string`,
„Eintrag hinzufügen"-Button validiert Länge + nicht-leer, append,
propagiert via `onChange`. Edit/Remove via Buttons pro Eintrag.

**Single-Edit-Integration:** `improvements-section.tsx` wird ein dünner
React-Hook-Form-Adapter:

```tsx
<Controller
  control={control}
  name="improvements"
  render={({ field }) => (
    <ImprovementsListEditor
      value={field.value ?? []}
      onChange={field.onChange}
      content={dictionary.improvements}
      maxLengthPerEntry={LeadFieldLimits.ImprovementMaxLength}
    />
  )}
/>
```

Bulk-Edit-Integration: direkt mit `useState<string[]>([])`, kein
react-hook-form nötig (Bulk-Dialog ist klein genug).

**Dictionary-Strategie:** Single- und Bulk-Dictionaries reichen
jeweils einen kompatiblen Slice mit identischen Top-Level-Keys an die
Shared-Komponente. Keine globale Namespace-Migration nötig.

### 3. `LeadsBulkActionBar` (Toolbar)

**Files:** `…/leads-bulk-action-bar/leads-bulk-action-bar.{tsx,module.css,test.tsx}`

Verhalten:

- Hook `useLeadsTableSelection()` — wenn `selectedCount === 0` → `null`
- Lokaler State: `openDialog: "edit" | "archive" | "delete" | null`
- Buttons (Reihenfolge primary→destructive):
  - **Bearbeiten…** → öffnet `<LeadsBulkEditDialog>`
  - **Archivieren** → öffnet `<LeadsBulkArchiveConfirmDialog>`
  - **Löschen** → öffnet `<LeadsBulkDeleteConfirmDialog>` (Danger-Styling)
  - **Auswahl aufheben** (Sekundär, links) → `clearSelection()`
- Bar erhält per Prop die `rows` (`LeadRow[]`) der aktuell sichtbaren
  Tabelle — Confirm-Dialoge filtern daraus die Display-Names für
  selektierte IDs (`LeadsTable` hat `rows` heute schon, Page reicht sie
  weiter)
- Sticky-Pos: `position: fixed; bottom: clamp(…); left: 50%;
transform: translateX(-50%);` plus Mobile-Breakpoint
- Nach Erfolg jedes Sub-Dialogs: `clearSelection()` + `router.refresh()`

Wichtig: Bar selbst feuert **keine** API-Calls. Sie öffnet
Sub-Komponenten, jede kapselt ihren Fetch + Error.

### 4. `LeadsBulkEditDialog`

**Files:** `…/leads-bulk-edit-dialog/leads-bulk-edit-dialog.{tsx,module.css,test.tsx}`

Layout:

- `<dialog>` über Portal, gleiche Overlay-/Surface-Klassen wie
  `lead-form-dialog`
- Header: Titel „N Leads bearbeiten" + Close-Button
- Body — sechs Sektionen, jede mit Anwenden-Checkbox:
  1. ☐ **Status** — `<select>` mit `CONTACT_LEAD_STATUS_VALUES` ohne `archived`
  2. ☐ **Kategorie** — `<select>` aus `categories`-Prop (inkl. „Sonstige" wenn Slug `others` existiert) + Option „—
     ohne —" für `null`
  3. ☐ **Score** — `<input type="number" min=0 max=100>`; leer + Anwenden=true → `null`
  4. ☐ **Owner** — `<input type="text" maxLength=120>`; leer + Anwenden=true → `null`
  5. ☐ **Notiz anhängen** — `<textarea>` (Hinweis-Text: „Wird an bestehende Notiz angehängt. Bei Leads, deren
     Gesamtlänge 5000 Zeichen überschreitet, wird der Lead übersprungen.")
  6. ☐ **Verbesserungen anhängen** — `<ImprovementsListEditor maxEntries={20}>` im AppendMode
- Footer: `[Abbrechen]` + `[Speichern (N Leads)]` — Speichern disabled wenn 0 Anwenden-Checkboxen aktiv ODER pending
- Submit baut `patch`-Objekt aus aktivierten Sektionen, POSTet `{ action: "bulk_edit", ids: selectedIds, patch }`
- Nach Response:
  - `failedLeads.length === 0` → Dialog schließt, `clearSelection()`, `router.refresh()`
  - `failedLeads.length > 0` UND `updatedCount > 0` → Dialog bleibt offen, Erfolg-Banner + Skip-Liste; „Schließen"
    -Button schließt Dialog + `clearSelection()` + `router.refresh()`
  - `updatedCount === 0` und `failedLeads.length > 0` → Fehler-Banner statt Erfolg, sonst gleich
- Skip-Liste-Rendering:
  ```
  <ul>
    {failedLeads.map(({ id, displayName, reason }) => (
      <li key={id}>
        <strong>{displayName}</strong>: {dictionary.skipReasons[reason]}
      </li>
    ))}
  </ul>
  ```

### 5. `LeadsBulkArchiveConfirmDialog`

**Files:** `…/leads-bulk-archive-confirm-dialog/leads-bulk-archive-confirm-dialog.{tsx,module.css}`

- Confirm-Dialog mit Display-Name-Liste der ausgewählten Leads (max 10 sichtbar, danach „und N weitere")
- POST `{ action: "archive", ids: selectedIds }` → 200 erwartet
- Bei Erfolg: `clearSelection()` + `router.refresh()` + Dialog schließen
- Bei Fehler: Inline-Fehlertext im Dialog, Buttons re-enabled

### 6. `LeadsBulkDeleteConfirmDialog`

**Files:** `…/leads-bulk-delete-confirm-dialog/leads-bulk-delete-confirm-dialog.{tsx,module.css}`

Identisch zu Archive-Variante, **aber:**

- Titel-Wording „Endgültig löschen?"
- Warn-Banner: „Diese Aktion kann nicht rückgängig gemacht werden"
- Confirm-Button in `--color-danger`/Rot
- POST `{ action: "delete", ids: selectedIds }`

### 7. `LeadsTable` und `page.tsx` Integration

- `LeadsTable` bekommt zusätzliche Props: `bulkContent`, `categories` (für Bulk-Edit-Dialog). Reicht sie an
  `LeadsBulkActionBar` durch
- `page.tsx`:
  - Loader `getLeadsBulkDictionary(locale)` aufrufen
  - `categories` ist bereits geladen für Single-Edit; gleiche Datenquelle nutzen, kein Doppel-Query
  - `selectionResetKey={queryString}` an Provider (filter `create`-Param optional aus, sonst clearet Add-Dialog die
    Selection — beim Smoke-Test entscheiden)

### 8. i18n — `bulk/{de,en}.json`

Top-Level-Keys:

```jsonc
{
  "summary": { "selectedOne", "selectedMany" },
  "toolbar": { "edit", "archive", "delete", "clear" },
  "editDialog": {
    "title", "save", "cancel",
    "applyLabel",                       // "Anwenden"
    "fields": {
      "status":            { "label", "placeholder" },
      "category":          { "label", "noneOption" },
      "score":             { "label", "placeholder", "clearHint" },
      "owner":             { "label", "placeholder", "clearHint" },
      "notesAppend":       { "label", "placeholder", "hint" },
      "improvementsAppend":{ "label", "hint", "emptyState" }
    },
    "validation": { "atLeastOneField", "scoreOutOfRange" },
    "result": {
      "successBanner",                   // "{updated} von {total} Leads aktualisiert"
      "failureBannerOnly",               // wenn updatedCount=0
      "skippedHeader",                   // "Übersprungene Leads:"
      "close"
    }
  },
  "archiveConfirm": {
    "title", "messageOne", "messageMany",
    "leadListHeader", "leadListMoreSuffix",   // "und {count} weitere"
    "confirm", "cancel"
  },
  "deleteConfirm": {
    "title", "warning", "messageOne", "messageMany",
    "leadListHeader", "leadListMoreSuffix",
    "confirm", "cancel"
  },
  "skipReasons": {
    "notes_too_long":         "Notiz würde 5000 Zeichen überschreiten",
    "improvement_too_long":   "Verbesserungs-Eintrag überschreitet 500 Zeichen",
    "unknown":                "Unbekannter Fehler"
  },
  "errors": { "generic", "network" }
}
```

DE und EN parallel, identische Top-Level-Keys (Regel aus CLAUDE.md).

### 9. Dictionary-Loader

`src/i18n/dictionaries/workspace/leads/index.ts` — Loader
`getLeadsBulkDictionary` analog zu bestehenden Patterns.

---

## Tickets (Implementierungs-Reihenfolge)

| #     | Ticket                                                                                                                      | Layer             | Abhängigkeiten |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------- |
| T31.A | `BulkSkipReason`-Konstante + `LeadActivityType.BulkEdit` ergänzen + ggf. Drizzle-Migration                                  | Backend-Const     | —              |
| T31.B | `bulk-action-schema.ts` mit `bulk_edit`/`archive`/`delete` Discriminated Union                                              | Backend-Const     | T31.A          |
| T31.C | `formatLeadDisplayName` Helper extrahieren / anlegen                                                                        | Backend-Util      | —              |
| T31.D | `BulkEditLeadsResult`-Type + Rewrite `bulk-edit-leads.command-handler.ts` (SAVEPOINT + Partial-Success + BulkEdit-Activity) | Backend-Handler   | T31.A–C        |
| T31.E | `bulk-delete-leads.command-handler.ts` neu                                                                                  | Backend-Handler   | T31.B          |
| T31.F | API-Route Dispatcher erweitern                                                                                              | Backend-Route     | T31.D, T31.E   |
| T31.G | Selection-Provider `selectionResetKey` ergänzen + bestehende Tests anpassen                                                 | Frontend-Provider | —              |
| T31.H | Shared `improvements-list-editor/` anlegen + Single-Edit umverdrahten + Tests                                               | Frontend-Shared   | —              |
| T31.I | `bulk/{de,en}.json` + Loader `getLeadsBulkDictionary`                                                                       | i18n              | —              |
| T31.J | `LeadsBulkActionBar` Toolbar-Komponente + CSS + Test                                                                        | Frontend-Bar      | T31.G, T31.I   |
| T31.K | `LeadsBulkEditDialog` + CSS + Test (inkl. Skip-Liste)                                                                       | Frontend-Dialog   | T31.H, T31.I   |
| T31.L | `LeadsBulkArchiveConfirmDialog` + `LeadsBulkDeleteConfirmDialog` + CSS + Tests                                              | Frontend-Dialog   | T31.I          |
| T31.M | `LeadsTable` + `page.tsx` integrieren (selectionResetKey, bulkContent, categories)                                          | Frontend-Wire-up  | T31.G–L        |
| T31.N | Command-Handler-Tests (Partial-Success-Szenarien, BulkEdit-Activity-Erzeugung)                                              | Backend-Test      | T31.D, T31.E   |
| T31.O | E2E-Smoke (`e2e/workspace-leads-bulk.spec.ts`) — 4 Szenarien                                                                | E2E               | T31.M          |
| T31.P | Verifikation + Akzeptanz + Final-Commit                                                                                     | Gate              | alles          |

---

## Verifikation

### Statische Checks

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

### Unit-Test-Szenarien (kritisch)

**Command-Handler (`bulk-edit-leads.command-handler.test.ts`):**

1. 3 Leads, alle Felder anwenden, alle valide → `updatedCount=3, failedLeads=[]`
2. 3 Leads, einer hat bestehende Notiz (4900 Zeichen) + Append (200 Zeichen) → dieser eine in `failedLeads` mit
   `notes_too_long`, andere 2 erfolgreich; geprüft: dieser eine wurde auch in anderen Feldern NICHT mutiert
3. Anwenden-Owner=`null` + Anwenden-Status=Qualified → owner=null, status=qualified, BulkEdit-Activity mit beidem in
   `metadata.changedFields`
4. Anwenden-Notiz auf Lead mit `notes=null` → `notes = <neu>` (kein Newline-Präfix)
5. Anwenden-Notiz auf Lead mit `notes="alt"` → `notes = "alt\n<neu>"`
6. Empty patch → 400 vom Schema, Handler wird nicht erreicht
7. `improvements_append` mit 2 neuen Einträgen → `improvements = [ …current, neu1, neu2 ]`

**Bulk-Delete-Handler (`bulk-delete-leads.command-handler.test.ts`):**

1. 3 valide Leads → `deletedCount=3`, Tabelle leer
2. Cascade: `lead_activities` der gelöschten Leads sind weg

**`leads-bulk-action-bar.test.tsx`:**

1. Bar erscheint nicht bei `selectedCount=0`
2. Klick auf „Bearbeiten…" öffnet Edit-Dialog (vi-mock von Dialog-Komponente reicht)
3. Klick auf „Archivieren" öffnet Archive-Confirm
4. Klick auf „Löschen" öffnet Delete-Confirm
5. Klick auf „Auswahl aufheben" → `clearSelection` aufgerufen
6. Selection-Reset bei `selectionResetKey`-Wechsel

**`leads-bulk-edit-dialog.test.tsx`:**

1. Speichern disabled bei 0 Anwenden-Checkboxen
2. Aktivieren „Status" + Auswahl Qualified + Speichern → fetch-Body enthält `patch: { status: "qualified" }`
3. Aktivieren „Owner" + leerer Wert → fetch-Body enthält `patch: { owner: null }`
4. Server-Response mit `failedLeads.length > 0` → Skip-Liste sichtbar, Display-Names angezeigt
5. Network-Error → Fehler-Banner, Buttons re-enabled

**`leads-bulk-{archive,delete}-confirm-dialog.test.tsx`:**

1. Display-Name-Liste zeigt korrekt
2. Confirm → fetch mit richtigem Body
3. Cancel → fetch NICHT aufgerufen
4. Mehr als 10 Leads → „und N weitere"-Suffix

**`improvements-list-editor.test.tsx`:**

1. Hinzufügen leerer Eintrag → blockiert
2. Hinzufügen 501 Zeichen → Validation-Error
3. Edit + Speichern → `onChange` mit aktualisierter Liste
4. Remove → Eintrag verschwindet, `onChange` mit Liste ohne Eintrag
5. `maxEntries=20` → Button disabled bei 20 Einträgen

### Manueller Browser-Smoke

1. `npm run dev` → `/de/workspace/leads` → 3 Leads anhaken
2. **Toolbar erscheint** mit „3 Leads ausgewählt" + 4 Buttons
3. **Bearbeiten…** → Dialog öffnet → Anwenden „Status" + Qualified → Speichern
4. Liste refresht, drei Rows zeigen „Qualifiziert"
5. Bei einem Lead vorab Notiz auf 4980 Zeichen setzen → 3 Leads anhaken, Notiz-Append (50 Zeichen) → Speichern → Dialog
   zeigt „2 von 3 Leads aktualisiert" + Skip-Liste mit dem einen Display-Name + Grund „Notiz würde 5000 Zeichen
   überschreiten"
6. **Archivieren** → Confirm-Dialog mit Display-Name-Liste → Bestätigen → Rows verschwinden, `?status=archived` zeigt
   sie
7. **Löschen** → Confirm-Dialog mit Warn-Banner + Display-Name-Liste → Bestätigen → Rows weg (auch in `?status=archived`
   nicht mehr da)
8. Filter wechseln → Selection leer, Toolbar weg
9. EN-Locale (`/en/workspace/leads`) → alle Strings EN
10. Mobile DevTools 375px → Toolbar/Dialoge sauber

### Akzeptanzkriterien (aus 01-list-and-detail.md erweitert)

- [ ] Status-Wechsel sichtbar in Tabellen-Rows nach Refresh
- [ ] Archivierte Leads verschwinden aus Standardliste
- [ ] Gelöschte Leads sind nicht mehr abrufbar (auch nicht via `?status=archived`)
- [ ] Checkbox-Selection beim Filter-Change gecleared
- [ ] Kein Inline-String in `.tsx`
- [ ] DE und EN komplett
- [ ] Partial-Success: Skip-Liste mit Display-Name + Grund sichtbar
- [ ] Per-Lead-Transaktion: bei Notes-Overflow wird **kein** Feld dieses Leads geändert
- [ ] BulkEdit-LeadActivity-Einträge sichtbar im Detail-Drawer (sofern dort Activity-Feed gerendert wird; ansonsten in
      DB verifizieren)
- [ ] Shared `improvements-list-editor` von Single- und Bulk-Edit gleichermaßen genutzt

---

## Konventions-Compliance (Selbst-Check)

- ✅ Keine Inline-Strings (alles aus `bulk/{de,en}.json` + `shared/`)
- ✅ DE+EN identische Top-Level-Keys, gleicher Commit
- ✅ Component-per-Folder-Konvention für alle neuen Komponenten
- ✅ `"use client"` nur in interaktiven Komponenten (Bar, Dialoge, Editor)
- ✅ Mutationen via `/api/workspace/leads/bulk` + `router.refresh()`
- ✅ Const-Object-Pattern für `BulkSkipReason`, `LeadBulkAction`, `LeadActivityType` (kein TS-enum)
- ✅ Error-Codes + Message-Map-Pattern (Skip-Reasons als Codes, Messages in `bulk/{de,en}.json.skipReasons`)
- ✅ Contracts unter `src/common/contracts/leads/bulk/` falls Client und Server eine Result-Shape teilen; Server-only
  Types unter `src/server/workspace/leads/types/`
- ✅ Co-locierte Tests (`*.test.tsx`)
- ✅ Keine Imports aus `src/server/**` in Frontend-Komponenten
- ✅ Selection-Provider AGENTS.md-Rule 12: Reset bei Filter/Sort/Pagination

---

## Risiken / Offene Punkte

1. **Drizzle-Migration für neuen ActivityType:** falls die `type`-Column einen DB-CHECK-Constraint hat, wird die
   Migration regenerieren. `npm run db:migrate:dev` lokal prüfen — falls breaking, manuell `IF NOT EXISTS` Pattern in
   Migration anpassen.
2. **`formatLeadDisplayName` Server-Helper:** Falls nicht vorhanden, minimaler Helper. Sicherstellen, dass derselbe
   Algorithmus auch im Frontend für die Confirm-Dialoge zur Verfügung steht (oder `display_name`-Spalte aus DB nutzen,
   falls bereits berechnet).
3. **SAVEPOINT-Semantik in Drizzle:** Drizzle-`transaction` unterstützt nested transactions; Neon-Adapter sollte
   `SAVEPOINT` unterstützen (Postgres-Standard). Falls Probleme: alternative per-Lead-Strategie ohne Sub-Transaktion (
   Validate vor UPDATE, alle gültigen Leads in einem UPDATE-Batch). Performance bei 200 IDs beim ersten Ansatz prüfen.
4. **`selectionResetKey` und Add-Lead-`?create`-Param:** wie im Original-Plan vermerkt; im Smoke-Test prüfen ob
   Selection-Reset beim Öffnen des Add-Dialog störend ist. Falls ja, vor Provider-Übergabe aus `queryString` `create`
   herausfiltern.
5. **20-Improvements-Cap im Bulk-Edit:** Sanity-Cap zum Schutz vor Pathological-Inputs. Falls Nutzer mehr will,
   single-edit pro Lead.
6. **Edit-Permissions:** alle Bulk-Aktionen prüfen, ob der aktuelle Workspace-User Schreibrechte hat (gleicher Guard wie
   bisher in der bulk-route — keine neue Logik, nur sicherstellen, dass auch `delete` und `bulk_edit`-Patches gegated
   sind).

---

## Out of Scope (P1-T31)

- Keep-Selection-Across-Pages
- Bulk-Owner-Reassignment via User-Picker (heute Freitext-Owner)
- Optimistic UI-Updates
- BulkEdit-Activity-Detail-Renderer im Detail-Drawer (Activity wird in DB persistiert, aber die UI-Darstellung des
  Detail-Feeds für `bulk_edit` ist eigenes Ticket)
- Undo-Funktion für Bulk-Delete
- Audit-Tombstone für gelöschte Leads
