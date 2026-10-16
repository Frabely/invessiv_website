# AGENTS.md — Portal-UI

Gilt für `apps/workspace/src/components/portal/**`. Ergänzt die Root-`AGENTS.md`,
`apps/workspace/src/app/[locale]/(portal)/AGENTS.md` und `apps/workspace/plans/crm/AGENTS.md`.
Fachliche Grundlage des Dashboards: `apps/workspace/plans/crm/13-portal-dashboard/21-portal-dashboard.md`.

## Sprachregel

Inhalte von `AGENTS.md`-Dateien werden auf Deutsch gepflegt.

## Verbindlich

- **Kein Import aus `components/workspace/**`** und keine Portal-Komponente im internen Bereich. Geteilte Bausteine
  kommen aus `@invessiv/ui` (`Widget`, `WidgetGrid`, `ProcessTrack`, `ChatDock`, `TabList`, `Dialog`, …). Braucht das
  Portal eine Workspace-Komponente, wandert sie app-neutral nach `packages/ui`, statt importiert oder kopiert zu werden.
- **Daten nur aus Portal-DTOs** (`packages/common/src/contracts/portal/`). Keine Komponente leitet Sichtbarkeit oder
  Rechte selbst ab: Was sie zeigt, hat der Server gefiltert; Schreibrechte kommen aus `capabilities`.
- **Widgets registrieren sich ausschließlich in `PORTAL_WIDGET_LAYOUT`** (`src/common/constants/portal/`). Sichtbarkeit
  läuft über `listVisiblePortalWidgets` (Permission + `onlyWithContent`). Ein neuer Folge-Ordner stellt sein Mock-Widget
  um (`mock: false` + `requiredPermission`), statt eine zweite Karte zu bauen.
- **Jedes Widget hat seine eigene Farbe** aus `PORTAL_WIDGET_ACCENTS` (`src/common/constants/portal/`, ein Test
  verhindert doppelte Farben) und übergibt sie als `accent` an `Widget`. Wege auf andere Seiten laufen über
  `openMode="page"` mit `linkComponent={Link}`, nicht über eigene Links im Inhalt; ist der Kunde dran, setzt das
  Widget `openProminent`. Details zur Aktionsleiste in `packages/ui/AGENTS.md`, Abschnitt „Widgets“.
- Die Projekt-Auswahl darf den Titel eines sichtbaren Projekts als Navigation für unabhängig lesbare Aufgaben,
  Feedback oder Onboarding zeigen. Projektdetails und abgeschlossene Projekte bleiben an `portal.projects.read`
  gebunden; die Fach-Widgets prüfen nur ihr eigenes Leserecht.
- **Projekt-Widget:** Am Desktop zwei Drittel der Zeile (`WIDE_ROW`), am Tablet die volle Breite. Die Prozessleiste
  ist dieselbe wie im Onboarding-Bogen (`ProcessTrack` kompakt); Füllung, Farbe, Haken und die Marke der laufenden
  Feedbackrunde kommen ausschließlich aus `toProcessTrackSteps` (`@invessiv/common`), die Statuswörter aus
  `widgets.project.stepStatus`. Schrittnamen, „Nächster Schritt“, Projektleitung und Buttons stehen je auf einer
  Zeile und brechen erst um, wenn die Karte zu schmal wird.
- **Mock-Widgets** (seit Task 76 gibt es keines mehr) tragen das Badge „Bald verfügbar“ (`mock`-Prop am `Widget`) und zeigen **keine erfundenen Werte** —
  nur Skeleton-/Illustrationsinhalt und eine Beschreibung, was dort entstehen wird.
- **Öffnen nur über explizite Buttons** (`Widget`-`openMode`). Dialoge hängen am URL-Parameter `?widget=<key>`;
  Schließen entfernt ihn. Der Projektwechsel im Header nutzt `?project=<id>`.
- **Owner-Sicht** (`capabilities.isOwnerView`): jede Schreibaktion ist deaktiviert und verweist mit Link ins CRM.
- **Texte** ausschließlich aus `src/i18n/dictionaries/portal/<modul>/{de,en}.json`, Anrede „du“ (wie im restlichen
  Portal), freundlich, kein
  Fachjargon („Bringschuld“ nie im UI). Überfälliges wird sichtbar, aber ohne Drohton formuliert.
- **Styling:** co-located `*.module.css`, nur Theme-Tokens aus `app/globals.css`, Zustände über `data-*`, sichtbarer
  Fokus, `prefers-reduced-motion` respektieren, Klickflächen ≥ 44 × 44 px. Keine verschachtelten Karten.
- Client-Zustand, der Daten einer Firma hält, wird über `key={customerId}` an die Firma gebunden, damit zwei Firmen nie
  gemischt erscheinen.
- `*Props`-Typen dürfen exportiert werden, sonst keine Typ- oder Konstantenexporte aus Komponenten.
- Owner-Hinweise mit CRM-Link laufen über `portal-owner-notice/` (Aufgaben, Nachrichten) — kein zweiter Hinweisbaustein.
- **Dateien an ein Ziel hängen** (Feedbackpunkt, ab Task 67 Bogenfeld) läuft ausschließlich über
  `shared/portal-attachment-field/`: Liste, Upload-Warteschlange, Upload-Fläche und Fehlerzeile in einem Baustein.
  Der Nutzer übergibt Transport, `attachAction`/`detachAction` (Ablehnung als fertiger Text), Grenze (`maxFiles`),
  `accept` und Texte; der Baustein kennt weder Endpunkte noch Fachbegriffe. Kein zweiter Upload-Baustein je Bereich.
  Unter `shared/` liegt nur, was mehrere Portal-Bereiche nutzen.

## Aufgaben im Dashboard (Paket G, Ordner 18)

