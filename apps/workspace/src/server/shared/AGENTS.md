# AGENTS.md — Domänenübergreifende Server-Services

Gilt für `apps/workspace/src/server/shared/**`. Ergänzt `src/server/AGENTS.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Zweck

Dieser Ordner ist die einzige zulässige Ausnahme von der Trennung zwischen `server/portal/` und
`server/workspace/` (siehe `src/server/portal/AGENTS.md`): Er hält **Services**, die von Handlern
beider Welten aufgerufen werden, weil dieselbe Fachlogik in beiden gebraucht wird — z. B. das
Anlegen/Syncen einer `users`-Zeile für eine Clerk-Identität (`clerk-user-service.ts`),
Portal-Rollen-/Mitgliedschafts-Validierung, die sowohl vom Portal-Redeem-Flow als auch von
CRM-Command-Handlern gebraucht wird (`portal-access-validation-service.ts`), oder das Schreiben von
Security-Events (`security-event-service.ts`), das von Handlern beider Welten in derselben
`security_events`-Tabelle protokolliert wird.

## Verbindlich

- **Nur Services, keine Handler.** Ein Command- oder Query-Handler gehört immer zu genau einer
  API-Schnittstelle (Portal **oder** Workspace) und liegt entsprechend unter `server/portal/` oder
  `server/workspace/`. Sobald zwei Handler aus unterschiedlichen Welten dieselbe Logik brauchen,
  wandert **die Logik** hierher in ein Service-Objekt — nicht der Handler, und keiner der beiden
  Handler ruft den anderen auf.
- **Keine Autorisierung.** Services hier liefern reine Fachlogik (Existenzprüfungen, Sync,
  Validierung) und konstruieren nie einen `PortalActor` oder `WorkspaceActor`. Die Actor-Auflösung
  bleibt in `server/portal/auth/` bzw. `server/workspace/auth/`.
- **Erst bei echter Zweitnutzung.** Ein Service entsteht hier erst, wenn ein zweiter Handler aus
  der jeweils anderen Welt dieselbe Logik braucht — kein vorsorglicher Platz „für später“.
- Benennung und Exportform wie in `src/server/AGENTS.md` beschrieben (`*-service.ts`, ein
  Service-Objekt als öffentliche API).

## Dateien (ab Task 55)

`files/` hält die Bausteine, die CRM- und Portal-Handler für Dateien teilen: `file-object-service.ts` (Link-Anlage,
Ticket-Anlage inkl. Pending-Limit, Abschluss inkl. Aktivität, Abbruch offener Uploads, Entfernen mit
`orphaned_at`-Fallback, Download-URL, Stream und actor-neutrale Aktivitätszeilen), `file-archive-service.ts`
(ZIP-Spaltenliste, Vorprüfung und Streaming), `file-request-schemas.ts` (gemeinsame Request-Felder), dazu Validierung
und Storage-Zugang. Autorisierung, Sichtbarkeitsfilter, die Sperre der Uploader-Zeile und die Prüfung „nur der eigene
Upload“ bleiben in den getrennten Handlern (`portalFileService` bzw. `fileAccessService`).
