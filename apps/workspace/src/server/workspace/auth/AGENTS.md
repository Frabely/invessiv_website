# AGENTS.md — Workspace-Auth (Server)

Gilt für `apps/workspace/src/server/workspace/auth/**`. Ergänzt `src/server/AGENTS.md`. Fachliche Grundlage:
`apps/workspace/plans/crm/03-mitglieder-und-auth/02-rechtesystem.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Zweck

Hier wird aus einer Clerk-Kennung ein `WorkspaceActor` mit effektiven Permissions. Die Gates in `src/lib/auth/**`
(`requireWorkspaceActor`, `requireWorkspaceArea`, `withWorkspaceApiActor`, `withPermission`) sind die einzigen Aufrufer.

## Verbindlich

- **Fail closed.** Fehlender User, inaktiver User, fehlende oder inaktive Membership, unbekannte Permission-Keys und
  realmfremde Permissions ergeben keinen Zugriff. Ein DB-Fehler wird nie in „erlaubt" übersetzt.
- **Keine Rollenprüfung außerhalb dieses Ordners.** Features prüfen ausschließlich `can(actor, Permission.X)`.
  Die einzige erlaubte Stelle mit einem Rollenbezug ist die Owner-Invariante (Bootstrap, später Owner-Flow in 03b).
- **Kein E-Mail-Abgleich.** Zuordnung ausschließlich über `users.clerk_user_id`. E-Mail-Adressen sind Stammdaten.
- **Seiten-Gates gehören in `page.tsx`.** Layouts rendern bei Query-Param-Wechseln nicht neu; ein Gate nur im Layout
  lässt nach einem Rechteentzug weiter Daten laden. Layouts dürfen den Actor zusätzlich für die Shell auflösen.
- **Kein Cache über Requests.** Jeder Request löst neu auf, damit Rollenentzug beim nächsten Request wirkt. Innerhalb
  eines Seiten-Renders darf `react/cache` deduplizieren.
- **Bootstrap** läuft ausschließlich für `WORKSPACE_BOOTSTRAP_CLERK_USER_ID`, nur ohne vorhandenen `users`-Datensatz
  und nur solange kein aktiver Owner existiert — serialisiert über einen Advisory-Lock in einer Transaktion.
- Sicherheitsrelevante Änderungen schreiben über `securityEventService` in `security_events`, nie in `activities`.
- Logs enthalten keine E-Mail-Adressen, Namen oder Clerk-Kennungen.
