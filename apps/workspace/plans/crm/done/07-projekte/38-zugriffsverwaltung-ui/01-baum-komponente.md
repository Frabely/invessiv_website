# 01 — Generische Baum-Komponente `TreeView`

> **Ordner:** 07c · **Aufwand:** M · **Hängt ab von:** — · **Blockiert:** 05
> **Zielpaket:** `packages/ui`

## Warum

Die Zugriffsverwaltung braucht eine hierarchische Liste Kunde → Projekt mit Bedienelementen je Zeile.
Dieselbe Darstellung ist absehbar an weiteren Stellen nützlich (Projektstruktur, Kategoriebäume,
Dateiablagen). Der Baum wird deshalb **einmal app-neutral** gebaut und in Task 05 nur noch fachlich
befüllt — nicht als Spezialkomponente der Zugriffsverwaltung.

## Umfang

```txt
packages/common/src/contracts/ui/tree-node.ts              Node- und Props-Shapes
packages/ui/src/components/tree-view/tree-view.tsx
packages/ui/src/components/tree-view/tree-view.module.css
packages/ui/src/components/tree-view/tree-view.test.tsx
packages/ui/src/index.ts                                    Export ergänzen
```

Der Contract liegt in `packages/common/src/contracts/ui/`, weil `packages/common/AGENTS.md` geteilte
UI-Control-Contracts genau dort verortet. React darf dort **nur als Typ** referenziert werden
(`import type { ReactNode }`), niemals als Runtime-Import.

## Fachliche Entscheidungen

### Disclosure-Liste statt ARIA-`treegrid`

Die Zeilen tragen mehrere Bedienelemente (mehrere Rollen-Checkboxen). Ein echtes `role="treegrid"` verlangt
Zellnavigation mit Links/Rechts über die Controls — ein Bedienmodell, das hier niemand erwartet und das die
Tastaturbedienung der Checkboxen verkompliziert. Stattdessen verschachtelte `ul`/`li` mit einem
Aufklapp-Button je Knoten (`aria-expanded`, `aria-controls`). Das ist die Disclosure-Variante, sie ist
vollständig zugänglich und benötigt kein eigenes Tastaturmodell.

**Folge:** Die Komponente heißt `TreeView`, rendert aber semantisch verschachtelte Listen. Das steht so im
Docstring, damit niemand später `role="tree"` „nachrüstet".

### Kontrolliert, nicht selbstverwaltend

Aufklappzustand und Kinder kommen von außen. Die Komponente hält keinen Datenzustand, damit der Konsument
nachladen, filtern und zurücksetzen kann, ohne gegen internen State zu arbeiten.

### Zeileninhalt über Render-Prop

Die Komponente rendert Struktur, Einrückung, Aufklappen und Ladezustand. Was rechts in der Zeile steht,
liefert der Konsument über eine Render-Prop. Damit bleibt sie frei von Checkboxen, Rollen und jedem
Fachbegriff.

## Contract (Richtwert)

```ts
/** One node of a disclosure tree. Children are supplied by the consumer, never fetched here. */
export interface TreeNode {
  /** Stable id; also addresses the node in `expandedIds` and in the loading set. */
  id: string;
  /** Primary line of the row. */
  label: string;
  /** Secondary line, e.g. a number or a count. Null when the row carries no subtitle. */
  secondaryLabel: string | null;
  /**
   * True when the node can be expanded. Kept separate from `children` so a node can advertise
   * children before they are loaded.
   */
  hasChildren: boolean;
  /** Loaded children. Empty while `hasChildren` is true but nothing has been fetched yet. */
  children: TreeNode[];
}

export interface TreeViewProps {
  /** Accessible name of the outermost list. */
  ariaLabel: string;
  /** Rendered instead of the list when `nodes` is empty. */
  emptyState?: ReactNode;
  /** Expanded node ids. Controlled: the consumer decides what stays open. */
  expandedIds: readonly string[];
  /** Nodes whose children are currently being fetched; the row shows a loading hint. */
  loadingIds?: readonly string[];
  /** Accessible label template for the expand button, e.g. "Aufklappen: {label}". */
  expandLabelTemplate: string;
  /** Accessible label template for the collapse button. */
  collapseLabelTemplate: string;
  /** Visible text while a node's children are loading. */
  loadingLabel: string;
  nodes: readonly TreeNode[];
  /** Called when a collapsed node is opened; the consumer loads children if it has none yet. */
  onToggleAction: (nodeId: string, expanded: boolean) => void;
  /** Row content on the trailing side. Receives the node and its depth, starting at 0. */
  renderRowActions: (node: TreeNode, level: number) => ReactNode;
}
```

`TreeNodeProps`-artige Hilfs-Shapes bleiben in der Contract-Datei; jedes Feld bekommt einen Docstring (Regel aus
`packages/common/AGENTS.md`).

## Regeln für diese Komponente

- **App-neutral.** Keine Domänenbegriffe in Namen, Props, CSS-Klassen oder Testnamen. Kein `customer`,
  kein `role`, kein `member`.
- **Keine Dictionaries.** Jeder sichtbare Text kommt als Prop, inklusive der Label-Templates für die
  Aufklapp-Buttons.
- **Kein `next/*`**, keine Analytics, keine Routen.
- **Kein Datenladen.** Die Komponente ruft nichts ab; sie meldet nur das Aufklappen.
- **Styling** co-located als CSS Module, Einrückung über `data-level`, Zustände über `data-*`, Farben nur
  über Theme-Tokens. Kein Inline-Style.
- `"use client"`, da Events verarbeitet werden.
- Mobil zuerst: Zeilen brechen um, die Aktionen rutschen unter das Label statt zu überlaufen.

## Tests (`tree-view.test.tsx`, jsdom, englische Testnamen)

- renders nested lists and marks expandable rows with `aria-expanded`
- toggles a node with keyboard activation and reports the new state exactly once
- keeps expansion controlled: a toggle without a prop change leaves the row closed
- shows the loading label for ids in `loadingIds` and hides it afterwards
- passes the correct node and level to `renderRowActions`
- renders the empty state instead of the list when there are no nodes

## Akzeptanz

- Die Komponente enthält kein Wort aus der CRM- oder Zugriffsdomäne.
- Ein zweiter Konsument könnte sie ohne Änderung verwenden — beim Review wird genau das geprüft.
- `pnpm --filter @invessiv/ui test` und `pnpm -r typecheck` grün.

## Regelergänzung

`packages/AGENTS.md`, Abschnitt `packages/ui`: `TreeView` als app-neutraler Baustein; Zeileninhalte
ausschließlich über Render-Prop, damit keine Fachvariante in das Paket wandert.
