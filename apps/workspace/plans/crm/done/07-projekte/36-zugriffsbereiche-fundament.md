# Task 36 — Zugriffsbereiche: Fundament

> **Merge-Einheit:** Ordner 07a · **Branch:** `feat/crm-zugriffsbereiche-fundament`
> **Aufwand:** L · **Abhängigkeiten:** Task 02 (Rechtesystem), Task 02c (Verwaltung), Task 02d (Registry), Task 09
> (Projekte)
> **Migration:** eine additive Migration; Nummer im Repository ermitteln

## Kontext

Ordner 03 hat Rechte bewusst ohne Resource-Scope gebaut: `can(actor, permission)` gilt workspace-weit. Für mehrere
Kunden und Kundenprojekte reicht das nicht. Beispiel des Nutzers: Mitglied 1 sieht bei Kunde 1 / Projekt 1 den Chat,
bei Projekt 2 nur die Aufgaben; Mitglied 2 hat Kunde 3 vollständig. Das soll ohne Codeänderung über die UI
konfigurierbar sein.

Die Lösung bleibt rollenbasiert: Rollen sind weiter Bündel von Permissions, sie werden nur zusätzlich **an einen
Kunden oder ein Projekt gebunden** zugewiesen. Kein Deny, keine direkten User-Permissions, keine Attributregeln.

## Entscheidungen

| Bereich               | Entscheidung                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Bindungsebenen        | `customer` und `project`. Leads bleiben global und sind nie bindbar                                                                                                                                                            |
| Vererbung             | Nur nach unten: Kundenbindung gilt für den Kunden und alle seine Projekte; Projektbindung nur für Daten dieses Projekts                                                                                                        |
| Kundenweite Daten     | Stammdaten, Ansprechpartner, kundenweite Activities, Renewals, Zugangsdaten und der kundenweite Chat verlangen eine Bindung am Kunden oder workspace-weite Rechte                                                              |
| Grundsichtbarkeit     | Jede wirksame Bindung am Kunden oder an einem seiner Projekte macht den **Kundenkopf** sichtbar (Nummer, Anzeigename, Status); eine Projektbindung zusätzlich den Projektkopf (Titel, Status, Phase). Mehr nicht               |
| Effektive Rechte      | Auf einem Datensatz = workspace-weite Rollen ∪ Rollen am Kunden ∪ (bei Projektdaten) Rollen am Projekt. Nur aktive Rollen                                                                                                      |
| Workspace-Owner       | Besitzt alle Permissions workspace-weit und damit Zugriff auf alles. Keine Sonderregel im Scope-Code                                                                                                                           |
| Zuständigkeit         | `owner_member_id` bleibt reine Verantwortung und gewährt **keine** Rechte. Die Prüfung „Zuständiger braucht Zugriff“ liefert Task 37                                                                                           |
| Bindbare Permissions  | Merkmal `scopable` im Katalog (siehe Tabelle unten). Neue CRM-Permissions späterer Ordner werden bei ihrer Einführung eingeordnet                                                                                              |
| Bindbare Rollen       | `roles.scope_assignable`. Nur solche Rollen dürfen gebunden zugewiesen werden und nur bindbare Permissions enthalten. Workspace-weit zuweisbar bleiben sie trotzdem („Nur Aufgaben“ für alle Kunden)                           |
| Systemrollen          | `workspace_owner`, `workspace_member`, `workspace_credentials_manager` bleiben `scope_assignable = false`                                                                                                                      |
| Durchsetzung          | DB per zusammengesetzten Fremdschlüsseln und CHECK (erste Linie); die Actor-Auflösung verwirft zusätzlich nicht bindbare Permissions aus gebundenen Zuweisungen (zweite Linie)                                                 |
| Wer verwaltet         | `members.manage` (nicht delegierbar, praktisch Owner). Kein eigenes delegierbares Recht in diesem Umfang                                                                                                                       |
| Versionierung         | Anlegen und Entfernen einer Zuweisung erhöht `workspace_members.version` über `updateVersioned`, wie `PUT …/roles`                                                                                                             |
| Mindestens eine Rolle | `MEMBER_WITHOUT_ROLE` zählt ab hier workspace-weite **und** gebundene Zuweisungen. Ein Mitglied darf also nur gebundene Rollen haben. Anlegen eines Mitglieds verlangt weiter eine workspace-weite Rolle (bewusst unverändert) |
| Rechte-Entzug         | Wird nie durch Zuständigkeiten blockiert. Sicherheit geht vor Konsistenz; Zuständigkeiten ohne Zugriff markiert Task 38 sichtbar                                                                                               |
| Auflösung             | Pro Request neu, kein Cache über Requests. Bei 2–5 Mitgliedern und überschaubaren Zuweisungen genügen ID-Mengen im Actor; Umstieg auf eine SQL-Subquery erst bei messbarem Bedarf                                              |
| Migrationsweg         | Expand: neue Merkmal-Spalten nullable, im selben Lauf befüllt. Die Vorversion schreibt `roles`/`role_permissions` ohne diese Spalten; `NULL` gilt als „nicht bindbar“. `NOT NULL` folgt als Cleanup in Ordner 07c              |

