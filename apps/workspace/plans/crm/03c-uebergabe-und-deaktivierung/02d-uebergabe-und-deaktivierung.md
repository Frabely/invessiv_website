# Task 02d — Übergabe und Deaktivierung

> **Merge-Einheit:** Ordner 03c · **Branch:** `feat/crm-uebergabe-und-deaktivierung`
> **Aufwand:** M–L · **Abhängigkeit:** Task 02c (Ordner 03b) gemerged
> **Migration:** eine additive Erweiterung der `security_events`-CHECK-Constraint; Nummer im Repository ermitteln

## Kontext

Ordner 03b verwaltet Mitglieder, Rollen und Owner-Zuweisungen, bietet aber bewusst keinen Pfad zur Deaktivierung.
Dieser Task schließt den Lebenszyklus interner Mitglieder vertikal vollständig: Ein berechtigter Nutzer kann andere
Mitglieder deaktivieren und reaktivieren. Offene Zuständigkeiten blockieren die Deaktivierung, bis sie vollständig an
ein anderes aktives Mitglied übergeben wurden.

Die erste besitzbare Entität ist `customer`, deren Tabelle seit Ordner 01 besteht. Spätere Ordner ergänzen Projekte,
Aufgaben und Renewals. Eine exhaustive Registry erzwingt, dass jede neue `OwnableEntity` vor dem Merge einen Adapter
erhält. Die UI bleibt auf die heute tatsächlich vorhandenen Entitäten beschränkt und zeigt keine Platzhalter für
spätere CRM-Bereiche.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                                                                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Autorisierung           | Beide Mutationen laufen über `members.manage`; Rollenbezeichnungen oder Client-Flags autorisieren nie.                                                                                                                                             |
| Mitglieds-ID            | URL und Contracts verwenden ausschließlich `workspace_members.id`, nie Clerk-ID, E-Mail oder `users.id`.                                                                                                                                           |
| Aktivieren/Deaktivieren | `PATCH /api/workspace/members/[id]` erhält `{ active, version }`; dieselbe Zielaktivität ist ein fachlicher 409-Konflikt und erzeugt keinen Write und kein Event.                                                                                  |
| Selbstschutz            | Niemand deaktiviert sich selbst. Reaktivierung des eigenen bereits inaktiven Zugangs ist praktisch nicht erreichbar und wird ebenfalls nicht als Sonderweg angeboten.                                                                              |
| Owner-Schutz            | Vor jeder Deaktivierung werden über `workspaceOwnerInvariantService.lockOwnerAssignmentsAndFindActiveOwners` dieselben Owner-Zuweisungen wie beim Owner-Entzug gesperrt. Der letzte aktive Owner bleibt geschützt.                                 |
| Offene Zuständigkeit    | Bei Kunden gelten ausschließlich `active` und `paused` als offen. Archivierte Kunden behalten ihren historischen Owner und blockieren die Deaktivierung nicht.                                                                                     |
| Deaktivierungssperre    | Besitzt das Ziel offene Zuständigkeiten, antwortet der Command mit 409 und einer typisierten, nach `OwnableEntity` vollständigen Anzahl. Es findet kein Teil-Write statt.                                                                          |
| Übergabe                | `POST /api/workspace/members/[id]/handover` erhält `{ targetMemberId }` und übergibt alle derzeit offenen Zuständigkeiten des Quellmitglieds. Die UI kann als Ziel ein anderes aktives Mitglied oder den aktuellen Actor („Alles an mich“) wählen. |
| Übergabe-Ziel           | Das Ziel muss ein anderes Mitglied mit aktiver Membership und aktivem `users`-Datensatz sein. Eine aktive Rolle ist keine Besitzvoraussetzung; Zugriffsrechte werden weiterhin ausschließlich über Permissions bestimmt.                           |
| Transaktion             | Registry-Abfrage, alle `updateVersioned`-Writes, Activities und das Security-Event laufen in genau einer DB-Transaktion. Der erste Fach- oder Versionskonflikt rollt alles zurück.                                                                 |
| Concurrency             | Der Adapter lädt IDs und Versionen offener Entitäten und schreibt jede Zeile über `updateVersioned`. Ein paralleler Edit nach diesem Snapshot führt zu 409 statt zu einer stillen Überschreibung.                                                  |
| Activities              | Je übergebener Entität entsteht eine `field_change`-Activity mit `field: "ownerMemberId"`, alter und neuer Member-ID. Titel und Body bleiben leer; Namen und E-Mails werden nicht gespeichert.                                                     |
| Security-Events         | Genau ein Event pro erfolgreicher Aktivierung, Deaktivierung oder kompletter Übergabe. Metadaten enthalten nur Ziel-Member-ID und Anzahlen je Entität, keine PII.                                                                                  |
| UI                      | Aktionen werden in der Mitgliederliste aus 03b ergänzt. Die vorhandene Workspace-Dialog-Hülle wird genutzt; der Umzug auf native `packages/ui`-Dialoge erfolgt erst in Ordner 03d.                                                                 |
| Versionenkonflikt       | Ein 409 behält die Dialogauswahl, zeigt den aktuellen Zustand und erlaubt einen bewussten erneuten Versuch. Die Route liefert das bestehende `VersionConflictDto`-Format.                                                                          |

