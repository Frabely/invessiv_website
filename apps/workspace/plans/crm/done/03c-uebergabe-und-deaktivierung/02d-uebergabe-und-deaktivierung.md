# Task 02d — Mitglieder aktivieren und deaktivieren

> **Merge-Einheit:** Ordner 03c · **Branch:** `feat/crm-uebergabe-und-deaktivierung`
> **Aufwand:** M · **Abhängigkeit:** Task 02c (Ordner 03b) gemerged
> **Migration:** `0026_extend_security_events_for_member_lifecycle.sql` (additive Erweiterung der
> `security_events`-CHECK-Constraint)

## Umsetzungsfortschritt

- [x] **T1:** Konstanten, Contracts und additive Security-Event-Migration
- [x] **T2:** Exhaustive Zuständigkeitsprüfung und Customer-Counter
- [x] **T3:** Aktivieren und Deaktivieren mit allen Invarianten
- [x] **T4:** Route und Client-Service
- [x] **T5:** Settings-UI mit DE/EN und Dialogtests
- [x] **T6:** DB-Integration, vollständige Qualitäts-Gates und Review-Dokumentation

Die Liste wird nach jedem abgeschlossenen, getesteten Review-Schnitt aktualisiert. Ein Haken bedeutet, dass der
zugehörige Code und seine fokussierten Tests vorliegen; die übergreifende Abnahme bleibt bis T6 offen.

## Kontext und Schnitt

Ordner 03b verwaltet Mitglieder, Rollen und Owner-Zuweisungen, bietet aber bewusst keinen Pfad zur Deaktivierung.
Dieser Task ergänzt einen eigenständig nutzbaren Mitglieder-Lifecycle: Ein berechtigter Nutzer kann andere Mitglieder
deaktivieren und später reaktivieren. Selbstdeaktivierung, der Verlust des letzten aktiven Owners und verwaiste offene
Zuständigkeiten werden verhindert.

Die erste besitzbare Entität ist `customer`, deren Tabelle seit Ordner 01 besteht. Vor Ordner 04 gibt es jedoch noch
keinen produktiven Kundenflow und damit keinen sinnvoll prüfbaren Übergabe-Dialog. 03c implementiert deshalb nur die
sicherheitsrelevante, exhaustive **Zuständigkeitsprüfung**. Der einzelne Customer-Owner-Wechsel folgt erst im
[Ordner 20a](../20a-kundenzustaendigkeit/08a-kundenverantwortung.md), die domänenübergreifende Übergabe in
[Ordner 22a](../22a-kundenorganisation-und-uebergabe/02f-zustaendigkeitsuebergabe.md).

Dieser Zwischenstand bleibt sicher: Ein Mitglied mit offenen Kunden kann nicht deaktiviert werden. Nach Ordner 04
bleibt diese Sperre bestehen; Ordner 20a ergänzt die einzelne Kundenzuweisung, Ordner 22a später die komfortable
vollständige Übergabe aller dann vorhandenen Zuständigkeiten.

## Entscheidungen

