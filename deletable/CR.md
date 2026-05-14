# Code Review — Branch `bulk-edit` (Runde 1)

Scope: Bulk-Action-Bar + Bulk-Edit-Dialog + neue Archive-/Delete-Handler + API-Schema + Migration 0012 + i18n. Alle
Änderungen uncommitted auf Branch `bulk-edit`.

---

## Blocker (vor Merge fixen)

### 1. DTO-Felder verwenden snake_case — verstößt gegen `src/common/CLAUDE.md`

`src/common/contracts/leads/bulk-edit-leads-input.ts:3-10` definiert `BulkEditLeadsPatch` mit `category_id`,
`notes_append`, `improvements_append`. Pflichtregel: DTOs in `contracts/**/*.ts` müssen camelCase nutzen; snake_case ist
DB-Records vorbehalten.

Propagation:

- `src/server/workspace/leads/api/bulk-action-schema.ts` (Zod-Schema-Keys)
- `src/app/api/workspace/leads/bulk/route.ts` (JSON-Payload)
- `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-dialog.tsx:172-213` (`buildPatch`)
- `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-service.ts`

Fix: Felder umbenennen auf `categoryId`, `notesAppend`, `improvementsAppend`. Mapping nach snake_case erst im
Command-Handler im DB-`set`-Clause.

### 2. SELECT außerhalb der Transaktion — Race Condition

`src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts:215-225`: Lead-Row wird vor
`db.transaction(...)` gelesen, innerhalb der Tx ohne Row-Lock geschrieben. Paralleler Writer (z. B. Single-Edit)
zwischen SELECT und UPDATE wird stillschweigend überschrieben. Besonders kritisch bei `notes_append`: die
5000-Zeichen-Skip-Prüfung läuft gegen veraltete Notes.

Fix: SELECT in die Tx ziehen, idealerweise mit `FOR UPDATE` falls vom Drizzle/Neon-Driver-Pfad unterstützt; sonst
Re-Check + Length-Validierung innerhalb der Tx.

### 3. Fehlende Tests (gemäß Plan vorgesehen)

- Keine `*.test.tsx` für `leads-bulk-action-bar`, `leads-bulk-edit-dialog`, `leads-bulk-archive-confirm-dialog`,
  `leads-bulk-delete-confirm-dialog`, `improvements-list-editor`.
- Keine Handler-Tests für `bulkArchiveLeads` und `bulkDeleteLeads`.
- `bulk-edit-leads.command-handler.test.ts`: kein Test für **mixed partial success** (Erfolg + Notes-Skip +
  Unknown-Error im gleichen Call), kein Test für try/catch-Pfad → `failedLeads.push({ reason: Unknown })`.
- `leads-bulk-route.test.ts:181-184` assertiert `BulkEditEmptyPatch`-Issue-Code nicht explizit.

---

## Architektur / Konventionen

### 4. Inline-Typdefinitionen in Handler-Dateien

Root-CLAUDE.md: „Exported TypeScript types and interfaces are never defined inline in service or handler files."

- `src/server/workspace/leads/command-handler/bulk-archive-leads.command-handler.ts:12-14`:
  `export type BulkArchiveLeadsInput`
- `src/server/workspace/leads/command-handler/bulk-delete-leads.command-handler.ts:8-10`:
  `export type BulkDeleteLeadsInput`
- `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts:15-44`: `LeadCurrentState`,
  `LeadUpdateSetClause`, `BulkEditActivityMetadata` (`types/bulk-edit-types.ts` war im Plan vorgesehen)
- `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-service.ts:21-24`: `BulkEditSubmitInput`

### 5. `LeadBulkAction` Re-Export-Layering-Bruch

`src/server/workspace/leads/api/bulk-action-schema.ts:6` re-exportiert `LeadBulkAction` aus
`@/common/constants/leads/bulk/lead-bulk-actions`. Root-CLAUDE.md untersagt Re-Export ("no re-exporting").
`src/app/api/workspace/leads/bulk/route.ts:7` importiert dann aus dem Schema statt direkt aus den Constants.

