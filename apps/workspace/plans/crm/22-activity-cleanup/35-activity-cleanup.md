# Task 35 — Activity-Cleanup

> **Merge-Einheit:** Ordner 22 · **Branch:** `feat/crm-activity-cleanup`
> **Aufwand:** S–M · **Abhängigkeiten:** Ordner 02 (Umzug), Ordner 21 (Backup/Restore nachgewiesen)
> **Migration:** zwei getrennte, Nummern im Repository ermitteln

## Context

Ordner 02 hat die Lead-Historie verlustfrei auf `activities` umgezogen: Expand, Dual-Write,
versionierter Backfill, Verifikation, Read-Cutover. Der Dual-Write blieb absichtlich aktiv, damit ein
Rollback des Read-Pfads jederzeit ohne Datenverlust möglich war.

Dieser Task beendet den Übergangszustand. Ohne ihn schreibt jede Lead-Aktivität dauerhaft in zwei
Tabellen — doppelte Schreiblast, zwei Wahrheiten und eine Tabelle, von der niemand mehr weiß, ob sie
noch gebraucht wird.

Es ist der einzige destruktive Task im Plan. Entsprechend ist er nicht „ein Task", sondern drei
getrennte Deploys mit Beobachtungsabstand.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Reihenfolge             | Leser nachweisen → Dual-Write abschalten → `DROP`. Nie zwei davon im selben Deploy                                         |
| Warum getrennt          | Solange die Tabelle existiert, ist das Abschalten des Dual-Write ohne Datenverlust rücknehmbar. Zusammen wäre es das nicht |
| Beobachtungsabstand     | Zwischen Schritt 2 und 3 mindestens ein produktiv beobachteter Tag                                                         |
| Voraussetzung Release   | Mindestens ein vollständiges beobachtetes Release seit Ordner 02, ohne Abweichung                                          |
| Voraussetzung Vergleich | Der Verifikationslauf aus Ordner 02 wird erneut ausgeführt und meldet null Abweichungen                                    |
| Voraussetzung Backup    | Ein Backup mit `lead_activities` ist vorhanden **und** wurde nach dem Verfahren aus Ordner 21 testweise wiederhergestellt  |
| Nachweis „kein Leser"   | Vollständige Trefferliste einer statischen Suche im PR, plus ein Lauf mit Laufzeitwarnung auf Lesezugriff                  |
| Warum Trefferliste      | „Ich habe geschaut" ist kein Nachweis. Eine Liste ist im Review prüfbar, eine Zusicherung nicht                            |
| Bestandstests           | Bleiben inhaltlich unverändert. Wird eine Erwartung geändert, ist das ein Verhaltensbruch und gehört in die Diskussion     |
| `DROP`                  | Eigene Migration, die **nichts** außer dem Drop tut                                                                        |
| Kein Umbenennen         | Kein Zwischenschritt über einen `_deprecated`-Namen. Das verschiebt das Risiko nur und lässt eine tote Tabelle zurück      |

## Umsetzung

### Schritt 1 — Leser nachweisen (kein Deploy)

```txt
Statisch
  Suche über das gesamte Repository nach lead_activities, leadActivities,
  lead-activities und dem alten Drizzle-Modell
  → Treffer dürfen ausschließlich sein: das Modell selbst, der Dual-Write
    im Activity-Service, die Migration aus Ordner 02 und dieser Task

Laufzeit
  Temporäre Warnung im Repository-Zugriff auf lead_activities
  → ein vollständiger E2E-Lauf und ein beobachteter Tag erzeugen keine Warnung
```

### Schritt 2 — Dual-Write abschalten (eigenes Deploy)

```txt
apps/workspace/src/server/workspace/activity/activity-service.ts
  → Schreibpfad nach lead_activities entfernen
  → Schreibpfad nach activities bleibt unverändert
  → Idempotenz und Signatur des Service bleiben gleich

Kein Schemaeingriff. lead_activities existiert weiter und bleibt lesbar.
```

### Schritt 3 — Tabelle abbauen (eigenes Deploy, frühestens einen Tag später)

```sql
-- <nr>_drop_lead_activities.sql
DROP TABLE IF EXISTS lead_activities;
```

Das Drizzle-Modell und sein Barrel-Eintrag entfallen im selben Deploy.

## Tickets

### CRM-35-T1 — Nachweis und Verifikation

- **Files:** Verifikationsskript aus Ordner 02 erneut ausführbar machen, Nachweisdokument im PR
- **Inhalt:**
  - Zähl-, ID-, Typ- und Zeitstempelvergleich zwischen `lead_activities` und `activities`
  - Vollständige Trefferliste der statischen Suche
  - Bestätigung des testweisen Restores aus Ordner 21
- **Akzeptanz:**
  - Der Vergleich meldet null Abweichungen; bei jeder Abweichung bricht die Einheit ab
  - Die Trefferliste enthält keinen Lesezugriff außerhalb der vier erlaubten Stellen
  - Der Restore-Nachweis nennt Datum, Manifest und SHA-256

### CRM-35-T2 — Dual-Write abschalten

- **Files:** `activity-service.ts` + bestehende Tests
- **Inhalt:** Schreibpfad nach `lead_activities` entfernen, sonst nichts
- **Akzeptanz:**
  - Bestehende Lead-Tests bleiben inhaltlich unverändert und grün
  - Eine neue Lead-Activity landet in `activities` und **nicht** in `lead_activities`
  - Die Lead-Timeline zeigt historische und neue Einträge lückenlos und in derselben Reihenfolge
  - Bei identischen Zeitstempeln bleibt die Reihenfolge deterministisch
  - Rollback (Dual-Write zurück an) ist getestet und verliert keine Daten

### CRM-35-T3 — Tabelle abbauen

- **Files:** Drop-Migration, Entfernen von Modell und Barrel-Eintrag
- **Inhalt:** ausschließlich der Drop
- **Akzeptanz:**
  - Die Migration enthält kein weiteres Statement
  - `pnpm db:migrate:dev` und `pnpm db:smoke:dev` sind grün
  - Ein zweiter Lauf ist folgenlos (`IF EXISTS`)
  - Nach dem Drop referenziert kein Typ und kein Import die alte Tabelle
  - Typecheck und Build sind grün, ohne dass eine Testerwartung geändert wurde

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Für Nutzer ändert sich an keiner Stelle etwas.
2. **Bricht nichts:** Schritt 2 entfernt nur einen zweiten Schreibpfad, dessen Ziel niemand liest.
   Schritt 3 entfernt eine Tabelle, für die Schritt 1 den fehlenden Leser belegt hat.
3. **Offen:** nichts. Nach dieser Einheit ist der Plan abgeschlossen und `AGENTS.md` unter
   `plans/crm/` kann entfernt werden.

## End-to-End-Akzeptanz

1. Der Verifikationslauf meldet vor Beginn null Abweichungen.
2. Nach Schritt 2 landet jede neue Lead-Activity ausschließlich in `activities`.
3. Die Lead-Timeline ist vor und nach jedem Schritt inhaltlich identisch.
4. Nach Schritt 3 existiert `lead_activities` nicht mehr, und die Anwendung läuft unverändert.
5. Kein Bestandstest wurde inhaltlich geändert.
6. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes und
   `pnpm --filter @invessiv/workspace build` sind grün.
