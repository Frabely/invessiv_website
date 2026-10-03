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

## Onboarding-Bogen (ab Task 66)

Plan: `apps/workspace/plans/crm/15-onboarding/66-portal-formular.md`.

- `portalOnboardingService` ist die Fassade der Portal-Handler und teilt sich in `portal-onboarding-access-service`
  (Sichtbarkeit, Rechte, Sperre, offene Blöcke), `portal-onboarding-write-guard-service` (welcher Slot darf beschrieben
  werden) und den DTO-Bau in der Fassade selbst. Neue Regeln kommen in den passenden Teil.
- „Bogen im Portal sichtbar“ ist genau einmal definiert: `portalOnboardingService` (`services/onboarding/`) —
  Status in `ONBOARDING_PORTAL_VISIBLE_STATUS_VALUES` (nie `draft`), Firma des Lesers und Projekt laut
  `portalProjectCondition` mit `portal.onboarding.read`. Jeder Fehlgriff (fremde Firma, geratene ID, Entwurf,
  archiviertes Projekt, fehlendes Recht) ist `null` bzw. `not_found`.
- Schreiben verlangt zusätzlich `portal.onboarding.submit` und nie die Owner-Sicht; ohne das Recht antwortet jeder
  Schreibpfad `not_found` (wie bei den Feedbackrunden).
- Jede Mutation läuft in `portalOnboardingService.withLockedForm` (Transaktion, Bogenzeile `FOR UPDATE`). Speichern
  und Absenden eines Bogens laufen dadurch nacheinander: Nach dem Absenden schreibt kein Autosave mehr hinein.
- **Speichern ersetzt einen Slot.** `findWritableField` prüft: Feld gehört zu einem Block dieses Bogens (sonst
  `not_found`), der Block ist für den Kunden offen (`listCustomerEditableOnboardingBlockIds`: bei `open` alle, bei
  `changes_requested` nur `clarification` + `customer`; sonst `locked`), Unterfeld und Gruppeneintrag passen zusammen
  (sonst `validation`). Ob der Inhalt zum Feld passt (Option des Feldes, Höchstzahl, `validateQuestionnaireValue`),
  prüft der Handler; ein ungültiger Wert schreibt nichts. Geschrieben wird ausschließlich über
  `onboardingAnswerWriteService`. Die Bogen-`version` wird beim Autosave weder verglichen noch erhöht.
- **Absenden** prüft unter der Sperre `canTransitionOnboardingForm(status, submitted, customer)` (sonst `locked`) und
  berechnet die Vollständigkeit mit `onboardingFormReadService.toCompleteness` neu — dieselbe Funktion wie im
  Client. Fehlt etwas, antwortet es `required_missing` mit `missing[]`. Status, Zeitpunkt, Person, Activity und
  Systemnachricht schreibt `onboardingFormTransitionService.submit`.
- Das Portal-DTO baut ausschließlich `portalOnboardingMappingService`: Texte in der Locale der Anfrage über
  `resolveQuestionnaireBlock` (ohne Schlüssel, Versionen, Vorbelegungsquellen und andere Sprachen), die Rückfrage des
  Teams nur bei `clarification_mode = customer`, Namen nur von Kontakten.
- Fehlercodes sind `PortalOnboardingErrorCode`; Statuscodes und Texte stehen ausschließlich in
  `src/lib/portal/portal-onboarding-api-error.ts` (`validation` antwortet hier 422).

Ab Task 67 (`apps/workspace/plans/crm/15-onboarding/67-portal-gruppen-dateien-leistungen.md`):

- **Gruppeneinträge** (`add`/`remove`/`move`): Die ID kommt vom Client. Dieselbe ID am selben Feld erneut ist ein
  Erfolg, eine ID eines anderen Feldes oder Bogens `validation`, nie übernommen. Das Feld muss eine Gruppe dieses
  Bogens sein (`validation` bzw. `not_found`), die Grenze ist `max_items`, sonst
  `QUESTIONNAIRE_LIMITS.groupEntriesPerField` (`limit_reached`). Entfernen und Verschieben laufen über
  `findWritableGroupEntry`: Eintrag eines anderen Bogens ist `not_found`, ein nicht offener Block `locked`. Geschrieben
  wird ausschließlich über `onboardingGroupEntryService`; alle drei Befehle antworten mit den Einträgen der Gruppe.