| Bereich                | Entscheidung                                                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Autorisierung          | Die Mutation läuft über `members.manage`; Rollenbezeichnungen oder Client-Flags autorisieren nie.                                                                                                                        |
| Mitglieds-ID           | URL und Contract verwenden ausschließlich `workspace_members.id`, nie Clerk-ID, E-Mail oder `users.id`.                                                                                                                  |
| Contract               | `PATCH /api/workspace/members/[id]` erhält `{ active, version }`; derselbe Zielzustand ist ein fachlicher 409-Konflikt und erzeugt keinen Write und kein Event.                                                          |
| Selbstschutz           | Niemand deaktiviert sich selbst. Es gibt keinen Sonderweg zur eigenen Reaktivierung.                                                                                                                                     |
| Owner-Schutz           | Vor jeder Deaktivierung werden über `workspaceOwnerInvariantService.lockOwnerAssignmentsAndFindActiveOwners` dieselben Owner-Zuweisungen wie beim Owner-Entzug gesperrt.                                                 |
| Offene Zuständigkeit   | Bei Kunden gelten ausschließlich `active` und `paused` als offen. Archivierte Kunden behalten den historischen Owner und blockieren die Deaktivierung nicht.                                                             |
| Zuständigkeitssperre   | Besitzt das Ziel offene Zuständigkeiten, antwortet der Command mit 409 und einer nach `OwnableEntity` vollständigen Anzahl. Es findet kein Teil-Write statt.                                                             |
| Registry-Schnitt       | 03c führt eine exhaustive Counter-Registry ein. Ordner 22a erweitert denselben Adapter-Vertrag um die versionierte Übergabe; es entsteht keine parallele zweite Registry.                                                |
| Security-Events        | Genau ein Event pro erfolgreicher Aktivierung oder Deaktivierung. Metadaten bleiben leer; Actor und Ziel stehen in den typisierten Event-Spalten.                                                                        |
| Vorregistrierter Event | Migration 0026 enthält zusätzlich `workspace_responsibilities_handed_over`, weil sie bereits in der Development-DB registriert wurde. 03c schreibt diesen Typ nicht; Task 02f aktiviert ihn ohne erneute Schemaänderung. |
| UI                     | Die Mitgliederliste erhält Status und Aktivieren-/Deaktivieren-Aktion. Bei Zuständigkeiten zeigt sie ausschließlich die sichere Sperre, keinen toten Übergabe-CTA.                                                       |
| Versionenkonflikt      | Ein 409 behält den Dialogzustand, zeigt den aktuellen Member-Stand und verlangt einen bewussten erneuten Versuch.                                                                                                        |
| Owner-Vergabe          | Deaktivierte Mitglieder werden nicht Owner (`409 MEMBER_INACTIVE`); die Zeile bietet dafür keine Aktion. Ein inaktiver Owner hätte keinen Zugriff und würde nur einen Backup-Owner vortäuschen. Entzug bleibt möglich.   |

## Öffentlicher Contract

### `PATCH /api/workspace/members/[id]`

Body:

```ts
interface UpdateWorkspaceMemberStatusRequestDto {
  /** Gewünschter Aktivzustand; identischer Ist-Zustand wird ohne Write abgewiesen. */
  active: boolean;
  /** Zuletzt gelesene Version der Membership für den atomaren Schreibvergleich. */
  version: number;
}
```

Erfolg: `200 { member: WorkspaceMemberDto }`

Fachfehler:

- `400 VALIDATION_ERROR`
- `404 MEMBER_NOT_FOUND`
- `409 VERSION_CONFLICT` mit aktuellem `WorkspaceMemberDto`
- `409 MEMBER_ALREADY_ACTIVE` oder `MEMBER_ALREADY_INACTIVE`
- `409 SELF_DEACTIVATION`
- `409 LAST_ACTIVE_OWNER`
- `409 MEMBER_HAS_OPEN_RESPONSIBILITIES` mit `details.responsibilityCounts`

## Zuständigkeitsprüfung

`OwnableEntity` liegt als Const-Objekt mit abgeleitetem Typ in `packages/common`. Für 03c enthält es nur `Customer`.
Die serverseitige Registry definiert einen lokalen Adapter-Vertrag und wird mit
`satisfies Record<OwnableEntity, ResponsibilityCounter>` deklariert. Ein fehlender Counter wird damit zum
Typecheck-Fehler statt zu einer unbemerkten Sicherheitslücke.

Der Customer-Counter:

- zählt ausschließlich Kunden mit `owner_member_id` des Zielmitglieds;
- berücksichtigt nur `CustomerStatus.Active` und `CustomerStatus.Paused`;
- ignoriert archivierte Kunden vollständig;
- gibt nur die Anzahl zurück und lädt keine Kundenstammdaten oder PII;
- wird innerhalb derselben Transaktion wie die Deaktivierung ausgeführt.

Task 02f erweitert den Adapter in Ordner 22a um das Laden versionierter Zuständigkeiten und den Transfer über
`updateVersioned`. Die Registry und der `OwnableEntity`-Contract bleiben dabei bestehen; jede neue besitzbare Domäne
erweitert zuvor den Counter exhaustiv.

## Ablauf der Deaktivierung

