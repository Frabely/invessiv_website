# Task 41 — Paketverwaltung, Rechte und Protokoll

> **Merge-Einheit:** Ordner 07d · **Branch:** `feat/crm-pakete-und-kundenvolumen`
> **Aufwand:** M · **Abhängigkeiten:** Task 40, Task 02 (Rechte), Task 36–37 (Zugriffsbereiche)
> **Migration:** ja — Permission-Katalog `packages.read` und `packages.write`

- Buchen leitet eine Position aus einer Katalogversion ab und schreibt den Snapshot atomar mit Items.
- Bearbeiten läuft über `updateVersioned`; ein veralteter Write liefert 409 samt aktuellem Stand.
- Preiswechsel ist ein eigener Command: alte Position beenden und Nachfolger anlegen, in einer
  Transaktion. Das gilt auch für den Stundensatz.
- Mehr Stück zu einem neuen Preis sind eine neue Position, keine Mengenänderung der alten.
- `packages.read` und `packages.write` sind workspace-weit und **nicht** bindbar.
- Jede Änderung erzeugt eine Activity am Kunden; Beträge stehen in den Metadaten, nie im Titel.

## Context

Task 40 hat Katalog, Tabellen und Berechnung geliefert. Hier entsteht der Schreibpfad: Position
buchen, anpassen, beenden, Preis wechseln — jeweils als Command-Handler hinter einem Route Handler,
ohne Fachlogik in der Route. Der Stundensatz läuft als `rate`-Position über dieselben Pfade und
braucht keinen eigenen Command.

Der Zuschnitt der Rechte ist die einzige Entscheidung mit Tragweite: Preise sind die sensibelste
Information im CRM nach den Zugangsdaten.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Permission          | Neu `packages.read` und `packages.write`, per Migration in den Katalog; beide in `workspace_owner`                                                   |
| Bindbarkeit         | `scopable = false` — wer Preise sieht, sieht sie workspace-weit oder gar nicht                                                                       |
| Warum               | Ein gebundener Preiszugriff macht jede Summe im Dashboard abhängig vom Betrachter. Für zwei bis fünf Leute ist das Konfigurationsfläche ohne Nutzen  |
| Trennung von Kunden | `customers.read` reicht **nicht** für Beträge. Eine Rolle ohne `packages.read` bekommt Tab und Wertspalten nicht geliefert, nicht nur ausgeblendet   |
| Buchen              | `bookCustomerPackage` erhält `packageKey` plus optional `versionNumber`; ohne Angabe gilt die Ankerversion des Kunden                                |
| Freie Position      | `packageKey = null` erlaubt: eigener Titel, eigene Beträge, eigene Leistungspunkte                                                                   |
| Snapshot-Zeitpunkt  | Auflösung der Katalogversion passiert **im Handler**, nicht im Client. Der Client schickt nie Preise, die er selbst aus dem Katalog gelesen hat      |
| Warum               | Sonst bestimmt der Browser den Preis. Der Client darf Beträge nur bei bewusster Abweichung senden, und die wird protokolliert                        |
| Abweichung          | Weicht ein gesendeter Betrag von der Katalogversion ab, wird die Position als `priceOverridden` in der Activity vermerkt                             |
| Bearbeiten          | `version` über `updateVersioned`; Items werden als vollständige Liste ersetzt, nicht einzeln gepatcht                                                |
| Beenden             | Setzt `ends_on` und `status = 'ended'`; Positionen verschwinden nie aus der Akte                                                                     |
| Kein Löschen        | Kein Delete-Endpunkt. Fehlbuchung wird auf `cancelled` gesetzt und zählt in keiner Wertberechnung                                                    |
| Preiswechsel        | Eigener Command `replaceCustomerPackage`: `ends_on` der alten Position auf Vortag, neue Position ab Stichtag mit `replaces_package_id`               |
| Lückenprüfung       | Der Handler stellt sicher, dass Nachfolger unmittelbar anschließt; überlappende Zeiträume derselben Kette werden mit 422 abgelehnt                   |
| Stundensatz         | Kein eigener Command. Der Satz ist eine Position mit `pricing_mode = 'rate'`; Buchen und Ändern laufen über dieselben Pfade wie jede andere Position |
| Satzwechsel         | Ebenfalls `replaceCustomerPackage`. Der Handler schreibt zusätzlich `customers.default_hourly_rate_cents` als Cache in derselben Transaktion         |
| Menge               | `quantity` ist Teil des Buchens und des Bearbeitens; bei `pricing_mode = 'rate'` erzwingt die DB den Wert 1                                          |
| Mehr Stück später   | Erzeugt eine **neue** Position aus der aktuellen Katalogversion, nie eine Mengenerhöhung der bestehenden Zeile                                       |
| Rückwirkend         | Ein `starts_on` oder `effective_from` in der Vergangenheit ist erlaubt und wird protokolliert                                                        |
| Stand setzen        | Eigener schlanker Command `setCustomerPackageStage`; kein Zustandsautomat, jeder Wechsel erlaubt und protokolliert                                   |
| Warum eigener Pfad  | Der Stand wechselt oft und aus der Liste heraus. Er soll nicht den vollen Bearbeiten-Dialog samt `version`-Konflikt auslösen                         |
| Stand-Vorgabe       | Beim Buchen wählbar, Vorgabe `ordered` — der Normalfall ist „ist beauftragt, wird gemacht"                                                           |
| Zeitstempel         | Jeder Wechsel setzt `stage_changed_on` auf heute; ein rückwirkendes Datum ist angebbar                                                               |
| Verbotene Stände    | `invoiced`/`paid` bei wiederkehrend und jeder Stand bei `rate` liefern 422, nicht einen DB-Fehler                                                    |
| Activities          | Typen `package_booked`, `package_changed`, `package_ended`, `package_replaced`, `package_stage_changed` mit Alt- und Neustand                        |
| Zuständigkeit       | Pakete sind **keine** besitzbare Entität — kein Eintrag in `OwnableEntity`, keine Übergabepflicht                                                    |
| Warum               | Die Zuständigkeit liegt am Kunden und am Projekt. Eine dritte Ebene würde die Deaktivierungszählung aufblähen, ohne eine Frage zu beantworten        |

