# AGENTS.md — Workspace Settings (Route)

Gilt für `apps/workspace/src/app/[locale]/(app)/settings/`. Ergänzt die Repo-Root-`AGENTS.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Verbindlich

1. **Die Page gated ihre eigenen Daten.** `page.tsx` ruft vor jedem Query-Handler
   `requireWorkspaceArea(locale, WorkspaceArea.Settings)` auf (Permission `members.manage`). Ein Gate nur im Layout
   greift bei Query-Param-Wechseln nicht.
2. **Rollen-Tab zusätzlich mit `roles.manage`.** Fehlt die Permission, wird der Tab nicht gerendert, seine Daten werden
   nicht geladen, und `?tab=roles` fällt auf den Mitglieder-Tab zurück.
3. **Pages orchestrieren nur:** Tab aus `searchParams`, Stammdaten-Sync, Query-Handler, Komponenten. Keine
   Inline-Strings,
   keine Business-Logik, keine Drizzle-Aufrufe.
4. **Privat:** `robots: { index: false, follow: false, nocache: true }` und `export const dynamic = "force-dynamic"`.
5. i18n ausschließlich über `src/i18n/dictionaries/workspace/settings/`.
6. **Systemrollen nur für Verwaltungsdarstellung.** Settings-Code darf `SystemRoleKey` verwenden, um Owner-Aktionen,
   Rollenlabels und die Standardrolle auszuwählen. Autorisierung erfolgt weiterhin ausschließlich über
   `requireWorkspaceArea` und Actor-Permissions, niemals über einen Rollen-Key.
