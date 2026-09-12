# Task 05 — Kundendetail-Panel

> **Verbindliche Revision 2026:** Gehört zu Merge-Einheit 04. Alle Soft-/Hard-Delete-Tickets und
> `deleted_at`-Filter weiter unten entfallen vollständig.

## Verbindliche Revision

- Kundenakte bietet Bearbeiten, Archivieren und Reaktivieren; kein Papierkorb, Delete- oder
  Purge-Button.
- Archivierte Kunden bleiben intern adressierbar und sind nur in Listen standardmäßig ausgeblendet.
- Unbekannte ID liefert 404; `archived` gilt nicht als unbekannt.
- Sektionen späterer Ordner werden erst gerendert, wenn ihr Feature vollständig geliefert wurde.
- CRM-05-T4 wird „Archivieren/Reaktivieren mit Version und Activity“.
- CRM-05-T5 entfällt; Purge wird ausschließlich in Task 34 nach allen Abhängigkeiten umgesetzt.
- Branch `feat/crm-personen-und-kundenakte`.

> **Branch:** `feat/crm-kundendetail`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 04
> **Migration:** keine

## Context

Der Ort, an dem ab jetzt fast alles zusammenläuft: Ansprechpartner, Tags, Projekte, Aufgaben,
Dateien, Zugangsdaten, Chat und Timeline hängen sich in dieses Panel. Deshalb entsteht es früh und
bewusst als **Gerüst mit leeren Slots** — dieser Task füllt nur den Stammdaten-Block und das Löschen.

Wie bei den Leads gibt es **kein eigenes Route-Segment** für das Detail. Die Auswahl läuft über den
Query-Parameter `selected`, damit der Zustand teilbar und neu ladbar bleibt und die Liste im
Hintergrund erhalten bleibt.

## Entscheidungen

