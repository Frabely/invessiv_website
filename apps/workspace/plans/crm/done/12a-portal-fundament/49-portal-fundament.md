# Task 49 — Portal-Fundament

> **Merge-Einheit:** Ordner 12a · **Branch:** `feat/crm-portal-fundament`
> **Aufwand:** L · **Abhängigkeiten:** Task 02 (Rechte), Task 02c (Mitglieder- und Rollenverwaltung),
> Task 06 (Personen und Zuordnungen), Task 36 (Zugriffsbereiche)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

## Context

Bevor ein Kunde das Portal betritt (Ordner 12b) und bevor das erste fachliche Portal-Modul entsteht (Ordner 13), muss
das Fundament stehen, auf dem alle Portal-Ordner aufsetzen: Tabellen, Rechte, Actor, Gates, Zugriffsfilter, Routing,
Shell und Navigation. Ohne diesen Schnitt würde jeder Portal-Ordner Teile davon selbst erfinden — die Pläne von 13,
15b und 18 verwenden heute schon drei verschiedene `requirePortalActor`-Signaturen und gemischte Routen-Slugs.

Dieser Task baut **nichts Sichtbares**. Ohne Einladungsfluss entsteht in Produktion keine
Mitgliedschaft. Nutzbar ist das Fundament lokal über Seed-Daten und in Tests.

## Bereits vorhanden (wiederverwenden, nicht neu bauen)

| Baustein                               | Ort                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| Realm-Konstante `AuthRealm.Portal`     | `packages/common/src/constants/auth/auth-realms.ts`                          |
| `roles.realm`, `permissions.realm`     | `packages/db/src/record-configuration/auth/{roles,permissions}.ts`           |
| Realm-gebundene Composite-FKs          | `role-permissions.ts`, `workspace-member-roles.ts` (Muster für Portalrollen) |
| `scope_assignable` / `scopable`        | Rollen und Permission-Katalog (Task 36), für den späteren Projektbezug       |
| Portal-Rollen im Smoke                 | `packages/db/scripts/smoke-rbac.ts`                                          |
| Realm-agnostisches `can()`             | `packages/common/src/patterns/auth/can.ts`                                   |
| Actor-Auflösung, Status-Union, `cache` | `lib/auth/workspace-authentication.ts`, `lib/auth/permissions.ts`            |
| API-Wrapper                            | `lib/auth/api.ts` (`withWorkspaceApiActor`)                                  |
| Zugriffsfilter-Muster                  | `server/workspace/shared/services/crm-access-condition.ts`, `canOn`          |
| Sidebar-Registry-Muster                | `common/constants/navigation/workspace-sidebar-items.ts`                     |
| Security-Events                        | `server/workspace/auth/services/security-event-service.ts`                   |
| Personensprache                        | `people.preferred_locale`                                                    |
| Interne Verwaltungs-Permission         | `portal.manage` (Realm Workspace, scopable, `CUSTOMER_ONLY`)                 |

## Entscheidungen

| Bereich              | Entscheidung                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identität            | Dieselbe Clerk-Instanz und derselbe `users`-Datensatz. Interne und Portalmitgliedschaften gewähren einander keine Rechte                                                                 |
| Mitgliedschaft       | `portal_memberships` verbindet `users.id`, `people.id` und `customers.id`; eine Zeile je Kunde und Person; dieselbe Person darf beliebig vielen Kunden angehören                         |
| Rollen               | Portalrollen im Realm `portal`, intern definiert (`roles.manage`) und **je Mitgliedschaft** zugewiesen (`portal.manage`). Kontakte derselben Firma dürfen unterschiedliche Rollen haben  |
| Permissions          | 12a führt nur `portal.access` (Portal dieser Firma betreten) ein. Jeder Portal-Ordner ergänzt die Permissions seines Moduls selbst, in seiner Migration                                  |
| Systemrolle          | `portal_standard` enthält alle Portal-Permissions; jede Migration, die eine Portal-Permission einführt, ergänzt sie dort. Vorgabe im Einladungsdialog (12b); eigene Portalrollen möglich |
| Kopplung             | Read-/Write-Kopplung (z. B. `portal.tasks.complete` ohne `portal.tasks.read`) ist dieselbe bekannte Lücke wie intern; siehe Task 48, dort mit abdecken                                   |
| Projektbezug         | Vorbereitet, nicht aktiv: `PortalActor.projectPermissions` ist immer leer, `portalAccessCondition`/`portalCanOn` liefern „ganze Firma“. Spalte `project_id` folgt später additiv         |
| Kein Zustand         | Aktiver Kunde steht im Pfad und wird je Request neu gegen eine aktive Mitgliedschaft aufgelöst. Kein Cookie, keine Clerk-Metadaten                                                       |
| Kein E-Mail-Abgleich | Keine Spalte und kein Index auf einer E-Mail-Adresse. Autorisierung nur über `clerk_user_id` → `users.id` → Mitgliedschaft                                                               |
| Routen-Slugs         | Englisch: `/portal`, `/portal/invite/[token]`, `/portal/[customerId]/{projects,files,assets,messages,onboarding,services}`, Feedback unter `projects/[projectId]/feedback`               |

