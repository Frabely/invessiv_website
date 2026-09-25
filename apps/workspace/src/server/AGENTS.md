# Server

Dieser Ordner ist für Backend-Logik, Orchestrierung, Persistenz und gemeinsame serverseitige Contracts gedacht.

## Was hier hingehört

- Command-Handler und Request-Orchestrierung
- Validierungsverdrahtung
- Mapper und Transformations-Services
- DB-Client-Setup, Migrationen, Skripte und Persistenz
- Mail-Services und andere serverseitige Integrationen
- Gemeinsame serverseitige Contracts und DTOs

## Was hier nicht hingehört

- Wiederverwendbare UI-Komponenten
- Seitenkomposition auf Routenebene
- Sprachwörterbücher

## Contact-Flow-Struktur

Für Contact-bezogenen Code gilt die Trennung:

- Orchestrierung in `src/server/contact`
- Mapping in `src/server/services/contact`
- Persistenz in `packages/db/src`
- Gemeinsame Contracts in `packages/common/src/contracts/contact`

## Benennung

- `*-mapping-service.ts` für Transformations-Services verwenden.
- `map<Thing>ApiToDb` für API-zu-DB-Mapping verwenden.
- `map<Thing>RowToDto` / `map<Thing>DbToApi` für DB-Row-zu-DTO-Richtung verwenden.
- `persist-*.ts` für Datenbank-Persistenzfunktionen verwenden.
- `*-record.ts` und `*-persist-input.ts` für gemeinsame serverseitige Persistenz-Contracts verwenden.

## Handler vs. Service (Benennung & Schnitt)

- Ein Command-/Query-Handler ist nach seinem Anwendungsfall benannt (`updateProject`, `createCustomer`) und trägt
  **kein** `Service` im Namen. Datei: `<verb>-<entity>.command-handler.ts` bzw. `….query-handler.ts`.
- Ein **Service** ist das Bindeglied zwischen mehreren Handlern: Er entsteht erst, wenn dieselbe Logik in einem zweiten
  Handler gebraucht wird. Dann wandert die Logik in ein Service-Objekt (z. B. `projectService` mit `updateProject`), und
  beide Handler rufen es auf — statt dass ein Handler den anderen aufruft oder die Logik kopiert wird.
- Services nach Entität oder zusammenhängendem Fachkontext schneiden und zugehörige Operationen in einem Service-Objekt
  anbieten. Keine Ein-Funktions-Services als bloße Hülle: eine einzelne wiederverwendete Funktion in einen passenden
  bestehenden Service aufnehmen oder als benannten Helfer ohne `Service`-Suffix führen. Handler haben dagegen genau
  einen Anwendungsfall pro Datei. Fachlich fremde Operationen werden nicht künstlich zusammengelegt.
- Für verpflichtend separat gehaltene Mapper (`*-mapping-service.ts`) gilt die Mapping-Service-Pflichtstruktur unten;
  ein eigenständiger Mapper darf deshalb eine einzige öffentliche Mapping-Methode besitzen.
- Solange es nur einen Aufrufer gibt, bleibt die Logik im Handler; kein vorsorglicher Service „für später“.
- Abgrenzung: `Service` als **Fachbegriff** ist davon unberührt. `LineItemTemplate` (Leistungskatalog) ist eine Entität
  und heißt korrekt so. Die einem Projekt zugewiesene Teilleistung heißt `ProjectLineItem` (Tabelle
  `project_line_items`), nicht `ProjectService` — der Name `…Service` ist für Bindeglied-Services reserviert.

## Mapping-Services — Tests (Pflicht)

Jeder Mapping-Service bekommt eine eigene Testdatei. Die Datei liegt unter
`src/server/tests/workspace/<domain>/services/<konzept>-mapping-service.test.ts` und spiegelt damit die Server-Struktur.

Tests für Mapping-Services:

- importieren die Mapping-Funktion direkt — keine DB-Mocks, keine `vi.mock`-Aufrufe nötig
- decken mindestens ab: alle camelCase-Felder korrekt gemappt, Nullable-Felder (null → null), `category: null` wenn
  Kategorie-Felder fehlen, leere Arrays für `socialProfiles`, `activities`, `submissions` wenn keine vorhanden

Diese Regel gilt ab sofort für jeden neuen und jeden nachträglich extrahierten Mapping-Service.

## Mapping-Services — Pflichtstruktur

