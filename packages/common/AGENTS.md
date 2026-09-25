# AGENTS.md — packages/common/src

Dieser Ordner enthält alles, was Client und Server **gemeinsam** nutzen: Konstanten, Contracts (DTOs/Interfaces), Defaults und Patterns. Kein serverseitiger, kein clientseitiger Code gehört hier hinein.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien in diesem Projekt immer auf Deutsch pflegen.

## Was hier hingehört

- `constants/` — benannte String-/Zahl-Konstanten und Enumerationswerte (kein Runtime-Code)
  - `constants/i18n/` — alles, was sich eindeutig aus der Locale ableitet, als `Record<Locale, …>` neben
    `SUPPORTED_LOCALES` (z. B. `OPEN_GRAPH_LOCALE`). Solche Werte gehören nicht in die Sprach-Dictionaries der Apps,
    damit eine neue Locale genau eine Stelle erzwingt.
- `contracts/` — TypeScript-Interfaces und DTOs, die über API-/DB-Grenzen geteilt werden; dazu gehören auch
  geteilte UI-Control-Contracts (z. B. Option-/Props-Shapes generischer `@invessiv/ui`-Controls unter `contracts/ui/`).
  Diese dürfen React **ausschließlich auf Typ-Ebene** referenzieren (`import type { ReactNode }`), niemals als
  Runtime-Import, JSX oder Komponente.
- `defaults/` — Standardwerte für Formulare und Request-Strukturen
- `patterns/` — shared Utility-Hilfsmuster ohne Seiteneffekte

## Was hier nicht hingehört

- Serverseitige Persistenz-Inputs oder Command-Outputs → `src/server/`
- UI-Komponenten, Hooks, JSX oder Runtime-React → `src/components/`, `src/hooks/` (reine Typ-Referenzen auf React in
  geteilten UI-Control-Contracts sind erlaubt, siehe oben)
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

Alle bestehenden `as const`-Arrays in `packages/common/src/constants/**`, die String-Literale als Union-Typ exponieren,
sind schrittweise auf dieses Pattern umzustellen (siehe `plans/Todo.md`).

## Eine Contract-Datei pro Contract (verbindlich)

Unter `contracts/**` erhält jeder eigenständige DTO-, Row- oder Result-Contract eine eigene, nach ihm benannte Datei (z.
B. `portal-access.dto.ts` für `PortalAccessDto`). Keine Sammeldatei mit mehreren eigenständigen Contracts;
abhängige Contracts werden per `import type` eingebunden. Nur rein lokale, nicht exportierte Hilfstypen dürfen in
derselben Datei bleiben.

## Contract-Felder: immer camelCase

Alle Felder in `contracts/**/*.dto.ts` verwenden **camelCase** — nie `snake_case`.

```ts
// ✅
firstName: string | null;
leadStatus: ContactLeadStatus;
createdAt: Date;

// ❌
first_name: string | null;
lead_status: ContactLeadStatus;
created_at: Date;
```

Der Mapper in der Query-/Command-Handler-Schicht übersetzt DB-`snake_case` → DTO-`camelCase`. DTOs berühren die
DB-Spaltenform nie direkt.

## Contract-Felder: Docstring auf jedem Feld (verbindlich)

**Jedes** Feld in `contracts/**/*.dto.ts` bekommt einen JSDoc-Docstring. Das ist die bewusste
Ausnahme von der allgemeinen Regel „keine Kommentare, die den Code wiederholen"
(`apps/workspace/AGENTS.md`, Abschnitt Kommentardichte).

**Warum hier anders:** DTOs sind die API-Oberfläche. Der Docstring erscheint im Editor-Tooltip an
jeder Call-Site, also überall dort, wo jemand das Feld benutzt, ohne die Definition zu öffnen. Ein
fehlender Docstring bedeutet dort eine offene Frage; bei einer internen Hilfsfunktion bedeutet er
nur Rauschen.

Der Docstring beantwortet, was der Feldname nicht sagt. Bei einem Feld, dessen Name für sich
sprechen würde, ist das:

- **warum es nullable ist** — welcher echte Fall den Wert fehlen lässt
- **woraus es abgeleitet ist** oder wen es speist
- **welchem Feld der Vorrang gehört**, wenn zwei dasselbe meinen
- **wozu es ausdrücklich nicht dient** (z. B. „autorisiert nie")
- **an welcher Entität der Wert wirklich hängt**, wenn der Typ etwas anderes suggeriert

```ts
// ✅ sagt, was der Name nicht sagt
/** Id of the assignment, not of the person. Mutations address this value. */
id: string;
/** Source for `displayName`. Nullable: a contact reached only by a company address
 *  may have no known first name. */
firstName: string | null;

// ❌ Wiederholung des Namens
/** The first name. */
firstName: string | null;
```

Findet sich zu einem Feld nichts außer der Wiederholung, ist das ein Hinweis auf das Feld, nicht auf
den Kommentar: entweder ist der Name unpräzise, oder das Feld gehört nicht ins DTO.

## Datei- und Ordnerstruktur

- Pro Domain ein Unterordner (`contact/`, `leads/`, `marketing/`, …)
- Pro Konstantengruppe eine eigene Datei; keine Sammeldateien für mehrere fachlich unverwandte Gruppen
- Dateinamen in `kebab-case`; Exportnamen für Const-Objekte in `PascalCase`, für Arrays in `SCREAMING_SNAKE_CASE`

### Contracts-Unterstruktur pro Domain

Innerhalb eines Domain-Ordners in `contracts/` gibt es drei konzeptionell getrennte Ebenen:

| Pfad                          | Inhalt                                                     | Feldnamen  |
| ----------------------------- | ---------------------------------------------------------- | ---------- |
| `contracts/<domain>/`         | API-DTOs (`*.dto.ts`) — Client/Server shared               | camelCase  |
| `contracts/<domain>/rows/`    | DB-Row-Shapes (`*-row.ts`) — Abbild von SELECT-Ergebnissen | snake_case |
| `contracts/<domain>/results/` | Handler-Rückgabetypen (`*-result.ts`)                      | camelCase  |

Diese Trennung stellt sicher, dass DB-nahe snake_case-Typen nicht mit API-DTOs vermischt werden, aber dennoch isomorph
in `packages/common/src` liegen und von beiden Seiten importiert werden können.

## Error-Code-Konstanten

Error-Codes folgen dem Const-Objekt-Pattern wie alle anderen String-Unions:

```ts
export const FooErrorCode = {
  NotFound: "NOT_FOUND",
  ValidationError: "VALIDATION_ERROR",
  Internal: "INTERNAL",
} as const;
export type FooErrorCode = (typeof FooErrorCode)[keyof typeof FooErrorCode];
```

Der **Message-Text** gehört **nicht** in `packages/common/src/constants/` — er liegt ausschließlich in einem co-located
`*-error.ts`-Helper in der jeweiligen Nutzungsschicht (API-Route, Client-Komponente). Damit bleibt er pro Kontext
überschreibbar und i18n-fähig, ohne dass `packages/common/src` von serverseitigen oder clientseitigen Abhängigkeiten
infiziert
wird.

## Tests

- Konstanten-Tests co-located mit der Domäne (z. B. `leads/leads-constants.test.ts`)
- Jede neue Konstantengruppe erhält einen Test: `toEqual`-Check auf genauen Inhalt + Duplikat-Check
- Contracts und Defaults brauchen keine eigenen Tests, sind aber durch Typecheck abgesichert