## Öffentliche Contracts

### `PATCH /api/workspace/members/[id]`

Body:

```ts
interface UpdateWorkspaceMemberStatusRequestDto {
  /** Gewünschter Aktivzustand; identischer Ist-Zustand wird als Konflikt abgewiesen. */
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
- `409 MEMBER_HAS_OPEN_RESPONSIBILITIES` mit `responsibilityCounts`

### `POST /api/workspace/members/[id]/handover`

Body:

```ts
interface HandoverWorkspaceResponsibilitiesRequestDto {
  /** Aktives Zielmitglied; darf nicht mit dem Quellmitglied identisch sein. */
  targetMemberId: string;
}
```

Erfolg:

```ts
interface HandoverWorkspaceResponsibilitiesDto {
  /** Mitglied, dessen offene Zuständigkeiten übergeben wurden. */
  sourceMemberId: string;
  /** Aktives Mitglied, das alle offenen Zuständigkeiten übernommen hat. */
  targetMemberId: string;
  /** Vollständige Anzahl übergebener Datensätze je registrierter Entität. */
  transferredCounts: Record<OwnableEntity, number>;
}
```

Fachfehler:

- `400 VALIDATION_ERROR`
- `404 MEMBER_NOT_FOUND` für ein unbekanntes Quellmitglied
- `404 HANDOVER_TARGET_NOT_FOUND` für ein unbekanntes Zielmitglied
- `409 HANDOVER_TARGET_INACTIVE`
- `409 HANDOVER_TARGET_EQUALS_SOURCE`
- `409 NO_OPEN_RESPONSIBILITIES`
- `409 VERSION_CONFLICT` mit der zuerst kollidierten Entität als `current`

Der Handover erhöht nicht künstlich die Version der Quell- oder Ziel-Membership: Versioniert werden ausschließlich die
tatsächlich geänderten fachlichen Entitäten. Aktivieren/Deaktivieren versioniert dagegen die Membership selbst.

## Ownership-Registry

`OwnableEntity` liegt als Const-Objekt mit abgeleitetem Typ in `packages/common`. Für diesen Task enthält es nur
`Customer`. Die Registry liegt serverseitig im Access-Bereich und definiert ihren nicht exportierten Adapter-Typ lokal;
die konkreten Adapter exportieren lediglich ihre typisierten Objekte. Dadurch bleibt DB-Logik aus `packages/common`
heraus und die projektweite Exportregel wird eingehalten.

Jeder Adapter stellt fachlich diese Operationen bereit:

- offene Zuständigkeiten eines Mitglieds als stabile Liste aus `id` und `version` laden;
- eine einzelne Zuständigkeit über `updateVersioned` an ein Zielmitglied übertragen;
- das aktuelle Entity-Minimal-DTO für einen `VersionConflictDto` liefern;
- nach erfolgreichem Write die Entity-ID für die Activity zurückgeben.

Die Registry wird mit `satisfies Record<OwnableEntity, OwnershipAdapter>` deklariert. Ein Test ergänzt temporär einen
weiteren `OwnableEntity`-Wert beziehungsweise nutzt eine Compile-Time-Assertion, sodass ein fehlender Adapter den
Typecheck zuverlässig fehlschlagen lässt.

Der Customer-Adapter berücksichtigt ausschließlich `CustomerStatus.Active` und `CustomerStatus.Paused`. Seine
Abfrage ist deterministisch nach ID sortiert, damit zwei gleichzeitige Übergaben dieselben Zeilen in derselben
Reihenfolge sperren und kein vermeidbares Deadlock-Risiko entsteht.

## Invarianten und Ablauf

### Deaktivierung

1. ID und Body validieren; Actor gleich Ziel bei `active: false` sofort ablehnen.
2. DB-Transaktion öffnen und Owner-Zuweisungen über den bestehenden gemeinsamen Owner-Lock sperren.
3. Mitglied einschließlich aktivem User-Zustand laden; fehlendes Mitglied mit 404 beantworten.
4. Version und Zielzustand prüfen; der eigentliche Write erfolgt ausschließlich über `updateVersioned`.
5. Bei Deaktivierung prüfen, ob das Ziel der letzte aktive Owner ist.
6. Über alle Registry-Adapter offene Zuständigkeiten zählen; bei mindestens einer Zuständigkeit mit vollständigen
   Anzahlen und ohne Write abbrechen.
7. Membership atomar aktualisieren und genau ein Security-Event in derselben Transaktion schreiben.
8. Aktualisiertes `WorkspaceMemberDto` zurückgeben; der nächste Request des deaktivierten Mitglieds wird bereits durch
   den vorhandenen Auth-Gate abgewiesen.

### Übergabe

1. Quell- und Ziel-ID validieren; identische IDs ablehnen.
2. DB-Transaktion öffnen und Quelle sowie Ziel lesen; das Ziel muss als User und Membership aktiv sein.
3. Für jeden Registry-Adapter offene Zuständigkeiten der Quelle laden; insgesamt null Zuständigkeiten als 409 melden.
4. Datensätze in stabiler Registry- und ID-Reihenfolge ausschließlich über `updateVersioned` übertragen.
5. Nach jedem erfolgreichen Entity-Write eine Activity über `activityService.createActivity` in derselben Transaktion
   anlegen.
6. Genau ein `workspace_responsibilities_handed_over`-Event mit Ziel-ID und Anzahlen schreiben.
7. Erst nach vollständigem Erfolg committen; bei irgendeinem Konflikt sämtliche Writes, Activities und das Event
   zurückrollen.

Eine Übergabe deaktiviert das Quellmitglied nicht automatisch. Der Administrator prüft das Ergebnis im Dialog und
bestätigt anschließend separat die Deaktivierung. Dadurch bleibt jede Aktion explizit, versioniert und auditierbar.

## Security-Event-Typen

Die additive Migration erweitert ausschließlich `security_events_type_check`:

| Typ                                      | Subjekt                       | Metadaten                             |
| ---------------------------------------- | ----------------------------- | ------------------------------------- |
| `workspace_member_deactivated`           | `workspace_member`            | keine                                 |
| `workspace_member_activated`             | `workspace_member`            | keine                                 |
| `workspace_responsibilities_handed_over` | `workspace_member` der Quelle | `targetMemberId`, `transferredCounts` |

Alle drei Werte werden zuerst im Const-Objekt `SecurityEventType` ergänzt. Migration, Drizzle-Modell und DB-Smoke
verwenden anschließend dieselbe vollständige Wertemenge. Bestehende Event-Typen werden nicht entfernt.

## UI-Verhalten

- Jede fremde Mitgliederzeile zeigt abhängig vom Zustand „Deaktivieren“ oder „Aktivieren“.
- Die eigene Zeile bietet keine Deaktivierungsaktion.
- Der Deaktivierungsdialog erklärt, dass der Zugriff ab dem nächsten Request endet.
- Meldet der Server offene Zuständigkeiten, bleibt der Dialog geöffnet und zeigt die Anzahl je vorhandener Entität.
- Der Übergabedialog listet ausschließlich aktive, andere Mitglieder und markiert den aktuellen Actor als
  „An mich übergeben“.
- Nach erfolgreicher Übergabe aktualisiert `router.refresh()` die Mitgliederliste; der Deaktivierungsdialog kann danach
  erneut bestätigt werden.
- Versionenkonflikte übernehmen den aktuellen Serverstand, behalten das gewählte Ziel und verlangen eine erneute
  Bestätigung.
- Serverfehler und leere Ziellisten haben eigene verständliche Zustände; es gibt keinen deaktivierten oder toten CTA.
- Fokus kehrt nach dem Schließen zur auslösenden Aktion zurück. Escape schließt nur, solange keine Mutation läuft.
- Alle Texte liegen vollständig und schlüsselgleich in den DE-/EN-Dictionaries.

## Verzeichnisstruktur

```txt
packages/db/
  migrations/<n>_extend_security_events_for_member_lifecycle.sql
  scripts/smoke-rbac.ts                                      + neue CHECK-Werte

