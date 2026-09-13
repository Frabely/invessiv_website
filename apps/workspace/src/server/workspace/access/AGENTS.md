# AGENTS.md — Workspace-Zugangsverwaltung (Server)

Gilt für `apps/workspace/src/server/workspace/access/**`. Ergänzt `src/server/AGENTS.md` und
`src/server/workspace/auth/AGENTS.md`. Fachliche Grundlage:
`apps/workspace/plans/crm/03b-mitglieder-und-rollenverwaltung/02c-mitglieder-und-rollenverwaltung.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Zweck

Command- und Query-Handler für Mitglieder, Rollen und den Owner-Flow. Die Actor-Auflösung und die Gates bleiben in
`server/workspace/auth/` und `src/lib/auth/`; dieser Ordner **verwaltet** Rechte, er **prüft** sie nicht.

## Verbindlich

- **Clerk-ID ist der einzige Anker.** Ein Mitglied wird über die gewählte Clerk-ID verknüpft. Name und E-Mail lädt der
  Server selbst per Clerk Backend API; Werte aus dem Request werden nie als Stammdaten übernommen und nie zum Abgleich
  benutzt.
- **Owner nur über den Owner-Flow.** `replaceWorkspaceMemberRoles` ignoriert die Owner-Zuweisung nicht still, sondern
  lehnt eine Owner-Rolle im Request mit eigenem Fehlercode ab. Vergabe und Entzug laufen ausschließlich über
  `grantWorkspaceOwner`/`revokeWorkspaceOwner`.
- **Letzter aktiver Owner.** Die Zählung aktiver Owner liegt ausschließlich in
  `server/workspace/auth/services/workspace-owner-invariant-service.ts` und läuft in derselben Transaktion nach
  `SELECT … FOR UPDATE` auf die Owner-Zuweisungen. Kein Handler zählt Owner selbst.
- **Systemrollen sind unveränderlich.** Name, Beschreibung, Aktiv-Flag und Rechtesatz ändern sich nur per Migration.
- **Delegierbarkeit doppelt.** Der Command weist nicht delegierbare Permissions mit eigenem Fehlercode ab; die
  DB-Constraint bleibt die zweite Linie. Die Delegierbarkeit kommt immer aus `PERMISSION_DEFINITIONS`, nie aus dem
  Request.
- **Versioniert.** Mitgliedsänderungen erhöhen `workspace_members.version`, Rollenänderungen `roles.version` —
  ausschließlich über `updateVersioned`.
- **Genau ein Security-Event je erfolgreicher Änderung**, in derselben Transaktion, über `securityEventService`.
  Metadaten enthalten nur IDs, Permission-Keys und Feldnamen — keine Namen, E-Mails oder Clerk-Kennungen.
- **Clerk-Ausfall ist kein Autorisierungsfehler.** Kandidatenliste und Anlegen antworten mit einem eigenen Fehlercode;
  der Stammdaten-Sync beim Rendern der Liste loggt nur den Fehlernamen und lässt die Liste weiterlaufen.
- Logs enthalten keine E-Mail-Adressen, Namen oder Clerk-Kennungen.

## Bewusst nicht hier

- Deaktivierung, Übergabe und Ownership-Registry → Ordner 03c.
- Rollen löschen: Rollen werden deaktiviert, nicht gelöscht.