## Tabellen

```txt
portal_memberships
  id uuid PK
  customer_id uuid NOT NULL   → customers.id ON DELETE CASCADE
  person_id uuid NOT NULL     → people.id ON DELETE RESTRICT
  user_id uuid NOT NULL       → users.id ON DELETE RESTRICT
  activated_at timestamptz NOT NULL
  revoked_at timestamptz NULL
  last_seen_at timestamptz NULL
  email_notifications_enabled boolean NOT NULL DEFAULT true
  customer_notified_at timestamptz NULL      Anker des Digests (Ordner 20c)
  version integer NOT NULL DEFAULT 1
  created_at / updated_at
  UNIQUE INDEX portal_memberships_customer_person_uidx ON (customer_id, person_id)
  INDEX (user_id)     WHERE revoked_at IS NULL
  INDEX (customer_id) WHERE revoked_at IS NULL
  Composite-FK (customer_id, person_id) → customer_contact_assignments (customer_id, person_id)

portal_membership_roles
  portal_membership_id uuid NOT NULL → portal_memberships.id ON DELETE CASCADE
  role_id uuid NOT NULL
  role_realm text NOT NULL CHECK (role_realm = 'portal')
  assigned_by_member_id uuid NOT NULL → workspace_members.id ON DELETE RESTRICT
  assigned_at timestamptz NOT NULL
  PRIMARY KEY (portal_membership_id, role_id)
  FK (role_id, role_realm) → roles (id, realm) ON DELETE RESTRICT

portal_invitations
  id uuid PK
  assignment_id uuid NOT NULL → customer_contact_assignments.id ON DELETE CASCADE
  token_hash text NOT NULL UNIQUE        SHA-256, nie der Token selbst
  email_notifications_enabled boolean NOT NULL DEFAULT true
  expires_at timestamptz NOT NULL        Anlage + 7 Tage
  redeemed_at timestamptz NULL
  revoked_at timestamptz NULL
  created_by_member_id uuid NOT NULL → workspace_members.id
  created_at / updated_at
  UNIQUE INDEX portal_invitations_open_uidx ON (assignment_id)
    WHERE redeemed_at IS NULL AND revoked_at IS NULL
  INDEX (expires_at) WHERE redeemed_at IS NULL AND revoked_at IS NULL

portal_invitation_roles
  portal_invitation_id uuid NOT NULL → portal_invitations.id ON DELETE CASCADE
  role_id uuid NOT NULL
  role_realm text NOT NULL CHECK (role_realm = 'portal')
  PRIMARY KEY (portal_invitation_id, role_id)
  FK (role_id, role_realm) → roles (id, realm) ON DELETE RESTRICT
```

`portal_invitation_roles` hält die beim Einladen gewählten Rollen, bis die Einlösung sie in
`portal_membership_roles` überträgt (12b). `user_id` ist bewusst nicht unique: derselbe User trägt eine Zeile je Firma.

Security-Event-Typen (CHECK drop-and-recreate wie Migration 0025/0032): `portal_invitation_created`,
`portal_invitation_revoked`, `portal_invitation_redeemed`, `portal_membership_revoked`,
`portal_membership_roles_replaced`. Subject-Typen: `portal_invitation`, `portal_membership`. Metadaten nur IDs.

## Architektur

```txt
Seitenaufruf
  (portal)/portal/[customerId]/layout.tsx → requirePortalActor(locale, customerId)
    → kein Clerk-User: Redirect zur Anmeldung mit redirect_url
    → users über clerk_user_id, dann genau eine aktive Mitgliedschaft (user_id, customer_id), sonst notFound()
    → Portalrollen (Realm portal, aktiv) → Permissions; ohne portal.access: notFound()
    → PortalActor { userId, membershipId, customerId, personId, permissions, projectPermissions: leer }
    → last_seen_at höchstens alle 15 Minuten fortschreiben

Einstieg ohne Kunde
  (portal)/portal/page.tsx → listPortalMembershipsForUser
    → genau eine aktive: Redirect dorthin · mehrere: Firmenauswahl · keine: notFound()

Portal-API
  withPortalActor(handler) — Gegenstück zu withWorkspaceApiActor
    → Pfad /api/portal/[customerId]/… , löst gegen die Mitgliedschaft auf
    → Handler-Signatur (request, actor: PortalActor) — keine rohe customerId erreichbar
    → Status-Mapping: 401 ohne Sitzung, 404 ohne Mitgliedschaft, 503 bei DB-Fehler

Zugriffsfilter (Pflicht für jede Portal-Query ab Ordner 13)
  portalAccessCondition(actor, permission, { customerId: col, projectId?: col }) → SQL
  portalCanOn(actor, permission, { projectId? }) → boolean
    → heute: Permission firmenweit gehalten ⇒ alle Projekte der Mitgliedsfirma
    → später: zusätzlich projectPermissions — ohne Änderung an den Modulen

Weiche nach dem Login
  [locale]/page.tsx und Sign-in-Fallback
    → aktive Workspace-Mitgliedschaft: wie heute
    → keine Workspace-, aber Portalmitgliedschaft: Redirect /portal
    → beides: intern, Portal-Link im Nutzermenü
```