## Einordnung des bestehenden Katalogs

| Bindbar (`scopable = true`)                                                                                                                                                                                        | Nur workspace-weit                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customers.read`, `customers.write`, `projects.read`, `projects.write`, `tasks.write`, `files.read`, `files.write`, `files.delete`, `credentials.read`, `credentials.reveal`, `credentials.write`, `portal.manage` | `dashboard.read`, `leads.read`, `leads.write`, `leads.delete`, `leads.import`, `outreach.generate`, `members.read`, `roles.manage`, `members.manage`, `data.export`, `data.purge`, `security.audit` |

Anlegen eines **neuen** Kunden verlangt `customers.write` workspace-weit — ein neuer Kunde hat noch keine Bindung.

Spätere Ordner führen ihre Permissions bereits bindbar ein, wo sie Kunden- oder Projektdaten betreffen: `tasks.read`
(08), Renewals (11), Feedbackrunden (16), Chat (17), Stunden (20).

## Datenmodell

```text
permissions                                  (additiv)
  scopable boolean NULL → Cleanup 07c: NOT NULL
  UNIQUE (key, realm, scopable)             Ziel des Fremdschlüssels aus role_permissions

roles                                        (additiv)
  scope_assignable boolean NULL → Cleanup 07c: NOT NULL
  CHECK (NOT (is_system AND scope_assignable))
  UNIQUE (id, realm, scope_assignable)      Ziel der Fremdschlüssel aus role_permissions und Zuweisungen

role_permissions                             (additiv)
  role_scope_assignable boolean NULL · permission_scopable boolean NULL
  FK (role_id, realm, role_scope_assignable) → roles (id, realm, scope_assignable) ON UPDATE CASCADE
  FK (permission_key, realm, permission_scopable) → permissions (key, realm, scopable) ON UPDATE CASCADE
  CHECK (NOT role_scope_assignable OR permission_scopable)

workspace_member_scoped_roles                (neu, präfixfrei wie workspace_member_roles)
  id uuid PK
  workspace_member_id uuid NOT NULL → workspace_members.id RESTRICT
  role_id uuid NOT NULL
  role_realm text NOT NULL CHECK IN WORKSPACE_REALM_VALUES
  role_scope_assignable boolean NOT NULL CHECK (role_scope_assignable)
  FK (role_id, role_realm, role_scope_assignable) → roles (id, realm, scope_assignable) RESTRICT
  customer_id uuid NOT NULL → customers.id RESTRICT
  project_id uuid NULL
  FK (project_id, customer_id) → projects (id, customer_id) RESTRICT
  assigned_by_user_id uuid NOT NULL → users.id RESTRICT · assigned_at timestamptz NOT NULL
  UNIQUE (workspace_member_id, role_id, customer_id) WHERE project_id IS NULL
  UNIQUE (workspace_member_id, role_id, project_id)  WHERE project_id IS NOT NULL
  INDEX (customer_id) · INDEX (project_id) WHERE project_id IS NOT NULL · INDEX (role_id)
