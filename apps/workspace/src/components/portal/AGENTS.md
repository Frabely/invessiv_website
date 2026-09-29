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
- **Mock-Widgets** tragen das Badge „Bald verfügbar“ (`mock`-Prop am `Widget`) und zeigen **keine erfundenen Werte** —
  nur Skeleton-/Illustrationsinhalt und eine Beschreibung, was dort entstehen wird.
- **Öffnen nur über explizite Buttons** (`Widget`-`openMode`). Dialoge hängen am URL-Parameter `?widget=<key>`,
  Projekt-Tabs an `?project=<id>` (`portal-dashboard-query.ts`); Schließen entfernt den Parameter.
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
