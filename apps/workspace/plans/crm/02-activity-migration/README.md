# Ordner 02 — Verlustfreie Activity-Migration

> **Status:** offen · **Abhängigkeit:** Ordner 01 · **Aufwand:** 3–4 Tage · **Reviewziel:** 40–70 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`01a-aktivitaeten-tabelle.md`](./01a-aktivitaeten-tabelle.md) — Expand, Dual-Write,
  Backfill, Verifikation und Read-Cutover.

Lead-Aktivitäten laufen auf einer generischen, für Leads und CRM geeigneten `activities`-Tabelle.
Bestehende Lead-Historie bleibt vollständig sichtbar und neue Lead-Aktivitäten gehen während
gemischter Deployments nicht verloren. Für Nutzer ändert sich außer der Persistenz nichts.

## Umsetzung als Expand/Cutover

1. Neue `activities`-Tabelle additiv anlegen; genau einer der erlaubten Fachbezüge ist gesetzt.
2. Schreibservice vorübergehend idempotent in alte und neue Tabelle schreiben lassen.
3. Separaten versionierten Backfill mit stabiler Quell-ID und Konfliktbehandlung ausführen.
4. Anzahl, IDs, Typen, Zeitstempel und Stichproben serverseitig verifizieren.
5. Lead-Timeline auf neue Tabelle umschalten; Dual-Write zunächst beibehalten.
6. Die alte Tabelle bleibt in diesem Ordner bestehen. Entfernen ist ein späterer Cleanup nach
   mindestens einem vollständig beobachteten Release.

Eine bereits in `schema_migrations` registrierte Datei wird niemals verändert. Backfill und Cutover
erhalten jeweils eigene neue Migration beziehungsweise einen versionierten, wiederholbaren Job.

## Merge-Gate

- [ ] Bestehende Lead-Tests bleiben inhaltlich unverändert; nur Importpfade dürfen wechseln.
- [ ] Doppelter Backfill erzeugt keine doppelten Activities.
- [ ] Simulierter Deploywechsel vor und nach Cutover verliert keine Writes.
- [ ] Zähl- und Hashvergleich meldet jede Abweichung und blockiert das Read-Cutover.
- [ ] Timeline-Reihenfolge bleibt bei identischen Zeitstempeln deterministisch.
- [ ] Kein Cleanup alter Daten in dieser Einheit.

## Rollback

Read-Pfad zurück auf `lead_activities` stellen; Dual-Write bleibt aktiv. Das neue Schema und der
Backfill dürfen bestehen bleiben und werden nicht destruktiv zurückgerollt.
