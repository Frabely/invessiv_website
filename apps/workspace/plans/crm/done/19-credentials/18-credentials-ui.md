# Task 18 — Credentials intern

> **Merge-Einheit:** Ordner 19, PR 19.1 · **Branch:** `feat/crm-credentials-1-intern`
> **Aufwand:** L · **Abhängigkeiten:** Task 17 (im selben PR davor)
> **Migration:** eine; Nummer im Repository ermitteln (höchste bestehende plus eins; am 06.10.2026 wäre das `0054`)
> **Zuerst lesen:** [README](./README.md) (Datenmodell, Rechte), `apps/workspace/src/server/workspace/crm/AGENTS.md`,
> `apps/workspace/src/server/workspace/shared/AGENTS.md`, `packages/db/AGENTS.md`,
> `apps/workspace/src/components/workspace/crm/AGENTS.md`

- Zugänge je Kunde, optional einem Projekt zugeordnet, im Cockpit anlegen, ändern, löschen.
- Listen liefern nur Metadaten und entschlüsseln nie.
- Aufdecken und Kopieren holen genau ein Feld eines Datensatzes und werden auditiert.
- Kein Portalpfad in diesem Task; er folgt mit Task 71.

## Context

Zugangsdaten sind der sensibelste Teil des CRM und gehören fremden Personen. Die Verschlüsselung steht seit Task 17.
Dieser Task ergänzt Tabelle, interne Handler und Oberfläche. Grundsatz: **Klartext verlässt den Server nur auf
ausdrückliche Anforderung**, für genau ein Feld eines Datensatzes, und jede Anforderung wird protokolliert.

**Das Dateien-Modul ist die Vorlage** für fast jede Schicht, weil es denselben Scope (Kunde, optional Projekt) und
dieselbe Zweiteilung intern/Portal hat. Wo unten „wie Dateien“ steht, ist die genannte Datei das Muster für Aufbau,
Benennung und Fehlerbehandlung.

## Entscheidungen

| Bereich               | Entscheidung                                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liste                 | Immer maskiert. Der Listen-Handler selektiert die Chiffrat-Spalten nicht (nur `note_ciphertext IS NOT NULL` als `hasNote`) und ruft `decrypt` nie auf                                             |
| Aufdecken             | Eigener Endpunkt, Body `{ field: "secret" \| "note", intent: "show" \| "copy" }`, Antwort `{ value }`                                                                                             |
| Kopieren              | Ohne vorheriges Anzeigen möglich; zählt als Aufdeckung                                                                                                                                            |
| Automatisch verbergen | Nach 30 Sekunden und beim Verlassen des Tabs (`visibilitychange`) verschwindet der Wert aus dem React-State                                                                                       |
| Bearbeiten            | Geheimnis weggelassen heißt „unverändert“. Notiz ist dreiwertig: weggelassen = unverändert, Text = ersetzen, `null` = entfernen                                                                   |
| Versionierung         | Anlegen schreibt `version = 1`. Ändern über `updateVersioned`; 409 mit `VersionConflictDto`, dessen `current` das Metadaten-DTO ist. Aufdecken setzt `last_revealed_at` ohne Versionserhöhung     |
| Audit                 | `security_events` über `securityEventService.createSecurityEvent`, Subject-Typ `credential`, `subjectId` = Credential-ID. Metadata siehe Tabelle unten. Nie Titel, nie Werte                      |
| Rate-Limit            | 20 Aufdeckungen je 60 Sekunden und Mitglied. Antwort 429 mit `Retry-After`                                                                                                                        |
| Nicht konfiguriert    | Ohne Schlüsselring (`credentialCryptoService.isConfigured() === false`): Anlegen, Ändern mit neuem Geheimnis/Notiz und Aufdecken antworten 503 mit Code `not_configured`. Liste und Löschen gehen |
| Ort in der UI         | Sektion „Zugangsdaten“ im Kunden-Cockpit mit Projektfilter, neben der Dateien-Sektion. Keine eigene Seite, kein Sidebar-Eintrag                                                                   |
| Projektfilter         | „Alle“ zeigt alles Lesbare; „Projekt X“ zeigt die Einträge dieses Projekts **und** die kundenweiten, getrennt gruppiert; „Kundenweit“ nur die ohne Projekt                                        |
| URL-Feld              | Freitext bis 2048 Zeichen. Als Link gerendert nur bei `https://` oder `http://`, mit `target="_blank"` und `rel="noopener noreferrer"`                                                            |
| Activities            | Keine. Der vorhandene Activity-Typ `credential_revealed` bleibt ungenutzt; ein CHECK wird nie verengt                                                                                             |

