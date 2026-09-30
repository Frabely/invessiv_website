# AGENTS.md — Portal (Server)

Gilt für `apps/workspace/src/server/portal/**`. Ergänzt `src/server/AGENTS.md`. Fachliche Grundlage:
`apps/workspace/plans/crm/12a-portal-fundament/49-portal-fundament.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Zweck

Hier wird aus einer Clerk-Kennung und einer `customerId` ein `PortalActor` mit effektiven Portal-Permissions bzw.
für den Workspace-Owner eine lesende `PortalOwnerView`. Die Gates `requirePortalReader` (lesende Seiten),
`requirePortalActor` (Seiten, die nur Kundenkontakte sehen dürfen) und `withPortalActor` (API) unter `auth/` sind die
einzigen regulären Aufrufer.
`shared/` enthält die Zugriffshelfer, die jede Portal-Query und -Mutation ab Ordner 12b verwendet.

## Verbindlich

- **Getrennt von `server/workspace/`.** Kein Portal-Handler liegt unter `server/workspace/`, kein Handler wird von
  beiden Welten benutzt — auch nicht mit einem Parameter, der entscheidet, wer fragt. Eine interne Mitgliedschaft
  gewährt keinen Portalzugriff und umgekehrt, auch bei derselben `users.id`. Braucht ein Handler beider Welten
  dieselbe Logik, wandert sie als Service nach `server/shared/` (siehe `src/server/shared/AGENTS.md`) — nie ein
  Cross-Domain-Import zwischen den Handlern selbst.
- **`PortalActor` ist branded.** Der Konstruktor `createPortalActor` in `auth/portal-actor.ts` ist die einzige Stelle,
  die eine Instanz erzeugt. Kein Codepfad baut einen `PortalActor` aus einer rohen `customerId` oder einem
  ungeprüften Row-Ergebnis zusammen.
- **Lesen mit `PortalReader`, Schreiben nur mit `PortalActor`.** `PortalReader = PortalActor | PortalOwnerView`.
  Lese-Handler nehmen `PortalReader` und filtern über `portalAccessCondition.forReader`; Schreib-Handler und -Routen
  nehmen ausschließlich `PortalActor` (`withPortalActor`, `portalCanOn.forActor`). Die Owner-Sicht ist ein
  Portal-Konstrukt, kein Workspace-Handler: Sie wird nur in `auth/resolve-portal-owner-view.ts` über
  `createPortalOwnerView` erzeugt, trägt nur `PORTAL_READ_PERMISSION_VALUES`, schreibt je Render genau ein
  Security-Event `PortalOwnerViewOpened` (ohne Event keine Sicht) und wird nur versucht, wenn keine eigene
  Mitgliedschaft existiert — ein Owner mit Mitgliedschaft sieht die echte Kundensicht.
- **Fail closed.** Fehlender User, inaktiver User, fehlende oder widerrufene Mitgliedschaft, unbekannte
  Permission-Keys und realmfremde Permissions ergeben keinen Zugriff. Ein DB-Fehler wird nie in „erlaubt" übersetzt,
  sondern in `PortalAuthStatus.Unavailable` (Seite: Fehlerseite über `PortalAuthorizationUnavailableError`; API: 503).
- **Fremde oder geratene `customerId` bestätigt nichts.** Sie ergibt exakt dieselbe Antwort wie eine nicht
  existierende (404 bzw. `notFound()`) — nie eine unterscheidbare Fehlermeldung.
- **Kein E-Mail-Abgleich.** Zuordnung ausschließlich über `users.clerk_user_id`. Keine Spalte und kein Index auf
  einer E-Mail-Adresse in den Portaltabellen.
- **Kein Cache über Requests.** Jeder Request löst neu auf, damit ein Widerruf beim nächsten Request wirkt.
  Innerhalb eines Seiten-Renders dedupliziert `react/cache` (`authenticateForRender`) nur für denselben `customerId`.
- **Zugriffsfilter sind Pflicht, nicht Empfehlung.** Ab Ordner 12b filtert jede Portal-Query über
  `portalAccessCondition` und jede Portal-Mutation prüft `portalCanOn` — beide firmenweit, vorbereitet für
  `projectPermissions`, das heute immer leer ist.
- Logs enthalten keine E-Mail-Adressen, Namen oder Clerk-Kennungen.

## Feedbackrunden (ab Task 59)

- Lesen verlangt `portal.feedback.read` **und** `portal.projects.read`, Schreiben zusätzlich `portal.feedback.submit`;
  das Projekt muss in `PORTAL_VISIBLE_PROJECT_STATUS_VALUES` liegen. Jeder Fehlgriff (fremde Firma, geratene ID,
  fehlendes Recht, archiviertes Projekt) ist `not_found`.
- Jede Mutation läuft in `portalFeedbackService.withLockedRound` (Transaktion, Rundensperre, Fehlgriff = `not_found`)
  und prüft `rejectUnlessAllowed`: erlaubt ist nur, was `canTransition(status, ziel, customer)` erlaubt, sonst
  `locked`; die Version wird unter der Sperre verglichen. Ein Entwurf (Speichern, Anhängen, Lösen) gilt als
  bearbeitbar, solange er eingereicht werden könnte. Geschrieben wird ausschließlich über
  `feedbackRoundWriteService` bzw. `feedbackAttachmentService` (`server/shared/services/feedback/`).
- Anhängen und Lösen verlangen zusätzlich `portal.files.read` (`canAttach`): Anhänge werden über die Portal-
  Dateisichtbarkeit gezeigt, ohne das Recht wären angehängte Dateien für den Kontakt unsichtbar.
- „Projekt im Portal sichtbar" ist genau einmal definiert: `shared/portal-project-condition.ts`. Der Activity-Actor
  eines Kontakts kommt aus `auth/portal-activity-actor.ts`.
- Punkt-IDs kommen vom Client: eine ID aus einer anderen Runde wird als `validation` abgelehnt, nie übernommen.
- Anhängen nur für fertige eigene Kundendateien ohne Punkt; eine Datei, die der Kunde nicht sehen darf, ist
  `not_found`, eine sichtbare, aber unpassende `not_attachable`.
- Abnahme (ab Task 61): aus `open` nur ohne Punkte, aus `completed` nur für die höchste Rundennummer ohne laufende
  Runde (`not_latest` bzw. `locked`), immer mit `confirmFinal`. Für den Weg aus `completed` sperrt der Handler
  zusätzlich das Projekt (dieselbe Sperre wie die Übergabe), damit Abnahme und Übergabe der nächsten Runde nie
  gleichzeitig gelingen. Ergebnisse und Antworten enthält das Portal-DTO erst ab `completed`.
- Fehlercodes sind `PortalFeedbackErrorCode`; Statuscodes und Texte stehen ausschließlich in
  `src/lib/portal/portal-feedback-api-error.ts`.
