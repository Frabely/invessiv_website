# Task 02 — Persistierte User und Permission-Katalog

> **Merge-Einheit:** Ordner 03 · **Branch:** `feat/crm-users-rbac`
> **Aufwand:** L · **Abhängigkeiten:** Ordner 01 und 02
> **Migration:** höchste vorhandene Nummer plus eins; gemergte Migrationen bleiben unverändert

## Leitidee

Die Permission ist der Kern. Ein Bereich oder Command verlangt `Permission.X` und fragt nur, ob der Actor sie
besitzt. Welche Rolle sie gewährt, ist Konfiguration. Neue Fähigkeiten entstehen durch einen neuen Katalogeintrag,
nicht durch neue Prüfpfade.

> **Nachtrag 14.09.2026:** Rollen werden ab Ordner 07a–07c zusätzlich an Kunden oder Projekte gebunden zuweisbar
> (Task 36–38, `00-entscheidungen.md` Abschnitt „Zugriffsbereiche“). `can` bleibt für workspace-weite Prüfungen
> bestehen; CRM-Daten prüfen dann über `canOn`/`accessScope`. Der Kommentar „kein Resource-Scope“ unten beschreibt den
> Stand von Ordner 03.

```ts
can(actor, Permission.LeadsDelete); // boolean — kein Rollenname, kein Resource-Scope in Version 1
```

## Verbindliche Entscheidungen

| Bereich               | Entscheidung                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| Menschliche Identität | `users.id` ist die kanonische UUID; `users.clerk_user_id` eindeutig                                  |
| Stammdaten            | Name und primäre E-Mail an `users`; E-Mail autorisiert nie                                           |
| Membership            | `workspace_members.user_id` eindeutig und verpflichtend; keine Identitäts- oder Rechtefelder         |
| Permission            | Atomare Fähigkeit aus dem `Permission`-Const-Objekt; Definition (Realm, delegierbar) per `satisfies` |
| Rolle                 | Persistiertes Bündel; Zuweisung nur über Rollen, effektive Rechte = Vereinigung aktiver Rollen       |
| Realms                | `workspace` / `portal`; zusammengesetzte Fremdschlüssel verhindern Mischung                          |
| Delegierbarkeit       | Nicht delegierbare Permissions nur in Systemrollen — per Fremdschlüssel und CHECK in der DB          |
| Ablehnung             | Kein Deny; fehlende Permission = 403 (API) bzw. 404 (Seite)                                          |
| Bereiche              | `WORKSPACE_AREA_PERMISSIONS: Record<WorkspaceArea, Permission>` ist die einzige Bereichszuordnung    |
| Bootstrap             | `WORKSPACE_BOOTSTRAP_CLERK_USER_ID`, nur solange kein aktiver Owner existiert                        |
| Jobs                  | Kein Fake-User, sondern `actor_type = system` plus `system_actor_key`                                |
| Audit                 | `security_events` (append-only), getrennt von `activities`                                           |

## Datenmodell

```text
users
  id uuid PK · clerk_user_id text NOT NULL UNIQUE · primary_email text NOT NULL
  first_name text · last_name text · display_name text NOT NULL · active boolean NOT NULL
  version integer NOT NULL CHECK > 0 · created_at · updated_at

workspace_members                       (Legacy-Spalten entfernt)
  id uuid PK · user_id uuid NOT NULL UNIQUE → users.id RESTRICT
  active boolean NOT NULL · version integer NOT NULL · created_at · updated_at

permissions
  key text PK · realm text CHECK · delegable boolean NOT NULL · description text NOT NULL
  UNIQUE (key, realm, delegable)        Ziel des zusammengesetzten Fremdschlüssels

roles
  id uuid PK · realm text CHECK · system_key text NULL CHECK IN SystemRoleKey
  name text NOT NULL · description text NULL · is_system boolean NOT NULL · active boolean NOT NULL
  version · created_at · updated_at
  CHECK (is_system = (system_key IS NOT NULL))
  UNIQUE (system_key) · UNIQUE (realm, lower(btrim(name)))
  UNIQUE (id, realm) · UNIQUE (id, realm, is_system)

role_permissions
  role_id uuid · realm text · role_is_system boolean · permission_key text · permission_delegable boolean
  PK (role_id, permission_key)
  FK (role_id, realm, role_is_system) → roles (id, realm, is_system) ON DELETE CASCADE
  FK (permission_key, realm, permission_delegable) → permissions (key, realm, delegable) ON UPDATE CASCADE
  CHECK (role_is_system OR permission_delegable)

workspace_member_roles
  workspace_member_id uuid → workspace_members.id · role_id uuid · role_realm text CHECK = workspace
  assigned_by_user_id uuid NOT NULL → users.id · assigned_at timestamptz NOT NULL
  PK (workspace_member_id, role_id) · FK (role_id, role_realm) → roles (id, realm)

security_events                         (append-only, kein version/updated_at)
  id uuid PK · type text CHECK · actor_type text CHECK · actor_user_id uuid NULL → users.id
  system_actor_key text NULL · subject_type text CHECK · subject_id uuid NOT NULL
  metadata jsonb NULL · occurred_at timestamptz NOT NULL · created_at
  Actor-Invariante wie bei activities (siehe unten)

activities (additiv)
  actor_user_id uuid NULL → users.id · system_actor_key text NULL
  CHECK … NOT VALID: user/customer ⇒ actor_user_id gesetzt, kein Key; system ⇒ Key gesetzt, kein User
```

