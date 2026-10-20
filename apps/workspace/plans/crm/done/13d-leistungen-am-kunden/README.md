# Ordner 13d — Leistungen am Kunden (ohne Projekt)

> **Status:** offen · **Abhängigkeiten:** 13c.1 (Task 74) gemergt; 13c.2/13c.3 empfohlen, nicht zwingend ·
> **Aufwand:** 4–6 Tage · **Reviewziel:** ≈ 90–110 Dateien in zwei Teil-PRs · **Angelegt:** 11.10.2026 als
> Folgeplan zu Ordner 13c (mit dem Nutzer abgestimmt)

## Ziel und Stand nach Merge

**Konkreter Task-Plan:** [`77-leistungen-am-kunden.md`](./77-leistungen-am-kunden.md)

Heute gehört jede Leistung zu genau einem Projekt (`project_line_items.project_id NOT NULL`). Das passt nicht zu
Leistungen, die der Kunde als Ganzes kauft:

- **Wartung** und **Wartung + SEO**, die mehrere Websites eines Kunden abdecken oder nach Projektabschluss
  weiterlaufen — der dringendste Fall, weil er im Alltag schon vorkommt.
- **Stunden**, die frei für alle Projekte gedacht sind. Seit Task 74 lassen sie sich frei gutschreiben, die Leistung
  selbst muss aber weiter an irgendeinem Projekt hängen.
- **Workshops, Beratung, Strategietermine** ohne Projektbezug.

Nach diesem Ordner gehört eine Leistung **immer zu einem Kunden und höchstens zu einem Projekt**. Leistungen ohne
Projekt erscheinen im Cockpit in einer eigenen Sektion „Leistungen am Kunden“, zählen in den Kundenwert und lassen
sich aus dem Katalog genauso zuweisen wie Projektleistungen.

## Entscheidungen

| Bereich         | Entscheidung                                                                                                                                                                                                |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modell          | **Projektbezug optional** statt Sammelprojekt oder zweiter Tabelle. Vorbild im Code: `files`, `customer_credentials`, `project_time_entries` (Kunde Pflicht, Projekt optional, zusammengesetzter Schlüssel) |
| Tabelle         | `project_line_items` bleibt als Tabellenname; sie bekommt `customer_id` und ein optionales `project_id`. Eine Umbenennung wäre nicht additiv und ist nicht Teil dieses Ordners                              |
| Abgelöste Regel | „Jede Leistung gehört verpflichtend zu genau einem Projekt; kundenweite Positionen existieren nicht“ (`00-entscheidungen.md`, 17.09.2026) wird durch diesen Ordner ersetzt                                  |
| Verworfen       | Sammelprojekt „Allgemein“ je Kunde (Attrappe, die überall ausgefiltert werden muss) und eigene Tabelle `customer_line_items` (zwei Dialoge, zwei Listen, doppelte Werteberechnung)                          |
| Projektbezug    | `LineItemProjectMode` bekommt den dritten Wert `customer` („Leistung am Kunden, ohne Projekt“). Er ist die Vorauswahl beim Zuweisen und beim Annehmen einer Anfrage; final entscheidet das Team             |
| Arten           | `standard`: alle drei Bezüge. `hours`: `existing_project` oder `customer`. `feedback_round`: nur `existing_project` (eine Runde gehört immer zu einem Projekt)                                              |
| Stunden         | Stunden-Leistung am Kunden = Kaufbuchung ohne Zuweisung. Der Haken „Stunden diesem Projekt zuweisen“ aus Task 74 bleibt für Projektleistungen; am Kunden entfällt er                                        |
| Rechte          | Keine neuen Permissions. `project_line_items.read/write` gilt weiter; **eine Projektbindung zeigt und schreibt keine Leistungen am Kunden** (Muster Zugangsdaten). Dafür braucht es die Kundenbindung       |
| Werte           | Kundenwert zählt alle bestätigten Leistungen, Projektwert nur die des Projekts; neu ausgewiesen wird der Wert der Leistungen am Kunden                                                                      |
| Onboarding      | Der Bogen eines Projekts zeigt und friert weiterhin nur die Leistungen **dieses Projekts** ein. Leistungen am Kunden erscheinen in keinem Bogen                                                             |
| Portal          | Unverändert: Gebuchte Leistungen sind nicht portalsichtbar. Eine Leistungsanfrage (Ordner 13c) kann nach diesem Ordner als „am Kunden“ angenommen werden                                                    |
| Auslieferung    | Zwei Teil-PRs (Expand, dann Funktion), weil `customer_id` erst befüllt sein muss, bevor es Pflicht wird                                                                                                     |

