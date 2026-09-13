# Task 02 — Persistierte User und flexibles Rechtesystem

> **Merge-Einheit:** Ordner 03 · **Branch:** `feat/crm-users-rbac`
> **Aufwand:** L · **Abhängigkeiten:** Ordner 01 und 02
> **Migration:** Neue Nummer als höchste vorhandene Migration plus eins; gemergte Migrationen bleiben unverändert

## Context

Der bisher geplante Zuschnitt `workspace_members.role = owner | member` plus `credentials_access` bildet nur einen
festen Sonderfall ab. Sobald Rollen frei erstellt und mehreren Nutzern zugewiesen werden sollen, entstehen sonst
parallele Autorisierungswege: feste Rolle, Einzel-Flag und später eine weitere Rollentabelle.

Dieser Task führt deshalb zuerst eine stabile User-Identität und anschließend ein persistiertes RBAC ein. Der
vorherige Activity-Branch bleibt davon unabhängig mergebar.

## Verbindliche Entscheidungen

| Bereich                | Entscheidung                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Menschliche Identität  | `users.id` ist die kanonische interne UUID für jeden angemeldeten Menschen.                            |
| Externer Login         | `users.clerk_user_id` ist eindeutig; Clerk authentifiziert, die eigene DB autorisiert.                 |
| Stammdaten             | Name und primäre E-Mail hängen an `users`; E-Mail wird niemals als Berechtigungsanker genutzt.         |
| Interne Mitgliedschaft | `workspace_members` bleibt bestehen und referenziert genau einen `user`.                               |
| CRM-Kontakt            | `people` bleibt getrennt, da CRM-Kontakte auch ohne Zugang existieren.                                 |
| Portal                 | Ordner 12 verbindet später `users`, `people` und `customers` über `portal_memberships`.                |
| Permission             | Atomare Fähigkeit aus einem codebekannten und in der DB spiegelnden Katalog.                           |
| Rolle                  | Persistiertes, benennbares Bündel von Permissions; keine Rollenprüfung an Features.                    |
| Zuweisung              | Ein Mitglied kann mehrere Rollen besitzen; die effektiven Rechte sind deren Vereinigung.               |
| Realms                 | Workspace- und Portalrollen sind strikt getrennt und können nicht realmübergreifend zugewiesen werden. |
| Ablehnung              | Kein explizites Deny in Version 1; fehlende Permission bedeutet fail-closed `403`.                     |
| Credentials            | Kein `credentials_access`-Sonderweg; Reveal folgt ausschließlich aus `credentials.reveal`.             |
| Jobs                   | Systemjobs erhalten keinen künstlichen User-Datensatz, sondern einen stabilen Systemakteur.            |

## Datenmodell

### `users`

```text
users
  id                uuid primary key
  clerk_user_id     text unique not null
  primary_email     text not null
  first_name        text null
  last_name         text null
  display_name      text not null
  active            boolean not null
  version           integer not null
  created_at        timestamptz not null
  updated_at        timestamptz not null
```

`primary_email` darf aktualisiert werden, ohne Zuweisungen oder Historie zu verändern. Es gibt keinen Identity-Backfill:
Die Ordner-01-Tabellen sind noch leer und der erste User wird erst durch den Bootstrap dieses Ordners erzeugt.

### Membership und Rollen

```text
workspace_members
  id                uuid primary key
  user_id           uuid unique not null -> users.id
  active            boolean not null
  version           integer not null
  ... fachliche Membership-Felder

permissions
  key               text primary key
  realm             workspace | portal
  delegable         boolean not null
  description       text not null

roles
  id                uuid primary key
  realm             workspace | portal
  system_key        text null
  name              text not null
  description       text null
  is_system         boolean not null
  active            boolean not null
  version           integer not null

role_permissions
  role_id           uuid -> roles.id
  permission_key    text -> permissions.key
  realm             workspace | portal
  primary key (role_id, permission_key)

workspace_member_roles
  workspace_member_id uuid -> workspace_members.id
  role_id             uuid -> roles.id
  assigned_by_user_id uuid -> users.id
  assigned_at          timestamptz not null
  primary key (workspace_member_id, role_id)
```

Zusammengesetzte Constraints/Fremdschlüssel sichern, dass Rolle, Permission und Zuweisung denselben Realm besitzen.
Der Schutz liegt nicht nur in TypeScript. Namen benutzerdefinierter Rollen sind innerhalb ihres Realms eindeutig.
`system_key` ist für gelieferte Systemrollen eindeutig und bei benutzerdefinierten Rollen `null`.

