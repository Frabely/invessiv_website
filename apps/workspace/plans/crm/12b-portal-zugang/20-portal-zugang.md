# Task 20 — Portal-Zugang

> **Merge-Einheit:** Ordner 12b · **Branch:** `feat/crm-portal-zugang`
> **Aufwand:** L · **Abhängigkeiten:** Task 49 (Portal-Fundament), Task 06 (Personen und Zuordnungen),
> Task 02c (Rollenverwaltung)
> **Voraussetzung (Konfiguration):** Clerk auf „Restricted“ gestellt, DSGVO-Grundlagen geklärt
> **Migration:** keine neue Tabelle; Tabellen, Permissions und Systemrolle stammen aus Task 49

## Context

Der sicherheitskritischste Task des gesamten Plans: Ab hier betreten fremde Personen die Anwendung. Das Fundament —
Tabellen, `PortalActor`, Gates, Zugriffshelfer, Shell und Flag — steht mit Task 49. Dieser Task macht es nutzbar:
**Einladung, Einlösung, Firmenwechsel, Widerruf und Rollenpflege je Kontakt**, dazu die Verwaltung im CRM und in den
Einstellungen. Nach diesem Task kann sich ein Kunde anmelden und sieht eine schlichte Portalseite — mehr nicht, aber
das nachweislich sicher. Die Portalinhalte folgen ab Task 21.

## Die zentrale Gefahr

Ein Portalnutzer darf unter keinen Umständen Daten eines anderen Kunden sehen und nie mehr, als seine Rollen
erlauben. Absicherung auf vier Ebenen, alle aus Task 49:

1. **Strukturell:** Kein Portal-Handler bekommt eine `customerId`, sondern einen `PortalActor`, der ohne
   Datenbankprüfung nicht konstruierbar ist.
2. **Getrennte Codepfade:** Portal-Handler unter `src/server/portal/`, nie unter `src/server/workspace/`.
3. **Getrennte Routen und Realms:** `(portal)`-Gruppe mit eigenem Gate; Portalrollen nur im Realm `portal`.
4. **Mitgliedschaft statt Identität:** Ein gültiger Login autorisiert nichts; jede Anfrage löst neu auf.

## Entscheidungen

| Bereich          | Entscheidung                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Einladung        | Bindet genau eine `customer_contact_assignment_id` und die gewählten Portalrollen (`portal_invitation_roles`); gespeichert wird nur `token_hash`          |
| Zustellung       | **Kein Mailversand in diesem Task.** Der Link wird genau einmal in der Antwort des Einladens ausgeliefert und im Dialog kopierbar angezeigt               |
| Warum            | Mail-Package und Outbox entstehen erst in Ordner 20c. Ein direkter Versand ohne Outbox würde die Transaktionsregel brechen                                |
| Nach 20c         | 20c ergänzt den Outbox-Versand der Einladungsmail in derselben Transaktion; die Kopierfunktion bleibt als Rückfall                                        |
| Token            | Kryptografisch zufällig, SHA-256-Hash gespeichert, sieben Tage gültig, einmal nutzbar, widerrufbar, niemals in Logs, Activities oder Security-Events      |
| Einlösung        | Kein Konto → Sign-up, vorhandenes Konto → Sign-in; anschließend derselbe Redeem-Pfad gegen die dann authentifizierte Kennung                              |
| Zweite Firma     | Identisch zur ersten: eigene Einladung, eigenes Einlösen. Keine Direktanlage, keine Auto-Einlösung                                                        |
| Rollen           | Je Mitgliedschaft; Vorgabe `portal_standard`; mindestens eine Rolle Pflicht. Kontakte derselben Firma dürfen verschiedene Rollen haben                    |
| Rollenverwaltung | Portalrollen in den Einstellungen, Tab „Rollen“, Umschalter Mitarbeiter/Portal. Bestehende Rollendialoge, Permission-Auswahl gefiltert auf Realm `portal` |
| Rechte intern    | Einladen, Widerrufen, Rollen je Kontakt: `portal.manage` (an den Kunden bindbar). Portalrollen definieren: `roles.manage`                                 |
| Kunde            | Verwaltet in Version 1 nichts selbst                                                                                                                      |
| Ausgeschlossen   | Interne Notizen, Audit, Zugangsdaten, Budgets, Stundensätze und Preise erreichen das Portal nie — unabhängig von Rollen                                   |
| Widerruf         | Setzt `revoked_at`; offene Einladungen derselben Zuordnung werden mitentwertet; Historie bleibt                                                           |
| Interne Nutzer   | Dürfen eingeladen werden; erreichen das Portal nur über eine eigene eingelöste Einladung. Eine interne Membership gewährt nie Portalzugriff und umgekehrt |
| Portalvorschau   | Vor der **ersten** Einladung eines Kunden bestätigt ein Mitarbeiter, welche Bereiche die gewählten Rollen freischalten (siehe unten)                      |
| Sprache          | Portalsprache aus `people.preferred_locale`; die Einlöseseite nutzt die Locale des Links                                                                  |
| Kundenmails      | `email_notifications_enabled` wird beim Einladen gesetzt und übernommen; wirksam erst mit Ordner 20c                                                      |
| Flag             | `FeatureFlag.Portal` wird mit dem Merge dieses Ordners eingeschaltet                                                                                      |

