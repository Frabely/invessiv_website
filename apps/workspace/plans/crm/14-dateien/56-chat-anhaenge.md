# Task 56 — Anhänge in beiden Chats

> **Status:** gemerged · **Teil-PR:** 14.6 · **Branch:** `feat/crm-dateien-6-chat-anhaenge`

## Ziel

Im Composer beider Chats (CRM-Cockpit, CRM-Inbox, Portal-Nachrichten, Portal-Dock) hängt 📎 Dateien und Links an eine
Nachricht: „Neue Datei hochladen“ oder „Vorhandene Datei wählen“. Anhänge sind Verweise auf Zeilen in `files`, keine
Kopien. Intern wird ein noch nicht freigegebener Anhang beim Senden für den Kunden freigegeben — erst nach sichtbarem
Hinweis und nur mit Schreibrecht auf die Datei.

## Datenmodell

Migration (Nummer im Repo ermitteln), additiv und idempotent:

```txt
messages  + UNIQUE (id, customer_id)          Ziel des zusammengesetzten FK
files     + UNIQUE (id, customer_id)          Ziel des zusammengesetzten FK

message_files
  id           uuid PK                        vom Schreibpfad erzeugt
  message_id   uuid NOT NULL
  file_id      uuid NOT NULL
  customer_id  uuid NOT NULL
  position     smallint NOT NULL CHECK (position >= 0 AND position < MESSAGE_ATTACHMENTS_MAX)
  created_at   timestamptz NOT NULL DEFAULT now()
  FK (message_id, customer_id) → messages (id, customer_id) ON DELETE CASCADE
  FK (file_id, customer_id)    → files (id, customer_id)    ON DELETE CASCADE
  UNIQUE (message_id, file_id), UNIQUE (message_id, position), INDEX (file_id)
```

- Die zusammengesetzten FKs machen einen Anhang eines fremden Kunden in der Datenbank unmöglich.
- Keine `version`: Nachrichten und ihre Anhänge sind unveränderlich.
- Löscht das Team eine Datei (`files.delete`), verschwindet die Zuordnung mit ihr; die Nachricht bleibt.

## Getroffene Entscheidungen (Lücken der README)

| Frage                     | Entscheidung                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Nachricht nur mit Anhang  | Erlaubt. `body` ist dann `""`; Text oder mindestens ein Anhang ist Pflicht                                                                    |
| Anhänge je Nachricht      | Höchstens 10 (`MESSAGE_ATTACHMENTS_MAX`), keine Dopplung                                                                                      |
| Freigabe beim Senden      | Server verlangt `releaseHiddenAttachments: true`, sobald ein angehängter Eintrag noch intern ist; sonst `ATTACHMENT_RELEASE_REQUIRED` (409)   |
| Recht für die Freigabe    | `files.write` am Scope der Datei (`canOn` mit Projekt); ohne → 404 wie unsichtbar                                                             |
| Nicht teilbare Einträge   | `pending`, verwaist oder in einem Projekt außerhalb von `PORTAL_VISIBLE_PROJECT_STATUS_VALUES` → `ATTACHMENT_UNAVAILABLE` (422), auch intern  |
| Upload aus dem Chat       | Kundenweit (ohne Projekt), ohne Notiz. Intern zunächst intern, Freigabe beim Senden; Portal als eigener Upload („Von dir“)                    |
| „Vorhandene Datei wählen“ | Intern alle lesbaren fertigen Einträge des Kunden (mit Suche); Portal alle sichtbaren (beide Herkünfte). Links sind wählbar                   |
| Anzeige                   | Chips unter dem Text: Typ-Symbol, Name; Upload → Download, Link → neuer Tab (`noopener noreferrer`). Keine Lightbox im Chat                   |
| Nicht mehr verfügbar      | Portal: Freigabe entzogen, Projekt versteckt, verwaist → Chip „Nicht mehr verfügbar“ **ohne Namen**. Intern analog ohne `files.read` am Scope |
| Datei gelöscht            | Zuordnung weg; eine Nachricht ohne Text und ohne verbleibende Anhänge zeigt „Anhang nicht mehr verfügbar“                                     |
| Ausgeblendete Nachricht   | Liefert auch keine Anhänge mehr                                                                                                               |
| Wiederholtes Senden       | Idempotent über `clientMessageId`; ein Retry gilt nur mit gleichem Text **und** gleicher Anhangsliste als dasselbe Senden                     |
| Rechte im Client          | Server liefert `attachmentAccess { pick, upload }` im Conversation-DTO; Owner-Sicht im Portal nie                                             |