`PortalActor` ist ein Branded Type (`unique symbol`), dessen Konstruktor nur in `server/portal/auth/**` exportiert
ist. `proxy.ts` kennzeichnet nur `/[locale]/portal/invite/(.*)` als öffentlich; alle anderen Portalseiten laufen durch
`auth.protect()`. `/api/*` passiert den Proxy weiterhin ungeprüft — `withPortalActor` bringt die Prüfung selbst mit.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_portal_foundation.sql
packages/db/src/record-configuration/crm/portal-memberships.ts
packages/db/src/record-configuration/crm/portal-invitations.ts
packages/db/src/record-configuration/auth/portal-membership-roles.ts
packages/db/src/record-configuration/auth/portal-invitation-roles.ts
packages/db/src/constraint-names/crm/portal-*-constraint-names.ts
packages/db/scripts/seed-crm-fixture.ts                     + zwei Portalkontakte, einer mit zwei Firmen
packages/common/src/constants/auth/permissions.ts            + portal.access (Realm portal)
packages/common/src/constants/auth/system-role-keys.ts       + portal_standard
packages/common/src/constants/auth/security-event-types.ts   + Portal-Ereignisse
packages/common/src/constants/crm/errors/portal-error-codes.ts
packages/common/src/contracts/portal/portal-membership.dto.ts

apps/workspace/src/config/routes.ts                          + PORTAL, PORTAL_INVITE
apps/workspace/src/lib/navigation/portal-pathname.ts         portalPathFor(locale, customerId, section?)
apps/workspace/src/proxy.ts                                  + öffentliche Einlöseroute
apps/workspace/src/common/constants/portal/portal-sections.ts
apps/workspace/src/common/constants/portal/portal-nav-items.ts   PORTAL_NAV_ITEMS (heute leer)
apps/workspace/src/server/portal/
  AGENTS.md  CLAUDE.md
  auth/portal-actor.ts                   Branded Type + Konstruktor (nur hier)
  auth/resolve-portal-actor.query-handler.ts
  auth/require-portal-actor.ts
  auth/with-portal-actor.ts
  shared/portal-access-condition.ts
  shared/portal-can-on.ts
  query-handler/list-portal-memberships-for-user.query-handler.ts
apps/workspace/src/app/[locale]/(portal)/
  AGENTS.md  CLAUDE.md
  layout.tsx                              Locale-Gate, Portal-Grundlayout
  portal/page.tsx                         Firmenweiche
  portal/[customerId]/layout.tsx          requirePortalActor, PortalShell
  portal/[customerId]/page.tsx            Firmenname; ersetzt in Ordner 13
apps/workspace/src/components/portal/portal-shell/
apps/workspace/src/components/portal/customer-switcher/
apps/workspace/src/components/portal/portal-company-picker/
apps/workspace/src/i18n/dictionaries/portal/{shell,meta,picker}/{de,en}.json

