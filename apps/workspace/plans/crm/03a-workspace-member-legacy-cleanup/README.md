# Ordner 03a — Workspace-Member-Legacy-Cleanup

> **Status:** offen · **Abhängigkeit:** Ordner 03 produktiv ausgerollt · **Aufwand:** 1 Tag
> **Reviewziel:** 10–25 Dateien · **Branch:** `feat/crm-workspace-member-legacy-cleanup`

## Ziel und Stand nach Merge

Die nur für den sicheren Ordner-03-Rollout erhaltenen Legacy-Felder in `workspace_members` sind vollständig entfernt.
Identität läuft ausschließlich über `users.id`, Autorisierung ausschließlich über Rollen und Permissions. Es gibt
keine Schattenwrites und keinen alten Allowlist-/Rollenpfad mehr.

## Voraussetzung

Dieser Ordner darf erst beginnen, wenn:

- Ordner 03 produktiv ausgerollt und der erste Owner erfolgreich gebootstrappt wurde;
- ein Rollback auf die App-Version vor Ordner 03 nicht mehr vorgesehen ist;
- ein DB-Smoke bestätigt, dass keine benötigten Daten ausschließlich in Legacy-Feldern liegen;
- Repository-Suche und Laufzeittests bestätigen, dass kein Read mehr Legacy-Felder autorisierend verwendet.

## Konkreter Task-Plan

- [`02b-workspace-member-legacy-cleanup.md`](./02b-workspace-member-legacy-cleanup.md) — Schattenwrites entfernen,
  Schema verengen und RBAC als einzigen Autorisierungsweg nachweisen.

## Merge-Gate

- [ ] `workspace_members.clerk_user_id`, `email`, `role` und `credentials_access` sind entfernt.
- [ ] Zugehörige Legacy-Constraints und -Indizes sind entfernt.
- [ ] Migration und Drizzle-Modell sind deckungsgleich.
- [ ] Commands, Seeds und Fixtures schreiben keine Schattenwerte mehr.
- [ ] Auth verwendet ausschließlich `users.id`, Memberships, Rollen und Permissions.
- [ ] Env-Allowlist kann nach erfolgtem Bootstrap keinen Zugriff mehr öffnen.
- [ ] Activities menschlicher Änderungen referenzieren den tatsächlichen `users`-Datensatz.
- [ ] Negative Auth-, Migration- und DB-Smoke-Tests sind grün.

## Rollback

Vor dem Drop wird ein Schema-Snapshot der betroffenen Struktur dokumentiert. Da die Spalten nicht mehr als fachliche
Quelle verwendet werden, besteht der bevorzugte Rollback aus einem App-Rollforward. Falls ein Schema-Rollback nötig
ist, legt eine Gegenmigration die Legacy-Spalten und Constraints wieder an; Zugriff bleibt bis zur vollständigen
Wiederherstellung fail-closed.
