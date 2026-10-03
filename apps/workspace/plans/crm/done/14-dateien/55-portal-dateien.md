# Task 55 — Dateien im Kundenportal

> **Status:** gemerged · **Teil-PR:** 14.5 · **Branch:** `feat/crm-dateien-5-portal`

## Ziel

Der Kunde sieht unter `/portal/[customerId]/files`, was wir freigegeben haben („Von uns“), und seine eigenen Uploads
und Links („Von dir“). Er lädt einzeln oder als ZIP herunter, sieht Bilder, PDFs, Text und Videos in der Lightbox,
lädt vom Handy Fotos, Videos, Logos und Dokumente hoch oder hinterlegt einen Link. Er löscht und bearbeitet nichts.
Das Dashboard-Widget „Dateien“ zeigt echte Daten statt Mock.

## Rechte und Sichtbarkeit

- Neue Portal-Permissions `portal.files.read` (Liste, Vorschau, Download, ZIP) und `portal.files.write` (eigene
  Uploads und Links). Migration ergänzt Katalog und `portal_standard` additiv und idempotent. `portal.files.read`
  kommt in `PORTAL_READ_PERMISSION_VALUES` (Owner-Sicht liest mit), `portal.files.write` nie.
- **Eine Portal-Datei ist sichtbar**, wenn `customer_id` = Kunde des Readers, `visible_to_customer`,
  `status = 'ready'`, `orphaned_at IS NULL` und das Projekt entweder fehlt oder in
  `PORTAL_VISIBLE_PROJECT_STATUS_VALUES` liegt (wie bei Aufgaben: archivierte/abgebrochene Projekte bleiben intern,
  auch per ID). Die Bedingung steht genau einmal in `portalFileAccessService.visibleCondition` und wird von Liste,
  Download-URL, Download-Proxy und ZIP benutzt.
- Fremde, interne, `pending`- oder verwaiste IDs antworten 404 — ununterscheidbar von nicht existierenden.
- Projektnamen erscheinen nur mit `portal.projects.read`. Upload-/Link-Ziele: „Allgemein“ (kein Projekt) oder ein
  sichtbares Projekt, nur mit `portal.projects.read`; alles andere → 404.
- Kundenuploads: `uploaded_by_side = 'customer'`, `uploaded_by_portal_membership_id = actor.membershipId`,
  `visible_to_customer = true`. `complete` nur durch dieselbe Mitgliedschaft. Offene Uploads je Mitgliedschaft
  höchstens 20 (Mitgliedschaftszeile wird gesperrt, wie die Mitgliedszeile intern).
- Activities mit `ActorType.Customer` und `users.id`, ohne Name, Dateiname, URL oder Key.

## Endpunkte (`/api/portal/[customerId]/files/…`)

| Methode + Pfad                    | Guard                                    | Zweck                                                                  |
| --------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- |
| `GET files`                       | `withPortalReader` + `portal.files.read` | Seite je Reiter (`origin=fromUs\|fromYou`), 25 je Seite                |
| `GET files/[fileId]/download-url` | `withPortalReader` + `portal.files.read` | Kurzlebige URL `inline`/`attachment`, sonst Proxy-Route                |
| `GET files/[fileId]/download`     | `withPortalReader` + `portal.files.read` | Authentifizierter Stream (Text-Vorschau, Proxy-Fallback)               |
| `POST files/archive`              | `withPortalReader` + `portal.files.read` | ZIP nur aus sichtbaren Dateien                                         |
| `POST files/uploads`              | `withPortalActor` + `portal.files.write` | `pending`-Zeile + presigned PUT                                        |
| `POST files/[fileId]/complete`    | `withPortalActor` + `portal.files.write` | Prüfen → `ready`, Activity `file_uploaded`                             |
| `POST files/[fileId]/cancel`      | `withPortalActor` + `portal.files.write` | Eigenes offenes Upload-Ticket entfernen, kein Löschen fertiger Dateien |
| `POST files/links`                | `withPortalActor` + `portal.files.write` | Eigener Link                                                           |

