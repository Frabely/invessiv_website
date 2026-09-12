# Task 20 — Portal-Zugang

> **Branch:** `feat/crm-portal-zugang`
> **Aufwand:** L (rund zwei Tage)
> **Abhängigkeiten:** Task 06 (Ansprechpartner), Task 02 (Rechte), Task 19 (Mail)
> **Migration:** `0029_create_customer_portal_users.sql` (Planwert)

## Context

Der sicherheitskritischste Task des gesamten Plans: Ab hier betreten fremde Personen die Anwendung.
Bisher galt eine einzige Regel — E-Mail in der Allowlist oder kein Zutritt. Jetzt existieren zwei
Zugangswelten in derselben Anwendung und derselben Clerk-Instanz.

Dieser Task baut **nur den Zugang**: Einladung, Registrierung, Zuordnung, Gate, Widerruf. Die
Portalseiten selbst folgen in Task 21. Nach diesem Task kann sich ein Kunde anmelden und sieht eine
schlichte Bestätigungsseite — mehr nicht, aber das nachweislich sicher.

## Die zentrale Gefahr

Ein Portalnutzer darf unter keinen Umständen Daten eines anderen Kunden sehen. Absicherung auf drei
Ebenen:

1. **Strukturell:** Portal-Handler nehmen **keine** `customerId` aus der Anfrage entgegen. Sie
   beziehen sie aus der Sitzung. Ein manipulierter Parameter kann nichts bewirken, weil kein
   Parameter existiert.
2. **Getrennte Codepfade:** Portal-Handler liegen unter `src/server/portal/`, nie unter
   `src/server/workspace/`. Kein Handler wird von beiden Welten benutzt.
3. **Getrennte Routen:** `(portal)`-Gruppe mit eigenem Gate. Die `(app)`-Allowlist bleibt für den
   internen Bereich unverändert scharf.

## Entscheidungen

| Bereich               | Entscheidung                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Identität             | Dieselbe Clerk-Instanz. Ein Clerk-Konto ist entweder intern oder Portalnutzer — nie beides                               |
| Zuordnung             | `customer_portal_users` verbindet Clerk-Benutzerkennung mit genau **einem** Kunden                                       |
| Einladung             | Über die Clerk-Einladungs-API plus eigene Mail; die Einladung ist an einen Ansprechpartner gebunden                      |
| Vor der Registrierung | Zeile mit Status `invited` und E-Mail, ohne Clerk-Kennung. Beim ersten Login wird die Kennung nachgetragen               |
| Abgleich              | Über die E-Mail-Adresse, kleingeschrieben und getrimmt                                                                   |
| Widerruf              | Setzt Status `revoked`; das Gate verweigert sofort. Zusätzlich wird die Clerk-Einladung zurückgezogen                    |
| Interne Nutzer        | Eine Adresse in `WORKSPACE_ALLOWED_EMAILS` kann **kein** Portalnutzer werden — Prüfung beim Einladen, mit klarer Meldung |
| Portal-Route          | `/[locale]/(portal)/portal/**` — eigenes Segment, damit die Zugehörigkeit an der URL ablesbar ist                        |
| Weiterleitung         | Nach dem Login entscheidet eine Weiche anhand des Kontotyps: intern zum Dashboard, Portalnutzer ins Portal               |
| Sprache               | Das Portal nutzt dieselben Locales wie der Rest (DE und EN)                                                              |

## Tabelle

```txt
customer_portal_users
  id uuid PK
  customer_id uuid NOT NULL → customers.id ON DELETE CASCADE
  contact_id uuid NULL      → customer_contacts.id ON DELETE SET NULL
  email text NOT NULL
  clerk_user_id text NULL UNIQUE        erst nach der ersten Anmeldung gesetzt
  role text NOT NULL DEFAULT 'customer_member'   CHECK in PORTAL_ROLE_VALUES
  status text NOT NULL DEFAULT 'invited'         CHECK in ('invited','active','revoked')
  invited_at / activated_at / revoked_at timestamptz
  last_seen_at timestamptz NULL
  created_at / updated_at
  UNIQUE INDEX customer_portal_users_email_uidx ON lower(btrim(email))
  INDEX (customer_id)
```

Der globale Unique-Index auf der E-Mail ist Absicht: Eine Person gehört zu genau einem Kunden. Wäre
er nur je Kunde eindeutig, könnte dieselbe Adresse zwei Kunden zugeordnet sein — und die Auflösung
beim Login wäre mehrdeutig.

