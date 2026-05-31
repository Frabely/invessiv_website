# AGENTS.md - packages

Dieser Ordner enthält geteilte Workspace-Pakete. Regeln aus der Root-`AGENTS.md` gelten weiterhin; spezifischere
`AGENTS.md`-Dateien in Unterpaketen ergänzen diese Vorgaben.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien in diesem Projekt werden auf Deutsch gepflegt.

## Grundsatz

Code in `packages/**` muss app-übergreifend wiederverwendbar sein. App-spezifische Routen, i18n-Dictionaries,
Feature-Workflows, Server-Handler und Marketing-Content bleiben in `apps/<app>/**`.

## Paket-Verantwortlichkeiten

### `packages/common`

Hier liegen allgemeine, UI- und Server-unabhängige Bausteine:

- `contracts/` für API-DTOs, geteilte Datentypen und boundary-nahe Shapes
- `constants/` für benannte Konstanten und String-Union-Werte nach Const-Objekt-Pattern
- `defaults/` für geteilte Standardwerte
- `patterns/` für reine Hilfsmuster ohne Seiteneffekte

Nicht hierher gehören React-Komponenten, CSS, Datenbank-Clients, Server-Handler, i18n-Texte oder App-Konfiguration.
Zusätzliche Regeln stehen in `packages/common/AGENTS.md`.

### `packages/db`

Hier liegen allgemeine Inhalte zur Datenbank:

- Drizzle-Tabellen und Record-Konfigurationen
- migrationsnahe Datenbankstruktur
- DB-Clients, SQL-Helfer und Postgres-spezifische Codes
- Persistenz-Contracts und Persistenzfunktionen, die bewusst DB-nah sind
- Migrations-, Smoke- und Seed-Skripte

DTOs für App-/API-Grenzen bleiben in `packages/common`; UI- und Server-Feature-Logik bleibt in den Apps.

### `packages/ui`

Hier liegen global verfügbare UI-Komponenten, die von mehreren Apps genutzt werden können, z. B. generische Controls
wie `CustomSelect`.

Komponenten in `packages/ui` müssen:

- app-neutral benannt und gestaltet sein
- keine App-Routen, Dictionaries, Analytics-Events oder Feature-Domänen importieren
- Styling co-located als CSS Module halten
- Theme-Tokens nutzen, die in konsumierenden Apps bereitgestellt werden
- als Client Component markiert werden, wenn sie Hooks, Events oder Browser-State nutzen

App-spezifische Varianten, Labels, Option-Icons oder Fachlogik bleiben beim konsumierenden App-Code und werden über
Props
an die UI-Komponente übergeben.

## Paket-Exports

Jedes Package exportiert öffentliche API über `src/index.ts` und `package.json` `exports`. Apps importieren aus
`@invessiv/<package>` oder bewusst aus stabilen Subpfaden, nicht über relative Pfade in `packages/**`.

## Tests und Gates

- `packages/common`: Konstanten und reine Logik mit kleinen Unit-Tests absichern.
- `packages/db`: migrations-/persistenznahe Änderungen mit passenden DB-Smokes oder Unit-Tests absichern.
- `packages/ui`: interaktive Komponenten mit jsdom-Tests für zentrale Interaktionen absichern, sobald Verhalten über
  reine
  Darstellung hinausgeht.