## Portalvorschau

Die Vorschau zeigt vor der ersten Einladung eines Kunden:

- die Kontakte, die Zugang erhalten sollen, und ihre gewählten Rollen,
- je Rolle die freigeschalteten Portalbereiche (aus `PORTAL_NAV_ITEMS` und den Permissions abgeleitet),
- einen Hinweis, dass Preise, Budgets, interne Notizen und Zugangsdaten nie sichtbar sind.

Jeder spätere Portal-Ordner erweitert die Vorschau um echte Daten seines Moduls — über **dieselben** Portal-Query-
Handler und DTOs wie das Portal selbst, aufgerufen mit einem internen Vorschau-Kontext, der nur über
`portal.manage` für genau diesen Kunden entsteht und nie in einen `PortalActor` umgewandelt werden kann. Die
Bestätigung wird je Kunde gespeichert (`customers.portal_preview_confirmed_at`, `…_by_member_id`, additiv in diesem
Task).

## Architektur

```txt
Einladen (intern)
  POST /api/workspace/crm/customers/[id]/portal-invitations
    → withCrmPermission(Permission.PortalAccessManage → `portal.manage`), Kunde im Zugriffsbereich
    → prüfen: Zuordnung gehört zum Kunden, keine aktive Mitgliedschaft für das Paar,
              Portalvorschau bestätigt, Rollen existieren, aktiv und Realm portal
    → offene Einladung derselben Zuordnung entwerten
    → Token erzeugen, token_hash + Rollen speichern, Security-Event (ohne Token)
    → Antwort { invitation, inviteUrl }  — einziger Ort, an dem der Klartext existiert

Einlösen (Kunde)
  GET  /[locale]/portal/invite/[token]  → Token prüfen, zu Sign-in oder Sign-up leiten (redirect_url zurück)
  POST /api/portal/invitations/redeem   → Clerk-Sitzung Pflicht
    → Token hashen, Zeile FOR UPDATE: offen, nicht abgelaufen, nicht widerrufen
    → users über clerk_user_id auflösen oder kontrolliert anlegen (Stammdaten aus Clerk)
    → portal_memberships + portal_membership_roles aus portal_invitation_roles, redeemed_at setzen
    → alles in einer Transaktion; Fehler lässt die Einladung offen
    → Redirect auf portalPathFor(locale, customerId)

Verwalten (intern)
  GET    /api/workspace/crm/customers/[id]/portal-access          Einladungen + Mitgliedschaften
  PUT    /api/workspace/crm/portal-memberships/[id]/roles          versioniert, Security-Event
  PATCH  /api/workspace/crm/portal-memberships/[id]                email_notifications_enabled, versioniert
  DELETE /api/workspace/crm/portal-memberships/[id]                Widerruf
  DELETE /api/workspace/crm/portal-invitations/[id]                Einladung entwerten
  POST   /api/workspace/crm/customers/[id]/portal-preview          Bestätigung speichern
```

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_add_customer_portal_preview.sql
packages/common/src/contracts/crm/portal-access.dto.ts
packages/common/src/contracts/crm/portal-invitation.dto.ts