### Security-Events

Neue Werte in `SecurityEventType` (`packages/common/src/constants/auth/security-event-types.ts`, Objekt **und**
`_VALUES`-Array) und `SecuritySubjectType.Credential = "credential"` (`security-subject-types.ts`):

| Typ                                    | Wann                                     | `metadata`                                                              |
| -------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `credential_created`                   | Anlegen                                  | `customer_id`, `project_id`                                             |
| `credential_updated`                   | Ändern                                   | `customer_id`, `project_id`, `changed_fields` (Spaltennamen, kein Wert) |
| `credential_deleted`                   | Löschen                                  | `customer_id`, `project_id`                                             |
| `credential_revealed`                  | Aufdecken und Kopieren                   | `customer_id`, `project_id`, `field`, `intent`                          |
| `credential_portal_visibility_changed` | Freigabe (Typ jetzt, Nutzung in Task 71) | `customer_id`, `project_id`, `visible`                                  |

Actor intern: `{ type: ActorType.User, userId: actor.userId }`. Jedes Event entsteht in derselben Transaktion wie der
fachliche Write. Schlägt das Schreiben des Events fehl, rollt die Transaktion zurück — beim Aufdecken verlässt dann
kein Klartext den Server.

## Konstanten und Contracts

Eigene Domäne `credentials` in `packages/common` (wie `files`), weil Portal und Workspace sie teilen.

```txt
packages/common/src/constants/credentials/
  credential-types.ts            CredentialType: DomainRegistrar, Hosting, Email, Cms, Database, Analytics,
                                 ApiService, Other  (Werte wie in der README) + CREDENTIAL_TYPE_VALUES
  credential-sides.ts            CredentialSide: Internal "internal", Customer "customer" + _VALUES
  credential-reveal-intents.ts   CredentialRevealIntent: Show "show", Copy "copy" + _VALUES
  credential-limits.ts           CREDENTIAL_LIMITS = { titleMax: 120, urlMax: 2048, usernameMax: 320,
                                 secretMax: 4096, noteMax: 4000, revealWindowSeconds: 60,
                                 revealsPerWindowInternal: 20, autoHideSeconds: 30 }
  credential-api-error-code.ts   CredentialApiErrorCode: NotFound "not_found", Validation "validation",
                                 NotConfigured "not_configured", RateLimited "rate_limited", Internal "internal"
  (Tests ergänzen credential-constants.test.ts aus Task 17)

packages/common/src/contracts/credentials/
  credential.dto.ts              siehe unten
  credential-capabilities.dto.ts { canWrite: boolean; canReveal: boolean }
  create-credential-request.dto.ts   { projectId: string | null; title; credentialType; url: string | null;
                                       username: string | null; secret: string; note: string | null }
  update-credential-request.dto.ts   { version: number; projectId?: string | null; title?; credentialType?;
                                       url?: string | null; username?: string | null; secret?: string;
                                       note?: string | null }
  delete-credential-request.dto.ts   { version: number }
  reveal-credential-request.dto.ts   { field: CredentialSecretField; intent: CredentialRevealIntent }
  reveal-credential-response.dto.ts  { value: string }
  credential-list.dto.ts             { credentials: CredentialDto[] }
  credential-result.ts               Result-Union wie contracts/files/file-result.ts, zusätzlich
                                     { ok: false; code: RateLimited; retryAfterSeconds: number }
```

```ts
// packages/common/src/contracts/credentials/credential.dto.ts — every field gets a docstring (packages/common/AGENTS.md)
export interface CredentialDto {
  id: string;
  customerId: string;
  projectId: string | null; // null = customer-wide
  title: string;
  credentialType: CredentialType;
  url: string | null;
  username: string | null;
  hasNote: boolean; // the note text itself never appears in this DTO
  visibleToCustomer: boolean;
  createdBySide: CredentialSide;
  secretChangedAt: string; // ISO
  lastRevealedAt: string | null;
  updatedAt: string;
  version: number;
  capabilities: CredentialCapabilitiesDto; // per row, because bound roles differ per project
}
```

