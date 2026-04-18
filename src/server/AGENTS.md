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
- Persistenz in `src/server/db`
- Gemeinsame Contracts in `src/common/contracts/contact`

## Benennung

- `*-mapping-service.ts` für Transformations-Services verwenden.
- `map<Thing>ApiToDb` für API-zu-DB-Mapping verwenden.
- `map<Thing>DbToApi` später für die Gegenrichtung verwenden.
- `persist-*.ts` für Datenbank-Persistenzfunktionen verwenden.
- `*-record.ts` und `*-persist-input.ts` für gemeinsame serverseitige Persistenz-Contracts verwenden.

## Strukturregeln

- Pro Datei möglichst nur eine Verantwortung.
- SQL- und Tabellenwissen nach `src/server/db`.
- `src/server/db/record-configuration/**` ist die kanonische Quelle fuer DB-Modelle auf Basis von `pgTable`.
- In `record-configuration/**` liegt pro Tabelle genau ein Modellfile; Sammeldateien oder parallele Modellvarianten werden dort nicht neu eingefuehrt.
- Tabellennahe Record-Typen werden serverseitig unter `src/server/db/records/**` abgelegt und nicht in `src/common/**` gehalten.
- Contracts werden serverseitig unter `src/server/db/contracts/**` abgelegt und nicht unter `src/server/**` gemischt.
- `records/**` enthält nur DB-nahe Record-/Row-Shapes; zusammengesetzte Persistenz-Payloads, Persistenz-Inputs und Persistenz-Resultate liegen ausschließlich unter `contracts/**`.
- Record-Typen unter `src/server/db/records/**` spiegeln die aktuelle DB-Struktur direkt: Tabellennahe Dateinamen, Spaltennamen in `snake_case` und keine app-nahen `camelCase`-Aliasfelder.
- Doppelte Tabellenmetadaten sind zu vermeiden: Spaltenlisten, Tabellennamen und aehnliche DB-Strukturinfos werden nicht parallel manuell neben dem `pgTable`-Modell gepflegt.
- Reines Mapping nicht in `src/server/db`.
- Orchestrierung nicht in `src/server/db`.
- Tests nach `src/server/tests` legen und die Server-Struktur dort spiegeln.

## Sprachregel

- Inhalte von `AGENTS.md` in diesem Projekt immer auf Deutsch pflegen.