## Permission-Katalog

Der Code definiert die zulässigen Schlüssel über ein Const-Objekt. Eine idempotente Seed-/Sync-Funktion schreibt
exakt diesen Katalog in `permissions`. Der DB-Smoke prüft in beide Richtungen: kein Code-Key fehlt und kein unbekannter
DB-Key existiert.

```ts
export const Permission = {
  CustomersRead: "customers.read",
  CustomersWrite: "customers.write",
  ProjectsRead: "projects.read",
  ProjectsWrite: "projects.write",
  TasksWrite: "tasks.write",
  FilesRead: "files.read",
  FilesWrite: "files.write",
  FilesDelete: "files.delete",
  CredentialsRead: "credentials.read",
  CredentialsReveal: "credentials.reveal",
  CredentialsWrite: "credentials.write",
  PortalAccessManage: "portal.manage",
  RolesManage: "roles.manage",
  MembersManage: "members.manage",
  DataExport: "data.export",
  DataPurge: "data.purge",
  SecurityAudit: "security.audit",
} as const;
```

Features prüfen ausschließlich `Permission.X`. Eine Rolle ist Konfiguration und darf nie als Voraussetzung einer
Route, eines Commands, eines Buttons oder eines Bereichs hart codiert werden.

Nicht delegierbar sind zunächst:

- `roles.manage`
- `members.manage`
- `data.export`
- `data.purge`
- `security.audit`

Benutzerdefinierte Rollen dürfen diese Permissions nicht erhalten. Dadurch kann ein Rollenverwalter keine
Privilege-Escalation-Kette bauen. Änderungen am nicht delegierbaren Satz sind Code- und Review-Entscheidungen.

## Systemrollen

Die Migration legt mindestens folgende Rollen idempotent an:

| System-Key                      | Zweck                                                            | Veränderbar | Zuweisbar                        |
| ------------------------------- | ---------------------------------------------------------------- | ----------- | -------------------------------- |
| `workspace_owner`               | alle Workspace-Permissions, inklusive nicht delegierbarer Rechte | nein        | nur über geschützten Owner-Flow  |
| `workspace_member`              | sichere Basis für den operativen Alltag                          | nein        | ja                               |
| `workspace_credentials_manager` | zusätzlich `credentials.reveal`                                  | nein        | ja, nur durch berechtigten Actor |

`is_system` bedeutet: Name, Realm und Permission-Satz sind unveränderlich. Es bedeutet nicht automatisch, dass die
Rolle nicht zugewiesen werden darf. Für `workspace_owner` gelten zusätzliche Invarianten:

- mindestens ein aktiver Workspace-Owner bleibt erhalten;
- niemand kann sich selbst die letzte Owner-Zuweisung entziehen;
- Owner-Vergabe und -Entzug laufen über einen separaten Command;
- jede Änderung erzeugt eine Security-Activity mit tatsächlichem Actor.

## Autorisierungsablauf

```text
Clerk-Session
  -> users anhand clerk_user_id laden
  -> aktive workspace_members-Zeile laden
  -> aktive Rollen und deren Permissions laden
  -> WorkspaceActor { userId, workspaceMemberId, permissions }
  -> requireWorkspacePermission(Permission.X)
```

Die Auflösung ist fail-closed: fehlender User, inaktive Membership, DB-Fehler, unbekannte Permission oder
realmwidrige Zuweisung ergeben keinen Zugriff. Die Env-Allowlist ist ausschließlich ein zeitlich begrenzter Bootstrap
für den ersten Owner. Nach erfolgreicher Initialisierung öffnet sie keinen parallelen Autorisierungsweg.

```ts
export function can(
  actor: Actor,
  permission: Permission,
  resource?: ResourceRef,
): boolean;
```

`can()` wertet nur die bereits aufgelösten effektiven Permissions und gegebenenfalls den Resource-Scope aus. Es gibt
keinen zweiten Codepfad für Rollen, E-Mail-Allowlist oder `credentials_access`.

## Migration aus dem bestehenden Schema

Migration `0021` bleibt als bereits gemergte Historie unverändert. Eine neue Ordner-03-Migration nutzt dagegen die
bestätigte Tatsache, dass alle von Ordner 01 angelegten Tabellen noch leer sind:

1. Zu Beginn innerhalb derselben Transaktion `workspace_members`, `customers`, `people` und
   `customer_contact_assignments` auf Leerheit prüfen.
