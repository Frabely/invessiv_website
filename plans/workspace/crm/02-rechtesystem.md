# Task 02 — Rechtesystem

> **Branch:** `feat/crm-rechtesystem`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 01 (Konstanten-Muster, `record-configuration/crm/`)
> **Migration:** `0022_create_workspace_members.sql` (Planwert)

## Context

Heute gibt es genau eine Zugriffsregel: steht die E-Mail in `WORKSPACE_ALLOWED_EMAILS`, darf man
alles. Das trägt nicht mehr, sobald Kunden ins Portal kommen und Zugangsdaten im System liegen.

Dieser Task baut das Fundament, **ohne eine einzige bestehende Prüfung zu entfernen**: Die Env-Allowlist
bleibt aktiv und wird zum Bootstrap (wer drinsteht, ist `owner`). Neu kommt darunter eine Rollen- und
Permission-Schicht, gegen die ab Task 03 alle neuen Features prüfen.

Recherche-Grundlage: tenant-scoped Rollen bei system-weiten Permissions ist der etablierte Zuschnitt.
Clerk-Custom-Roles scheiden aus — sie kosten in Production das B2B-Add-on und legen die Rechte
außerhalb der eigenen Datenbank ab, wo sie nicht mit Kundendaten joinbar sind.

## Entscheidungen

| Bereich        | Entscheidung                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identität      | Clerk, ausschließlich. Keine Rollen, keine Organisationen in Clerk                                                                                       |
| Rolle          | DB-Spalte, CHECK-Constraint aus Const-Objekt                                                                                                             |
| Permission     | Const-Objekt im Code, **nicht** als DB-Zeilen — typsicher und ohne Admin-UI-Aufwand                                                                      |
| Zuordnung      | `ROLE_PERMISSIONS satisfies Record<WorkspaceRole, readonly Permission[]>` — fehlt eine Rolle, bricht der Compiler                                        |
| Einstiegspunkt | Genau eine Funktion `can(actor, permission, resource?)`. Nirgends ein `if (role === "…")`                                                                |
| Bootstrap      | Env-Allowlist bleibt. Wer allowlisted ist, aber keine `workspace_members`-Zeile hat, gilt als `owner` und bekommt die Zeile beim ersten Zugriff angelegt |
| Portal-Rollen  | Werden hier **definiert**, aber erst in Task 20 vergeben — das Portal existiert noch nicht                                                               |

## Contract

```ts
// packages/common/src/constants/crm/permissions.ts
export const Permission = {
  CustomersRead: "customers.read",
  CustomersWrite: "customers.write",
  CustomersDelete: "customers.delete",
  ProjectsRead: "projects.read",
  ProjectsWrite: "projects.write",
  TasksWrite: "tasks.write",
  FilesRead: "files.read",
  FilesWrite: "files.write",
  FilesDelete: "files.delete",
  CredentialsRead: "credentials.read", // maskiert sehen
  CredentialsReveal: "credentials.reveal", // Klartext aufdecken
  CredentialsWrite: "credentials.write",
  PortalAccessManage: "portal.manage",
  MembersManage: "members.manage",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
```

```ts
// packages/common/src/constants/crm/roles.ts
export const WorkspaceRole = {
  Owner: "owner",
  Admin: "admin",
  Member: "member",
} as const;

export const PortalRole = {
  CustomerOwner: "customer_owner",
  CustomerMember: "customer_member",
} as const;
```

```ts
// packages/common/src/constants/crm/role-permissions.ts
export const ROLE_PERMISSIONS = {
  [WorkspaceRole.Owner]: [...Object.values(Permission)],
  [WorkspaceRole.Admin]: [/* alles außer MembersManage */],
  [WorkspaceRole.Member]: [
    /* lesen + Projekte/Aufgaben/Dateien, keine Credentials-Reveal */
  ],
} as const satisfies Record<WorkspaceRole, readonly Permission[]>;
```

```ts
// apps/workspace/src/server/auth/can.ts  — der einzige Einstiegspunkt
export function can(
  actor: Actor,
  permission: Permission,
  resource?: ResourceRef,
): boolean;
```

`Actor` ist eine diskriminierte Union: `{ kind: "workspace"; userId; email; role }` oder
`{ kind: "portal"; userId; customerId; role }`. Für Portal-Actors prüft `can()` zusätzlich, dass
`resource.customerId === actor.customerId` — Fremdzugriff ist damit nicht nur verboten, sondern
strukturell ausgeschlossen.

## Architektur

```txt
Page:   (app)/layout.tsx → requireWorkspaceAccess()  [bestehend, unverändert]
        Page/Sektion     → requireWorkspacePermission(Permission.X)  [neu]

API:    Route Handler    → withWorkspaceApiAuth(...)                 [bestehend]
                         → withPermission(Permission.X, handler)     [neu, wrappt den bestehenden]
```

`withPermission` ist eine Erweiterung, kein Ersatz: intern ruft es `withWorkspaceApiAuth` auf und
lehnt danach mit `403 FORBIDDEN` ab. Bestehende Routen bleiben unangetastet.

