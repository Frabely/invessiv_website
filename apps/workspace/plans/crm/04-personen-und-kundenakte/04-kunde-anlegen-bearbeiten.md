# Task 04 — Kunde anlegen und bearbeiten

> **Merge-Einheit:** Ordner 04 · **Branch:** `feat/crm-personen-und-kundenakte`
> **Aufwand:** M · **Abhängigkeiten:** Task 01 (Schema, Contracts), Task 02 (Rechte), Task 02d (Sperre)
> **Migration:** ja — additiver Unique-Index auf `lower(btrim(customers.display_name))`

> **Angepasst am 14.09.2026** auf die Entscheidung des Nutzers vom 13.09.2026 (`00-entscheidungen.md`, Abschnitt
> „Kunden und Personen“). Sie ersetzt die frühere Warn-statt-Verbot-Regel dieses Plans: **kein** Idempotenzschlüssel,
> **keine** Ähnlichkeitssuche, **kein** Duplikat-Hinweis. Der Anzeigename ist eindeutig; ein Konflikt ergibt 409.

- Kunde entsteht nur gemeinsam mit genau einem Primärkontakt. Kunde, Person, Zuordnung und `created`-Activity
  entstehen in einer Transaktion oder gar nicht.
- Der Primärkontakt wird in Task 04 immer als **neue** globale Person angelegt. Das bewusste Verknüpfen einer
  bestehenden Person braucht die Personensuche aus Task 06 und folgt dort.
- Funktion (`role_label`) liegt an der Zuordnung. E-Mail und Telefon aus dem Anlage-Dialog werden als primäre Daten
  der Person gespeichert; abweichende Firmen-E-Mail/-Telefon pflegt Task 06 an der Zuordnung.
- `ownerMemberId` ist Pflicht und initial das aktuelle Mitglied. Der Command sperrt die Membership des Owners in
  derselben Transaktion (`FOR SHARE`) und prüft `active`; die Deaktivierung sperrt dieselbe Zeile vor der Zählung
  (`FOR UPDATE`). Damit ist die „Bekannte Grenze“ aus Task 02d geschlossen.
- Status nur `active | paused | archived`; kein `deleted_at`-Filter. Neue Kunden sind `active`. Statuswechsel sind
  nicht Teil dieses Formulars — Archivieren und Reaktivieren liefert Task 05 mit eigener Activity.
- Update verwendet `version` über `updateVersioned`; ein veralteter Write liefert 409 samt aktuellem
  `CustomerDetailDto`. Create hat keine Version.
- Anzeigename eindeutig über `lower(btrim(display_name))` in allen Status. Konflikt ergibt 409
  `CUSTOMER_DISPLAY_NAME_TAKEN`, im Dialog als Feldfehler am Anzeigenamen.
- Kundennummern werden von der Sequenz vergeben und nicht recycelt.

## Context

Der erste sichtbare CRM-Bereich: die CRM-Route entsteht hier, dazu eine **minimale Kundenübersicht**
als Einstieg und der Schreibpfad — ein Dialog, der Anlegen und Bearbeiten in einer Komponente
abbildet, dahinter Route Handler, zod-Schemas und Command-Handler.

Die Übersicht bleibt bewusst schlicht: Nummer, Anzeigename, Status und Primärkontakt. Kein URL-State
außer dem Dialog-Modus, keine Toolbar, keine geteilten Listenbausteine. Zur vollen Liste mit
Pagination, URL-Filtern und den Komponenten aus Task 02a baut sie Task 03 in Ordner 05 aus.

Das ist Absicht und kein Doppelbau: Ordner 05 hängt an dieser Einheit, also kann die volle Liste
hier noch nicht entstehen — und ohne irgendeinen Einstieg wäre die Kundenakte nach dem Merge nicht
erreichbar.

## Entscheidungen

