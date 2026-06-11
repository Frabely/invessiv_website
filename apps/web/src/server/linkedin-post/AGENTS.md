# AGENTS.md - LinkedIn-Post-Serverlogik

## Geltungsbereich

Diese Regeln gelten für serverseitige LinkedIn-Post-Generator-Logik unter `apps/web/src/server/linkedin-post/`.
Sie ergänzen die Root-Regeln und präzisieren die Grenze zwischen Web-App-Servercode und `@invessiv/db`.

## Server-zu-DB-Grenze

- Vor DB-Änderungen ist aktiv zu prüfen, welches bestehende Pattern passt:
  - Öffentliche Web-Flows mit wiederverwendbarer Persistenzlogik folgen dem Contact-Pattern: App-Servercode mappt
    fachliche Inputs und ruft fachliche Funktionen aus `@invessiv/db/<domain>/**` auf.
  - App-/Workspace-Command- und Query-Handler können wie
    `apps/workspace/src/server/workspace/leads/command-handler/**` direkt `getDrizzleDatabaseClient`,
    Drizzle-Operatoren und Tabellen aus `@invessiv/db/record-configuration` nutzen, wenn die Persistenzlogik
    handlernah und nicht paketübergreifend wiederverwendbar ist.
- Patterns werden nicht gemischt: Entweder ein Handler nutzt eine dedizierte DB-Persistenzfunktion aus
  `@invessiv/db/<domain>/**`, oder er arbeitet als Command-/Query-Handler direkt mit Drizzle und Tabellen.
- DB-nahe SQL-/Drizzle-Logik liegt im DB-Package, z. B. unter `packages/db/src/linkedin-post/**`.
- DB-Tabellenkonfiguration liegt ausschließlich unter `packages/db/src/record-configuration/**`.
- DB-nahe Input-/Result-Typen liegen unter `packages/db/src/contracts/**` und orientieren sich an den Spaltennamen der
  Persistenzgrenze.
- App-interne Runtime-Typen dürfen eigene, für den Web-Server passende Namen verwenden; Mapping zwischen DB-Shape und
  App-Shape passiert an der Server-zu-DB-Grenze.
- Bei direkter Drizzle-Nutzung im App-Servercode bleiben SQL-/Tabellenzugriffe im Command-/Query-Handler oder in klar
  benannten shared DB-Helfern; Mapping-Services, Validierung und Provider-Integrationen werden nicht mit DB-Zugriffen
  vermischt.

## Struktur

- API-Route-Dateien bleiben dünne HTTP-Adapter: Requestdaten einsammeln, Command-/Query-Handler aufrufen und
  HTTP-Response bauen.
- Für jeden API-Endpunkt gibt es im Regelfall einen passenden Command- oder Query-Handler unter `handlers/`.
- Command-/Query-Handler orchestrieren Validierung, Limit-Prüfung, Generator-Aufruf, Rendering, optionale
  Mail-Zustellung und Fehler-Mapping.
- Fachliche Services liegen unter `services/`, gegliedert nach Verantwortung:
  - `services/generation/` — Generator-Orchestrierung, OpenAI-Adapter und Mock-Variante
  - `services/rendering/` — kanonisches HTML-/PNG-Rendering des Posts
  - `services/usage-limit/` — IP-Pseudonymisierung, Limit-Reservierung und DB-Store-Adapter
- Request-Schema und Validierungs-Mapping liegen unter `validation/`, Fehler-Mapping unter `errors/`.
- Services exportieren ein Objekt im Pattern
  `export const <serviceName> = { <serviceFunction1>, <serviceFunction2> } as const;`; Call-Sites importieren dieses
  Service-Objekt statt lose Einzelfunktionen.
- Wenn eine Funktion DB-Zustand verändert oder liest, wird die eigentliche Persistenzfunktion im DB-Package angelegt und
  von hier nur aufgerufen.
- Tests für Serverlogik mocken externe Provider wie OpenAI, Mail und DB-Persistenz, sofern kein expliziter DB-Smoke
  gefragt ist.

## Datenschutz und Limits

- Für Nutzungslimits werden keine Cookies, kein localStorage und keine Browser-Fingerprints eingeführt.
- Roh-IP-Adressen werden nicht persistiert; der Web-Server bildet vor dem DB-Aufruf nur eine pseudonyme technische
  Kennung.
- Limit-Datensätze speichern keine Generator-Eingaben, keine Outputs und keine E-Mail-Adressen.