Es gibt bewusst kein Feld für Geheimnis oder Notiztext. Ein Typtest belegt das (`expectTypeOf<CredentialDto>()` hat
weder `secret` noch `note`).

## Datenbank

```txt
packages/db/migrations/<nr>_create_customer_credentials.sql
packages/db/src/constraint-names/crm/customer-credentials-constraint-names.ts
packages/db/src/record-configuration/crm/customer-credentials.ts
packages/db/src/record-configuration/crm/index.ts                  + Export (speist die Smoke-Tabellenliste)
packages/db/scripts/crm-smoke/credential-checks.ts                 + Aufruf in smoke-crm-constraints.ts
packages/db/scripts/crm-fixture/seed-credentials.ts                + Aufruf und Aufräumen in seed-crm-fixture.ts
```

Die Migration:

1. `CREATE TABLE IF NOT EXISTS customer_credentials (…)` laut README, alle CHECKs und Fremdschlüssel benannt
   (`customer_credentials_<zweck>_check|_fkey|_idx`), Namen als Const-Objekt wie
   `packages/db/src/constraint-names/crm/files-constraint-names.ts`.
2. Beide Indizes mit `CREATE INDEX IF NOT EXISTS`.
3. `security_events_type_check` erweitern: `DROP CONSTRAINT IF EXISTS`, dann `ADD CONSTRAINT` mit der **vollständigen**
   Liste (alle 19 bisherigen Werte aus Migration `0050` plus die fünf neuen). Muster: `0050_add_workspace_member_booking_url.sql`.
4. `security_events_subject_type_check` genauso erweitern: bisher `workspace_member`, `role`, `portal_invitation`,
   `portal_membership`, `customer` (Migration `0039`), neu `credential`.
5. `--> statement-breakpoint` zwischen den Statements; einfache Spalten je eine Zeile (Formatregel in
   `packages/db/AGENTS.md`). Ein zweiter Lauf ist folgenlos.

Modell: CHECKs für String-Unions über `sqlCheckIn` mit den `_VALUES`-Arrays; `.defaultNow()` nur an `created_at` und
`updated_at`; kein weiterer Default.

Smoke (`credential-checks.ts`, Muster `crm-smoke/onboarding-checks.ts`, Fixture-Präfix und Aufräumen in `finally`):
abgewiesen werden müssen ein Projekt eines anderen Kunden, `created_by_side = 'customer'` mit
`visible_to_customer = false`, zwei gesetzte Herkünfte, keine Herkunft, leerer Titel, `version = 0`, unbekannter Typ.
Zusätzlich in `runMissingDefaultChecks`: Insert ohne `visible_to_customer`, ohne `version` und ohne
`secret_changed_at` schlägt fehl.

Seed (`seed-credentials.ts`, Muster `crm-fixture/seed-files.ts`): je Beispielkunde zwei kundenweite Zugänge
(Domain-Anbieter, Mailkonto) und ein Projektzugang (Hosting), alle `created_by_side = internal`,
`visible_to_customer = false`. Verschlüsselt mit `credentialCipher` und dem Ring aus
`process.env.CRM_CREDENTIALS_KEYRING`. Ist die Variable nicht gesetzt, überspringt der Seed die Zugänge mit einer
englischen Konsolenzeile und läuft weiter. Bei der Umsetzung prüfen, ob der Env-Lader der Skripte
(`packages/db/scripts/database-target.ts`, `@invessiv/db/core/env`) die Variable aus `.env.<target>.local` in
`process.env` übernimmt; sonst im Skript nachladen.

## Server

```txt
apps/workspace/src/server/workspace/crm/
  query-handler/list-customer-credentials.query-handler.ts
  command-handler/create-credential.command-handler.ts
  command-handler/update-credential.command-handler.ts
  command-handler/delete-credential.command-handler.ts
  command-handler/reveal-credential.command-handler.ts
  services/credentials/
    credential-access-service.ts      condition, targetExists, lock
    credential-mapping-service.ts     toDto(row, actor)
    credential-schemas.ts             zod: id, list, create, update, delete, reveal
apps/workspace/src/server/shared/services/credential/
  credential-reveal-limit-service.ts  findRetryAfter(tx, { actorUserId, limit, now })
  credential-event-service.ts         record(tx, { type, actor, credential, metadata })
```