| Bereich          | Entscheidung                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog           | Eine Komponente für beide Modi über `CustomerFormDialogMode`, gesteuert über Query-Parameter (`mode`, `edit`)                         |
| Schreibpfad      | Client `fetch` → Route Handler → Command-Handler. **Keine** Server Actions (Projektkonvention)                                        |
| Fehlerbehandlung | Handler liefern Result-Unions, werfen nicht. Route mappt Code auf HTTP über eine nicht-exportierte Status- und Message-Map            |
| Duplikate        | **Verbot statt Warnung** (Entscheidung 13.09.2026): Unique-Index auf den normalisierten Anzeigenamen, 409 als Feldfehler              |
| Warum            | Der Anzeigename ist der einzige Schutz gegen doppelte Anlage. Echte Namensgleichheit löst der Owner über einen unterscheidenden Namen |
| Pflichtfelder    | Anzeigename und Primärkontakt (Nachname oder E-Mail). Alles andere optional — ein Kunde entsteht oft mit lückenhaften Daten           |
| Kundentyp        | Umschalter Firma / Privatperson. Bei „Firma" ist das Feld Firmenname sichtbar; bei „Privatperson" wird er verworfen                   |
| Kundennummer     | Wird von der Datenbank vergeben, ist im Formular **nicht** editierbar und erscheint erst nach dem Anlegen                             |
| Kategorie        | Auswahl aus `lead_categories` (aktive Einträge, nach `sort_order`), optional; unbekannte oder inaktive Kategorie ergibt 422           |
| Primärkontakt    | Nur beim Anlegen im Dialog. Bearbeiten ändert ausschließlich Kundenfelder; Kontakte pflegt Task 06                                    |
| Portalsprache    | Pflicht an der Person (`preferred_locale`), im Dialog mit der aktuellen UI-Sprache vorbelegt                                          |
| Client-Service   | `src/client/crm/customers-api-service.ts` nach dem jüngeren Muster `src/client/access/**` statt im Komponentenordner                  |
| Zeilen-Link      | Die Übersicht verlinkt die Akte erst mit Task 05 (`selected`). Bis dahin nur „Bearbeiten“ — kein Link ins Leere                       |

## Contract

```ts
// packages/common/src/contracts/crm/customer-write-fields.dto.ts — geteilte schreibbare Felder
// packages/common/src/contracts/crm/create-customer-request.dto.ts — Felder + primaryContact
// packages/common/src/contracts/crm/update-customer-request.dto.ts — Felder + version
// packages/common/src/contracts/crm/customer-primary-contact-input.dto.ts

export type CreateCustomerResult =
  | { ok: true; customer: CustomerDetailDto }
  | { ok: false; code: ValidationError; errors: z.ZodError["issues"] }
  | { ok: false; code: DisplayNameTaken | OwnerInactive };

export type UpdateCustomerResult =
  | { ok: true; customer: CustomerDetailDto }
  | { ok: false; code: ValidationError; errors: z.ZodError["issues"] }
  | { ok: false; code: CustomerNotFound | DisplayNameTaken }
  | {
      ok: false;
      code: VersionConflict;
      conflict: VersionConflictDto<CustomerDetailDto>;
    };
```

## Architektur

```txt
POST /api/workspace/crm/customers
  → withPermission(CustomersWrite)
  → createCustomer.command-handler (zod-Validierung im Handler, Muster: access)
      → Transaktion:
          memberResponsibilityLockService.lockActiveMemberForAssignment (FOR SHARE + active)
          Kategorie aktiv?
          people insert → customers insert → customer_contact_assignments insert (is_primary)
          activityService.createActivity(tx, { customerId, type: "created" })
          customerReadService.findDetailById(tx, id)
  → Result-Union → HTTP (201 | 400 | 409 | 422)

PATCH /api/workspace/crm/customers/[id]   Permission CustomersWrite, updateVersioned → 200 | 404 | 409 | 422
GET   /api/workspace/crm/customers        Permission CustomersRead, minimale Übersicht
```

Nach erfolgreichem Submit: Dialog schließen, `router.refresh()` — kein clientseitiges Nachhalten des
Listenzustands.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nächste>_add_customers_display_name_unique.sql
packages/db/src/constraint-names/crm/customers-constraint-names.ts

apps/workspace/src/app/api/workspace/crm/customers/route.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/route.ts
apps/workspace/src/app/api/workspace/crm/README.md

