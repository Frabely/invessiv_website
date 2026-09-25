# Ordner 12a — Portal-Fundament

> **Status:** offen · **Abhängigkeiten:** 03b, 04, 07b, 08 · **Aufwand:** 3–4 Tage · **Reviewziel:** 60–80 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`49-portal-fundament.md`](./49-portal-fundament.md) — Schema, Portal-Rechte, `PortalActor`, Gates,
  Zugriffshelfer, Routing, Portal-Shell mit Navigations-Registry und 03b-Nachzug.

Das Kundenportal hat nach diesem Ordner ein vollständiges, getestetes Fundament, bleibt aber **unsichtbar**: Das
Ohne Einladungsfluss (Ordner 12b) entsteht in Produktion keine Mitgliedschaft. Lokal und in Tests
ist die Portal-Shell über Seed-Daten erreichbar.

Ordner 12a legt alles an, worauf **jeder** spätere Portal-Ordner (12b, 13, 13a, 15, 15a, 15b, 16, 18, 20) aufsetzt,
damit keiner davon Auth, Navigation, Rechte oder Zugriffsfilter selbst erfindet.

## Umfang

- **Schema:** `portal_memberships`, `portal_membership_roles`, `portal_invitations`, `portal_invitation_roles`;
  Security-Event- und Subject-Typen für Einladung, Einlösung, Widerruf und Rollenänderung.
- **Portal-Rechte:** Portal-Permissions im bestehenden Katalog, Realm `portal`. 12a führt nur `portal.access` ein.
  Jeder spätere Ordner fügt die Permissions seines Moduls selbst hinzu. Systemrolle `portal_standard`.
- **Auth-Schicht** unter `src/server/portal/auth/`: branded `PortalActor`, `requirePortalActor(locale, customerId)`,
  `withPortalActor`, fail-closed.
- **Zugriffshelfer:** `portalAccessCondition` und `portalCanOn` — heute firmenweit, vorbereitet für
  projektgebundene Portalrollen.
- **Routing:** `SITE_ROUTES.PORTAL`, Pfad-Builder, englische Slugs (`projects`, `files`, `assets`, `messages`,
  `onboarding`, `services`, `invite`), portalbewusste Weiche nach dem Login.
- **Portal-Shell:** `(portal)`-Routengruppe, Firmenweiche, Firmenwechsler, Abmelden, `PORTAL_NAV_ITEMS`-Registry.
- **03b-Nachzug:** Mitgliederkandidaten und `addWorkspaceMember` vertragen Konten mit Portalmitgliedschaft.

## Rollenmodell (mit dem Nutzer abgestimmt, 23.09.2026)

- Jeder Kundenkontakt hat einen **eigenen Login** und je Firma eine eigene Portalmitgliedschaft.
- Portalrollen liegen im Realm `portal` derselben Rollen-Engine wie die Mitarbeiterrollen. Sie werden **intern**
  definiert (Recht `roles.manage`) und **je Mitgliedschaft** zugewiesen (Recht `portal.manage`). Zwei Kontakte
  derselben Firma dürfen unterschiedliche Rollen haben.
- Der Kunde verwaltet in Version 1 nichts selbst — keine Kunden-Admins, keine Selbsteinladung von Kollegen.
- Portalrollen gelten vorerst für die **ganze Firma**. Projektgebundene Portalrollen folgen später additiv; dafür
  tragen `PortalActor.projectPermissions` sowie `portalAccessCondition`/`portalCanOn` die Struktur schon jetzt, damit
  kein fertiges Portal-Modul umgebaut werden muss.
- Firmenweite Module (Chat, Onboarding-Bogen) verlangen nach Einführung des Projektbezugs eine firmenweite Rolle.

## Merge-Gate

- [ ] Ohne Portalmitgliedschaft antworten geschützte Portalrouten und -Endpunkte mit 404.
- [ ] Migration idempotent, Drizzle-Modelle deckungsgleich; `db:smoke:rbac` und Katalog-Check grün.
- [ ] Eine Portalrolle ist keinem Workspace-Mitglied zuweisbar, eine Workspace-Rolle keiner Portalmitgliedschaft —
      jeweils auf DB-Ebene.
- [ ] Eine interne Mitgliedschaft gewährt keinen Portalzugriff und umgekehrt, auch bei derselben `users.id`.
- [ ] Es existiert kein Codepfad, der einen `PortalActor` aus einer rohen `customerId` erzeugt.
- [ ] Fremde oder geratene `customerId` im Pfad ergibt 404 ohne Existenzbestätigung.
- [ ] Widerrufene Mitgliedschaft wird beim nächsten Request abgewiesen; DB-Fehler verweigert (fail-closed).
- [ ] Zwei Firmen desselben Kontos sind per Link wechselbar und gleichzeitig in zwei Tabs nutzbar (Seed).
- [ ] `portalAccessCondition` und `portalCanOn` sind zentral getestet, inklusive fremder Firma.
- [ ] Die Portal-Navigation zeigt nur Einträge, deren `requiredPermission` der Actor hält; ohne Einträge keine
      leere Navigation.
- [ ] Ein Clerk-Konto mit Portalmitgliedschaft kann als internes Mitglied angelegt werden und ist in der
      Kandidatenliste gekennzeichnet; ein bestehendes Mitglied erscheint dort nicht.
- [ ] Keine Spalte und kein Index auf einer E-Mail-Adresse in den Portaltabellen.

## Rollback

Die Tabellen sind additiv und ohne Einladungen leer; ein Rückbau ist nicht nötig. Der interne
Workspace bleibt unabhängig. Die Weiche nach dem Login greift nur bei aktiver Portalmitgliedschaft.