2. Sobald eine der Tabellen einen Datensatz enthält, mit einer eindeutigen Fehlermeldung abbrechen, bevor DDL
   ausgeführt wird. Für diesen unerwarteten Fall muss zuerst ein eigener Datenmigrationsplan erstellt werden.
3. `users`, Permission- und Rollentabellen anlegen sowie Systemrollen idempotent seeden.
4. `workspace_members.user_id` als verpflichtenden und eindeutigen Fremdschlüssel ergänzen.
5. Die ungenutzten Spalten `clerk_user_id`, `email`, `role` und `credentials_access` vorübergehend erhalten, damit die
   unmittelbar vorherige App-Version während des Rollouts kompatibel bleibt. Die neue Auth darf sie nicht lesen.
6. Neue Writes befüllen diese verpflichtenden Legacy-Spalten bis zum Cleanup mit konsistenten Schattenwerten;
   Identität und Autorisierung folgen trotzdem ausschließlich aus `user_id` und RBAC.
7. Drizzle-Modelle, Seeds und Constraint-Smokes im selben Changeset auf das Übergangsmodell umstellen.
8. Anwendung auf User-ID und effektive Permissions umstellen.

Damit gibt es weder Zuordnungsheuristik noch Identity-Backfill. Die alte App bleibt während des Rollouts lauffähig;
die neue App besitzt genau einen Autorisierungsweg. Das befristete Schreiben der Legacy-Pflichtfelder ist keine zweite
Autorisierung und wird nach erfolgreichem Rollout in einem kleinen Cleanup entfernt.

## Activities

`activities` erhält additiv:

```text
actor_user_id       uuid null -> users.id
system_actor_key    text null
```

Invariante:

- `actor_type = user` verlangt `actor_user_id` und verbietet `system_actor_key`;
- `actor_type = system` verlangt `system_actor_key` und verbietet `actor_user_id`;
- Legacy-Zeilen dürfen während der Übergangsphase weiterhin nur die alten Actor-Felder tragen.

Ein Bulk Edit protokolliert den eingeloggten Bearbeiter. Der fachliche Lead- oder Kunden-Owner ist kein Ersatz für
den Actor. Kunde, Owner und Mitarbeiter sind menschliche User; ihre jeweilige Einordnung folgt aus Membership und
Rollen.

## Mitglieder- und Rollenverwaltung

Die Owner-Oberfläche deckt folgende Flows vollständig ab:

- User/Mitglied anlegen und mit Clerk-ID verbinden;
- Mitglied aktivieren/deaktivieren;
- mehrere Rollen zuweisen und entziehen;
- benutzerdefinierte Rollen erstellen, umbenennen, deaktivieren und mit delegierbaren Permissions bestücken;
- effektive Permissions vor dem Speichern anzeigen;
- alle fachlichen Zuständigkeiten vor einer Deaktivierung atomar übergeben;
- letzten Owner schützen und aussagekräftige 409-Konflikte anzeigen.

Die Clerk-Einladung selbst bleibt zunächst im Clerk-Dashboard. Die App erklärt diesen Schritt und speichert keine
Credentials oder Einladungstokens von Clerk.

## Zuständigkeits-Registry

Die bestehende Idee einer exhaustiven `OWNERSHIP_REGISTRY` bleibt erhalten. Sie betrifft fachliche Zuständigkeit,
nicht Autorisierung. Beim Ergänzen eines neuen `OwnableEntity` muss der Typecheck so lange fehlschlagen, bis ein
Adapter für Zählung und atomare Übergabe registriert ist.

Deaktivierung eines Mitglieds ist blockiert, solange aktive Zuständigkeiten bestehen. Der Konflikt nennt die Anzahl
je Entität. Die Übergabe erzeugt pro betroffenem Datensatz eine Activity mit dem tatsächlichen User als Actor.

## Tickets

### CRM-03-T1 — User-Schema und leere Schema-Umstellung

- `users` und `workspace_members.user_id` modellieren
- harte Preflight-Leerheitsprüfung vor jeder Schemaänderung implementieren
- Legacy-Pflichtfelder ausschließlich als kompatible Schattenwerte schreiben und nie autorisierend lesen
- Migration mit Abbruchbedingungen und DB-Smoke schreiben
- User-Auflösung anhand Clerk-ID implementieren
- Tests für nicht leere Ausgangstabellen, geänderte E-Mail, doppelte Clerk-ID, fehlenden User und inaktiven User

### CRM-03-T2 — Permission- und Rollenfundament

- Permission-Const-Objekt plus DB-Katalog
- Rollen-, Rollenpermission- und Zuweisungstabellen mit Realm-Constraints
- Systemrollen idempotent seeden
- exakten Code/DB-Katalog sowie Realm-Invarianten testen

