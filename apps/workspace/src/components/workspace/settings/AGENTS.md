# AGENTS.md — Komponenten Workspace Settings

Gilt für `src/components/workspace/settings/` und alle Subordner. Ergänzt die Repo-Root-`AGENTS.md`. Fachliche
Grundlage: `apps/workspace/plans/crm/03b-mitglieder-und-rollenverwaltung/02c-mitglieder-und-rollenverwaltung.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Gruppierte Subfolder (bewusste Scope-Präzisierung)

Wie bei `components/workspace/leads/` gruppieren wir nach Zuständigkeit, weil Mitglieder- und Rollenverwaltung zwei
entkoppelte Achsen mit jeweils Liste und Dialogen sind:

| Subfolder  | Zweck                                                                |
| ---------- | -------------------------------------------------------------------- |
| `shell/`   | Tab-Navigation des Bereichs                                          |
| `members/` | Mitgliederliste, Mitglied hinzufügen, Rollen zuweisen, Owner-Wechsel |
| `roles/`   | Rollenliste, Rollen-Dialog                                           |
| `shared/`  | Settings-übergreifende Visuals (z. B. Permission-Liste)              |

Jede Komponente lebt in `<group>/<component-name>/<component-name>.tsx` mit eigenem `*.module.css`.

## Verbindlich

- **Keine Rollenlogik im Client.** Komponenten erhalten fertige Flags (`canManageRoles`, `isOwner`, `isCurrentActor`)
  und DTOs als Props. Die Autorisierung bleibt in Page (`requireWorkspaceArea`) und API (`withPermission`).
- **`SystemRoleKey` ist für Darstellung und Auswahl zulässig.** Reine Settings-Patterns und Komponenten dürfen damit
  Owner-Rollen aus normalen Rollen-Pickern ausblenden, Systemrollen beschriften und die Standardrolle vorbelegen.
  Daraus darf keine Zugriffsentscheidung entstehen; dafür gelten ausschließlich die übergebenen Flags und Permissions.
- **Tab-State in der URL** (`?tab=members|roles`); Dialog-Open-State darf lokal sein, weil er nicht teilbar sein muss.
- **Mutationen über `src/client/access/access-api-service.ts`**, danach `router.refresh()`. Keine Server Actions.
- **409 behält Eingaben.** Ein Versionskonflikt zeigt den aktuellen Stand und lässt den Nutzer erneut absenden.
- **Nicht delegierbare Permissions** erscheinen im Rollen-Dialog sichtbar gesperrt mit Erklärung, nicht versteckt.
- **Systemrollen** zeigen ihr Label aus dem Dictionary über den `systemKey`, nie `roles.name` aus der DB.
- **Dialog-Hülle** aus `@invessiv/ui` wiederverwenden; keine eigene Overlay-/Fokuslogik.
- i18n ausschließlich aus `src/i18n/dictionaries/workspace/settings/`; DE und EN parallel.
- Keine PII in Logs oder URLs; E-Mail-Adressen erscheinen nur als Anzeige in der Liste.
- Interaktive Komponenten (Dialoge) bekommen co-located Tests.
