# Task 10 — Projekte UI

> **Branch:** `feat/crm-projekte-ui`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 09, Task 05 (Slot im Detail-Panel)
> **Migration:** keine

## Context

Die Projekte-Sektion im Kundendetail: Liste der Projekte, Anlegen und Bearbeiten, Phasenwechsel und
die Fortschrittsanzeige. Die Phasenleiste ist dieselbe Komponente, die später im Kundendashboard
erscheint — sie wird deshalb bewusst app-neutral gebaut und in `packages/ui` abgelegt, damit Portal
und CRM garantiert dasselbe zeigen.

## Entscheidungen

| Bereich              | Entscheidung                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Ort                  | Sektion im Kundendetail-Panel, kein eigener Menüpunkt — Projekte existieren nie ohne Kunden |
| Phasenleiste         | Eigene Komponente in `packages/ui`, da CRM und Portal sie teilen                            |
| Phasenwechsel        | Direkt an der Leiste: Klick auf eine Phase setzt sie (mit Rückfrage beim Rückwärtsgehen)    |
| Protokoll            | Phasenwechsel schreibt eine `customer_activities`-Zeile mit Projekt-ID im `metadata`        |
| Archivierte Projekte | Eingeklappt unter „Abgeschlossene Projekte (N)", nicht gelöscht                             |
| Nächster Schritt     | Zwei Felder (Text und Datum) direkt in der Projektkarte editierbar                          |

## Architektur

```txt
POST   /api/workspace/crm/customers/[id]/projects     Permission ProjectsWrite
PATCH  /api/workspace/crm/projects/[projectId]
PUT    /api/workspace/crm/projects/[projectId]/phase
DELETE /api/workspace/crm/projects/[projectId]
```

Gelesen wird über `listProjectsByCustomer`, direkt importiert in der Server Component des Details.

## Verzeichnisstruktur

```txt
packages/ui/src/components/phase-progress/
  phase-progress.tsx  phase-progress.module.css  phase-progress.test.tsx
packages/ui/src/index.ts                                 + Export

apps/workspace/src/app/api/workspace/crm/customers/[id]/projects/route.ts
apps/workspace/src/app/api/workspace/crm/projects/[projectId]/route.ts
apps/workspace/src/app/api/workspace/crm/projects/[projectId]/phase/route.ts

apps/workspace/src/server/workspace/crm/
  query-handler/list-projects-by-customer.query-handler.ts
  command-handler/{create,update,delete}-project.command-handler.ts
  command-handler/update-project-phase.command-handler.ts
  services/project.schema.ts

apps/workspace/src/components/workspace/crm/projects/
  customer-projects-section/
  project-card/
  project-form-dialog/
  project-next-step-editor/
apps/workspace/src/i18n/dictionaries/workspace/crm/projects/{de,en}.json
```

## Tickets

### CRM-10-T1 — Phasenleiste in packages/ui

- **Files:** `packages/ui/src/components/phase-progress/**`, `packages/ui/src/index.ts`
- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:**
  - Props: Sequenz, aktuelle Phase, Beschriftungen, optional `onSelect`
  - Ohne `onSelect` rein darstellend (so nutzt es das Portal), mit `onSelect` interaktiv (so nutzt es
    das CRM)
  - App-neutral: keine Dictionary-Importe, alle Texte kommen als Props
  - Abgeschlossene, aktuelle und kommende Phase optisch unterscheidbar — nicht allein über Farbe
    (Symbol plus Text), damit sie ohne Farbwahrnehmung lesbar bleibt
- **Akzeptanz:**
  - Als Liste ausgezeichnet, aktuelle Phase über `aria-current="step"`
  - In der interaktiven Variante per Tastatur bedienbar
  - Mobil umbruchfähig, kein horizontales Scrollen der Seite
  - Komponententest deckt sechs und drei Phasen ab (Beleg für Erweiterbarkeit)

### CRM-10-T2 — Handler und Routen

- **Files:** Query- und Command-Handler, `services/project.schema.ts`, drei Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Titel Pflicht, Preview-URL validiert, Zieltermin als Datum ohne Zeit
  - Phasenwechsel schreibt Activity mit vorheriger und neuer Phase
  - Löschen nur mit `Permission.ProjectsWrite`, Bestätigung im UI
- **Akzeptanz:** Tests für 401/404/403/201/422; Phasenwechsel auf denselben Wert erzeugt keine
  Activity; ungültige Phase wird abgelehnt

### CRM-10-T3 — Sektion, Karte, Dialog

- **Files:** `components/workspace/crm/projects/**`, `dictionaries/workspace/crm/projects/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Projektkarte: Titel, Phasenleiste, nächster Schritt mit Datum, Preview-Link, Aktionen
  - Rückwärtsgehen in der Phase fragt nach; Vorwärtsgehen nicht
  - Archivierte Projekte eingeklappt, Anzahl im Titel
  - Leerer Zustand mit Button „Projekt anlegen"
  - Überfälliger nächster Schritt wird hervorgehoben (Symbol plus Text, nicht nur Farbe)
- **Akzeptanz:**
  - Datumsformatierung über die Locale, nicht hartkodiert
  - Tastaturbedienung vollständig, Fokus nach Dialogschluss zurück auf den Auslöser
  - Dark und Light korrekt

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion „Projekte" im Kundendetail mit vollem CRUD und Phasenleiste.
2. **Bricht nichts:** keine Migration. `packages/ui` wird nur erweitert — die bestehende
   `custom-select`-Komponente bleibt unberührt, der Barrel wächst.
3. **Offen:** Aufgaben (Task 11) und Dateien (Task 15) hängen später an Projekten. Ihre Slots werden
   noch nicht gerendert, die Projektkarte zeigt also keine leeren Bereiche.

## End-to-End-Akzeptanz

1. Zu einem Kunden lassen sich mehrere Projekte anlegen, bearbeiten und löschen.
2. Die Phasenleiste zeigt den Fortschritt und lässt die Phase per Klick setzen.
3. Rückwärtsgehen fragt nach, Vorwärtsgehen nicht.
4. Nächster Schritt mit Datum ist direkt in der Karte editierbar; ein überfälliges Datum wird
   hervorgehoben.
5. Archivierte Projekte sind eingeklappt und über die Anzahl auffindbar.
6. Die Phasenleiste ist ohne Farbwahrnehmung und per Tastatur nutzbar.
7. Alle Texte in DE und EN.
8. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
