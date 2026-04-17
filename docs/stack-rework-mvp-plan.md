# Stack Rework MVP Plan

## Ziel

Das MVP soll die Contact-DB auf ein korrektes Modell mit `pgTable` stellen, ohne unnötigen Umbaustress.

Wichtig:

- Das Modell ist die Quelle der Wahrheit.
- Die bestehende Raw-SQL-Persistenz bleibt im MVP noch bestehen.
- Es wird in kleinen, reviewbaren Schritten gearbeitet.

## Nicht im MVP

- Vollständige Migration aller Queries auf Drizzle
- Umbau der Contact-API oder UI
- Zusätzliche neue Tabellen außerhalb des Contact-Schemas
- Größere Architekturrefactors neben dem DB-Modell

## Schritt 1: `record-configuration` anlegen

Ziel:

- `src/server/db/record-configuration` als zentrale Modellablage einführen
- Pro Tabelle genau ein File
- Jede Datei exportiert das echte `pgTable`-Modell

Done wenn:

- `leads`, `lead_submissions`, `lead_project_requests`, `lead_email_contacts`, `lead_call_contacts` dort als eigene Files liegen
- Tabellenname, Spalten, Defaults, Checks, Relations und Indizes direkt im Modell stehen
- Das Modell die bestehende SQL-Struktur semantisch abbildet

Status:

- erledigt

## Schritt 2: Doppelte Spaltenlisten abbauen

Ziel:

- `*_COLUMNS`-Konstanten schrittweise entfernen
- Record-Definitionen und Tests direkt vom Drizzle-Modell ableiten

Done wenn:

- Keine manuell gepflegten Spaltenlisten mehr als Dauerlösung existieren
- DB-Contract-Tests gegen das Modell laufen
- Record-Definitionen nur noch als dünner Kompatibilitätslayer übrig sind oder ganz entfallen

## Schritt 3: `AGENTS.md` auf die neue DB-Struktur ausrichten

Ziel:

- Root-`AGENTS.md` um den Hinweis auf die neue Modellablage ergänzen
- `src/server/AGENTS.md` so anpassen, dass `record-configuration` als kanonische DB-Modellquelle gilt

Done wenn:

- Die neue Ablage ist in den Regeln dokumentiert
- Keine widersprüchlichen Pfadangaben zur DB-Struktur mehr existieren

## Schritt 4: Nachfolgearbeit dokumentieren

Ziel:

- Klar festhalten, was im MVP bewusst offen bleibt

Offen danach:

- Raw-SQL-Persistenz auf Drizzle-Queries umstellen
- Record-Kompatibilitätsschicht weiter abbauen
- Eventuell spätere Migration von Contracts und Persistenz-Inputs

## Schritt 5: Raw-SQL-Persistenz auf Drizzle-Queries umstellen

Ziel:

- Die bestehenden Persistenzpfade unter `src/server/db/contact/**` nicht mehr ueber handgebaute SQL-Strings schreiben
- Schreibzugriffe direkt ueber die `pgTable`-Modelle ausfuehren

Done wenn:

- `INSERT`- und spaetere `UPDATE`-Pfade fuer Contact-Persistenz auf Drizzle laufen
- Das Laufzeitverhalten gegenueber heute unveraendert bleibt
- Bestehende Contact-Persistenztests weiter gruen sind

## Schritt 6: Record-Kompatibilitaetsschicht weiter abbauen

Ziel:

- Doppelte Modellrepraesentationen zwischen `record-configuration` und `records/**` reduzieren
- Nur die Schicht behalten, die fachlich oder testseitig noch wirklich gebraucht wird

Done wenn:

- Redundante Record-Metadaten entfernt oder auf eine minimale Kompatibilitaetsschicht reduziert sind
- Tests und Persistenz nicht mehr von parallel gepflegten Tabelleninformationen abhaengen
- Das Drizzle-Modell klar die einzige DB-Strukturquelle ist

## Schritt 7: Contracts und Persistenz-Inputs pruefen und gezielt migrieren

Ziel:

- Danach erst entscheiden, welche Typen unter `records/**` und `persist-input/**` noch sinnvoll sind
- Grenzen zwischen DB-Modell, fachlichem Input und Persistenz-Payload sauber neu schneiden

Done wenn:

- Nur noch die fachlich sinnvollen Contracts uebrig sind
- Persistenz-Inputs nicht mehr unnoetig dieselbe Struktur wie das DB-Modell doppeln
- Mapping- und Persistenzschicht klar getrennte Verantwortungen haben

## Testplan

- `npm run typecheck`
- DB-Contract-Test gegen das Modell
- Bestehende Contact-Persistenztests weiterlaufen lassen

## Annahmen

- Das MVP bleibt bewusst klein und ändert keine User-Flows.
- Modellkorrektheit hat Vorrang vor einer vollständigen ORM-Migration.
- Die neue Struktur soll später ohne erneuten Umbau auf mehr Tabellen erweitert werden können.
