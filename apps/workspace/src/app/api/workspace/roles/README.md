# Workspace Roles API

JSON-API der Rollenverwaltung im Settings-Bereich. Auth-Verhalten und Fehlerformat wie in
`src/app/api/workspace/members/README.md`; alle Routen verlangen `roles.manage`.

## Fehlercodes

| Status | `error`                    | Bedeutung                                                                      |
| ------ | -------------------------- | ------------------------------------------------------------------------------ |
| 400    | `VALIDATION_ERROR`         | Body kein JSON oder Schemafehler; `details` enthält Feldpfade                  |
| 404    | `ROLE_NOT_FOUND`           | Rolle existiert nicht, gehört nicht zum Workspace-Realm oder ID ist keine UUID |
| 409    | `ROLE_NAME_TAKEN`          | Name existiert im Realm bereits (Groß-/Kleinschreibung, Randleerzeichen egal)  |
| 409    | `version_conflict`         | Body `VersionConflictDto` mit `current: RoleDto`                               |
| 422    | `PERMISSION_NOT_DELEGABLE` | Nicht delegierbare Permission; die Delegierbarkeit kommt aus dem Code-Katalog  |
| 422    | `SYSTEM_ROLE_IMMUTABLE`    | Systemrollen sind unveränderlich                                               |
| 500    | `INTERNAL`                 | Unerwarteter Fehler                                                            |

---

## `GET /api/workspace/roles`

`200 { "roles": RoleDto[] }` — Systemrollen in Katalogreihenfolge, danach Custom-Rollen nach Name.

## `POST /api/workspace/roles`

Body `CreateRoleRequestDto`:

```json
{
  "name": "Vertrieb",
  "description": null,
  "permissions": ["leads.read", "leads.write"]
}
```

Erfolg `201 { "role": RoleDto }` plus Security-Event `role_created`.

## `PATCH /api/workspace/roles/[id]`

Body `UpdateRoleRequestDto`: `{ "name", "description", "active", "permissions", "version" }` — vollständiger Stand.
Erfolg `200 { "role": RoleDto }` plus Security-Event `role_updated` mit `changedFields`, `addedPermissions` und
`removedPermissions`. Ohne tatsächliche Änderung kein Versionssprung und kein Event. Eine deaktivierte Rolle bleibt
zugewiesen, gewährt aber ab dem nächsten Request nichts mehr.