apps/workspace/src/server/portal/command-handler/redeem-portal-invitation.command-handler.ts
apps/workspace/src/app/[locale]/(portal)/portal/invite/[token]/page.tsx
apps/workspace/src/app/api/portal/invitations/redeem/route.ts

apps/workspace/src/server/workspace/crm/
  command-handler/invite-portal-contact.command-handler.ts
  command-handler/revoke-portal-invitation.command-handler.ts
  command-handler/revoke-portal-membership.command-handler.ts
  command-handler/replace-portal-membership-roles.command-handler.ts
  command-handler/update-portal-membership.command-handler.ts
  command-handler/confirm-portal-preview.command-handler.ts
  query-handler/list-portal-access.query-handler.ts
  services/portal-invitation-token-service.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/portal-invitations/route.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/portal-access/route.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/portal-preview/route.ts
apps/workspace/src/app/api/workspace/crm/portal-memberships/[id]/route.ts
apps/workspace/src/app/api/workspace/crm/portal-memberships/[id]/roles/route.ts
apps/workspace/src/app/api/workspace/crm/portal-invitations/[id]/route.ts

apps/workspace/src/components/workspace/crm/portal-access/
  portal-access-section/
  invite-portal-contact-dialog/        inkl. Einmal-Link mit Kopieren
  portal-membership-roles-dialog/
  portal-preview-confirm-dialog/
