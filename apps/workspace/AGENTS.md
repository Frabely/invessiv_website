# AGENTS.md — apps/workspace

Gilt für die gesamte Workspace-App. Ergänzt die Repo-Root-`AGENTS.md`; spezifischere Dateien
weiter unten im Baum (`src/server/`, `src/common/`, `src/lib/`, `src/hooks/`,
`src/components/workspace/leads/`, …) haben Vorrang.

## Sprachregel (verbindlich)

Zwei getrennte Sprachen, und die Trennung ist bewusst:

| Wo                                                               | Sprache                          |
| ---------------------------------------------------------------- | -------------------------------- |
| `AGENTS.md` / `CLAUDE.md` und sonstige Projektdokumentation      | **Deutsch**                      |
| **Code-Kommentare** (`//`, `/* */`, JSDoc, SQL-, CSS-Kommentare) | **Englisch**                     |
| Test- und Suite-Namen (`describe`, `it`)                         | **Englisch**                     |
| Entwickler-Fehlermeldungen (`throw new Error(...)`)              | **Englisch**                     |
| Konsolenausgabe von Skripten (Migrationen, Smokes, Seeds)        | **Englisch**                     |
| Nutzersichtbare Texte                                            | i18n-Dictionaries, DE **und** EN |

**Warum getrennt:** Die Doku richtet sich an dich und wird auf Deutsch gepflegt. Code liest sich
dagegen zusammen mit englischen Bezeichnern, englischen Framework-APIs und englischen
Fehlermeldungen — ein deutscher Kommentar über einer englischen Signatur erzeugt einen Bruch mitten
im Satz. Dieselbe Regel gilt für Testnamen: sie erscheinen in der Testausgabe direkt neben den
Namen der geprüften Symbole.

Konkret:

```ts
// ✅ Kommentar, Fehlermeldung und Testname englisch
/** The business address wins when set; otherwise the personal one. */
throw new RangeError(
  `formatCustomerNumber expects a positive integer, received: ${value}`,
);
it("returns not_found instead of version_conflict when the row is gone", () => {});

// ❌ deutsch im Code
/** Die geschäftliche Adresse gewinnt, wenn sie gesetzt ist. */
throw new RangeError(`formatCustomerNumber erwartet eine positive Ganzzahl`);
it("liefert not_found statt version_conflict", () => {});
```

**Ausnahmen, die deutsch bleiben:**

- Fachbegriffe und Eigennamen ohne sinnvolle Übersetzung (`Anwälte` als UI-Label, `K0001` als
  Kundennummernformat).
- Deutsche Beispieldaten in Fixtures und Seeds (Straßen, Orte, Funktionsbezeichnungen) — sie sollen
  realistisch aussehen.
- Nutzersichtbare Texte gehören ohnehin nicht in den Code, sondern in `src/i18n/dictionaries/**`.

**Kommentardichte:** Kommentare erklären das _Warum_, nicht das _Was_. Eine Zeile, die nur
wiederholt, was der Code sagt, wird nicht geschrieben. Erklärt wird, was beim Lesen nicht offen
zutage liegt: eine bewusste Abweichung, eine Invariante, eine Falle, die man sonst wieder einbaut.

**Eine Ausnahme:** In `packages/common/src/contracts/**/*.dto.ts` bekommt **jedes** Feld einen
Docstring, weil er im Editor-Tooltip an jeder Call-Site erscheint. Regeln dazu in
`packages/common/AGENTS.md`, Abschnitt „Contract-Felder: Docstring auf jedem Feld".

## Geltung über die App hinaus

Die Sprachregel beschreibt die Konvention des gesamten Repositories, nicht nur dieser App — sie
gilt genauso in `packages/**` und `apps/web/**`. Sie steht hier, weil es für die Workspace-App
bisher keine App-`AGENTS.md` gab. Wenn sie sich als Reibungspunkt erweist, gehört sie in die
Repo-Root-`AGENTS.md` gehoben.
