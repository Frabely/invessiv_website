# Task 05 — Kundendetail-Panel

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

| Bereich               | Entscheidung                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| Navigation            | Query-Parameter `selected=<uuid>`, kein Segment `/crm/[id]`                                                 |
| Aufbau                | Sektionsliste mit benannten Slots; jede Folge-Task füllt genau einen Slot                                   |
| Sektionen ohne Inhalt | Werden **nicht** gerendert (kein leeres „Coming soon" im Produktivbereich, außer bewusst gekennzeichnet)    |
| Löschen               | Hinter `Permission.CustomersDelete`, mit Bestätigungsdialog und Eingabe des Firmennamens                    |
| Löschverhalten        | Harter Delete mit `ON DELETE CASCADE`. Kein Soft-Delete — der Status `archived` deckt „nicht mehr aktiv" ab |
| Layout                | Seitenpanel neben der Liste ab Tablet, Vollbild-Overlay auf Mobil                                           |

## Architektur

```txt
(app)/crm/page.tsx
  ├─ listCustomers(...)                         wie Task 03
  ├─ selected ? getCustomerById(selected) : null
  └─ <CustomersPageShell detailSlot={selected ? <CustomerDetailPanel customer={...} /> : null}>

CustomerDetailPanel
  ├─ Kopf: Firma, Statusbadge, Aktionen (Bearbeiten, Löschen)
  ├─ Slot "master-data"    ← dieser Task
  ├─ Slot "contacts"       ← Task 06
  ├─ Slot "tags"           ← Task 07
  ├─ Slot "projects"       ← Task 10
  ├─ Slot "tasks"          ← Task 11
  ├─ Slot "files"          ← Task 15
  ├─ Slot "credentials"    ← Task 18
  ├─ Slot "conversation"   ← Task 25
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
apps/workspace/src/components/workspace/crm/delete/
  delete-customer-dialog/
apps/workspace/src/i18n/dictionaries/workspace/crm/detail/{de,en}.json
apps/workspace/src/i18n/dictionaries/workspace/crm/delete/{de,en}.json
```

## Tickets

### CRM-05-T1 — Detail-Query

- **Files:** `query-handler/get-customer-by-id.query-handler.ts` + Test
- **Skills:** `best-practices`, `performance`
- **Inhalt:** Kunde inklusive Kontakte laden, auf `CustomerDetailDto` mappen, unbekannte ID ergibt
  `null` (kein Wurf)
- **Akzeptanz:** Unbekannte und ungültige UUID ergeben `null`; keine N+1-Abfrage

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

### CRM-05-T4 — Löschen

- **Files:** `command-handler/delete-customer.command-handler.ts`,
  `api/workspace/crm/customers/[id]/route.ts` (DELETE), `delete/delete-customer-dialog/**`,
  `dictionaries/workspace/crm/delete/{de,en}.json` + Tests
- **Skills:** `best-practices`, `accessibility`, `copywriting`
- **Inhalt:**
  - `withPermission(Permission.CustomersDelete)`
  - Bestätigungsdialog, der zur Sicherheit die Eingabe des Firmennamens verlangt und benennt, was
    mitgelöscht wird
  - Nach dem Löschen: `selected` aus der URL entfernen, `router.refresh()`
- **Akzeptanz:**
  - Tests: unbekannte ID ergibt 404, fehlende Permission 403, Erfolg 204
  - Abhängige Kontakte und Aktivitäten verschwinden mit (Cascade), keine verwaisten Zeilen
  - Der Bestätigungstext nennt die Zahl der betroffenen Datensätze

## Deploy-Sicherheit

1. **Live sichtbar:** Klick auf eine Kundenzeile öffnet ein Detailpanel mit Stammdaten und den
   Aktionen Bearbeiten und Löschen.
2. **Bricht nichts:** keine Migration, keine Änderung an bestehenden Handlern. Die Slots für spätere
   Sektionen sind `null` und rendern nichts — kein leerer Platzhalter, keine tote Fläche.
3. **Offen:** alle weiteren Sektionen. Abgesichert dadurch, dass nicht vorhandene Sektionen gar nicht
   erst erscheinen; es gibt keinen Verweis auf noch nicht gebaute Funktionen.

## End-to-End-Akzeptanz

1. Klick auf eine Zeile öffnet das Panel, die URL enthält `selected`.
2. Neuladen der URL zeigt dieselbe Ansicht.
3. Ein unbekannter `selected`-Wert zeigt die Liste ohne Panel und ohne Fehler.
4. Bearbeiten aus dem Panel heraus öffnet den Dialog aus Task 04 vorbefüllt.
5. Löschen erfordert die Eingabe des Firmennamens und entfernt den Kunden samt Kontakten.
6. Panel funktioniert in Dark und Light, auf Mobil und Desktop.
7. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
