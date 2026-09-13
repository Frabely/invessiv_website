# AGENTS.md — Auth-Drizzle-Modelle

Gilt für `packages/db/src/record-configuration/auth/**`. Ergänzt `packages/db/AGENTS.md`. Die fachlichen Regeln stehen
in
`apps/workspace/plans/crm/03-mitglieder-und-auth/02-rechtesystem.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Warum ein eigener Unterordner

`users`, `permissions`, `roles`, `role_permissions`, `workspace_member_roles` und `security_events` sind
querschnittlich: Workspace und später das Portal nutzen sie gleichermaßen. Sie gehören deshalb weder zu `crm/` noch zu
den Lead-Tabellen. `workspace_members` bleibt in `crm/`, weil Ordner 01 sie dort angelegt hat.

## Verbindlich

- **Die DB schützt das Rechtemodell selbst.** Realm-Gleichheit und Delegierbarkeit laufen über zusammengesetzte
  Fremdschlüssel (`role_permissions`, `workspace_member_roles`) und CHECKs — nicht nur über TypeScript. Wer diese
  Schlüssel vereinfacht, öffnet Privilege Escalation per SQL.
- **Katalog und Systemrollen ändern sich nur per Migration.** Jede Änderung an `PERMISSION_DEFINITIONS` oder
  `SYSTEM_ROLE_DEFINITIONS` braucht eine Migration im selben Changeset; `scripts/rbac-catalog-check.ts` schlägt sonst
  in `db:smoke` fehl. Der Owner erhält eine neue Workspace-Permission in derselben Migration.
- **`security_events` ist append-only.** Kein Update-, kein Delete-Pfad, kein `version`. Ein DB-Trigger weist Update
  und Delete ab. Ausschließlich Migrationen und Fixture-Cleanup dürfen innerhalb ihrer Transaktion über
  `set_config('invessiv.security_event_maintenance', 'on', true)` explizit den Maintenance-Pfad öffnen.
  `subject_id` bekommt bewusst keinen Fremdschlüssel.
- **Actor-Invariante** für `activities` und `security_events` kommt ausschließlich aus `sqlActorInvariant`
  (`@invessiv/db/core`), damit beide Tabellen identisch prüfen.
- E-Mail-Spalten tragen keinen Unique-Index und autorisieren nie.

## Bewusst nicht vorhanden

- Keine direkte Tabelle `workspace_member_permissions`: Rechte kommen ausschließlich über Rollen.
- Kein Deny-Flag an Rollen oder Zuweisungen.
- Kein DB-Default für `roles.active`, `users.active` oder `workspace_member_roles.assigned_at`.
