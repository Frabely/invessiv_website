# Paket G — Portal-Aufgaben

> Teil von [README.md](./README.md) (Ziel, Entscheidungen, Reihenfolge, gemeinsame Regeln, Abnahme). Nur Plan, nichts umgesetzt.

- **G1 — Erledigte Aufgaben bleiben sichtbar (bugs 12).**
  `portal-customer-tasks-widget.tsx` zeigt offene Aufgaben zuerst und darunter die zuletzt erledigten abgehakt (die
  Daten liefert der Server bereits). Im Dialog ist „Erledigt“ nicht mehr eingeklappt.
- **G2 — Eigenen Haken zurücknehmen (bugs 12).**
  `PortalTaskDto` bekommt `canReopen` (wahr, wenn `completed_by_portal_membership_id` zum Kunden gehört). Neuer
  Endpunkt `POST …/tasks/[taskId]/reopen`, Handler `reopen-customer-task` nach dem Muster von
  `complete-customer-task.command-handler.ts`: setzt `open`, leert die Abschlussfelder, schreibt eine
  `StatusChange`-Aktivität. Neue Permission `portal.tasks.reopen` (Katalog-Migration, `portal_standard`, `db:smoke`).
  Die Checkbox ist nur gesperrt, wenn `canReopen` falsch ist. Der Owner-Prüfzugang schreibt nie.
- **G3 — Kunde legt Aufgabe an: Datenmodell (bugs 13).**
  Migration: `tasks.created_by_portal_membership_id` (nullable, FK), damit intern erkennbar ist, dass die Aufgabe vom
  Kunden kommt. Drizzle-Modell deckungsgleich, Constraint-Smoke, `db:seed:crm` um ein Beispiel erweitern. Permission
  `portal.tasks.create`.
- **G4 — Kunde legt Aufgabe an: Server.**
  `POST /api/portal/[customerId]/tasks`, Handler `create-customer-request-task` unter `server/portal/`: Titel (Pflicht),
  Beschreibung, optionale Wunschfrist, `projectId` (geprüft über `portalProjectCondition`). Die Aufgabe entsteht mit
  `action_side = internal`, `visible_to_customer = true`, Status `open`, Bearbeiter aus
  `projectResponsibleMemberService.findActiveMemberId`: Projektbetreuer, sonst der Betreuer des Kunden (Entscheidung
  vom 03.10.2026; die Funktion liefert diese Reihenfolge bereits). Nur wenn beide fehlen oder inaktiv sind, wird mit
  einer klaren Meldung abgelehnt („Schreib uns bitte im Chat“), weil `assignee_member_id` Pflicht ist. Aktivität über `taskActivityService`,
  Systemnachricht über `announceSystemMessage`. Begrenzung offener Kundenaufgaben je Projekt (z. B. 20) gegen
  Missbrauch. Cross-Customer-Negativtest und Test ohne Permission.
- **G5 — Kunde legt Aufgabe an: Portal-UI.**
  Widget „Daran arbeiten wir“ bekommt „Aufgabe für uns anlegen“ (kleiner Dialog, `impeccable` für die Gestaltung,
  `copywriting` für die Texte). Eigene Aufgaben tragen das Kennzeichen „von dir“. Abgelehnte eigene Aufgaben
  (Status `cancelled`) erscheinen als „Abgelehnt“ statt zu verschwinden.
- **G6 — Intern erkennbar.**
  Aufgabenliste und Aufgabendetail im Cockpit zeigen „Vom Kunden angelegt“. Annehmen (`in_progress`), bearbeiten und
  ablehnen (`cancelled`) laufen über die vorhandenen Aufgabenaktionen (`change-task-status.command-handler.ts`); es
  entsteht kein zweiter Weg.
