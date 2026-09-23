# Ordner 20b — Aufgabenserien und Reminder

> **Status:** offen · **Abhängigkeit:** Ordner 08 · **Aufwand:** 3–4 Tage · **Reviewziel:** 50–90 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`32-aufgabenserien-und-reminder.md`](./32-aufgabenserien-und-reminder.md) — Serienmodell,
  Terminberechnung, Edit-Scope, Idempotenz und DST-Tests.

Aufgaben können täglich, wöchentlich, monatlich oder jährlich wiederkehren und optional eine
In-App-Erinnerung besitzen. Deren Auslösung folgt dem Cron-Takt aus Ordner 20c, nicht der Minute.
Bis der generische Runner dort aktiviert wird,
erzeugt der Abschluss-Command die nächste Aufgabe synchron und idempotent; zeitbasierte Reminder
bleiben per Feature-Flag unsichtbar.

## Umsetzung

- Eine additive Migration und das Drizzle-Modell für `task_series` entstehen in diesem Ordner.
- `task_series` speichert Frequenz, ursprünglichen Anker, Standardfelder, aktive Version und
  nächste Sequenznummer.
- Jede erzeugte Aufgabe referenziert Serie und Sequenz; Unique-Constraint verhindert Doppelungen.
- Abschluss berechnet den nächsten Termin aus dem ursprünglichen Anker, nie aus dem verspäteten
  Abschlussdatum.
- Edit-Modus „nur diese“ ändert ausschließlich die Aufgabe; „diese und zukünftige“ versioniert die
  Serie und aktualisiert noch nicht erledigte zukünftige Exemplare.
- Pro Serie existiert höchstens ein noch nicht fälliges, vorab erzeugtes Exemplar.
- Eine optionale Reminderzeit wird bereits UTC-fähig gespeichert und mit Europe/Berlin inklusive
  DST berechnet, aber erst zusammen mit dem Runner in Ordner 20c in der UI freigeschaltet.
- Überfälligkeitsmarker funktioniert rein aus Querydaten und benötigt noch keinen Cron.

## Merge-Gate

- [ ] Wiederholtes Abschließen/Retry erzeugt genau eine Folgeaufgabe.
- [ ] Monatsende, Schaltjahr und DST sind getestet.
- [ ] Änderungen an einer Serie verändern niemals abgeschlossene Exemplare.
- [ ] Nicht wiederkehrende Aufgaben aus Ordner 08 bleiben unverändert.
- [ ] Zeitbasierte Benachrichtigungsoptionen sind noch nicht sichtbar, solange Ordner 20c fehlt.

## Rollback

Serienanlage ausblenden. Bereits erzeugte Einzelaufgaben bleiben normale nutzbare Aufgaben; keine
Zeile wird gelöscht.