apps/workspace/src/server/workspace/access/**                03b-Nachzug Kandidaten/Anlegen
apps/workspace/src/app/[locale]/page.tsx                     Weiche nach Login
```

## Tickets

### CRM-49-T1 — Migration, Modelle, Katalog

- **Inhalt:** Tabellen wie oben; `portal.access` und Systemrolle `portal_standard` in Katalog
  und Migration; Security-Event-CHECKs; Seed.
- **Akzeptanz:**
  - Migration idempotent; Drizzle-Modelle deckungsgleich (ausdrücklicher Review-Punkt)
  - Kunde/Person nicht doppelt; `users.id` über getrennte Mitgliedschaften mehreren Kunden zuordenbar
  - Mitgliedschaft nur für eine bestehende Personenzuordnung desselben Kunden (Composite-FK)
  - Workspace-Rolle an Portalmitgliedschaft und Portalrolle an Workspace-Mitglied scheitern in der DB
  - Zwei offene Einladungen derselben Zuordnung sind unmöglich
  - `db:smoke:rbac` und Katalog-Check kennen `portal.access` und `portal_standard`
  - Keine Spalte und kein Index auf einer E-Mail-Adresse

### CRM-49-T2 — Portal-Auth-Schicht und Zugriffshelfer

- **Inhalt:** `PortalActor`, Resolver, `requirePortalActor`, `withPortalActor`, `portalAccessCondition`,
  `portalCanOn`, `listPortalMembershipsForUser`, `server/portal/AGENTS.md`.
- **Akzeptanz:**
  - Nur interne Membership → Portal 404; nur Portalmitgliedschaft → interner Bereich 404
  - Beide Memberships → je Route ausschließlich die Permissions des jeweiligen Realms
  - Fremde oder geratene `customerId` → 404 ohne Existenzbestätigung
  - Widerrufene Mitgliedschaft → beim nächsten Request abgewiesen
  - Ohne `portal.access` → 404
  - DB-Fehler → fail-closed (503 API, Fehlerseite UI)
  - Kein exportierter Konstruktor außerhalb `server/portal/auth/**` (Test über Modul-Exporte)
  - `portalAccessCondition`: Rows fremder Firmen nie im Ergebnis, auch nicht über Join

### CRM-49-T3 — Routing, Shell, Navigation, Weiche

- **Skills:** `frontend-design`, `copywriting`
- **Inhalt:** `SITE_ROUTES`, Pfad-Builder, `(portal)`-Gruppe, `PortalShell` (deutlich vom internen Bereich
  unterschieden, mobil zuerst), Firmenwechsler als Linkliste, Firmenauswahl, Abmelden, `PORTAL_NAV_ITEMS`,
  Weiche nach Login, `(portal)/AGENTS.md`, `noindex`/`force-dynamic`.
- **Akzeptanz:**
  - Eine Firma → Redirect; mehrere → Auswahl ohne stillen Default; keine → 404
  - Firmenwechsel ist ein Link; zwei Tabs mit zwei Firmen funktionieren gleichzeitig
  - Navigation zeigt nur freigeschaltete Einträge; ohne Einträge keine leere Leiste
  - Keine internen Navigationspunkte im Portal
  - Weiche: nur Portal → `/portal`; beides → intern mit Portal-Link
  - Alle Pfade über `SITE_ROUTES`/Pfad-Builder, keine String-Literale

### CRM-49-T4 — 03b-Nachzug Mitgliederkandidaten

- **Inhalt:** Kandidat ist ein Clerk-Konto ohne `workspace_members`-Zeile. `addWorkspaceMember` verwendet eine
  vorhandene `users`-Zeile wieder (Stammdaten weiter aus Clerk). Konten mit Portalmitgliedschaft sind in der
  Kandidatenliste gekennzeichnet. `CLERK_ACCOUNT_ALREADY_LINKED` bedeutet danach „bereits Mitglied“ (Text DE/EN).
- **Akzeptanz:**
  - Konto mit Portalmitgliedschaft erscheint gekennzeichnet und ist anlegbar; es entsteht keine zweite `users`-Zeile
  - Bestehendes Mitglied erscheint nicht
  - Das Anlegen gewährt keinen Portalzugriff und entzieht keinen

## Deploy-Sicherheit

1. **Live sichtbar:** nichts ohne eingelöste Einladung.
2. **Bricht nichts:** Die Weiche nach Login verhält sich ohne Portalmitgliedschaft wie heute. Die 03b-Änderung wirkt
   nur auf Konten mit `users`-Zeile ohne Mitgliedschaft; solche entstehen erst mit 12b.
3. **Offen:** Einladung, Einlösung, Verwaltung (Ordner 12b); Portalinhalte (Ordner 13 ff.).

## Vorgaben für alle folgenden Portal-Ordner

- Seiten: `requirePortalActor(locale, customerId)`; Endpunkte: `withPortalActor` unter `/api/portal/[customerId]/…`.
- Jede Portal-Query filtert über `portalAccessCondition`, jede Portal-Mutation prüft `portalCanOn`.
- Jedes Modul bringt eigene Portal-Permissions mit, ergänzt `portal_standard` und registriert seinen
  Navigationseintrag in `PORTAL_NAV_ITEMS` mit `requiredPermission`.
- Eigene Portal-DTOs unter `packages/common/src/contracts/portal/`; nie ein Workspace- oder Cockpit-DTO.
- Routen-Slugs englisch; Texte in `dictionaries/portal/<modul>/{de,en}.json`.
- Negativtests: fremde Firma, fehlende Portal-Permission, widerrufene Mitgliedschaft.
