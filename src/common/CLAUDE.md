# CLAUDE.md — src/common

Architekturwissen für den `src/common`-Bereich. Lesen, bevor Dateien in `constants/`, `contracts/`, `defaults/` oder `patterns/` angelegt oder geändert werden.

## Zweck

`src/common` enthält Code, der **ohne Änderung auf Client und Server** importiert werden kann — keine serverseitigen Imports (`server-only`), keine Browser-APIs. Jede Datei hier ist implizit isomorph.

## Verzeichnisschnitt

| Ordner       | Inhalt                                                           |
| ------------ | ---------------------------------------------------------------- |
| `constants/` | Benannte Konstanten, String-Enumerationen, numerische Grenzwerte |
| `contracts/` | TypeScript-Interfaces und DTOs für API-/Formular-/DB-Grenzen     |
| `defaults/`  | Standardwerte für Formulare und Request-Strukturen               |
| `patterns/`  | Kleine Utility-Hilfsmuster ohne Seiteneffekte                    |

Jede Domain (z. B. `contact`, `leads`, `marketing`) hat einen eigenen Unterordner in jedem dieser Bereiche.

## Konstanten — Pflichtkonvention

### String-Union-Typen: Const-Objekt-Pattern

TypeScript `enum` wird im Projekt **nicht** verwendet. Stattdessen gilt dieses dreiteilige Pattern:

```ts
// 1. Const-Objekt — Literale genau einmal definieren
export const LeadSource = {
  Webform: "webform",
  Manual: "manual",
  Import: "import",
} as const;

// 2. Abgeleiteter Union-Type — kein manuelles Aufschreiben der Werte
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

// 3. Values-Array — nur wenn Iteration gebraucht wird (Drizzle enum, sqlCheckIn, UI-Loop)
export const LEAD_SOURCES_VALUES = [
  LeadSource.Webform,
  LeadSource.Manual,
  LeadSource.Import,
] as const;
```

**Regeln:**

- Keys im Const-Objekt: **PascalCase** (`Webform`, `StatusChange`, `InboundSubmission`)
- Const-Objekt-Name = Type-Name (Declaration Merging: `LeadSource` als Wert und als Typ)
- `FOO_VALUES`-Array-Name: `SCREAMING_SNAKE_CASE`, Suffix `_VALUES`
- String-Literale (`"webform"`) stehen **nur im Const-Objekt** — nirgendwo sonst hardcoded
- Das `_VALUES`-Array wird ausschließlich aus dem Const-Objekt abgeleitet, nie separat gepflegt

### Numerische Konstanten

Einzelne benannte Zahlen bleiben einfache `const`-Exporte ohne Objekt-Wrapper:

```ts
export const LEAD_LIST_PAGE_SIZE = 25;
```

## Contracts

- Nur TypeScript-Interfaces und Typen — keine Laufzeitlogik
- DTOs, die zwischen API-Route und Client geteilt werden: `contracts/<domain>/`
- DB-nahe Row-Shapes (`snake_case`-Felder) gehören in `src/server/db/records/`, nicht hierher
- Persistenz-Inputs und Command-Outputs gehören in `src/server/db/contracts/` oder `src/server/workspace/<domain>/`

## Offene Migrationsarbeit

Bestehende `as const`-Arrays in `src/common/constants/**`, die noch nicht auf das Const-Objekt-Pattern umgestellt sind, sind als technische Schuld in `docs/Todo.md` erfasst und schrittweise zu migrieren. Neue Konstanten **müssen** das Pflicht-Pattern verwenden.
