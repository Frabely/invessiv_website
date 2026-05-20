# CLAUDE.md — packages/common/src

Architekturwissen für den `packages/common/src`-Bereich. Lesen, bevor Dateien in `constants/`, `contracts/`, `defaults/`
oder `patterns/` angelegt oder geändert werden.

## Zweck

`packages/common/src` enthält Code, der **ohne Änderung auf Client und Server** importiert werden kann — keine
serverseitigen Imports (`server-only`), keine Browser-APIs. Jede Datei hier ist implizit isomorph.

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
- Pro Domain ein Unterordner (`contracts/<domain>/`); innerhalb davon drei Unterordner für konzeptionell
  unterschiedliche Contract-Typen:

| Unterordner                   | Inhalt                             | Feldnamen  |
| ----------------------------- | ---------------------------------- | ---------- |
| `contracts/<domain>/` (Root)  | API-DTOs (`*.dto.ts`)              | camelCase  |
| `contracts/<domain>/rows/`    | DB-Query-Row-Shapes (`*-row.ts`)   | snake_case |
| `contracts/<domain>/results/` | Query-Result-Typen (`*-result.ts`) | camelCase  |

- `rows/` enthält ausschließlich typisierte Abbilder von SELECT-Ergebnissen; keine Laufzeitlogik, keine
  Drizzle-Referenzen
- `results/` enthält zusammengesetzte Handler-Rückgabetypen (z. B. `ListLeadsResult`); dürfen nur camelCase-DTOs
  importieren
- Persistenz-Inputs und Command-Outputs gehören in `src/server/db/contracts/` oder `src/server/workspace/<domain>/`

### DTO-Feldnamen: immer camelCase

Alle Felder in `contracts/**/*.dto.ts` und `contracts/**/*.ts` verwenden **camelCase** — kein `snake_case`, kein
`PascalCase` für Feldnamen.

```ts
// ✅ korrekt
export interface LeadSummaryDto {
  firstName: string | null;
  leadStatus: ContactLeadStatus;
  createdAt: Date;
}

// ❌ falsch — snake_case gehört in DB-Records, nicht in DTOs
export interface LeadSummaryDto {
  first_name: string | null;
  lead_status: ContactLeadStatus;
  created_at: Date;
}
```

Der Mapper in der Query-/Command-Handler-Schicht übersetzt zwischen DB-snake_case und DTO-camelCase. DTOs berühren die
DB-Spaltenform nie direkt.

## Offene Migrationsarbeit

Bestehende `as const`-Arrays in `packages/common/src/constants/**`, die noch nicht auf das Const-Objekt-Pattern
umgestellt sind, sind als technische Schuld in `docs/Todo.md` erfasst und schrittweise zu migrieren. Neue Konstanten \*
\*müssen\*\* das Pflicht-Pattern verwenden.
