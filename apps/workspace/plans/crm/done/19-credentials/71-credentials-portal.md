# Task 71 — Credentials im Portal

> **Merge-Einheit:** Ordner 19, PR 19.2 · **Branch:** `feat/crm-credentials-2-portal`
> **Aufwand:** L · **Abhängigkeiten:** PR 19.1 gemergt (Task 17 und 18)
> **Migration:** eine; Nummer im Repository ermitteln (höchste bestehende plus eins)
> **Zuerst lesen:** [README](./README.md), [Task 18](./18-credentials-ui.md), `apps/workspace/src/server/portal/AGENTS.md`,
> `apps/workspace/src/app/[locale]/(portal)/AGENTS.md`, `apps/workspace/src/components/portal/AGENTS.md`

- Intern lässt sich ein Zugang für das Portal freigeben.
- Kontakte mit der Rolle `portal_credentials` sehen freigegebene Zugänge, legen eigene an, ändern und decken sie auf.
- Kein Portalpfad erreicht einen nicht freigegebenen Eintrag.

## Context

Bisher schickt der Kunde Zugänge per Mail oder Chat, und ein geändertes Passwort erfahren wir erst, wenn ein Login
scheitert. Mit diesem Task hinterlegt und pflegt der Kunde seine Zugänge selbst. Das hebt die frühere Regel „niemals
Portalzugriff“ bewusst auf (Entscheidung des Owners, 06.10.2026). Das verbleibende Risiko steht in der README,
Abschnitt „Risiken“.

**Vorlage ist wieder das Dateien-Modul**, diesmal seine Portal-Hälfte:
`apps/workspace/src/server/portal/services/files/portal-file-service.ts`, die Routen unter
`apps/workspace/src/app/api/portal/[customerId]/files/`, die Seite
`apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/files/page.tsx` und das Widget
`apps/workspace/src/components/portal/dashboard/widgets/portal-files-widget/`.

> **Änderung 07.10.2026 (Owner):** Es gibt **keine eigene Portal-Seite** für Zugangsdaten. Das Widget öffnet einen
> Dialog im Dashboard (`?widget=credentials`), wie die Sektion im CRM-Cockpit; „Zugang hinterlegen“ öffnet direkt
> das geteilte Formular. Das ersetzt unten die Zeile „Einstieg“, die Seite samt `PortalSection.Credentials` im
> Abschnitt „Portal-Oberfläche“ und den Widget-Eintrag (`openMode: Dialog`). Die Liste wird erst beim Öffnen über
> `GET /api/portal/[customerId]/credentials` geladen; das Dashboard bekommt nur Zahl, `canWrite` und `configured`
> (`getPortalCredentialsSummary` statt `countPortalCredentials`).

## Entscheidungen