`credential-reveal-limit-service` und `credential-event-service` liegen schon in diesem PR unter `server/shared/`,
obwohl der zweite Aufrufer (Portal) erst mit 19.2 kommt. Das ist eine bewusste Planvorgabe wie beim Bogen-Read-Service
in Task 65; so entsteht in 19.2 kein Umzug.

**`credentialAccessService`** — eins zu eins nach
`apps/workspace/src/server/workspace/crm/services/files/file-access-service.ts`:

- `condition(actor, permission)` =
  `crmAccessCondition.forScope(accessScope(actor, permission), { customerId: customerCredentials.customer_id, projectId: customerCredentials.project_id })`
- `targetExists(tx, customerId, projectId, actor, permission)` — `canOn` am Ziel, dann Kunde bzw. Projekt-des-Kunden
  `FOR SHARE` prüfen
- `lock(tx, id, actor, permission)` — Zeile mit `condition` `FOR UPDATE` lesen, danach `canOn` mit
  `{ customerId, projectId }` der Zeile; sonst `null`

**Handler-Abläufe** (alle in `getDrizzleDatabaseClient().transaction`, Rückgabe `CredentialResult<T>`):

- `listCustomerCredentials(customerId, query, actor)` — `WHERE customer_id = … AND condition(actor, CredentialsRead)`
  plus Projektfilter; sortiert nach `project_id NULLS FIRST, credential_type, title`. Keine Paginierung (Obergrenze
  durch die Sache; je Kunde wenige Dutzend). Ein Kunde außerhalb des Zugriffsbereichs ergibt eine leere Liste.
- `createCredential(customerId, data, actor)` — `isConfigured` (sonst `not_configured`) →
  `targetExists(…, CredentialsWrite)` (sonst `not_found`) → `id = crypto.randomUUID()` **vor** dem Verschlüsseln (die
  ID ist Teil der AAD) → Insert mit `version: 1`, `visible_to_customer: false`, `created_by_side: internal`,
  `created_by_member_id: actor.workspaceMemberId`, `secret_changed_at: now` → Event `credential_created`.
- `updateCredential(id, data, actor)` — `lock(…, CredentialsWrite)` (sonst `not_found`) → Versionsvergleich (sonst
  Konflikt über `versionConflict(...)` aus `server/workspace/shared/version-conflict.ts`) → bei `projectId`-Wechsel
  `targetExists` am neuen Ziel → bei neuem Geheimnis oder Notiztext `isConfigured` → Patch bauen, bei neuem Geheimnis
  `secret_changed_at: now` → `updateVersioned` → Event `credential_updated` mit `changed_fields`.
- `deleteCredential(id, data, actor)` — `lock` → Versionsvergleich → Event `credential_deleted` → `DELETE`.
- `revealCredential(id, data, actor)`:
  1. `lock(tx, id, actor, Permission.CredentialsReveal)` — sonst `not_found`
  2. `field = note` und `note_ciphertext IS NULL` → `not_found`
  3. `credentialRevealLimitService.findRetryAfter` — sonst `rate_limited` mit `retryAfterSeconds`
  4. `credentialCryptoService.decrypt(...)` mit `{ customerId, credentialId, field }`; ein `CredentialCipherError`
     mit `keyring_missing`/`keyring_invalid` wird zu `not_configured`, jeder andere zu `internal` (ohne Details im Log)
  5. `UPDATE … SET last_revealed_at = now` (ohne `version`, ohne `updated_at`)
  6. Event `credential_revealed`
  7. `{ ok: true, value: { value } }`

**Rate-Limit** (Muster `messageService.findPortalSendRetryAfter` in
`apps/workspace/src/server/shared/services/message/message-service.ts`): zuerst die eigene Zeile in `users`
`FOR UPDATE` sperren (serialisiert parallele Anfragen desselben Menschen), dann die jüngsten `limit` Zeilen aus
`security_events` mit `type = credential_revealed`, `actor_user_id = actorUserId`, `occurred_at > now − 60 s` lesen.
Sind es `limit`, ergibt die älteste den Wert für `Retry-After` (mindestens 1 Sekunde), sonst `null`.

