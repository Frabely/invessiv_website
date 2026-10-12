# Task 75 — Leistungsanfragen intern (PR 13c.2)

> **Branch:** `feat/crm-leistungsanfragen-2-intern` · **Basis:** 13c.1 gemergt · **Aufwand:** L · **Dateien:** ≈ 85
> **Migration:** eine (Tabelle, Unique-Index, zwei Permissions)
> **Zuerst lesen:** Task 74, `apps/workspace/src/server/workspace/crm/AGENTS.md`,
> `apps/workspace/src/server/shared/AGENTS.md`, `apps/workspace/src/components/workspace/crm/AGENTS.md`,
> `apps/workspace/src/app/[locale]/(app)/crm/AGENTS.md`

Nach dem Merge: Anfragen (bis 13c.3 nur aus Seed und Tests) erscheinen im Kunden-Cockpit und im Eingang und
lassen sich als „Angebot gesendet“ markieren, ablehnen oder annehmen. Ohne Anfragen fehlt die Cockpit-Sektion;
der Eingang erklärt im Empty-State seinen Zweck.

**Vorlagen im Code:** Eingang und Zähler nach `feedback-inbox` (`app/[locale]/(app)/crm/feedback/page.tsx`,
`components/workspace/crm/feedback-rounds/feedback-inbox*/`, `count-unread-feedback-rounds.query-handler.ts`,
Einbindung in `app/[locale]/(app)/layout.tsx` und `workspace-sidebar.tsx`); Statusbefehl nach
`change-feedback-round-status.command-handler.ts`; Sektion nach `hours/customer-hours-section`.

## CRM-75-T1 — Schema, Katalog, Contracts

```txt
packages/db/migrations/<nr>_create_service_requests.sql
packages/db/src/record-configuration/crm/service-requests.ts                  + Export im Barrel crm/index.ts
packages/db/src/record-configuration/crm/portal-memberships.ts                + uniqueIndex (id, customer_id)
packages/db/src/constraint-names/crm/service-requests-constraint-names.ts     neu
packages/db/src/constraint-names/crm/portal-memberships-constraint-names.ts   + IdCustomerUnique
packages/db/scripts/crm-smoke/service-request-checks.ts                       neu, inkl. runMissingDefaultChecks
packages/db/scripts/crm-fixture/seed-service-requests.ts                      neu; in seed-crm-fixture.ts aufrufen
packages/db/src/record-configuration/crm/AGENTS.md                            Abschnitt „Leistungsanfragen (Ordner 13c)“

packages/common/src/constants/auth/permissions.ts                    + ServiceRequestsRead, ServiceRequestsWrite (Objekt und VALUES)
packages/common/src/constants/auth/permission-definitions.ts         Realm Workspace, delegable, scopable, CUSTOMER_ONLY
packages/common/src/constants/auth/permissions.test.ts, system-role-definitions(.test).ts   angepasst
packages/common/src/constants/crm/service-request-statuses.ts        ServiceRequestStatus + VALUES + OPEN_SERVICE_REQUEST_STATUS_VALUES
packages/common/src/constants/crm/service-request-project-wishes.ts  ServiceRequestProjectWish { Existing, New, Undecided }
packages/common/src/constants/crm/service-request-transition-sides.ts    { Internal, Customer }
packages/common/src/constants/crm/service-request-transitions.ts     SERVICE_REQUEST_TRANSITIONS
packages/common/src/constants/crm/forms/service-request-field-limits.ts  TitleMaxLength 160, NoteMaxLength 2000, DeclineReasonMaxLength 500
packages/common/src/constants/crm/errors/service-request-error-codes.ts
packages/common/src/constants/crm/system-message-keys.ts             + ServiceRequested, ServiceRequestOffered, ServiceRequestAccepted,
                                                                       ServiceRequestDeclined, ServiceRequestWithdrawn; Param ServiceTitle
packages/common/src/patterns/crm/service-request-state.ts            canTransitionServiceRequest(from, to, side) + Test
packages/common/src/contracts/crm/service-requests/service-request.dto.ts
packages/common/src/contracts/crm/service-requests/service-request-inbox.dto.ts
packages/common/src/contracts/crm/service-requests/change-service-request-status-request.dto.ts
packages/common/src/contracts/crm/service-requests/accept-service-request-request.dto.ts
packages/common/src/contracts/crm/service-requests/accept-service-request-project-target.dto.ts
packages/common/src/contracts/crm/service-requests/accept-service-request-template-source.dto.ts
packages/common/src/contracts/crm/service-requests/accept-service-request-line-item.dto.ts
packages/common/src/contracts/crm/results/change-service-request-status-result.ts
packages/common/src/contracts/crm/rows/service-request-row.ts
```

