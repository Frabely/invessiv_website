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

---

# Code Review — Branch `bulk-edit` (Runde 4)

User-eigene Findings — komplementär zu Runde 1–3.

## Konstanten / Typen

### 37. `BulkEditSubmitFailure.kind` nutzt hardcoded String-Literale statt const-Objekt

`leads-bulk-edit-service.ts:16` definiert:

```ts
type BulkEditFailure = {
  ok: false;
  kind: "network" | "server";
};
```

Verletzt das Pflicht-Pattern aus `src/common/CLAUDE.md` (Const-Objekt-Pattern für String-Unions). Sollte:

```ts
export const BulkSubmitFailureKind = {
  Network: "network",
  Server: "server",
} as const;
export type BulkSubmitFailureKind =
  (typeof BulkSubmitFailureKind)[keyof typeof BulkSubmitFailureKind];
```

Nach `src/common/constants/leads/bulk/bulk-submit-failure-kinds.ts` auslagern. Wird im Dialog (
`leads-bulk-edit-dialog.tsx:240-243`) für die Fehlermeldungs-Wahl konsumiert — dort dann typsicher statt
String-Vergleich.

### 38. `BULK_API_ENDPOINT` gehört global, nicht pro Komponente

Verstärkung zu CR.md #11: aktuell in `leads-bulk-edit-service.ts:6`, `leads-bulk-delete-confirm-dialog.tsx:19` und
`leads-bulk-archive-confirm-dialog.tsx:19` jeweils lokal redefiniert.

Fix: nach `src/common/constants/leads/bulk/bulk-api-endpoints.ts` (oder Erweiterung einer bestehenden
API-Endpoint-Konstanten-Datei). Ein einziger Import-Pfad.

### 39. `BulkDialogKind` in `leads-bulk-action-bar.tsx` lokal definiert — auslagern

`leads-bulk-action-bar.tsx:20-26`:

```ts
const BulkDialogKind = {
  Edit: "edit",
  Archive: "archive",
  Delete: "delete",
} as const;
type BulkDialogKind = (typeof BulkDialogKind)[keyof typeof BulkDialogKind];
```

Nuance: reiner UI-State, kein API-Vertrag → könnte lokal bleiben. Wenn der Const-Objekt-Pattern aber konsequent
angewendet wird, gehört's nach `src/common/constants/leads/bulk/bulk-dialog-kinds.ts`. Bei späterer Reuse (z. B.
Deep-Link auf einen offenen Dialog via URL-Param) zahlt es sich aus.

### 40. `BulkEditActivityMetadata`, `LeadCurrentState`, `LeadUpdateSetClause` auslagern — Ort-Empfehlung

Spezialisierung von CR.md #4 mit konkretem Ort:

- `LeadCurrentState`: snake_case DB-Row-Form → `src/common/contracts/leads/rows/lead-current-state-row.ts` (passt zu
  `rows/`-Konvention aus `src/common/CLAUDE.md`)
- `LeadUpdateSetClause`: Drizzle-Insert-Partial → server-internal →
  `src/server/workspace/leads/types/lead-update-types.ts`