## Routen

```txt
GET    /api/workspace/crm/customers/[id]/credentials?projectId=      CredentialsList    credentials.read   scope list
POST   /api/workspace/crm/customers/[id]/credentials                 CredentialCreate   credentials.write  scope project
PATCH  /api/workspace/crm/credentials/[credentialId]                 CredentialUpdate   credentials.write  scope project
DELETE /api/workspace/crm/credentials/[credentialId]                 CredentialDelete   credentials.write  scope project
POST   /api/workspace/crm/credentials/[credentialId]/reveal          CredentialReveal   credentials.reveal scope project
```

```txt
apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts     + fünf Regeln (Objekt und Map) + Test
apps/workspace/src/common/constants/api-endpoints.ts                      + CrmCredentials: "/api/workspace/crm/credentials"
apps/workspace/src/common/constants/credentials/credential-query-params.ts  CredentialQueryParam.ProjectId
apps/workspace/src/app/api/workspace/crm/customers/[id]/credentials/route.ts
apps/workspace/src/app/api/workspace/crm/credentials/[credentialId]/route.ts
apps/workspace/src/app/api/workspace/crm/credentials/[credentialId]/reveal/route.ts
apps/workspace/src/lib/credentials/credential-api-error.ts       nicht exportierte Maps Code → Status und Text
apps/workspace/src/lib/credentials/credential-api-response.ts    credentialApiResponse, privateCredentialResponse,
                                                                 parseCredentialBody
```

Aufbau jeder Route wie `apps/workspace/src/app/api/workspace/crm/files/[fileId]/route.ts`:
`privateCredentialResponse(() => withCrmPermission(CrmEndpointAccessRule.X, async (authorized, actor) => parseCredentialBody(authorized, schema, async (data) => credentialApiResponse(await handler(…, data, actor))))(request))`.

`privateCredentialResponse` nutzt `privateResponse` aus `apps/workspace/src/lib/http/private-no-store.ts` (setzt
`no-store` auch auf abgewiesene Antworten) — Vorlage `apps/workspace/src/lib/files/file-api-response.ts`. Der
Fehler-Callback loggt nur den Code. `credentialApiResponse` bildet ab: `not_found` 404, `validation` 422,
`not_configured` 503, `rate_limited` 429 mit Header `Retry-After` (`HttpHeaderName.RetryAfter`; fehlt der Eintrag im
Const-Objekt, dort samt Test ergänzen), `internal` 500, Konflikt 409 mit dem `VersionConflictDto` als Body.
Statuscodes ausschließlich aus `HttpResponseCode`.

Der Query-Parameter `projectId` wird wie in der Dateien-Route gelesen: fehlt = alle, `"null"` = nur kundenweit, UUID
= dieses Projekt plus kundenweite.

`lib/credentials/` liegt bewusst nicht unter `lib/workspace/crm/`, weil die Portal-Routen aus Task 71 dieselben
Helfer nutzen (wie `lib/files/`).

## Oberfläche

```txt
apps/workspace/src/common/contracts/crm/credentials/
  credentials-view-model.ts          { projects: CredentialsProjectOption[]; read; write; reveal: CredentialsScopeRights;
                                       configured: boolean }
  credentials-scope-rights.ts        { customerWide: boolean; projectIds: string[] }
  credentials-project-option.ts      { id: string; title: string }
apps/workspace/src/lib/workspace/crm/credentials-view-model.ts     buildCredentialsViewModel({ actor, customerId, projects })
apps/workspace/src/client/crm/credentials-api-service.ts           list, create, update, remove, reveal
apps/workspace/src/hooks/shared/use-revealed-secret.ts             + Test
apps/workspace/src/components/shared/credentials/
  credential-secret-field/                                         Maskierung, Anzeigen, Kopieren, Countdown
  credential-type-icon/                                            Symbol je CredentialType
apps/workspace/src/components/workspace/crm/credentials/
  customer-credentials-section/                                    + Test
  credential-row/
  credential-form-dialog/                                          + Test
  credential-delete-dialog/
apps/workspace/src/i18n/dictionaries/workspace/crm/credentials/{de,en}.json
apps/workspace/src/i18n/dictionaries/workspace/crm/index.ts        + CrmCredentialsDictionary, getCrmCredentialsDictionary
apps/workspace/src/app/[locale]/(app)/crm/page.tsx                 baut das View-Model und reicht es durch
apps/workspace/src/components/workspace/crm/detail/customer-cockpit-dialog/customer-cockpit-dialog.tsx
apps/workspace/src/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view.tsx
```