Übergänge (`SERVICE_REQUEST_TRANSITIONS`, eine Tabelle für beide Welten):

| von         | nach        | Seite    |
| ----------- | ----------- | -------- |
| `requested` | `offered`   | internal |
| `requested` | `accepted`  | internal |
| `requested` | `declined`  | internal |
| `offered`   | `accepted`  | internal |
| `offered`   | `declined`  | internal |
| `requested` | `withdrawn` | customer |
| `offered`   | `withdrawn` | customer |
| `offered`   | `withdrawn` | internal |

Fehlercodes: `SERVICE_REQUEST_NOT_FOUND` (404), `VALIDATION_ERROR` (422), `INVALID_TRANSITION` (409),
`VERSION_CONFLICT` (409 mit `VersionConflictDto`), `OFFER_REQUIRED` (409, Nachtrag 12.10.2026), `KIND_MISMATCH` (422), `TEMPLATE_NOT_ASSIGNABLE` (409),
`PROJECT_NOT_FOUND` (404), `EFFECT_NOT_PERMITTED` (403), `PROJECT_CLOSED` (409),
`FEEDBACK_ROUND_NOT_AVAILABLE` (409), `INTERNAL` (500).

```ts
ServiceRequestDto {
  id; customerId; customerDisplayName; customerNumber;
  lineItemTemplateId: string | null; kind: LineItemKind; title; note;
  requestedMinutes: number | null;
  projectWish: ServiceRequestProjectWish; requestedProjectId: string | null; requestedProjectTitle: string | null;
  requestedByName: string;            // Kontaktname über loadPortalContactNames (server/shared/services)
  status: ServiceRequestStatus; declineReason: string | null;
  offeredAt: string | null; decidedAt: string | null;
  projectId: string | null; projectLineItemId: string | null;
  version: number; createdAt: string;
}
ChangeServiceRequestStatusRequestDto =
  | { to: "offered"; version: number }
  | { to: "declined"; version: number; reason: string }
AcceptServiceRequestRequestDto {
  version: number;
  project: { mode: "existing"; projectId: string } | { mode: "new"; project: CreateProjectRequestDto };
  template: { mode: "existing"; lineItemTemplateId: string } | { mode: "new"; template: CreateLineItemTemplateRequestDto };
  lineItem: { title; description; priceCents; pricingMode; recurringInterval; status; quantityMinutes: number | null };
}
```

Jedes DTO-Feld bekommt einen Docstring (`packages/common/AGENTS.md`). Migration der Permissions wie in
`0056_create_hours.sql` (Owner- und Member-Rolle).

- **Akzeptanz:** `db:smoke:crm` (Constraints, fehlende Fachwerte abgewiesen, fremdes Projekt und fremde
  Mitgliedschaft über die zusammengesetzten Schlüssel unmöglich), `db:smoke:rbac` grün; `db:seed:crm` legt je
  Status eine Anfrage an (Katalog, Freitext, Stunden, Zusatzrunde).

## CRM-75-T2 — Lesen: Cockpit, Eingang, Zähler

