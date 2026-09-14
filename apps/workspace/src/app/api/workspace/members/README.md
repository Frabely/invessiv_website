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
| `PATCH /members/[id]`                  | `members.manage` |
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

| Status | `error`                                             | Bedeutung                                                              |
| ------ | --------------------------------------------------- | ---------------------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`                                  | Body kein JSON oder Schemafehler; `details` enthält Feldpfade          |
| 404    | `MEMBER_NOT_FOUND`                                  | Mitglied existiert nicht oder ID ist keine UUID                        |
| 404    | `CLERK_ACCOUNT_NOT_FOUND`                           | Clerk kennt die ID nicht                                               |
| 409    | `CLERK_ACCOUNT_ALREADY_LINKED`                      | Die Clerk-ID gehört bereits zu einem User                              |
| 409    | `ALREADY_OWNER` / `NOT_OWNER`                       | Owner-Flow passt nicht zum aktuellen Stand                             |
| 409    | `LAST_ACTIVE_OWNER`                                 | Der letzte aktive Owner kann die Owner-Rolle nicht verlieren           |
| 409    | `SELF_OWNER_REVOCATION`                             | Niemand entzieht sich selbst die Owner-Rolle                           |
| 409    | `MEMBER_ALREADY_ACTIVE` / `MEMBER_ALREADY_INACTIVE` | Der gewünschte Status ist bereits gespeichert                          |
| 409    | `SELF_DEACTIVATION`                                 | Niemand deaktiviert den eigenen Zugang                                 |
| 409    | `MEMBER_HAS_OPEN_RESPONSIBILITIES`                  | Offene Zuständigkeiten verhindern die Deaktivierung                    |
| 409    | `MEMBER_INACTIVE`                                   | Deaktivierte Mitglieder können nicht Owner werden                      |
| 422    | `CLERK_ACCOUNT_INCOMPLETE`                          | Clerk-Konto ohne primäre E-Mail                                        |
| 422    | `ROLE_NOT_ASSIGNABLE`                               | Rolle unbekannt, fremder Realm oder inaktiv und nicht schon zugewiesen |
| 422    | `OWNER_ROLE_NOT_ASSIGNABLE`                         | Owner-Rolle über `/roles` statt über den Owner-Flow                    |
| 422    | `MEMBER_WITHOUT_ROLE`                               | Danach bliebe keine Rolle übrig                                        |
| 503    | `CLERK_UNAVAILABLE`                                 | Clerk Backend API nicht erreichbar                                     |
| 500    | `INTERNAL`                                          | Unerwarteter Fehler                                                    |

---

## `GET /api/workspace/members`

`200 { "members": WorkspaceMemberOptionDto[] }` — nur aktive Mitglieder aktiver User, sortiert nach Anzeigename, mit
`id` und `displayName`. Bewusst ohne E-Mail, Rollen und Owner-Status: `members.read` steckt in der Basisrolle. Die
Verwaltungsansicht lädt das vollständige `WorkspaceMemberDto` serverseitig in der Settings-Page.

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
Erfolg: `200 { "candidates": ClerkCandidateDto[] }` — höchstens 100 Clerk-Konten ohne `users`-Zeile. Der Server
paginiert dafür über bereits verknüpfte Konten hinweg; 100 neuere, belegte Konten verdecken keine älteren freien.

## `PATCH /api/workspace/members/[id]`

Body `UpdateWorkspaceMemberStatusRequestDto`: `{ "active": boolean, "version": n }`. Erfolg:
`200 { "member": WorkspaceMemberDto }` plus genau ein Security-Event `workspace_member_activated` oder
`workspace_member_deactivated`. Selbstdeaktivierung und die Deaktivierung des letzten aktiven Owners werden
abgewiesen. Bei offenen Zuständigkeiten enthält `details.responsibilityCounts` die vollständigen Anzahlen je
`OwnableEntity`; es findet kein Teil-Write statt.

## `PUT /api/workspace/members/[id]/roles`

Body `ReplaceWorkspaceMemberRolesRequestDto`: `{ "roleIds": ["<uuid>"], "version": n }` — vollständiger Satz der
Nicht-Owner-Rollen. Erfolg `200 { "member" }`; ohne tatsächliche Änderung kein Versionssprung und kein Event.

## `POST` / `DELETE /api/workspace/members/[id]/owner`

Body `ChangeWorkspaceOwnerRequestDto`: `{ "version": n }`. `POST` vergibt, `DELETE` entzieht die Owner-Rolle. Erfolg
`200 { "member" }` plus Security-Event `workspace_owner_granted` bzw. `workspace_owner_revoked`. `POST` weist
deaktivierte Mitglieder mit `MEMBER_INACTIVE` ab, weil ein inaktiver Owner keinen Zugriff hat und nicht als aktiver
Owner zählt; `DELETE` bleibt für inaktive Owner möglich.