1. Member-ID und Body validieren; Actor gleich Ziel bei `active: false` sofort ablehnen.
2. DB-Transaktion öffnen und Owner-Zuweisungen über den bestehenden gemeinsamen Owner-Lock sperren.
3. Mitglied einschließlich User-Zustand laden; ein fehlendes Mitglied mit 404 beantworten.
4. Aktuellen Zustand prüfen; identischen Zielzustand ohne Mutation als 409 zurückgeben.
5. Bei Deaktivierung prüfen, ob das Ziel der letzte aktive Owner ist.
6. Über alle Registry-Counter offene Zuständigkeiten zählen; bei mindestens einer Zuständigkeit mit vollständigen
   Anzahlen und ohne Write abbrechen.
7. Membership ausschließlich über `updateVersioned` ändern.
8. Genau ein `workspace_member_deactivated`- oder `workspace_member_activated`-Event in derselben Transaktion schreiben.
9. Aktualisiertes `WorkspaceMemberDto` zurückgeben; der bestehende Auth-Gate sperrt deaktivierte Mitglieder ab dem
   nächsten Request.

## Security-Event-Typen

| Typ                                      | In 03c geschrieben            | Subjekt            | Metadaten                                    |
| ---------------------------------------- | ----------------------------- | ------------------ | -------------------------------------------- |
| `workspace_member_deactivated`           | ja                            | `workspace_member` | keine                                        |
| `workspace_member_activated`             | ja                            | `workspace_member` | keine                                        |
| `workspace_responsibilities_handed_over` | nein, reserviert für Task 02f | `workspace_member` | später `targetMemberId`, `transferredCounts` |

Migration, Drizzle-Modell und DB-Smoke verwenden dieselbe vollständige Event-Wertemenge. Bestehende Event-Typen werden
nicht entfernt und die bereits registrierte Migration 0026 wird nicht nachträglich verändert.

## UI-Verhalten

- Jede fremde Mitgliederzeile zeigt den Zustand „Aktiv“ oder „Deaktiviert“.
- Abhängig vom Zustand steht „Deaktivieren“ oder „Aktivieren“ zur Verfügung.
- Die eigene Zeile bietet keine Deaktivierungsaktion.
- Deaktivierte Mitglieder bieten kein „Zum Owner machen“; „Owner entziehen“ bleibt für inaktive Owner sichtbar.
- Der Deaktivierungsdialog erklärt, dass der Zugriff ab dem nächsten Request endet.
- Bei offenen Zuständigkeiten bleibt der Dialog geöffnet und zeigt die Anzahl je vorhandener Entität.
- Es erscheint noch kein Übergabe-Button; der Fehlerzustand erklärt, dass offene Kunden zuerst einem anderen Owner
  zugewiesen werden müssen.
- Ein Versionskonflikt übernimmt den aktuellen Serverstand und verlangt eine erneute Bestätigung.
- Nach Erfolg aktualisiert `router.refresh()` die Mitgliederliste.
- Fokus kehrt nach dem Schließen zur auslösenden Aktion zurück; Escape schließt nur ohne laufende Mutation.
- Alle Texte liegen vollständig und schlüsselgleich in den DE-/EN-Dictionaries.

## Verzeichnisstruktur

```txt
packages/db/
  migrations/0026_extend_security_events_for_member_lifecycle.sql
  scripts/smoke-rbac.ts                                      + neue CHECK-Werte

packages/common/src/
  constants/auth/security-event-types.ts                     + Lifecycle-Typen, Handover reserviert
  constants/auth/errors/workspace-member-error-codes.ts      + Status-/Sperrfehler
  constants/crm/ownable-entities.ts (+ Test)
  contracts/auth/update-workspace-member-status-request.dto.ts
  contracts/auth/ownership-responsibility-counts.dto.ts
  contracts/auth/results/update-workspace-member-status-result.ts

apps/workspace/src/
  common/constants/access/access-operations.ts                + Member-Status
  common/patterns/access/access-api-endpoints.ts              + Member-Pfad
  common/contracts/access/access-client-results.ts            + Status-Result
  app/api/workspace/members/[id]/route.ts
  app/api/workspace/members/README.md                          + Contract/Fehler
  lib/workspace/access/member-api-error.ts                     + neue Fehlerabbildung
  server/workspace/access/
    command-handler/update-workspace-member-status.command-handler.ts
    services/responsibilities/responsibility-counter-registry.ts
    services/responsibilities/customer-responsibility-counter.ts
  components/workspace/settings/members/
    member-status-dialog/{member-status-dialog.tsx,member-status-dialog.module.css,member-status-dialog.test.tsx}
    member-row/                                               + Status/Lifecycle-Aktion
    members-list/                                             + Dialogsteuerung
  client/access/access-api-service.ts                         + Statusmutation
  i18n/dictionaries/workspace/settings/members/{de,en}.json   + Lifecycle-Copy
  server/tests/workspace/access/
    api/members-routes.test.ts                                + PATCH-Route
    member-lifecycle.integration.test.ts
```

