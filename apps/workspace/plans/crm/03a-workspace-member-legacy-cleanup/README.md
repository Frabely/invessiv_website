# Ordner 03a — Workspace-Member-Legacy-Cleanup

> **Status:** aufgelöst (13.09.2026) · **Ersetzt durch:** Ordner 03

## Warum aufgelöst

Der Cleanup existierte nur, weil Ordner 03 die Legacy-Spalten `clerk_user_id`, `email`, `role` und
`credentials_access` für die vorherige App-Version am Leben halten sollte. Die Prüfung vor der Umsetzung ergab:

- Die vorherige App-Version liest `workspace_members` nirgends.
- Alle Ordner-01-Tabellen sind leer.

Mit Zustimmung des Nutzers entfernt die Ordner-03-Migration die Spalten deshalb direkt nach einer harten
Leerheitsprüfung. Schattenwrites entfallen. Ein eigener Merge ist nicht mehr nötig; die Ordnernummer wird nicht
wiederverwendet.

Die Abnahmekriterien dieses Ordners sind vollständig in das Merge-Gate von
[`03-mitglieder-und-auth`](../03-mitglieder-und-auth/README.md) übernommen.

## Nachprüfung nach Merge (13.09.2026)

Ordner 03 ist über PR #6 (`feat/crm-users-rbac`) auf `master` gemerged. Der Cleanup ist damit vollständig umgesetzt;
für diesen Ordner bleibt nichts zu tun.

| Prüfung                                                                                                                                         | Ergebnis |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `0024_create_users_roles_and_permissions.sql`: Leerheits-Preflight, `DROP INDEX` der drei Legacy-Indizes, `DROP COLUMN` der vier Legacy-Spalten | erfüllt  |
| Drizzle-Modell `record-configuration/crm/workspace-members.ts` enthält nur `id`, `user_id`, `active`, `version`, Zeitstempel                    | erfüllt  |
| Repository-Suche außerhalb von Plänen/Migrationen: kein `credentials_access`, `WORKSPACE_ALLOWED_EMAILS`, `WorkspaceRole`                       | erfüllt  |
| `apps/workspace/.env.example` führt nur `WORKSPACE_BOOTSTRAP_CLERK_USER_ID`                                                                     | erfüllt  |
| `pnpm --filter @invessiv/db db:smoke:rbac` gegen Dev-DB, u. a. „legacy identity columns are gone from workspace_members"                        | 41/41 ok |