## Teil-PRs

| PR    | Inhalt                                                                                                   | Branch                                  | Dateien | Status |
| ----- | -------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------: | ------ |
| 13d.1 | Expand: `customer_id` nullable + Backfill, alle Schreibpfade setzen es, Schlüssel und Index, unsichtbar  | `feat/crm-kundenleistungen-1-fundament` |    ≈ 25 | offen  |
| 13d.2 | Funktion: Projekt optional, Zugriff, Zuweisung, Cockpit-Sektion, Katalogwert `customer`, Anfrage-Annahme | `feat/crm-kundenleistungen-2-cockpit`   | ≈ 70–85 | offen  |

Statuswerte: `offen` → `läuft` → `im Review` → `gemerged`.

## Merge-Gates

Je PR: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/db db:smoke:crm`,
`pnpm --filter @invessiv/workspace db:smoke:crm`, `pnpm --filter @invessiv/workspace build`.

- [ ] Nach 13d.1 hat jede Zeile von `project_line_items` eine `customer_id`, die dem Kunden ihres Projekts entspricht.
- [ ] Eine Leistung an einem fremden Projekt (Projekt gehört nicht zum Kunden) ist in der Datenbank unmöglich.
- [ ] Eine Leistung der Art `feedback_round` ohne Projekt ist in der Datenbank unmöglich.
- [ ] Mitglied mit Projektbindung sieht und ändert keine Leistung am Kunden (Negativtests Query und beide Mutationen).
- [ ] Mitglied mit Rolle an Kunde B erreicht keine Leistung von Kunde A.
- [ ] Stunden-Leistung am Kunden: genau eine Leistung, eine Kaufbuchung, keine Zuweisung; alles oder nichts.
- [ ] Kundenwert = Summe aller bestätigten Leistungen; Projektwerte ändern sich für Bestandsdaten nicht.
- [ ] Der Onboarding-Bogen eines Projekts zeigt keine Leistung am Kunden, auch nicht nach dem Abschluss.
- [ ] Empty-State der neuen Sektion erklärt den Zweck und unterscheidet Schreib- von Leserecht.

## Rollback

13d.1: Code-Revert; die Spalte bleibt befüllt und stört die Vorversion nicht. 13d.2: Code-Revert ist nur sicher,
solange **keine** Leistung ohne Projekt existiert — die Vorversion liest Leistungen über einen Join auf das Projekt
und würde sie stillschweigend nicht anzeigen und nicht in den Kundenwert zählen. Vor einem Revert deshalb prüfen
(`SELECT count(*) FROM project_line_items WHERE project_id IS NULL`) und solche Leistungen einem Projekt zuordnen.

## Risiken

- **Benennung:** `project_line_items`, `ProjectLineItemDto` und `projectLineItemAssignmentService` heißen danach
  nach einem Projekt, das es nicht mehr geben muss. Bewusst akzeptiert; eine Umbenennung ist ein eigener,
  rein mechanischer Cleanup nach diesem Ordner.
- **Reihenfolge mit 13c.2:** Die Tabelle `service_requests` verlangt für `accepted` ein `project_id`. Wird 13d nach
  13c.2 umgesetzt, lockert 13d.2 diesen CHECK additiv (siehe Task 77, T4). Wird 13d davor umgesetzt, plant Task 75
  die Annahme „am Kunden“ gleich mit.
