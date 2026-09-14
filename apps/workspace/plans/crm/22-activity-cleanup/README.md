# Ordner 22 — Activity-Cleanup

> **Status:** offen · **Abhängigkeiten:** 02, 21 · **Aufwand:** 1 Tag · **Reviewziel:** 5–15 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`35-activity-cleanup.md`](./35-activity-cleanup.md) — Leser nachweisen, `lead_activities` abbauen.

Ordner 02 hat die Lead-Historie direkt auf `activities` umgezogen: Die Migration hat den Bestand
übernommen, seitdem liest und schreibt kein Code mehr `lead_activities`. Die alte Tabelle ist
absichtlich stehen geblieben. Diese Einheit schließt das ab: nach ihr existiert genau eine
Activity-Tabelle.

Sie ist die einzige destruktive Einheit des gesamten Plans und liegt deshalb am Ende aller datenverändernden
CRM-Einheiten, nach der Produktivabnahme in Ordner 21. Danach folgt nur noch der rein visuelle Web-Abschluss in
Ordner 23.

## Voraussetzungen (verbindlich, vor Beginn geprüft)

- Seit dem Merge von Ordner 02 ist **mindestens ein vollständiges Release** produktiv beobachtet
  worden.
- `pnpm db:smoke:activities` meldet, dass jede Zeile aus `lead_activities` unverändert in
  `activities` existiert.
- Ein Backup, das `lead_activities` enthält, ist vorhanden und wurde nach dem Verfahren aus
  Ordner 21 testweise wiederhergestellt.

Ist eine dieser drei Bedingungen nicht erfüllt, startet die Einheit nicht.

## Umsetzung in zwei Schritten

1. **Leser nachweisen.** Statische Suche: kein Code liest oder schreibt `lead_activities`. Der
   Nachweis liegt als Liste im PR, nicht als Behauptung.
2. **Tabelle abbauen.** `DROP TABLE lead_activities` als eigene Migration; Drizzle-Modell,
   Barrel-Eintrag und die Übernahmeprüfung im Activity-Smoke entfallen im selben Deploy.

## Merge-Gate

- [ ] Alle drei Voraussetzungen oben sind im PR belegt, nicht nur zugesichert.
- [ ] Der Nachweis „kein Leser mehr" liegt als vollständige Trefferliste vor.
- [ ] Bestehende Lead-Tests bleiben inhaltlich unverändert und grün.
- [ ] Der `DROP` liegt in einer eigenen Migration, die nichts anderes tut.
- [ ] Rollback-Pfad ist im PR beschrieben, inklusive Restore-Weg.

## Rollback

Die Tabelle ist nach dem Drop weg. Rücknahme nur über den Restore aus Ordner 21. Genau deshalb ist
der Backup-Nachweis eine Voraussetzung und kein Merge-Gate-Punkt. Die Anwendung selbst ist vom Drop
nicht betroffen, weil sie die Tabelle seit Ordner 02 nicht mehr nutzt.
