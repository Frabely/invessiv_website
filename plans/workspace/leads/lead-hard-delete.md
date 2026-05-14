# Lead Hard-Delete — Plan

## Context

Die Workspace-Leads-Tabelle hat aktuell pro Row nur einen Edit-Button. Es gibt keine Möglichkeit, einen Lead aus der UI
zu löschen oder gezielt zu archivieren. Der DELETE-Endpoint unter `src/app/api/workspace/leads/[id]/route.ts` existiert
zwar, ruft aber `updateLead({ lead_status: Archived })` auf — DELETE wird also semantisch als "Archive" missbraucht. Die
clientseitige `leadsService.deleteLead`-Funktion ist exportiert, wird aber nirgendwo in der UI aufgerufen.

**Ziel:** Pro Row ein Mülleimer-Icon (FontAwesome `faTrash`). Klick öffnet einen Confirm-Dialog mit drei Optionen:

1. **Abbrechen** — schließt den Dialog ohne Aktion.
2. **Archivieren** — setzt `lead_status` über den bestehenden PATCH-Endpoint auf `Archived` (bei bereits-archivierten
   Leads ausgeblendet).
3. **Wirklich löschen** — Hard-Delete: Lead wird physisch aus der DB entfernt. Abhängige Records (`lead_activities`,
   `lead_social_profiles`, `lead_submissions`) sind via FK `onDelete: cascade` bereits korrekt verknüpft und werden
   mitgelöscht.

**Architektur-Eintrag:** API-Endpoint → neuer Command-Handler `deleteLead` → Drizzle `delete().returning()`. Damit ist
die Semantik wieder konsistent (DELETE = wirklich löschen).

## Betroffene Dateien

### Server-Layer

- `src/common/contracts/leads/results/delete-lead-result.ts` — **NEU** — `{ ok: true } | { ok: false; code: NotFound }`
- `src/server/workspace/leads/command-handler/delete-lead.command-handler.ts` — **NEU** — Drizzle
  `delete().returning()`, leeres Returning → `NotFound`
- `src/app/api/workspace/leads/[id]/route.ts` — **REFACTOR** — DELETE ruft jetzt `deleteLead(id)`; Response
  `{ ok: true }`

### Client-Service

- `src/components/workspace/leads/form/lead-form-dialog/leads-service.ts` — **REFACTOR** — `deleteLead` Result:
  `{ ok: true }` statt `{ ok: true; status: Archived }`

### UI

- `src/components/workspace/leads/table/leads-table-row-actions/leads-table-row-actions.tsx` — **REFACTOR** — Zweiter
  Button (`faTrash`) neben Edit
- `src/components/workspace/leads/table/leads-table-row-actions/leads-table-row-actions.module.css` — **EDIT** —
  `.buttonDestructive` rotes Hover-Styling
- `src/components/workspace/leads/table/leads-table-row/leads-table-row.tsx` — **EDIT** — Trash-Klick triggert
  Delete-Dialog
- `src/components/workspace/leads/table/leads-table/leads-table.tsx` — **EDIT** — Lokaler State `deleteTargetLead`,
  Dialog wird zentral einmal gerendert
- `src/components/workspace/leads/delete/lead-delete-confirm-dialog/lead-delete-confirm-dialog.tsx` — **NEU** —
  Confirm-Dialog mit 3 Buttons; bei `Archived` kein Archive-Button
- `src/components/workspace/leads/delete/lead-delete-confirm-dialog/lead-delete-confirm-dialog.module.css` — **NEU**

### i18n

- `src/i18n/dictionaries/workspace/leads/table/{de,en}.json` — **EDIT** — `actions.delete`
- `src/i18n/dictionaries/workspace/leads/delete/{de,en}.json` — **NEU**
- `src/i18n/dictionaries/workspace/leads/index.ts` — **EDIT** — `getLeadsDeleteDictionary(locale)`

### Tests

- `src/server/tests/workspace/leads/command-handler/delete-lead.command-handler.test.ts` — **NEU** — Happy-Path +
  NotFound

## Wiederverwendete Bausteine

- `withWorkspaceApiAuth`, `leadApiError`, `LeadErrorCode`, `HttpResponseCode`
- `trapDialogFocus` (Focus-Trap-Helper)
- `FontAwesomeIcon` + `faTrash`
- `leadsService.updateLead` (Archivieren-Pfad)
- `leadsService.deleteLead` (Hard-Delete)
- `router.refresh()` für Server-Re-Render

## Architektur-Entscheidungen

1. **DELETE-Endpoint refactoren statt neu anlegen** — wird laut Grep nirgendwo in der UI aufgerufen.
2. **Cascade ist bereits gesetzt** — `lead_activities`, `lead_social_profiles`, `lead_submissions` haben
   `onDelete: "cascade"`.
3. **Confirm-Dialog lead-spezifisch** — generischer ConfirmDialog wäre Over-Engineering.
4. **Dialog auf Tabellen-Ebene** — eine Instanz statt N Pro-Row-Instanzen.
5. **Keine neue scoped AGENTS.md/CLAUDE.md** — kein neuer Subtree.

## Verifikation

- UI: Trash-Icon pro Row sichtbar (rot Hover), öffnet Dialog
- Abbrechen: Dialog zu, kein Effekt
- Archivieren: PATCH → Status `archived`, Activity-Log neuer `StatusChange`
- Bei `lead_status === archived`: Archivieren-Button ist nicht im Dialog
- Wirklich löschen: DELETE → 200 `{ ok: true }`, Lead weg, Cascade greift
- NotFound: 404 + Error-Banner
- i18n: DE/EN-Switch synchronisiert alle neuen Strings
- `npm run typecheck`, `lint`, `build`, `test` — grün
