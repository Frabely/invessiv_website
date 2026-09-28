# Task 53 — Drop-Zone und interne Datei-UI

> **Status:** gemerged · **Teil-PR:** 14.3 · **Branch:** `feat/crm-dateien-3-interne-ui`

## Gelieferter Scope

- **Drop-Zone als Paketbaustein:** `packages/ui/src/components/file-drop-zone/` mit Hook
  `packages/ui/src/hooks/use-file-drag-target.ts` (Drag-Zähler, Aktiv-Zustand, verschachtelte Drop-Ziele).
  Props `accept`, `multiple`, `disabled`, `onFilesSelected`, `label`, `hint`, `variant` (`large` | `compact`,
  `FileDropZoneVariant` in `packages/common/src/constants/ui/`). Verstecktes Input + Label (Tastatur, am Handy
  Galerie/Kamera), sichtbarer Fokusring, beide Themes, `prefers-reduced-motion`. Kennt weder Limits noch Upload.
- **Lead-Import umgestellt** (`multiple = false`); die bisherigen Dropzone-Styles und die ungenutzten
  `aria.dropzone*Id`-Dictionary-Keys sind entfernt. Bestehende Tests bleiben unverändert grün.
- **Kunden-Cockpit:** Abschnitt „Dateien & Links“ ersetzt die Mock-Karte „Dateien & Medien“ an derselben Stelle (Gruppe
  „Zusammenarbeit“). **Projektansicht:** reduzierter Abschnitt im Projekt-Canvas, fest auf das Projekt
  gesetzt, ohne Projektfilter und Projektspalte.
- **Werkzeugleiste:** Primäraktion „Datei hochladen“ im Abschnittskopf (funktioniert auch eingeklappt), kompakte
  Drop-Zone + „Link hinzufügen“, Suche, Filter Projekt / Art / Herkunft. Der ganze Abschnitt ist Drop-Ziel mit
  deutlichem Overlay.
- **Liste:** Typ-Symbol, Name + Notiz, Endung bzw. Domain, Projekt, Größe, Uploader, Datum, Sichtbarkeit als Symbol
  **und** Text. Aktionen: Vorschau, Download bzw. Öffnen (Links, `rel="noopener noreferrer"`, neuer Tab),
  Bearbeiten, Löschen mit Bestätigung, die den Namen nennt und bei freigegebenen Einträgen warnt.
  Pagination per „Weitere laden“ (25 je Seite).
- **Upload-Warteschlange** (`src/hooks/shared/use-upload-queue.ts`, portalfähig über `UploadQueueTransport`):
  Browser-Vorprüfung über `classifyUploadCandidate` inkl. Vorgangslimits (20 Dateien / 1 GB, je Datei
  abgelehnt statt ganzer Auswahl), höchstens 3 parallel, XHR mit Fortschritt, Abbrechen, Erneut versuchen,
  Ablehnungsgrund, Warnung beim Verlassen, Fortschritt über Live-Region. Gemeinsame Angaben je Vorgang (Projekt,
  Sichtbarkeit — vorbelegt **aus** —, Notiz), nach Start gesperrt. Ein Retry nach vorübergehendem
  Fehler bei `complete` setzt dort fort, statt die Bytes erneut zu senden; inhaltliche Ablehnungen sind final.
- **Link-Dialog:** Bezeichnung Pflicht, nur `https` (`validateFileLink`), WeTransfer-Hinweis, Projekt,
  Sichtbarkeit, Notiz. Der Server ruft die URL nie ab.
- **Bearbeiten:** Sichtbarkeit (nur interne Einträge; Kundenuploads zeigen den Grund), Notiz, Projektzuordnung inkl.
  „kundenweit“. Nur geänderte Felder werden gesendet (`fileEditRequest`), versioniert über `useVersionedMutation`;
  ein Konflikt übernimmt den aktuellen Stand und behält die Eingaben.
- **Lightbox:** Bilder (inkl. SVG nur als `<img>`, Schachbrett-Hintergrund), PDF (iframe), TXT/CSV bis 1 MB als
  Klartext (über die authentifizierte App-Route, nie als HTML), mp4/webm. Pfeiltasten blättern nur über darstellbare
  Dateien, Escape schließt, Fokus kehrt zum Auslöser zurück, mobil bildschirmfüllend.