Fix: Re-Export entfernen; Route direkt aus `@/common/constants/leads/bulk/lead-bulk-actions` importieren.

---

## Sicherheit

### 6. Keine Workspace-/Ownership-Prüfung pro Lead

`bulkEditLeads`, `bulkArchiveLeads`, `bulkDeleteLeads` operieren ungeprüft auf jeder UUID, die der Client sendet.
`withWorkspaceApiAuth` gated nur den Routenzugang, nicht die einzelnen Row-IDs.

Sobald Multi-Tenancy/RBAC eingeführt wird, ist das ein IDOR-Vektor — besonders gravierend bei `delete` (hard,
irreversibel). Empfehlung: schon jetzt Workspace-Scope im `where`-Clause hinzufügen (oder über `user.id` filtern), auch
bei single-tenant.

---

## UX / Korrektheit

### 7. „Anwenden"-Checkbox + leerer Inhalt → irreführende Fehlermeldung

`src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-dialog.tsx:201-212`: Tickt der Nutzer
„Notiz anhängen" oder „Verbesserungen anhängen", lässt den Inhalt aber leer, wird das Feld stillschweigend aus dem Patch
entfernt. Wenn das das einzige getickte Feld war, erscheint „Mindestens ein Feld zum Anwenden auswählen." — obwohl ein
Feld angewendet wurde.

Fix: feldspezifischer Fehler („Notiz-Text fehlt" / „Mindestens ein Verbesserungseintrag erforderlich").

### 8. Performance: ~3 Roundtrips pro Lead × 200 Leads = ~600 sequenzielle Neon-HTTP-Calls

Architekturentscheidung im Plan (Partial-Success per Lead), aber latenzkritisch. Optional: alle Rows in einem
`SELECT ... WHERE id = ANY($1)` vorab in den Speicher laden, dann Per-Lead-Tx — spart 200 Roundtrips.

### 9. `BulkSkipReason.ImprovementTooLong` ist toter Code

Wert ist in `src/common/constants/leads/bulk/bulk-skip-reasons.ts:3` definiert und in DE/EN-Dictionary lokalisiert, wird
aber **nirgendwo gepushed** — Zod filtert/limitiert Improvements bereits server-seitig, sodass dieser Skip-Pfad nie
erreicht wird.

Fix: entweder Skip-Logik im Handler ergänzen, oder Reason entfernen.

### 10. Test-Hygiene

`src/server/tests/workspace/leads/command-handler/bulk-edit-leads.command-handler.test.ts`:
`createLeadActivityMock.mockClear()` wird nur in zwei Tests aufgerufen. Andere Tests teilen den Mock und können
Cross-Test-Calls leaken.

### 11. Duplizierte Konstanten

- `BULK_API_ENDPOINT = "/api/workspace/leads/bulk"` in `leads-bulk-delete-confirm-dialog.tsx:19` und
  `leads-bulk-edit-service.ts:6`.
- `formatLeadDisplayName` Fallback `"—"` ist locale-frei; für DE/EN-Skip-Liste vermutlich ok, dictionary-fähig wäre
  konsistenter.

### 12. Migration 0012 (bereits gefixt in dieser Session)

`src/server/db/migrations/0012_lead_activity_type_add_bulk_edit.sql` enthielt drei Statements ohne
`--> statement-breakpoint` Marker → Neon-Treiber-Fehler "cannot insert multiple commands into a prepared statement".
Bereits behoben.

---

# Code Review — Branch `bulk-edit` (Runde 2)

Komplementäre Findings, die in Runde 1 nicht enthalten waren.

## Korrektheit / Vollständigkeit

### 13. Bulk-Edit-Activity rendert keine Audit-Information