### CRM-03-T3 — Systemrollen und Bootstrap

- den ersten `users`-, `workspace_members`- und Owner-Zuweisungsdatensatz atomar erzeugen
- parallele Bootstrap-Requests idempotent behandeln
- mindestens einen Owner garantieren
- nach erfolgreichem Bootstrap die Env-Allowlist nicht mehr als Zugangsweg akzeptieren

### CRM-03-T4 — Fail-closed Auth-Gates

- zentralen Actor mit persistierter `users.id` auflösen
- `requireWorkspacePermission` und API-Wrapper bereitstellen
- alle betroffenen Command-/Query-Grenzen permissionbasiert absichern
- negative Tests für DB-Fehler, inaktive Membership, fehlende Rolle und fehlende Permission

### CRM-03-T5 — Rollen- und Mitgliederverwaltung

- Rollen-CRUD nur hinter `roles.manage`
- nur delegierbare Permissions für benutzerdefinierte Rollen akzeptieren
- Mehrfachzuweisung und effektive Vorschau implementieren
- Owner-Schutz, optimistic locking und Security-Activities testen

### CRM-03-T6 — Actor-Referenzen

- `actor_user_id` und `system_actor_key` additiv ergänzen
- menschliche Activity-Schreibpfade auf echte User-ID umstellen
- Systemjobs explizit als Systemakteure schreiben
- bestehende Activity-Lesekompatibilität und negative Actor-Invarianten testen

### CRM-03-T7 — Zuständigkeit und E2E

- exhaustive Ownership-Registry anbinden
- Übergabe und Deaktivierung atomar implementieren
- E2E: Mitglied mit Custom-Rolle darf erlaubte Aktion und erhält für andere Aktion `403`
- E2E: Rollenentzug wirkt im nächsten Request
- E2E: letzter Owner kann weder deaktiviert noch seiner Owner-Rolle beraubt werden

## Akzeptanzkriterien

- Jeder menschliche Workspace-Actor besitzt eine persistierte `users.id`.
- Namens- oder E-Mail-Änderungen verändern weder Rechte noch Activity-Zuordnung.
- Ein Mitglied kann mehrere Rollen besitzen; effektive Permissions sind reproduzierbar deren Vereinigung.
- Custom-Rollen können erstellt und Nutzern zugewiesen werden, ohne Codeänderung an den geschützten Features.
- Features prüfen Permissions und enthalten keine `role === ...`-Verzweigung.
- Nicht delegierbare Rechte können keiner Custom-Rolle hinzugefügt werden.
- `credentials.reveal` wird ausschließlich über Rollen gewährt; `credentials_access` ist kein aktiver Sonderpfad mehr.
- Workspace- und Portalrollen können nicht vermischt werden.
- DB-Ausfälle und unvollständige Identität lehnen Zugriff ab.
- Activities referenzieren bei menschlichen Änderungen den tatsächlichen User; Jobs bleiben Systemakteure.
- Die Migration bricht bei unerwarteten Ordner-01-Daten vor jeder Schemaänderung ab.

## Qualitäts-Gates

- fokussierte Unit-, Integrations-, Migration- und E2E-Tests
- DB-Smoke für Kataloggleichheit, Leerheits-Preflight, Zielmodell und Constraints
- Suche nach direkten Rollenprüfungen und aktiv genutztem `credentials_access`
- `pnpm -r lint`
- `pnpm -r typecheck`
- `pnpm -r test`
- `pnpm --filter @invessiv/workspace build`

## Post-03-Cleanup

Der Cleanup ist als eigenständige Merge-Einheit
[`03a-workspace-member-legacy-cleanup`](../03a-workspace-member-legacy-cleanup/README.md) geplant. Deren Task 02b
enthält
Readiness-Smoke, Drop-Migration, Abbruchbedingungen und Abnahme. Er gehört ausdrücklich nicht in den initialen
RBAC-Cutover.

## Split-Gate vor Implementierungsbeginn

Wenn die belastbare Dateiliste mehr als 120 Änderungen erwarten lässt, wird Ordner 03 vor dem ersten Code-Commit in
zwei aufeinanderfolgende Merge-Einheiten geteilt: zuerst Identität/RBAC-Fundament mit kompatiblen Reads, danach
Management-UI und vollständiger Permission-Cutover. Die Activity-Migration aus Ordner 02 wird in keinem Fall wieder
mit diesem Scope vermischt.
