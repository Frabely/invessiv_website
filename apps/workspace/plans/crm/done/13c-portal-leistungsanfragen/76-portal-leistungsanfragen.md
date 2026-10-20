# Task 76 — Leistungsanfragen im Portal (PR 13c.3)

> **Branch:** `feat/crm-leistungsanfragen-3-portal` · **Basis:** 13c.2 gemergt · **Aufwand:** L · **Dateien:** ≈ 75
> **Migration:** eine (nur Permission-Katalog)
> **Zuerst lesen:** Task 74 und 75, `apps/workspace/src/server/portal/AGENTS.md`,
> `apps/workspace/src/app/[locale]/(portal)/AGENTS.md`, `apps/workspace/src/components/portal/AGENTS.md`

Nach dem Merge: Das Widget „Leistung anfragen“ ist echt. Der Kunde wählt eine freigegebene Leistung oder
beschreibt frei, was er braucht, sieht seine Anfragen mit Status und kann eine offene zurückziehen.

**Vorlagen im Code:** Aufbau wie das Stunden-Widget (Task 73: Daten laden mit dem Dashboard) und der
Aufgabenwunsch (`create-customer-request-task.command-handler.ts`, `app/api/portal/[customerId]/tasks/route.ts`,
`components/portal/dashboard/portal-task-request-dialog/`, `client/portal/portal-tasks-api-service.ts`).

## CRM-76-T1 — Katalog

Exakt nach Task 73, T1 (`plans/crm/20-stunden-und-history/73-stunden-im-portal.md`):

```txt
packages/common/src/constants/auth/permissions.ts               + PortalServicesRead "portal.services.read",
                                                                  PortalServicesRequest "portal.services.request"
packages/common/src/constants/auth/permission-definitions.ts    zwei Einträge (Realm Portal, delegable, NOT_SCOPE_ASSIGNABLE);
                                                                  PORTAL_READ_PERMISSION_VALUES + nur PortalServicesRead
packages/common/src/constants/auth/permissions.test.ts, system-role-definitions.test.ts
packages/db/migrations/<nr>_add_portal_service_permissions.sql  Muster 0057_add_portal_hours_permissions.sql
apps/workspace/src/common/constants/access/permission-groups.ts + beide in PermissionGroup.Portal
apps/workspace/src/i18n/dictionaries/workspace/settings/permissions/{de,en}.json
apps/workspace/src/common/constants/portal/portal-access-preview-areas.ts   + { labelKey: PortalWidgetKey.ServiceRequest,
                                                                              requiredPermission: Permission.PortalServicesRead }
apps/workspace/src/i18n/dictionaries/workspace/crm/portal-access/{de,en}.json
apps/workspace/src/server/tests/support/portal-membership-fixture.ts, e2e/support/portal-e2e-database.ts   Rechte prüfen/ergänzen
```

- **Akzeptanz:** `db:smoke:rbac` grün; `portal_standard` enthält beide Rechte in Code und DB; die Owner-Sicht
  trägt nur das Leserecht.

## CRM-76-T2 — Portal-Server