apps/workspace/src/server/workspace/crm/
  command-handler/create-customer.command-handler.ts
  command-handler/update-customer.command-handler.ts
  query-handler/list-customers.query-handler.ts
  query-handler/get-customer-by-id.query-handler.ts     von Task 05 wiederverwendet
  query-handler/list-active-customer-categories.query-handler.ts
  services/customer-schemas.ts
  services/customer-read-service.ts
  services/customer-write-mapping-service.ts
  services/customer-category-service.ts
  services/customer-constraint-violation-service.ts
apps/workspace/src/server/workspace/access/services/responsibilities/member-responsibility-lock-service.ts
packages/common/src/patterns/crm/customer-contact-display-name.ts   von Task 06 wiederverwendet
apps/workspace/src/common/patterns/crm/{customer-form,customer-dialog-query,euro-cents,crm-api-endpoints}.ts

apps/workspace/src/lib/workspace/crm/customer-api-error.ts
apps/workspace/src/client/crm/customers-api-service.ts
apps/workspace/src/common/constants/api-endpoints.ts          + CrmCustomers
apps/workspace/src/components/workspace/crm/form/customer-form-dialog/**
apps/workspace/src/components/workspace/crm/list/customers-basic-list/**
apps/workspace/src/components/workspace/crm/shell/customers-page-header/**
apps/workspace/src/app/[locale]/(app)/crm/{page,loading}.tsx
apps/workspace/src/i18n/dictionaries/workspace/crm/{meta,shell,list,form}/{de,en}.json
```

## Tickets

### CRM-04-T1 — Schemas, Command-Handler, Sperre

- **Inhalt:**
  - zod-Schemas; Trim vor Validierung, leere Strings werden zu `null`
  - Bei `customerType = individual` wird `companyName` verworfen, nicht gespeichert
  - Primärkontakt: Vorname, Nachname, E-Mail, Telefon, Funktion, Portalsprache; Nachname oder E-Mail Pflicht;
    Anzeigename aus Vor- und Nachname, Rückfall auf die E-Mail
  - Transaktion inklusive Activity-Eintrag über `activityService.createActivity` — **kein** direkter Insert
  - Unique-Verletzung am Anzeigenamen wird zu `CUSTOMER_DISPLAY_NAME_TAKEN`
  - Sperrbaustein für Zuweisung (`FOR SHARE`) und Deaktivierung (`FOR UPDATE`) unter `server/workspace/access/`
- **Akzeptanz:**
  - Tests: Anlegen mit Minimaldaten, Validierungsfehler ergibt die Issues, Fehler im Kontakt-Insert bricht die
    Transaktion ab, ohne Activity zu schreiben
  - Test: ein zweiter Kunde mit gleichem Anzeigenamen ergibt `CUSTOMER_DISPLAY_NAME_TAKEN`
  - Test: inaktiver Owner ergibt `CUSTOMER_OWNER_INACTIVE`, nichts wird geschrieben
  - Genau ein Activity-Eintrag pro angelegtem Kunden
  - Smoke: gleicher Anzeigename in anderer Schreibweise und mit Randleerzeichen wird von Postgres abgewiesen
  - Integrationstest: parallele Kundenanlage und Deaktivierung hinterlassen kein deaktiviertes Mitglied mit offenem
    Kunden

### CRM-04-T2 — Route Handler

- **Inhalt:**
  - `withPermission(Permission.CustomersWrite, …)`; bei Routen mit `params` wird der Wrapper innen aufgerufen
  - Status-Codes aus `HttpResponseCode`-Konstanten, nie nackte Zahlen
  - Endpunkte in `WorkspaceApiEndpoint` eintragen — keine URL-Literale im Client
- **Akzeptanz:**
  - Tests: 401 ohne Login, 404 ohne Zugang, 403 bei fehlender Permission, 201 im Erfolgsfall, 422 bei
    Validierungsfehler, 409 bei vergebenem Anzeigenamen und bei Versionskonflikt (`VersionConflictDto`)
  - README beschreibt alle Endpunkte mit Body und Statuscodes

### CRM-04-T3 — Formular-Dialog

- **Inhalt:**
  - Ein Dialog für Anlegen und Bearbeiten, Modus über Query-Parameter
  - Umschalter Firma / Privatperson ganz oben; er blendet das Feld Firmenname ein und aus
  - Primärkontakt-Block nur beim Anlegen
  - Fokusfalle und Escape-Schluss über den `Dialog` aus `packages/ui`
  - Feldfehler an den Feldern, Submit-Fehler als Statuszeile; Doppel-Submit blockiert
  - Vergebener Anzeigename als Feldfehler; Versionskonflikt übernimmt die aktuelle Version und behält die Eingaben
  - Adressblock optisch gruppiert, Notizfeld mit Zeichenzähler ab 80 Prozent
  - Stundensatz als Eurobetrag eingegeben, in Cent gespeichert
- **Akzeptanz:**
  - Alle Fehlerzustände sichtbar: Pflichtfeld leer, ungültige URL/E-Mail, Name vergeben, Konflikt, Serverfehler
  - Tastaturbedienung vollständig, Fokus kehrt nach dem Schließen auf den auslösenden Link zurück
  - `aria-invalid` und `aria-describedby` korrekt gesetzt

### CRM-04-T4 — Minimale Kundenübersicht und Verdrahtung

- **Inhalt:**
  - Bereich `crm` (Permission `customers.read`), Sidebar-Eintrag „CRM" und Route `/crm`
  - Schlichte Übersicht: Nummer, Anzeigename, Status, Primärkontakt; nicht archivierte Kunden nach `created_at`
    absteigend, festes Limit ohne Pagination. Bewusst **ohne** Toolbar, Sortierung und Filter
  - Button „Kunde anlegen" im Header und Zeilenaktion „Bearbeiten" nur mit `customers.write` — beide setzen nur
    Query-Parameter, die Page lädt bei `edit` serverseitig vor
  - Empty-State erklärt, wofür der Bereich gedacht ist, und verweist auf den Anlegen-Button
  - Der Query-Handler wird in Task 03 erweitert, nicht ersetzt: DTO bleibt `CustomerSummaryDto`
- **Akzeptanz:**
  - Neu angelegter Kunde erscheint nach `router.refresh()` in der Übersicht
  - Ein `edit`-Parameter mit unbekannter oder ungültiger ID öffnet keinen Dialog und wirft keinen Fehler
  - Die Übersicht ist ohne Filter und Suche vollständig bedienbar — kein toter Button
  - Mobil, Dark und Light geprüft; Tastaturbedienung vollständig

## Deploy-Sicherheit

1. **Live sichtbar:** Sidebar-Eintrag „CRM", eine schlichte Kundenübersicht, Anlegen und Bearbeiten.
   Kundenakte (Task 05) und Ansprechpartner (Task 06) folgen im selben Ordner vor dem Merge.
2. **Bricht nichts:** eine additive Migration (Unique-Index, `IF NOT EXISTS`), keine Änderung bestehender Routen.
   Vor Ordner 04 schreibt kein Pfad Kunden außer dem Seed, dessen Namen eindeutig sind. Die Deaktivierung sperrt
   zusätzlich die Membership-Zeile — ohne Änderung ihres Verhaltens.
3. **Offen:** Pagination, Sortierung, URL-Filter und Suche (Task 03, Ordner 05); Akte (Task 05); weitere
   Ansprechpartner und Personensuche (Task 06).

## End-to-End-Akzeptanz

1. Ein Kunde lässt sich anlegen (Name plus Primärkontakt), bekommt automatisch eine Nummer und
   erscheint sofort in der Übersicht.
2. Derselbe Anzeigename ein zweites Mal — auch in anderer Groß-/Kleinschreibung oder mit Randleerzeichen — wird
   abgewiesen und im Dialog am Namensfeld erklärt.
3. Ein Privatkunde lässt sich ohne Firmenname anlegen.
4. Bearbeiten lädt die bestehenden Werte vor und speichert Änderungen; eine veraltete Version überschreibt nichts.
5. Ein Kunde zeigt seinen Primärkontakt in der Listenspalte.
6. Alle Texte in DE und EN gepflegt.
7. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @invessiv/workspace build` grün.