```txt
apps/workspace/src/server/workspace/crm/services/service-requests/service-request-access-service.ts   condition, lock, columns
apps/workspace/src/server/workspace/crm/services/service-requests/service-request-mapping-service.ts
apps/workspace/src/server/workspace/crm/services/service-requests/service-request-schemas.ts
apps/workspace/src/server/workspace/crm/services/service-requests/service-request-types.ts
apps/workspace/src/server/tests/workspace/crm/services/service-request-mapping-service.test.ts
apps/workspace/src/server/workspace/crm/query-handler/list-customer-service-requests.query-handler.ts
apps/workspace/src/server/workspace/crm/query-handler/list-service-request-inbox.query-handler.ts
apps/workspace/src/server/workspace/crm/query-handler/count-open-service-requests.query-handler.ts
apps/workspace/src/common/constants/crm/service-request-inbox-query-params.ts (+ Test)
apps/workspace/src/common/patterns/crm/service-request-inbox-query.ts (+ Test)        Filter „Offen“ (Standard) / „Alle“
apps/workspace/src/lib/auth/routes.ts                                                 + crmServiceRequestsPathFor(locale)
apps/workspace/src/app/[locale]/(app)/crm/service-requests/page.tsx                   Gate canAnywhere(actor, ServiceRequestsRead)
apps/workspace/src/app/[locale]/(app)/layout.tsx                                      openServiceRequestCount, canOpenCrmServiceRequests
apps/workspace/src/components/workspace/workspace-sidebar/workspace-sidebar.tsx       Eintrag „Leistungsanfragen“ (faBellConcierge) mit Zähler
apps/workspace/src/lib/workspace/crm/service-requests-view-model.ts                   buildServiceRequestsViewModel
apps/workspace/src/lib/workspace/crm/load-customer-cockpit.ts                         + serviceRequestsViewModel
apps/workspace/src/common/patterns/crm/customer-dialog-query.ts                       + readCockpitServiceRequestId, Href-Parameter
apps/workspace/src/components/workspace/crm/service-requests/customer-service-requests-section/
apps/workspace/src/components/workspace/crm/service-requests/service-request-details/        Inhalt einer Anfrage (StatusRow im Cockpit, Zitat im Annahme-Dialog)
apps/workspace/src/components/workspace/crm/service-requests/service-request-kind-badge/
apps/workspace/src/components/workspace/crm/service-requests/service-request-inbox-table/    DataTableLayout
apps/workspace/src/components/workspace/crm/service-requests/service-request-inbox-row/
apps/workspace/src/components/workspace/crm/shared/list-page-header/
apps/workspace/src/components/workspace/crm/service-requests/service-request-status-badge/
apps/workspace/src/components/workspace/crm/service-requests/service-request-inbox/
apps/workspace/src/components/workspace/crm/service-requests/service-request-inbox-toolbar/
apps/workspace/src/components/workspace/crm/detail/customer-cockpit-view/customer-cockpit-view.tsx   Sektion einhängen
apps/workspace/src/i18n/dictionaries/workspace/crm/service-requests/{de,en}.json
apps/workspace/src/i18n/dictionaries/workspace/crm/index.ts                           + getCrmServiceRequestsDictionary
apps/workspace/src/i18n/dictionaries/workspace/page/{de,en}.json                      Sidebar-Texte
apps/workspace/src/i18n/dictionaries/workspace/settings/permissions/{de,en}.json      zwei Permissions
apps/workspace/src/common/constants/access/permission-groups.ts                       beide in die CRM-Gruppe der Projektleistungen
```

- Zugriff: `crmAccessCondition` über `service_requests.customer_id` mit `service_requests.read`; ein Kunde außerhalb
  des Zugriffsbereichs ergibt eine leere Liste. Der Zähler zählt `status = requested` unter derselben Bedingung.
- **Cockpit-Sektion** in der Kundenspalte direkt **vor** „Dateien“: Kopf nach dem Abschnittsmuster (Titel · Anzahl
  offener Anfragen · Toggle über `shared/section-collapse-toggle`). Sie wird nur gerendert, wenn die Page ein
  View-Model übergibt (Leserecht) **und** der Kunde mindestens eine Anfrage hat. Offene Anfragen oben, erledigte
  darunter eingeklappt („Erledigt (n)“).