Plan: `apps/workspace/plans/crm/18-portal-prozess-nacharbeiten/G-portal-aufgaben.md`.

- „Von dir benötigt“ zeigt offene Aufgaben zuerst und darunter die zuletzt erledigten abgehakt; im Dialog steht
  „Erledigt“ offen da, nichts ist eingeklappt.
- Ob ein Haken zurückgenommen werden kann, entscheidet ausschließlich `canReopen` aus dem DTO. Ein eben gesetzter
  Haken bleibt bis zum Refresh gesperrt. Abhaken und Zurücknehmen laufen über `usePortalTaskCompletion`.
- „Aufgabe für uns anlegen“ erscheint nur mit `capabilities.canCreateTasks` und hängt als Dialog an
  `?widget=ourTasks` (`actionDialog` in `PORTAL_WIDGET_LAYOUT`). Die Owner-Sicht bekommt stattdessen den
  Owner-Hinweis mit CRM-Link. Der Dialog (`dashboard/portal-task-request-dialog`) schickt die
  `selectedProjectId` des Dashboards, nie eine selbst gewählte Kunden-ID.
- Eigene Aufgaben tragen „von dir“ (`requestedByCustomer`), abgelehnte eigene bleiben als „Abgelehnt“
  (`rejected`) in der Liste.

## Kundenchat (ab Task 26)

Plan: `apps/workspace/plans/crm/13a-kundenchat/26-chat-im-portal.md`.

- Komponenten liegen unter `messages/`. Verlauf, Eingabefeld und Ladezustand kommen aus `@invessiv/ui`
  (`MessageThread`, `MessageThreadStatus`) — dieselben Bausteine wie im CRM, nur mit Portal-Texten.
- Laden, Senden und Lesestand laufen ausschließlich über `usePortalConversation` (`src/hooks/portal/`), der auf dem
  geteilten `useConversationThread` aufsetzt. Kein Polling.
- Das Eingabefeld erscheint nur, wenn der Server `canWrite` im `PortalConversationDto` liefert; die Owner-Sicht
  bekommt nie `canWrite` und zeigt stattdessen den Owner-Hinweis mit CRM-Link.
- Im Dashboard gibt es **kein** Nachrichten-Widget: Der `ChatDock` ist der Einstieg und zeigt Ungelesenes am Rail
  (`unreadCount`). Ohne `portal.messages.read` wird der Dock nicht gerendert.
- **Mobil (unter 768 px) ist der Dock ein runder Button unten rechts**, kein Balken am unteren Rand: iOS fängt Taps
  direkt am Rand für die eigenen Gesten und die Safari-Leiste ab. Der Abstand zum Rand bleibt deshalb mindestens
  1 rem plus `safe-area-inset-bottom`.
- **Keine eigene Chat-Seite.** Der Dock im Dashboard ist der einzige Ort des Chats (Entscheidung 08.10.2026). Wer
  von einer anderen Portalseite in den Chat verlinkt, baut den Link über
  `buildPortalHref(portalPathFor(locale, customerId), "", { project, chat: true })`: Das Dashboard kommt mit
  `?chat=open` und geöffnetem Dock an. Gelesen wird der Parameter nur über `readPortalDashboardChat`; beim ersten
  Auf- oder Zuklappen entfernt das Dashboard ihn ohne Server-Roundtrip (`history.replaceState`). Ohne Leserecht
  bleibt der Parameter wirkungslos.
- Drafts und fehlgeschlagene Sendungen sind je Nutzer und Firma gebunden (`viewerUserId:customerId`).
- **Anhänge (ab Task 56):** 📎 erscheint nur, wenn die Seite `filesContent` übergibt und der Server
  `attachmentAccess` im `PortalConversationDto` setzt (Owner-Sicht nie). Datei-Zugriff läuft über
  `usePortalChatAttachmentApi`; Auswahl, Upload und Freigabe-Hinweis kommen aus der geteilten
  `ConversationThreadView` (`components/shared/chat-attachments/`). Das Portal gibt nie etwas frei; ein nicht mehr
  sichtbarer Anhang erscheint als „Nicht mehr verfügbar“ ohne Namen.

## Dateien (ab Task 55)

Plan: `apps/workspace/plans/crm/14-dateien/55-portal-dateien.md`.

- Komponenten liegen unter `files/`; Orchestrator ist `files/portal-files-view`. Typ-Symbol, Upload-Zeile, Lightbox
  und Formular-Dialog kommen aus `@invessiv/ui` (`FileKindIcon`, `UploadQueueRow`, `FileLightbox`, `FormDialog`) —
  dieselben Bausteine wie im CRM, nur mit Portal-Texten aus `dictionaries/portal/files/`.
- Upload- und Link-Dialoge, Dateizeile, Listenrahmen und ZIP-Auswahlleiste nutzen die geteilten UI-Bausteine
  `FileUploadDialogFrame`, `FileLinkDialogFrame`, `FileEntryRow`, `FileListFrame` und `FileArchiveToolbar`.
  Portal-Komponenten ergänzen ausschließlich ihre Portal-DTOs, erlaubten Projekte und API-Aufrufe.
- Laden nur über `usePortalFiles` (auf dem geteilten `usePagedFiles`), Uploads nur über `useUploadQueue` mit
  Portal-Transport, Auswahl für ZIP über `useFileSelection` (URL-Parameter `selected`, an die Kunden-ID gebunden).
  Reiter „Von uns“ / „Von dir“ im URL-Parameter `tab`.
- Upload-Fläche und „Link hinzufügen“ erscheinen nur mit `canUpload` (Seite: `portal.files.write` und keine
  Owner-Sicht). Die Owner-Sicht zeigt stattdessen den Owner-Hinweis mit CRM-Link. Es gibt keinen Lösch- oder
  Bearbeitungsweg im Portal.
