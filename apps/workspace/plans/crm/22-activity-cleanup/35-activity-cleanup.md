# Task 35 — Activity-Cleanup

> **Merge-Einheit:** Ordner 22 · **Branch:** `feat/crm-activity-cleanup`
> **Aufwand:** S · **Abhängigkeiten:** Ordner 02 (Umzug), Ordner 21 (Backup/Restore nachgewiesen)
> **Migration:** eine, Nummer im Repository ermitteln

## Context

Ordner 02 hat die Lead-Historie direkt auf `activities` umgezogen: Migration 0022 hat den Bestand mit
derselben ID übernommen und bei Abweichung abgebrochen; seitdem lesen und schreiben alle Pfade nur
`activities`. `lead_activities` ist absichtlich stehen geblieben, damit ein Revert des App-Deploys
aus Ordner 02 möglich blieb.

Dieser Task entfernt die tote Tabelle. Ohne ihn bleibt eine Tabelle zurück, von der niemand mehr
weiß, ob sie noch gebraucht wird.

Es ist der einzige destruktive Task im Plan.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Reihenfolge             | Leser nachweisen → `DROP`. Kein Dual-Write abzuschalten, den gab es in Ordner 02 nicht                                    |
| Voraussetzung Release   | Mindestens ein vollständiges beobachtetes Release seit Ordner 02                                                          |
| Voraussetzung Vergleich | `pnpm db:smoke:activities` meldet, dass jede Zeile aus `lead_activities` unverändert in `activities` existiert            |
| Voraussetzung Backup    | Ein Backup mit `lead_activities` ist vorhanden **und** wurde nach dem Verfahren aus Ordner 21 testweise wiederhergestellt |
| Nachweis „kein Leser"   | Vollständige Trefferliste einer statischen Suche im PR                                                                    |
| Warum Trefferliste      | „Ich habe geschaut" ist kein Nachweis. Eine Liste ist im Review prüfbar, eine Zusicherung nicht                           |
| Bestandstests           | Bleiben inhaltlich unverändert. Wird eine Erwartung geändert, ist das ein Verhaltensbruch und gehört in die Diskussion    |
| `DROP`                  | Eigene Migration, die **nichts** außer dem Drop tut                                                                       |
| Legacy-Konstanten       | `LEGACY_LEAD_*_VALUES` bleiben, solange die Lead-Timeline sie als Filter nutzt (bis Task 02a)                             |
| Kein Umbenennen         | Kein Zwischenschritt über einen `_deprecated`-Namen. Das verschiebt das Risiko nur und lässt eine tote Tabelle zurück     |

## Umsetzung

### Schritt 1 — Leser nachweisen (kein Deploy)

```txt
Statisch
  Suche über das gesamte Repository nach lead_activities, leadActivities,
  lead-activities und dem alten Drizzle-Modell
  → Treffer dürfen ausschließlich sein: das Modell selbst samt Barrel, die
    Migrationen, die Übernahmeprüfung in smoke-activity-migration.ts und dieser Task
```

### Schritt 2 — Tabelle abbauen (ein Deploy)

```sql
-- <nr>_drop_lead_activities.sql
DROP TABLE IF EXISTS lead_activities;
```

Das Drizzle-Modell, sein Barrel-Eintrag und die Übernahmeprüfung im Activity-Smoke entfallen im
selben Deploy.

## Tickets

### CRM-35-T1 — Nachweis

- **Files:** Nachweisdokument im PR
- **Inhalt:**
  - Lauf von `pnpm db:smoke:activities` gegen Production-Daten (lesend) bzw. Preview
  - Vollständige Trefferliste der statischen Suche
  - Bestätigung des testweisen Restores aus Ordner 21
- **Akzeptanz:**
  - Die Übernahmeprüfung meldet null Abweichungen; bei jeder Abweichung bricht die Einheit ab
  - Die Trefferliste enthält keinen Zugriff außerhalb der erlaubten Stellen
  - Der Restore-Nachweis nennt Datum, Manifest und SHA-256

### CRM-35-T2 — Tabelle abbauen

- **Files:** Drop-Migration, Entfernen von Modell, Barrel-Eintrag und Smoke-Übernahmeprüfung
- **Inhalt:** ausschließlich der Drop und das Entfernen der Verweise
- **Akzeptanz:**
  - Die Migration enthält kein weiteres Statement
  - `pnpm db:migrate:dev`, `pnpm db:smoke:dev` und `pnpm db:smoke:activities` sind grün
  - Ein zweiter Lauf ist folgenlos (`IF EXISTS`)
  - Nach dem Drop referenziert kein Typ und kein Import die alte Tabelle
  - Typecheck und Build sind grün, ohne dass eine Testerwartung geändert wurde

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Für Nutzer ändert sich an keiner Stelle etwas.
2. **Bricht nichts:** Der Drop entfernt eine Tabelle, für die Schritt 1 den fehlenden Leser belegt hat.
3. **Offen:** Die fachliche und datenverändernde CRM-Umsetzung ist abgeschlossen. Danach folgen der rein visuelle
   Web-Abschluss aus Ordner 23 und die Zuständigkeitszugriff-Absicherung aus Ordner 24; erst nach deren Merges ist der
   Gesamtplan abgeschlossen und `AGENTS.md` unter `plans/crm/` kann entfernt werden.

## End-to-End-Akzeptanz

1. Die Übernahmeprüfung meldet vor Beginn null Abweichungen.
2. Die Lead-Timeline ist vor und nach dem Drop inhaltlich identisch.
3. Nach dem Drop existiert `lead_activities` nicht mehr, und die Anwendung läuft unverändert.
4. Kein Bestandstest wurde inhaltlich geändert.
5. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes und
   `pnpm --filter @invessiv/workspace build` sind grün.