| Bereich           | Entscheidung                                                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permissions       | `portal.credentials.read`, `portal.credentials.reveal`, `portal.credentials.write` — Realm `portal`, `delegable: true`, `scopeAssignable: false`                                             |
| Systemrolle       | `portal_credentials` mit genau diesen drei Permissions. Zuweisung je Mitgliedschaft über die bestehende Rollenpflege im Cockpit (Sektion Portalzugang, Recht `portal.manage`); keine neue UI |
| `portal_standard` | Enthält die drei Permissions **nicht**. Heute leitet sich die Rolle aus allen Portal-Permissions ab; künftig abzüglich einer benannten Ausschlussliste                                       |
| Owner-Portalsicht | `PORTAL_READ_PERMISSION_VALUES` bekommt nur `portal.credentials.read`. Aufdecken und Schreiben sind typseitig ausgeschlossen, weil ihre Routen `withPortalActor` verlangen                   |
| Sichtbarkeit      | Genau eine Definition „Eintrag im Portal sichtbar“ (`portalCredentialService.visibleCondition`): gleicher Kunde, `visible_to_customer`, und kundenweit oder Projekt im Portal sichtbar       |
| Freigabe          | Intern mit `credentials.write`, eigener versionierter Befehl mit Bestätigungsdialog. Rücknahme jederzeit bei internen Einträgen                                                              |
| Kundeneintrag     | `created_by_side = customer`, `created_by_portal_membership_id`, immer `visible_to_customer = true` (DB-CHECK). Die Freigabe eines Kundeneintrags lässt sich deshalb nicht zurücknehmen      |
| Ändern im Portal  | Titel, Typ, URL, Benutzername, Geheimnis, Notiz jedes sichtbaren Eintrags. Nicht: Projektzuordnung, Freigabe, Löschen                                                                        |
| Projektwahl       | Beim Anlegen optional ein im Portal sichtbares Projekt des Kunden, sonst kundenweit („Allgemein“)                                                                                            |
| Aufdecken         | Wie intern: ein Feld je Anfrage, `no-store`, Event `credential_revealed` mit Customer-Actor. Limit 10 je 60 Sekunden und Kontakt                                                             |
| Fehlgriffe        | Fremder Kunde, geratene ID, nicht freigegeben, fehlendes Recht: immer `not_found` (404), ununterscheidbar                                                                                    |
| Obergrenze        | Höchstens 100 Einträge je Kunde über das Portal anlegbar (gezählt werden alle Einträge des Kunden); darüber `validation`                                                                     |
| Benachrichtigung  | Legt der Kunde einen Zugang an oder ersetzt ein Geheimnis, entsteht eine Chat-Systemnachricht über `announceSystemMessage` — ohne Titel und ohne Wert. Aufdecken erzeugt keine Nachricht     |
| Einstieg          | Die Portal-Shell hat keine Navigationsleiste; Module hängen als Widget im Dashboard. Neues Widget „Zugangsdaten“ mit Link auf die Seite `/portal/[customerId]/credentials`                   |
| Ansprache         | DE-Texte im Portal in Du-Form, freundlich, ohne Fachjargon                                                                                                                                   |

## Katalog (CRM-71-T1)

```txt
packages/common/src/constants/auth/permissions.ts             + PortalCredentialsRead "portal.credentials.read",
                                                                PortalCredentialsReveal "portal.credentials.reveal",
                                                                PortalCredentialsWrite "portal.credentials.write"
                                                                (im Objekt und in PERMISSION_VALUES, hinter den
                                                                PortalOnboarding-Einträgen)
packages/common/src/constants/auth/permission-definitions.ts  + drei Einträge; neue Konstante
                                                                PORTAL_STANDARD_EXCLUDED_PERMISSION_VALUES;
                                                                PORTAL_READ_PERMISSION_VALUES + PortalCredentialsRead
packages/common/src/constants/auth/system-role-keys.ts        + PortalCredentials: "portal_credentials"
packages/common/src/constants/auth/system-role-definitions.ts + Rolle; portal_standard filtert die Ausschlussliste
packages/common/src/constants/auth/*.test.ts                  angepasst (siehe Akzeptanz)
packages/db/migrations/<nr>_add_portal_credentials_access.sql
apps/workspace/src/i18n/dictionaries/workspace/settings/permissions/{de,en}.json
                                                              + Texte der drei Permissions und der Rolle
apps/workspace/src/common/constants/access/permission-groups.ts   + die drei Permissions in die Portal-Gruppe
```

Rollendefinition:

```ts
[SystemRoleKey.PortalStandard]: {
  // …
  // Derived, minus the permissions that are only ever granted on purpose (customer credentials).
  permissions: PORTAL_PERMISSION_VALUES.filter(
    (permission) => !PORTAL_STANDARD_EXCLUDED_PERMISSION_VALUES.includes(permission),
  ),
},
[SystemRoleKey.PortalCredentials]: {
  id: "7d0c2a52-3f4b-4c3e-9a51-0b6f1e2d7a05",
  realm: AuthRealm.Portal,
  name: "Portal credentials",
  permissions: [
    Permission.PortalCredentialsRead,
    Permission.PortalCredentialsReveal,
    Permission.PortalCredentialsWrite,
  ],
},
```

Die Migration (Muster `0038_create_portal_foundation.sql` und die Katalog-Inserts in
`0024_create_users_roles_and_permissions.sql`):

1. `INSERT INTO permissions (key, realm, delegable, description)` für die drei Keys, `ON CONFLICT (key) DO NOTHING`.
   Spaltenliste und Scope-Spalten vorher an der jüngsten Migration ablesen, die Portal-Permissions einfügt.
