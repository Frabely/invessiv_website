# Bulk-Edit CR-Fixes Implementation Plan

> Ziel: Nur die Punkte enthalten, die direkt den Bulk-Edit-Flow betreffen.

**Goal:** Die relevanten Code-Review-Punkte für `bulk-edit` abarbeiten: Payload/Schema-Konsistenz, Race-Fix,
Scope-Schutz, Dead-Code im Bulk-Flow, Bulk-Edit-Dialog, Bulk-Archive/Delete, Bulk-Tests und die direkt davon abhängigen
Bulk-Helfer.

**Scope-Regel:** Keine allgemeinen Refactors, kein Single-Edit, kein globales Theming, keine Doku- oder
Tech-Debt-Aufgaben außerhalb des Bulk-Edit-Flows.

**Arbeitsreihenfolge:** Erst Blocker und Sicherheits-/Korrektheitspunkte, dann Bulk-UI, dann die dazugehörigen Tests.

---

## Phase 0 - Vorbereitung

### Task 0.1: Baseline prüfen

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test -- --run`

---

## Phase 1 - Bulk-Edit Blocker (done)

### Task 1.1 - DTO-Felder auf camelCase

Betroffene Dateien:

- `src/common/contracts/leads/bulk-edit-leads-input.ts`
- `src/server/workspace/leads/api/bulk-action-schema.ts`
- `src/app/api/workspace/leads/bulk/route.ts`
- `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`
- `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-dialog.tsx`
- `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-service.ts`
- betroffene Bulk-Edit-Tests

Ziel:

- `BulkEditLeadsPatch` auf camelCase
- Mapping auf snake_case nur im DB-`set`-Clause
- Tests und Route an die neuen DTO-Namen anpassen

### Task 1.2 - SELECT in die Transaction ziehen

Betroffene Dateien:

- `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`
- `src/server/tests/workspace/leads/command-handler/bulk-edit-leads.command-handler.test.ts`

Ziel:

- Lead-Daten innerhalb der Transaktion neu lesen
- Race zwischen Vorab-SELECT und Update vermeiden

### Task 1.3 - Workspace-Scope im `where`-Clause

Betroffene Dateien:

- `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`
- `src/server/workspace/leads/command-handler/bulk-archive-leads.command-handler.ts`
- `src/server/workspace/leads/command-handler/bulk-delete-leads.command-handler.ts`
- `src/app/api/workspace/leads/bulk/route.ts`
- Bulk-Tests dazu

Ziel:

- Bulk-Mutationen nur auf Leads des aktuellen Users anwenden
- Fremde Leads werden nicht mutiert

### Task 1.4 - Re-Export entfernen

Betroffene Dateien:

- `src/server/workspace/leads/api/bulk-action-schema.ts`
- `src/app/api/workspace/leads/bulk/route.ts`

Ziel:

- `LeadBulkAction` direkt importieren
- Kein unnötiger Re-Export-Layer im Bulk-API-Pfad

---

## Phase 2 - Bulk-Dead-Code entfernen (done)

### Task 2.1 - `BulkSkipReason.ImprovementTooLong` entfernen

Betroffene Dateien:

- `src/common/constants/leads/bulk/bulk-skip-reasons.ts`
- `src/i18n/dictionaries/workspace/leads/bulk/de.json`
- `src/i18n/dictionaries/workspace/leads/bulk/en.json`
- alle Bulk-Edit-Renderpfade, falls noch referenziert

Ziel:

- Nicht mehr erreichbaren Skip-Reason aus dem Bulk-Flow entfernen

### Task 2.2 - `leadsService.bulkEditLeads` entfernen

Betroffene Dateien:

- `src/components/workspace/leads/form/lead-form-dialog/leads-service.ts`
- `src/components/workspace/leads/form/lead-form-dialog/leads-service.test.ts`

Ziel:

- Nicht mehr genutzten Bulk-Edit-Client-Helper entfernen
- Nur dann behalten, falls tatsächlich noch ein aktiver Konsument existiert

---

## Phase 3 - Bulk-Dialog und Bulk-Status-Korrektheit (done)

### Task 3.1 - Archive-Bypass in `bulk_edit` verhindern

Betroffene Dateien:

- `src/server/workspace/leads/api/bulk-action-schema.ts`
- zugehörige Bulk-Edit-Fehlertexte
- Bulk-Route-Test für `status: archived`

Ziel:

- `bulk_edit` darf nicht den Archive-Pfad umgehen

### Task 3.2 - Bulk-Edit Status-Only als StatusChange behandeln

Betroffene Dateien:

- `src/server/workspace/leads/command-handler/bulk-edit-leads.command-handler.ts`
- `src/components/workspace/leads/table/lead-detail-activities.tsx`
- Bulk-Edit-Tests

Ziel:

- Reine Status-Änderungen als `StatusChange` persistieren
- Mehrfeld-Bulk-Änderungen bleiben `BulkEdit`

### Task 3.3 - Feldspezifische Fehler bei leeren angewendeten Textfeldern

Betroffene Dateien:

- `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-dialog.tsx`
- Bulk-Edit-Dictionaries
- Dialog-Tests

Ziel:

- Wenn ein Feld angewendet wird, aber leer bleibt, soll der Fehler pro Feld erscheinen

### Task 3.4 - Bulk-Edit Fokus- und Pending-Verhalten

Betroffene Dateien:

- `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-dialog.tsx`
- Dialog-Tests

Ziel:

- Sinnvoller Fokus beim Öffnen
- Fokus-Trap bleibt während Pending aktiv

### Task 3.5 - Success-Feedback im Bulk-Edit-Dialog

Betroffene Dateien:

- `src/components/workspace/leads/table/leads-bulk-edit-dialog/leads-bulk-edit-dialog.tsx`

Ziel:

- Erfolgspfad konsistent und ohne doppelte Banner-Logik

---

## Phase 4 - Bulk-Action-Bar und Bulk-Confirm-Dialoge (done)

### Task 4.1 - Selection-State korrekt halten

Betroffene Dateien:

- `src/components/workspace/leads/table/leads-table-selection-provider.tsx`
- `src/components/workspace/leads/table/leads-bulk-action-bar.tsx`
- Selection-Tests

Ziel:

- Verwaiste IDs aus der Bulk-Selection entfernen
- Submit nur mit gültiger Selection erlauben

### Task 4.2 - Archive/Delete-Confirm-Dialoge korrigieren

Betroffene Dateien:

- `src/components/workspace/leads/table/leads-bulk-archive-confirm-dialog.tsx`
- `src/components/workspace/leads/table/leads-bulk-delete-confirm-dialog.tsx`
- zugehörige CSS-Dateien
- zugehörige Tests

Ziel:

- Dialoge korrekt zugänglich machen
- Listen scrollbar statt gekappt
- IDs und aria-Attribute sauber behandeln

### Task 4.3 - Bulk-Submit-Services für Archive/Delete

Betroffene Dateien:

- `src/components/workspace/leads/table/services/leads-bulk-archive-service.ts`
- `src/components/workspace/leads/table/services/leads-bulk-delete-service.ts`
- Archive/Delete-Dialoge
- Service-Tests

Ziel:

- Konsistente Submit-Logik für Bulk-Archive und Bulk-Delete

---

## Phase 5 - Bulk-Tests

### Task 5.1 - Command-Handler-Tests für Bulk-Archive und Bulk-Delete

Betroffene Dateien:

- `src/server/tests/workspace/leads/command-handler/bulk-archive-leads.command-handler.test.ts`
- `src/server/tests/workspace/leads/command-handler/bulk-delete-leads.command-handler.test.ts`

### Task 5.2 - Bulk-Edit-Handler-Tests erweitern

Betroffene Dateien:

- `src/server/tests/workspace/leads/command-handler/bulk-edit-leads.command-handler.test.ts`

Ziel:

- Partial-Success, Skip-Reasons und Unknown-Fälle sauber absichern

### Task 5.3 - Route-Test absichern

Betroffene Dateien:

- `src/server/tests/workspace/leads/api/leads-bulk-route.test.ts`

Ziel:

- Issue-Codes und Bulk-Action-Verhalten explizit prüfen

### Task 5.4 - Component-Tests für Bulk-UI

Betroffene Dateien:

- `leads-bulk-action-bar.test.tsx`
- `leads-bulk-edit-dialog.test.tsx`
- `leads-bulk-confirm-dialog.test.tsx`

Ziel:

- Rendering, Interaktionen und Accessibility der Bulk-UI absichern

---

## Phase 6 - Final Gate

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test -- --run`
- [ ] `npm run build`

Expected: alles grün.