## Rechte

- **Portal:** Senden mit Anhang braucht `portal.messages.write` und `portal.files.read`; jede ID muss
  `portalFileService.visibleCondition` erfüllen, sonst 404. Upload braucht zusätzlich `portal.files.write`.
- **Intern:** Senden braucht `chat.write`; jede ID muss über `fileAccessService` mit `files.read` lesbar sein, sonst 404.
  Interne Einträge brauchen zusätzlich `files.write` am Scope und die Bestätigung. Upload braucht `files.write` am
  Kunden.
- Anhänge eines anderen Kunden sind 404 (Handler) und zusätzlich per FK unmöglich.

## Server

- `server/shared/services/message/message-attachment-service.ts`: Anhänge speichern (Position = Reihenfolge) und für
  eine Seite laden. Die Verfügbarkeit bestimmt eine Sichtbarkeitsbedingung (`SQL`), die der Handler übergibt (Portal:
  `visibleCondition`, intern: `fileAccessService.condition` + `ready` + nicht verwaist).
- `messageService.appendTextMessage` nimmt die bereits geprüften Anhänge entgegen und schreibt sie in derselben
  Transaktion; `findMatchingTextMessage` vergleicht zusätzlich die Anhangsliste.
- `getMessagePage` lädt die Anhänge der Seite mit einer Abfrage und mappt sie je Betrachter.
- Freigabe intern über `updateVersioned` auf der gesperrten Zeile plus `fileActivityService.recordChanges`
  (`visible_to_customer`).
- Portal-Liste `GET files`: `origin` wird optional (ohne → beide Herkünfte) für die Auswahl im Chat.

## UI

- `MessageComposer` (`packages/ui`): optionaler Anhangsbereich (Chips mit Entfernen), Slot für den 📎-Auslöser,
  Senden auch ohne Text, sobald Anhänge da sind.
- `MessageBubble`: Anhang-Chips über ein neues `MessageAttachmentChip`; „Nicht mehr verfügbar“ ohne Namen.
- App: `ChatAttachmentMenu` (📎-Menü), `ChatAttachmentUploadDialog` (geteiltes `useUploadQueue` +
  `FileUploadDialogFrame`), `ChatFilePickerDialog` (Liste mit Auswahl, Suche intern). Zustand der ausgewählten Anhänge
  und der Freigabe-Hinweis im geteilten `useConversationThread`; CRM zeigt vor dem Senden eines internen Anhangs den
  Bestätigungsdialog „Diese Datei wird für den Kunden freigegeben“.
- Ausstehende Nachrichten merken sich Anhänge (ID, Name, Art) im lokalen Speicher, nie URLs.
- Inbox-Vorschau: Nachricht ohne Text zeigt „Anhang“.
- Texte in `dictionaries/workspace/crm/messages` und `dictionaries/portal/messages`, DE/EN, Portal in Du-Form.

## Tests

- Integration (`crm-integration`): Portal — sichtbarer Anhang ok; interne, fremde, `pending`, verwaiste, versteckte
  Projekt-ID → 404; Owner-Sicht sendet nie. Intern — fremder Kunde → 404; interner Anhang ohne Bestätigung → 409 ohne
  Freigabe; mit Bestätigung → sichtbar + genau eine Activity; ohne `files.write` am Projekt → 404; archiviertes Projekt
  → 422. Retry mit gleicher Liste → dieselbe Nachricht, mit anderer → Konflikt. Entzogene Freigabe → Portal-Seite
  liefert
  „nicht verfügbar“ ohne Namen. Datei löschen entfernt die Zuordnung.
- Unit: Eingabeschema, Mapping, gespeicherte ausstehende Nachrichten, Routen-Fehlerabbildung.
- Komponenten: Composer (Chips, Senden ohne Text), Bubble (Chips, nicht verfügbar), Bestätigungshinweis im CRM,
  Portal ohne Hinweis.

## Rollback

Composer-Button entfernen (bzw. `attachmentAccess` nie setzen); bestehende `message_files` bleiben lesbar.