2. `roles_system_key_check` erweitern: `DROP CONSTRAINT IF EXISTS`, dann `ADD CONSTRAINT` mit `workspace_owner`,
   `workspace_member`, `workspace_credentials_manager`, `portal_standard`, `portal_credentials`.
3. `INSERT INTO roles (id, realm, system_key, name, description, is_system, active, scope_assignable, version)` mit
   der festen ID oben, `'portal'`, `'portal_credentials'`, `'Portal credentials'`, `NULL, TRUE, TRUE, FALSE, 1`,
   `ON CONFLICT (id) DO NOTHING`.
4. `INSERT INTO role_permissions` für die drei Paare, `ON CONFLICT (role_id, permission_key) DO NOTHING`.
5. Die Owner-Rolle bekommt nichts (falscher Realm), `portal_standard` bekommt nichts.

`db:smoke:rbac` und `packages/db/scripts/rbac-catalog-check.ts` vergleichen Code und Datenbank; sie müssen ohne
Sonderfall grün sein. Falls der Check `portal_standard` bisher als „alle Portal-Permissions“ erwartet, liest er
künftig die Rollendefinition aus dem Code.

- **Akzeptanz:**
  - `system-role-definitions.test.ts`: `portal_standard` enthält keine `portal.credentials.*`; `portal_credentials`
    enthält genau die drei
  - `permissions.test.ts`: `PORTAL_READ_PERMISSION_VALUES` enthält `.read`, weder `.reveal` noch `.write`
  - `pnpm --filter @invessiv/db db:smoke:rbac` grün
  - Die neue Rolle erscheint in der Rollenauswahl je Portalkontakt im Cockpit und ist zuweisbar
  - Bestehende Tests und Fixtures, die `portal_standard` als „alles“ annehmen, sind geprüft
    (`apps/workspace/src/server/tests/support/portal-membership-fixture.ts`, `packages/db/scripts/seed-crm-fixture.ts`)

## Freigabe im CRM (CRM-71-T2)

```txt
PATCH /api/workspace/crm/credentials/[credentialId]/portal-visibility   CredentialPortalVisibility
                                                                        credentials.write · scope project

packages/common/src/contracts/credentials/set-credential-portal-visibility-request.dto.ts
                                                  { version: number; visibleToCustomer: boolean }
packages/common/src/constants/credentials/credential-api-error-code.ts
                                                  + CustomerOwned "customer_owned", ProjectHidden "project_hidden"
apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts   + Regel
apps/workspace/src/app/api/workspace/crm/credentials/[credentialId]/portal-visibility/route.ts
apps/workspace/src/server/workspace/crm/command-handler/set-credential-portal-visibility.command-handler.ts
apps/workspace/src/server/shared/services/credential/credential-portal-project-service.ts
                                                  isProjectPortalVisible(tx, projectId): Status in
                                                  PORTAL_VISIBLE_PROJECT_STATUS_VALUES
apps/workspace/src/components/workspace/crm/credentials/credential-portal-visibility-dialog/
apps/workspace/src/components/workspace/crm/credentials/credential-row/      + Badges und Aktion
apps/workspace/src/i18n/dictionaries/workspace/crm/credentials/{de,en}.json  + Texte
```

Ablauf des Befehls: `credentialAccessService.lock(tx, id, actor, Permission.CredentialsWrite)` (sonst `not_found`) →
Versionsvergleich (409) → Rücknahme bei `created_by_side = customer` → `customer_owned` (409) → Freigeben eines
Projekteintrags, dessen Projekt im Portal nicht sichtbar ist → `project_hidden` (409), statt still wirkungslos zu sein
→ `updateVersioned` → Event `credential_portal_visibility_changed` mit `visible`.

UI: In `credential-row` ein Badge „Im Portal sichtbar“ und bei Kundeneinträgen „Vom Kunden“. Die Aktion
„Für Portal freigeben“ bzw. „Freigabe zurücknehmen“ öffnet den Dialog. Er nennt ausdrücklich, dass Benutzername,
Passwort **und Notiz** für Kontakte mit dem Zugangsdaten-Recht lesbar werden. Bei Kundeneinträgen fehlt die Aktion.

- **Akzeptanz:** Tests für beide Richtungen, Versionskonflikt, `customer_owned`, `project_hidden`, fremden Kunden
  (404) und fehlendes Schreibrecht (403 vom Gate bzw. 404 im Scope); genau ein Event je Änderung

