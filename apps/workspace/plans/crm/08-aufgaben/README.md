# Ordner 08 — Flache Aufgaben

> **Status:** offen · **Abhängigkeiten:** 04, 07 · **Aufwand:** 4–5 Tage · **Reviewziel:** 80–120 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`11-aufgaben.md`](./11-aufgaben.md) — flaches Modell, Bearbeiter, Handlungspflicht und CRUD.
- [`11a-aufgabenuebersicht.md`](./11a-aufgabenuebersicht.md) — globale Planung und Sidebar-Zähler.
- [`12-onboarding-checkliste.md`](./12-onboarding-checkliste.md) — Codevorlagen, die ausschließlich
  unabhängige flache Aufgaben erzeugen.

Interne Nutzer verwalten flache Aufgaben im Kunden-/Projektkontext oder als interne Aufgabe. Eine
globale Aufgabenroute beantwortet zuverlässig, was offen und überfällig ist. Kundenseitige Aufgaben
werden bereits modelliert, aber erst mit dem Portal sichtbar.

## Daten und Regeln

- Additive Aufgabenmigration, Drizzle-Modell, Contracts und Indizes entstehen in diesem Ordner.
- Pflicht: Titel, interner Bearbeiter, `action_side`, Status und `version`.
- Genau ein Kontext: intern ohne Kunde/Projekt, direkt Kunde oder Projekt samt konsistentem Kunde.
- Optional: Beschreibung, Fälligkeitsdatum und Uhrzeit. Noch keine Serienfelder in diesem Ordner.
- `action_side = customer` setzt und erzwingt `visible_to_customer = true`.
- Abschluss speichert Zeitpunkt und Actor. Internes Wiederöffnen löscht den aktiven Abschlusszustand,
  bewahrt ihn aber als Activity.
- Jede Zuweisung ist für aktive Mitglieder erlaubt und wird protokolliert.
- Keine Hierarchie, Checkliste, Parent-ID oder `sort_order`.

## UI

- Aufgabensektion in Kunde und Projekt mit Schnellanlage und vollständigem Dialog.
- Globale URL-basierte Ansicht mit „meine“, offen, überfällig, Kunde, Projekt, Bearbeiter und
  Handlungspflicht.
- Sidebar-Zähler zeigt nur überfällige Aufgaben des aktuellen Mitglieds.
- Kundenaktion ist intern klar als „Warten auf Kunde“ markiert.

## Merge-Gate

- [ ] DB verhindert widersprüchliche oder mehrere Kontexte.
- [ ] Jede Aufgabe hat genau einen aktiven Bearbeiter.
- [ ] Kundenaufgabe kann nicht unsichtbar gespeichert werden.
- [ ] Wiederöffnen und Zuweisungswechsel erzeugen nachvollziehbare Activities.
- [ ] Listenfilter und Counts sind identisch; überfällige Aufgaben stehen deterministisch zuerst.
- [ ] Portalabfragen oder Portal-UI werden noch nicht aktiviert.

## Rollback

Aufgabenlinks ausblenden; Projekte und Kunden bleiben vollständig nutzbar. Additive Aufgabenzeilen
bleiben bestehen.