- Nach eigenem Upload oder Link springt die Ansicht auf „Von dir“, damit der Kunde sieht, was angekommen ist.
- Das Dashboard-Widget `files` zeigt je Reiter die drei neuesten Einträge und verlinkt die Seite; ohne
  `portal.files.read` wird es nicht gerendert.

## Feedbackbogen (ab Task 60)

Plan: `apps/workspace/plans/crm/16-feedbackrunden/60-ui-uebergabe-und-kundenbogen.md`.

- Komponenten liegen unter `feedback/`; Orchestrator ist `feedback/feedback-page-view`. Wer die offene Runde
  ausfüllen darf (Zustand `sheet`), bekommt `feedback-editor`, alle anderen und jeder andere Zustand `feedback-reader`.
  Welcher Zustand gezeigt wird, entscheidet ausschließlich `portalFeedbackPageState` (`common/patterns/portal/`).
- **Schritt-Layout wie das Onboarding (Paket J, Entscheidung 16.10.2026,
  Plan `apps/workspace/plans/crm/25-portal-feedback-redesign/J-portal-feedback-layout.md`).** Editor und Reader rendern
  `feedback-page-frame`: fester Kopf (`shared/portal-step-header`) mit Zurück-Link, Titel und übrigen Runden, darunter
  der Stepper `feedback-round-track` (`ProcessTrack` kompakt), die Runde scrollt dazwischen, unten die Fußleiste
  (`shared/portal-step-bar`). **Ein Schritt = eine Runde.** Der Stepper zeigt alle Runden aus
  `listFeedbackRoundSteps`: übergebene sind wählbar, kommende und nach einer Abnahme entfallene stehen ausgegraut und
  ohne Button da (`disabled` am `ProcessTrackStep`). Füllung nach Status (offen ¼, eingereicht/Gespräch ½, Umsetzung ¾,
  umgesetzt/abgenommen voll und grün); zurückgegebene Runde und Gespräch tragen die Sprechblasen-Marke.
- Die gewählte Runde steht in der URL (`?round=<nummer>`) und läuft ausschließlich über `useFeedbackRoundNavigation`
  (auf dem geteilten `usePortalStepSearch`, derselbe wie im Onboarding). Ohne gültigen Parameter öffnet die laufende
  bzw. neueste Runde (`initialFeedbackRoundNumber`). Ein Wechsel setzt den Scrollbereich an den Anfang und den Fokus
  auf die Rundenüberschrift. Die offene Runde bleibt beim Lesen früherer Runden eingebunden, damit Uploads auch
  bei Browser-Zurück/Vorwärts weiterlaufen; ihre ausgeblendeten Felder sind nicht bedienbar.
- Jede Runde ist ein `feedback-round-step`: Kopf (`feedback-round-head`: Titel, Status-Badge, maßgebliches Datum,
  „Was ist neu“ und Vorschau als `ButtonLink`), Stand (`feedback-round-notice` über `feedback-state-notice`), Punkte als
  Karten. Frühere Runden sind nur lesbar. Der Entwurf lebt im Editor, ein Blick zurück verliert nichts.
- **Kontaktwege** (`feedback-contact-ways`): Chat, Termin im Kalender der zuständigen Person und E-Mail an sie in einer
  Zeile, der Anbieterhinweis zum Kalender darunter. Genutzt vom Gesprächs-Hinweis und vom Hinweis „Runden aufgebraucht“
  (dort zuerst „Zusätzliche Runde anfragen“, wenn angeboten). Person, Adresse und Link kommen nur aus `contact` im DTO.
- **Kein „Zwischenspeichern“.** Der Autosave speichert; die Fußleiste zeigt links `DraftSaveStatus`, rechts
  „Feedback einreichen“. Auf früheren Runden zeigt sie Zurück/Weiter. Keine selbst gebauten Pillen-Links oder runden
  Buttons: Links sind `ButtonLink`, Entfernen eines Punkts ist ein Icon-Button (`size="icon"`, `quiet`).
- Entwurf, Autosave (≈ 1,5 s entprellt), Konflikt und Verlassen-Warnung laufen ausschließlich über `useFeedbackDraft`
  (`src/hooks/portal/`); API-Aufrufe nur über `portalFeedbackApiService`. Die Statuszeile ist der geteilte
  `DraftSaveStatus` (`components/shared/draft-save-status/`), die Konfliktanzeige steht im Editor über den Punkten
  (`feedback-draft-conflict`). Speicherstatus und Konflikte bleiben auch beim Lesen früherer Runden sichtbar und
  nennen dort die betroffene offene Runde; die Verlassen-Warnung kommt aus `useLeaveWarning` (`src/hooks/shared/`). Vor Upload, Einreichen und Freigeben wird
  immer `flush()` abgewartet. Ein 409 zeigt den aktuellen Stand und bietet die eigene Fassung zum Wiederherstellen
  oder Kopieren an — nie stilles Überschreiben.
- Bearbeiten nur mit `canSubmit`, Anhängen/Lösen nur mit `canAttach`, Upload zusätzlich mit `portal.files.write`
  (`canUpload` der Seite). Die Owner-Sicht liest nur und zeigt den Owner-Hinweis mit CRM-Link.
  `feedback-item-attachments` bindet nur noch die Endpunkte, Texte und die Grenze des Punkts an
  `shared/portal-attachment-field/`.