## Portal-Server (CRM-71-T3 und T4)

```txt
GET    /api/portal/[customerId]/credentials                            withPortalReader · portal.credentials.read
POST   /api/portal/[customerId]/credentials                            withPortalActor  · portal.credentials.write
PATCH  /api/portal/[customerId]/credentials/[credentialId]             withPortalActor  · portal.credentials.write
POST   /api/portal/[customerId]/credentials/[credentialId]/reveal      withPortalActor  · portal.credentials.reveal
```

```txt
packages/common/src/contracts/portal/
  portal-credential.dto.ts                    siehe unten
  portal-credential-capabilities.dto.ts       { canWrite: boolean; canReveal: boolean }
  portal-credential-list.dto.ts               { credentials: PortalCredentialDto[];
                                                projects: PortalCredentialProjectOptionDto[];
                                                capabilities: PortalCredentialCapabilitiesDto;
                                                configured: boolean }
  portal-credential-project-option.dto.ts     { id: string; title: string }
  create-portal-credential-request.dto.ts     { projectId: string | null; title; credentialType; url; username;
                                                secret; note }
  update-portal-credential-request.dto.ts     { version; title?; credentialType?; url?; username?; secret?; note? }
packages/common/src/constants/credentials/credential-limits.ts   + revealsPerWindowPortal: 10,
                                                                   maxPortalCreatedPerCustomer: 100
packages/common/src/constants/crm/system-message-keys.ts         + CredentialAddedByCustomer,
                                                                   CredentialSecretChangedByCustomer
apps/workspace/src/i18n/dictionaries/workspace/crm/messages/{de,en}.json  + Texte der beiden Systemnachrichten
apps/workspace/src/i18n/dictionaries/portal/messages/{de,en}.json         + dieselben Schlüssel in Du-Form

apps/workspace/src/common/constants/portal/portal-sections.ts    + Credentials: "credentials" (Objekt und _VALUES)
apps/workspace/src/app/api/portal/[customerId]/credentials/route.ts
apps/workspace/src/app/api/portal/[customerId]/credentials/[credentialId]/route.ts
apps/workspace/src/app/api/portal/[customerId]/credentials/[credentialId]/reveal/route.ts
apps/workspace/src/server/portal/
  query-handler/list-portal-credentials.query-handler.ts
  query-handler/count-portal-credentials.query-handler.ts        für das Widget
  command-handler/create-portal-credential.command-handler.ts
  command-handler/update-portal-credential.command-handler.ts
  command-handler/reveal-portal-credential.command-handler.ts
  services/credentials/
    portal-credential-service.ts          visibleCondition, lockVisible, targetExists, can
    portal-credential-mapping-service.ts  + Test
    portal-credential-schemas.ts
apps/workspace/src/server/tests/portal/credentials/portal-credentials.integration.test.ts
apps/workspace/src/server/tests/portal/api/…                     Routen-Tests nach bestehendem Muster
apps/workspace/package.json                                      + src/server/tests/portal/credentials in db:smoke:crm
```

```ts
// packages/common/src/contracts/portal/portal-credential.dto.ts — every field gets a docstring
export interface PortalCredentialDto {
  id: string;
  projectId: string | null;
  title: string;
  credentialType: CredentialType;
  url: string | null;
  username: string | null;
  hasNote: boolean;
  createdByCustomer: boolean; // side only; never a member id or membership id
  secretChangedAt: string;
  version: number;
}
```

Bewusst nicht im Portal-DTO: `lastRevealedAt`, `visibleToCustomer`, `customerId`, interne IDs.

**`portalCredentialService`** (nach `portal-file-service.ts`):

```ts
function visibleCondition(reader: PortalReader, permission: Permission): SQL {
  return and(
    portalAccessCondition.forReader(reader, permission, {
      customerId: customerCredentials.customer_id,
    }),
    eq(customerCredentials.visible_to_customer, true),
    or(
      isNull(customerCredentials.project_id),
      exists(
        /* select 1 from projects where id = customer_credentials.project_id
                and portalProjectCondition(reader, permission) */
      ),
    ),
  )!;
}
```

