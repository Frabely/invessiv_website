# Ordner 03d — Geteilte UI-Bausteine

> **Status:** offen · **Branch:** `chore/crm-geteilte-ui-bausteine` · **Abhängigkeiten:** Ordner 03b, 03c gemerged
> **Aufwand:** 2–3 Tage · **Reviewziel:** 40–60 Dateien

## Ziel und Stand nach Merge

Reines Refactoring ohne Verhaltensänderung, bevor Ordner 04 die Kundenakte baut. Wiederverwendbare Bausteine aus Leads
und Settings liegen an genau einer Stelle; Leads und Settings nutzen sie bereits. Ordner 04 baut Liste, Dialoge und
Detail-Panel direkt darauf auf.

Der detaillierte Task-Plan wird zu Beginn der Einheit geschrieben. Er ersetzt die Zielentscheidung „nicht
`packages/ui`" aus Task 02a (Ordner 05).

## Entscheidung (13.09.2026, mit dem Nutzer abgestimmt): Hybrid

| Ziel                           | Bausteine                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui` (app-neutral)    | Dialog-Hülle mit Fokusfalle und Fokus-Rückgabe, Bestätigungsdialog, Seitenpanel/Drawer, Detail-Sektion, Definitionsliste, Empty-State, Badge, Formularfeld |
| `components/workspace/shared/` | URL-/Dictionary-gebundene Teile: Pagination, Sortier-Header, Selection-Provider, Suchfeld, Facettenfilter, Activity-Timeline                               |

`packages/ui`-Bausteine kennen keine Dictionaries, Routen, Analytics oder Fachdomänen; Texte, Links und Callbacks kommen
als Props (`packages/AGENTS.md`, Abschnitt `packages/ui`).

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

- Alle Dialoge in Leads (sieben Nutzer der Fokusfalle) und Settings wechseln in dieser Einheit auf die neue Hülle;
  `dialog-focus-trap.ts` wird danach gelöscht.
- Die Hülle öffnet per `showModal()` im Effekt und schließt per `close()` im Cleanup; `open` bleibt als Prop steuerbar.
- jsdom implementiert `showModal()`/`close()` nicht. Die Tests in `packages/ui` stellen dafür einen kleinen, zentralen
  Test-Setup-Mock bereit, statt ihn in jedem Test zu wiederholen.
- Tab darf aus dem Dialog in die Browser-Oberfläche springen; das ist das gewollte, barrierefreie Verhalten des
  Top-Layers und kein Fokus-Leck.

## Merge-Gate

- [ ] Bestehende Lead- und Settings-Tests bleiben inhaltlich unverändert grün; angepasst werden nur Importpfade.
- [ ] Kein Baustein in `packages/ui` importiert App-Code, Dictionaries oder `next/navigation`.
- [ ] Jede interaktive `packages/ui`-Komponente hat jsdom-Tests für Tastatur, Fokus und Escape.
- [ ] Keine doppelte Dialog-/Panel-Implementierung mehr in Leads oder Settings.
- [ ] Alle Dialoge nutzen das native `<dialog>` mit `showModal()`; `dialog-focus-trap.ts` und `createPortal` für
      Dialoge sind entfernt. Tests belegen Escape, Fokus-Rückgabe und die Sperre bei laufendem Request.
- [ ] Mobil, Dark und Light visuell unverändert.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` und Workspace-Build grün.

## Rollback

Reiner Code-Revert; keine Migration, keine Datenänderung.