**Einhängen ins Cockpit** — exakt wie die Dateien: In `crm/page.tsx` steht bereits
`buildFilesViewModel({ actor, customerId, projects })` (`src/lib/workspace/crm/files-view-model.ts`). Daneben entsteht
`buildCredentialsViewModel`, das `null` liefert, wenn `credentials.read` in keinem Scope des Kunden gilt; dann
existiert die Sektion nicht. `configured` kommt aus `credentialCryptoService.isConfigured()`. `CustomerCockpitView`
bekommt die optionalen Props `credentials` und `credentialsContent` und rendert `CustomerCredentialsSection` direkt
nach der Dateien-Sektion. Die Liste selbst lädt die Sektion über die API (wie die Dateien), damit der Projektfilter
das Cockpit nicht neu rendert.

**Geteilte Bausteine unter `components/shared/credentials/`:** Das Portal darf nichts aus `components/workspace/**`
importieren. Geheimnisfeld und Typ-Symbol werden in Task 71 wiederverwendet und liegen deshalb von Anfang an unter
`components/shared/` (dort liegen bereits `files/`, `chat-attachments/`, `onboarding/`). Sie kennen keinen Endpunkt
und kein Dictionary: Texte und die Funktion `onReveal(field, intent): Promise<RevealOutcome>` kommen als Props.

**`useRevealedSecret({ autoHideSeconds, reveal })`** hält `{ value, secondsLeft, status }`; `show()` ruft `reveal` mit
`intent: show`, startet den Countdown und verbirgt bei Ablauf, bei `visibilitychange` (hidden) und beim Unmount.
`copy()` ruft `reveal` mit `intent: copy`, schreibt in `navigator.clipboard` und hält den Wert nicht im State.

## Tickets

### CRM-18-T1 — Migration, Modell, Konstanten, Contracts

- **Files:** Abschnitte „Konstanten und Contracts“ und „Datenbank“
- **Akzeptanz:**
  - Zweiter Migrationslauf ist folgenlos; Modell und Migration deckungsgleich (ausdrücklicher Review-Punkt)
  - `pnpm --filter @invessiv/db db:smoke:crm` grün inklusive der neuen Checks
  - `pnpm --filter @invessiv/db db:smoke:rbac` grün (Katalog unverändert)
  - `security-event-types.test.ts` und der Test der Subject-Typen sind auf die neuen Werte angepasst
  - Typtest: `CredentialDto` hat kein `secret`- und kein `note`-Feld
  - `db:seed:crm` läuft mit und ohne Schlüsselring durch und ist wiederholbar

### CRM-18-T2 — Liste, Anlegen, Ändern, Löschen

- **Files:** Query-Handler, drei Command-Handler, `services/credentials/**`, `credential-event-service.ts`, drei
  Routen-Dateien, `lib/credentials/**`, Endpunkt- und Access-Rule-Konstanten
- **Tests:**
  - `src/server/tests/workspace/crm/services/credential-mapping-service.test.ts` (Pflicht für Mapping-Services)
  - `src/server/tests/workspace/crm/credentials/credential-routes.test.ts` (Muster `files/file-routes.test.ts`)
  - `src/server/tests/workspace/crm/credentials/credentials.integration.test.ts` (Muster `files/files.integration.test.ts`)
  - Pfad `src/server/tests/workspace/crm/credentials` in das Skript `db:smoke:crm` in `apps/workspace/package.json`
    eintragen