- **Dateien anhängen und lösen** verlangen zusätzlich `portal.files.read` (`canAttach`, wie bei den Feedbackrunden),
  sonst `not_found`. Anhängbar ist nur eine fertige, nicht verwaiste Kundendatei **des Projekts dieses Bogens**, deren
  Art das Feld annimmt; eine Datei, die der Kontakt nicht sehen darf, ist `not_found`, eine sichtbare unpassende
  `not_attachable`. Die Grenze (`max_items`, sonst `filesPerField`) wird unter der Bogensperre gezählt. Lösen adressiert
  die Verknüpfung (`answerFileId`), nicht die Datei: Eine aus dem Vorbogen übernommene Datei eines anderen Projekts
  lässt sich lösen, aber nicht erneut anhängen. Geschrieben wird ausschließlich über `onboardingAttachmentService`.
- **Leistungen bestätigen** schreibt `services_confirmed_*` und `services_note` am Bogenkopf über
  `updateLockedVersioned` (die Bogenversion steigt). Ohne `project_services`-Feld im Bogen `validation`, liegt keines
  in einem für den Kunden offenen Block `locked`. Eine Anmerkung ohne Text ist `validation`, nie stillschweigend leer.
- Jeder dieser Schreibwege antwortet für die Statuszeile mit `portalOnboardingService.toSavedDto` bzw. dem geänderten
  Stand; die Bogen-`version` vergleicht keiner von ihnen.
- Das Portal-DTO trägt `services` (`PortalOnboardingServiceDto`: Titel, Beschreibung, Position — ohne Preis und ohne
  die ID der Projektleistung), `servicesNote` und `canAttach` (`portal.onboarding.submit` und `portal.files.read`,
  nie die Owner-Sicht). Das Dashboard-Widget liest die Zusammenfassung über `listPortalOnboardingForms`;
  es gibt dafür keine zweite Abfrage und kein Feld im `PortalDashboardDto`.

Ab Task 68 (`apps/workspace/plans/crm/15-onboarding/68-pruefung-und-nachforderung.md`):

- **Die Rückfrage des Teams erscheint erst mit der Nachforderung.** `portalOnboardingMappingService` gibt
  `reviewNote` nur im Status `changes_requested` und nur bei `clarification_mode = customer` heraus. Solange das
  Team noch prüft (`submitted`), bleibt eine bereits geschriebene Rückfrage intern.
- **Erneutes Absenden** läuft über denselben Befehl wie das erste. `onboardingFormTransitionService.submit` setzt
  dabei die nachgeforderten Blöcke auf `pending` zurück und legt keine zweite Sammelaufgabe an.

Ab Task 69 (`apps/workspace/plans/crm/15-onboarding/69-onboarding-termin.md`):

- **Onboarding-Call.** `getPortalOnboardingCall(reader, formId)` liefert `PortalOnboardingCallDto | null`. Das
  Projekt stammt aus dem Bogen, den `portalOnboardingService.findVisibleForm` diesem Leser zeigt. Fällig ist der Call
  erst nach der Prüfung (`isOnboardingCallBookable(status, blocks)`: `submitted`, kein Block `pending`, keine offene
  Rückfrage an den Kunden); ein fremder oder geratener Bogen und eine noch laufende Prüfung sind ununterscheidbar
  `null`, damit das Portal den Prüfstand nicht vorab erfährt. `{ booking: null }` heißt: fällig, aber niemand bietet
  einen Link an. Wessen Link es ist, entscheidet `projectResponsibleMemberService.findBookingContact`
  (`server/shared/`). Das DTO baut `portalOnboardingMappingService.toBookingDto`; es trägt Anzeigename, Link und
  Anbieter, keine Mitglieds-ID und keine E-Mail.
