# Task 42a — Dealvolumen im Mitarbeiter-Cockpit

> **Merge-Einheit:** Ordner 07d · **Branch:** `feat/crm-pakete-und-kundenvolumen`
> **Aufwand:** S · **Abhängigkeiten:** Task 08b, Task 08c, Task 42
> **Migration:** keine

## Ziel

Erweitert die in Task 08b/08c gemeinsam genutzte Cockpit-Aggregationsfunktion um Kundenwert, Projektwert
und offene Pipeline-Positionen (`requested`/`offered`), sobald das Paketmodell existiert — ohne eine
zweite Wertberechnung neben Task 42 einzuführen. Weil Liste (08b) und Einzelkunden-Dialog (08c) dieselbe
Funktion aufrufen, erscheinen die Werte automatisch an beiden Stellen, sobald diese Erweiterung gemergt
ist — keine separate Änderung am Dialog nötig.

## Entscheidungen

| Bereich      | Entscheidung                                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Wertquelle   | Dieselbe Funktion wie in Kundenliste, Kundenakte und Projektkarte (Task 42); keine eigene Berechnung im Cockpit. |
| Aggregation  | Summe des Kundenwerts und der Pipeline über alle dem Mitglied zugewiesenen Kunden.                               |
| Reihung      | Kunden mit der längsten Liegedauer einer offenen Pipeline-Position stehen zuerst.                                |
| Berechtigung | Zusätzlich zu Task 08b wird `packages.read` verlangt; ohne die Permission bleiben Wertspalten serverseitig weg.  |

## Contracts und Endpunkt

Erweitert die Antwort von `GET /api/workspace/crm/cockpit/my-customers` (Task 08b) um `customerValueCents`,
`pipelineCents` und `oldestPendingStageDays` je Kunde. Ohne `packages.read` bleiben diese Felder aus der
Antwort, statt leer befüllt zu werden.

## Tickets

### CRM-42a-T1 — Werte in die Cockpit-Abfrage aufnehmen

- Bestehende Wertfunktion aus Task 42 in der Cockpit-Query wiederverwenden statt zu duplizieren.
- **Akzeptanz:** Kundenwert im Cockpit und in der Kundenakte stimmen für denselben Kunden überein (Regressionstest).

### CRM-42a-T2 — Berechtigungsabhängige Anzeige

- Wertspalten nur bei vorhandenem `packages.read` ausliefern und rendern — in Liste (08b) und Dialog (08c)
  gleichermaßen, weil beide dieselbe Antwortstruktur konsumieren.
- **Akzeptanz:** Ein Mitglied ohne `packages.read` sieht die Zuständigkeits- und Anfragenübersicht aus
  Task 08b/08c unverändert, aber keine Wertspalten — in Liste und Dialog identisch.

## Nicht Teil dieses Tasks

- Aufgaben-, Renewal- oder Chat-Widgets (folgen in Ordner 08, 11, 17).
- Änderungen am Paketmodell oder an der Wertberechnung selbst (Task 40–42).

## Rollback

Wertspalten im Cockpit ausblenden; Task 08b bleibt unverändert funktionsfähig.
