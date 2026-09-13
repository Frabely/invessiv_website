# Task 02c — Mitglieder- und Rollenverwaltung

> **Merge-Einheit:** Ordner 03b · **Branch:** `feat/crm-mitglieder-und-rollenverwaltung`
> **Aufwand:** L · **Abhängigkeiten:** Task 02 (Ordner 03)
> **Migration:** eine additive Migration (CHECK-Erweiterung `security_events`); Nummer im Repository ermitteln

## Kontext

Ordner 03 liefert Identität, Katalog, Systemrollen, Gates und den Owner-Bootstrap — aber keinen Weg, weitere
Mitglieder anzulegen. Dieser Task liefert die Verwaltung vertikal vollständig. Er folgt aus dem Split-Gate von Task 02.

**Neuschnitt 13.09.2026 (mit dem Nutzer abgestimmt):** Der ursprüngliche Umfang lag bei geschätzt 140–150 Dateien.
Ownership-Registry, Übergabe und Deaktivierung wandern nach Ordner 03c (Task 02d). Ohne Deaktivierungspfad kann in 03b
kein inaktives Mitglied und damit keine verwaiste Zuständigkeit entstehen — der Zwischenstand ist sicher.
Permissionabhängige Lead-Aktionen bleiben bewusst in 03b: Ab diesem Merge existieren Mitglieder ohne `leads.delete`,
ein sichtbarer Löschbutton wäre sonst ein toter Button.

## Entscheidungen

| Bereich            | Entscheidung                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bereich            | `WorkspaceArea.Settings` → `Permission.MembersManage`; Route `/settings`, Tabs über `?tab=members\|roles` (URL-State)                                               |
| Rollen-Tab         | Nur sichtbar und ladbar mit `roles.manage`; beide Permissions sind nicht delegierbar, praktisch also nur Owner                                                      |
| Serverordner       | `src/server/workspace/access/` für Mitglieder, Rollen und Owner-Flow; Owner-Invariante als Service in `server/workspace/auth/`                                      |
| Lesen              | Settings-Page lädt serverseitig über Query-Handler; `GET /members` (`members.read`) und `GET /roles` bleiben als API-Contract                                       |
| Clerk-Kandidaten   | `clerkClient().users.getUserList` (max. 100, optional `query`), abzüglich aller Clerk-IDs mit `users`-Zeile                                                         |
| Anlegen            | Server lädt das Clerk-Konto per ID neu (`getUser`) — Name/E-Mail kommen nie aus dem Request                                                                         |
| Stammdaten-Sync    | Beim Rendern des Mitglieder-Tabs: geänderte Clerk-Stammdaten per `updateVersioned` in `users`; Clerk-Fehler blockiert die Liste nicht                               |
| Rollen zuweisen    | `PUT …/roles` ersetzt die Nicht-Owner-Rollen; danach muss mindestens eine Rolle (inkl. Owner) bleiben                                                               |
| Effektive Vorschau | Clientseitig aus den geladenen Rollen-DTOs über das Pattern `unionRolePermissions` — **kein** eigener Endpoint (Abweichung vom Erstplan, spart Roundtrip und Datei) |
| Owner-Flow         | `POST`/`DELETE …/owner` mit Member-Version; Entzug sperrt die Owner-Zuweisungen per `SELECT … FOR UPDATE`                                                           |
| Custom-Rolle       | Name 1–80 Zeichen, Beschreibung ≤ 280, nur delegierbare Workspace-Permissions; Name eindeutig je Realm (DB-Index)                                                   |
| Systemrollen       | Name, Beschreibung, Aktiv-Flag und Rechtesatz unveränderlich; nur zuweisbar                                                                                         |
| Kein Löschen       | Rollen werden deaktiviert, nicht gelöscht; zugewiesene Rollen blockiert die DB ohnehin (`ON DELETE RESTRICT`)                                                       |
| Security-Events    | Genau ein Eintrag je erfolgreicher Änderung; Metadaten nur IDs, Permission-Keys und Feldnamen — keine Namen, keine E-Mails                                          |
| UI-Bausteine       | Dialog-Hülle und Fokusfalle ziehen nach `components/workspace/shared/dialog/` (zweiter tatsächlicher Nutzer); Umzug nach `packages/ui` in Ordner 03d                |

## Endpunkte (alle über `WorkspaceApiEndpoint`)