`src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts:233-238` schreibt strukturierte
Metadaten (`changedFields`, `before`, `after`, `notesAppendedChars`, `improvementsAddedCount`), setzt aber **kein `body`
** auf den Activity-Eintrag. In
`src/components/workspace/leads/detail/lead-detail-activities/lead-detail-activities.tsx:210-214` läuft der Render-Pfad:

```tsx
activity.type === LeadActivityType.StatusChange
    ? renderStatusChange(...)
    : activity.body
        ? <p>{activity.body}</p>
        : null
```

→ Für `bulk_edit` ist `body` `undefined`, Metadata wird ignoriert → in der Lead-Detail-Timeline erscheint **nur das
Type-Label „Bulk-Edit" plus Zeitstempel**, sonst nichts. Plan-Punkt 8 („Audit-fähig, ... UI-Rendering locale-aware") ist
frontend-seitig nicht umgesetzt.

Fix: Entweder einen `renderBulkEdit`-Pfad ergänzen, der `changedFields` lokalisiert auflistet, oder den Command-Handler
einen menschenlesbaren `body` mitgeben lassen.

### 14. Bulk-Edit mit ausschließlicher Status-Änderung verliert das StatusBadge-Rendering

`renderStatusChange` läuft nur wenn `activity.type === StatusChange`. Wenn ein User per Bulk-Edit nur den Status ändert,
wird er als `bulk_edit`-Activity persistiert (siehe #13) — der schöne Badge-Übergang aus dem Single-Edit-Flow fehlt.
Semantische Inkonsistenz zwischen Single- und Bulk-Edit-Audit.

### 15. `bulkArchiveLeads` schreibt `StatusChange`-Activity, nicht `BulkEdit`

`src/server/workspace/leads/command-handler/bulk-archive-leads.command-handler.ts:50-58` nutzt
`LeadActivityType.StatusChange`. Der Bulk-Edit-Handler dagegen schreibt `BulkEdit` selbst dann, wenn der Patch nur
`status` enthält. Beide Endpunkte sind „Bulk", aber die Activity-Typen weichen ab — Filter/Audit-Reports über
`bulk_edit` blenden Archive-Aktionen aus, obwohl beide aus der gleichen UI stammen.

Fix: Entweder Archive ebenfalls auf `BulkEdit` mit speziellem Metadata-Shape, oder Bulk-Edit-Status-only auf
`StatusChange` mappen. Eine Entscheidung treffen und konsistent durchziehen.

---

## Architektur / Konsistenz

### 16. Archive-/Delete-Dialoge fetchen inline statt über Service-Layer

`src/components/workspace/leads/table/leads-bulk-archive-confirm-dialog/leads-bulk-archive-confirm-dialog.tsx:90-113`
und `src/components/workspace/leads/table/leads-bulk-delete-confirm-dialog/leads-bulk-delete-confirm-dialog.tsx:90-113`
rufen `fetch(BULK_API_ENDPOINT, ...)` direkt aus dem Dialog. Der Bulk-Edit-Dialog dagegen geht über
`leads-bulk-edit-service.ts` → `submitBulkEdit`. Asymmetrie.

Fix: `submitBulkArchive` / `submitBulkDelete` als Geschwister-Services erzeugen, dieselbe Result-Diskriminator-Form (
`{ok:true,...} | {ok:false,kind}`) liefern. Sonst sind Komponenten-Tests dieser zwei Dialoge zwangsweise an
Network-Mocks gekoppelt.

### 17. Improvements-Form-Shape vs. Editor-Shape — Impedance Mismatch

`LeadFormValues.improvements: Array<{ value: string }>` (RHF-Field-Array-Convention) vs.
`ImprovementsListEditor.value: string[]`. Der Controller-Wrapper in
`src/components/workspace/leads/form/lead-form-dialog/improvements-section/improvements-section.tsx:75-91` mappt bei
jedem Render hin und zurück:

```tsx
const values = (field.value ?? []).map((item) => item.value);
onChange = {(next)
=>
field.onChange(next.map((value) => ({value})))
}
```

Doppelte Repräsentation → zwei Fehlerquellen, zwei Stellen für Migrations.

Fix: Entweder Form-Schema auf `string[]` migrieren (Folge: `useFieldArray`-Validierung-Patterns brauchen Anpassung) oder
den Editor `Array<{value:string}>` akzeptieren lassen. Aktueller Zustand: technische Schuld, die bei jeder
Schema-Änderung doppelte Arbeit erzeugt.

### 18. Inkonsistenter Improvements-Cap zwischen Single- und Bulk-Edit

`improvements-section.tsx` (Single-Edit) übergibt **kein `maxEntries`** an `ImprovementsListEditor`. Bulk-Edit-Dialog
cappt auf 20 (`BulkEditLimits.MaxImprovementsPerRequest`). Vorher hatte das Single-Edit auch keinen Cap, also kein
Regress — aber die Diskrepanz (im Single-Edit darf der User unbegrenzt anhängen, im Bulk-Edit nicht) ist inkonsistent
und wird Support-Fragen auslösen.

---

## Edge-Cases / Subtilitäten

### 19. Selection-Race bei Re-Render ohne Query-Wechsel

`src/components/workspace/leads/table/leads-bulk-action-bar/leads-bulk-action-bar.tsx:58`:
`selectedLeads = rows.filter(row => selection.isSelected(row.id))`. Der `selectionResetKey` ist an `queryString`
gebunden (`src/app/[locale]/workspace/leads/page.tsx:221`). Wenn `queryString` unverändert bleibt (z. B. Refresh nach
Mutation, optimistischer Re-fetch ohne URL-Change), bleiben die alten IDs im Selection-State, sind aber nicht mehr in
`rows`. Dann ist `selection.selectedCount > 0` aber `selectedLeads = []` → Click auf Archive/Delete schickt `ids: []` → 400. Sticky-Bar zeigt „X Leads ausgewählt", Action schlägt fehl.

Reproduktion: Bulk-Edit mit Partial-Success → `router.refresh()` → State zeigt erfolgreichen Banner, aber im Hintergrund
könnte die Tabelle 0 Rows haben (wenn alle ausgewählten Leads das Filter-Kriterium verloren haben, z. B. Status
geändert + Status-Filter aktiv).

Fix: `LeadsBulkActionBar` sollte sich automatisch zurücksetzen, wenn
`selectedLeads.length === 0 && selection.selectedCount > 0` — oder die Action-Handler validieren
`selectedLeads.length > 0` vor Submit.

### 20. Activity-Metadata speichert Längen statt Inhalte

`buildUpdateSet` schreibt:

```ts
before.notes_length = current.notes?.length ?? 0;
after.notes_length = combined.length;
before.improvements_count =
...
;
after.improvements_count =
...
;
```

Für Audit-Zwecke ist „notes_length: 4980 → 5000" wenig aussagekräftig. Der eigentlich angefügte Text fehlt. Wenn der
Audit-Pfad Compliance-relevant ist (Plan-Wording: „Audit-fähig"), sollte zumindest der angefügte Text (oder
Preview-Hash) gespeichert werden. Sonst kann später nicht rekonstruiert werden, was eingetragen wurde.

---

## Kleinigkeiten

### 21. Focus-Trap während `isPending` deaktiviert

`leads-bulk-edit-dialog.tsx:160-166`:

```ts
if (isPending) {
    if (event.key === "Escape") event.preventDefault();
    return;  // ← skipt trapDialogFocus auch für Tab
}
trapDialogFocus(...)
```

Während ein Request läuft, springt der Tab-Fokus aus dem Dialog heraus. Buttons sind zwar disabled, aber
Browser-DevTools / Skip-Links / Browser-UI können Tab-Ziel werden. A11y-Mini-Bug — Tab-Handling sollte auch unter
`isPending` aktiv bleiben, nur Esc gesperrt.

### 22. Auto-Focus-Target im Bulk-Edit-Dialog wenig sinnvoll

`leads-bulk-edit-dialog.tsx:146-154` fokussiert den ersten Treffer aus `"input, select, textarea, button"` — das ist die
erste Apply-Checkbox („Anwenden" für Status). UX-Sicht: ein User, der den Dialog öffnet, kommt typischerweise um eine
bestimmte Aktion herein und sollte den Close-Button oder den ersten Apply-Field-Label fokussiert haben, nicht auf einer
Checkbox landen, die er noch nicht wissentlich getoggled hat.

Fix: Erste sinnvolle Action (z. B. den Close-Button als Standard).

### 23. `lead-form-values.ts` nutzt snake_case (`lead_status`, `social_profiles`)

`src/common/contracts/leads/forms/lead-form-values.ts:16-18`: `LeadFormValues` ist DTO im `contracts/leads/forms/`-Pfad.
Pflichtregel sagt camelCase für DTOs. Existierende Verletzung, die diese PR nicht eingeführt hat — aber durch die neue
camelCase-Forderung an `BulkEditLeadsPatch` (CR-Punkt 1) gerät die alte Konvention nochmal in den Fokus.

Fix: Eventuell für Tech-Debt-Liste / `ARCHITECTURE-open-items.md`.

---

# Code Review — Branch `bulk-edit` (Runde 3)

Komplementäre Findings, die in Runde 1 und 2 nicht enthalten waren.

## Korrektheit

### 24. `leadsService.bulkEditLeads` ist toter, kaputter Code

`src/components/workspace/leads/form/lead-form-dialog/leads-service.ts:182-220` definiert `bulkEditLeads`, das wird
ausschließlich in `leads-service.test.ts` referenziert — keine Produktion-Verwendung (Grep auf
`leadsService.bulkEditLeads` ergibt nur 3 Treffer, alle im Testfile).

Schlimmer: die Funktion ist **kaputt**. Sie sendet `JSON.stringify(request)` (= `{ids, patch}`) ohne `action`
-Diskriminator (`leads-service.ts:187`). Die Server-Route nutzt aber `z.discriminatedUnion("action", [...])` — würde
immer mit 400 ValidationError antworten. Der Test bemerkt das nicht, weil `fetch` gemockt wird.

Parallel existiert die korrekte Implementierung `submitBulkEdit` in
`src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-service.ts:26-53`, die
`action: LeadBulkAction.BulkEdit` mitsendet und auch tatsächlich vom Dialog genutzt wird.

Fix: `leadsService.bulkEditLeads` + zugehörige Tests + Type-Guard `isBulkEditLeadsSuccessPayload` ersatzlos entfernen.
Tot, kaputt, irreführend (zukünftige Entwickler werden den falschen Pfad konsumieren).

### 25. Bulk-Edit-Dialog kann den Archive-Flow umgehen

`leads-bulk-edit-dialog.tsx:65-67` filtert `archived` aus dem UI-Status-Dropdown:

```ts
const STATUS_OPTIONS_EXCLUDING_ARCHIVED = CONTACT_LEAD_STATUS_VALUES.filter(
  (status) => status !== ContactLeadStatus.Archived,
);
```

Server-seitig akzeptiert das Zod-Schema (`bulk-action-schema.ts`) aber `archived` weiterhin (
`z.enum(CONTACT_LEAD_STATUS_VALUES)`). Ein direkter API-Konsument (cURL, Custom-Client) kann via `action: "bulk_edit"`,
`patch: {status: "archived"}` die Archivierung durchführen — und bekommt dann eine `BulkEdit`-Activity statt der
dedizierten `StatusChange`-Activity aus dem Archive-Flow. Das macht die Activity-Type-Differenzierung (siehe #15) noch
wackliger.

Fix: Im Zod-Schema `archived` als Status-Wert ausschließen, z. B.:

```ts
status: z.enum(CONTACT_LEAD_STATUS_VALUES).refine(
    (s) => s !== ContactLeadStatus.Archived,
    {message: ...},
).optional()
```

### 26. `isBulkEditLeadsSuccessPayload`-Guard validiert `failedLeads` nicht

`leads-service.ts:246-257` prüft nur `ok === true` und `typeof updatedCount === "number"`. Wenn die API
`{ok:true, updatedCount:5, failedLeads: "garbage"}` zurückgibt (Schema-Drift, fehlerhafte Server-Antwort), greift
`payload.failedLeads ?? []` und setzt `failedLeads` auf den String. TypeScript-Typ behauptet
`BulkEditLeadsFailedLead[]`, Runtime ist String. Wenn Caller `.map`/`.length` aufruft, kommt es zu Crashes mit kaputter
Stacktrace.

Tangential zu #24 (das die ganze Funktion entfernen sollte), aber falls die Funktion erhalten bleibt:
`Array.isArray(payload.failedLeads)` ergänzen.

---

## Architektur / Konventionen

### 27. Neue CSS-Module hardcoden Farben statt Design-Tokens

Root-CLAUDE.md: „Design tokens (colors, spacing, radius) defined centrally in `globals.css`, not per-component."

Alle neuen Module-CSS-Dateien hardcoden RGBA-/Hex-Literale für Farben:

- `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-dialog.module.css`: nutzt
  `var(--workspace-header-height)` für Position, aber **alle** Farben sind Literale (`#f7f2ec`, `#86efac`, `#fca5a5`,
  `rgba(96, 148, 255, 0.4)` etc.) — Grep auf `var(--color-` → 0 Treffer.
- `src/components/workspace/leads/table/leads-bulk-action-bar/leads-bulk-action-bar.module.css`: gleiche Problematik (
  `#fff`, `rgba(217, 45, 32, 0.85)`, einziges Token: `var(--color-focus, ...)` mit Inline-Fallback).
- `src/components/workspace/leads/shared/improvements-list-editor/improvements-list-editor.module.css`: alle Farben
  hardcoded.
- Vermutlich identisch in `leads-bulk-archive-confirm-dialog.module.css` und
  `leads-bulk-delete-confirm-dialog.module.css`.

Fix: Tokens in `src/app/globals.css` als CSS-Custom-Properties definieren (z. B. `--color-surface`,
`--color-text-primary`, `--color-danger`, `--color-accent`), Komponenten via `var(--...)` referenzieren.

### 28. Light-Mode ist mit den neuen Komponenten gebrochen

Root-CLAUDE.md: „Dark mode is the default theme; light mode must also work."

Die neuen Module-CSS-Dateien arbeiten ausschließlich mit dunklen Hintergründen (`#211d1a`, `rgba(33, 29, 26, 0.72)`) und
hellen Texten (`#f7f2ec`, `rgba(247, 242, 236, 0.82)`). Im Light-Mode (über `next-themes`-Cookie umschaltbar laut
Architektur) wäre der Bulk-Edit-Dialog und die Action-Bar unleserlich: heller Text auf hellem Hintergrund oder Dark-Card
auf hellem Page-Background mit Kontrast-Bruch.

Hängt mit #27 zusammen — eine token-basierte Implementierung würde das Light-Mode-Problem automatisch lösen, sobald
`globals.css` Themed-Tokens exponiert.

### 29. Raw `<button>` statt `ButtonControl` für destruktive Aktionen

`ButtonControl` ist die zentrale Button-Komponente. Aber:

- `leads-bulk-action-bar.tsx:100-106`: Delete-Button als raw `<button className={styles.deleteButton}>`.
- `leads-bulk-delete-confirm-dialog.tsx:189-196`: Confirm-Button als raw `<button className={styles.confirmButton}>`.
- `leads-bulk-archive-confirm-dialog.tsx:185-193`: Confirm-Button als raw `<button className={styles.confirmButton}>`.

Inkonsistent zur Rest-Codebase, in der Buttons über `ButtonControl variant=...` laufen. Fokus-Styles, Disabled-State,
Hover, Loading-Spinner — alles müsste pro CSS-Module nachgebaut werden.

Fix: `ButtonControl` um eine `variant="danger"` ergänzen (falls nicht vorhanden) und überall verwenden. Oder eine
`DangerCtaButton`-Variante schaffen, analog zu `PrimaryCtaButton`.

---

## A11y

### 30. `disabledArea` deaktiviert via `pointer-events:none` — keyboard kann trotzdem fokussieren

`leads-bulk-edit-dialog.module.css:245-248`:

```css
.disabledArea {
  opacity: 0.5;
  pointer-events: none;
}
```

`leads-bulk-edit-dialog.tsx:526-531` wickelt den `ImprovementsListEditor` darin, wenn die Apply-Checkbox für
„Verbesserungen anhängen" nicht angeklickt ist. **`pointer-events:none` blockiert nur Maus-Events**, nicht Tab-Fokus
oder Keyboard-Interaktion. Ein Screen-Reader-User kann immer noch in den vermeintlich deaktivierten Editor tabben,
Einträge hinzufügen, und beim Submit werden sie ggf. mitgeschickt (weil `applyState` true wäre, wenn der User dann die
Checkbox aktiviert).

Fix: `ImprovementsListEditor` braucht eine `disabled`-Prop, die ihre internen Buttons/Inputs aktiv disabled (mit
`aria-disabled="true"` + `tabIndex={-1}`/`disabled`).

### 31. `ImprovementsListEditor` hat keine `disabled`-Prop

Folgefehler von #30. Die Komponente unter
`src/components/workspace/leads/shared/improvements-list-editor/improvements-list-editor.tsx:35-45` exponiert kein
`disabled` — der Bulk-Dialog muss visuell zu CSS-Hack greifen.

Fix: `disabled?: boolean`-Prop einführen, intern alle Buttons und das `<input>` mit `disabled={disabled}` versehen.

### 32. `improvements-list-editor` `addDisabled` greift nicht, wenn Editor offen

`improvements-list-editor.tsx:157-160`:

```ts
const addDisabled =
  !editorOpen && maxEntries !== undefined && value.length >= maxEntries;
```

Wenn der User bereits einen Editor offen hat und in einer Bulk-Session die Max-Grenze erreicht, bleibt der Plus-Button
visuell enabled — Click → `openEditor()` → reset. Inkonsistente UX. `confirmDraft` fängt's per `validation.tooMany`,
aber der Plus-Button sollte proaktiv disabled werden.

---

## UX / Visuelle Regressionen

### 33. Success-Banner im Bulk-Edit-Dialog ist toter UX-Code

`leads-bulk-edit-dialog.tsx:247-254`:

```ts
setUpdatedCount(result.updatedCount);
setFailedLeads(result.failedLeads);
setResultBannerShown(true);

if (result.failedLeads.length === 0) {
  router.refresh();
  onSuccessAction(); // ← schließt den Dialog sofort
}
```

Bei 100 %-Erfolg wird der Success-Banner state-mäßig gesetzt, aber der Dialog wird unmittelbar geschlossen — der User
sieht ihn nie. Die CSS-Klasse `.successBanner` (`leads-bulk-edit-dialog.module.css:103-112`) ist in diesem Pfad nicht
rendernd sichtbar. Der Banner ist nur im Partial-Success-Fall (failedLeads > 0, Dialog bleibt offen) sichtbar.

Fix entweder:

- Banner via Toast-System anzeigen statt Inline-Dialog-Banner, dann Dialog schließen.
- ODER Dialog bei 100 % Erfolg kurz offenhalten („1.5s, dann automatisch close") und User-Feedback geben.

Aktuell hat man die Code-Pfade für beide UX-Modelle (Toast + Inline) angelegt, aber keiner ist konsistent durchgezogen.

### 34. `improvements-section.module.css` ersatzlos gelöscht — mögliche Visual Regression

Die alte CSS-Datei
`src/components/workspace/leads/form/lead-form-dialog/improvements-section/improvements-section.module.css` wird im Diff
als gelöscht ausgewiesen. Die neue `improvements-section.tsx` rendert nur noch `<Controller>` →
`<ImprovementsListEditor>` ohne wrappende `<section>` oder eigenes Styling.

Im alten Code war die Section von `<section className={styles.section}>` umschlossen mit gap/margin-Werten, die mit
anderen Form-Sections konsistent waren. Jetzt erbt sie nur die Styles des Editors selbst — der hat ein anderes `gap`
-Spacing.

Fix: Im Browser smoke-testen, ob der Improvements-Block im Single-Edit-Dialog noch das gleiche Vertical-Rhythm hat wie
Status/Notes/Owner-Sections. Falls nicht, Wrapper-Container mit consistenten Tokens ergänzen.

---

## Robustheit

### 35. `LeadsTableSelectionProvider` synct nicht auf Row-ID-Drift

`leads-table-selection-provider.tsx`: Der Provider resetet `selectedIds` nur auf Änderung des `selectionResetKey`. Wenn
aber `rowIds` shrinkt (z. B. ein Lead wurde via Single-Delete entfernt) und `queryString` gleich bleibt, behält
`selectedIds` Phantom-IDs, die nicht mehr in `rowIds` existieren.

`toggleAll()` (Zeile 43-52) behandelt dann „allAlreadySelected" als true, sobald alle aktuellen `rowIds` in
`selectedIds` enthalten sind — auch wenn `selectedIds` zusätzliche Phantom-IDs hat. Click → leert. Aber `selectedCount`
zeigt zwischenzeitlich falsche Zahl an, weil `selectedIds.length` Phantom-IDs mitzählt.

Hängt mit R2#19 zusammen, aber technisch ein weiterer Pfad: Single-Delete in der Tabelle, ohne dass der Query-String
sich ändert.

Fix: `selectedIds` per `useEffect` (oder `useSyncExternalStore`-Pattern) gegen `rowIds` filtern, sodass Phantom-IDs
ausscheiden — aber dann bricht die Multi-Page-Selection-Semantik, falls die irgendwann gewollt ist. Designentscheidung
nötig.

### 36.

`processSingleLead` bricht bei Activity-Insert-Fehler die Transaktion ab — und der Status-Update wird rolled-back

`bulk-edit-leads.command-handler.ts:175-188`: Innerhalb der Tx läuft erst `tx.update(leads)...`, dann
`createLeadActivity(tx, ...)`. Wenn die Activity-Insertion fehlschlägt (z. B. CHECK-Constraint nach Migration-Drift),
wird **die gesamte Tx rolled-back**, der Lead-Status-Update verloren — und der äußere Catch (Zeile 234-244) pusht den
Lead als `Unknown` zum User.

Das ist eigentlich die korrekte Semantik (atomicity per Lead), aber Audit-Trail-Wert geht verloren: der Caller weiß
nicht, dass die Daten-Mutation funktioniert hätte, nur das Logging schiefging. Bei Production-Incidents (z. B. Enum-Wert
nicht migriert in Preview-DB) erscheint das wie ein Daten-Mutation-Fail, obwohl es ein Audit-Fail ist.

Fix: Activity-Insert in eigene Try/Catch ziehen, das `console.error` macht aber nicht den Lead-Update zurücknimmt.
Activity-Insert ist nicht business-critical — Lead-State-Konsistenz schon. Trade-off mit Compliance-Anforderungen
abstimmen.

---

Diese Runde fokussiert sich auf:

- **Dead/broken Code-Pfade** (#24) — kritischste neue Erkenntnis
- **Konventions-Verstöße in CSS und Theming** (#27, #28, #29)
- **A11y-Lücken** (#30, #31, #32)
- **Schmal-fokussierte UX-Bugs** (#33, #34)
- **Robustness-Edge-Cases** (#35, #36)
