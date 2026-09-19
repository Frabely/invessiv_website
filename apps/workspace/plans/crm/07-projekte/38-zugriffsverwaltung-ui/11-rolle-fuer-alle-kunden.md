# 11 — Eine Rolle über alle Kunden hinweg

> **Status:** bewusst verschoben, **nicht Teil von Ordner 07c**
> **Auslöser:** ab etwa 20 Kunden, oder sobald eine Teilbereichsrolle regelmäßig bei jedem Kunden gebraucht wird

## Das Problem

Ein Mitarbeiter soll „nur die Chats" sehen — bei **allen** Kunden. Heute gibt es dafür zwei Wege, und beide
sind unbefriedigend:

1. Die Rolle je Kunde zuweisen. Bei 3 Kunden geht das, bei 30 nicht, und jeder neue Kunde erzeugt Nacharbeit
   bei jedem betroffenen Mitarbeiter.
2. Eine zweite, **nicht bindbare** Rolle mit demselben Rechtesatz anlegen und workspace-weit vergeben.
   Damit existiert jede Teilbereichsrolle doppelt im Katalog, und beide müssen synchron gepflegt werden.

## Warum Weg 1 nicht abkürzbar ist

`scope_assignable` bedeutet heute „ **nur** gebunden vergebbar". Belege:

- `apps/workspace/src/server/workspace/access/services/role-assignment-service.ts`, `checkAssignable`:
  eine Rolle ist workspace-weit nur zuweisbar, wenn `!row.scope_assignable` oder sie bereits gehalten wird.
  Der Kommentar nennt den Grund: „assigning it workspace-wide would grant its permissions on every customer".
- `apps/workspace/src/common/patterns/access/role-selection.ts`, `selectAssignableRoles`: dieselbe Regel in
  der Auswahl des Rollen-Dialogs.
- `packages/common/src/contracts/auth/role-assignment-option.dto.ts`: der Docstring schreibt es fest.

Die Regel schützt vor einem Versehen im Rollen-Dialog. Sie verhindert aber auch genau die Absicht, um die es
hier geht.

## Empfohlener Weg

**Die Semantik von `scope_assignable` von „nur gebunden" auf „auch gebunden" ändern** und die Absicht
stattdessen an der Handlung festmachen.

1. `checkAssignable` und `selectAssignableRoles` lassen eine bindbare Rolle auch workspace-weit zu.
2. Die Wurzelzeile „Alle Kunden" im Zugriffs-Baum wird **schreibbar** und schreibt eine ganz normale
   workspace-weite Zuweisung über den bestehenden `replaceWorkspaceMemberRoles`-Weg.
3. Der Schutz bleibt erhalten, wandert aber vom Verbot zur bewussten Handlung: Die Zeile heißt „Alle Kunden",
   nennt die Zahl der betroffenen Kunden und verlangt eine Bestätigung.
4. Der Rollen-Dialog bietet bindbare Rollen weiterhin nicht in der allgemeinen Liste an — der einzige Weg zu
   einer workspace-weiten Vergabe einer bindbaren Rolle bleibt die beschriftete Wurzelzeile.
5. Der Hinweistext im Rollen-Dialog (Task 04) wird entsprechend nachgezogen.

**Keine Datenbankänderung.** `workspace_member_roles` trägt die workspace-weite Zuweisung bereits; `canOn`
prüft globale Rechte ohnehin zuerst (`can-on.ts`), also wirkt die Rolle sofort auf jedem Kunden, auch auf
später angelegten.

## Verworfene Alternativen

| Alternative                                   | Warum nicht                                                                                                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neuer Scope-Typ `all` in `access_scope_types` | Dupliziert exakt, was eine workspace-weite Zuweisung schon tut. Zwei Wege zum selben Ergebnis, `customer_id` müsste nullable werden, alle Unique-Indizes und FKs wären betroffen. |
| Sammelaktion „auf alle Kunden anwenden"       | Schreibt n Zeilen und erfasst später angelegte Kunden nicht. Genau der Wartungsaufwand, den es zu vermeiden gilt.                                                                 |
| Zweite, nicht bindbare Rolle je Teilbereich   | Der heutige Zustand. Doppelter Katalog, doppelte Pflege, Drift zwischen beiden Rechtesätzen.                                                                                      |

## Vorbereitung in Ordner 07c

Task 05 baut die Wurzelzeile „Alle Kunden" bereits als eigene Zeilenart — nur lesend, mit gesperrten Haken
und Verweis auf den Rollen-Tab. Sie schreibbar zu machen ist danach eine lokale Änderung an dieser Zeile und
an den zwei genannten Server-Stellen, kein Umbau des Baums.

## Offene Voraussetzung

Der Fall „nur Chats" braucht außerdem Permissions, die es noch nicht gibt: `chat.*` kommt in Ordner 17,
`tasks.read` in Ordner 08. Beide werden bei Einführung als bindbar oder workspace-weit eingeordnet (Pflicht aus
`plans/crm/AGENTS.md`). Zu klären ist dabei auch die bestehende Abweichung: `services.read` und
`services.write` wurden mit `scopeAssignable: false` eingeführt, obwohl Ordner 07 sie hätte einordnen müssen —
für Task 41 (Projektleistungszuweisung) vorab entscheiden.

## Architektur-Gate

| Punkt            | Inhalt                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Stelle           | `server/workspace/access/services/role-assignment-service.ts`, `common/patterns/access/role-selection.ts` |
| Regelbezug       | Root-`AGENTS.md`, Architektur-Gate: Abweichung dokumentieren statt still weiterbauen                      |
| Risiko           | Gering, solange die Wurzelzeile der einzige Weg bleibt und bestätigt werden muss                          |
| Nächster Schritt | Bei Erreichen des Auslösers diesen Task als eigene Merge-Einheit planen                                   |
