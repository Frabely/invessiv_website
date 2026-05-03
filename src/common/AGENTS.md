# AGENTS.md — src/common

Dieser Ordner enthält alles, was Client und Server **gemeinsam** nutzen: Konstanten, Contracts (DTOs/Interfaces), Defaults und Patterns. Kein serverseitiger, kein clientseitiger Code gehört hier hinein.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien in diesem Projekt immer auf Deutsch pflegen.

## Was hier hingehört

- `constants/` — benannte String-/Zahl-Konstanten und Enumerationswerte (kein Runtime-Code)
- `contracts/` — TypeScript-Interfaces und DTOs, die über API-/DB-Grenzen geteilt werden
- `defaults/` — Standardwerte für Formulare und Request-Strukturen
- `patterns/` — shared Utility-Hilfsmuster ohne Seiteneffekte

## Was hier nicht hingehört

- Serverseitige DB-Records, Persistenz-Inputs oder Command-Outputs → `src/server/`
- UI-Komponenten oder Hooks → `src/components/`, `src/hooks/`
- i18n-Dictionaries → `src/i18n/`
- Konfiguration oder Umgebungsvariablen → `src/server/config/` oder `src/lib/`

## Konstanten-Regel (verbindlich)

String-Union-Typen werden ausschließlich über das **Const-Objekt + abgeleiteter Type**-Pattern definiert. TypeScript `enum` wird im Projekt nicht verwendet.

**Pflichtform:**

```ts
export const FooKind = {
  Bar: "bar",
  Baz: "baz",
} as const;

export type FooKind = (typeof FooKind)[keyof typeof FooKind];
```

**Keys verwenden PascalCase** (`LeadSource.Webform`, nicht `LeadSource.WEBFORM` oder `LeadSource.webform`).

**Wenn Iteration benötigt wird** (z. B. Drizzle `{ enum: [...] }`, `sqlCheckIn`, UI-Loops), wird ein separates `FOO_KIND_VALUES`-Array exportiert, das ausschließlich aus dem Const-Objekt abgeleitet wird — String-Literale erscheinen **genau einmal**, im Const-Objekt:

```ts
export const FOO_KIND_VALUES = [FooKind.Bar, FooKind.Baz] as const;
```

Alle bestehenden `as const`-Arrays in `src/common/constants/**`, die String-Literale als Union-Typ exponieren, sind schrittweise auf dieses Pattern umzustellen (siehe `docs/Todo.md`).

## Datei- und Ordnerstruktur

- Pro Domain ein Unterordner (`contact/`, `leads/`, `marketing/`, …)
- Pro Konstantengruppe eine eigene Datei; keine Sammeldateien für mehrere fachlich unverwandte Gruppen
- Dateinamen in `kebab-case`; Exportnamen für Const-Objekte in `PascalCase`, für Arrays in `SCREAMING_SNAKE_CASE`

## Tests

- Konstanten-Tests co-located mit der Domäne (z. B. `leads/leads-constants.test.ts`)
- Jede neue Konstantengruppe erhält einen Test: `toEqual`-Check auf genauen Inhalt + Duplikat-Check
- Contracts und Defaults brauchen keine eigenen Tests, sind aber durch Typecheck abgesichert