Kein `PATCH`, kein `DELETE`. Alle Antworten `Cache-Control: private, no-store`, `nosniff`.

## Geteilte Server-Bausteine (`src/server/shared/files/`)

Echte Zweitnutzung durch das Portal zieht aus dem internen CRM-Pfad hierher:

- `file-archive-service.ts` (bisher `workspace/crm/services/files/file-archive-stream.ts`).
- `file-upload-service.ts`: Ticket signieren + `pending`-Zeile, Finalisierung (Prüfung → `ready` über
  `updateVersioned`), Entfernen mit `orphaned_at`-Fallback. Autorisierung und Uploader-Zuordnung bleiben in den
  getrennten Handlern.
- `file-api-response.ts` wandert von `lib/workspace/crm/` nach `lib/files/`, weil beide Routenwelten ihn nutzen.

## UI

- App-neutral nach `packages/ui`: `FileKindIcon`, `UploadQueueRow`, `FileLightbox` (Texte per Props, Laden per
  Callback). Das CRM nutzt dieselben Bausteine; seine Tests bleiben grün.
- Auswahl-Hook wird zu `hooks/shared/use-file-selection.ts` (URL-State, an die Kunden-ID gebunden).
- Portalseite (noindex, force-dynamic): Kopf mit Einleitung, große Upload-Fläche (mobile-first, Kamera/Galerie),
  „Link hinzufügen“, Reiter „Von uns“ / „Von dir“ (`?tab=`), Liste mit Typ-Symbol, Name, Notiz, Art bzw. Domain,
  Projekt, Größe, Datum; Aktionen Vorschau, Download bzw. Öffnen, Auswahl für ZIP. Empty-States je Reiter erklären
  den Zweck. Owner-Sicht: keine Upload-Fläche, stattdessen Owner-Hinweis mit CRM-Link.
- Upload-Dialog: Warteschlange (geteiltes `useUploadQueue` mit Portal-Transport), Projekt („Allgemein“ vorbelegt),
  optionale Notiz. Link-Dialog: Bezeichnung, `https`-Link, WeTransfer-Hinweis, Projekt, Notiz.
- Dashboard-Widget `files`: echte Zahlen je Herkunft und die drei neuesten Einträge je Reiter, Link zur Seite.
- Navigation „Dateien“ in `PORTAL_NAV_ITEMS` mit `portal.files.read`.
- Texte in `src/i18n/dictionaries/portal/files/{de,en}.json`, Du-Form.

## Tests

- Unit: Mapping, Schemas, Routen (Auth-Status, Permission, Validierung, Cache-Header), Dictionary-Parität.
- Integration (`db:smoke:crm`): fremder Kunde, interne Datei, `pending`, verwaist, verstecktes Projekt → 404;
  Upload-/Link-Ziel fremdes oder verstecktes Projekt → 404; `complete` fremder Mitgliedschaft → 404; doppeltes
  `complete` → eine `ready`-Zeile, eine Activity; Pending-Limit; ZIP nur sichtbare IDs; Owner-Sicht liest, schreibt nie.
- Komponenten: Portalansicht (Reiter, Empty-States, Owner-Sicht, Auswahl), Widget, geteilte UI-Bausteine.
- E2E `e2e/portal-files.e2e.ts`: freigegebener Link erscheint, interner nicht (auch nicht per ID), Kundenlink
  erscheint intern unter „Vom Kunden“. Mit `E2E_LIVE_BLOB=true` wird zusätzlich ein echter Upload im privaten
  Development-Store samt Freigabe, Einzel- und ZIP-Download sowie Kunden-Upload geprüft. Die Preview-Abnahme bleibt
  separat
  ([Vercel-Checkliste](./VERCEL-SETUP.md)).

## Rollback