- Alle Texte DE (Du-Form) und EN in `src/i18n/dictionaries/workspace/crm/files/`; alle API-Fehlercodes übersetzt.

## Architekturentscheidungen

- **Liste lädt clientseitig über die API** (`useCustomerFiles`). Filter und Paging rendern das schwere Cockpit
  dadurch nicht neu. Antworten sind an ihren Request-Schlüssel gebunden; eine späte Antwort auf einen alten Filter
  überschreibt nie die aktuelle Liste.
- **Filter-State in der URL** nur für Projekt, Art und Herkunft (`filesProject`, `filesKind`, `filesOrigin`), per
  `history.replaceState` ohne Server-Roundtrip. Die **Freitextsuche bleibt bewusst außerhalb der URL** (sie kann
  Namen enthalten; CRM-Regel „Query-Parameter tragen nur IDs und Modi“). Die Projektansicht synchronisiert nicht.
- **Rechte kommen von der Page** (`buildFilesViewModel`, `canOn` je Scope für `files.read` / `files.write` /
  `files.delete`). Der Client schlägt nur nach (`filesScopeRights`). Ohne Leserecht existiert der Bereich nicht;
  Schreibaktionen fehlen ohne Recht, sie sind nie deaktiviert. Projektrechte öffnen nie kundenweite Einträge.
- **Abschnittsübergreifende Aktualisierung** über einen `filesRevision`-Zähler im Cockpit statt Window-Events:
  Ein Upload im Projekt-Abschnitt lädt auch den Kundenabschnitt neu.
- Uploadernamen nur mit `members.read` (ohne E-Mail), sonst „Team“ bzw. „Kunde“.

## Bekannte Grenzen und nächste Schritte

- **Inline-Vorschau über den Proxy:** Weicht der bereinigte Anzeigename vom letzten Key-Segment ab, liefert der
  Server statt einer signierten Inline-URL die Download-Route (`attachment`). Bilder und Videos funktionieren
  weiterhin; eine PDF-Vorschau lädt dann herunter statt anzuzeigen. Nächster Schritt bei Bedarf: eigene
  Inline-Proxyroute mit `Content-Security-Policy: sandbox` für PDF.
- **Abgebrochene Uploads** hinterlassen `pending`-Zeilen, bis der Aufräumjob aus 20c läuft; sie belegen bis dahin
  Plätze im Limit offener Uploads (20 je Mitglied).
- **Nicht im Browser gegen einen echten Store geprüft:** Der direkte PUT aus dem Browser (CORS des privaten
  Vercel-Blob-Stores) und die Inline-Vorschau werden erst im Preview mit echtem Store abgenommen
  ([Vercel-Checkliste](./VERCEL-SETUP.md)). Kein Test kontaktiert einen echten Anbieter.
- E2E folgt laut README ab 14.5 (Portal). Ein manueller A11y-Smoke (Tastatur, Fokus, Dark/Light, 360 px) steht
  für das Review aus.

## Prüfung

- `pnpm -r lint` (nur die bestehende `no-img-element`-Warnung in `apps/web`), `pnpm -r typecheck`,
  `pnpm -r test` (Workspace: 2030 bestanden, 115 übersprungen), `pnpm --filter @invessiv/workspace build`: grün.
- Neue Tests: Drop-Zone (Label, Mehrfach/Einzel, Drag-Zustand, deaktiviert), Upload-Warteschlange (Vorprüfung,
  max. 3 parallel, Retry ab Finalisierung, finale Ablehnung, Abbruch, Verlassen-Warnung), Dateiabschnitt (Liste, Rechte
  je Scope, Read-only, URL-Filter ohne Suche, Projektfixierung, Empty-States, Fehler + Retry,
  Vorschau), Lightbox (Blättern, Klartext, Escape, Fehler → Download), Upload-Dialog, Rechte-Modell,
  Filter-/Edit-/Scope-Patterns, geteilte Helfer in `packages/common`.

## Rollback

Einbindung im Cockpit und in der Projektansicht zurücknehmen (bzw. Revert); vorhandene Dateien bleiben erhalten.
Der Lead-Import funktioniert mit der Paket-Drop-Zone unabhängig davon.
