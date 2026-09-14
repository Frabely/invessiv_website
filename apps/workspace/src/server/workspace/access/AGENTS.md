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
- **Kein Selbst-Entzug.** `revokeWorkspaceOwner` lehnt ab, wenn Actor und Ziel dasselbe Mitglied sind
  (`SELF_OWNER_REVOCATION`), unabhängig von weiteren Ownern. Die Owner-Rolle verliert man nur durch einen anderen Owner.
- **Systemrollen sind unveränderlich.** Name, Beschreibung, Aktiv-Flag und Rechtesatz ändern sich nur per Migration.
- **Kein Systemrollen-Name für Custom-Rollen.** `reservedRoleNameService` sperrt den DB-Namen und das übersetzte Label
  jeder unterstützten Sprache (`ROLE_NAME_RESERVED`). Der Service liest dafür die Settings-Dictionaries; eine neue
  Sprache ist damit automatisch abgedeckt.
- **`GET /members` bleibt schmal.** `members.read` steckt in der Basisrolle; die Route liefert nur
  `WorkspaceMemberOptionDto`. Das vollständige `WorkspaceMemberDto` verlässt den Server nur über die Settings-Page.
- **Constraint-Namen** für die Fehlerabbildung kommen aus den Const-Objekten unter `@invessiv/db/constraint-names/**`
  (z. B. `UsersConstraintName`, `RolesConstraintName`), nie als String-Literal im Handler oder Test.
- **Formulargrenzen** (Rollenname, Beschreibung, Clerk-ID, Suchlänge, Rollenanzahl) stehen in `AccessFieldLimits`;
  Schema und Settings-Formulare lesen denselben Wert.
- **Delegierbarkeit doppelt.** Der Command weist nicht delegierbare Permissions mit eigenem Fehlercode ab; die
  DB-Constraint bleibt die zweite Linie. Die Delegierbarkeit kommt immer aus `PERMISSION_DEFINITIONS`, nie aus dem
  Request.
- **Versioniert.** Mitgliedsänderungen erhöhen `workspace_members.version`, Rollenänderungen `roles.version` —
  ausschließlich über `updateVersioned`.
- **Genau ein Security-Event je erfolgreicher Änderung**, in derselben Transaktion, über `securityEventService`.
  Metadaten enthalten nur IDs, Permission-Keys und Feldnamen — keine Namen, E-Mails oder Clerk-Kennungen.
- **Clerk-Ausfall ist kein Autorisierungsfehler.** Kandidatenliste und Anlegen antworten mit einem eigenen Fehlercode;
  der Stammdaten-Sync läuft nach der Antwort (`after()`), fängt jeden Fehler selbst und loggt ihn nur über
  `logAccessFailure` — ein unbehandelter Fehler würde Treibermeldungen mit Zeilendaten ins Log schreiben.
- Logs enthalten keine E-Mail-Adressen, Namen oder Clerk-Kennungen.

## Bewusst nicht hier

- Deaktivierung, Übergabe und Ownership-Registry → Ordner 03c.
- Rollen löschen: Rollen werden deaktiviert, nicht gelöscht.