```txt
packages/common/src/constants/portal/portal-service-request-error-codes.ts (+ Test)   NotFound, Validation, LimitReached,
                                                                                      DuplicateOpen, Locked
packages/common/src/constants/portal/portal-service-request-limits.ts (+ Test)        OpenPerCustomer 10, MinRequestedMinutes 60,
                                                                                      MaxRequestedMinutes 6000, HistoryShown 20
packages/common/src/contracts/portal/portal-services.dto.ts
packages/common/src/contracts/portal/portal-requestable-service.dto.ts
packages/common/src/contracts/portal/portal-service-request.dto.ts
packages/common/src/contracts/portal/portal-service-project-option.dto.ts
packages/common/src/contracts/portal/create-portal-service-request.dto.ts
packages/common/src/contracts/portal/results/create-portal-service-request-result.ts
packages/common/src/contracts/portal/results/withdraw-portal-service-request-result.ts
packages/common/src/contracts/portal/portal-services-dto.test.ts                      Typtest: kein Preisfeld (Muster portal-hours-dto.test.ts)

apps/workspace/src/server/portal/services/service-requests/portal-service-request-service.ts
apps/workspace/src/server/portal/services/service-requests/portal-service-request-mapping-service.ts (+ Test)
apps/workspace/src/server/portal/services/service-requests/portal-service-request-schemas.ts
apps/workspace/src/server/portal/services/service-requests/portal-service-request-types.ts
apps/workspace/src/server/portal/query-handler/get-portal-services.query-handler.ts
apps/workspace/src/server/portal/command-handler/create-portal-service-request.command-handler.ts
apps/workspace/src/server/portal/command-handler/withdraw-portal-service-request.command-handler.ts
apps/workspace/src/app/api/portal/[customerId]/service-requests/route.ts                       POST, withPortalActor
apps/workspace/src/app/api/portal/[customerId]/service-requests/[requestId]/withdraw/route.ts  POST, withPortalActor
apps/workspace/src/common/patterns/portal/portal-api-endpoints.ts (+ Test)                     zwei Endpunkte
apps/workspace/src/lib/portal/portal-service-request-api-error.ts   not_found 404, validation 422, limit/duplicate/locked 409
apps/workspace/src/server/tests/portal/service-requests/portal-service-requests.integration.test.ts
apps/workspace/package.json                                          db:smoke:crm + src/server/tests/portal/service-requests
apps/workspace/src/server/portal/AGENTS.md                           Abschnitt „Leistungsanfragen (ab Task 76)“
```

```ts
PortalRequestableServiceDto { id; title; description /* portal_description */; kind: LineItemKind;
  projectMode: LineItemProjectMode; projectIds: string[] /* wählbar für diese Leistung */ }
PortalServiceProjectOptionDto { id; title }
PortalServiceRequestDto { id; title; note; kind; requestedMinutes: number | null;
  projectWish; projectTitle: string | null /* nur portal-sichtbare Projekte */;
  status: ServiceRequestStatus; declineReason: string | null; createdAt: string; canWithdraw: boolean }
PortalServicesDto { services: PortalRequestableServiceDto[]; projects: PortalServiceProjectOptionDto[];
  requests: PortalServiceRequestDto[]; canRequest: boolean }
CreatePortalServiceRequestDto { idempotencyKey: string; lineItemTemplateId: string | null; title: string | null;
  note: string; requestedMinutes: number | null; projectWish: ServiceRequestProjectWish; projectId: string | null }
```

Nie im Portal-DTO: Preis, Preisart, Intervall, interne Beschreibung, Version, Mitglieds- und Mitgliedschafts-IDs,
`decidedBy`, IDs von Projektleistung oder Vorlage in der Anfrage.

**`portalServiceRequestService`** (einzige Definition der Regeln):

- `can(reader, permission)` → `portalCanOn.forReader`.
- `catalogCondition()` → `status = active AND portal_requestable IS TRUE`.
- `requestCondition(reader, permission)` → `portalAccessCondition.forReader` auf `service_requests.customer_id`.
- `selectableProjects(reader, kind)`: Projekte der Firma laut `portalProjectCondition`; für `hours` zusätzlich
  nicht in `HOURS_CLOSED_PROJECT_STATUS_VALUES`; für `feedback_round` nur `status = active`, kein
  `findExtraFeedbackRoundBlocker` und keine offene Zusatzrunden-Anfrage am selben Projekt.

**`getPortalServices(reader): PortalServicesDto | null`** — `null` ohne `portal.services.read`. Lädt Katalog,
Projekt-Optionen, alle offenen Anfragen und die letzten `HistoryShown` abgeschlossenen Anfragen der Firma
(Review-Korrektur vom 12.10.2026). Eine `feedback_round`-Leistung ohne wählbares
Projekt wird nicht angeboten. `canRequest` = Recht `portal.services.request` und keine Owner-Sicht.
`canWithdraw` = `canRequest` und `canTransitionServiceRequest(status, withdrawn, customer)`.

**`createPortalServiceRequest(actor, input)`**:

