# Ordner 02 — Verlustfreie Activity-Migration

> **Status:** gemerged · **Abhängigkeit:** Ordner 01 · **Aufwand:** 2–3 Tage · **Reviewziel:** 40–70 Dateien

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

## Mitgelieferter Fix: Bulk-Edit-Status im Dashboard

Bulk-Edit hat Statusänderungen bisher nur als `bulk_edit`-Aktivität geschrieben. Die
Messaging-Conversion im Dashboard zählt aber ausschließlich `status_change`; per Bulk-Edit
kontaktierte Leads fehlten deshalb im gewählten Zeitraum. Bulk-Edit schreibt eine Statusänderung
jetzt wie Einzel-Update und Bulk-Archivieren als `status_change` (`previous_status`/`next_status`);
die optionale Metadaten-Herkunft `origin` unterscheidet `single_edit`, `bulk_edit` und
`bulk_archive`, ohne den fachlichen Activity-Typ an den Bedienweg zu koppeln. Bestehende und
migrierte Activities ohne `origin` bleiben gültig. Der `bulk_edit`-Eintrag enthält nur noch die
übrigen Felder und entfällt, wenn nur der Status
geändert wurde. Frühere Bulk-Edit-Statusänderungen werden nicht nachgetragen.

## Merge-Gate

- [x] Bestehende Lead- und Dashboard-Semantik bleibt unverändert, mit einer bewussten Korrektur: Eine reine
      Bulk-Statusänderung wird als `status_change` statt `bulk_edit` erwartet und dadurch im Zeitraum-Funnel gezählt.
- [x] Die Migration übernimmt jede Bestandszeile vollständig mit derselben ID; eine nachgelagerte
      Verifikationsmigration bricht bei Abweichung eines übernommenen Feldes ab.
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