## Umsetzungsnotizen

- Migration `0043_create_message_files.sql`: `UNIQUE (id, customer_id)` an `messages` und `files` als Ziel der
  zusammengesetzten FKs, dazu `message_files`. Additiv und idempotent; auf Development angewendet.
- `SendMessageInput` ist die Request-Form (`z.input`): `attachmentFileIds` und `releaseHiddenAttachments` sind optional,
  ein reiner Textversand bleibt `{ body, clientMessageId }`. Die Route validiert, normalisiert IDs auf Kleinschreibung
  und reicht `SendMessageData` (`z.output`, Defaults gesetzt) an die Handler weiter.
- Intern wird ein Retry vor der Anhangsprüfung erkannt; eine inzwischen nicht mehr teilbare Datei macht aus einem
  zugestellten Senden keinen Fehler. Die Prüfung sperrt die Einträge und liest „teilbar“ in derselben Abfrage.
- CRM-Liste `GET files` nimmt `shareable=true` an und filtert dann über
  `customerFileVisibilityService.openableCondition`; die Chat-Auswahl nutzt das, archivierte Projekte erscheinen dort
  nicht. `list-customer-files` nutzt `fileAccessService.readableCondition`.
- `upload` in `attachmentAccess` setzt `pick` voraus, weil jedes Senden die Leseberechtigung prüft.
- Der Chat-Upload ist auf die freien Anhangsplätze begrenzt (`useUploadQueue`-Option `maxFiles`,
  `uploadQueuePlan.planSelection`); überzählige Dateien zeigen den Limit-Text statt still verworfen zu werden.
- Upload-Transport beider Seiten über `fileApiTransportService.uploadQueueTransport`.
- `messageService.appendTextMessage` liefert `{ message, created }`; die interne Freigabe läuft nur bei `created`.
- Portal-Liste `GET files` ohne `origin` liefert beide Herkünfte (Dateiauswahl im Chat); der Client übergibt `null`.
- UI im Paket: `AttachmentChip` (eine Chip-Basis für Composer und Nachricht, Aktionen über `ButtonControl`/
  `ButtonLink`), `MessageAttachmentList`, Composer mit Anhangsbereich (`composerAttachments`), Bubble zeigt
  „Anhang nicht mehr verfügbar“ für leere Nachrichten ohne verbliebene Anhänge. In der App:
  `components/shared/chat-attachments/` (📎-Menü, Auswahl über `usePagedFiles`, Upload über `useUploadQueue`), die
  seitenabhängige Datei-API in `useCrmChatAttachmentApi` bzw. `usePortalChatAttachmentApi`. Die vier Einbindungen
  (Cockpit, Inbox, Portal-Nachrichten, Portal-Dock) bekommen das Datei-Dictionary als `filesContent`.
- Ausstehende Nachrichten speichern Anhänge (ID, Name, Art, Freigabe-Flag) lokal; ältere Einträge ohne Anhänge werden
  weiter gelesen.
- `db:smoke:crm` (Workspace) umfasst jetzt auch `tests/portal/files` und die neue Anhangs-Integration.

## Prüfung

- `pnpm -r lint` (nur die bestehende `no-img-element`-Warnung in `apps/web`), `pnpm -r typecheck`, `pnpm -r test`
  (Workspace: 2111 bestanden, 132 übersprungen), `pnpm --filter @invessiv/workspace build`: grün.
- `pnpm db:smoke:crm`: 108 Constraint-Checks (u. a. fehlende Position, fremder Kunde, Positionslimit) und 107
  Integrationstests grün, darunter die Anhangsfälle aus „Tests“ und der interne Retry nach entzogener Teilbarkeit.

## Offen vor dem Merge

- Manuelle Abnahme im Preview: 📎 in Cockpit, Inbox, Portal-Nachrichten und Portal-Dock; Upload aus dem Chat mit
  echtem Store; Tastatur/Fokus im Menü und in den Dialogen; Dark/Light; 360 px.
- Der nachträgliche Browser-Test in `e2e/portal-files.e2e.ts` prüft das Anhängen eines internen Links, den
  Bestätigungsdialog, Abbrechen ohne Sendeanfrage, bestätigtes Senden und die Sichtbarkeit im Kundenportal.
- Review durch das andere Modell (README).
