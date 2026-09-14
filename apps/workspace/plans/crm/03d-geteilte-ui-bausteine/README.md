# Ordner 03d — Geteilte UI-Bausteine

> **Status:** offen · **Branch:** `chore/crm-geteilte-ui-bausteine` · **Abhängigkeiten:** Ordner 03b, 03c gemerged
> **Aufwand:** 4–5 Tage · **Reviewziel:** 170–195 Dateien in 25 Review-Schritten (bewusst über dem Split-Gate)

## Ziel und Stand nach Merge

Reines Refactoring ohne Verhaltensänderung, bevor Ordner 04 die Kundenakte baut. Wiederverwendbare Bausteine aus Leads,
Settings und der Web-App liegen an genau einer Stelle; alle bisherigen Nutzer verwenden sie bereits. Ordner 04 baut
Liste, Dialoge und Detail-Panel direkt darauf auf.

**Konkreter Task-Plan**

- [`02e-geteilte-ui-bausteine.md`](./02e-geteilte-ui-bausteine.md) — Ist-Analyse, Dialog-Umstellung, Teststrategie,
  25 Review-Schritte mit je höchstens zwei Bausteinen, Umfangskontrolle.

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

- Alle Dialoge in Leads (sieben Nutzer der Fokusfalle) und Settings (vier, nach 03c sechs Nutzer von `WorkspaceDialog`)
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

- **Ein Ordner, ein PR.** Die Schätzung von 170–195 Dateien liegt über dem Split-Gate von 120 und unter der harten
  Grenze von 200. Der Großteil sind Importpfad-Diffs. Checkpoint nach Phase C: über 160 Dateien → Rücksprache, ob
  Phase D (Listenbausteine) als Ordner 03e ausgegliedert wird.
- **Kleine Review-Schritte.** Jeder Schritt zieht höchstens zwei Bausteine um, ist für sich grün und wird einzeln
  reviewt.
- **Beide Apps.** Button und Formularbausteine ziehen aus `apps/web` und `apps/workspace` nach `packages/ui`; beide
  App-Kopien werden gelöscht. Abweichungen zwischen den Kopien werden über app-seitige Tokens beziehungsweise
  Opt-in-Props aufgelöst, nicht durch Angleichen von Optik oder Verhalten.

## Merge-Gate

- [ ] Bestehende Lead-, Settings- und Web-Tests bleiben inhaltlich unverändert grün; angepasst werden nur Importpfade.
      Ausnahme sind ausschließlich die im Task-Plan benannten Tests der ersetzten Fokusfallen-Mechanik.
- [ ] Kein Baustein in `packages/ui` importiert App-Code, Dictionaries oder `next/*`.
- [ ] Jede interaktive `packages/ui`-Komponente hat jsdom-Tests für Tastatur, Fokus und Escape.
- [ ] Keine doppelte Dialog-, Panel-, Button- oder Formularfeld-Implementierung mehr in Leads, Settings oder Web.
- [ ] Alle Dialoge nutzen das native `<dialog>` mit `showModal()`; `dialog-focus-trap.ts` und `createPortal` für
      Dialoge sind entfernt. Tests belegen Escape, Fokus-Rückgabe (Schließen und Unmount) und die Sperre bei laufendem
      Request.
- [ ] `CustomSelect` ist innerhalb eines Dialogs bedienbar (Portal-Root).
- [ ] Mobil, Dark und Light visuell unverändert — Workspace und Web.
- [ ] Conversion-Smoke Web (Kontaktformular, LinkedIn-Generator): Fehler-, Lade- und Erfolgszustand, keine toten CTAs.
- [ ] Dateizahl ≤ 200 und im PR genannt.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, Workspace-Build und Web-Build grün.

## Rollback

Reiner Code-Revert; keine Migration, keine Datenänderung.