1. Striktes Schema: unbekannte Felder (`customerId`, `price…`) sind `validation`. Ohne Recht `not_found`.
2. Transaktion; Kundenzeile `FOR NO KEY UPDATE` (Muster `createPortalCredential`).
3. Idempotenz: bestehender Schlüssel derselben Firma → Erfolg mit der bestehenden Zeile; fremde Firma → `validation`.
   Das gilt auch für gleichzeitige Inserts zweier Firmen; Unique-Konflikte werden gezielt abgefangen.
4. Offene Anfragen der Firma ≥ `OpenPerCustomer` → `limit_reached`.
5. Mit `lineItemTemplateId`: Vorlage laut `catalogCondition`, sonst `not_found`; `title` muss `null` sein und wird
   aus der Vorlage übernommen, `kind` ebenso. Ohne: `title` und `note` Pflicht, `kind = standard`.
6. Menge: bei `hours` Pflicht, Vielfaches von 15 zwischen Min und Max; sonst muss sie `null` sein.
7. Projekt: `existing` → `projectId` muss in `selectableProjects(actor, kind)` liegen, sonst `validation`
   (nie eine Antwort, die eine fremde ID bestätigt). `new` nur bei Freitext oder Vorlagenbezug `new_project`.
   `undecided` nur bei Freitext oder wenn für die Leistung kein Projekt wählbar ist. Bei `feedback_round` ist
   `existing` Pflicht; eine offene Zusatzrunden-Anfrage am selben Projekt → `duplicate_open`.
8. Insert (`status = requested`, `version = 1`, alle Felder explizit), dann
   `serviceRequestEventService` (`created`, Systemnachricht `ServiceRequested` mit dem Titel).
9. Antwort der Route: `{ created: true }` (wie beim Aufgabenwunsch).

**`withdrawPortalServiceRequest(actor, requestId)`**: Zeile der eigenen Firma `FOR UPDATE`, sonst `not_found`;
bereits `withdrawn` → Erfolg ohne Write; kein erlaubter Übergang → `locked`; sonst `updateLockedVersioned`
(`status`, `decided_at`) und Event.

- **Akzeptanz (Integration mit echten Portal-Sessions, `createPortalSessionFixture`):**
  - Katalog enthält nur aktive, freigegebene Vorlagen; Archivieren entfernt sie sofort
  - serialisierte Antwort von `getPortalServices` enthält keinen der Schlüssel `priceCents`, `pricingMode`,
    `recurringInterval`, `version`, `membershipId`, `decidedByMemberId`
  - Kontakt der Firma B: sieht nie Anfragen von A; Anlegen mit Projekt von A → `validation`; Zurückziehen einer
    Anfrage von A → `not_found`
  - ohne `portal.services.request` → Anlegen `not_found`; ohne `.read` → `getPortalServices` ist `null`
  - derselbe `idempotencyKey` zweimal → genau eine Zeile, eine Systemnachricht
  - elfte offene Anfrage → `limit_reached`
  - Stunden ohne Menge, Menge 20, Menge an Standard-Leistung → `validation`
  - zweite Zusatzrunden-Anfrage am selben Projekt → `duplicate_open`; abgenommenes Projekt ist nicht wählbar
  - Zurückziehen aus `offered` → `locked`; zweimal aus `requested` → beide Male Erfolg, ein Event
  - Owner-Sicht (`createPortalOwnerView`) liest, `canRequest` ist `false`

## CRM-76-T3 — Widget, Dialog, Feedback-Verweis

Skills: `frontend-design`, `impeccable`, `copywriting` (DE in Du-Form, ohne Fachjargon).

