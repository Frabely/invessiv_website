# AGENTS.md — Workspace CRM (Route)

Gilt für `apps/workspace/src/app/[locale]/(app)/crm/` und alle Subroutes. Ergänzt die Repo-Root-`AGENTS.md` und
`apps/workspace/plans/crm/AGENTS.md`. Engere Regeln in tieferen Ordnern haben Vorrang.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Zweck

Interner CRM-Bereich (Bereich `crm`, Permission `customers.read`): Kundenübersicht, Anlegen/Bearbeiten und ab Task 05
die Kundenakte. Pläne: `apps/workspace/plans/crm/04-personen-und-kundenakte/` und folgende Ordner.

## Verbindlich

1. **Jede Page gated ihre eigenen Daten.** Die CRM-Startseite ruft vor dem ersten Query-Handler
   `requireWorkspaceArea(locale, WorkspaceArea.Crm)` auf. Eine fachlich eigenständige CRM-Subroute verwendet vor
   ihrem ersten Query-Handler stattdessen ihre eigene Read-Permission (zum Beispiel `line_item_templates.read`), damit sie
   nicht unbeabsichtigt `customers.read` voraussetzt. Layouts rendern bei Query-Param-Wechseln nicht neu.
2. **Schreibaktionen nur mit `customers.write`.** Die Page reicht nur dann Anlegen-/Bearbeiten-Ziele an die
   Komponenten; ohne Recht werden die Aktionen nicht gerendert (kein deaktivierter Button). Die API prüft zusätzlich
   über `withPermission`.
3. **Pages orchestrieren nur.** Query-Params parsen, Query-Handler aus `src/server/workspace/crm/**` aufrufen,
   Komponenten zusammensetzen. Keine Inline-Strings, keine Drizzle-Aufrufe, keine Locale-Branches.
4. **Dialog- und Panel-State leben in der URL.** `mode=create`, `mode=edit&edit=<uuid>` (Task 04), ab Task 05
   `selected=<uuid>`. Namen kommen aus `CustomerListQueryParam`, Hrefs aus `lib/workspace/crm/**`.
5. **Unbekannte IDs sind kein Fehler.** Ein `edit`- oder `selected`-Parameter ohne Treffer öffnet nichts und wirft
   nicht; archivierte Kunden bleiben adressierbar.
6. **Private Seite.** `robots: { index: false, follow: false, nocache: true }` und
   `export const dynamic = "force-dynamic"`.
7. **Kein Link ins Leere.** Zeilen verlinken die Akte erst, wenn Task 05 sie liefert.

## Was hier nicht hingehört

- Fachlogik, Validierung oder Rollenprüfungen jenseits von `requireWorkspaceArea` und `can(actor, …)` für die
  Sichtbarkeit von Aktionen.
- Portalseiten — sie liegen getrennt und nutzen nie Handler aus `src/server/workspace/**`.
