# Ordner 02 — Verlustfreie Activity-Migration

> **Status:** im Review · **Abhängigkeit:** Ordner 01 · **Aufwand:** 2–3 Tage · **Reviewziel:** 40–70 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`01a-aktivitaeten-tabelle.md`](./01a-aktivitaeten-tabelle.md) — neue Tabelle, Übernahme des
  Bestands in der Migration, direkter Umzug aller Leser und Schreiber.

Lead-Aktivitäten laufen auf einer generischen, für Leads und CRM geeigneten `activities`-Tabelle.
Bestehende Lead-Historie bleibt vollständig sichtbar. Für Nutzer ändert sich außer der Persistenz
nichts.

## Umsetzung als direkter Umzug

1. Neue `activities`-Tabelle additiv anlegen; mindestens einer der Fachbezüge `lead_id` oder
   `customer_id` ist gesetzt.
2. Dieselbe Migration übernimmt den Bestand aus `lead_activities` mit unveränderter ID (`ON CONFLICT DO NOTHING`) und
   bricht ab, wenn eine Zeile fehlt oder in `lead_id`, Typ oder
   Zeitstempel abweicht.
3. Alle Leser und Schreiber arbeiten ab dem Deploy ausschließlich auf `activities`. Es gibt keinen
   Dual-Write und keinen separaten Backfill-Job.
4. `lead_activities` bleibt ungenutzt stehen und wird in Ordner 22 abgebaut.

**Bewusste Abweichung vom Standardablauf** (Expand → Dual-Write → Backfill → Read-Cutover): Die
Bestandsdaten haben geringen Wert, und betrieblich ist zugesichert, dass zwischen angewendeter
Migration und App-Deploy keine Activity-Writes stattfinden. Die Übergangsmechanik würde damit nur Code
und Betriebsschritte hinzufügen, ohne ein reales Risiko abzudecken.

## Merge-Gate

- [x] Bestehende Lead- und Dashboard-Tests bleiben inhaltlich unverändert; nur Importpfade dürfen
      wechseln.
- [x] Die Migration übernimmt jede Bestandszeile mit derselben ID und bricht bei Abweichung ab.
- [x] Ein zweiter Migrationslauf erzeugt keine doppelten Activities.
- [x] Kein Anwendungscode liest oder schreibt mehr `lead_activities`; Zugriff haben nur noch das
      Drizzle-Modell und die Übernahmeprüfung im Activity-Smoke.
- [x] Timeline-Reihenfolge bleibt bei identischen Zeitstempeln deterministisch.
- [x] Der Smoke prüft die CHECK-Werte der Datenbank gegen die Const-Objekte.
- [x] Kein Cleanup alter Daten in dieser Einheit.

## Rollback

Rollback ist ein Revert des App-Deploys. Die alte Version liest und schreibt wieder ausschließlich
`lead_activities`; `activities` bleibt bestehen und wird nicht destruktiv zurückgerollt.

Aktivitäten, die zwischen Deploy und Revert entstanden sind, sieht die alte Version nicht. Wird danach
erneut deployt, fehlen umgekehrt die Einträge aus der Rollback-Phase in `activities`. Sie werden vor
dem erneuten Deploy mit dem Kopierschritt aus der Migration nachgezogen
(`INSERT … SELECT … FROM lead_activities ON CONFLICT (id) DO NOTHING`).