## Tickets

### CRM-03c-T1 — Konstanten, Contracts und Migration

- `OwnableEntity`, Status-/Sperrfehler, Request-/Result-Contract und Responsibility-Counts ergänzen.
- Lifecycle-Security-Events ergänzen; den bereits registrierten Handover-Typ bis Task 02f ungenutzt lassen.
- `smoke-rbac.ts` auf exakte Übereinstimmung zwischen Code und DB erweitern.
- **Akzeptanz:** Const-Tests und Typecheck grün; zweiter Migrationslauf folgenlos; bestehende Event-Typen bleiben gültig.

### CRM-03c-T2 — Exhaustive Zuständigkeitsprüfung

- Counter-Registry und Customer-Counter implementieren.
- Offene Kunden ausschließlich über `active`/`paused` bestimmen; archivierte Kunden nie mitzählen.
- **Akzeptanz:** Compile-Time-Assertion für fehlenden Counter; Unit-Tests für vollständige Counts und Statusfilter;
  keine Kundenstammdaten verlassen den Service.

### CRM-03c-T3 — Aktivieren und Deaktivieren

- Command mit Selbstschutz, gemeinsamem Owner-Lock, Zuständigkeitssperre und genau einem Security-Event implementieren.
- Bereits aktiven/inaktiven Zustand ohne Mutation als fachlichen Konflikt behandeln.
- **Akzeptanz:** kein Write vor abgeschlossenen Guards; inaktives Mitglied wird beim nächsten Request abgewiesen;
  letzter aktiver Owner und Selbstdeaktivierung liefern 409.

### CRM-03c-T4 — Route und Client-Service

- PATCH-Route über die bestehende Access-Mutationspipeline mit `members.manage` anbinden.
- Endpoint-Pattern, Access-Operation, Fehlerabbildung, API-README und Client-Result ergänzen.
- **Akzeptanz:** Route-Tests für 401, 404, 403, Validierung, alle Fachkonflikte, Versionskonflikt und Erfolg.

### CRM-03c-T5 — Settings-UI

- Statusanzeige, Lifecycle-Aktion und Bestätigungsdialog in die Mitgliederliste integrieren.
- Zuständigkeitssperre ohne toten Übergabe-CTA erklären; Eingaben bei 409 bewahren und nach Erfolg aktualisieren.
- DE/EN, Loading-/Serverfehler sowie Fokus-Rückgabe vollständig umsetzen.
- **Akzeptanz:** Komponententests für aktive/inaktive/eigene Mitglieder, Zuständigkeitssperre, Konflikt und Erfolg;
  manueller Smoke für Tastatur, Mobile sowie Dark/Light.

### CRM-03c-T6 — DB-Integration und Abschluss