packages/common/src/
  constants/auth/security-event-types.ts                     + drei Typen
  constants/auth/errors/workspace-member-error-codes.ts      + Lifecycle-/Handover-Fehler
  constants/crm/ownable-entities.ts (+ Test)
  contracts/auth/update-workspace-member-status-request.dto.ts
  contracts/auth/handover-workspace-responsibilities-request.dto.ts
  contracts/auth/handover-workspace-responsibilities.dto.ts
  contracts/auth/ownership-responsibility-counts.dto.ts
  contracts/auth/results/update-workspace-member-status-result.ts
  contracts/auth/results/handover-workspace-responsibilities-result.ts

apps/workspace/src/
  common/constants/access/access-operations.ts                + Status/Handover
  common/patterns/access/access-api-endpoints.ts              + Member-/Handover-Pfade
  common/contracts/access/access-client-results.ts            + neue Client-Result-Unions
  app/api/workspace/members/[id]/route.ts
  app/api/workspace/members/[id]/handover/route.ts
  app/api/workspace/members/README.md                          + Contracts/Fehler
  lib/workspace/access/member-api-error.ts                     + neue Fehlerabbildung
  server/workspace/access/
    command-handler/update-workspace-member-status.command-handler.ts
    command-handler/handover-workspace-responsibilities.command-handler.ts
    services/ownership/ownership-registry.ts
    services/ownership/customer-ownership-adapter.ts
    services/ownership/ownership-count-service.ts
  components/workspace/settings/members/
    member-status-dialog/{member-status-dialog.tsx,member-status-dialog.module.css,member-status-dialog.test.tsx}
    responsibility-handover-dialog/{responsibility-handover-dialog.tsx,responsibility-handover-dialog.module.css,responsibility-handover-dialog.test.tsx}
    member-row/                                               + Lifecycle-Aktionen
    members-list/                                             + Dialogsteuerung/Zieloptionen
  client/access/access-api-service.ts                         + Status/Handover
  i18n/dictionaries/workspace/settings/members/{de,en}.json   + Lifecycle-/Handover-Copy
  server/tests/workspace/access/
    api/members-routes.test.ts                                + beide Routen
    member-lifecycle.integration.test.ts
