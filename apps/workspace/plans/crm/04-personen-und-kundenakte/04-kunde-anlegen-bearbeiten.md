# Task 04 — Kunde anlegen und bearbeiten

> **Merge-Einheit:** Ordner 04 · **Branch:** `feat/crm-personen-und-kundenakte`
> **Aufwand:** M · **Abhängigkeiten:** Task 01 (Schema, Contracts), Task 02 (Rechte)
> **Migration:** keine

- Kunde entsteht nur gemeinsam mit genau einem bestätigten Primärkontakt.
- Primärkontakt wird als globale Person angelegt oder bewusst verknüpft; Firmen-E-Mail/-Telefon und
  Funktion gehören zur Zuordnung.
- `ownerMemberId` ist Pflicht und initial das aktuelle Mitglied. Der Command sperrt die Membership des Owners in
  derselben Transaktion (`FOR SHARE`) und prüft `active`, damit keine parallele Deaktivierung einen verwaisten Kunden
  hinterlässt (Task 02d, Abschnitt „Bekannte Grenze: Zuständigkeitszählung ohne Sperre“).
- Status nur `active | paused | archived`; kein `deleted_at`-Filter.
- Create/Update verwenden `version`; veralteter Write liefert 409 samt aktuellem DTO.
- Dublettenprüfung normalisiert Name, Domain und USt-ID, warnt höchstens fünf Treffer und blockiert
  nach bewusster Bestätigung niemals.
- Idempotenzschlüssel verhindert doppelte Anlage; Kundennummern werden nicht recycelt.

## Context

Der erste sichtbare CRM-Bereich: die CRM-Route entsteht hier, dazu eine **minimale Kundenübersicht**
als Einstieg und der Schreibpfad — ein Dialog, der Anlegen und Bearbeiten in einer Komponente
abbildet (Muster `lead-form-dialog`), dahinter Route Handler, zod-Schemas und Command-Handler.

Die Übersicht bleibt bewusst schlicht: Nummer, Anzeigename, Status und Primärkontakt, Klick öffnet
die Akte. Kein URL-State, keine Toolbar, keine geteilten Listenbausteine. Zur vollen Liste mit
Pagination, URL-Filtern und den Komponenten aus Task 02a baut sie Task 03 in Ordner 05 aus.

Das ist Absicht und kein Doppelbau: Ordner 05 hängt an dieser Einheit, also kann die volle Liste
hier noch nicht entstehen — und ohne irgendeinen Einstieg wäre die Kundenakte nach dem Merge nicht
erreichbar.

Der Primärkontakt entsteht **im selben** Command wie der Kunde (siehe Kopfzeile); weitere
Ansprechpartner folgen in Task 06.

## Entscheidungen

| Bereich          | Entscheidung                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Dialog           | Eine Komponente für beide Modi über `CustomerFormDialogMode`, gesteuert über Query-Parameter (`mode`, `edit`)                          |
| Schreibpfad      | Client `fetch` → Route Handler → Command-Handler. **Keine** Server Actions (Projektkonvention)                                         |
| Fehlerbehandlung | Handler liefern Result-Unions, werfen nicht. Route mappt Code auf HTTP über eine nicht-exportierte Message-Map                         |
| Duplikate        | **Warnung statt Verbot.** Beim Tippen des Namens sucht der Dialog ähnliche Kunden und zeigt sie als Hinweis mit Link — blockiert nicht |
| Warum            | Zwei echte „Müller GmbH" in verschiedenen Städten sind ein gültiger Zustand. Ein Unique-Index erzwingt sonst verfälschte Namen         |
| Pflichtfelder    | Nur `display_name`. Alles andere optional — ein Kunde entsteht oft mit lückenhaften Daten                                              |
| Kundentyp        | Umschalter Firma / Privatperson. Bei „Firma" ist das Feld Firmenname sichtbar und wird vorbelegt aus dem Anzeigenamen                  |
| Kundennummer     | Wird von der Datenbank vergeben, ist im Formular **nicht** editierbar und erscheint erst nach dem Anlegen                              |
| Kategorie        | Auswahl aus `lead_categories` (aktive Einträge, nach `sort_order`), optional                                                           |
| Erstkontakt      | Beim Anlegen optional; wird als `is_primary`-Kontakt gespeichert                                                                       |

## Contract

```ts
// apps/workspace/src/server/workspace/crm/services/create-customer.schema.ts
const createCustomerSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  customerType: z.enum(CUSTOMER_TYPE_VALUES).default(CustomerType.Company),
  companyName: z.string().trim().max(200).nullish(),
  status: z.enum(CUSTOMER_STATUS_VALUES).default(CustomerStatus.Active),
  categoryId: z.uuid().nullish(),
  defaultHourlyRateCents: z.int().min(0).nullish(),
  street: z.string().trim().max(200).nullish(),
  postalCode: z.string().trim().max(20).nullish(),
  city: z.string().trim().max(120).nullish(),
  country: z.string().trim().max(120).nullish(),
  websiteUrl: z.url().nullish(),
  vatId: z.string().trim().max(64).nullish(),
  notes: z.string().trim().max(20_000).nullish(),
  primaryContact: customerContactInputSchema.nullish(),
});
```

