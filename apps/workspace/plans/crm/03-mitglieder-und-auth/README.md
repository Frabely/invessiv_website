# Ordner 03 — User, Permission-Katalog und fail-closed Auth

> **Status:** im Review · **Branch:** `feat/crm-users-rbac` · **Abhängigkeiten:** Ordner 01 und 02 gemergt
> **Review-Ziel:** 80–120 geänderte Dateien · **Folgeeinheit:** Ordner 03b (Mitglieder- und Rollenverwaltung)

## Ziel und Stand nach Merge

Permissions sind der Kern der Autorisierung. Ein Bereich, eine Route oder ein Command kennt nur den Schlüssel der
Permission, die er verlangt — nicht, welche Rolle sie gewährt. Ein User kennt nur, **ob** er eine Permission besitzt.

- Jeder angemeldete Mensch besitzt genau einen Datensatz in `users`; Clerk authentifiziert, die DB autorisiert.
- `workspace_members` referenziert genau einen `user` und trägt keine Identitäts- oder Rechtefelder mehr.
- Permissions kommen **ausschließlich über Rollen**. Effektive Rechte sind die Vereinigung aller aktiven Rollen.
- Katalog, Systemrollen und deren Rechte liegen in der DB und werden per Smoke gegen den Code geprüft.
- Alle bestehenden Bereiche (Dashboard, Leads, Outreach) und API-Routen verlangen eine Permission.
- Der erste Owner entsteht atomar über `WORKSPACE_BOOTSTRAP_CLERK_USER_ID`; die E-Mail-Allowlist entfällt.
- Menschliche Activities referenzieren `users.id`; Systemschreiber tragen einen `system_actor_key`.
- Sicherheitsrelevante Änderungen landen in der eigenen Tabelle `security_events`.

Nach dem Merge nutzt ausschließlich der gebootstrappte Owner den Workspace. Weitere Mitglieder entstehen erst über
die Verwaltung aus Ordner 03b. Das ist eine bewusste, mit dem Nutzer abgestimmte Übergangsgrenze.

## Entscheidungen (13.09.2026, mit dem Nutzer abgestimmt)

| Thema               | Entscheidung                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| Zuordnung           | Nur über Rollen; keine direkten User-Permissions                                                         |
| Schnitt             | Split-Gate greift (≈160 Dateien): 03 = Fundament + Cutover, 03b = Verwaltung (API + UI) + Registry       |
| Bootstrap           | `WORKSPACE_BOOTSTRAP_CLERK_USER_ID`; kein E-Mail-Abgleich, keine Allowlist, kein Fallback                |
| Mitglied verknüpfen | (03b) Owner wählt ein noch nicht verknüpftes Clerk-Konto über die Clerk Backend API                      |
| Audit               | Eigene append-only Tabelle `security_events`; `activities` bleibt Lead-/Kunden-Historie                  |
| Legacy-Spalten      | `clerk_user_id`, `email`, `role`, `credentials_access` werden in 03 direkt entfernt; Ordner 03a entfällt |
| Basisrolle          | Operativ ohne Löschen, ohne Credential-Reveal/-Write und ohne Portalverwaltung                           |
| Absicherung         | Integrationstests gegen die Dev-DB statt Browser-E2E (kein Clerk-Test-Setup vorhanden)                   |

## Warum die Legacy-Spalten sofort gehen dürfen

`packages/db/AGENTS.md` verbietet `DROP` in Migrationen, bis der letzte Leser weg ist. Diese Bedingung ist erfüllt:
Die vorherige App-Version liest `workspace_members` nirgends (nur Drizzle-Modell, Seed und Smoke), und alle
Ordner-01-Tabellen sind leer. Eine harte Leerheitsprüfung bricht die Migration vor der ersten Änderung ab, falls doch
Daten existieren. Damit entfallen Schattenwrites und der separate Cleanup-Ordner 03a.

## Umsetzung

1. Migration: Leerheits-Preflight, Legacy-Spalten entfernen, `workspace_members.user_id`, `users`, `permissions`,
   `roles`, `role_permissions`, `workspace_member_roles`, `security_events`, Seed von Katalog und Systemrollen,
   Actor-Spalten an `activities`.
2. Const-Objekte in `packages/common`: `Permission` samt Definitionen (Realm, delegierbar), `AuthRealm`,
   `SystemRoleKey` samt Rechtesätzen, `SystemActorKey`, `SecurityEventType`, `SecuritySubjectType`.
3. Actor-Auflösung, Bootstrap-Command und Gates (`requireWorkspaceActor`, `requireWorkspaceArea`,
   `withWorkspaceApiActor`, `withPermission`).
4. Bereichs-Registry `WORKSPACE_AREA_PERMISSIONS`: Sidebar, Bereichs-Gates der Pages und Root-Redirect lesen nur
   diese Map.