`permission` ist das Recht der jeweiligen Aktion (`…Read`, `…Reveal`, `…Write`); `portalAccessCondition.forReader`
ergibt ohne das Recht `FALSE`, damit ist jeder Fehlgriff `not_found`. `lockVisible(tx, actor, id, permission)` liest
die Zeile mit dieser Bedingung `FOR UPDATE`. `targetExists(tx, actor, projectId)` prüft ein Projekt über
`portalProjectCondition(actor, Permission.PortalCredentialsWrite)` `FOR SHARE`; `null` braucht keine Prüfung.

Kein Portal-Handler nimmt eine `customerId` aus dem Body; sie kommt aus dem `PortalActor`. Geteilt mit dem Workspace
werden nur die Services unter `server/shared/services/credential/` (Krypto, Limit, Event).

**Abläufe:**

- `listPortalCredentials(reader)` — Einträge mit `visibleCondition(reader, PortalCredentialsRead)`, dazu die
  wählbaren Projekte, `capabilities` (`canWrite`/`canReveal` über `portalCanOn.forReader`, in der Owner-Sicht beide
  `false`) und `configured`.
- `createPortalCredential(actor, data)` — `portalCanOn.forActor(…, PortalCredentialsWrite)` (sonst `not_found`) →
  `isConfigured` (sonst `not_configured`) → Kundenzeile `FOR UPDATE` sperren und Einträge zählen (≥ 100 →
  `validation`) → `targetExists` (sonst `validation`) → ID erzeugen, verschlüsseln, Insert mit
  `created_by_side: customer`, `created_by_portal_membership_id: actor.membershipId`, `visible_to_customer: true`,
  `version: 1` → Event `credential_created` mit `portalActivityActor(actor)` →
  `announceSystemMessage(tx, actor.customerId, SystemMessageKey.CredentialAddedByCustomer, {})` → Antwort
  `{ created: true }` plus das DTO nur, wenn der Kontakt `…Read` besitzt.
- `updatePortalCredential(actor, id, data)` — `lockVisible(…, PortalCredentialsWrite)` → Versionsvergleich (409, mit
  DTO nur bei Leserecht) → `updateVersioned` → Event `credential_updated` → bei neuem Geheimnis Systemnachricht
  `CredentialSecretChangedByCustomer`. Das Schema lehnt `projectId` und `visibleToCustomer` als unbekannte Felder ab
  (`.strict()`).
- `revealPortalCredential(actor, id, data)` — wie der interne Ablauf aus Task 18, mit
  `lockVisible(…, PortalCredentialsReveal)`, Limit `revealsPerWindowPortal`, `portalActivityActor(actor)` als Actor.

Routen nach `apps/workspace/src/app/api/portal/[customerId]/files/links/route.ts`:
`privateCredentialResponse(() => withPortalActor(customerId.toLowerCase(), async (req, actor) => parseCredentialBody(req, schema, async (data) => credentialApiResponse(await handler(actor, data))))(request))`;
die Liste mit `withPortalReader`. Die Helfer aus `lib/credentials/` (Task 18) werden unverändert genutzt.

- **Akzeptanz T3 (Lesen und Aufdecken):**
  - Zwei Kunden mit je einem freigegebenen Eintrag: Kontakt A sieht nur den eigenen; Reveal auf den Eintrag von B → 404
  - Nicht freigegebener Eintrag, Eintrag eines archivierten Projekts, Kontakt ohne die Rolle: 404, kein Event
  - Kontakt mit `portal_standard`, ohne `portal_credentials`: Liste 404 bzw. leer nach Muster der anderen Module, Reveal 404
  - Owner-Portalsicht: Liste ja; die Reveal-Route antwortet wie für jeden Nicht-Kontakt (kein `PortalActor`)
  - 11. Aufdeckung in 60 Sekunden → 429 mit `Retry-After`
  - Serialisierte Listenantwort enthält weder Klartext noch Chiffrat
  - Genau ein `credential_revealed` je Aufdeckung, `actor_type = customer`; im CRM zeigt die Zeile „zuletzt aufgedeckt“