- **Zeile im Cockpit (`StatusRow` + `service-request-details`):** Titel, Art-Badge, Status-Badge (Text + Symbol), Kontakt und Datum, Kundentext (nur als Text),
  Wunsch: Projekt-Titel / „Neues Vorhaben“ / „Noch offen“, bei Stunden „5:00 angefragt“. Erledigt: Ergebnis mit
  Link zum Projekt (`buildCustomerCockpitHref`) bzw. Ablehnungsgrund.
- **Eingang:** Liste über alle Kunden im Zugriffsbereich, Kundenname und -nummer (`formatCustomerNumber`) je Tabellenzeile (`DataTableLayout`),
  Filter und Seite (`page`, 25 je Seite, serverseitig geblättert) als URL-State, der Titel der Zeile verlinkt ins Cockpit mit `serviceRequest=<id>` (Sektion aufgeklappt, Zeile markiert).
  Bearbeitet wird ausschließlich im Cockpit. Zwei Empty-States: „Noch keine Anfrage“ (erklärt: Kunden fragen im
  Portal an) und „Keine offene Anfrage“ (Link „Alle anzeigen“).

- **Akzeptanz:** Integration `service-requests.integration.test.ts`: Projekt-/Kundenbindung zeigt nur eigene
  Kunden; ohne Recht leere Liste und Zähler 0; fremde ID im Cockpit-Parameter öffnet nichts. jsdom: beide
  Empty-States unterscheidbar, Status nie nur als Farbe.

## CRM-75-T3 — Schreiben: Angebot, Ablehnen, Annehmen

```txt
apps/workspace/src/server/shared/services/service-request/service-request-event-service.ts   Activity + Systemnachricht je Übergang
apps/workspace/src/server/workspace/crm/services/insert-project.ts                    aus create-project.command-handler.ts extrahiert
apps/workspace/src/server/workspace/crm/services/insert-line-item-template.ts         aus create-line-item-template… extrahiert
apps/workspace/src/server/workspace/crm/command-handler/create-project.command-handler.ts          nutzt insertProject
apps/workspace/src/server/workspace/crm/command-handler/create-line-item-template.command-handler.ts   nutzt insertLineItemTemplate
apps/workspace/src/server/workspace/crm/command-handler/change-service-request-status.command-handler.ts
apps/workspace/src/server/workspace/crm/command-handler/accept-service-request.command-handler.ts
apps/workspace/src/app/api/workspace/crm/service-requests/[requestId]/status/route.ts   PATCH
apps/workspace/src/app/api/workspace/crm/service-requests/[requestId]/accept/route.ts   POST
apps/workspace/src/common/constants/api-endpoints.ts bzw. common/patterns/crm/crm-api-endpoints.ts (+ Test)   zwei Endpunkte
apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts                 + ServiceRequestStatusChange, ServiceRequestAccept
                                                                                        (ServiceRequestsWrite, scope "customer")
apps/workspace/src/lib/workspace/crm/service-request-api-error.ts
apps/workspace/src/client/crm/service-requests-api-service.ts (+ Test)
apps/workspace/src/common/patterns/crm/service-requests/service-request-accept-form.ts (+ Test)
apps/workspace/src/common/patterns/crm/service-requests/service-request-error-text.ts (+ Test)
apps/workspace/src/common/contracts/crm/service-request-accept-form-values.ts
apps/workspace/src/components/workspace/crm/service-requests/service-request-actions/
apps/workspace/src/components/workspace/crm/service-requests/service-request-accept-dialog/
apps/workspace/src/components/workspace/crm/service-requests/service-request-decline-dialog/
apps/workspace/src/i18n/dictionaries/workspace/crm/messages/{de,en}.json              fünf Systemnachrichten
apps/workspace/src/i18n/dictionaries/portal/messages/{de,en}.json                     dieselben fünf (Du-Form)
apps/workspace/src/server/tests/workspace/crm/service-requests.integration.test.ts
apps/workspace/package.json                                                           db:smoke:crm + die neue Testdatei
apps/workspace/src/server/workspace/crm/AGENTS.md, src/server/shared/AGENTS.md, components/workspace/crm/AGENTS.md
```