```txt
apps/workspace/src/common/constants/portal/portal-widget-layout.ts (+ Test)    ServiceRequest: mock: false,
                                                                               requiredPermission: Permission.PortalServicesRead
apps/workspace/src/common/patterns/portal/list-visible-portal-widgets.test.ts  angepasst
apps/workspace/src/common/constants/portal/portal-dashboard-query-params.ts (+ Test)   + Service ("service")
apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/page.tsx          showsServices → getPortalServices
apps/workspace/src/components/portal/dashboard/portal-dashboard/portal-dashboard.tsx (+ Test)   echtes Widget statt mockDialog
apps/workspace/src/components/portal/dashboard/portal-widget-dialog-host/portal-widget-dialog-host.tsx   + Dialog; Mock-Zweig entfällt
apps/workspace/src/components/portal/dashboard/widgets/portal-service-request-widget/
apps/workspace/src/components/portal/service-requests/portal-service-request-dialog/     Orchestrator
apps/workspace/src/components/portal/service-requests/portal-service-picker/             Karten + „Etwas anderes“
apps/workspace/src/components/portal/service-requests/portal-service-request-form/       Projekt, Menge, Text
apps/workspace/src/components/portal/service-requests/portal-service-request-list/       eigene Anfragen, Zurückziehen
apps/workspace/src/common/patterns/portal/portal-service-request-form.ts (+ Test)        Formularwerte ↔ Request, Projektfrage je Leistung
apps/workspace/src/common/patterns/portal/portal-service-request-error-text.ts
apps/workspace/src/common/contracts/portal/portal-service-request-form-values.ts
apps/workspace/src/client/portal/portal-service-requests-api-service.ts (+ Test)
apps/workspace/src/i18n/dictionaries/portal/service-requests/{de,en}.json
apps/workspace/src/i18n/dictionaries/portal/index.ts                           + getPortalServiceRequestsDictionary
apps/workspace/src/i18n/dictionaries/portal/dashboard/{de,en}.json             widgets.serviceRequest: teaser/upcoming raus, echte Texte
apps/workspace/src/components/portal/feedback/feedback-quota-notice/           + requestHref
apps/workspace/src/i18n/dictionaries/portal/feedback/{de,en}.json              states.exhausted: Text und Link „Zusätzliche Runde anfragen“
apps/workspace/src/components/portal/AGENTS.md                                 Abschnitt „Leistungsanfragen (ab Task 76)“
```

Gibt es danach keinen Registry-Eintrag mit `mock: true` mehr, werden `portal-mock-widget`,
`portal-mock-dialog-content` und `portal-mock-preview` samt Tests und `content.mock`-Texten entfernt (per Grep
prüfen, nicht annehmen).

- **Seite** (`page.tsx`, Muster `showsHours`): `services` und `getPortalServiceRequestsDictionary(locale)` gehen als
  Props an `PortalDashboard`. Das Widget ist sichtbar, sobald das Leserecht da ist (`onlyWithContent: false`).
- **Widget** (`COMPACT_ROW`, `order: 30` bleibt): Titel „Leistung anfragen“, ein Satz Nutzen, Button
  „Leistung anfragen“ (`?widget=serviceRequest`). Mit offenen Anfragen darunter „2 Anfragen in Bearbeitung“ und
  der Stand der neuesten als Text. In der Owner-Sicht ist der Button deaktiviert und verweist ins CRM.