- **Akzeptanz T4 (Anlegen und Ändern):**
  - Projekt eines anderen Kunden oder ein archiviertes Projekt beim Anlegen → `validation`, nichts geschrieben
  - `visibleToCustomer` oder `projectId` im Änderungs-Body → `validation`
  - Kontakt mit Schreibrecht ohne Leserecht erhält nur `{ created: true }` bzw. eine Bestätigung
  - Ändern eines Eintrags, dessen Freigabe intern zurückgenommen wurde → 404
  - Ohne Schlüsselring: 503 `not_configured`, nichts geschrieben
  - Je Schreibvorgang genau ein Security-Event; Systemnachricht bei neuem Eintrag und bei neuem Geheimnis, nicht bei
    einer reinen Titeländerung; die Nachricht enthält weder Titel noch Wert

## Portal-Oberfläche (CRM-71-T5 und T6)

```txt
apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/credentials/page.tsx
apps/workspace/src/client/portal/portal-credentials-api-service.ts
apps/workspace/src/components/portal/credentials/
  portal-credentials-view/                     + Test
  portal-credential-row/
  portal-credential-form-dialog/               + Test
apps/workspace/src/components/portal/dashboard/widgets/portal-credentials-widget/
apps/workspace/src/common/constants/portal/portal-widget-keys.ts     + Credentials: "credentials" (Objekt und _VALUES)
apps/workspace/src/common/constants/portal/portal-widget-layout.ts   + Eintrag, siehe unten
apps/workspace/src/common/constants/portal/portal-access-preview-areas.ts
                                               + { labelKey: PortalSection.Credentials,
                                                   requiredPermission: Permission.PortalCredentialsRead }
apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/page.tsx   lädt die Zahl und reicht Widget-Props durch
apps/workspace/src/i18n/dictionaries/portal/credentials/{de,en}.json
apps/workspace/src/i18n/dictionaries/portal/dashboard/{de,en}.json      + widgets.credentials
apps/workspace/src/i18n/dictionaries/portal/index.ts                    + getPortalCredentialsDictionary
apps/workspace/src/i18n/dictionaries/workspace/crm/portal-access/{de,en}.json  + Label des Bereichs in der Vorschau
```

Widget-Eintrag (zwischen „Dateien“ 90 und „Stunden“ 100):

```ts
{
  key: PortalWidgetKey.Credentials,
  order: 95,
  span: QUARTER_ROW,
  openMode: WidgetOpenMode.None,
  mock: false,
  requiredPermission: Permission.PortalCredentialsRead,
  onlyWithContent: false,
},
```

Das Widget zeigt die Anzahl der hinterlegten Zugänge und einen Link „Zugangsdaten öffnen“ auf
`portalPathFor(locale, customerId, PortalSection.Credentials)` — nie Titel, Benutzernamen oder Werte. Die Zahl kommt
aus `countPortalCredentials(reader)`; die Dashboard-Seite ruft es nur auf, wenn das Widget für den Leser sichtbar ist
(`listVisiblePortalWidgets`). Es gibt dafür kein neues Feld im `PortalDashboardDto` (wie beim Onboarding-Widget).
`portal-widget-layout.test.ts` wird um den Eintrag ergänzt.

Die Seite folgt `files/page.tsx`: `export const dynamic = "force-dynamic"`, `robots: { index: false, follow: false,
nocache: true }`, `requirePortalReader(locale, customerId.toLowerCase())`, dann `listPortalCredentials(reader)`; ohne
`portal.credentials.read` `notFound()`. Die Owner-Sicht bekommt `cockpitHref` wie auf der Dateien-Seite und zeigt
deaktivierte Aktionen mit dem bestehenden Baustein `components/portal/portal-owner-notice/`.

Komponenten: Geheimnisfeld, Typ-Symbol und `useRevealedSecret` kommen aus `components/shared/credentials/` und
`hooks/shared/` (Task 18). Kein Import aus `components/workspace/**`. Client-Zustand hängt über `key={customerId}` an
der Firma. Liste gruppiert nach „Allgemein“ und je Projekt.

- **T5 — Seite und Liste. Skills:** `frontend-design`, `copywriting`. **Akzeptanz:**
  - Kontakt ohne Rolle: kein Widget; Direktaufruf der Seite ergibt 404
  - Aufdecken und Kopieren erscheinen nur mit `capabilities.canReveal`, „Zugang hinterlegen“ und „Ändern“ nur mit
    `canWrite`
  - Empty-State erklärt, welche Zugänge wir typischerweise brauchen (Domain, Hosting, E-Mail) und dass sie
    verschlüsselt gespeichert werden
  - Tastatur, sichtbarer Fokus, Klickflächen ≥ 44 × 44 px, Dark und Light, DE (du) und EN
