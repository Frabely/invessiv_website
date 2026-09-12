# Task 20 — Portal-Zugang

> **Merge-Einheit:** Ordner 12 · **Branch:** `feat/crm-portal-identitaet`
> **Aufwand:** L · **Abhängigkeiten:** Task 06 (Personen und Zuordnungen), Task 02 (Rechte),
> Task 19 (Mail)
> **Voraussetzung (Konfiguration):** Clerk auf „Restricted" gestellt, DSGVO-Grundlagen geklärt
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

## Context

Der sicherheitskritischste Task des gesamten Plans: Ab hier betreten fremde Personen die Anwendung.
Bisher galt eine einzige Regel — E-Mail in der Allowlist oder kein Zutritt. Jetzt existieren zwei
Zugangswelten in derselben Anwendung und derselben Clerk-Instanz.

Dieser Task baut **nur den Zugang**: Einladung, Einlösung, Mitgliedschaft, Gate, Firmenwechsler,
Widerruf. Die Portalinhalte folgen in Task 21. Nach diesem Task kann sich ein Kunde anmelden und
sieht eine schlichte Bestätigungsseite — mehr nicht, aber das nachweislich sicher.

## Die zentrale Gefahr

Ein Portalnutzer darf unter keinen Umständen Daten eines anderen Kunden sehen. Absicherung auf vier
Ebenen:

1. **Strukturell:** Portal-Handler nehmen **keine** `customerId` aus der Anfrage entgegen. Sie
   beziehen sie aus der Sitzung. Ein manipulierter Parameter kann nichts bewirken, weil kein
   Parameter existiert.
2. **Getrennte Codepfade:** Portal-Handler liegen unter `src/server/portal/`, nie unter
   `src/server/workspace/`. Kein Handler wird von beiden Welten benutzt.
3. **Getrennte Routen:** `(portal)`-Gruppe mit eigenem Gate. Die `(app)`-Allowlist bleibt für den
   internen Bereich unverändert scharf.
4. **Mitgliedschaft statt Identität:** Der aktive Kunde stammt aus der signierten Sitzung und wird
   in **jedem** Handler erneut gegen eine aktive `portal_memberships`-Zeile geprüft. Ein gültiger
   Login allein autorisiert nichts.

## Entscheidungen

