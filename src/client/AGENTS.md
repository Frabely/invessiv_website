# Client

Dieser Ordner enthält browserseitige Hilfslogik, Service-Module und andere Client-only-Utilities.

## Was hier hingehört

- Client-seitige Services und Fetch-Helfer
- Browser-Only-Logik für UI-Interaktionen, API-Calls und lokale Orchestrierung
- Wiederverwendbare Hilfsfunktionen für clientseitige Flows

## Was hier nicht hingehört

- Server-only-Logik, DB-Zugriff oder Routen-Handler
- UI-Komponenten
- Sprachwörterbücher

## Service-Exports

- Client-Services exportieren nach außen bevorzugt ein einziges Service-Objekt als öffentliche API.
- Interne Hilfsfunktionen bleiben unexportiert und werden nur vom Service-Objekt verwendet.
- Wenn ein Helper extern gebraucht wird, wird er über das Service-Objekt exponiert statt zusätzlich als named export.
- Tests und Call-Sites importieren das Service-Objekt und rufen dessen Methoden auf.

## Sprachregel

- Inhalte von `AGENTS.md` in diesem Projekt immer auf Deutsch pflegen.