- **Akzeptanz:**
  - Die serialisierte Listenantwort enthält weder den Klartext noch das Chiffrat des Testeintrags
    (`JSON.stringify(response)` gegen beide Werte geprüft)
  - Nach dem Anlegen steht in der Zeile kein Klartext; `secret_ciphertext` beginnt mit `v1.`
  - Ändern ohne `secret` lässt `secret_ciphertext` und `secret_changed_at` unverändert
  - `note: null` entfernt die Notiz; `note` weggelassen lässt sie stehen
  - Veraltete Version → 409 mit aktuellem Metadaten-DTO; gelöschte Zeile → 404 (nicht 409)
  - Projektwechsel und zurück auf kundenweit: Aufdecken liefert danach weiter den ursprünglichen Wert
  - Negativtests: fremder Kunde → 404; fremdes Projekt → 404; Mitglied mit projektgebundener Rolle sieht den
    kundenweiten Eintrag nicht und bekommt beim Ändern 404; Projektwechsel in ein Projekt ohne Schreibrecht → 404
  - Je Schreibvorgang genau ein Security-Event; dessen serialisierte Metadaten enthalten weder Titel noch Wert
  - Ohne Schlüsselring: Anlegen 503 `not_configured`, Liste und Löschen funktionieren

### CRM-18-T3 — Aufdecken mit Audit und Limit

- **Files:** `reveal-credential.command-handler.ts`, Reveal-Route, `credential-reveal-limit-service.ts`
- **Tests:** in `credentials.integration.test.ts` und `credential-routes.test.ts`
- **Akzeptanz:**
  - Mitglied mit `credentials.read`, ohne `credentials.reveal` in irgendeinem Scope: 403 vom Gate, kein Event
  - Mitglied mit `credentials.reveal` nur an Projekt A deckt einen Eintrag von Projekt B nicht auf: 404, kein Event
  - Je Aufdeckung genau ein `credential_revealed` mit `field` und `intent`; `last_revealed_at` gesetzt, `version` gleich
  - Aufdecken einer nicht vorhandenen Notiz: 404, kein Event
  - 21. Aufdeckung innerhalb von 60 Sekunden: 429 mit `Retry-After` ≥ 1, kein Klartext im Body
  - Antwort trägt `Cache-Control: no-store`
  - Entzug der Rolle zwischen zwei Requests: der zweite wird abgewiesen
  - Chiffrat in der Zeile manuell verändert: 500 `internal`, kein Event, kein Wert

### CRM-18-T4 — Sektion und Geheimnisfeld

- **Files:** `components/shared/credentials/**`, `customer-credentials-section/**`, `credential-row/**`,
  `use-revealed-secret.ts`, Client-Service, View-Model, Dictionaries, Einhängen in Seite, Dialog und Cockpit-View
- **Skills:** `frontend-design`, `copywriting`
- **Inhalt:**
  - Liste gruppiert nach „Kundenweit“ und je Projekt, innerhalb nach Typ; Zeile mit Symbol, Titel, URL (als Link, wenn
    zulässig), Benutzername mit Kopier-Button, maskiertem Wert, „Passwort geändert am“, „zuletzt aufgedeckt am“
  - Projektfilter über URL-State. Den Parametername und das Lesen/Schreiben der URL von
    `customer-files-section.tsx` übernehmen, mit eigenem Parameter-Const (kein geteilter Zustand mit den Dateien)
  - Aktionen je Zeile aus `capabilities`: ohne `canReveal` fehlen Anzeigen und Kopieren vollständig, ohne `canWrite`
    Bearbeiten und Löschen. „Zugang hinzufügen“ erscheint, wenn `write` in mindestens einem Scope gilt
  - Zwei Empty-States: „noch nichts angelegt“ erklärt, wofür der Bereich gedacht ist (Zugänge, die der Kunde uns
    gibt); „keine Zugänge in diesem Projekt“ beim Filter
  - Ohne Schlüsselring (`configured === false`): Hinweisblock, Anlegen/Bearbeiten/Aufdecken deaktiviert
- **Akzeptanz:**
  - Vollständig per Tastatur bedienbar, sichtbare Fokus-Styles, Klickflächen ≥ 44 × 44 px
  - Live-Region meldet sinngemäß „Passwort sichtbar, wird in 30 Sekunden verborgen“, ohne den Wert vorzulesen
  - Der Wert steht nicht im HTML oder in der RSC-Payload der Seite, bevor er angefordert wurde
  - Nach 30 Sekunden und beim Tab-Wechsel ist der Wert aus dem DOM verschwunden (Test mit Fake-Timern)
  - Dark und Light korrekt; co-located `*.module.css`, nur Theme-Tokens; Komponenten aus `@invessiv/ui` werden nicht
    von außen umgestylt (Abweichung als Prop in die Komponente)
  - Alle Texte in DE und EN im Dictionary; keine Inline-Texte