| Bereich              | Entscheidung                                                                                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identität            | Dieselbe Clerk-Instanz. Ein Clerk-Konto ist entweder intern oder Portalnutzer — nie beides                                                                |
| Zuordnung            | `portal_memberships` verbindet Clerk-Kennung, `people.id` und `customers.id`. Eine Person darf beliebig vielen Kunden angehören                           |
| Kein E-Mail-Abgleich | Eine Mitgliedschaft entsteht **ausschließlich** durch Einlösen eines Tokens. Nirgends wird eine Clerk-Kennung über eine E-Mail-Adresse zugeordnet         |
| Warum                | Ein E-Mail-Abgleich verknüpft Zugriff mit einem Wert, den ein Identitätsanbieter ändern kann und der bei mehreren Firmen mehrdeutig wird                  |
| Einladung            | `portal_invitations` bindet genau eine `customer_contact_assignment_id`; gespeichert wird nur `token_hash`                                                |
| Token                | Sieben Tage gültig, einmal nutzbar, widerrufbar, niemals in Logs, Mails oder Activities                                                                   |
| Einlösung            | Kein Konto → Sign-up, vorhandenes Konto → Sign-in; anschließend derselbe Redeem-Pfad. Die Mitgliedschaft entsteht gegen die dann authentifizierte Kennung |
| Zweite Firma         | Identisch zur ersten: erneute Einladung, erneutes Einlösen. Keine Direktanlage und keine Auto-Einlösung                                                   |
| Warum                | Der Zugriff auf die Daten einer weiteren Firma entsteht nur durch eine Handlung der Person selbst; die Einwilligung ist damit belegt                      |
| Rollen               | In Version 1 keine differenzierten Portalrollen. Alle Mitglieder einer Firma haben denselben fachlichen Umfang                                            |
| Ausgeschlossen       | Interne Notizen, Audit, Zugangsdaten, Budgets und Stundensätze erreichen das Portal nie — unabhängig von der Mitgliedschaft                               |
| Firmenwechsler       | Bestandteil dieses Tasks. Aktiver Kunde in serverseitig signierter Sitzung, bei jedem Handler gegen die Mitgliedschaft geprüft                            |
| Registrierung        | Clerk auf **invitation-only** („Restricted"). Ohne Einladung entsteht kein Konto                                                                          |
| Warum                | `proxy.ts:6-11` lässt `/sign-up(.*)` öffentlich durch. Ab hier ist das der Kundeneinstieg — offen gelassen könnte jeder Konten anlegen                    |
| Widerruf             | Setzt `revoked_at`; das Gate verweigert sofort. Offene Einladungen derselben Zuordnung werden mitentwertet                                                |
| Historie             | Widerruf löscht nichts. Nachrichten, Activities und Audit-Einträge bleiben vollständig erhalten                                                           |
| Interne Nutzer       | Eine Adresse in `WORKSPACE_ALLOWED_EMAILS` kann nicht eingeladen werden — Prüfung beim Einladen, mit klarer Meldung                                       |
| Portalvorschau       | Vor der **ersten** Einladung eines Kunden bestätigt ein Mitarbeiter eine Vorschau aller sichtbaren Projekte, Aufgaben, Dateien und Stunden                |
| Portal-Route         | `/[locale]/(portal)/portal/**` — eigenes Segment, damit die Zugehörigkeit an der URL ablesbar ist                                                         |
| Weiterleitung        | Nach dem Login entscheidet der Kontotyp das Ziel: intern zum Dashboard, Portalnutzer ins Portal                                                           |
| Sprache              | Portalsprache aus `people.preferred_locale`, nicht aus der Locale des Einladenden                                                                         |
| Kundenmails          | `email_notifications_enabled` wird **beim Einladen** gesetzt und auf die Mitgliedschaft übernommen; danach vom Portalmitglied und intern änderbar         |
| Digest               | Kundenmails höchstens einmal je 12 Stunden je Mitgliedschaft, Anker `customer_notified_at`, Fenster als Konstante                                         |

## Tabellen

```txt
portal_memberships
  id uuid PK
  customer_id uuid NOT NULL   → customers.id ON DELETE CASCADE
  person_id uuid NOT NULL     → people.id ON DELETE RESTRICT
  clerk_user_id text NOT NULL
  activated_at timestamptz NOT NULL
  revoked_at timestamptz NULL
  last_seen_at timestamptz NULL
  email_notifications_enabled boolean NOT NULL DEFAULT true
  customer_notified_at timestamptz NULL      Anker des 12-Stunden-Digests
  version integer NOT NULL DEFAULT 1
  created_at / updated_at
  UNIQUE INDEX portal_memberships_customer_person_uidx ON (customer_id, person_id)
  INDEX (clerk_user_id) WHERE revoked_at IS NULL
  INDEX (customer_id)   WHERE revoked_at IS NULL

portal_invitations
  id uuid PK
  assignment_id uuid NOT NULL → customer_contact_assignments.id ON DELETE CASCADE
  token_hash text NOT NULL UNIQUE        SHA-256, nie der Token selbst
  email_notifications_enabled boolean NOT NULL DEFAULT true   beim Einladen gesetzt
  expires_at timestamptz NOT NULL        Anlage + 7 Tage
  redeemed_at timestamptz NULL
  revoked_at timestamptz NULL
  created_by uuid NOT NULL    → workspace_members.id
  created_at / updated_at
  UNIQUE INDEX portal_invitations_open_uidx ON (assignment_id)
    WHERE redeemed_at IS NULL AND revoked_at IS NULL
  INDEX (expires_at) WHERE redeemed_at IS NULL AND revoked_at IS NULL
```

`clerk_user_id` ist bewusst **nicht** unique: dieselbe Kennung trägt eine Zeile je Firma. Eindeutig
ist das Paar Kunde/Person. Es gibt keine Spalte und keinen Index auf einer E-Mail-Adresse — die
Adresse lebt an `people` beziehungsweise an der Zuordnung und hat mit Autorisierung nichts zu tun.

Der partielle Unique-Index auf `portal_invitations` erlaubt genau eine offene Einladung je
Zuordnung. Erneutes Einladen entwertet die alte und legt eine neue an, statt zwei gültige Tokens
nebeneinander entstehen zu lassen.

## Architektur

```txt
Einladen (intern)
  POST /api/workspace/crm/customers/[id]/portal-invitations
    → withPermission(PortalAccessManage)
    → prüfen: Zuordnung gehört zu diesem Kunden, Adresse nicht in der internen Allowlist,
              keine aktive Mitgliedschaft für dieses Paar, Portalvorschau bestätigt
    → offene Einladung derselben Zuordnung entwerten
    → Token erzeugen, nur token_hash speichern
    → Outbox-Eintrag für die Mail in derselben Transaktion
    → activities (ohne Token)

Einlösen (Kunde)
  GET  /[locale]/portal/einladung/[token]   → Token prüfen, zu Sign-in oder Sign-up leiten
  POST /api/portal/invitations/redeem
    → Clerk-Sitzung erforderlich; ohne Sitzung kein Redeem
    → Token hashen, Zeile laden: offen, nicht abgelaufen, nicht widerrufen
    → portal_memberships anlegen (clerk_user_id aus der Sitzung), redeemed_at setzen
    → aktiven Kunden in die signierte Sitzung schreiben
    → alles in einer Transaktion; Fehler lässt die Einladung offen

Portal-Seitenaufruf
  (portal)/layout.tsx → requirePortalAccess(locale)
    → kein userId: Weiterleitung zur Anmeldung
    → aktiver Kunde aus der Sitzung, gegen aktive Mitgliedschaft geprüft
    → keine Mitgliedschaft oder widerrufen: notFound()
    → genau eine Mitgliedschaft: diese ist der aktive Kunde
    → mehrere und keine Wahl in der Sitzung: Firmenauswahl, kein stiller Default
    → liefert { membershipId, customerId, personId }

Firmenwechsel
  POST /api/portal/active-customer
    → Ziel gegen die aktiven Mitgliedschaften der Sitzung prüfen
    → Sitzung neu signieren, clientseitige Caches verwerfen

Portal-API
  withPortalApiAuth(handler)   eigener Wrapper, NICHT withWorkspaceApiAuth
    → übergibt customerId ausschließlich aus der Sitzung an den Handler
```

`proxy.ts` muss die Portal-Anmeldewege und die Einlösungsroute als öffentlich kennzeichnen. Wichtig:
Die Middleware lässt `/api/*` grundsätzlich durch — Portal-Endpunkte bringen ihre Prüfung daher
immer selbst mit.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_create_portal_memberships.sql
packages/db/src/record-configuration/crm/portal-memberships.ts
packages/db/src/record-configuration/crm/portal-invitations.ts
packages/common/src/contracts/crm/portal-membership.dto.ts
packages/common/src/constants/crm/errors/portal-error-codes.ts

apps/workspace/src/proxy.ts                                  + Portal-Pfade
apps/workspace/src/config/routes.ts                          + PORTAL
apps/workspace/src/server/portal/
  auth/require-portal-access.ts
  auth/with-portal-api-auth.ts
  auth/portal-session.ts                 signierte Sitzung, aktiver Kunde
  command-handler/redeem-portal-invitation.command-handler.ts
  command-handler/switch-active-customer.command-handler.ts
apps/workspace/src/app/[locale]/(portal)/
  layout.tsx
  AGENTS.md  CLAUDE.md
  portal/page.tsx                        Platzhalter-Bestätigungsseite, ersetzt in Task 21
  portal/firma-waehlen/page.tsx          Firmenauswahl und -wechsel
  einladung/[token]/page.tsx
apps/workspace/src/app/api/portal/invitations/redeem/route.ts
apps/workspace/src/app/api/portal/active-customer/route.ts
apps/workspace/src/app/[locale]/(app)/  Weiche nach der Anmeldung

apps/workspace/src/server/workspace/crm/
  command-handler/{invite,revoke}-portal-access.command-handler.ts
  query-handler/list-portal-access.query-handler.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/portal-invitations/route.ts
apps/workspace/src/app/api/workspace/crm/portal-memberships/[membershipId]/route.ts

apps/workspace/src/components/workspace/crm/portal-access/
  portal-access-section/
  invite-portal-user-dialog/
  portal-preview-confirm-dialog/
apps/workspace/src/components/portal/portal-shell/
apps/workspace/src/components/portal/customer-switcher/
apps/workspace/src/i18n/dictionaries/workspace/crm/portal-access/{de,en}.json
apps/workspace/src/i18n/dictionaries/portal/{shell,invitation,meta}/{de,en}.json
```

## Tickets

### CRM-20-T1 — Migration, Modelle, Konstanten

- **Files:** Migration, `record-configuration/crm/portal-memberships.ts`,
  `portal-invitations.ts`, `contracts/crm/portal-membership.dto.ts`,
  `constants/crm/errors/portal-error-codes.ts` + Tests
- **Inhalt:** Tabellen wie oben, additiv und idempotent
- **Akzeptanz:**
  - Migration idempotent; Drizzle-Modell deckungsgleich zu Spalten, Typen und Constraints
  - Dasselbe Paar Kunde/Person lässt sich nicht zweimal anlegen
  - Dieselbe Clerk-Kennung lässt sich bei mehreren Kunden anlegen
  - Zwei offene Einladungen zur selben Zuordnung sind auf DB-Ebene unmöglich
  - Es existiert keine Spalte und kein Index auf einer E-Mail-Adresse

### CRM-20-T2 — Portal-Auth-Schicht

- **Files:** `server/portal/auth/**` + Tests, `proxy.ts`, `(portal)/layout.tsx`,
  `(portal)/AGENTS.md`, `CLAUDE.md`, Root-`AGENTS.md`
- **Inhalt:**
  - `portal-session`: aktiver Kunde serverseitig signiert, Manipulation erkennbar
  - `requirePortalAccess`: lädt die aktiven Mitgliedschaften der Kennung, prüft den aktiven Kunden
    dagegen; keine Mitgliedschaft oder widerrufen ergibt `notFound()`
  - Mehrere Mitgliedschaften ohne Wahl ergeben die Firmenauswahl — nie einen stillen Default
  - `withPortalApiAuth`: übergibt dem Handler ausschließlich die Kundenkennung aus der Sitzung
    - `(portal)/AGENTS.md` auf Deutsch mit den harten Regeln: keine Kundenkennung aus Anfragedaten,
      kein E-Mail-Abgleich, keine Wiederverwendung von Workspace-Handlern, keine Zugangsdaten
- **Akzeptanz:**
  - Test: interner Nutzer erreicht das Portal nicht
  - Test: Portalnutzer erreicht den internen Bereich nicht
  - Test: widerrufene Mitgliedschaft wird sofort abgewiesen
  - Test: Der Wrapper reicht keine Kundenkennung aus der Anfrage weiter (Signatur erlaubt es nicht)
  - Test: manipulierter aktiver Kunde in der Sitzung ergibt 404, nie Zugriff
  - Test: aktiver Kunde ohne passende Mitgliedschaft ergibt 404, auch bei gültigem Login
  - Test: DB-Fehler beim Laden der Mitgliedschaften verweigert Zugriff (fail-closed)

### CRM-20-T3 — Einladen, Vorschau und Widerrufen

- **Files:** zwei Command-Handler, ein Query-Handler, zwei Routen, Vorschau-Dialog + Tests
- **Inhalt:**
  - Einladen prüft: Zuordnung gehört zum Kunden, Adresse nicht intern, keine aktive Mitgliedschaft
    für dieses Paar, Kunde existiert, Portalvorschau für diesen Kunden bestätigt
  - Eine Person mit Zugang bei einem **anderen** Kunden wird normal eingeladen — das ist der
    vorgesehene Mehrfirmenfall und kein Fehler
  - Token kryptografisch zufällig, nur der Hash wird gespeichert; der Klartext verlässt den Server
    ausschließlich über die Mail
  - Mailversand als Outbox-Eintrag in derselben Transaktion wie die Einladung
  - Erneutes Einladen entwertet die offene Einladung und legt eine neue an
  - Widerrufen setzt `revoked_at` an der Mitgliedschaft und entwertet offene Einladungen derselben
    Zuordnung
- **Akzeptanz:**
  - Tests: interne Adresse wird mit eigener Fehlermeldung abgelehnt
  - Test: zweite Einladung bei bestehender aktiver Mitgliedschaft ergibt 409
  - Test: Einladung einer Person, die bei einem anderen Kunden aktiv ist, gelingt
  - Test: Einladen ohne bestätigte Portalvorschau wird abgelehnt
  - Test: Token erscheint in keinem Log, keiner Activity und keiner Fehlermeldung
  - Test: fehlgeschlagener Mailversand hinterlässt eine gültige, erneut sendbare Einladung
  - Widerruf wirkt sofort auf das Gate

### CRM-20-T4 — Einlösung, Anmelde-Weiche, Firmenwechsler

- **Files:** Einlösungsseite und -route, Firmenauswahl, `active-customer`-Route,
  Weiche nach der Anmeldung, `dictionaries/portal/{shell,invitation,meta}/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Einlösung verlangt eine Clerk-Sitzung; ohne Konto führt der Link zu Sign-up, mit Konto zu
    Sign-in, danach derselbe Redeem-Pfad
  - Mitgliedschaft, `redeemed_at` und Sitzung entstehen in einer Transaktion
  - Abgelaufener, widerrufener oder schon eingelöster Token: eigene, verständliche Meldung ohne
    Hinweis darauf, ob der Token je existierte
  - Firmenwechsler prüft das Ziel gegen die Mitgliedschaften der Sitzung und verwirft Caches
  - Portal-Layout deutlich vom internen Bereich unterschieden, Abmelden vorhanden
  - `robots: noindex/nofollow/nocache`, `export const dynamic = "force-dynamic"`
- **Akzeptanz:**
  - Person ohne Konto und Person mit Konto erreichen über denselben Link ihre Mitgliedschaft
  - Ein zweites Einlösen desselben Tokens schlägt fehl und erzeugt keine zweite Mitgliedschaft
  - Parallele Einlösung desselben Tokens erzeugt genau eine Mitgliedschaft
  - Eine Person mit zwei Firmen wechselt, ohne Daten der vorherigen Firma zu sehen
  - Wechsel auf einen Kunden ohne Mitgliedschaft ergibt 404
  - Portal zeigt keinerlei interne Navigation; die Platzhalterseite ist als vorläufig erkennbar
  - **Clerk steht auf „Restricted"**: `/sign-up` ohne Einladung erzeugt kein Konto. Im PR als
    erledigt bestätigt — Konfiguration, nicht Code

### CRM-20-T5 — Verwaltung im CRM

- **Files:** `components/workspace/crm/portal-access/**`,
  `dictionaries/workspace/crm/portal-access/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Sektion „Portalzugang" im Kundendetail: offene Einladungen und aktive Mitgliedschaften mit
    Status, letzter Anmeldung, Aktionen Erneut einladen und Widerrufen
  - Einladungsdialog wählt eine **vorhandene** Zuordnung; keine freie Adresseingabe
  - Im Einladungsdialog wird `email_notifications_enabled` gesetzt (Vorgabe aktiv), mit erklärendem
    Text, dass es um gebündelte Hinweise höchstens alle 12 Stunden geht
  - Der Schalter ist an einer bestehenden Mitgliedschaft auch nachträglich intern änderbar
  - Vorschau-Dialog listet alles, was diese Firma sehen würde, und verlangt eine Bestätigung
  - Widerruf mit Bestätigung, die klarstellt, dass der Zugang sofort endet und die Historie bleibt
  - Mitgliedschaften anderer Firmen derselben Person werden nicht angezeigt
- **Akzeptanz:**
  - Status auf einen Blick erkennbar (Symbol und Text, nicht nur Farbe)
  - Empty-State erklärt, wofür der Portalzugang gedacht ist
  - Tastaturbedienung vollständig, Fokus kehrt auf den Auslöser zurück
  - Alle Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** Sektion „Portalzugang" im Kundendetail; ein eingeladener Kunde kann einlösen,
   sich anmelden, zwischen Firmen wechseln und sieht eine gekennzeichnete Platzhalterseite.
2. **Bricht nichts:** Der interne Gate bleibt unverändert. Die Middleware wird nur um Portal- und
   Einlösungspfade erweitert. Solange niemand eingeladen ist, existiert keine Mitgliedschaft und
   damit kein neuer Angriffspfad. Das Risiko liegt in der Anmelde-Weiche — abgedeckt durch Tests
   für beide Kontotypen.
3. **Offen:** die eigentlichen Portalinhalte (Task 21). Abgesichert durch die gekennzeichnete
   Platzhalterseite statt einer halbfertigen Übersicht.

## End-to-End-Akzeptanz

1. Eine Zuordnung lässt sich einladen; die Person erhält eine Mail mit Einmal-Link.
2. Ohne Einlösen entsteht keine Mitgliedschaft und kein Zugriff.
3. Nach dem Einlösen landet die Person im Portal, nicht im internen Bereich.
4. Der interne Bereich ist für sie nicht erreichbar (404, keine Existenzbestätigung).
5. Ein interner Nutzer erreicht das Portal nicht und lässt sich nicht einladen.
6. Dieselbe Person bedient nach zwei Einladungen zwei Firmen und wechselt sicher zwischen ihnen.
7. Kunde A sieht unter keinem Sitzungszustand Daten von Kunde B.
8. Widerruf bei Firma A beendet dort den Zugang sofort und lässt Firma B unberührt.
9. Abgelaufener und bereits eingelöster Token führen zu je eigener Meldung, nie zu Zugriff.
10. In Logs, Activities und Mails steht kein Token-Klartext.