| Methode + Pfad                                | Permission       | Erfolg | Fachfehler                                                                                                       |
| --------------------------------------------- | ---------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| `GET /api/workspace/members`                  | `members.read`   | 200    | —                                                                                                                |
| `POST /api/workspace/members`                 | `members.manage` | 201    | 400 Validierung · 404 Clerk-Konto fehlt · 409 bereits verknüpft · 422 Rolle ungültig/Owner/unvollständiges Konto |
| `GET /api/workspace/members/clerk-candidates` | `members.manage` | 200    | 503 Clerk nicht erreichbar                                                                                       |
| `PUT /api/workspace/members/[id]/roles`       | `members.manage` | 200    | 404 · 409 Version · 422 Owner-Rolle/inaktive/unbekannte Rolle/keine Rolle                                        |
| `POST /api/workspace/members/[id]/owner`      | `members.manage` | 200    | 404 · 409 Version · 409 bereits Owner                                                                            |
| `DELETE /api/workspace/members/[id]/owner`    | `members.manage` | 200    | 404 · 409 Version · 409 letzter aktiver Owner · 409 kein Owner                                                   |
| `GET /api/workspace/roles`                    | `roles.manage`   | 200    | —                                                                                                                |
| `POST /api/workspace/roles`                   | `roles.manage`   | 201    | 400 Validierung · 409 Name vergeben · 422 nicht delegierbare Permission                                          |
| `PATCH /api/workspace/roles/[id]`             | `roles.manage`   | 200    | 404 · 409 Version · 409 Name vergeben · 422 Systemrolle · 422 nicht delegierbar                                  |

Body-Formen stehen in `src/app/api/workspace/members/README.md` bzw. `…/roles/README.md`.

## Invarianten

- `PUT …/roles` darf `workspace_owner` weder setzen noch entfernen; dafür gibt es ausschließlich den Owner-Flow.
- Systemrollen: Name, Realm und Rechtesatz unveränderlich; nur Zuweisung möglich.
- Mindestens ein aktiver Owner: Entzug sperrt alle Owner-Zuweisungen mit `SELECT … FOR UPDATE` in derselben
  Transaktion, zählt aktive Owner (aktive Rolle, aktives Mitglied, aktiver User) und lehnt ab, wenn danach keiner
  bleibt.
- Niemand entzieht sich selbst die letzte Owner-Zuweisung (folgt aus der vorherigen Regel).
- Der Owner-Entzug verlangt mindestens eine weitere Rolle (`MEMBER_WITHOUT_ROLE`), damit ein Mitglied nicht still
  alle Rechte verliert. Ergänzt während der Umsetzung.
- Clerk-Kandidaten: nur Konten ohne `users`-Zeile; die Bindung erfolgt über die gewählte Clerk-ID, nie über E-Mail.
- Nicht delegierbare Permissions werden im Command mit eigenem Fehlercode abgewiesen; die DB-Constraint
  `role_permissions_delegation_check` bleibt die zweite Linie gegen manipulierte Requests.
- Jede Mitgliedsänderung (Rollen, Owner) erhöht `workspace_members.version` über `updateVersioned`; jede Rollenänderung
  erhöht `roles.version`. Veraltete Versionen liefern 409 mit `VersionConflictDto`.

## Security-Event-Typen (Migration erweitert die CHECK-Constraints)

| Typ                              | Subjekt            | Metadaten                                                 |
| -------------------------------- | ------------------ | --------------------------------------------------------- |
| `workspace_member_added`         | `workspace_member` | `roleIds`                                                 |
| `workspace_member_roles_changed` | `workspace_member` | `addedRoleIds`, `removedRoleIds`                          |
| `workspace_owner_granted`        | `workspace_member` | —                                                         |
| `workspace_owner_revoked`        | `workspace_member` | —                                                         |
| `role_created`                   | `role`             | `permissions`                                             |
| `role_updated`                   | `role`             | `changedFields`, `addedPermissions`, `removedPermissions` |

## Verzeichnisstruktur

```txt
packages/db/migrations/<n>_extend_security_events_for_access_management.sql
packages/db/scripts/smoke-rbac.ts                                   + CHECK-Werte ↔ Const-Objekte

packages/common/src/
  constants/auth/security-event-types.ts                            + sechs Typen
  constants/auth/security-subject-types.ts                          + role
  constants/auth/errors/workspace-member-error-codes.ts (+ test)
  constants/auth/errors/role-error-codes.ts (+ test)
  contracts/auth/{workspace-member,role,role-summary,clerk-candidate}.dto.ts
  contracts/auth/{add-workspace-member,replace-workspace-member-roles,change-workspace-owner,create-role,update-role}-request.dto.ts
  contracts/auth/results/*-result.ts
  patterns/auth/union-role-permissions.ts (+ test)

apps/workspace/src/
  common/constants/auth/workspace-areas.ts                          + Settings
  common/contracts/leads/lead-action-permissions.ts
  common/patterns/leads/resolve-lead-action-permissions.ts (+ test)
  config/routes.ts                                                  + SETTINGS
  app/api/workspace/members/{route.ts, clerk-candidates/route.ts, [id]/roles/route.ts, [id]/owner/route.ts, README.md}
  app/api/workspace/roles/{route.ts, [id]/route.ts, README.md}
  app/[locale]/(app)/settings/{page.tsx, AGENTS.md}
  lib/workspace/access/{member-api-error.ts, role-api-error.ts}
  server/workspace/access/
    AGENTS.md
    access-types.ts
    command-handler/{add-workspace-member, replace-workspace-member-roles, grant-workspace-owner, revoke-workspace-owner, create-role, update-role}.command-handler.ts
    command-handler/sync-workspace-member-profiles.command-handler.ts
    query-handler/{list-workspace-members, list-roles, list-clerk-candidates}.query-handler.ts
    services/{access-schemas.ts, workspace-member-mapping-service.ts, role-mapping-service.ts, clerk-directory-service.ts}
  server/workspace/auth/services/workspace-owner-invariant-service.ts
  components/workspace/shared/dialog/{dialog-focus-trap.ts, workspace-dialog/}
  components/workspace/settings/
    AGENTS.md
    shell/settings-tabs/
    members/{members-list, add-member-dialog, member-roles-dialog, owner-change-dialog}/
    roles/{roles-list, role-form-dialog}/
    shared/permission-list/
  client/access/access-api-service.ts (+ test)
  i18n/dictionaries/workspace/settings/{meta,members,roles,permissions}/{de,en}.json + index.ts
```