5. Alle bestehenden API-Routen permissionbasiert absichern; Lead- und Outreach-Commands schreiben den User als Actor.
6. Seeds, Smokes und Integrationstests auf das Zielmodell umstellen.

## Merge-Gate

- [ ] Migration bricht bei nicht leeren Ordner-01-Tabellen vor jeder Schemaänderung ab; zweiter Lauf ist folgenlos.
- [ ] Drizzle-Modelle sind deckungsgleich zur Migration (Spalten, Typen, Constraints).
- [ ] Smoke: Katalog und Systemrollen-Rechte stimmen exakt mit dem Code überein (in beide Richtungen).
- [ ] Smoke: Realm-Mischung, nicht delegierbare Permission in Custom-Rolle und fehlende Fachwerte werden abgewiesen.
- [ ] Kein Code liest oder schreibt `WORKSPACE_ALLOWED_EMAILS`, `credentials_access` oder eine Rollenbezeichnung.
- [ ] Fehlender User, inaktiver User, fehlende/inaktive Membership und DB-Fehler öffnen keinen Zugriff.
- [ ] Fehlende Permission ergibt 403 (API) bzw. 404 (Seite); Rollenentzug wirkt beim nächsten Request.
- [ ] Parallele Bootstrap-Requests erzeugen auf einer DB ohne bestehenden Owner genau einen Owner; nach dem ersten
      aktiven Owner ist Bootstrap zu. Existiert bereits ein Owner, überspringt der Integrationstest diesen Fall sichtbar.
- [ ] Sidebar zeigt nur Bereiche mit Permission; Seiten ohne Permission antworten 404 — auch bei reinem
      Query-Param-Wechsel, weil jede Page selbst gated.
- [ ] Neue Activities menschlicher Änderungen tragen `actor_user_id`; Legacy-Zeilen bleiben lesbar.
- [ ] `.env.example` und Vercel-Umgebungen: `WORKSPACE_BOOTSTRAP_CLERK_USER_ID` gesetzt, Allowlist entfernt.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes und Workspace-Build grün.

## Rollout-Reihenfolge

1. Eigenes Konto in der Clerk-Instanz der Zielumgebung anlegen (Registrierung oder Einladung im Clerk-Dashboard) und
   dort unter „Users" die `user_…`-ID kopieren. Die Clerk-ID ist bewusst der Anker statt einer E-Mail: Sie ist
   unveränderlich und eindeutig, während E-Mails geändert, hinzugefügt oder bei offener Registrierung beansprucht
   werden können.
2. `WORKSPACE_BOOTSTRAP_CLERK_USER_ID` mit dieser ID in der Vercel-Umgebung setzen; `WORKSPACE_ALLOWED_EMAILS`
   entfernen.
3. In `development`/`preview` vorhandene Fixture-Zeilen aus `db:seed:crm` entfernen, sonst stoppt der Preflight.
4. Migration anwenden und **unmittelbar danach** die App deployen (siehe Rollback).
5. Einmal einloggen: Der erste Request bootstrappt den Owner atomar, danach ist der Bootstrap geschlossen. Die
   Variable darf anschließend entfernt werden.

## Rollback

**Bewusst akzeptiertes Risiko (13.09.2026, mit dem Nutzer abgestimmt):** Nach der Migration ist ein App-Revert auf die
Version vor Ordner 03 nicht funktionsfähig. Die neue `activities_actor_check` lehnt Activities ohne
`actor_user_id`/`system_actor_key` ab, die die Vorversion bei jeder Lead-Änderung, jedem Import und jedem
Outreach-Entwurf schreibt. Akzeptiert, weil der Workspace bis zum Merge ausschließlich vom Owner genutzt wird und
zwischen Migration und Deploy keine Nutzung stattfindet.

Bevorzugter Rückweg ist deshalb ein Rollforward. Ist ein Revert unvermeidbar, muss vorher
`ALTER TABLE activities DROP CONSTRAINT activities_actor_check` ausgeführt und die Allowlist-Env wieder gesetzt werden.
Die neuen Tabellen bleiben stehen; die entfernten, leeren Legacy-Spalten braucht die Vorversion nicht.

## Nicht Teil dieses Ordners

- Mitglieder-/Rollenverwaltung, Ownership-Registry, Übergabe und Deaktivierung → Ordner 03b
- Portalmitgliedschaften und Portal-Permissions → Ordner 12
- Credential-Verschlüsselung und Reveal-UI → Ordner 19
- attributbasierte Regeln, Deny-Regeln, IdP-/SCIM-Synchronisation

## Vertiefung

- [`02-rechtesystem.md`](./02-rechtesystem.md) — Tabellen, Katalog, Invarianten, Autorisierungsablauf
