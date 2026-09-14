# Workspace Members API

JSON-API der Mitgliederverwaltung im Settings-Bereich. Server-only, Clerk-authentifiziert, permissionbasiert
autorisiert. Fachliche Grundlage:
`plans/crm/03b-mitglieder-und-rollenverwaltung/02c-mitglieder-und-rollenverwaltung.md`.

> **Quelle der Wahrheit für den Contract:** dieses Dokument. Änderungen an Endpunkten, Statuscodes oder Bodies
> aktualisieren diese Datei im selben Commit.

## Auth

Jeder Handler ist mit `withPermission(Permission.X, handler)` gewrappt: ohne Session `401 UNAUTHORIZED`, ohne aktive
Mitgliedschaft `404 NOT_FOUND`, DB-Fehler bei der Auflösung `503 UNAVAILABLE`, fehlende Permission `403 FORBIDDEN`.

| Route                                  | Permission       |
| -------------------------------------- | ---------------- |
| `GET /members`                         | `members.read`   |
| `POST /members`                        | `members.manage` |
| `POST /members/clerk-candidates`       | `members.manage` |
| `PUT /members/[id]/roles`              | `members.manage` |
| `POST /members/[id]/owner`, `DELETE …` | `members.manage` |

## Fehlerformat

```json
{
  "error": "<MACHINE_CODE>",
  "message": "<english, no PII>",
  "details": <optional
  zod
  issues>
}
```

Ausnahme **409 Versionskonflikt**: Der Body ist ein `VersionConflictDto`
(`{ "code": "version_conflict", "currentVersion": n, "current": WorkspaceMemberDto }`).

| Status | `error`                        | Bedeutung                                                              |
| ------ | ------------------------------ | ---------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`             | Body kein JSON oder Schemafehler; `details` enthält Feldpfade          |
| 404    | `MEMBER_NOT_FOUND`             | Mitglied existiert nicht oder ID ist keine UUID                        |
| 404    | `CLERK_ACCOUNT_NOT_FOUND`      | Clerk kennt die ID nicht                                               |
| 409    | `CLERK_ACCOUNT_ALREADY_LINKED` | Die Clerk-ID gehört bereits zu einem User                              |
| 409    | `ALREADY_OWNER` / `NOT_OWNER`  | Owner-Flow passt nicht zum aktuellen Stand                             |
| 409    | `LAST_ACTIVE_OWNER`            | Der letzte aktive Owner kann die Owner-Rolle nicht verlieren           |
| 409    | `SELF_OWNER_REVOCATION`        | Niemand entzieht sich selbst die Owner-Rolle                           |
| 422    | `CLERK_ACCOUNT_INCOMPLETE`     | Clerk-Konto ohne primäre E-Mail                                        |
| 422    | `ROLE_NOT_ASSIGNABLE`          | Rolle unbekannt, fremder Realm oder inaktiv und nicht schon zugewiesen |
| 422    | `OWNER_ROLE_NOT_ASSIGNABLE`    | Owner-Rolle über `/roles` statt über den Owner-Flow                    |
| 422    | `MEMBER_WITHOUT_ROLE`          | Danach bliebe keine Rolle übrig                                        |
| 503    | `CLERK_UNAVAILABLE`            | Clerk Backend API nicht erreichbar                                     |
| 500    | `INTERNAL`                     | Unerwarteter Fehler                                                    |

---

## `GET /api/workspace/members`

`200 { "members": WorkspaceMemberDto[] }` — sortiert nach Anzeigename. `roles` enthält keine Owner-Rolle; dafür steht
`isOwner`.

## `POST /api/workspace/members`

Body `AddWorkspaceMemberRequestDto`:

```json
{
  "clerkUserId": "user_…",
  "roleIds": ["<uuid>"]
}
```

Name und E-Mail lädt der Server per Clerk-ID nach; zusätzliche Felder im Body werden verworfen. Erfolg:
`201 { "member": WorkspaceMemberDto }`, dazu ein Security-Event `workspace_member_added`.

## `POST /api/workspace/members/clerk-candidates`

Body `ListClerkCandidatesRequestDto`: `{ "query": "…" }`. `query` darf leer und höchstens 100 Zeichen lang sein.
Die Suche steht bewusst im Body, damit Namen und E-Mail-Adressen nicht in URLs oder URL-Logs gelangen.
Erfolg: `200 { "candidates": ClerkCandidateDto[] }` — höchstens 100 Clerk-Konten ohne `users`-Zeile.

## `PUT /api/workspace/members/[id]/roles`

Body `ReplaceWorkspaceMemberRolesRequestDto`: `{ "roleIds": ["<uuid>"], "version": n }` — vollständiger Satz der
Nicht-Owner-Rollen. Erfolg `200 { "member" }`; ohne tatsächliche Änderung kein Versionssprung und kein Event.

## `POST` / `DELETE /api/workspace/members/[id]/owner`

Body `ChangeWorkspaceOwnerRequestDto`: `{ "version": n }`. `POST` vergibt, `DELETE` entzieht die Owner-Rolle. Erfolg
`200 { "member" }` plus Security-Event `workspace_owner_granted` bzw. `workspace_owner_revoked`.
