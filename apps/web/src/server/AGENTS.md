# AGENTS.md - Web-Server

## Geltungsbereich

Diese Regeln gelten für serverseitige Logik unter `apps/web/src/server/**`. Spezifischere `AGENTS.md`-Dateien in
Unterordnern ergänzen diese Regeln.

## Struktur

- API-Routen bleiben dünne HTTP-Adapter. Fachliche Orchestrierung gehört in Command-/Query-Handler oder Services unter
  `src/server/**`.
- Service-Module exportieren bevorzugt ein einziges Service-Objekt als öffentliche API:
  `export const <serviceName> = { <serviceFunction1>, <serviceFunction2> } as const;`.
- Interne Hilfsfunktionen bleiben unexportiert und werden nur über das Service-Objekt erreichbar gemacht, wenn sie
  außerhalb gebraucht werden.
- Tests importieren das Service-Objekt statt interne Helper direkt zu importieren.

## DB-Zugriffe

- DB-Zugriffe erfolgen über das kanonische Drizzle-`pgTable`-Schema aus `@invessiv/db/record-configuration` bzw. die
  darauf aufbauenden Persistenzfunktionen aus `@invessiv/db/<domain>/**`.
- Tabellen- und Spaltennamen werden nicht als manuelle Raw-SQL-Strings dupliziert, wenn ein `pgTable`-Modell existiert.
- Query Builder, Drizzle-Operatoren (`eq`, `and`, `or`, `lt`, `inArray` usw.) und Schema-Spalten haben Vorrang vor Raw
  SQL.
- Raw SQL ist nur für einzelne Ausdrücke zulässig, die mit dem Query Builder nicht sinnvoll ausdrückbar sind (z. B.
  `case`, `greatest`, spezielle Postgres-Funktionen). Auch dann werden Tabellen/Spalten über Schema-Referenzen
  interpoliert, nicht als freie String-Literale geschrieben.
- Wenn unklar ist, ob ein Zugriff noch Query Builder oder schon Raw SQL sein darf, vor der Umsetzung nachfragen.

## Server-zu-DB-Grenze

- Wiederverwendbare oder öffentliche Persistenzlogik liegt im DB-Package und wird aus der Web-Server-Schicht aufgerufen.
- Handlernahe, nicht wiederverwendbare Command-/Query-Logik darf direkt mit `getDrizzleDatabaseClient()` arbeiten,
  sofern die DB-Regeln oben eingehalten werden.
- Mapping, Validierung, Provider-Integrationen und DB-Zugriffe werden nicht in einer Sammelfunktion vermischt.
