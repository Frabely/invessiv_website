# Ordner 03d — Geteilte UI-Bausteine

> **Status:** abgeschlossen · **Branch:** `chore/crm-geteilte-ui-bausteine` · **Abhängigkeiten:** Ordner 03b, 03c
> gemerged
> **Aufwand:** 4–5 Tage · **Reviewziel:** 145–165 Dateien in 9 Tasks mit je ≤ 30 Dateien, hart 50 (bewusst über dem
> Split-Gate)

## Ziel und aktueller Umsetzungsstand

Reines Refactoring ohne Verhaltensänderung, bevor Ordner 04 die Kundenakte baut. Wiederverwendbare Bausteine aus Leads
und Settings liegen an genau einer Stelle; alle bisherigen Workspace-Nutzer verwenden sie bereits. Ordner 04 baut
Liste, Dialoge und Detail-Panel direkt darauf auf. Die Web-App bleibt in diesem Ordner vollständig unangetastet.

**Abschlussnachweis vom 14.09.2026:** Der Workspace-Umzug ist umgesetzt. Bereits
zentralisiert sind Button, Formularfeld samt Label/Pflichtmarker/Status/Aktionen, `Dialog`, `ConfirmDialog`,
`EmptyState`, `ListEmptyState`, `Badge` sowie Auswahl-Provider und Select-All-Checkbox. Die Web-App bleibt unverändert;
ihre technische Migration und visuelle Anpassung erfolgt erst in Task 39 nach Abschluss des gesamten CRM-Umbaus.

| Task   | Stand    | Verbleibende Arbeit                                                                                                                                                   |
| ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 02e-1  | erledigt | Keine offene Workspace-Arbeit.                                                                                                                                        |
| 02e-3  | erledigt | Keine offene Workspace-Arbeit.                                                                                                                                        |
| 02e-4  | erledigt | Keine offene Workspace-Arbeit.                                                                                                                                        |
| 02e-5  | erledigt | Zentrales Dialog-Test-Setup und Tastatur-/Fokus-Tests sind umgesetzt.                                                                                                 |
| 02e-6  | erledigt | Lead-Formular, Import, Outreach und Bulk-Edit sowie Archiv/Löschen verwenden die zentrale native `Dialog`/`ConfirmDialog`-Hülle; Fokusfalle und Portal sind entfernt. |
| 02e-7  | erledigt | Empty-State-Bausteine und Workspace-Nutzer sind umgestellt und getestet.                                                                                              |
| 02e-8  | erledigt | `SidePanel`, `DefinitionList` und `DetailSection` sind integriert und getestet.                                                                                       |
| 02e-9  | erledigt | Tabellen-, Pagination-, Sortier- und Selection-Bausteine liegen generisch im Shared-Scope.                                                                            |
| 02e-10 | erledigt | Suchfeld, Facettenfilter, Timeline und Abschlussprüfungen sind umgesetzt.                                                                                             |

**Konkreter Task-Plan**

**Nachtrag zum Umsetzungsstand:** Seit der letzten Bestandsaufnahme liegen auch Sortier-Header, Pagination, Suchfeld,
Facettenfilter und Activity-Timeline an den vorgesehenen Shared-Pfaden. Das Lead-Detail-Panel ist mit `SidePanel`
verknüpft; `DefinitionList` und `DetailSection` sind als app-neutrale Bausteine angelegt. Offen bleiben deren
vollständige Entkopplung und Tests sowie der Abschlussnachweis inklusive Mehrfachauswahl im Facettenfilter.

- [`02e-geteilte-ui-bausteine.md`](./02e-geteilte-ui-bausteine.md) — Übersicht: Ist-Analyse, Entscheidungen,
  Dialog-Umstellung, Teststrategie, Zielbild, Umfangskontrolle.
- [`02e-1-regeln-und-button-workspace.md`](./02e-1-regeln-und-button-workspace.md) — T0, T1 · ~31 Dateien
- [`02e-3-formularfeld.md`](./02e-3-formularfeld.md) — T3, T4 · ~11 Dateien
- [`02e-4-formularstatus-und-aktionen.md`](./02e-4-formularstatus-und-aktionen.md) — T5 · ~10 Dateien
- [`02e-5-dialog-und-settings.md`](./02e-5-dialog-und-settings.md) — T6, T7 · ~20 Dateien
- [`02e-6-lead-dialoge.md`](./02e-6-lead-dialoge.md) — T8–T13 · ~23 Dateien
- [`02e-7-empty-state.md`](./02e-7-empty-state.md) — T14 · ~17 Dateien
- [`02e-8-badge-und-detail-panel.md`](./02e-8-badge-und-detail-panel.md) — T15–T17 · ~28 Dateien
- [`02e-9-tabellenbausteine.md`](./02e-9-tabellenbausteine.md) — T18–T20 · ~17–20 Dateien
- [`02e-10-toolbar-timeline-und-abschluss.md`](./02e-10-toolbar-timeline-und-abschluss.md) — T21–T24 · ~18 Dateien