## Tickets

### CRM-03b-T1 — Migration, Konstanten, Contracts

- Migration: `security_events_type_check` und `security_events_subject_type_check` per `DROP CONSTRAINT IF EXISTS` +
  `ADD CONSTRAINT` erweitern (nur erweitern, nie verengen; idempotent).
- Const-Objekte, Fehlercodes, DTOs mit Docstring auf jedem Feld, Pattern `unionRolePermissions`.
- Smoke: DB-CHECK-Werte von `security_events` entsprechen exakt den Const-Objekten.
- **Akzeptanz:** zweiter Migrationslauf folgenlos; `db:smoke:rbac` grün; Const-Tests grün.

### CRM-03b-T2 — Mitglieder-Commands und -Queries

- `listWorkspaceMembers`, `listClerkCandidates`, `addWorkspaceMember`, `replaceWorkspaceMemberRoles`,
  `syncWorkspaceMemberProfiles`; Mapping in getesteten Services.
- **Akzeptanz:** Unit-Tests für Mapping und Schemas; Anlegen mit bereits verknüpfter Clerk-ID ergibt 409; Owner-Rolle
  in `PUT …/roles` ergibt 422; genau ein Security-Event je Erfolg.

### CRM-03b-T3 — Owner-Flow

- `grantWorkspaceOwner`, `revokeWorkspaceOwner`; Invariante in `workspaceOwnerInvariantService`.
- **Akzeptanz:** Integrationstest: zwei Owner, beide entziehen sich parallel → genau einer bleibt; letzter Owner → 409.

### CRM-03b-T4 — Rollen-Commands und -Queries

- `listRoles` (inkl. Anzahl zugewiesener Mitglieder), `createRole`, `updateRole`.
- **Akzeptanz:** nicht delegierbare Permission → 422, auch wenn der Request `delegable` behauptet; Systemrolle → 422;
  doppelter Name (Groß-/Kleinschreibung, Randleerzeichen) → 409.

### CRM-03b-T5 — Routen

- Alle Endpunkte oben mit `withPermission`, Fehlercode→HTTP über nicht exportierte Message-Maps, READMEs.
- **Akzeptanz:** Route-Tests je Endpunkt für 401/404/403/Erfolg/Fachfehler.

### CRM-03b-T6 — Settings-UI

- Sidebar-Eintrag, Page mit Tabs, Mitgliederliste (Name, E-Mail, Rollen-Badges, Owner-Markierung, „Du"),
  Dialoge Mitglied hinzufügen (Kandidatensuche), Rollen zuweisen (Checkboxen + effektive Vorschau), Owner
  vergeben/entziehen (Bestätigung), Rollenliste (System/Custom, Status, Mitgliederzahl), Rollen-Dialog (Name,
  Beschreibung, Aktiv, Permissions
  gruppiert, nicht delegierbare sichtbar gesperrt mit Hinweis).
- Empty-States: keine Custom-Rollen („wofür Rollen gedacht sind"), keine Clerk-Kandidaten („Konto erst im
  Clerk-Dashboard einladen").
- 409-Konflikte zeigen den aktuellen Stand und behalten die Eingaben.
- **Akzeptanz:** DE/EN vollständig; Tastatur, Fokusfalle, Fokus-Rückgabe; Mobil, Dark und Light geprüft.

### CRM-03b-T7 — Permissionabhängige Lead-Aktionen

- Page leitet `LeadActionPermissions` (`canWrite`, `canDelete`, `canImport`, `canGenerateOutreach`) aus dem Actor ab;
  Header, Tabelle, Zeilenaktionen, Bulk-Leiste und Detail-Panel blenden Aktionen ohne Permission aus.
- **Akzeptanz:** Komponententests für ausgeblendete Aktionen; Bestandstests bleiben grün.

### CRM-03b-T8 — Integrationstests gegen die Dev-DB

- Datei `access-management.integration.test.ts` (Modus `rbac-integration`): Custom-Rolle 200/403, Rollenentzug beim
  nächsten Request, letzter Owner 409, nicht delegierbar 422 bei manipuliertem Request, veraltete Version 409, genau ein
  Security-Event mit tatsächlichem Actor.

## Nicht Teil dieses Tasks

- Ownership-Registry, Übergabe, Aktivieren/Deaktivieren → Task 02d (Ordner 03c)
- Umzug der Dialog-/Listenbausteine nach `packages/ui` → Ordner 03d
- Security-Audit-Ansicht (`security.audit`) → späterer Ordner
