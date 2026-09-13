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
