# AGENTS.md - apps/workspace/src/common

Dieser Ordner enthält alles, was innerhalb der Workspace-App zwischen Client- und Server-Code geteilt wird - analog zu
`packages/common`, aber bewusst nur für workspace-spezifische Bausteine, die im globalen `@invessiv/common`-Paket nichts
zu suchen haben.

`packages/common/src` bleibt die kanonische Quelle für alles, was Web und Workspace gemeinsam nutzen. Sobald ein
Baustein
hier auch außerhalb der Workspace-App gebraucht wird, wird er nach `packages/common` migriert - nicht dupliziert.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien in diesem Projekt immer auf Deutsch pflegen.

## Was hier hingehört

- `constants/` - benannte String-/Zahl-Konstanten und Enumerationswerte für Workspace-Domänen (kein Runtime-Code)
- `contracts/` - TypeScript-Interfaces und Result-/Selection-Shapes, die innerhalb der Workspace-App zwischen
  Server-Handlern, Routes und UI geteilt werden
- `defaults/` - Standardwerte für Workspace-Formulare, Filter, Aggregations-Fenster usw.
- `patterns/` - workspace-spezifische, seiteneffektfreie Utility-Hilfsmuster

## Was hier nicht hingehört

- Bausteine, die auch in `@invessiv/web` gebraucht werden -> `packages/common/src/`
- Serverseitige Persistenz-Inputs, DB-nahe Records, Command-Outputs -> `apps/workspace/src/server/` oder
  `packages/db/src/`
- UI-Komponenten, Hooks oder Styles -> `apps/workspace/src/components/`, `apps/workspace/src/hooks/`
- i18n-Dictionaries -> `apps/workspace/src/i18n/`
- App-Konfiguration oder Umgebungsvariablen -> `apps/workspace/src/config/` oder `apps/workspace/src/lib/`

## Konstanten-Regel (verbindlich)

String-Union-Typen werden ausschließlich über das Const-Objekt + abgeleiteter Type-Pattern definiert. TypeScript `enum`
wird im Projekt nicht verwendet.

Pflichtform:

```ts
export const FooKind = {
  Bar: "bar",
  Baz: "baz",
} as const;

export type FooKind = (typeof FooKind)[keyof typeof FooKind];
```

Keys verwenden PascalCase (`Foo.BarKind`, nicht `Foo.BAR_KIND` oder `Foo.barKind`).

Wenn Iteration benötigt wird (z. B. Drizzle `{ enum: [...] }`, `sqlCheckIn`, UI-Loops), wird ein separates
`FOO_KIND_VALUES`-Array exportiert, das ausschließlich aus dem Const-Objekt abgeleitet wird. String-Literale erscheinen
genau einmal, im Const-Objekt.

## Contract-Felder: immer camelCase

Alle Felder in `contracts/**/*.ts` verwenden camelCase, nie `snake_case`. DB-Rows in `snake_case` werden in der
Mapper-Schicht (`apps/workspace/src/server/.../services/*-mapping-service.ts`) übersetzt und nie direkt als
Contract-Shape verwendet.

## Datei- und Ordnerstruktur

- Pro Domain ein Unterordner (`dashboard/`, `leads/`, `outreach/`, ...)
- Pro Konstantengruppe eine eigene Datei; keine Sammeldateien für mehrere fachlich unverwandte Gruppen
- Dateinamen in `kebab-case`; Exportnamen für Const-Objekte in `PascalCase`, für Arrays in `SCREAMING_SNAKE_CASE`
- Interne Workspace-API-Endpunkte werden zentral in `constants/api-endpoints.ts` gepflegt. Client-, Server- und UI-Code
  baut API-URLs nicht lokal aus String-Literalen, sondern importiert `WorkspaceApiEndpoint` aus dieser Datei.

## Tests

- Konstanten- und Defaults-Tests co-located mit der Domäne (z. B. `dashboard/dashboard-defaults.test.ts`)
- Jede neue Konstantengruppe erhält einen Test: `toEqual`-Check auf genauen Inhalt + Duplikat-Check
- Contracts werden durch Typecheck abgesichert und brauchen keine eigenen Tests

## Server-only-Disziplin

Module hier dürfen nicht `server-only` importieren oder DB-/HTTP-/Filesystem-Seiteneffekte enthalten. Sie müssen sowohl
aus Client- als auch aus Server-Code importierbar sein. Wer einen Server-Singleton braucht, legt ihn unter
`apps/workspace/src/server/` ab und referenziert von dort die hier definierten Typen und Konstanten.
