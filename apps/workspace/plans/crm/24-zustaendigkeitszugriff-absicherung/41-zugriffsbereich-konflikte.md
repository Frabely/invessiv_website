# Task 41 — Konfliktfeste Zugriffsbereichsverwaltung

> **Merge-Einheit:** Ordner 24 · **Branch:** `feat/crm-zustaendigkeitszugriff-absicherung` · **Aufwand:** S ·
> **Abhängigkeiten:** Task 38, Task 40 · **Migration:** keine

## Ausgangslage

Die Zugriffsverwaltung speichert die vollständige Menge gebundener Rollenzuweisungen bewusst als eine versionierte
Mutation (`replaceAccessScopes`). Das ist das beschlossene Bedienmodell: Mehrere Änderungen werden erst mit
„Speichern“ übernommen.

Ändert eine andere Person dasselbe Mitglied zwischen dem Laden des Dialogs und dem Speichern, antwortet der Server mit
HTTP 409 und dem aktuellen Mitgliedsstand. Der Dialog darf den lokalen Entwurf dann weder still verwerfen noch mit dem
alten Gesamtsatz erneut speichern: Beides würde eigene Änderungen verlieren beziehungsweise fremde, parallele
Zuweisungen entfernen.

## Ziel

Der Dialog führt den lokalen Entwurf konfliktfest auf den aktuellen Serverstand zurück. Unabhängige parallele
Änderungen bleiben erhalten, die eigene Absicht bleibt sichtbar, und ein erneutes Speichern geschieht nur bewusst durch
den Benutzer.

## Verhalten

1. Beim Öffnen speichert der Client den Ausgangssatz der Zuweisungen, den bearbeiteten Entwurf und die
   Mitgliedsversion.
2. Bei 409 lädt er den aktuellen Zuweisungssatz sowie die aktuelle Version nach.
3. Er bildet einen Patch aus dem eigenen Entwurf: hinzugefügte und entfernte Zuweisungen gegenüber dem Ausgangssatz.
4. Dieser Patch wird auf den aktuellen Serverstand angewandt. Unabhängige fremde Zuweisungen bleiben erhalten.
5. Der Dialog zeigt einen klaren Konflikthinweis, den neu zusammengesetzten Entwurf und den aktuellen Stand als
   Vergleich. Er speichert nicht automatisch erneut.
6. Bei widersprüchlicher Änderung derselben Zuweisung bleibt die eigene letzte Auswahl sichtbar und wird als Konflikt
   markiert. Der Benutzer entscheidet ausdrücklich, ob er sie erneut speichert oder verwirft.

## Umfang

- Rebase-Helfer als getestetes, seiteneffektfreies Pattern: Ausgangssatz, lokaler Entwurf und aktueller Satz ergeben
  den neuen Entwurf sowie die konfligierenden Zuweisungen.
- `useAccessScopeTree` behält bei 409 den Entwurf und verwendet die neue Mitgliedsversion erst nach dem Rebase.
- Settings-Dialog und Kundenakten-Dialog zeigen denselben Konfliktzustand, inklusive aktuellem Stand und klaren
  Aktionen zum erneuten Speichern oder Verwerfen.
- DE- und EN-Texte für Hinweis, Vergleich und Aktionen.
- Keine Änderung an der Server-API, den Sicherheitsregeln oder dem Sammel-Speichern.

## Tests und Abnahme

- a conflict replays independent local additions and removals onto the current server assignment set
- a conflict preserves a concurrent assignment that the local user did not edit
- a conflicting assignment remains visible and requires an explicit follow-up action
- the rebased draft uses the current member version and is not submitted automatically
- Settings and customer-record dialogs expose the same accessible conflict state
- Tastatur, Fokus, Mobilansicht sowie DE/EN sind für den Konfliktzustand geprüft.

## Akzeptanz

- Eine 409-Antwort verwirft keinen lokalen Entwurf still.
- Ein erneutes Speichern entfernt keine fremde, unabhängige Zuweisung.
- Der Benutzer erkennt ohne Raten, was sich parallel geändert hat und welche Entscheidung noch offen ist.