## Verzeichnisstruktur

```txt
packages/db/migrations/0022_create_workspace_members.sql
packages/db/src/record-configuration/crm/workspace-members.ts

packages/common/src/constants/crm/
  permissions.ts           (+ .test.ts)
  roles.ts                 (+ .test.ts)
  role-permissions.ts      (+ .test.ts)

apps/workspace/src/server/auth/
  can.ts
  resolve-workspace-actor.ts       Clerk-Session → Actor (inkl. Bootstrap)
  require-workspace-permission.ts  für Pages
  with-permission.ts               für Route Handler
apps/workspace/src/common/contracts/auth/actor.ts
apps/workspace/src/server/tests/auth/**
```

## Tickets

### CRM-02-T1 — Permissions, Rollen und Zuordnung

- **Files:** `packages/common/src/constants/crm/{permissions,roles,role-permissions}.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:** Const-Objekte wie oben; `ROLE_PERMISSIONS` mit `satisfies` typisieren
- **Akzeptanz:**
  - Test prüft: jede Rolle existiert in der Map, `owner` hat alle Permissions, `member` hat
    `CredentialsReveal` **nicht**
  - Ein bewusst auskommentierter Rollen-Eintrag erzeugt einen Compile-Fehler (im PR als Nachweis
    beschrieben, nicht eingecheckt)

### CRM-02-T2 — Migration 0022 und Modell

- **Files:** `packages/db/migrations/0022_create_workspace_members.sql`,
  `packages/db/src/record-configuration/crm/workspace-members.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - `workspace_members`: `id uuid PK`, `clerk_user_id text UNIQUE NOT NULL`, `email text NOT NULL`,
    `role text NOT NULL DEFAULT 'member'` (CHECK), `created_at`, `updated_at`
  - Unique-Index auf `lower(email)`
- **Akzeptanz:** Migration idempotent, `db:smoke:dev` grün

### CRM-02-T3 — Actor-Auflösung mit Bootstrap

- **Files:** `apps/workspace/src/server/auth/resolve-workspace-actor.ts`,
  `apps/workspace/src/common/contracts/auth/actor.ts`
- **Skills:** `best-practices`
- **Inhalt:**
  - Clerk-Session lesen, `workspace_members`-Zeile suchen
  - Keine Zeile, aber E-Mail in `WORKSPACE_ALLOWED_EMAILS`: Zeile mit Rolle `owner` anlegen
    (idempotent, `ON CONFLICT DO NOTHING`) und zurückgeben
  - Keine Zeile und nicht allowlisted: `null` — der bestehende `notFound()`-Pfad greift
- **Akzeptanz:**
  - Tests: allowlisted ohne Zeile wird `owner`; bestehende Zeile schlägt die Allowlist nicht um;
    weder-noch ergibt `null`
  - Ohne Datenbankverbindung degradiert die Funktion auf die reine Allowlist-Prüfung (kein Absturz)

### CRM-02-T4 — `can()`, Page- und API-Guard

- **Files:** `apps/workspace/src/server/auth/{can,require-workspace-permission,with-permission}.ts`
  - Tests
- **Skills:** `best-practices`, `accessibility`
- **Inhalt:**
  - `can()` mit Portal-Resource-Prüfung wie oben
  - `requireWorkspacePermission()` → `notFound()` statt `403`, konsistent zum bestehenden
    `permissions.ts` (kein Enumeration-Leak)
  - `withPermission()` wrappt `withWorkspaceApiAuth` und ergänzt `403 FORBIDDEN` im bestehenden
    Error-Code-Muster (`auth-api-error.ts` erweitern)
- **Akzeptanz:**
  - Testmatrix Rolle × Permission vollständig
  - Portal-Actor ohne passende `customerId` bekommt `false`, auch wenn die Rolle die Permission hätte
  - Bestehende Lead-Route-Tests laufen unverändert grün

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Keine UI, kein geändertes Verhalten für dich als bestehenden Nutzer.
2. **Bricht nichts:** Die Env-Allowlist bleibt der aktive Gate. `withPermission` wird in diesem Task
   von **keiner** Route benutzt, `requireWorkspacePermission` von keiner Page. Beides sind neue,
   ungenutzte Funktionen. Migration additiv.
3. **Offen:** Rollenvergabe-UI. Nicht nötig — Rollen werden vorerst per SQL gesetzt, der Bootstrap
   deckt den Alltagsfall ab. Ein UI kommt erst, wenn ein zweiter interner Nutzer existiert.

## End-to-End-Akzeptanz

1. Migration läuft, `workspace_members` existiert.
2. Erster Login einer allowlisted E-Mail legt genau eine Zeile mit Rolle `owner` an; der zweite Login
   legt keine weitere an.
3. Eine manuell auf `member` gesetzte Rolle liefert bei `can(actor, Permission.CredentialsReveal)`
   `false`.
4. Ein Portal-Actor bekommt für einen fremden Kunden `false`, für den eigenen `true`.
5. Alle bestehenden Tests bleiben grün; Verhalten der Leads-Oberfläche unverändert.
6. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