### CRM-18-T5 — Formular und Löschdialog

- **Files:** `credential-form-dialog/**`, `credential-delete-dialog/**`
- **Skills:** `frontend-design`, `copywriting`
- **Vorlage:** `components/workspace/crm/files/file-link-dialog/` (Dialog mit Projektziel) und
  `file-delete-dialog/`; Versionskonflikte über den bestehenden Hook `src/hooks/workspace/use-versioned-command.ts`
- **Inhalt:**
  - Felder: Titel, Typ, Projekt (leer = kundenweit; nur Ziele mit Schreibrecht), URL, Benutzername, Geheimnis, Notiz
  - Beim Bearbeiten ist das Geheimnisfeld leer mit dem Hinweis „Leer lassen, um es unverändert zu übernehmen“
  - Notiz beim Bearbeiten: zugeklappt mit drei Aktionen — „Aufdecken und bearbeiten“ (nur mit `canReveal`, zählt als
    Aufdeckung mit `intent: show`), „Ersetzen“ (leeres Feld), „Entfernen“
  - Geheimnisfeld `type="password"` mit Anzeigen-Umschalter und `autocomplete="new-password"`; Benutzername
    `autocomplete="off"`
  - Löschdialog nennt den Titel und dass der Vorgang endgültig ist
- **Akzeptanz:**
  - Der Browser bietet kein Speichern der Zugangsdaten an
  - Pflichtfelder, Längenfehler, Versionskonflikt, `not_configured` und Submit-Fehler haben je einen erkennbaren Zustand
  - Fokus springt beim Fehler auf das erste ungültige Feld

### CRM-18-T6 — Regeln nachziehen

- **Files:** `apps/workspace/src/server/workspace/crm/AGENTS.md` (Abschnitt „Zugangsdaten (ab Task 18)“: Listen
  entschlüsseln nie, ID vor dem Verschlüsseln, Reveal-Ablauf, einziger Event-Schreibweg `credentialEventService`),
  `apps/workspace/src/server/shared/AGENTS.md`, `apps/workspace/src/components/workspace/crm/AGENTS.md` und die
  Index-Tabelle der Root-`AGENTS.md`, falls ein neuer Scope entsteht. Inhalt auf Deutsch.

## Deploy-Sicherheit

1. **Live sichtbar:** neue Sektion „Zugangsdaten“ im Kunden-Cockpit, nur für Mitglieder mit `credentials.read`.
2. **Bricht nichts:** eine neue Tabelle, zwei erweiterte CHECKs, neue Endpunkte. Kein bestehender Pfad verändert.
   Ohne Schlüsselring ist die Sektion sichtbar und schreibgeschützt.
3. **Reihenfolge:** Migration vor dem App-Deploy (additiv, mit der Vorversion kompatibel).
4. **Offen bis 19.2:** Freigabe und Portal. `visible_to_customer` ist bis dahin überall `false`; es gibt keinen
   Portalendpunkt.

## End-to-End-Akzeptanz (manuell im Browser, Screenshots in den PR)

1. Ein Zugang lässt sich kundenweit und am Projekt anlegen; eine Abfrage auf die Tabelle zeigt keinen Klartext.
2. Die Liste zeigt maskierte Werte; im Netzwerk-Tab enthält die Listenantwort keinen Wert.
3. Anzeigen fordert genau ein Feld an, zeigt es und verbirgt es nach 30 Sekunden; Tab-Wechsel verbirgt sofort.
4. Kopieren funktioniert ohne Anzeigen und erzeugt ebenfalls ein Event.
5. Jede Aufdeckung steht in `security_events`, ohne Wert.
6. Ein Mitglied ohne `credentials.reveal` sieht weder Anzeigen noch Kopieren.
7. Bearbeiten ohne neues Geheimnis lässt das bestehende unverändert.
8. Projektwechsel und „zurück auf kundenweit“ funktionieren.
9. Ohne Schlüsselring bleibt die Anwendung lauffähig und zeigt den Hinweis.
10. Alle Gates aus der README (Merge-Gate 19.1) grün.