`insertProject` und `insertLineItemTemplate` sind benannte Helfer ohne `Service`-Suffix (eine wiederverwendete
Funktion, `src/server/AGENTS.md`); sie nehmen eine Transaktion und bereits validierte Daten und prüfen keine
Rechte. `serviceRequestEventService` liegt bewusst schon unter `server/shared/`, weil 13c.3 ihn aus dem Portal
aufruft (Planvorgabe, wie beim Bogen-Read-Service). Activities nutzen bestehende Typen (`created`,
`status_change`) mit `metadata.entity = "service_request"`, ohne Titel, Kundentext oder Grund. Systemnachrichten
laufen über `announceSystemMessage` mit `SystemMessageParam.ServiceTitle`.

**`changeServiceRequestStatus(requestId, input, actor)`**: Schema nach `to` diskriminiert; Zeile über
`serviceRequestAccessService.lock` (`FOR UPDATE`, Bedingung mit `service_requests.write`, Fehlgriff = 404);
`canTransitionServiceRequest` **vor** der Version; Version unter der Sperre (409 mit aktueller Anfrage);
`updateLockedVersioned`: `offered` setzt `offered_at`, `declined` setzt `decline_reason`, `decided_at`,
`decided_by_member_id`. Danach Event.

**`acceptServiceRequest(requestId, input, actor)`** — eine Transaktion, in dieser Reihenfolge:

1. Parsen; Anfrage sperren (wie oben), Übergang, Version.
2. **Vorlage:** `existing` → aktiv, sonst `TEMPLATE_NOT_ASSIGNABLE`. `new` → nur bei `request.kind = standard`
   und mit `can(actor, LineItemTemplatesWrite)` (sonst `EFFECT_NOT_PERMITTED`), validiert über
   `lineItemTemplateSchemas.create`, angelegt über `insertLineItemTemplate` mit `kind = standard` und
   `portal_requestable = false`. Die Art der gewählten Vorlage muss der Art der Anfrage entsprechen
   (`KIND_MISMATCH`).
3. **Projekt:** `existing` → Projekt desselben Kunden mit `canOn(actor, ProjectLineItemsWrite, { customerId,
projectId })`, sonst `PROJECT_NOT_FOUND`. `new` → nur bei Art `standard`, mit
   `canOn(actor, ProjectsWrite, { customerId })`, validiert über `projectSchemas.create`, angelegt über
   `insertProject` (Owner = Kunden-Owner, wie `createProject`); zusätzlich `canOn(ProjectLineItemsWrite)` am
   Kunden, sonst `EFFECT_NOT_PERMITTED`.
4. **Zuweisen:** `projectLineItemAssignmentService.assign(tx, …)` aus Task 74; dessen Fehlercodes werden 1:1
   durchgereicht. Die Transaktion rollt bei jedem Fehler vollständig zurück (auch das neue Projekt und die neue
   Vorlage).
5. Anfrage über `updateLockedVersioned`: `status = accepted`, `decided_at`, `decided_by_member_id`, `project_id`,
   `project_line_item_id`.
6. Event (`ServiceRequestAccepted`).

Idempotenz: Die Zeilensperre plus Übergangsprüfung macht eine zweite Annahme zu `INVALID_TRANSITION`; Stunden und
Runde entstehen deshalb nie doppelt.

**Annahme-Dialog** (`DialogSize.Wide`, `useVersionedMutation`; Skills `frontend-design`, `impeccable`,
`copywriting`):

1. **Kopf (lesend):** Anfrage wie in der Cockpit-Zeile, Kundentext vollständig.
2. **Projekt:** Radiogruppe „Bestehendes Projekt“ (Select der beschreibbaren Projekte, vorbelegt mit dem
   Wunschprojekt) / „Neues Projekt anlegen“ (Feld Titel, vorbelegt mit dem Anfragetitel; Hinweis
   „Standard-Ablauf mit zwei Feedbackrunden, später im Projekt-Editor änderbar“). Vorauswahl: `projectWish = new`
   oder Vorlagenbezug `new_project` → „Neues Projekt“. Bei den Arten Stunden und Zusatzrunde fehlt
   „Neues Projekt“. Der Request entsteht über `toCreateProjectRequest(createProjectFormValues(null, defaultPlan))`
   aus `common/patterns/crm/project-form.ts`; `defaultPlan` kommt wie beim Projekt-Editor aus dem View-Model.