## Contract

```ts
// apps/workspace/src/common/constants/crm/package-list-query-params.ts
// apps/workspace/src/common/constants/api-endpoints.ts  (Ergaenzung)
CrmCustomerPackages: "/api/workspace/crm/customers/:customerId/packages",
CrmPackage: "/api/workspace/crm/packages/:packageId",
CrmPackageReplace: "/api/workspace/crm/packages/:packageId/replace",
CrmPackageStage: "/api/workspace/crm/packages/:packageId/stage",
```

```ts
// packages/common/src/constants/crm/errors/package-error-codes.ts
export const PackageErrorCode = {
  CustomerNotFound: "PACKAGE_CUSTOMER_NOT_FOUND",
  PackageNotFound: "PACKAGE_NOT_FOUND",
  ProjectNotOwnedByCustomer: "PACKAGE_PROJECT_NOT_OWNED_BY_CUSTOMER",
  UnknownPackageKey: "PACKAGE_UNKNOWN_KEY",
  UnknownPackageVersion: "PACKAGE_UNKNOWN_VERSION",
  IntervalMismatch: "PACKAGE_INTERVAL_MISMATCH",
  QuantityNotAllowed: "PACKAGE_QUANTITY_NOT_ALLOWED",
  StageNotAllowedForPricingMode: "PACKAGE_STAGE_NOT_ALLOWED_FOR_PRICING_MODE",
  AlreadyEnded: "PACKAGE_ALREADY_ENDED",
  ReplacementOverlaps: "PACKAGE_REPLACEMENT_OVERLAPS",
  ActiveRateExists: "PACKAGE_ACTIVE_RATE_EXISTS",
} as const;
```

## Architektur

```txt
GET    /api/workspace/crm/customers/[id]/packages        packages.read
POST   /api/workspace/crm/customers/[id]/packages        packages.write   buchen
PATCH  /api/workspace/crm/packages/[packageId]           packages.write   bearbeiten (version)
POST   /api/workspace/crm/packages/[packageId]/replace   packages.write   Preiswechsel
PATCH  /api/workspace/crm/packages/[packageId]/stage     packages.write   Stand setzen
DELETE /api/workspace/crm/packages/[packageId]           entfaellt bewusst

Der Stundensatz braucht keinen eigenen Endpunkt: er ist eine Position mit pricing_mode 'rate'
und laeuft ueber dieselben drei Routen.

bookCustomerPackage(actor, { customerId, projectId?, packageKey?, versionNumber?, quantity?, overrides? })
  ├─ can(actor, Permission.PackagesWrite)            fail-closed
  ├─ accessScope: Kunde sichtbar?                    sonst 404
  ├─ Katalogversion ueber Konditionsanker aufloesen
  ├─ Transaktion: customer_packages + customer_package_items + activity
  └─ Result-Union, keine Exception

replaceCustomerPackage(actor, { packageId, effectiveFrom, overrides })
  └─ Transaktion: alte Zeile ends_on = effectiveFrom - 1 Tag, status 'ended'
                  neue Zeile ab effectiveFrom mit replaces_package_id
                  eine Activity 'package_replaced' mit Alt-/Neuwert
```

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_add_package_permissions.sql
packages/common/src/constants/auth/permissions.ts                  (+ zwei Eintraege)
packages/common/src/constants/crm/errors/package-error-codes.ts    (+ .test.ts)

