# Task 32 — Aufgabenserien und Reminder

> **Merge-Einheit:** Ordner 09 · **Branch:** `feat/crm-aufgabenserien-und-reminder`
> **Abhängigkeit:** Task 11 · **Status:** offen

> **Hinweis Neuplanung Ordner 08 (21.09.2026):** Aufgaben gehören nur noch zu Projekten, haben die Status
> `open | in_progress | done | cancelled` und eine Fälligkeit **nur als Datum** (`due_on`). Task 11 ist in die
> Tasks 11-1 bis 11-3 aufgeteilt (`08-aufgaben/README.md`). Uhrzeit-Angaben in diesem Plan sind vor der Umsetzung
> an dieses Modell anzupassen; eine Erinnerungsuhrzeit bräuchte eine eigene Entscheidung.

## Context

Wiederkehrende Wartungs- und Verwaltungsaufgaben sollen nicht kopiert werden. Jede Ausführung bleibt
trotzdem ein normales, flaches Aufgabenobjekt mit eigener Historie. Die Serie steuert nur die
Erzeugung künftiger Exemplare; sie ist keine Parent-Aufgabe und erzeugt keine Hierarchie.

## Entscheidungen

| Bereich       | Entscheidung                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Frequenzen    | `daily`, `weekly`, `monthly`, `yearly`; Intervall in Version 1 immer 1                          |
| Anker         | ursprünglicher Fälligkeitstermin der Serie; verspäteter Abschluss verschiebt den Rhythmus nicht |
| Erzeugung     | beim Abschluss synchron und zusätzlich über idempotenten Recovery-Job                           |
| Vorausplanung | höchstens ein offenes zukünftiges Exemplar je Serie                                             |
| Bearbeiten    | `occurrence_only` oder `this_and_future`; abgeschlossene Aufgaben bleiben unverändert           |
| Beenden       | Serie deaktivieren; vorhandene offene Aufgabe bleibt bestehen, sofern nicht separat erledigt    |
| Erinnerung    | genau eine optionale Erinnerung je Aufgabe; Datum plus optionale Uhrzeit                        |
| Zeitzone      | Eingabe Europe/Berlin, Persistenz UTC; reine Fälligkeitsdaten bleiben Date-only                 |

## Contracts

Const-Objekte: `TaskRecurrenceFrequency`, `TaskSeriesEditScope`, `TaskReminderState`.

`TaskSeriesDto` enthält ID, Frequenz, Anker, Defaulttitel/-beschreibung, Standardbearbeiter,
Standardkontext, Handlungspflicht, Sichtbarkeit, aktive Version und `version`.

Commands:

- Serie aus vorhandener Aufgabe anlegen.
- Einzelnes Exemplar oder Serie ab diesem Exemplar ändern.
- Serie deaktivieren.
- Nächstes Exemplar mit Idempotenzschlüssel `task-series:<seriesId>:<sequence>` erzeugen.
- Fällige Erinnerung als Outboxjob reservieren.

## Datenmodell

- `task_series`: UUID, Frequenz, Ankerdatum/-zeit, Zeitzone, Defaultfelder, Owner-/Kontext-FKs,
  nächste Sequenz, aktiv, Version, Timestamps.
- `tasks.series_id` nullable und `series_sequence` nullable; beide gemeinsam null oder gesetzt.
- Unique-Constraint auf `(series_id, series_sequence)`.
- Partieller Unique-Index verhindert mehr als ein noch nicht fälliges vorab erzeugtes Exemplar.
- Reminderstatus speichert versandte Stufe beziehungsweise deduplizierenden Outboxschlüssel.

## Tickets

### CRM-32-T1 — Migration, Konstanten und Mapper

- Additive Migration und deckungsgleiche Drizzle-Modelle.
- Unit-Tests für Const-Objekte und Mapping inklusive Date-only/UTC.

### CRM-32-T2 — Terminberechnung

- Reiner Service für Tag/Woche/Monat/Jahr.
- Monatsende nutzt den letzten gültigen Tag; Folgeperioden orientieren sich weiter am ursprünglichen
  gewünschten Kalendertag.
- Tests für 28/29/30/31, Schaltjahr und DST-Wechsel Europe/Berlin.

### CRM-32-T3 — Commands und Idempotenz

- Abschluss und Folgeerzeugung in einer Transaktion, soweit nur DB betroffen ist.
- Parallele Requests und Recovery-Job durch Unique-Constraint abgesichert.
- Optimistic Concurrency für Serienänderung.

### CRM-32-T4 — Bedienung

- Wiederholung im Aufgabendialog aktivieren/deaktivieren.
- Bei Serienaufgabe vor Änderung Auswahl „nur diese“ oder „diese und zukünftige“.
- Keine Option für Unteraufgaben, Parent oder Hierarchie anzeigen.
- Reminderfelder erst aktivieren, wenn der Runner aus Ordner 10 verfügbar ist. Die gespeicherte
  Reminderzeit ist exakt; die Auslösung folgt dem Cron-Takt (Geschäftszeit ±15 Minuten, sonst
  nächster Lauf). Die UI verspricht keine Minutengenauigkeit.

## Deploy-Sicherheit

- Migration ist additiv; bestehende Aufgaben bleiben serienlos und unverändert.
- Serienfunktion wird erst nach vollständigem Command/UI-Flow verlinkt.
- Ohne laufenden Cron erzeugt der Abschluss die nächste Aufgabe synchron; Recovery bleibt später
  ergänzend.

## End-to-End-Akzeptanz

1. Monatliche Aufgabe am 31. erzeugt in kurzen Monaten den letzten Tag und kehrt später zum 31. zurück.
2. Zwei parallele Abschlüsse erzeugen genau ein Folgeexemplar.
3. „Nur diese“ verändert keine Serie; „diese und zukünftige“ verändert keine erledigten Aufgaben.
4. Deaktivieren verhindert neue Exemplare, löscht aber keine Historie.
5. Reminder erscheint nach Ordner 10 einmalig — in der Geschäftszeit auf ±15 Minuten genau,
   außerhalb beim nächsten Lauf. Ein Reminder für 03:00 erscheint am Morgen; das ist gewollt.