Ein DB-Trigger weist `UPDATE` und `DELETE` auf `security_events` standardmäßig ab. Migrationen und Fixture-Cleanup
öffnen den Ausnahmeweg ausschließlich transaktionslokal über
`set_config('invessiv.security_event_maintenance', 'on', true)`.

`NOT VALID` prüft jede neue und geänderte Zeile, lässt die übernommenen Legacy-Zeilen aus Ordner 02 aber unangetastet.
Ein erneuter Kopierschritt aus `lead_activities` (Rollback-Hinweis Ordner 02) muss deshalb `system_actor_key` setzen.

`subject_id` hat bewusst keinen Fremdschlüssel: Das Protokoll überlebt spätere Purges.

## Permission-Katalog (Workspace-Realm)

| Key                  | Delegierbar | Owner | Member | Credentials-Manager |
| -------------------- | :---------: | :---: | :----: | :-----------------: |
| `dashboard.read`     |     ja      |   ✓   |   ✓    |                     |
| `leads.read`         |     ja      |   ✓   |   ✓    |                     |
| `leads.write`        |     ja      |   ✓   |   ✓    |                     |
| `leads.delete`       |     ja      |   ✓   |        |                     |
| `leads.import`       |     ja      |   ✓   |   ✓    |                     |
| `outreach.generate`  |     ja      |   ✓   |   ✓    |                     |
| `members.read`       |     ja      |   ✓   |   ✓    |                     |
| `customers.read`     |     ja      |   ✓   |   ✓    |                     |
| `customers.write`    |     ja      |   ✓   |   ✓    |                     |
| `projects.read`      |     ja      |   ✓   |   ✓    |                     |
| `projects.write`     |     ja      |   ✓   |   ✓    |                     |
| `tasks.write`        |     ja      |   ✓   |   ✓    |                     |
| `files.read`         |     ja      |   ✓   |   ✓    |                     |
| `files.write`        |     ja      |   ✓   |   ✓    |                     |
| `files.delete`       |     ja      |   ✓   |        |                     |
| `credentials.read`   |     ja      |   ✓   |   ✓    |                     |
| `credentials.reveal` |     ja      |   ✓   |        |          ✓          |
| `credentials.write`  |     ja      |   ✓   |        |                     |
| `portal.manage`      |     ja      |   ✓   |        |                     |
| `roles.manage`       |    nein     |   ✓   |        |                     |
| `members.manage`     |    nein     |   ✓   |        |                     |
| `data.export`        |    nein     |   ✓   |        |                     |
| `data.purge`         |    nein     |   ✓   |        |                     |
| `security.audit`     |    nein     |   ✓   |        |                     |

- Der Owner besitzt **alle** Workspace-Permissions. Sein Rechtesatz wird aus dem Katalog abgeleitet, nicht gepflegt.
- Portal-Permissions entstehen in Ordner 12 im Realm `portal`.
- Eine neue Permission = neuer Const-Eintrag + Definition + Migration (Katalogzeile, Systemrollen-Zuordnung).
  Der Smoke schlägt fehl, solange Code und DB abweichen.

## Bereiche

```ts
WORKSPACE_AREA_PERMISSIONS = {
  [WorkspaceArea.Dashboard]: Permission.DashboardRead,
  [WorkspaceArea.Leads]: Permission.LeadsRead,
} satisfies Record<WorkspaceArea, Permission>;
```

- Die Sidebar zeigt nur Bereiche, deren Permission der Actor besitzt.
- Jede Bereichs-Page ruft vor dem ersten Datenzugriff `requireWorkspaceArea(locale, area)` auf; ohne Permission 404.
  Ein Gate nur im Layout reicht nicht, weil Next.js Layouts bei Query-Param-Wechseln nicht neu rendert.
- Die Workspace-Startseite leitet in den ersten erlaubten Bereich.
- Aktionsbuttons in Bereichen (Löschen, Import) werden in Ordner 03b permissionabhängig ausgeblendet; bis dahin
  existiert nur der Owner, der alle Rechte besitzt. Die API lehnt unabhängig davon ab.

## API-Routen

| Route                                               | Permission                                               |
| --------------------------------------------------- | -------------------------------------------------------- |
| `GET /api/workspace/leads`, `GET …/leads/[id]`      | `leads.read`                                             |
| `POST /api/workspace/leads`, `PATCH …/leads/[id]`   | `leads.write`                                            |
| `DELETE …/leads/[id]`                               | `leads.delete`                                           |
| `POST …/leads/bulk`                                 | `leads.write`; Aktion `delete` zusätzlich `leads.delete` |
| `POST …/leads/import`                               | `leads.import`                                           |
| `POST …/outreach/generate`, `GET …/provider-status` | `outreach.generate`                                      |