- Freigeben ohne Änderungen erscheint nur ohne Punkte und nur über `feedback-approve-dialog` mit Pflicht-Haken.
- Ab Task 61: Gespräch (`discussion`) und zurückgegebene Runde zeigen den Hinweis des Teams über
  `feedback-round-notice`. Ergebnisse je Punkt zeigt `feedback-item-list` über das geteilte `FeedbackItemResult`.
  Nach einer abgeschlossenen Runde öffnet die Seite auf ihr; `feedback-final-approval` bietet die Abnahme an
  (nach der letzten Runde als Hauptaktion in der Fußleiste, vorher als ruhiger Abschnitt, der die Zahl der verfallenden
  Runden nennt) und nutzt `feedback-approve-dialog` mit eigenen Texten
  (`finalApproveDialog`). Sprachregel: Die Abkürzung aus einer leeren Runde heißt „freigeben“, die Abnahme nach der
  letzten Runde „abnehmen“; der Endzustand heißt überall „Abgenommen am …“.
- Links auf die Seite entstehen nur über `buildPortalFeedbackPath`. Das Dashboard-Widget `feedback` erscheint nur
  mit `portal.feedback.read` (Widget-Registry); `dashboard.feedback` ist der Stand des gewählten Projekts oder `null`.

## Onboarding-Bogen (ab Task 66)

Plan: `apps/workspace/plans/crm/15-onboarding/66-portal-formular.md`.

- Komponenten liegen unter `onboarding/`; Orchestrator ist `onboarding/onboarding-form-view`. Wer gerade schreiben
  darf (`editableBlockIds` nicht leer), bekommt `onboarding-form-editor`, alle anderen und jeder spätere Status
  `onboarding-form-reader`. Das Dashboard-Widget verlinkt direkt auf den Bogen des gewählten Projekts.
- **Lesen im selben Schritt-Layout (Entscheidung 16.10.2026).** Der Reader hat denselben Kopf, dieselbe Schrittleiste
  und dieselbe Fußleiste (`shared/portal-step-bar`) wie der Editor. Erster Schritt ist `status`
  (`PORTAL_ONBOARDING_STATUS_SECTION`) mit Stand, Terminkarte, Owner-Hinweis und nach dem Abschluss den Wegen in
  Dateibereich und Chat; danach folgt je Block ein Schritt mit den Antworten als Text (`OnboardingAnswerReadView`),
  nie als deaktivierte Eingaben. Es gibt keinen Prüfschritt und keinen Gesamtstand im Kopf.
- **Ein Block = ein Schritt.** Der Schritt steht in der URL (`?section=<blockId>` bzw. `review`, optional
  `&field=<fieldId>`) und wird ausschließlich über `usePortalOnboardingStep` gelesen und geschrieben
  (über `usePortalStepSearch`, `history.pushState`, kein Server-Roundtrip). Pflichtfelder blockieren den Schrittwechsel nie. Nach einem Wechsel
  liegt der Fokus auf der Blocküberschrift, nach einem Sprung aus der Liste fehlender Angaben auf dem Feld
  (`onboardingFieldDomId`).
- **Speichern nur über `useOnboardingAutosave`** (`src/hooks/portal/`): Text entprellt (1,5 s) und beim Verlassen des
  Felds, Auswahlen sofort; Speichervorgänge laufen nacheinander, letzter Stand je Feld gewinnt. Ungültiger Text bleibt
  im Feld, zeigt seinen Grund und wird nie gesendet; ein fehlgeschlagener Speichervorgang behält die Eingabe und bietet
  „Erneut versuchen“. API-Aufrufe nur über `portalOnboardingApiService`. Vor dem Absenden wird immer `flush()`
  abgewartet; ist danach etwas nicht gespeichert, wird nicht abgesendet.
- **Ungültige Eingaben zählen nur in sichtbaren Feldern** (`onboardingAnswerDrafts.listInvalid`). Text in einem Feld,
  das seine Bedingung wieder ausblendet, warnt nicht und hält das Absenden nicht auf.
- **Ein Schrittwechsel während eines Uploads fragt nach** (`upload.leaveWarning` der Dateitexte). Ein abgebautes
  `portal-attachment-field` bricht seine laufenden Uploads ab und hängt nichts mehr an: Hinter einem Feld, das weder
  Fortschritt noch Fehler zeigen kann, läuft nichts weiter.
- **Veralteter Stand startet den Editor neu.** Meldet der Server `locked`, `not_found` oder beim Absenden
  `required_missing`, ruft der Editor `onStaleAction`; `onboarding-form-view` lädt neu und mountet den Editor mit dem
  nächsten Bogen der Seite frisch. Ein Refresh aus anderem Anlass tut das nicht, damit getippter Text bleibt.
- **Dateien, die der Kontakt nicht öffnen darf, zählen mit** (`hiddenAnswerFiles` im DTO), damit Fortschritt und
  fehlende Angaben zum Server passen. Die Leseansicht nennt sie mit `read.filesHidden`.
- **Sichtbarkeit, Pflicht und Fortschritt kommen ausschließlich aus `getQuestionnaireCompleteness` bzw.
  `isQuestionnaireFieldVisible`** (`@invessiv/common`), gefüttert mit den lokalen Antworten
  (`onboardingAnswerDrafts.toAnswers`). Keine Komponente entscheidet selbst, ob ein Feld sichtbar oder Pflicht ist.
  Die Schrittleiste (`ProcessTrack` kompakt, mit `ratio`/`tone`/`valid` je Schritt) zeigt je Block, wie viel
  beantwortet ist und ob er so absendbar wäre; die Entscheidung trifft allein `onboardingStepProgress`
  (Regeln unten unter „Layout und Fortschritt“), nie einen Haken nur fürs Durchklicken.
- `questionnaire-field` schaltet je Feldtyp und kennt ab Task 67 alle 14 Typen; ein unbekannter Typ rendert nichts
  (Konsolenwarnung nur in der Entwicklung).
- Die Leseansicht ist der geteilte `OnboardingAnswerReadView` (`components/shared/onboarding/`), derselbe Baustein wie
  im CRM-Tab „Antworten“. Antworttext läuft ausschließlich über `LinkedText`, nie als HTML.