3. **Leistung:** Katalog-Anfrage → Vorlage steht fest (ist sie archiviert oder gelöscht: Auswahl einer aktiven
   Vorlage derselben Art). Freitext → Radiogruppe „Bestehende Vorlage“ (Select) / „Neue Vorlage im Katalog
   anlegen“ (nur mit `line_item_templates.write`). Darunter die Angebotsfelder über die bestehenden
   `LineItemFields` (`common/patterns/crm/line-item-fields-form.ts`), vorbelegt aus der Vorlage bzw. bei „Neue
   Vorlage“ aus Titel und Text der Anfrage; der Preis ist dann leer und Pflicht. Bei Stunden zusätzlich
   `hours/duration-field`, vorbelegt mit der angefragten Menge, und der Hinweis aus Task 74.
4. **Fuß:** „Annehmen und zuweisen“. Ein Konflikt übernimmt den aktuellen Stand und behält die Eingaben; jeder
   Fehlercode erscheint als Text über `service-request-error-text.ts`. Nach Erfolg `router.refresh()`.

**Aktionen an der Zeile** (`service-request-actions`, nur mit Schreibrecht und nur die Ziele aus
`canTransitionServiceRequest`): Im Status `requested` ist „Angebot gesendet“ (direkt, `useVersionedCommand`) die
Hauptaktion, „Ohne Angebot annehmen“ steht als Nebenaktion daneben und verlangt im Dialog eine ausdrückliche
Bestätigung, die als `acceptWithoutOffer` an den Server geht (sonst `OFFER_REQUIRED`). Im Status `offered` ist „Kunde hat zugesagt“ die Hauptaktion. „Ablehnen“ gibt es in beiden
(Nachtrag vom 12.10.2026, siehe README).
Der Ablehnen-Dialog verlangt den Grund und kennzeichnet ihn: „Der Kunde sieht diesen Text.“

- **Akzeptanz (Integration):**
  - Katalog-Anfrage, bestehendes Projekt → Leistung im Projekt, Anfrage `accepted` mit beiden Verweisen, eine
    Activity, eine Systemnachricht
  - Freitext + neue Vorlage + neues Projekt → drei neue Zeilen; scheitert die Zuweisung, existiert **keine** davon
  - Stunden-Anfrage 5:00, intern auf 4:00 korrigiert → Kaufzeile 240 Minuten
  - Zusatzrunden-Anfrage an abgenommenem Projekt → `FEEDBACK_ROUND_NOT_AVAILABLE`, Anfrage bleibt `requested`
  - zweite Annahme → `INVALID_TRANSITION`, keine zweite Kaufzeile
  - veraltete Version → 409 mit aktueller Anfrage
  - Ablehnen ohne Grund → 422; `offered → declined` möglich; `accepted → declined` → `INVALID_TRANSITION`
  - Mitglied mit Rolle an Kunde B bearbeitet Anfrage von Kunde A → 404 (Status **und** Annahme)
  - Stunden-Anfrage ohne `hours.manage` → `EFFECT_NOT_PERMITTED`, nichts geschrieben
  - Activity-Metadaten enthalten weder Titel noch Kundentext noch Grund

## Deploy-Sicherheit 13c.2

1. **Sichtbar:** Sidebar-Eintrag „Leistungsanfragen“ mit leerem Eingang; Cockpit unverändert, solange keine
   Anfrage existiert.
2. **Bricht nichts:** neue Tabelle, ein zusätzlicher Unique-Index, zwei Permissions. `create-project` und
   `create-line-item-template` verhalten sich unverändert (bestehende Tests bleiben grün).
3. **Rollback:** Code-Revert; Tabelle und Permissions bleiben (Katalog-Gate `db:smoke:rbac` beachten: Permissions
   nicht aus dem Code entfernen, sondern Sidebar-Eintrag und Routen zurücknehmen).