apps/workspace/src/common/constants/api-endpoints.ts               (+ vier Endpunkte)
apps/workspace/src/common/constants/access/crm-endpoint-access-rules.ts (+ Regeln)
apps/workspace/src/app/api/workspace/crm/customers/[id]/packages/route.ts
apps/workspace/src/app/api/workspace/crm/packages/[packageId]/route.ts
apps/workspace/src/app/api/workspace/crm/packages/[packageId]/replace/route.ts
apps/workspace/src/app/api/workspace/crm/packages/[packageId]/stage/route.ts

apps/workspace/src/server/workspace/crm/
  query-handler/list-customer-packages.query-handler.ts
  command-handler/{book,update,end,replace}-customer-package.command-handler.ts
  command-handler/set-customer-package-stage.command-handler.ts
  services/{customer-package.schema.ts,customer-package.mapper.ts}
apps/workspace/src/lib/crm/package-api-error.ts
apps/workspace/src/client/crm/packages-api-service.ts
```

## Tickets

### CRM-41-T1 — Permissions und Zugriffsregeln

- **Files:** Migration, `permissions.ts`, Tests, `crm-endpoint-access-rules.ts`, Owner-Rolle
- **Skills:** `best-practices`
- **Inhalt:** Katalogeintrag per Migration, Einordnung als nicht bindbar, Endpunktregeln
- **Akzeptanz:**
  - Test: `packages.read` und `packages.write` sind in `PERMISSION_VALUES` und in der Owner-Rolle
  - Test: beide sind in der `scopable`-Liste **nicht** enthalten
  - Jeder neue Endpunkt steht in `CRM_ENDPOINT_ACCESS_RULES`; ein fehlender bricht den Bestandstest

### CRM-41-T2 — Buchen, Bearbeiten, Beenden

- **Files:** drei Command-Handler, ein Query-Handler, Schema, Mapper, zwei Routen, Tests
- **Skills:** `best-practices`
- **Inhalt:** Snapshot-Erzeugung im Handler, Menge, `updateVersioned`, Result-Unions, Activity je Pfad
- **Akzeptanz:**
  - Katalogversion wird serverseitig aufgelöst; ein vom Client gesendeter Preis überschreibt sie nur
    mit ausdrücklichem `overrides`-Feld und wird als Abweichung protokolliert
  - Buchen mit `quantity = 3` erzeugt **eine** Zeile mit Menge 3, nicht drei Zeilen
  - `quantity > 1` bei einem Paket mit `quantifiable = false` liefert 422
  - Zweite aktive `rate`-Position liefert 409 `PACKAGE_ACTIVE_RATE_EXISTS`, kein DB-Fehler
  - Veralteter `version`-Wert liefert 409 mit `VersionConflictDto`
  - Position mit fremdem Projekt liefert 422, nicht 500
  - Rolle ohne `packages.write` erhält 403, Rolle ohne Kundensicht 404 (Negativtests)

### CRM-41-T3 — Preis- und Satzwechsel, Stand setzen

- **Files:** `replace-customer-package.command-handler.ts`,
  `set-customer-package-stage.command-handler.ts`, zwei Routen, `package-api-error.ts`,
  Client-Service, Tests
- **Skills:** `best-practices`
- **Inhalt:** Kettenlogik mit Lückenprüfung; bei `rate`-Positionen zusätzlich der Cache-Write;
  Standwechsel mit Zeitstempel und Activity
- **Akzeptanz:**
  - Standwechsel schreibt `stage_changed_on` und genau eine Activity mit Alt- und Neustand
  - `paid` an einer wiederkehrenden Position liefert 422 `PACKAGE_STAGE_NOT_ALLOWED_FOR_PRICING_MODE`
  - Jeder Stand ist von jedem anderen erreichbar; es gibt keinen gesperrten Übergang (Test)
  - Wechsel auf `ordered` erhöht den Umsatzwert, Wechsel auf `declined` senkt ihn wieder
  - Nach dem Wechsel gibt es genau zwei Zeilen, lückenlos und ohne Überlappung
  - Der berechnete Wert zum Vortag des Wechsels ist unverändert (Regressionstest)
  - Satzwechsel aktualisiert `customers.default_hourly_rate_cents` in derselben Transaktion
  - `default_hourly_rate_cents` entspricht nach jedem Schreibpfad der aktiven `rate`-Position