- Links auf Bogen und Schritt entstehen nur über `buildPortalOnboardingPath` bzw.
  `buildPortalOnboardingStepSearch`.

Ab Task 67 (`apps/workspace/plans/crm/15-onboarding/67-portal-gruppen-dateien-leistungen.md`):

- **Ein Slot statt eines Felds.** Entwürfe, Speicherzustände, ungültige Eingaben und DOM-IDs laufen über den
  Slot-Schlüssel `onboardingAnswerDrafts.slotKey(fieldId, groupEntryId)`: auf Blockebene die Feld-ID, im Unterfeld
  Feld plus Gruppeneintrag. Wer ein Feld adressiert, baut nie selbst einen Schlüssel. Das Format selbst liegt einmal
  in `@invessiv/common/patterns/crm/questionnaire/questionnaire-answer-slot`; die Vollständigkeitsprüfung und die
  geteilte Leseansicht nutzen es direkt, das Portal über `onboardingAnswerDrafts`.
- **Was der Bogen neben Antworten hält**, liegt in `useOnboardingFormState` (`src/hooks/portal/`): Gruppeneinträge,
  Datei-Verknüpfungen und die Leistungsbestätigung. Gruppenbefehle laufen nacheinander; ein neuer Eintrag erscheint
  sofort unter einer hier erzeugten ID, und `useOnboardingAutosave` wartet über `waitForEntryAction`, bis er auf dem
  Server existiert, bevor es ein Unterfeld speichert. Ein Fehler erscheint am Feld, zu dem er gehört. Beim Absenden
  wartet der Editor `settle()` und `flush()` ab und sendet nicht, solange ein Upload läuft.
- **Felder bekommen alles über `OnboardingFieldFormContext`** (`common/contracts/portal/`, die `form`-Prop von
  `questionnaire-field`: Entwürfe, Live-Zustand, Aktionen, Texte). Eine
  Gruppe rendert ihre Unterfelder über eine Render-Prop durch dieselbe `questionnaire-field`, genau eine Ebene tief;
  Bedingungen von Unterfeldern werden je Eintrag ausgewertet.
- **Gruppen** (`fields/onboarding-group-field`): Einträge sind linierte Abschnitte, keine Karten im Schritt. Der Fokus
  folgt dem Geschehen: in den neuen Eintrag, mit dem verschobenen Eintrag mit (am Rand auf die Gegenrichtung), nach
  dem Entfernen auf „Eintrag hinzufügen“. Während ein Befehl läuft, bleiben die Schaltflächen fokussierbar
  (`aria-disabled`) und ignorieren Klicks. Entfernen fragt nur nach, wenn der Eintrag Angaben oder Dateien hat.
- **Dateien** (`fields/onboarding-files-field`) nutzen `shared/portal-attachment-field/`; hochgeladen wird ins
  Projekt des Bogens, gelöst wird über die Verknüpfung (`answerFileId`). Anhängen und Lösen nur mit `canAttach` aus
  dem DTO, Upload zusätzlich mit `canUpload` der Seite (`portal.files.write`, nie die Owner-Sicht).
- **Projektleistungen** zeigen `services` aus dem DTO ohne Preise. „Passt so“ speichert sofort, eine Anmerkung beim
  Verlassen des Textfelds; ohne Text wird nichts gesendet.
- **Farbe** nie als Inline-Style: im Formular trägt der native Farbwähler die Vorschau, in der Leseansicht ein
  SVG-Attribut (`fill`). **Skala** sind fünf native Radios in einer Spur; die beiden Optionen des Felds sind nur die
  Pol-Beschriftungen.
- **Leseansicht:** `OnboardingAnswerReadView` zeigt Gruppeneinträge mit eigenen Antworten, Dateien, Leistungen samt
  Bestätigung und Anmerkung, Bestätigung, Farbe und Skala. Download und Vorschau reicht der Aufrufer als `files`
  herein (Portal: `usePortalFileDownloads`, CRM: `useFileDownloads` mit `filesApiService`); ohne `files` stehen nur
  die Dateinamen da.
- **Onboarding-Widget:** Es steht in `PORTAL_WIDGET_LAYOUT` hinter `portal.onboarding.read` und ist echt
  (`onlyWithContent`): Die Seite lädt mit `getPortalOnboardingWidgetForm` nur den Bogen des gewählten Projekts
  und meldet Inhalt nur, wenn es diesen Bogen gibt. Der Fortschritt kommt aus derselben Zusammenfassung wie im CRM.

- **Nachforderung (ab Task 68):** Im Status `changes_requested` öffnet der Bogen auf dem ersten Block aus
  `editableBlockIds` (`usePortalOnboardingStep` nimmt dafür einen Startabschnitt), zeigt über dem Formular, was zu
  tun ist, und an jedem nachgeforderten Block die Rückfrage des Teams (`reviewNote`). Alle anderen Blöcke bleiben
  lesend. Das Widget heißt dann „Wir haben Rückfragen“ und führt mit „Jetzt ergänzen“ in den Bogen. In der
  Schrittleiste trägt jeder nachgeforderte Block eine warme Sprechblasen-Marke (`flagged` am `ProcessTrackStep`),
  unabhängig von Füllung, Farbe und Haken; der Screenreader-Status nennt die Rückfrage (`steps.statusRequested`).
  Welche Blöcke das sind, kommt aus `editableBlockIds` im Status `changes_requested`.
- **Skala:** Bogen und Leseansicht zeigen sie über denselben Baustein
  `components/shared/onboarding/onboarding-scale-track` (mit `onChangeAction` als Radios, ohne als Bild, `compact`
  für die Leseansicht). Kein zweiter Skalen-Stil.

