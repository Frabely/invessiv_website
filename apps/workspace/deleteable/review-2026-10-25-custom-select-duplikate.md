# Prüfung: Custom-Select-Duplikate

Stand: 25.10.2026, Commit `22fcffb5`. Lokale Änderungen an `packages/ui/AGENTS.md` und ein unversionierter Workspace-Plan lagen vor.

Umfang: gezielte statische Prüfung auf mehrfach implementierte `CustomSelect`-Komponenten in `apps/**` und `packages/**`, einschließlich Importstellen in Web und Workspace. Kein allgemeines Funktions- oder Architekturreview.

Ergebnis: keine duplizierte Custom-Select-Komponente gefunden. Die Implementierung liegt zentral in `packages/ui/src/components/custom-select/custom-select.tsx`; das zugehörige CSS liegt daneben. Beide Apps importieren sie über `@invessiv/ui`. Fachliche Komponenten wie `TaskStatusSelect` und `ProjectSwitcher` verwenden die gemeinsame Komponente. Das native `<select>` im Web-`FormField` ist ein anderer Control-Typ und keine Kopie dieser Implementierung.

Prüfungen: Dateiinventar, Symbolsuche, Importsuche und Lesen der Implementierung sowie ausgewählter Aufrufer. Keine Tests ausgeführt; kein Produktivcode geändert. Keine Aussage über sämtliche anderen Dropdown-Komponenten oder interne Refactoring-Möglichkeiten.

Vorschläge zur Skill-Verbesserung: keine sinnvolle Ergänzung aus dieser begrenzten Prüfung.