- Gemeinsamen Owner-Lock gegen parallelen Owner-Entzug und Deaktivierung mit echter DB testen.
- Customer-Counter mit aktiven, pausierten und archivierten Fixtures testen.
- Event-Anzahl und PII-freie Metadaten verifizieren.
- **Akzeptanz:** `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Integrationstests und
  `pnpm --filter @invessiv/workspace build` grün; Screenshots und Testplan im PR.

## Abschlussnachweis vom 14.09.2026

- Paketweise Ausführung des Root-Gates: Lint, Typecheck und Tests in `common`, `db`, `ui`, `web` und `workspace`
  grün. Das Web-Lint enthält nur die bereits bekannte `no-img-element`-Warnung in einem bestehenden Test.
- Workspace: 159 Testdateien grün, vier DB-Suites im normalen Lauf erwartungsgemäß übersprungen; 1004 Tests grün.
- PostgreSQL: Access-Integration mit acht Fällen grün, einschließlich Owner-Lock, Customer-Statusfilter,
  Versionsschreibweg und exakt einem PII-freien Event je erfolgreichem Statuswechsel.
- Weitere DB-Smokes: CRM 2/2, Activities 2/2 und RBAC 7/7 grün; ein bestehender RBAC-Test bleibt bewusst übersprungen.
- Produktions-Build der Workspace-App grün; die neue dynamische Route `/api/workspace/members/[id]` ist enthalten.
- UI-Smoke: Lifecycle-Dialog, Statusdarstellung, Eigenzeilenschutz, Versionskonflikt und Zuständigkeitssperre sind durch
  Komponenten- und Shared-Dialogtests abgedeckt. Dark/Light und der responsive Umbruch verwenden ausschließlich
  bestehende Tokens und Breakpoints. Ein PR-Screenshot wird als Review-Artefakt angehängt und nicht im Produktcode
  committed.

## Bekannte Grenze: Zuständigkeitszählung ohne Sperre

Bewusst verschoben aus dem Review vom 14.09.2026. **Geschlossen in Ordner 04 (Task 04):**
`src/server/workspace/access/services/responsibilities/member-responsibility-lock-service.ts` kapselt beide Sperren;
Kundenanlage und Deaktivierung nutzen sie.

- **Stelle:** Schritt 6 in
  `src/server/workspace/access/command-handler/update-workspace-member-status.command-handler.ts` und
  `src/server/workspace/access/services/responsibilities/customer-responsibility-counter.ts`.
- **Regelbezug:** „Vor Deaktivierung eines Mitglieds ist die Übergabe sämtlicher aktiver Zuständigkeiten Pflicht“
  (`00-entscheidungen.md`).
- **Befund:** Der Counter zählt offene Kunden ohne Sperre. Weist eine parallele Transaktion dem Zielmitglied zwischen
  Zählung und Commit der Deaktivierung einen Kunden zu, entsteht ein deaktiviertes Mitglied mit offener Zuständigkeit.
- **Risiko heute:** keines. Vor Ordner 04 setzt kein Schreibpfad `customers.owner_member_id`.
- **Relevant ab:** dem ersten Schreibpfad auf eine Zuständigkeit — Kundenanlage (Task 04, Ordner 04), Lead-Konvertierung
  (Task 08, Ordner 06), Customer-Owner-Wechsel (Task 08a, Ordner 20a), Übergabe (Task 02f, Ordner 22a) sowie jede
  spätere `OwnableEntity`.
- **Nächster Schritt**, im selben Ordner wie der erste solche Schreibpfad:
  1. Die Deaktivierung sperrt vor der Zählung die Membership-Zeile des Ziels mit `SELECT … FOR UPDATE`.
  2. Jeder Schreibpfad, der eine Zuständigkeit setzt, sperrt in derselben Transaktion die Membership-Zeile des neuen
     Zuständigen mit `SELECT … FOR SHARE` und prüft dort `active`. Der Fremdschlüssel allein genügt nicht: Postgres
     nimmt dafür nur `FOR KEY SHARE`, das weder mit `FOR UPDATE` noch mit dem Versions-Update kollidiert.
  3. Beide Sperren als gemeinsamen Baustein unter `server/workspace/access/` kapseln und mit einem DB-Integrationstest
     für parallele Zuweisung und Deaktivierung absichern.

## Nicht Teil dieses Tasks

- Customer-Owner einzeln wechseln — Task 08a in Ordner 20a.
- Alle Zuständigkeiten eines Mitglieds übergeben — Task 02f in Ordner 22a nach dem vollständigen CRM-Ausbau.
- Dialoge und weitere UI-Bausteine nach `packages/ui` verschieben — Ordner 03d.
- Kundenanlage und Kundenakte — Ordner 04.
- Projekte, Aufgaben, Renewals und Conversations registrieren — bei ihrer Einführung in Ordner 07, 08, 11 und 17.
- Automatische Deaktivierung nach einer späteren Übergabe — beide Aktionen bleiben getrennt.
- Security-Audit-Ansicht — spätere CRM-Einheit.

## Rollback

App-Revert auf Ordner 03b. Die additive Event-Constraint bleibt kompatibel. Bereits deaktivierte Mitglieder bleiben
durch den vorhandenen Auth-Gate gesperrt und müssen bis zu einem erneuten Roll-forward kontrolliert per Datenbank
reaktiviert werden.
