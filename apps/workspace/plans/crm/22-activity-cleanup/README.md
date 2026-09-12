# Ordner 22 — Activity-Cleanup

> **Status:** offen · **Abhängigkeiten:** 02, 21 · **Aufwand:** 1–2 Tage · **Reviewziel:** 15–30 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`35-activity-cleanup.md`](./35-activity-cleanup.md) — Dual-Write abschalten, Leser nachweisen,
  `lead_activities` abbauen.

Ordner 02 hat die Lead-Historie auf `activities` umgezogen, den Read-Pfad umgeschaltet und den
Dual-Write **absichtlich** stehen gelassen. Diese Einheit schließt das ab: nach ihr existiert genau
eine Activity-Tabelle, und jeder Schreibpfad geht nur noch dorthin.

Sie ist die einzige destruktive Einheit des gesamten Plans und liegt deshalb am Ende, nach der
Produktivabnahme in Ordner 21.

## Voraussetzungen (verbindlich, vor Beginn geprüft)

- Seit dem Merge von Ordner 02 ist **mindestens ein vollständiges Release** produktiv beobachtet
  worden, ohne Abweichung zwischen alter und neuer Tabelle.
- Der Zähl-, ID- und Zeitstempelvergleich aus Ordner 02 läuft erneut und meldet null Abweichungen.
- Ein Backup, das `lead_activities` enthält, ist vorhanden und wurde nach dem Verfahren aus
  Ordner 21 testweise wiederhergestellt.

Ist eine dieser drei Bedingungen nicht erfüllt, startet die Einheit nicht.

## Umsetzung in drei getrennten Schritten

1. **Leser nachweisen.** Statische Suche plus Laufzeitprüfung: kein Code liest `lead_activities`.
   Der Nachweis liegt als Liste im PR, nicht als Behauptung.
2. **Dual-Write abschalten.** Der Activity-Service schreibt nur noch nach `activities`. Eigenes
   Deploy, eigener Rollback. Danach mindestens ein beobachteter Tag Abstand zum nächsten Schritt.
3. **Tabelle abbauen.** `DROP TABLE lead_activities` als eigene Migration, nachdem Schritt 2
   produktiv stabil ist.

Schritt 2 und 3 dürfen nicht im selben Deploy liegen: solange die Tabelle existiert, ist Schritt 2
ohne Datenverlust rücknehmbar.

## Merge-Gate

- [ ] Alle drei Voraussetzungen oben sind im PR belegt, nicht nur zugesichert.
- [ ] Der Nachweis „kein Leser mehr" liegt als vollständige Trefferliste vor.
- [ ] Bestehende Lead-Tests bleiben inhaltlich unverändert und grün.
- [ ] Nach Abschalten des Dual-Write landet jede neue Lead-Activity in `activities`.
- [ ] Die Lead-Timeline zeigt historische und neue Einträge lückenlos in derselben Reihenfolge.
- [ ] Der `DROP` liegt in einer eigenen Migration, getrennt vom Abschalten des Dual-Write.
- [ ] Rollback-Pfad für beide Schritte ist im PR beschrieben, inklusive Restore-Weg für Schritt 3.

## Rollback

**Nach Schritt 2:** Dual-Write wieder einschalten. Die alte Tabelle existiert noch, es geht nichts
verloren — währenddessen entstandene Einträge fehlen ihr, was folgenlos ist, weil niemand mehr liest.

**Nach Schritt 3:** Die Tabelle ist weg. Rücknahme nur über den Restore aus Ordner 21. Genau deshalb
ist der Backup-Nachweis eine Voraussetzung und kein Merge-Gate-Punkt.