`portal.files.read`/`portal.files.write` aus `portal_standard` und eigenen Portalrollen nehmen; Navigation, Seite,
Endpunkte und Widget verschwinden bzw. antworten 404. Dateien und Blobs bleiben erhalten.

## Umsetzungsnotizen

- Migration `0042_add_portal_file_permissions.sql` (Katalog + `portal_standard`), additiv und idempotent.
- Zusätzlich zur Planung nach `packages/ui` gewandert: `FormDialog` (vorher `FileFormDialog` im CRM). Geteilt in der
  App: `usePagedFiles`, `useFileSelection` (`hooks/shared/`), `fileApiTransportService` (`client/shared/`),
  `browserDownload` (`lib/files/`), `FileApiPath`, Listen- und Archivkonstanten (`common/constants/files/`),
  `filePresentation.formatDate` und `MediaType.Zip` (`packages/common`).
- Die ZIP-Vorprüfung (`checkSelection`, `plan`) liegt jetzt im geteilten `fileArchiveService`; der CRM-Handler
  prüft nur noch Scope und Projektrechte selbst. Logpräfix für Datei-Routen: `[files]`.
- Das Dashboard lädt je Reiter die drei neuesten Einträge über `listPortalFiles`; ohne `portal.files.read` fehlt das
  Widget. Die Seite rendert den ersten Listenstand des Reiters aus `?tab` serverseitig.
- Abgebrochene und fehlgeschlagene Portal-Transfers geben ihr eigenes Pending-Ticket über `POST .../cancel` frei.
  Schlägt die Freigabe fehl, versucht die Warteschlange sie vor einem neuen Ticket erneut. Der Endpoint kann keine
  fertige Datei entfernen.

## Prüfung

- `pnpm -r typecheck`, `pnpm -r lint` (nur die bestehende `no-img-element`-Warnung in `apps/web`), `pnpm -r test`
  (Workspace: 2079 bestanden, 125 übersprungen), `pnpm --filter @invessiv/workspace build`: grün.
- `pnpm --filter @invessiv/workspace db:smoke:crm`: 100 Tests grün, darunter die neuen Portal-Integrationstests (fremder
  Kunde, interne,
  `pending`- und archivierte Projekteinträge, geratene IDs, fremde Mitgliedschaft bei `complete`, doppeltes
  `complete` → eine Activity, Pending-Limit, Owner-Sicht liest, verbotene Upload-/Link-Ziele, Link wird nie
  abgerufen, Abbruch nur eigener offener Uploads). Kein Test kontaktiert einen echten Anbieter.
- Nach der Review-Nachbesserung: Workspace-Typecheck und -Lint grün; 42 gezielte Unit-, Komponenten- und Routentests
  grün.
- Neue Unit-/Komponententests: Portal-Routen, Mapping, Seiten (Dashboard, Dateien), Portalansicht, Widget,
  Lightbox im Paket, Konstanten, Dictionary-Parität.

## Offen vor dem Merge

- Migration `0042` ist auf Development angewendet; Katalogabgleich und `db:smoke:rbac` vor Merge erneut prüfen.
- Portal-E2E auf der allowlist-geprüften Development-Datenbank mit Clerk-Testsitzungen ausgeführt: 8/8 grün.
  `e2e/portal-files.e2e.ts` prüft eine echte interne Datei-ID aus dem CRM gegen Manager- und Kundenportal sowie
  einen Kundenlink, der danach intern unter „Vom Kunden“ erscheint. Die Dashboard-Suite öffnet jetzt
  `?widget=onboarding` statt des entfallenen Datei-Dialogs.
- Manuelle Abnahme im Preview mit echtem privatem Store ([Vercel-Checkliste](./VERCEL-SETUP.md)): Kundenupload vom
  Handy (Kamera/Galerie), Vorschau, ZIP, Tastatur/Fokus, Dark/Light, 360 px.
- Seed: kein neues Schema, daher keine Seed-Erweiterung.
- Review durch das andere Modell (README).