## Architektur

```txt
Einladen (intern)
  POST /api/workspace/crm/customers/[id]/portal-users
    → withPermission(PortalAccessManage)
    → prüfen: Adresse nicht in der internen Allowlist, nicht bereits vergeben
    → Zeile mit Status invited
    → Clerk-Einladung erzeugen
    → Mail über packages/mail
    → customer_activities

Erster Login (Kunde)
  Clerk-Anmeldung → Weiche
    → resolvePortalActor(): Zeile über lower(email) suchen
    → gefunden und nicht widerrufen: clerk_user_id nachtragen, Status active
    → weiter ins Portal

Portal-Seitenaufruf
  (portal)/layout.tsx → requirePortalAccess(locale)
    → kein userId: Weiterleitung zur Anmeldung
    → keine Zeile oder widerrufen: notFound()
    → liefert { portalUserId, customerId, role }

Portal-API
  withPortalApiAuth(handler)   eigener Wrapper, NICHT withWorkspaceApiAuth
    → übergibt customerId aus der Sitzung an den Handler
```

`proxy.ts` muss die Portal-Anmeldewege als öffentlich kennzeichnen. Wichtig: Die Middleware lässt
`/api/*` grundsätzlich durch — Portal-Endpunkte bringen ihre Prüfung daher immer selbst mit.

## Verzeichnisstruktur

```txt
packages/db/migrations/0029_create_customer_portal_users.sql
packages/db/src/record-configuration/crm/customer-portal-users.ts
packages/common/src/constants/crm/portal-user-statuses.ts

apps/workspace/src/proxy.ts                                  + Portal-Pfade
apps/workspace/src/config/routes.ts                          + PORTAL
apps/workspace/src/server/portal/
  auth/resolve-portal-actor.ts
  auth/require-portal-access.ts
  auth/with-portal-api-auth.ts
apps/workspace/src/app/[locale]/(portal)/
  layout.tsx
  AGENTS.md  CLAUDE.md
  portal/page.tsx                Platzhalter-Bestätigungsseite, ersetzt in Task 21
apps/workspace/src/app/[locale]/(app)/  Weiche nach der Anmeldung

apps/workspace/src/server/workspace/crm/
  command-handler/{invite,revoke}-portal-user.command-handler.ts
  query-handler/list-portal-users.query-handler.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/portal-users/route.ts
apps/workspace/src/app/api/workspace/crm/portal-users/[portalUserId]/route.ts

apps/workspace/src/components/workspace/crm/portal-access/
  portal-access-section/
  invite-portal-user-dialog/
apps/workspace/src/i18n/dictionaries/workspace/crm/portal-access/{de,en}.json
apps/workspace/src/i18n/dictionaries/portal/{shell,meta}/{de,en}.json
```

## Tickets

### CRM-20-T1 — Migration, Modell, Konstanten

- **Files:** `0029_create_customer_portal_users.sql`, `record-configuration/crm/customer-portal-users.ts`,
  `constants/crm/portal-user-statuses.ts` + Test
- **Skills:** `best-practices`
- **Inhalt:** Tabelle wie oben inklusive des globalen Unique-Index auf der E-Mail
- **Akzeptanz:** Migration idempotent; dieselbe Adresse lässt sich nicht zweimal eintragen, auch nicht
  bei unterschiedlicher Schreibweise

### CRM-20-T2 — Portal-Auth-Schicht

- **Files:** `server/portal/auth/**` + Tests, `proxy.ts`, `(portal)/layout.tsx`,
  `(portal)/AGENTS.md`, `CLAUDE.md`, Root-`AGENTS.md`
- **Skills:** `best-practices`
- **Inhalt:**
  - `resolvePortalActor`: Zeile über kleingeschriebene E-Mail finden, Kennung beim ersten Mal
    nachtragen, Status auf `active` setzen, `last_seen_at` pflegen
  - `requirePortalAccess`: wie `requireWorkspaceAccess`, aber für die Portal-Welt; widerrufen ergibt
    `notFound()`
  - `withPortalApiAuth`: übergibt dem Handler ausschließlich die Kundenkennung aus der Sitzung
  - `(portal)/AGENTS.md` auf Deutsch, mit der harten Regel: **keine Kundenkennung aus Anfragedaten**,
    keine Wiederverwendung von Workspace-Handlern, keine Zugangsdaten im Portal