```ts
// packages/common/src/contracts/crm/results/create-customer-result.ts
export type CreateCustomerResult =
  | { ok: true; customer: CustomerDetailDto }
  | {
      ok: false;
      code: typeof CustomerErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    };
```

```ts
// Duplikat-Hinweis — eine reine Leseabfrage, kein Fehlerfall
// GET /api/workspace/crm/customers/similar?name=…
export interface SimilarCustomerDto {
  id: string;
  customerNumber: number;
  displayName: string;
  city: string | null;
}
```

## Architektur

```txt
POST /api/workspace/crm/customers
  → withPermission(CustomersWrite)
  → zod parse
  → createCustomer.command-handler
      → Transaktion: customers insert + customer_contact_assignments insert (Primärkontakt, Pflicht)
      → activityService.createActivity(tx, { customerId, type: "created" })
  → Result-Union → HTTP (201 | 422)

PATCH /api/workspace/crm/customers/[id]   analog, Permission CustomersWrite

GET  /api/workspace/crm/customers/similar?name=…
  → withPermission(CustomersRead)
  → findSimilarCustomers: bis zu 5 Treffer über normalisierten Namensvergleich, ohne `deleted_at`
```

Nach erfolgreichem Submit: Dialog schließen, `router.refresh()` — kein clientseitiges Nachhalten des
Listenzustands.

## Verzeichnisstruktur

```txt
apps/workspace/src/app/api/workspace/crm/customers/route.ts
apps/workspace/src/app/api/workspace/crm/customers/[id]/route.ts
apps/workspace/src/app/api/workspace/crm/README.md            API-Contract, Muster: leads/README.md

apps/workspace/src/server/workspace/crm/
  command-handler/create-customer.command-handler.ts
  command-handler/update-customer.command-handler.ts
  services/create-customer.schema.ts
  services/update-customer.schema.ts
  services/customer-validation-service.ts
  query-handler/find-similar-customers.query-handler.ts

apps/workspace/src/lib/workspace/crm/customer-api-error.ts
apps/workspace/src/common/constants/api-endpoints.ts          + CrmCustomers
apps/workspace/src/components/workspace/crm/form/customer-form-dialog/
  customer-form-dialog.tsx  .module.css  .schema.ts  customers-service.ts
apps/workspace/src/i18n/dictionaries/workspace/crm/form/{de,en}.json
```

## Tickets

### CRM-04-T1 — Schemas, Command-Handler, Duplikatsuche

- **Files:** `services/*.schema.ts`, `command-handler/{create,update}-customer.command-handler.ts`,
  `query-handler/find-similar-customers.query-handler.ts` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - zod-Schemas wie oben; Trim vor Validierung, leere Strings werden zu `null`
  - Bei `customerType = individual` wird `companyName` verworfen, nicht gespeichert
  - Transaktion inklusive Activity-Eintrag über `activityService.createActivity` (Task 01a) — **kein** direkter Insert
    in die Aktivitätentabelle
  - `findSimilarCustomers(name)`: unscharfer Vergleich über `lower(btrim(...))` auf Anzeigename und
    Firmenname, maximal fünf Treffer, Statusfilter statt `deleted_at`
- **Akzeptanz:**
  - Tests: Anlegen mit Minimaldaten, Validierungsfehler ergibt die Issues, Transaktion rollt bei
    Fehler im Kontakt-Insert vollständig zurück
  - Test: zwei Kunden mit identischem Namen lassen sich anlegen und bekommen verschiedene Nummern
  - Test: `findSimilarCustomers` findet denselben Namen in abweichender Schreibweise und mit
    führenden Leerzeichen, ignoriert gelöschte Kunden
  - Genau ein Activity-Eintrag pro angelegtem Kunden

### CRM-04-T2 — Route Handler

- **Files:** `api/workspace/crm/customers/route.ts`, `[id]/route.ts`,
  `lib/workspace/crm/customer-api-error.ts`, `common/constants/api-endpoints.ts`,
  `api/workspace/crm/README.md` + Tests
- **Skills:** `best-practices`
- **Inhalt:**
  - `withPermission(Permission.CustomersWrite, …)`; bei Routen mit `params` wird der Wrapper innen
    aufgerufen (bestehendes Muster)
  - Status-Codes aus `HttpResponseCode`-Konstanten, nie nackte Zahlen
  - Endpunkte in `WorkspaceApiEndpoint` eintragen — keine URL-Literale im Client
- **Akzeptanz:**
  - Tests: 401 ohne Login, 404 ohne Zugang, 403 bei fehlender Permission, 201 im Erfolgsfall,
    422 bei Validierungsfehler
  - README beschreibt alle Endpunkte mit Body und Statuscodes

### CRM-04-T3 — Formular-Dialog