- **Onboarding-Call (ab Task 69):** `onboarding/onboarding-booking-card` zeigt den Buchungslink des zuständigen
  Mitglieds oder, ohne Link, den Hinweis „Wir melden uns bei dir für einen Termin“ samt Chat-Link (nur mit
  `portal.messages.read`). Wann der Abschnitt erscheint, entscheidet ausschließlich der Server: Seite und Widget
  bekommen `call: PortalOnboardingCallDto | null` und zeigen den Abschnitt genau dann, wenn er nicht `null` ist (erst
  nach der Prüfung durch das Team, nie schon mit dem Absenden). Keine Komponente leitet das aus dem Status ab; Seite
  und Widget (`compact`) nutzen dieselbe Komponente. **Nichts vom Anbieter
  wird vor dem Klick geladen:** kein Skript, kein `iframe`, kein Bild. Der Kalender öffnet sich als Link in einem neuen
  Tab (`rel="noopener noreferrer"`), der Anbieterhinweis steht davor. Eine Einbettung wäre eine neue Entscheidung
  (Consent), kein Detail dieser Komponente.

- **Layout und Fortschritt (Paket I, Ordner 18):** Plan
  `apps/workspace/plans/crm/18-portal-prozess-nacharbeiten/I-portal-onboarding-layout.md`.
  - **Fester Bogen-Kopf** (`shared/portal-step-header`, geteilt mit dem Feedback): Zurück-Link, `h1` und Gesamtstand in einer Zeile,
    darunter die Schrittleiste. Editor und Reader rendern ihn selbst; der Reader ohne Gesamtstand. Der
    Kopf ist **nicht** `position: sticky`: Die Seite markiert sich mit `data-portal-fixed-head`, `.main` der
    `PortalShell` scrollt dann nicht mehr selbst, und der Inhalt scrollt unter dem Kopf in einem eigenen Bereich
    (`.body` in Editor und Reader). So kann zwischen Portal-Header und Kopf nichts durchscheinen.
    Die Abstände kommen weiter aus `--portal-main-pad-*`.
  - **Füllung und Gültigkeit sind zwei Aussagen.** Die Füllung ist `answered/total` aller sichtbaren Fragen aus
    `getQuestionnaireCompleteness` (Gruppe zählt einmal, dazu ihre Unterfelder je Eintrag). Farben: unberührt
    neutral-warm, begonnen blau, alles beantwortet grün. Rot bei ungültiger Eingabe oder wenn ein begonnener oder
    besuchter Schritt mit fehlender Pflichtangabe verlassen wurde, auch ohne Eingabe. `usePortalOnboardingStep`
    erfasst dafür tatsächliche Abschnittswechsel einschließlich direkter Schrittklicks und Browser-Zurück/Vorwärts
    innerhalb der Editor-Sitzung. Unbesuchte leere Schritte und der offene Schritt bleiben bei lediglich fehlenden
    Pflichtangaben neutral bzw. blau; ungültige Eingaben werden auch im offenen Schritt rot. Der Prüfschritt wird
    nur ohne fehlende Pflichtangaben und ohne ungültige Eingaben grün. Der Haken
    (`valid`) steht, sobald keine Pflichtangabe fehlt, auch bei halber Füllung. Farbe ist nie das einzige Signal:
    Icon, Zähler `3/10` und ein ausgeschriebener Status für Screenreader gehören dazu.
  - **Der offene Schritt** liegt auf einer in seiner Statusfarbe getönten Fläche mit Rahmen und fettem Titel.
  - **Spalten** kommen aus `onboarding/onboarding-field-grid` (Container Queries: eine Spalte, ab 40rem eigener
    Breite zwei) und `onboardingFieldSpan` (`narrow` teilt sich die Zeile, `wide` und `full` nehmen sie ganz). Block und Gruppeneintrag nutzen
    dasselbe Raster; die DOM-Reihenfolge bleibt die Fragenreihenfolge. Keine Komponente setzt eigene Spaltenbreiten.
  - **Felder aus einem Guss:** Jede Frage nutzt die Formular-Bausteine aus `@invessiv/ui`: `FormField` (Text, mit
    `reserveErrorSpace={false}`), `FormFieldset` (Frage über mehreren Controls), `OptionTile` mit `RadioControl` bzw.
    `CheckboxControl` (Auswahl, Mehrfachauswahl, Bestätigung) und `FormHint`. Kein Feld definiert Label-, Hinweis- oder
    Kachel-Stile selbst. Eingaben, Kacheln, Skala und Buttons im Formular sind `--control-height` hoch (Token in
    `globals.css`). Der Hinweis steht unter dem Control; nur die Gruppe zeigt ihn über den Einträgen. Langtext startet
    einzeilig und wächst mit dem Inhalt.
  - **Fußleiste:** fest unter dem Scrollbereich (weder `sticky` noch `fixed`), auf allen Breiten randlos über die volle Breite, eine Zeile mit Speicherstatus und Zurück/Weiter; „Weiter“ nennt den nächsten
    Schritt. Ein Schrittwechsel setzt den Scrollbereich des Editors (`.body`) an den Anfang, nicht `window`.
  - **Shell mobil:** unter 768 px zeigt der Header nur Logo, Begrüßung, Profil und Menü-Button. Der
    Menü-Dialog zeigt den Owner-Hinweis und darunter beschriftete Zeilen ohne Trennlinie (`MenuRow`, Beschriftung
    links, Control rechts): „Firma“ nur bei mehreren Firmen (`switcherHasChoice`), „Projekt“ nur bei mehreren
    Projekten (das Layout lässt `projectSwitcher` sonst weg), dann „Darstellung“ und „Sprache“. Theme- und
    Sprachschalter werden einmal gebaut und im Header und im Menü verwendet. Platz für den Chat-Dock reserviert `.main` nur, wenn die Seite
    einen rendert (`data-portal-dock`).