apps/workspace/src/components/workspace/settings/roles/**   Realm-Umschalter
apps/workspace/src/i18n/dictionaries/workspace/crm/portal-access/{de,en}.json
apps/workspace/src/i18n/dictionaries/portal/invitation/{de,en}.json
```

## Tickets

### CRM-20-T1 — Einladen, Widerrufen, Vorschau

- **Inhalt:** Einladungs-, Widerrufs- und Vorschau-Handler samt Routen; Token-Service; Vorschau-Spalten.
- **Akzeptanz:**
  - Bestehender interner User kann eine unabhängige Portalmitgliedschaft erhalten
  - Zweite Einladung bei aktiver Mitgliedschaft für das Paar → 409
  - Einladung einer Person, die bei einem anderen Kunden aktiv ist, gelingt
  - Einladen ohne bestätigte Vorschau → abgelehnt
  - Einladen mit Workspace-Rolle, inaktiver oder fremder Rolle → abgelehnt
  - `portal.manage` gebunden an Kunde A erlaubt kein Einladen bei Kunde B
  - Token erscheint in keinem Log, keiner Activity, keinem Security-Event und keiner Fehlermeldung; der Klartext steht
    genau einmal in der Einladungsantwort
  - Erneutes Einladen entwertet die offene Einladung und liefert einen neuen Link

### CRM-20-T2 — Einlösung

- **Skills:** `frontend-design`, `copywriting`
- **Inhalt:** Einlöseseite, Redeem-Route und -Handler.
- **Akzeptanz:**
  - Person ohne Konto und Person mit Konto erreichen über denselben Link ihre Mitgliedschaft
  - Mitgliedschaft trägt exakt die gewählten Rollen
  - Zweites Einlösen schlägt fehl; paralleles Einlösen erzeugt genau eine Mitgliedschaft
  - Abgelaufen, widerrufen, bereits eingelöst: verständliche Meldung ohne Hinweis, ob der Token je existierte
  - Nach dem Einlösen landet die Person im Portal, nicht im internen Bereich

### CRM-20-T3 — Rollenpflege je Kontakt

- **Inhalt:** Rollen einer Mitgliedschaft ersetzen, Mailschalter ändern, jeweils versioniert.
- **Akzeptanz:**
  - Rollenänderung wirkt beim nächsten Request: Navigation und Endpunkte folgen den neuen Permissions
  - Leere Rollenliste → abgelehnt; Widerruf bleibt der einzige Weg, den Zugang zu beenden
  - Versionskonflikt → 409 mit `VersionConflictDto`

### CRM-20-T4 — Verwaltung im CRM und in den Einstellungen

- **Skills:** `frontend-design`, `copywriting`
- **Inhalt:**
  - Sektion „Portalzugang“ in der Kundenakte: offene Einladungen und Mitgliedschaften mit Status, Rollen, letzter
    Anmeldung; Aktionen Einladen, Erneut einladen, Rollen ändern, Mailschalter, Widerrufen
  - Einladungsdialog: vorhandene Zuordnung wählen (keine freie Adresseingabe), Rollen wählen (Vorgabe
    `portal_standard`), Mailschalter mit Hinweis auf gebündelte Mails ab Ordner 20c; danach Einmal-Link mit
    Kopieren und deutlichem Hinweis, dass er nur jetzt sichtbar ist
  - Vorschau-Dialog vor der ersten Einladung
  - Einstellungen → Rollen: Umschalter Mitarbeiter/Portal; Portalrollen anlegen und bearbeiten
  - Widerruf mit Bestätigung: Zugang endet sofort, Historie bleibt
  - Mitgliedschaften anderer Firmen derselben Person werden nicht angezeigt
- **Akzeptanz:**
  - Status mit Symbol und Text, nicht nur Farbe
  - Empty-State erklärt, wofür der Portalzugang gedacht ist
  - Aktionen erscheinen nur mit `portal.manage` für diesen Kunden; kein deaktivierter Platzhalter
  - Tastaturbedienung vollständig, Fokus kehrt auf den Auslöser zurück
  - Alle Texte in DE und EN

## Deploy-Sicherheit

1. **Live sichtbar:** Sektion „Portalzugang“, Portalrollen in den Einstellungen; ein eingeladener Kunde kann einlösen,
   sich anmelden, zwischen Firmen wechseln und sieht die schlichte Portalseite.
2. **Bricht nichts:** Interner Gate unverändert. Solange niemand eingeladen ist, existiert keine Mitgliedschaft.
3. **Offen:** Portalinhalte ab Ordner 13; Einladungsmail in Ordner 20c.

## End-to-End-Akzeptanz

1. Eine Zuordnung lässt sich mit Rollen einladen; der Mitarbeiter erhält einen Einmal-Link.
2. Ohne Einlösen entsteht keine Mitgliedschaft und kein Zugriff.
3. Nach dem Einlösen landet die Person im Portal, nicht im internen Bereich.
4. Der interne Bereich ist für sie nicht erreichbar (404, keine Existenzbestätigung).
5. Ein interner Nutzer erreicht das Portal nicht ohne eigene eingelöste Einladung.
6. Dieselbe Person bedient nach zwei Einladungen zwei Firmen, wechselt per Link und nutzt beide in zwei Tabs.
7. Zwei Kontakte derselben Firma mit verschiedenen Rollen sehen unterschiedliche Bereiche.
8. Kunde A sieht unter keiner URL Daten von Kunde B — eine fremde `customerId` im Pfad ergibt 404.
9. Widerruf bei Firma A beendet dort den Zugang sofort und lässt Firma B unberührt.
10. Abgelaufener und bereits eingelöster Token führen zu je eigener Meldung, nie zu Zugriff.
11. In Logs, Activities und Security-Events steht kein Token-Klartext.