```

Die Liste ist ein Zielbild, keine Aufforderung zu künstlichen Ein-Datei-Abstraktionen. Rein lokale Props und Helfertypen
bleiben in ihrer Komponente beziehungsweise Implementierungsdatei. Exportierte Contracts und Konstanten liegen vor der
ersten Nutzung in `common`.

## Tickets

### CRM-03c-T1 — Konstanten, Contracts und Migration

- `OwnableEntity`, Fehlercodes, Request-/Response-DTOs und Result-Unions ergänzen.
- Drei Security-Event-Typen ergänzen und die DB-CHECK-Constraint additiv erweitern.
- `smoke-rbac.ts` auf exakte Übereinstimmung zwischen Code und DB erweitern.
- **Akzeptanz:** Const-Tests und Typecheck grün; zweiter Migrationslauf folgenlos; bestehende Event-Typen bleiben gültig.

### CRM-03c-T2 — Ownership-Registry und Customer-Adapter

- Exhaustive Registry, Customer-Adapter und vollständige Zählung nach Entität implementieren.
- Offene Kunden ausschließlich über `active`/`paused` bestimmen; archivierte Kunden nie übertragen.
- Alle Writes über `updateVersioned`; deterministische Reihenfolge und minimales Konflikt-DTO sicherstellen.
- **Akzeptanz:** Typtest für fehlenden Adapter; Unit-Tests für Statusfilter, Counts, Reihenfolge und Versionskonflikt.

### CRM-03c-T3 — Aktivieren und Deaktivieren

- Command mit Selbstschutz, gemeinsamem Owner-Lock, Zuständigkeitssperre und genau einem Security-Event implementieren.
- Bereits aktiven/inaktiven Zustand ohne Mutation als fachlichen Konflikt behandeln.
- **Akzeptanz:** kein Write vor abgeschlossenen Guards; inaktives Mitglied wird beim nächsten Request abgewiesen;
  letzter aktiver Owner und Selbstdeaktivierung liefern 409.

### CRM-03c-T4 — Atomare Übergabe

- Handover-Command für alle registrierten offenen Zuständigkeiten implementieren.
- Pro Entität eine `field_change`-Activity und insgesamt genau ein Security-Event schreiben.
- Jede Abweichung oder Kollision rollt die gesamte Transaktion zurück.
- **Akzeptanz:** aktive und pausierte Kunden wechseln Owner und Version; archivierte Kunden bleiben unverändert;
  paralleler Entity-Edit ergibt 409 ohne Teilübergabe, Activity oder Security-Event.

### CRM-03c-T5 — Routen und Client-Service

- Beide Routen über die bestehende Access-Mutationspipeline mit `members.manage` anbinden.
- Endpoint-Pattern, Access-Operationen, Fehlerabbildung, API-README und Client-Result-Unions ergänzen.
- **Akzeptanz:** Route-Tests für 401, 404, 403, Validierung, jeden Fachkonflikt, Versionskonflikt und Erfolg.

### CRM-03c-T6 — Settings-UI

- Statusaktion, Bestätigungsdialog, Zuständigkeitsanzeige und Übergabedialog in die Mitgliederliste integrieren.
- Eingaben bei 409 bewahren, erneute Bestätigung verlangen und nach Erfolg `router.refresh()` ausführen.
- DE/EN, Empty-/Loading-/Serverfehler sowie Fokus-Rückgabe vollständig umsetzen.
- **Akzeptanz:** Komponententests für aktive/inaktive/eigene Mitglieder, keine Zielmitglieder, Konflikt und Erfolg;
  manueller Smoke für Tastatur, Mobile sowie Dark/Light.

### CRM-03c-T7 — DB-Integration und Abschluss

- Gemeinsamen Owner-Lock gegen parallelen Owner-Entzug und Deaktivierung mit echter DB testen.
- Atomare Übergabe gegen parallelen Customer-Edit und Rollback nach Konflikt testen.
- Event- und Activity-Anzahlen sowie PII-freie Metadaten verifizieren.
- **Akzeptanz:** `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, DB-Smokes, Integrationstests und
  `pnpm --filter @invessiv/workspace build` grün; Screenshots und Testplan im PR.

## Nicht Teil dieses Tasks

- Dialoge und weitere UI-Bausteine nach `packages/ui` verschieben — Ordner 03d.
- Kundenanlage, Kundenakte oder manuelle Änderung eines Customer-Owners — Ordner 04.
- Projekte, Aufgaben und Renewals als weitere `OwnableEntity` registrieren — bei Einführung in Ordner 07, 08 und 11.
- Rollen deaktivieren oder löschen — Rollenverwaltung bleibt in Ordner 03b.
- Automatische Deaktivierung direkt nach der Übergabe — beide Aktionen bleiben bewusst getrennt.
- Security-Audit-Ansicht — spätere CRM-Einheit.

## Rollback

App-Revert auf Ordner 03b. Die additive Event-Constraint bleibt kompatibel. Bereits deaktivierte Mitglieder bleiben
durch den vorhandenen Auth-Gate gesperrt und müssen bis zu einem erneuten Roll-forward kontrolliert per Datenbank
reaktiviert werden. Bereits übergebene Zuständigkeiten werden nicht automatisch zurückgeschrieben; Activities und
Security-Events dokumentieren die erfolgte Änderung.