- **Dialog** (`DialogSize.Wide`), zwei Bereiche über Tabs „Anfragen“ / „Meine Anfragen (n)“:
  1. **Auswahl** (`portal-service-picker`): Karten mit Titel und Kundentext, Arten mit eigenem Font-Awesome-Symbol
     (Stunden `faClock`, Zusatzrunde `faComments`, Standard `faCirclePlus`), zuletzt immer „Etwas anderes“. Kein
     Preis, kein „ab …“. Die gewählte Leistung steht in der URL (`?service=<id>` bzw. `custom`, über
     `history.replaceState`); so öffnet ein Link direkt das Formular.
  2. **Formular** (`portal-service-request-form`), je nach Leistung:
     - Vorlagenbezug `existing_project`: „Für welches Projekt?“ als Radiogruppe; bei genau einem Projekt entfällt
       die Frage und der Titel steht als Text da; ohne wählbares Projekt entfällt sie (Wunsch `undecided`).
     - Vorlagenbezug `new_project`: Hinweis „Das wird ein eigenes Projekt. Wir melden uns mit einem Angebot.“
     - Stunden: Mengenwahl in ganzen Stunden (Stepper + Schnellwahl 5 / 10 / 20), Hinweis „Die Stunden stehen
       dir zur Verfügung, sobald wir deine Anfrage bestätigt haben.“
     - Freitext: „Worum geht es?“ (Titel), „Beschreibe kurz, was du brauchst“ (Pflicht), Projektfrage mit
       „Neues Vorhaben“ und „Weiß ich noch nicht“.
     - Immer: optionale Notiz (bei Freitext die Pflichtbeschreibung), Satz „Unverbindlich — du bekommst zuerst
       ein Angebot.“, Button „Anfrage senden“. Der `idempotencyKey` entsteht einmal beim Öffnen des Formulars.
       Während des Sendens bleiben Auswahlwechsel, Tabs und Schließen gesperrt. Bei einem Fehler wird entsperrt;
       Wiederholen im selben Formular behält den Schlüssel. Nach externer Navigation werden späte Antworten ignoriert.
  3. **Bestätigung:** „Deine Anfrage ist bei uns.“ mit „Weitere Leistung anfragen“ und „Meine Anfragen ansehen“;
     danach `router.refresh()`.
  4. **Meine Anfragen** (`portal-service-request-list`): Titel, Datum, Projekt, Status als Badge mit Text —
     „Eingegangen“, „Angebot unterwegs“, „Bestätigt“, „Abgelehnt“ (mit Grund), „Zurückgezogen“.
     „Zurückziehen“ nur mit `canWithdraw`, mit Bestätigungsdialog.
- **Empty-States (drei unterscheidbare Texte):** nichts freigegeben (nur „Etwas anderes“ plus Erklärung), noch
  nichts angefragt, Owner-Sicht ohne Schreibrecht.
- **Feedback-Seite:** Bei erschöpftem Kontingent verweist `FeedbackQuotaNotice` auf
  `?widget=serviceRequest&service=<id der Zusatzrunden-Leistung>&project=<projektId>`, wenn `getPortalServices`
  für dieses Projekt eine `feedback_round`-Leistung anbietet und `canRequest` gilt; sonst bleibt der Chat-Link.
- Kundentext und Ablehnungsgrund werden nur als Text gerendert. Clientzustand über `key={customerId}`.

- **Akzeptanz (jsdom + Dashboard-Tests):** kein „Bald verfügbar“ mehr am Widget; ohne Leserecht fehlt es; genau
  ein Projekt → keine Projektfrage; Stunden ohne Menge sendet nicht; Request enthält nie ein Preisfeld;
  Owner-Sicht hat keinen aktiven Sende-Button; Status steht als Text; DE und EN vollständig, DE in Du-Form.

## CRM-76-T4 — E2E

```txt
apps/workspace/e2e/portal-services.e2e.ts
apps/workspace/playwright.portal.config.ts            testMatch um `services` erweitern
apps/workspace/e2e/support/portal-e2e-database.ts     Fixture: freigegebene Vorlagen (alle Arten), zwei Firmen
apps/workspace/e2e/portal-dashboard.e2e.ts            Erwartung am bisherigen Mock-Widget anpassen
```

Vorlage `e2e/portal-hours.e2e.ts`: Kontakt fragt eine Katalogleistung an und sieht sie unter „Meine Anfragen“;
Freitext mit „Neues Vorhaben“; Kontakt einer zweiten Firma sieht nichts davon; anonymer POST → 404; Zurückziehen.

## Deploy-Sicherheit 13c.3

1. **Sichtbar:** Das Widget ist echt. `portal_standard` wächst um zwei Rechte; jeder bestehende Kontakt kann ab dem
   Deploy anfragen. Freigegeben ist zunächst keine Vorlage — bis zur ersten Freigabe gibt es nur „Etwas anderes“.
2. **Vor dem Merge prüfen:** Kundentexte und Preis der Zusatzrunden-Vorlage gepflegt, bevor etwas freigegeben wird.
3. **Rollback:** Folge-PR stellt den Registry-Eintrag auf `mock: true` zurück und nimmt beide Rechte aus
   `portal_standard` (Code **und** Migration, sonst bricht `db:smoke:rbac`). Tabelle und Anfragen bleiben intern
   lesbar.