## Autorisierungsablauf

```text
auth() → clerkUserId                              fehlt → 401 / Redirect Sign-in
  → users + workspace_members + aktive Rollen + Permissions
      User fehlt, clerkUserId = Bootstrap-ID, kein aktiver Owner
        → bootstrapWorkspaceOwner (Advisory-Lock, atomar) → erneut auflösen
      User oder Membership fehlt oder inaktiv    → 404
      DB-Fehler                                   → 503 / Fehlerseite, nie Zugriff
  → WorkspaceActor { userId, workspaceMemberId, permissions: ReadonlySet<Permission> }
  → withPermission(Permission.X) / requireWorkspaceArea(area)   fehlt → 403 / 404
```

- Unbekannte Permission-Keys aus der DB werden verworfen.
- Jeder Request löst neu auf; Rollenentzug wirkt beim nächsten Request, kein Cache über Requests hinweg.
- Bootstrap schreibt `users`, `workspace_members`, Owner-Zuweisung (`assigned_by_user_id` = eigener User) und den
  `security_events`-Eintrag `workspace_owner_bootstrapped` in einer Transaktion.

## Migration

1. Preflight: Existieren die Legacy-Spalten noch und enthält `workspace_members`, `customers`, `people` oder
   `customer_contact_assignments` Zeilen, bricht die Migration mit eindeutiger Meldung ab.
2. Legacy-Indizes und -Spalten an `workspace_members` entfernen, `user_id` ergänzen.
3. `users`, `permissions`, `roles`, `role_permissions`, `workspace_member_roles`, `security_events` anlegen.
4. Katalog und Systemrollen (feste UUIDs) mit `ON CONFLICT DO NOTHING` seeden.
5. `activities.actor_user_id`, `activities.system_actor_key` und die `NOT VALID`-Invariante ergänzen.

## Tickets

### CRM-03-T1 — User-Schema und Legacy-Entfernung

- Preflight, Drop, `users`, `workspace_members.user_id`; Drizzle-Modelle deckungsgleich
- Smoke: doppelte Clerk-ID, Member ohne User und doppelte Membership werden abgewiesen

### CRM-03-T2 — Katalog und Rollenfundament

- Const-Objekte mit Tests; Tabellen mit Realm- und Delegierbarkeits-Fremdschlüsseln; Systemrollen-Seed
- Smoke: Katalog- und Systemrollen-Gleichheit Code↔DB, Realm-Mischung und Escalation werden abgewiesen

### CRM-03-T3 — Bootstrap

- Atomarer Owner-Bootstrap mit Advisory-Lock und `security_events`
- Integrationstest auf isolierter DB ohne aktiven Owner: parallele Requests ergeben genau einen Owner; danach kein
  weiterer Bootstrap

### CRM-03-T4 — Fail-closed Gates und Bereiche

- `requireWorkspaceActor`, `requireWorkspaceArea`, `withWorkspaceApiActor`, `withPermission`, `can`
- Bereichs-Registry, Sidebar-Filter, Bereichs-Gates in den Pages, Root-Redirect; alle Routen permissionbasiert
- Tests: DB-Fehler, inaktiver User, inaktive Membership, fehlende Rolle, fehlende Permission, Rollenentzug

### CRM-03-T6 — Actor-Referenzen

- `ActivityActor`-Union statt `actorType/actorId/actorLabel` im Schreibweg
- Lead- und Outreach-Commands schreiben `{ type: user, userId }`; Seeds und Smokes `system` + `SystemActorKey.Fixture`
- Timeline zeigt den aktuellen `users.display_name`; Legacy-Zeilen weiter ihr `actor_label`

T5 (Verwaltung) liegt in Ordner 03b, T7 (Registry, Übergabe, Deaktivierung) in Ordner 03c.

## Akzeptanzkriterien

- Jeder menschliche Workspace-Actor besitzt eine persistierte `users.id`.
- Namens- oder E-Mail-Änderungen verändern weder Rechte noch Activity-Zuordnung.
- Effektive Permissions sind reproduzierbar die Vereinigung aktiver Rollen.
- Kein Feature enthält eine Rollenprüfung; Bereiche und Routen kennen nur Permissions.
- Nicht delegierbare Rechte können keiner Custom-Rolle zugeordnet werden — auch nicht per SQL.
- Workspace- und Portalrollen können nicht vermischt werden — auch nicht per SQL.
- DB-Ausfälle und unvollständige Identität lehnen Zugriff ab.
- Die Migration bricht bei unerwarteten Ordner-01-Daten vor jeder Schemaänderung ab.

## Qualitäts-Gates

- Unit-Tests, Integrationstests (`db:smoke:rbac`) sowie DB-Smokes `db:smoke`, `db:smoke:crm`,
  `db:smoke:activities`, `db:smoke:rbac`
- Repository-Suche: kein `WORKSPACE_ALLOWED_EMAILS`, kein `credentials_access`, kein `WorkspaceRole`
- `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build`