- **Files:** `components/workspace/crm/form/customer-form-dialog/**`,
  `dictionaries/workspace/crm/form/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Ein Dialog für Anlegen und Bearbeiten, Modus über Query-Parameter
  - Umschalter Firma / Privatperson ganz oben; er blendet das Feld Firmenname ein und aus
  - **Duplikat-Hinweis** unter dem Namensfeld: verzögerte Abfrage von `…/customers/similar`,
    Treffer als Liste mit Nummer, Name und Ort, jeweils verlinkt. Rein informativ — der Hinweis
    blockiert das Absenden nicht und ist kein Feldfehler
  - Fokusfalle und Escape-Schluss über den bestehenden `dialog-focus-trap`
  - Feldfehler an den Feldern, Submit-Fehler als Statuszeile; Doppel-Submit blockiert
  - Adressblock optisch gruppiert, Notizfeld mit Zeichenzähler ab 80 Prozent
  - Stundensatz als Eurobetrag eingegeben, in Cent gespeichert
- **Akzeptanz:**
  - Alle Fehlerzustände sichtbar: Pflichtfeld leer, ungültige URL, Serverfehler
  - Der Duplikat-Hinweis erscheint bei ähnlichem Namen, verschwindet beim Ändern und lässt sich
    ignorieren; ein Screenreader kündigt ihn über eine Live-Region an, ohne den Fokus zu stehlen
  - Tastaturbedienung vollständig, Fokus kehrt nach dem Schließen auf den auslösenden Button zurück
  - `aria-invalid` und `aria-describedby` korrekt gesetzt

### CRM-04-T4 — Minimale Kundenübersicht und Verdrahtung

- **Files:** `(app)/crm/page.tsx`, `loading.tsx`,
  `components/workspace/crm/shell/customers-page-header/**`,
  `components/workspace/crm/list/customers-basic-list/**`,
  `query-handler/list-customers.query-handler.ts` (erste, einfache Fassung),
  `dictionaries/workspace/crm/list/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Sidebar-Eintrag „CRM" und Route `/crm`
  - Schlichte Übersicht: Nummer, Anzeigename, Status, Primärkontakt; nach `created_at` absteigend,
    festes Limit ohne Pagination. Bewusst **ohne** URL-State, Toolbar, Sortierung und Filter
  - Klick auf eine Zeile öffnet die Akte aus Task 05; Button „Kunde anlegen" im Header, Zeilenaktion
    „Bearbeiten" — beide setzen nur Query-Parameter, die Page lädt bei `edit` serverseitig vor
  - Empty-State erklärt, wofür der Bereich gedacht ist, und verweist auf den Anlegen-Button
  - Der Query-Handler wird in Task 03 erweitert, nicht ersetzt: Signatur und DTO bleiben
- **Akzeptanz:**
  - Neu angelegter Kunde erscheint nach `router.refresh()` in der Übersicht
  - Ein `edit`-Parameter mit unbekannter ID öffnet keinen Dialog und wirft keinen Fehler
  - Die Übersicht ist ohne Filter und Suche vollständig bedienbar — kein toter Button, kein
    deaktiviertes Filterfeld als Platzhalter
  - Die Akte ist über die Übersicht erreichbar, nicht nur über eine geratene URL
  - Mobil, Dark und Light geprüft; Tastaturbedienung vollständig

## Deploy-Sicherheit

1. **Live sichtbar:** Sidebar-Eintrag „CRM", eine schlichte Kundenübersicht, Anlegen und Bearbeiten,
   dazu die Kundenakte aus Task 05 und die Ansprechpartner aus Task 06. Der Bereich ist ab hier
   eigenständig benutzbar.
2. **Bricht nichts:** keine Migration, keine Änderung bestehender Routen. `withPermission` wird hier
   zum ersten Mal produktiv genutzt — ausschließlich auf neuen Endpunkten.
3. **Offen:** Pagination, Sortierung, URL-Filter und Suche (Task 03, Ordner 05). Abgesichert
   dadurch, dass die Übersicht ohne sie vollständig bedienbar ist und keine deaktivierten
   Platzhalter zeigt — kein Filterfeld, das nichts tut.

## End-to-End-Akzeptanz

1. Ein Kunde lässt sich anlegen (Name plus Primärkontakt), bekommt automatisch eine Nummer und
   erscheint sofort in der Übersicht.
   1a. Ein bestehender Kunde ist über die Übersicht auffindbar und anklickbar — ohne Filter, Suche
   oder geratene URL.
2. Derselbe Name ein zweites Mal erzeugt einen sichtbaren Hinweis auf den bestehenden Kunden — und
   lässt sich trotzdem anlegen, wenn es wirklich ein zweiter Kunde ist.
3. Der Hinweis greift auch bei abweichender Groß- und Kleinschreibung und führenden Leerzeichen.
4. Ein Privatkunde lässt sich ohne Firmenname anlegen.
5. Bearbeiten lädt die bestehenden Werte vor und speichert Änderungen.
6. Ein Kunde mit Erstkontakt zeigt diesen als Primärkontakt in der Listenspalte.
7. Alle Texte in DE und EN gepflegt.
8. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