- **Akzeptanz:**
  - Test: interner Nutzer erreicht das Portal nicht
  - Test: Portalnutzer erreicht den internen Bereich nicht
  - Test: widerrufener Nutzer wird sofort abgewiesen
  - Test: Der Wrapper reicht keine Kundenkennung aus der Anfrage weiter (Signatur erlaubt es nicht)

### CRM-20-T3 — Einladen und Widerrufen

- **Files:** zwei Command-Handler, ein Query-Handler, zwei Routen + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - Einladen prüft: Adresse nicht intern, nicht bereits vergeben, Kunde existiert
  - Clerk-Einladung über die Backend-API; schlägt sie fehl, wird die Zeile nicht angelegt
  - Mail über `packages/mail`; schlägt der Versand fehl, bleibt die Einladung bestehen und die
    Oberfläche bietet erneutes Senden an
  - Widerrufen setzt den Status und zieht die Clerk-Einladung zurück
- **Akzeptanz:**
  - Tests: interne Adresse wird mit eigener Fehlermeldung abgelehnt; doppelte Einladung ergibt 409;
    fehlgeschlagener Mailversand hinterlässt keine unbrauchbare Zeile
  - Widerruf wirkt sofort auf das Gate

### CRM-20-T4 — Anmelde-Weiche und Platzhalterseite

- **Files:** Weiche nach der Anmeldung, `(portal)/portal/page.tsx`,
  `dictionaries/portal/{shell,meta}/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Nach der Anmeldung entscheidet der Kontotyp das Ziel
  - Portal-Layout schlicht und deutlich vom internen Bereich unterschieden (anderer Kopfbereich,
    keine interne Navigation), Abmelden vorhanden
  - Platzhalterseite: Begrüßung mit Firmenname und Hinweis, dass die Übersicht in Kürze erscheint —
    ausdrücklich als solche gekennzeichnet
  - `robots: noindex`, `force-dynamic` wie im internen Bereich
- **Akzeptanz:**
  - Kunde landet nach dem Login im Portal, interner Nutzer im Dashboard
  - Das Portal zeigt keinerlei interne Navigation
  - Die Platzhalterseite ist als vorläufig erkennbar, kein toter Link

### CRM-20-T5 — Verwaltung im CRM

- **Files:** `components/workspace/crm/portal-access/**`,
  `dictionaries/workspace/crm/portal-access/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Sektion „Portalzugang" im Kundendetail: eingeladene und aktive Nutzer mit Status, letzter
    Anmeldung, Aktionen Erneut einladen und Widerrufen
  - Einladungsdialog mit Auswahl eines vorhandenen Ansprechpartners oder freier Adresse
  - Widerruf mit Bestätigung, die klarstellt, dass der Zugang sofort endet
- **Akzeptanz:**
  - Status ist auf einen Blick erkennbar (Symbol und Text, nicht nur Farbe)
  - Tastaturbedienung vollständig
  - Alle Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion „Portalzugang" im Kundendetail; ein eingeladener Kunde kann sich
   anmelden und sieht eine klar gekennzeichnete Platzhalterseite.
2. **Bricht nichts:** Der interne Gate bleibt unverändert. Die Middleware wird nur um Portal-Pfade
   erweitert, bestehende Regeln bleiben. Das Risiko liegt in der Anmelde-Weiche — sie wird durch
   Tests für beide Kontotypen abgedeckt. Solange niemand eingeladen ist, existiert kein Portalnutzer
   und damit kein neuer Angriffspfad.
3. **Offen:** die eigentlichen Portalinhalte (Task 21). Abgesichert durch die gekennzeichnete
   Platzhalterseite statt einer halbfertigen Übersicht.

## End-to-End-Akzeptanz

1. Ein Ansprechpartner lässt sich zum Portal einladen und erhält eine Mail.
2. Nach der Registrierung landet er im Portal, nicht im internen Bereich.
3. Der interne Bereich ist für ihn nicht erreichbar (404, keine Fehlermeldung mit Hinweis).
4. Ein interner Nutzer erreicht das Portal nicht.
5. Eine interne Adresse lässt sich nicht einladen; die Meldung erklärt warum.
6. Dieselbe Adresse lässt sich nicht zwei Kunden zuordnen.
7. Widerruf sperrt den Zugang sofort, auch bei bereits offener Sitzung (beim nächsten Seitenaufruf).
8. Kein Portal-Endpunkt nimmt eine Kundenkennung aus der Anfrage entgegen.
9. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