- **Abschluss (ab Task 70):** Der Status-Schritt eines abgeschlossenen Bogens zeigt „Abgeschlossen am …“, den Satz,
  dass er die Grundlage des Projekts ist, und, wenn es mindestens einen Weg gibt, den Hinweis, dass Nachträge nicht
  mehr ins Onboarding gehören, mit den Wegen als `ButtonLink` (Ghost, Icon vor dem Text). Die Links in den
  Dateibereich (`filesHref`, nur mit `portal.files.read`) und in den Chat (`chatHref`, nur mit
  `portal.messages.read`) reicht die Seite herein; ohne Recht fehlt der Button. Antworten und Anhänge stehen in den
  Block-Schritten des Readers, es gibt keine Schreibaktion. Das Widget zeigt
  „Abgeschlossen am …“ mit „Ansehen“; die Terminkarte entfällt, weil der Server keinen `call` mehr liefert.

## Zugangsdaten (ab Task 71)

Plan: `apps/workspace/plans/crm/19-credentials/71-credentials-portal.md`.

- **Keine eigene Seite.** Zugangsdaten sind ein Dialog des Dashboards, wie die Sektion im CRM-Cockpit
  (Entscheidung 07.10.2026). Das Widget `credentials` steht mit `openMode: Dialog` in `PORTAL_WIDGET_LAYOUT`; der
  Dialog hängt an `?widget=credentials`.
- Komponenten liegen unter `credentials/`; Orchestrator ist `credentials/portal-credentials-dialog`. Er lädt die
  Liste über `usePortalCredentials` (`src/hooks/portal/`) erst beim Öffnen — nie mit dem Dashboard — und nach
  jedem Speichern neu.
- **Das Dashboard kennt nur `PortalCredentialsSummaryDto`** (Zahl, `canWrite`, `configured`), nie Titel,
  Benutzernamen oder Werte. Die Seite lädt es über `getPortalCredentialsSummary` nur, wenn das Widget für den
  Leser sichtbar ist; ohne `portal.credentials.read` gibt es weder Widget noch Dialog.
- **Zwei Wege hinein:** „Zugangsdaten öffnen“ zeigt die Liste, „Zugang hinterlegen“ (nur mit `canWrite`) öffnet
  direkt das Formular und schließt beim Abbrechen oder Speichern wieder zum Dashboard.
- **Nie zwei Dialoge übereinander.** Hinterlegen und Ändern ersetzen die Liste durch das Formular und kehren danach
  zu ihr zurück.
- **Aktionen nur aus `capabilities` der Liste:** Anzeigen und Kopieren mit `canReveal`, „Zugang hinterlegen“ und
  „Ändern“ mit `canWrite`. Es gibt keinen Lösch-, Projekt- oder Freigabeweg. Die Owner-Sicht bekommt den
  Owner-Hinweis mit CRM-Link.
- **Geteilte Bausteine statt Kopien:** Geheimnisfeld, Typ-Symbol, Faktenliste (`credential-facts`) und der
  Formular-Dialog (`credential-form-dialog`) kommen aus `components/shared/credentials/` — dieselben wie im
  Cockpit. Das Portal bindet nur Endpunkte, Texte und Projekte an (`portal-credential-form-dialog`). Feldregeln und
  Request-Bau laufen über `credentialFormRequest`.
- Der Formular-Dialog nennt über den Feldern, wer die Werte lesen kann (`form.notice`). Beim Ändern gibt es keine
  Projektwahl.
- Fehlertexte nur über `portalCredentialErrorText` (`common/patterns/portal/`).

## Stunden (ab Task 73)

Plan: `apps/workspace/plans/crm/20-stunden-und-history/73-stunden-im-portal.md`.

- **Keine eigene Seite.** Stunden sind ein Dialog des Dashboards (`?widget=hours`), wie die Zugangsdaten. Das
  Widget `hours` steht mit `requiredPermission: portal.hours.read` und `onlyWithContent` in
  `PORTAL_WIDGET_LAYOUT`: Ohne Recht und ohne Kauf- oder Zeitbuchung gibt es weder Karte noch Dialog.
- Komponenten liegen unter `hours/`; Orchestrator ist `hours/portal-hours-dialog` mit `portal-hours-summary`
  (Stand gesamt und je Projekt), `portal-hours-purchases` (Kaufhistorie) und `portal-time-entry-list`
  (Buchungen). Die Karte ist `dashboard/widgets/portal-hours-widget`.
- **Stand und Kaufhistorie kommen mit dem Dashboard** (`PortalHoursDto` als Prop), **die Buchungen erst beim
  Öffnen** über `usePortalTimeEntries` (`src/hooks/portal/`) und `portalHoursApiService`. Die Liste wird nur
  mit `canReadEntries` gemountet; ohne das Recht fehlt der Abschnitt vollständig, ohne Hinweis und ohne Request.
- **Nachladen** läuft über den geteilten `useCursorPagedList` (`src/hooks/shared/`), denselben wie im Cockpit.
  „Weitere laden“ meldet das Ergebnis in einer Live-Region.
- **Projektfilter ist URL-State:** `?hoursProject=<id>`, geschrieben über `history.replaceState` (kein
  Server-Roundtrip). Eine ID, die nicht in `hours.projects` steht, zählt als kein Filter. Schließen entfernt den
  Parameter zusammen mit `widget`.
- **Überziehung ist immer Text**, nie nur Farbe: „1:00 über dem Kontingent“ bzw. „Dieses Projekt hat 1:00 mehr
  verbraucht als zugewiesen.“ Sachlich, ohne Warnton und ohne Handlungsaufforderung. Der Balken im Widget ist ein
  natives `<progress aria-hidden>` (kein Inline-Style) und wiederholt nur, was daneben als Text steht.