```

- `project_id IS NULL` bedeutet Kundenbindung. Ein zusätzliches `scope_type` entfällt, weil es nur eine zweite Quelle
  derselben Aussage wäre. Der Contract bildet die Bindung trotzdem als Union ab (siehe unten).
- `customer_id` ist bei Projektbindung denormalisiert und über den zusammengesetzten Fremdschlüssel abgesichert
  (`00-entscheidungen.md`, Migrationen). Existiert `UNIQUE (id, customer_id)` auf `projects` noch nicht, legt diese
  Migration ihn additiv an.
- Die `ON UPDATE CASCADE`-Fremdschlüssel machen das Umschalten eines Merkmals zur DB-Frage: Eine Rolle mit nicht
  bindbarer Permission kann nicht bindbar werden (CHECK), eine gebunden zugewiesene Rolle nicht mehr unbindbar (RESTRICT
  aus der Zuweisung).
- Kein DB-Default für `scopable`, `scope_assignable`, `assigned_at` (`packages/db/AGENTS.md`).
- Constraint- und Indexnamen als Const-Objekte unter `src/constraint-names/auth/`.
- Purge (Ordner 21) löscht Zuweisungen des Kunden vor dem Kunden; `RESTRICT` macht ein Vergessen zum Fehler.

## Contracts und Patterns

```ts
// packages/common/src/constants/auth/access-scope-types.ts
AccessScopeType = { Customer: "customer", Project: "project" } as const;

// packages/common/src/contracts/auth/access-scope.dto.ts
type AccessScopeDto =
  | { type: "customer"; customerId: string }
  | { type: "project"; customerId: string; projectId: string };

// apps/workspace/src/common/contracts/auth/workspace-actor.ts  (erweitert)
WorkspaceActor {
  userId; workspaceMemberId;
  permissions: ReadonlySet<Permission>;                        // workspace-weit, unverändert
  customerPermissions: ReadonlyMap<string, ReadonlySet<Permission>>;
  projectPermissions: ReadonlyMap<string, { customerId: string; permissions: ReadonlySet<Permission> }>;
}

canOn(actor, permission, { customerId, projectId? }): boolean
canAnywhere(actor, permission): boolean                        // workspace-weit oder in irgendeiner Bindung
accessScope(actor, permission):
  | { kind: "all" }
  | { kind: "limited"; customerIds: ReadonlySet<string>; projectIds: ReadonlySet<string> }
```

- `can(actor, permission)` bleibt unverändert für workspace-weite Funktionen und Bereiche ohne CRM-Bezug.
- `accessScope` liefert `all`, sobald die Permission workspace-weit vorliegt. `projectIds` enthält nur Projekte
  außerhalb bereits erlaubter Kunden.
- Serverseitiger Helfer `crmAccessCondition(scope, { customerId, projectId? })` in
  `src/server/workspace/shared/` erzeugt die Drizzle-Bedingung für kundenweite bzw. projektbezogene Zeilen.
  Keine Raw-SQL-Strings; Schema-Spalten werden übergeben.
- Fremdzugriff antwortet 404 (Seite und API), nie 403 — die Existenz eines fremden Kunden wird nicht bestätigt.

## Endpunkte (alle über `WorkspaceApiEndpoint`)

| Methode + Pfad                                                 | Permission       | Erfolg  | Fachfehler                                                                                                                                            |
| -------------------------------------------------------------- | ---------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/workspace/members/[id]/access-scopes`                | `members.manage` | 200     | 404                                                                                                                                                   |
| `POST /api/workspace/members/[id]/access-scopes`               | `members.manage` | 201     | 400 · 404 Mitglied/Kunde/Projekt · 409 Version · 409 bereits zugewiesen · 422 Rolle nicht bindbar/inaktiv/Owner · 422 Projekt gehört nicht zum Kunden |
| `DELETE /api/workspace/members/[id]/access-scopes/[scopeId]`   | `members.manage` | 200     | 404 · 409 Version · 422 letzte Zuweisung (`MEMBER_WITHOUT_ROLE`)                                                                                      |
| `GET /api/workspace/customers/[id]/access-scopes`              | `members.manage` | 200     | 404                                                                                                                                                   |
| `POST /api/workspace/roles`, `PATCH /api/workspace/roles/[id]` | `roles.manage`   | wie 02c | zusätzlich 422 `ROLE_PERMISSION_NOT_SCOPABLE` · 409 `ROLE_SCOPE_ASSIGNMENTS_EXIST` beim Zurücksetzen                                                  |

Body-Formen in `src/app/api/workspace/members/README.md` und `…/customers/README.md` ergänzen.

## Security-Event-Typen (Migration erweitert die CHECK-Constraint)

| Typ                                     | Subjekt            | Metadaten                                 |
| --------------------------------------- | ------------------ | ----------------------------------------- |
| `workspace_member_access_scope_granted` | `workspace_member` | `roleId`, `customerId`, `projectId`       |
| `workspace_member_access_scope_revoked` | `workspace_member` | `roleId`, `customerId`, `projectId`       |
| `role_updated` (bestehend)              | `role`             | `changedFields` enthält `scopeAssignable` |