Mapping-Logik (DB-Row → DTO) gehört **nie** inline in Query- oder Command-Handler. Sie lebt in einer eigenen
`*-mapping-service.ts`-Datei unter `services/<konzept>/` der jeweiligen Domain:

```
src/server/workspace/leads/services/
  lead-summary/
    lead-summary-mapping-service.ts   ← mapLeadRowToSummaryDto
  lead-category/
    lead-category-mapping-service.ts  ← auslagern, sobald ein zweiter Handler denselben Join mappt
```

**Faustregel für Teil-Mapper** (z. B. Category-Join): Ein einziger Callsite bleibt inline im übergeordneten
Mapping-Service. Sobald ein zweiter Handler dieselbe Join-Logik braucht, wird der Teil-Mapper in eine eigene Datei
extrahiert.

**Row-Typen** (`LeadSummaryRow`, `LeadDetailRow` …) liegen in `packages/common/src/contracts/<domain>/rows/` — nicht im
Mapping-Service selbst und nicht im Query-Handler.

## Strukturregeln

- Pro Datei möglichst nur eine Verantwortung.
- SQL- und Tabellenwissen nach `packages/db/src`.
- `packages/db/src/record-configuration/**` ist die kanonische Quelle fuer DB-Modelle auf Basis von `pgTable`.
- DB-Zugriffe erfolgen über das kanonische Drizzle-`pgTable`-Schema aus `@invessiv/db/record-configuration`; Tabellen-
  und Spaltennamen werden nicht als manuelle Raw-SQL-Strings dupliziert, wenn ein `pgTable`-Modell existiert.
- Query Builder, Drizzle-Operatoren (`eq`, `and`, `or`, `lt`, `inArray` usw.) und Schema-Spalten haben Vorrang vor Raw
  SQL.
- Raw SQL ist nur für einzelne Ausdrücke zulässig, die mit dem Query Builder nicht sinnvoll ausdrückbar sind (z. B.
  `case`, `greatest`, spezielle Postgres-Funktionen). Auch dann werden Tabellen/Spalten über Schema-Referenzen
  interpoliert, nicht als freie String-Literale geschrieben.
- Wenn unklar ist, ob ein Zugriff noch Query Builder oder schon Raw SQL sein darf, vor der Umsetzung nachfragen.
- In `record-configuration/**` liegt pro Tabelle genau ein Modellfile; Sammeldateien oder parallele Modellvarianten
  werden dort nicht neu eingefuehrt.
- Tabellennahe Record-Typen werden serverseitig unter `packages/db/src/records/**` abgelegt und nicht in
  `packages/common/src/**` gehalten.
- Contracts werden serverseitig unter `packages/db/src/contracts/**` abgelegt und nicht unter `src/server/**` gemischt.
- `records/**` enthält nur DB-nahe Record-/Row-Shapes; zusammengesetzte Persistenz-Payloads, Persistenz-Inputs und
  Persistenz-Resultate liegen ausschließlich unter `contracts/**`.
- Record-Typen unter `packages/db/src/records/**` spiegeln die aktuelle DB-Struktur direkt: Tabellennahe Dateinamen,
  Spaltennamen in `snake_case` und keine app-nahen `camelCase`-Aliasfelder.
- Doppelte Tabellenmetadaten sind zu vermeiden: Spaltenlisten, Tabellennamen und aehnliche DB-Strukturinfos werden nicht
  parallel manuell neben dem `pgTable`-Modell gepflegt.
- Reines Mapping nicht in `packages/db/src`.
- Orchestrierung nicht in `packages/db/src`.
- Tests nach `apps/workspace/src/server/tests` legen und die Server-Struktur dort spiegeln.

## Service-Exports in `src/server/**`

- Service-Module exportieren nach außen bevorzugt ein einziges Service-Objekt als öffentliche API.
- Interne Hilfsfunktionen bleiben in der Datei unexportiert und werden nur vom Service-Objekt verwendet.
- Wenn ein Helper auch extern gebraucht wird, wird er über das Service-Objekt erreichbar gemacht statt zusätzlich als
  named export zu erscheinen.
- Tests importieren das Service-Objekt und rufen dessen Methoden auf, statt interne Hilfsfunktionen direkt zu
  importieren.

## Typen-Regel (verbindlich)

Exported TypeScript-Typen und Interfaces gehören **nicht** inline in Service- oder Handler-Dateien. Sie werden immer in
eigenen Dateien außerhalb definiert:

- **Client/Server-shared** (Input-Shapes, Result-Shapes ohne Server-only-Imports):
  `packages/common/src/contracts/<domain>/`
  — z. B. `create-lead-result.ts` unter `results/`, `create-lead-activity-input.ts` im Domain-Root
- **Rein serverseitig** (enthält `server-only`-Imports oder DB-Typen): eigene `*-types.ts`-Datei innerhalb
  `src/server/workspace/<domain>/`

Die Service-/Handler-Datei importiert den Typ direkt aus der jeweiligen Contract-Datei.

Dieselbe Export-Regel gilt für Konstanten, Objekt-Maps und Patterns: Was exportiert / von anderen Dateien genutzt wird,
liegt außerhalb (Const-Objekte/Werte in `packages/common/src/constants/<domain>/` bzw. server-only in `src/server/**`,
seiteneffektfreie Helfer in `patterns/`). **Rein lokale, nicht exportierte** Helfer-Typen/-Konstanten dürfen in der
Service-/Handler-Datei bleiben, solange sie nur dort genutzt werden.

## HTTP- und DTO-Grenze

- `unknown` ist nur an der äußersten HTTP- bzw. Route-Grenze zulässig. Ab dort wird der Request gegen ein
  explizites DTO-Schema validiert und nur noch als typisiertes DTO weitergereicht.
- Command-Handler erhalten keine untyped Payloads als Fachmodell. Ihr Input ist ein Shared DTO aus
  `packages/common/src/contracts/<domain>/` oder ein klar serverseitiger Persistenz-/Result-Input aus `src/server/**`.
- Wenn ein Handler noch mit `unknown` arbeitet, ist das ein Architektur-Debt und keine neue Normalform.

## HTTP-Konstanten (verbindlich)

HTTP-Methoden, Header-Namen, Media-Types und Statuscodes kommen ausschließlich aus
`@invessiv/common/constants/http/`:

| Const-Objekt       | Datei                    | Beispiel                              |
| ------------------ | ------------------------ | ------------------------------------- |
| `HttpMethod`       | `http-methods.ts`        | `HttpMethod.Post` statt `"POST"`      |
| `HttpHeaderName`   | `http-header-names.ts`   | `HttpHeaderName.ContentType`          |
| `MediaType`        | `media-types.ts`         | `MediaType.Json`                      |
| `HttpResponseCode` | `http-response-codes.ts` | `HttpResponseCode.Conflict` statt 409 |

- **Neuanlage:** Jeder neue Handler, jede neue Route, jeder neue Client-Service und jeder neue Test nutzt diese
  Konstanten von Anfang an. String- oder Zahl-Literale wie `"POST"`, `"Content-Type"`, `"application/json"` oder `409`
  sind ein Review-Befund.
- **Fehlender Wert:** Wird eine Methode, ein Header oder ein Media-Type gebraucht, der noch fehlt, wird er im
  jeweiligen Const-Objekt samt Test ergänzt — nie lokal in der nutzenden Datei definiert.
- **Bestand:** Nutzt eine Datei noch Literale, wird sie beim nächsten fachlichen Ändern im selben Change mit
  umgestellt. Ein vorsorglicher Komplettumbau aller Altdateien ist nicht nötig.

## Error-Code & Message-Konvention

- Error-Codes kommen immer aus dem zugehörigen `*ErrorCode`-Const-Objekt in `packages/common/src/constants/<domain>/`.
  Kein
  Handler oder Service schreibt `"NOT_FOUND"` oder `"INTERNAL"` als String-Literal in eine Response.
- Message-Texte werden in einer einzigen `*-error.ts`-Datei auf Route-Ebene (oder äquivalenter Layer-Ebene) als
  `Record<FooErrorCode, string>` gemappt — nicht in Server-Handlern, nicht verteilt über mehrere Dateien.
- Die `MESSAGES`-Map innerhalb des Helpers ist **nicht exportiert**, solange kein externer Code (z. B. Tests oder
  i18n-Layer) auf einzelne Nachrichten zugreifen muss.
- Server-Handler und Command-Handler liefern strukturierte Ergebnis-Typen (`ok: true/false`, `code`, ggf. `errors`). Die
  Übersetzung in HTTP-Status und Message-Text passiert ausschließlich in der Route/Layer, die den Helper nutzt.

## Sprachregel

- Inhalte von `AGENTS.md` in diesem Projekt immer auf Deutsch pflegen.