- `BulkEditActivityMetadata`: könnte client-relevant werden (wenn Audit-UI Metadata rendert, siehe R2#13) →
  `src/common/contracts/leads/bulk/bulk-edit-activity-metadata.ts`

---

## Code-Sauberkeit

### 41. `hasOwn(patch, "status")` hardcoded String-Keys

`bulk-edit-leads.command-handler.ts:73, 84, 96, 108`: `hasOwn(patch, "status")`, `hasOwn(patch, "category_id")` etc. —
Strings statt typsicherer Key-Referenzen. Refactor:

```ts
function hasOwn<K extends keyof BulkEditLeadsPatch>(
  p: BulkEditLeadsPatch,
  key: K,
);
```

Mit `keyof BulkEditLeadsPatch`-Constraint bricht ein Tippfehler die Compilation. Hängt mit CR.md #1 zusammen — der
camelCase-Rename macht den Refactor ohnehin nötig.

### 42. Server-Log-Strings nicht in Konstanten

`bulk-edit-leads.command-handler.ts:228`: `console.error("[bulk-edit-leads] per-lead failure", ...)`. Hardcoded String.
In Produktion läuft das wahrscheinlich in einen Log-Aggregator (Vercel Logs / Sentry); eine Konstante macht
Filter/Alerts stabil:

```ts
const LOG_TAG_BULK_EDIT_PER_LEAD = "[bulk-edit-leads] per-lead failure";
```

Eher Konvention als Bug. Aktuell scheint kein Logger-Wrapper zu existieren (kein `import { logger }`), also rein
Stil-Verbesserung.

Wichtig: Log-Strings gehören **nicht** in i18n-Dicts — Logs sind für Entwickler/Ops, nicht für End-User.

---

## Architektur / Pattern

### 43. Route-Dispatcher hat „Delete" als implizites Default

`src/app/api/workspace/leads/bulk/route.ts`:

```ts
if (action === LeadBulkAction.BulkEdit) { ...
  return
...
}
if (action === LeadBulkAction.Archive) { ...
  return
...
}
// fall-through:
const result = await bulkDeleteLeads({ids: parsed.data.ids});
```

Funktional korrekt (Zod-discriminatedUnion stellt sicher, dass `action` nur einer der drei Werte ist), aber \*
\*stilistisch gefährlich\*\*: die destruktivste Aktion (Hard-Delete) ist der Default. Wenn jemand später eine vierte Action
hinzufügt und vergisst, eine dritte `if`-Branche zu schreiben, fällt sie auf Delete durch.

Fix: explizites `switch` mit exhaustiveness-Check:

```ts
switch (parsed.data.action) {
  case LeadBulkAction.BulkEdit:
    return handleBulkEdit(...);
  case LeadBulkAction.Archive:
    return handleArchive(...);
  case LeadBulkAction.Delete:
    return handleDelete(...);
  default: {
    const _exhaustive: never = parsed.data;
    return leadApiError(LeadErrorCode.Internal, 500);
  }
}
```

Oder dispatch-Map. Beides macht die Auswahl explizit und compiler-geprüft.

### 44. `LeadsTableSelectionProvider` — setState-during-render-Pattern ist unsauber

`leads-table-selection-provider.tsx:17-25`:

```ts
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [previousResetKey, setPreviousResetKey] = useState(selectionResetKey);

if (previousResetKey !== selectionResetKey) {
  setPreviousResetKey(selectionResetKey);
  setSelectedIds([]);
}
```

Zwar React-konform (offiziell empfohlenes „Storing information from previous renders"-Pattern), aber:

1. Zwei `useState`-Hooks für eine logische Property → Hidden-State, der bei Refactors leicht übersehen wird
2. setState-during-render triggert sofortigen Re-Run derselben Komponente; sieht harmlos aus, ist aber subtil
3. Saubere Alternative: Provider per `key`-Prop von außen remounten

```tsx
<LeadsTableSelectionProvider key={queryString} rowIds={...}>
```

Deklarativ, ohne Hidden-State, idiomatischer React. Konsequenz: Provider verliert den `selectionResetKey`-Prop und wird
typsauber pure.

---

## UX / Refactoring

### 45. Archive- und Delete-Confirm-Dialog sind nahezu identisch — DRY-Verstoß

`leads-bulk-archive-confirm-dialog.tsx` (198 Zeilen) und `leads-bulk-delete-confirm-dialog.tsx` (202 Zeilen) sind
strukturell identisch:

| Aspekt          | Archive                          | Delete                                           |
| --------------- | -------------------------------- | ------------------------------------------------ |
| Props           | identisch                        | identisch                                        |
| Render-Struktur | identisch                        | identisch                                        |
| Confirm-Flow    | identisch                        | identisch                                        |
| Unterschied     | `LeadBulkAction.Archive` + Texte | `LeadBulkAction.Delete` + warning-Banner + Texte |

Fix: generischer `LeadsBulkConfirmDialog` mit `variant: "archive" | "delete"`-Prop (oder direkt `action: LeadBulkAction`
-Prop). Inhalts-Texte via Variant aus dem Bulk-Dictionary aufgelöst, Confirm-Button-Color via CSS-Variant-Class. Spart ~
150 Zeilen Code, einen identischen Test-Pfad, und reduziert die Stellen, an denen CR.md #16 (Inline-Fetch statt Service)
gleichzeitig gefixt werden muss.

### 46. `LEAD_LIST_MAX_VISIBLE = 10` Cap — empirisch gesetzt, mehrfach dupliziert

`leads-bulk-archive-confirm-dialog.tsx:21` und `leads-bulk-delete-confirm-dialog.tsx:21` definieren beide
`const LEAD_LIST_MAX_VISIBLE = 10`. Bei #45 (Merge) verschwindet die Duplikation automatisch.

Konzeptioneller Punkt: Cap an sich ist sinnvoll, damit der Confirm-Dialog bei 200 selektierten Leads nicht vertikal
explodiert. **Aber:** ein hartes Cut-off nach 10 Einträgen verbirgt Information („und 47 weitere") in genau dem Moment,
wo der User Sicherheit braucht (vor irreversiblem Delete).

Empfehlung: Cap durch eine **scrollbare Liste mit `max-height`** ersetzen (z. B. `max-height: 240px; overflow-y: auto`).
Dann sieht der User alle ausgewählten Leads (per Scroll), der Dialog bleibt kompakt, und der Confirm-Button bleibt
sichtbar. Die Konstante wird obsolet.

### 47. `DialogId` als hardcoded String — sollte `useId()` werden

`leads-bulk-delete-confirm-dialog.tsx:23-26` und `leads-bulk-archive-confirm-dialog.tsx:23-26` definieren beide:

```ts
const DialogId = {
  Title: "leads-bulk-{delete,archive}-confirm-title",
  Description: "leads-bulk-{delete,archive}-confirm-description",
} as const;
```

Diese werden für `aria-labelledby`/`aria-describedby` verwendet. Problem: wenn zwei Instanzen desselben Dialogs
gleichzeitig im DOM existieren (z. B. Storybook-Story mit zwei Beispielen, oder Modal-über-Modal-Edge-Case), kollidieren
die IDs → Screen-Reader liest die falsche Description vor.

Korrekte Lösung: **React `useId()`** statt Konstanten:

```ts
const titleId = useId();
const descriptionId = useId();
```

`useId()` produziert pro Mount eine eindeutige, SSR-stabile ID. Behebt sowohl ID-Kollision als auch Code-Duplikation.

Anmerkung: DOM-IDs sind technische Identifier, kein lokalisierbarer Text — sie gehören **nicht** in i18n-Dicts (weder
`de.json` noch `en.json`).

### 48. `lead-display-name.ts` ist überflüssige Defensive-Code-Schicht

`src/server/workspace/leads/format/lead-display-name.ts` implementiert eine Fallback-Kaskade
`display_name → company_name → first/last → email → "—"`. **Aber:**

1. `record-configuration/leads.ts:23` deklariert `display_name: text("display_name").notNull()` — DB-seitig NOT NULL.
2. `src/server/workspace/leads/shared/create-lead-core.ts:130-142` stellt server-seitig sicher, dass `display_name`
   immer aus Input-Daten zusammengesetzt und gesetzt wird, bevor INSERT.
3. Alle Lese-Pfade (`LeadSummaryDto.displayName`, `LeadDetailDto.displayName`) typisieren das Feld als `string` (
   nicht-nullable).

Trotzdem deklariert `LeadDisplayNameInput.display_name: string | null` (`lead-display-name.ts:6`) und prüft
`if (lead.display_name && lead.display_name.trim().length > 0)`. Die Fallback-Branches `company_name`/
`first_name+last_name`/`email`/`"—"` sind **unerreichbar**.

Fix: Helper löschen. Im Command-Handler direkt `current.display_name` verwenden (DB-Garantie). Falls die Skip-Liste „mit
display_name" gerendert wird, ist das ein einzeiliger Property-Access — kein Helper nötig.

### 49. `ImprovementsListEditorContent` inline im Component-File

`improvements-list-editor.tsx:16-33` exportiert den Content-Type direkt aus der Komponenten-Datei. CR.md #4 (
Inline-Typen) gilt analog für Components — der Content-Type ist eine separate Schnittstelle, die mehrere Caller (
`leads-bulk-edit-dialog.tsx`, `improvements-section.tsx`) konsumieren.

Fix: nach `src/components/workspace/leads/shared/improvements-list-editor/improvements-list-editor-content.ts`
auslagern. Die Komponenten-Datei importiert dann den Type von dort.

### 50. TS71007 in `improvements-list-editor.tsx`

User-Hinweis: TS71007 (Next.js-Linter: „Props must be serializable for client components when crossing the server/client
boundary, or function props passed from server components must follow the `*Action` naming convention") tritt in dieser
Datei auf.

Wahrscheinlicher Trigger: `onChange` und `onInteractionAction` sind Funktions-Props. Next.js' Linter erwartet bei
Server→Client-Übergaben entweder Server-Actions (mit `*Action`-Suffix) oder dass die Caller selbst Client-Components
sind. `onInteractionAction` folgt der Konvention, `onChange` nicht.

Fix-Optionen:

- `onChange` umbenennen zu `onChangeAction` — Standard-Konvention, bricht aber den HTML-`onChange`
  -Pattern-Erwartungshorizont
- Caller bestätigen, dass sie Client-Components sind (vermutlich der Fall, da `"use client"` im Editor) — dann ist der
  Lint-Fehler ein false positive und kann via `// eslint-disable-next-line` umgangen werden, mit Kommentar warum

Empfehlung: Ursache mit `npm run lint` reproduzieren und gezielt fixen statt blind unterdrücken.

---

# Code Review — Branch `bulk-edit` (Runde 5)

User-eigene Findings — komplementär zu Runde 1–4.

### 51. `BulkEditField` const-Objekt lokal im Dialog — in `common` auslagern

`leads-bulk-edit-dialog.tsx:49-58`:

```ts
const BulkEditField = {
  Status: "status",
  Category: "category",
  Score: "score",
  Owner: "owner",
  NotesAppend: "notesAppend",
  ImprovementsAppend: "improvementsAppend",
} as const;

type BulkEditField = (typeof BulkEditField)[keyof typeof BulkEditField];
```

Folgt dem Const-Objekt-Pattern, ist aber lokal eingebettet — sollte nach `src/common/constants/leads/bulk/bulk-edit-fields.ts` ausgelagert werden. Hat zusätzlichen Wert:

- **Beziehung zu `BulkEditFieldKey`** (`src/common/constants/leads/bulk/bulk-edit-field-keys.ts`): Die zwei Const-Objekte überschneiden sich semantisch (Server-Field-Keys vs. UI-Apply-Field-Keys), aber haben unterschiedliche Werte (`category_id` vs. `category`, `notes_appended` vs. `notesAppend`). Bei Umsetzung von CR.md #1 (camelCase-Rename) konvergieren sie — dann wird klar, ob sie zu **einer** geteilten Konstante zusammengelegt werden können.
- **Type-Sicherheit beim `applyState`-Record**: aktuell `Record<BulkEditField, boolean>` mit lokalem Typ. Ausgelagert können Tests + andere Caller (z. B. ein Settings-Panel für „welche Felder default-an?") denselben Type konsumieren.

Empfehlung: nach #1 (camelCase-Rename) bewerten, ob `BulkEditField` (UI) und `BulkEditFieldKey` (Activity-Metadata) ein und dasselbe Const-Objekt werden sollen. Falls ja → eine geteilte Datei. Falls nein → beide ins `common/constants/leads/bulk/` mit klarer Naming-Abgrenzung.

### 52. `BulkEditLeadsFailedLead["reason"]` — indexed-access statt direkter Type-Import

`leads-bulk-edit-dialog.tsx:107-115`:

```ts
function getSkipReasonLabel(
  bulkContent: LeadsBulkDictionary,
  reason: BulkEditLeadsFailedLead["reason"],
): string {
  const knownReason = BULK_SKIP_REASON_VALUES.find(
    (value) => value === reason,
  );
  ...
}
```

`BulkEditLeadsFailedLead["reason"]` ist eine indexed-access-Type-Auflösung — funktioniert, aber:

1. Der String-Literal `"reason"` ist ein impliziter Property-Name-Hardcode. Wenn die Property umbenannt wird, bricht es zwar zur Compile-Zeit, aber unnötige Indirektion.
2. Der eigentliche Type ist `BulkSkipReason` (aus `src/common/constants/leads/bulk/bulk-skip-reasons.ts`). Direkter Import wäre einfacher zu lesen:

```ts
function getSkipReasonLabel(
  bulkContent: LeadsBulkDictionary,
  reason: BulkSkipReason,
): string {
```

Fix: `BulkSkipReason` direkt importieren statt indexed-access über DTO.

Zweite Stelle: Falls der Code-Pfad zukünftig die Dictionary-Keys typsicher absichern soll (`bulkContent.skipReasons[resolved]`), gehört eine `Record<BulkSkipReason, string>`-Type-Constraint auf die JSON-Struktur — aktuell ist's stillschweigender Konvention, dass die JSON-Keys den Const-Werten entsprechen. Bei Hinzufügen neuer Skip-Reasons (Pflicht: in DE+EN) fällt kein Compile-Fehler, sondern nur ein Runtime-`undefined`.