## Verzeichnisstruktur (Richtwert)

```txt
packages/db/migrations/<n>_add_workspace_member_scoped_roles.sql
packages/db/src/record-configuration/auth/{permissions,roles,role-permissions}.ts   + Merkmalspalten
packages/db/src/record-configuration/auth/workspace-member-scoped-roles.ts (+ Barrel)
packages/db/src/constraint-names/auth/workspace-member-scoped-roles-constraint-names.ts
packages/db/scripts/{smoke-rbac.ts, rbac-catalog-check.ts, seed-crm-fixture*.ts}

packages/common/src/
  constants/auth/{permission-definitions.ts (+ scopable), access-scope-types.ts, security-event-types.ts}
  constants/auth/errors/{workspace-member-error-codes.ts, role-error-codes.ts}
  contracts/auth/{access-scope.dto.ts, workspace-member-access-scope.dto.ts, grant-access-scope-request.dto.ts}

apps/workspace/src/
  common/contracts/auth/workspace-actor.ts
  common/patterns/auth/{can-on.ts, access-scope.ts} (+ tests)
  server/workspace/auth/…                                  Actor-Auflösung lädt gebundene Rollen
  server/workspace/shared/services/crm-access-condition.ts (+ test)
  server/workspace/access/command-handler/{grant-access-scope, revoke-access-scope}.command-handler.ts
  server/workspace/access/query-handler/{list-member-access-scopes, list-customer-access-scopes}.query-handler.ts
  app/api/workspace/members/[id]/access-scopes/{route.ts, [scopeId]/route.ts}
  app/api/workspace/customers/[id]/access-scopes/route.ts
```

## Tickets

### CRM-07a-T1 — Migration, Modelle, Katalog

- Merkmalspalten, Befüllung aus `PERMISSION_DEFINITIONS`, neue Tabelle, Fremdschlüssel, CHECKs, Indizes.
- `permission-definitions.ts` erhält `scopable` je Eintrag per `satisfies`; Katalog-Check vergleicht es.
- **Akzeptanz:** zweiter Lauf folgenlos; Smoke weist ab: bindbare Rolle + nicht bindbare Permission, gebundene
  Zuweisung einer nicht bindbaren Rolle, Zurücksetzen einer gebunden zugewiesenen Rolle, Projekt eines fremden Kunden,
  fehlender Fachwert (`runMissingDefaultChecks`).

### CRM-07a-T2 — Actor und Patterns

- Actor-Auflösung lädt gebundene Zuweisungen aktiver Rollen; unbekannte oder nicht bindbare Keys werden verworfen.
- `canOn`, `canAnywhere`, `accessScope`, `crmAccessCondition` mit Unit-Tests.
- **Akzeptanz:** DB-Fehler bleibt fail-closed; Rollenentzug und Bindungsentzug wirken beim nächsten Request.

### CRM-07a-T3 — Commands, Queries, Routen

- Grant/Revoke mit `updateVersioned` am Mitglied und genau einem Security-Event; `createRole`/`updateRole` um
  `scopeAssignable`.
- `MEMBER_WITHOUT_ROLE` zählt beide Zuweisungsarten — in `replaceWorkspaceMemberRoles` und im Revoke.
- **Akzeptanz:** Route-Tests je Endpunkt für 401/404/403/Erfolg/Fachfehler; manipulierter Request mit nicht bindbarer
  Rolle ergibt 422.

### CRM-07a-T4 — Seeds und Integrationstests

- `db:seed:crm`: Mitglied „Kunde 1 komplett“, Mitglied „nur Projekt 2“, Rolle „Nur Projekte lesen“.
- Integrationstest (`rbac-integration`): Zuweisung anlegen/entfernen ergibt korrekt aufgelösten Actor; parallele
  Zuweisungen mit derselben Version ergeben einmal 201 und einmal 409.

## Nicht Teil dieses Tasks

- Filter in Lese- und Schreibpfaden, Bereichs-Gate, Zuständigkeitsprüfung → Task 37 (Ordner 07b)
- UI, Rollen-Dialog-Erweiterung, Markierung „Zuständig ohne Zugriff“, NOT-NULL-Cleanup → Task 38 (Ordner 07c)
- Eigenes delegierbares Recht zur Zugriffsverwaltung, Mitglied direkt nur mit gebundener Rolle anlegen