- **Zwei Empty-States in der Buchungsliste:** noch nichts gebucht und kein Treffer im Projektfilter.
- Zahlen über `formatDuration`, `tabular-nums`, rechtsbündig. Die Projekttabelle hat `<th scope>` und wird
  unter 40rem eigener Breite (Container Query) zur gestapelten Liste. Beschreibungen, Notizen und Aufgabentitel
  werden nur als Text gerendert.
- Keine Schreibaktion, deshalb auch kein Owner-Hinweis.

## Leistungsanfragen (ab Task 76)

Plan: `apps/workspace/plans/crm/13c-portal-leistungsanfragen/76-portal-leistungsanfragen.md`.

- **Keine eigene Seite.** Leistungsanfragen sind ein Dialog des Dashboards (`?widget=serviceRequest`). Das Widget
  `serviceRequest` steht mit `requiredPermission: portal.services.read` und ohne `onlyWithContent` in
  `PORTAL_WIDGET_LAYOUT`: Mit Leserecht ist es immer da, ohne fehlen Karte und Dialog.
- **Es gibt kein Mock-Widget mehr.** `portal-mock-widget`, `portal-mock-dialog-content` und `portal-mock-preview`
  sind entfernt. Ein künftiger Platzhalter bringt seine Bausteine wieder mit, statt eine echte Karte zu imitieren.
- Komponenten liegen unter `service-requests/`; Orchestrator ist `service-requests/portal-service-request-dialog`
  mit `portal-service-picker` (Auswahl), `portal-service-request-form` (eine Anfrage) und
  `portal-service-request-list` (eigene Anfragen). Die Karte ist `dashboard/widgets/portal-service-request-widget`.
- **Katalog, Projekte und Anfragen kommen mit dem Dashboard** (`PortalServicesDto` als Prop). Senden und
  Zurückziehen laufen über `portalServiceRequestsApiService`; danach lädt das Dashboard neu (`router.refresh()`).
- **Zwei Reiter, nie zwei Dialoge.** „Anfragen“ zeigt nacheinander Auswahl, Formular und Bestätigung; „Meine
  Anfragen (n)“ die Liste. Zurückziehen ersetzt den Dialog durch die Rückfrage (`ConfirmDialog`).
- **Die gewählte Leistung ist URL-State:** `?service=<id>` bzw. `custom` (`PORTAL_SERVICE_REQUEST_CUSTOM`),
  geschrieben über `history.replaceState`. So öffnet ein Link direkt das Formular; eine ID, die nicht mehr
  angeboten wird, fällt mit Hinweis auf die Auswahl zurück. Schließen entfernt den Parameter zusammen mit
  `widget`. Vorbelegt wird das Projekt, das das Dashboard gerade zeigt (`?project`).
- **Was das Formular fragt, entscheidet `portalServiceRequestForm`** (`common/patterns/portal/`): Projektfrage
  (`projectQuestion`, auf Basis von `listPortalServiceProjectWishes`), Vorbelegung, Prüfung und Request-Bau. Keine
  Komponente entscheidet selbst, ob nach dem Projekt gefragt wird: Bei genau einer möglichen Antwort steht sie als
  Text da. Stunden werden in ganzen Stunden gewählt (Zahlenfeld plus Schnellwahl
  `PORTAL_SERVICE_REQUEST_QUICK_HOURS`).
- **Nie ein Preis.** Karten zeigen Titel und Kundentext, die Liste Titel, Datum, Projekt und Status. Kundentext und
  Ablehnungsgrund werden nur als Text gerendert.
- **Status ist immer Text mit Symbol**, über den geteilten `ServiceRequestStatusBadge`
  (`components/shared/service-requests/`, derselbe wie im CRM). Die Wörter kommen aus dem Portal-Dictionary:
  „Eingegangen“, „Angebot unterwegs“, „Bestätigt“, „Abgelehnt“, „Zurückgezogen“.
- **Drei unterscheidbare Empty-States:** nichts freigegeben (Erklärung plus „Etwas anderes“), noch nichts
  angefragt, und die Owner-Sicht bzw. ein Leser ohne `portal.services.request` (Hinweis, Sende-Button deaktiviert).
- „Zurückziehen“ erscheint nur mit `canWithdraw` aus dem DTO.
- **Offene Anfragen bleiben vollständig erreichbar.** Nur die abgeschlossene Historie ist auf
  `PortalServiceRequestLimits.HistoryShown` begrenzt; Widget-Zähler und Hinweistext beziehen sich entsprechend auf
  offene Anfragen bzw. abgeschlossene Historie. Der Anfrage-Button im Owner-Widget ist deaktiviert und verweist ins CRM.
- Der `idempotencyKey` entsteht einmal je Formular; der Dialog mountet das Formular je Auswahl neu (`key`).
- **Während des Sendens sind Auswahlwechsel, Tabs und Schließen gesperrt.** Der Pending-State liegt im Dialog.
  Nach einer Ablehnung wird entsperrt; Wiederholen im selben Formular verwendet denselben Schlüssel. Antworten eines
  durch externe Navigation unmounteten Formulars lösen weder Bestätigung noch Dashboard-Navigation aus.
- **Feedback-Seite:** Bei erschöpftem Kontingent verlinkt `FeedbackQuotaNotice` über `requestHref` auf
  `?widget=serviceRequest&service=<id>&project=<projektId>`, wenn `findPortalExtraRoundService` für dieses Projekt
  eine Zusatzrunde findet; sonst bleibt der Chat-Link. Die Seite lädt den Katalog nur in diesem Zustand.
- Texte liegen in `dictionaries/portal/service-requests/`, die der Karte in `dashboard` unter
  `widgets.serviceRequest`.
