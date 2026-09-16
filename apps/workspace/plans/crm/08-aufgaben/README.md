# Ordner 08 — Flache Aufgaben

> **Status:** offen · **Abhängigkeiten:** 04, 07, 07c · **Aufwand:** 4–5 Tage · **Reviewziel:** 80–100 Dateien

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
- Der Standardbearbeiter ist im Projektkontext der Projekt-Owner, sonst der Kunden-Owner. Er kann bei Anlage und später
  einzeln geändert werden; ein Owner-Wechsel am Kunden oder Projekt überschreibt ihn nicht.
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

- [ ] Die Kundenlisten-Query kann „hat offene Aufgaben“ effizient als Grundlage für die spätere Facette in Ordner 22a
      liefern; eine vorgezogene Filter-UI entsteht nicht.
- [ ] `Tasks` ist in `OwnableEntity` registriert und hat einen Adapter in der Ownership-Registry (Ordner 03c); Übergabe
      und Deaktivierungszählung erfassen die Entität, mit Test.
- [ ] DB verhindert widersprüchliche oder mehrere Kontexte.
- [ ] Jede Aufgabe hat genau einen aktiven Bearbeiter.
- [ ] Kundenaufgabe kann nicht unsichtbar gespeichert werden.
- [ ] Wiederöffnen und Zuweisungswechsel erzeugen nachvollziehbare Activities.
- [ ] Listenfilter und Counts sind identisch; überfällige Aufgaben stehen deterministisch zuerst.
- [ ] Portalabfragen oder Portal-UI werden noch nicht aktiviert.
- [ ] Zugriffsbereiche (Task 36–38): `tasks.read` entsteht bindbar; alle Aufgaben-Endpunkte stehen in
      `CRM_ENDPOINT_ACCESS_RULES`; globale Übersicht, Sidebar-Zähler und Counts filtern über `accessScope`; der
      Tasks-Adapter deklariert `requiredPermission`.
- [ ] E2E: Mitglied mit Rolle „Nur Aufgaben“ auf Kunde 1 / Projekt 2 sieht dort Aufgaben, aber keine Projektdetails
      und nichts von Projekt 1.

## Rollback

Aufgabenlinks ausblenden; Projekte und Kunden bleiben vollständig nutzbar. Additive Aufgabenzeilen
bleiben bestehen.