Task 02e ersetzt die Zielentscheidung „nicht `packages/ui`" aus Task 02a und übernimmt dessen Listenumzug (Phase D).

## Entscheidung (13.09.2026, mit dem Nutzer abgestimmt): Hybrid

| Ziel                           | Bausteine                                                                                                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui` (app-neutral)    | Dialog-Hülle, Bestätigungsdialog, Seitenpanel/Drawer, Detail-Sektion, Definitionsliste, Empty-State, Badge, Formularfeld samt Label/Pflichtmarker/Status/Aktionen, Button (Button und Formular ab 14.09.2026) |
| `components/workspace/shared/` | URL-/Dictionary-/Link-gebundene Teile: Listen-Empty-State, Pagination, Sortier-Header, Selection-Provider, Suchfeld, Facettenfilter, Activity-Timeline                                                        |

`packages/ui`-Bausteine kennen keine Dictionaries, Routen, Analytics, Fachdomänen und kein `next/*`; Texte, Links und
Callbacks kommen als Props (`packages/AGENTS.md`, Abschnitt `packages/ui`).

## Entscheidung (13.09.2026, mit dem Nutzer abgestimmt): Natives `<dialog>` statt eigener Fokusfalle

Die Dialog-Hülle in `packages/ui` baut auf dem nativen `<dialog>`-Element mit `showModal()` auf. Die heutige
Handarbeit aus `components/workspace/shared/dialog/dialog-focus-trap.ts` und `createPortal` entfällt.

| Aufgabe                   | Heute (Eigenbau)                                   | Ziel (Browser)                                                     |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| Fokus bleibt im Dialog    | Tab/Shift+Tab-Handler über fokussierbare Elemente  | Hintergrund wird durch `showModal()` automatisch `inert`           |
| Escape schließt           | `keydown`-Handler                                  | `cancel`-Event; bei laufendem Request `preventDefault()`           |
| Fokus-Rückgabe            | Auslöser merken und im Cleanup fokussieren         | Browser stellt den vorherigen Fokus beim `close()` wieder her      |
| Überlagerung              | `createPortal` nach `document.body` plus `z-index` | Top-Layer, Hintergrund über `::backdrop`                           |
| Klick auf den Hintergrund | Vergleich `event.target === event.currentTarget`   | unverändert, Klick auf das `<dialog>` selbst außerhalb des Inhalts |

Folgen und Umsetzungshinweise:

- Alle Dialoge in Leads (sieben Nutzer der Fokusfalle) und Settings (fünf Nutzer von `WorkspaceDialog`, Stand
  14.09.2026)
  wechseln in dieser Einheit auf die neue Hülle; `dialog-focus-trap.ts` wird danach gelöscht.
- Die Hülle öffnet per `showModal()` und schließt per `close()` im Layout-Effekt-Cleanup, damit die Fokus-Rückgabe auch
  beim Unmount greift; `open` bleibt als Prop steuerbar.
- Initialer Fokus bleibt wie heute im ersten Body-Element, nicht im Schließen-Button (siehe Task-Plan).
- `CustomSelect` rendert im Dialog in das `<dialog>`-Element, weil `document.body` außerhalb inert ist.
- jsdom implementiert `showModal()`/`close()` nicht. `packages/ui` stellt dafür einen zentralen Test-Setup-Mock bereit,
  den auch die Vitest-Configs beider Apps registrieren.
- Tab darf aus dem Dialog in die Browser-Oberfläche springen; das ist das gewollte, barrierefreie Verhalten des
  Top-Layers und kein Fokus-Leck.

## Entscheidung (14.09.2026, mit dem Nutzer abgestimmt): Zuschnitt und Reichweite

- **Ein Ordner, ein PR.** Die Schätzung von 145–165 Dateien liegt über dem Split-Gate von 120 und unter der harten
  Grenze von 200. Der Großteil sind Importpfad-Diffs. Checkpoint nach Phase C: über 160 Dateien → Rücksprache, ob
  Phase D (Listenbausteine) als Ordner 03e ausgegliedert wird.
- **Kleine Review-Schritte.** Jeder Schritt zieht höchstens zwei Bausteine um, ist für sich grün und wird einzeln
  reviewt.
- **Tasks mit begrenztem Changeset (Neuschnitt 14.09.2026, zuletzt angepasst am 14.09.2026).** Die Workspace-Tickets
  sind in neun Task-Dateien gebündelt. Jeder Task ist ein eigenes Changeset mit Ziel 20–30 Dateien; ab
  voraussichtlich 35 wird gestoppt und mit dem Nutzer neu geteilt, 50 Dateien werden nie überschritten. Ticket-IDs
  bleiben unverändert; T2 wird zusammen mit der übrigen Web-Migration nach Ordner 23 verschoben.
- **Nur Workspace.** Ordner 03d verschiebt die Workspace-Bausteine nach `packages/ui` und stellt ausschließlich
  Workspace-Nutzer um. Bestehende Kopien und Nutzer in `apps/web` bleiben unverändert.
- **Web erst nach dem gesamten CRM-Umbau.** Technische Migration und visuelle Weiterentwicklung aller betroffenen
  Web-Oberflächen erfolgen gemeinsam als letzte CRM-Merge-Einheit in Ordner 23 (Task 39) und sind zusätzlich in
  `apps/web/plans/Todo.md` verankert.

## Merge-Gate

- [ ] Bestehende Lead- und Settings-Tests bleiben inhaltlich unverändert grün; angepasst werden nur Importpfade.
      Ausnahme sind ausschließlich die im Task-Plan benannten Tests der ersetzten Fokusfallen-Mechanik.
- [ ] Kein Baustein in `packages/ui` importiert App-Code, Dictionaries oder `next/*`.
- [ ] Jede interaktive `packages/ui`-Komponente hat jsdom-Tests für Tastatur, Fokus und Escape.
- [ ] Keine doppelte Dialog-, Panel-, Button- oder Formularfeld-Implementierung mehr in Leads oder Settings.
- [ ] Alle Dialoge nutzen das native `<dialog>` mit `showModal()`; `dialog-focus-trap.ts` und `createPortal` für
      Dialoge sind entfernt. Tests belegen Escape, Fokus-Rückgabe (Schließen und Unmount) und die Sperre bei laufendem
      Request.
- [ ] `CustomSelect` ist innerhalb eines Dialogs bedienbar (Portal-Root).
- [ ] Mobil, Dark und Light visuell unverändert — Workspace.
- [ ] Dateizahl ≤ 200 und im PR genannt; jedes Task-Changeset ≤ 50 Dateien (Ziel ≤ 30), Zahl je Task im PR.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` und Workspace-Build grün.

## Rollback

Reiner Code-Revert; keine Migration, keine Datenänderung.

## Gebündelter Restplan: abgeschlossen

Die folgenden Punkte bildeten den Abschlussblock für den Workspace-UI-Umzug und sind umgesetzt:

1. **Dialog-Testabdeckung abschließen:** Zentrales jsdom-Setup vervollständigen und Fokus-/Escape-/Unmount- sowie
   laufende-Request-Tests für die native `Dialog`-Hülle ergänzen.
2. **Bausteine fachlich entkoppeln:** `SortableHeader`, `ListPagination` und `ActivityTimeline` von Lead-Typen,
   Dictionaries und URL-Helfern lösen; Props/Contracts korrekt im Shared-/Common-Bereich verankern; `FacetFilter` um
   Mehrfachauswahl und generische Optionen erweitern.
3. **Detail- und Listenbausteine integrieren:** `DefinitionList` und `DetailSection` im Lead-Detail-Panel verwenden,
   `SidePanel` auf die finale API prüfen und fehlende Empty-State-, Badge-, Detail-, Tabellen-, Toolbar- und Timeline-
   Tests ergänzen.
4. **Abschlussprüfung:** doppelte Workspace-Implementierungen entfernen, Responsive-/Dark-/Light-/A11y-Smoke prüfen,
   `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` und den Workspace-Build ausführen sowie README und Einzelpläne
   mit dem Abschlussnachweis aktualisieren.

Die Web-App bleibt während dieses Restplans unverändert. Ihre Migration und visuelle Anpassung erfolgt ausschließlich
am Ende des gesamten CRM-Umbaus in Task 39.