| Bereich               | Entscheidung                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Navigation            | Query-Parameter `selected=<uuid>`, kein Segment `/crm/[id]`                                                                                            |
| Aufbau                | Sektionsliste mit benannten Slots; jede Folge-Task füllt genau einen Slot                                                                              |
| Sektionen ohne Inhalt | Werden **nicht** gerendert (kein leeres „Coming soon" im Produktivbereich, außer bewusst gekennzeichnet)                                               |
| Archivieren           | Statuswechsel auf `archived`; reversibel über Reaktivieren                                                                                             |
| Löschen               | Keine Delete- oder Purge-Aktion in v1; Daten bleiben für Audit/Abrechnung erhalten                                                                     |
| Warum                 | Zeitbuchungen, Einreichungen und Historie bleiben nachvollziehbar; späteres Purge benötigt eine separate Datenschutzentscheidung                       |
| Aufräumen             | Kein Blob-/Cascade-Cleanup in diesem Task                                                                                                              |
| Warum eine Routine    | Postgres kann keine Blobs löschen. Ein reiner Cascade lässt die Dateien für immer liegen — und danach ist nicht mehr rekonstruierbar, wem sie gehörten |
| Layout                | Seitenpanel neben der Liste ab Tablet, Vollbild-Overlay auf Mobil                                                                                      |

## Architektur

```txt
(app)/crm/page.tsx
  ├─ listCustomers(...)                         wie Task 03
  ├─ selected ? getCustomerById(selected) : null
  └─ <CustomersPageShell detailSlot={selected ? <CustomerDetailPanel customer={...} /> : null}>

CustomerDetailPanel
  ├─ Kopf: Firma, Statusbadge, Aktionen (Bearbeiten, Archivieren/Reaktivieren)
  ├─ Slot "master-data"    ← dieser Task
  ├─ Slot "contacts"       ← Task 06
  ├─ Slot "tags"           ← Task 07
  ├─ Slot "projects"       ← Task 10
  ├─ Slot "tasks"          ← Task 11
  ├─ Slot "files"          ← Task 15
  ├─ Slot "credentials"    ← Task 18
  ├─ Slot "conversation"   ← Task 25
  ├─ Slot "retainer"       ← Task 27
  ├─ Slot "renewals"       ← Task 28
  └─ Slot "activity"       ← Task 29
```

Die Slots sind benannte Props des Panels, keine `children`-Magie — so ist im Code lesbar, welche
Sektion woher kommt, und eine fehlende Sektion ist schlicht `null`.

## Verzeichnisstruktur

```txt
apps/workspace/src/server/workspace/crm/query-handler/get-customer-by-id.query-handler.ts
apps/workspace/src/server/workspace/crm/command-handler/delete-customer.command-handler.ts
apps/workspace/src/components/workspace/crm/detail/
  customer-detail-panel/            .tsx .module.css .test.tsx
  customer-detail-section/          generische Sektionshülle mit Titel und Aktionsslot
  customer-master-data/
apps/workspace/src/server/workspace/crm/command-handler/purge-customer.command-handler.ts
apps/workspace/src/components/workspace/crm/delete/
  delete-customer-dialog/
  purge-customer-dialog/
apps/workspace/src/i18n/dictionaries/workspace/crm/detail/{de,en}.json
apps/workspace/src/i18n/dictionaries/workspace/crm/delete/{de,en}.json
```

## Tickets

### CRM-05-T1 — Detail-Query

- **Files:** `query-handler/get-customer-by-id.query-handler.ts` + Test
- **Skills:** `best-practices`, `performance`
- **Inhalt:** Kunde inklusive Kontakte laden, auf `CustomerDetailDto` mappen, unbekannte ID ergibt
  `null` (kein Wurf). Archivierte Kunden bleiben abrufbar.
- **Akzeptanz:** Unbekannte, ungültige und gelöschte UUID ergeben `null`; keine N+1-Abfrage

### CRM-05-T2 — Panel-Gerüst und Stammdaten

- **Files:** `detail/customer-detail-panel/**`, `detail/customer-detail-section/**`,
  `detail/customer-master-data/**`, `dictionaries/workspace/crm/detail/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Panel mit Kopfbereich, Sektionshülle und benannten Slots
  - Stammdaten als Definitionsliste; leere Felder werden ausgelassen, nicht als „—" gefüllt
  - Adresse als zusammenhängender Block, Website als Link mit `rel="noreferrer"`,
    Telefon und Mail als `tel:`/`mailto:`
  - Schließen über Escape, Klick auf den Hintergrund und expliziten Button
- **Akzeptanz:**
  - Fokus springt beim Öffnen ins Panel und beim Schließen zurück auf die Zeile
  - Auf Mobil als Vollbild ohne horizontales Scrollen; ab Tablet als Seitenpanel
  - Panel ist per Tastatur vollständig erreichbar, `aria-labelledby` auf die Panel-Überschrift

### CRM-05-T3 — Zeilenauswahl

- **Files:** `table/customers-table-row/**`, `lib/workspace/crm/customer-list-query-string.ts`
- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:** Zeile öffnet das Detail (als Link auf dieselbe Route mit `selected`), aktive Zeile über
  `data-selected`; die bestehenden Filter- und Seitenparameter bleiben erhalten
- **Akzeptanz:** Zurück-Taste schließt das Panel und behält Seite und Sortierung; Link ist kopierbar
  und öffnet dieselbe Ansicht

### CRM-05-T4 — Archivieren und Reaktivieren

- **Files:** `command-handler/delete-customer.command-handler.ts`,
  `api/workspace/crm/customers/[id]/route.ts` (DELETE), `delete/delete-customer-dialog/**`,
  `dictionaries/workspace/crm/delete/{de,en}.json` + Tests
- **Skills:** `best-practices`, `accessibility`, `copywriting`
- **Inhalt:**
  - `withPermission(Permission.CustomersWrite)`, setzt ausschließlich den Status
  - Bestätigungsdialog für Archivierung; Reaktivierung ohne Datenverlust
  - Nach Statuswechsel `router.refresh()` und Activity-Eintrag
- **Akzeptanz:**
  - Tests: unbekannte ID ergibt 404, fehlende Permission 403, Erfolg 204
  - Test: Archivierung blendet in der Standardliste aus, Reaktivierung macht wieder sichtbar
  - Genau ein Activity-Eintrag je Statuswechsel

### CRM-05-T5 — Entfallen in v1

- **Files:** `command-handler/purge-customer.command-handler.ts`,
  `api/workspace/crm/customers/[id]/purge/route.ts`, `delete/purge-customer-dialog/**` + Tests
- **Skills:** `best-practices`, `accessibility`, `copywriting`
- **Inhalt:**
  - Kein produktiver Endpoint und keine UI. Ein späteres Purge wird als eigener, versionierter Datenschutz-Plan
    erstellt.
- **Akzeptanz:**
  - Keine Implementierung in dieser Merge-Einheit; Datenschutz- und Blob-Reihenfolge sind in Einheit 20 spezifiziert.

## Deploy-Sicherheit

1. **Live sichtbar:** Klick auf eine Kundenzeile öffnet ein Detailpanel mit Stammdaten und den
   Aktionen Bearbeiten und Löschen; bei archivierten, gelöschten Kunden zusätzlich „Endgültig
   löschen".
2. **Bricht nichts:** keine Migration, keine Änderung an bestehenden Handlern. Die Slots für spätere
   Sektionen sind `null` und rendern nichts — kein leerer Platzhalter, keine tote Fläche.
3. **Offen:** alle weiteren Sektionen. Abgesichert dadurch, dass nicht vorhandene Sektionen gar nicht
   erst erscheinen; es gibt keinen Verweis auf noch nicht gebaute Funktionen.

## End-to-End-Akzeptanz

1. Klick auf eine Zeile öffnet das Panel, die URL enthält `selected`.
2. Neuladen der URL zeigt dieselbe Ansicht.
3. Ein unbekannter `selected`-Wert zeigt die Liste ohne Panel und ohne Fehler.
4. Bearbeiten aus dem Panel heraus öffnet den Dialog aus Task 04 vorbefüllt.
5. Löschen erfordert die Eingabe des Kundennamens und entfernt den Kunden aus Liste und Detail; die
   Daten bleiben in der Datenbank.
   5a. Endgültiges Löschen ist nur bei archivierten, zuvor gelöschten Kunden möglich, entfernt auch die
   Storage-Objekte und lässt Lead und Lead-Historie unversehrt.
6. Panel funktioniert in Dark und Light, auf Mobil und Desktop.
7. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