- **T6 — Dialog zum Hinterlegen und Ändern. Skills:** `frontend-design`, `copywriting`. **Akzeptanz:**
  - Dieselben Feldregeln wie intern (Task 18 T5), ohne Projektwechsel beim Ändern
  - Kurzer Hinweis im Dialog: verschlüsselt gespeichert, einsehbar für das Invessiv-Team und für Kontakte der eigenen
    Firma mit dem Zugangsdaten-Recht
  - Versionskonflikt, Validierungsfehler, `not_configured` und Submit-Fehler haben je einen erkennbaren Zustand

## Kann-Ticket CRM-71-T7 — Erneute Anmeldung vor dem Aufdecken (kein Merge-Gate)

Wirksamste Gegenmaßnahme zum Risiko „Portal ohne MFA“. Zu klären, bevor Code entsteht:

1. Unterstützt die eingesetzte Version (`@clerk/nextjs` ^7) Reverification serverseitig in Route Handlern (Prüfung
   „Anmeldung jünger als N Minuten“) und clientseitig das erneute Abfragen des Passworts? Doku über context7 prüfen,
   nicht aus dem Gedächtnis.
2. Ist die Funktion im genutzten Clerk-Tarif enthalten?

Wenn ja: beide Reveal-Routen (Portal und intern) verlangen eine Anmeldung, die höchstens 10 Minuten alt ist; sonst
antworten sie mit einem eigenen Code `reverification_required`, und das Geheimnisfeld startet den Clerk-Dialog und
wiederholt die Anfrage. Tests für beide Zweige. Wenn nein oder zu aufwendig: begründete Notiz in der README unter
„Risiken“, Punkt 1.

## Regeln nachziehen (CRM-71-T8)

`apps/workspace/src/server/portal/AGENTS.md` bekommt einen Abschnitt „Zugangsdaten (ab Task 71)“ (einzige
Sichtbarkeitsdefinition, Recht je Aktion in `visibleCondition`, nie Löschen, Antwort ohne Leserecht),
`apps/workspace/src/components/portal/AGENTS.md` einen Satz zum Widget ohne Inhalte. Inhalt auf Deutsch.

## Deploy-Sicherheit

1. **Live sichtbar:** intern Freigabe-Aktion und Badges. Im Portal Widget und Seite, aber nur für Kontakte mit der
   neuen Rolle — nach dem Deploy besitzt sie niemand.
2. **Bricht nichts:** Der Katalog wächst additiv, `portal_standard` bleibt inhaltlich unverändert, kein bestehender
   Portalpfad ändert sich.
3. **Reihenfolge:** Migration vor dem App-Deploy.
4. **Vor der ersten Zuweisung:** dem Kunden sagen, die Rolle nur Personen zu geben, die die Zugänge ohnehin kennen.

## End-to-End-Akzeptanz (manuell im Browser, Screenshots in den PR)

1. Ein interner Zugang wird freigegeben und erscheint beim Kontakt mit der Rolle, bei einem Kontakt ohne Rolle nicht.
2. Der Kontakt deckt Passwort und Notiz einzeln auf; im CRM steht „zuletzt aufgedeckt“, in `security_events` der
   Vorgang mit Customer-Actor.
3. Der Kontakt hinterlegt einen neuen Zugang; er erscheint im Cockpit mit dem Badge „Vom Kunden“, und im Chat steht
   eine Systemnachricht.
4. Der Kontakt ändert ein Passwort; intern zeigt „Passwort geändert am“ den neuen Zeitpunkt, Aufdecken liefert den
   neuen Wert.
5. Rücknahme der Freigabe entfernt den Eintrag sofort aus dem Portal.
6. Ein Kontakt eines anderen Kunden erreicht keinen der Endpunkte.
7. Die Owner-Portalsicht zeigt Widget und Liste und kann nichts aufdecken oder ändern.
8. Alle Gates aus der README (Merge-Gate 19.2) grün.
