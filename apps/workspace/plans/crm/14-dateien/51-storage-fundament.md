# Task 51 — Storage-Fundament

> **Status:** im Review · **Teil-PR:** 14.1 · **Branch:** `feat/crm-dateien-1-fundament`

## Gelieferter Scope

- `packages/storage`: anbieterneutraler Contract in `packages/common`, private Vercel-Implementierung,
  explizite Factory und separater In-Memory-Testzugang. Keine DB und keine Kunden-/Portalautorisierung im Paket.
- `packages/common/src/constants/files/`: alle 19 erlaubten Endungen mit serverseitigem MIME-Typ,
  dezimalen Größenlimits (MB = 1.000.000 Bytes), Sammellimits und URL-Laufzeiten.
- Browserfähige Vorprüfung, UTF-8-/Magic-Byte-Prüfung, sichere NFC-Dateinamen und Storage-Key-Bau,
  reine HTTPS-Linkvalidierung ohne Netzwerkzugriff.
- `apps/workspace/src/server/shared/files/`: Metadaten- und Inhaltsprüfung, vollständige SVG-XML-Prüfung,
  Office-Central-Directory-Prüfung und austauschbarer No-op-Scanner (`unscanned`).
- Keine sichtbare UI, Endpunkte, Migration oder Tabellenänderung in dieser Einheit.

## Bestätigte Architekturausnahme

Der Nutzer hat am 28.09.2026 ausdrücklich bestätigt, die Services unter
`apps/workspace/src/server/shared/files/` bereits mit Task 51 anzulegen. Das ist eine befristete Ausnahme von
`apps/workspace/src/server/shared/AGENTS.md` („Erst bei echter Zweitnutzung“) und der entsprechenden Service-Regel
in `src/server/AGENTS.md`. Risiko: bis zum Anschluss können Contracts noch Anpassungen benötigen.
Nächster Schritt: Task 52 bindet die Workspace-Handler an; Task 55 nutzt dieselben Prüfungen im Portal.

## Vercel-Spike und Sicherheitsgrenzen

Die tatsächlich installierte und typgeprüfte SDK-Version ist `@vercel/blob` 2.8.0. Nur
`packages/storage/src/adapters/vercel-blob-storage.ts` importiert das SDK im Produktivcode.
`issueSignedToken` wird je Adapterinstanz einschließlich paralleler Anfragen gecacht, bei Ablauf erneuert;
die App hält die Instanz lazy. Ohne Konfiguration startet die App weiterhin, der erste Storage-Aufruf schlägt
typisiert fehl. Der In-Memory-Adapter wird niemals über eine Environment-Variable ausgewählt.

`presignUrl` unterstützt `access: private`, PUT-Constraints und `useCache: false` für GET. PUT erlaubt
kein Überschreiben; dies verhindert den Austausch eines bereits geprüften Objekts mit einem noch gültigen Ticket.
Upload-URLs gelten höchstens zehn Minuten, Downloads höchstens fünf Minuten. Tokenmaterial, Providerfehler und
signierte URLs werden nicht geloggt. Providerfehler werden in neutrale `StorageError`-Codes übersetzt.

Der GET-Contract des SDK bietet **keinen freien Content-Disposition-/Dateinamen-Override**. Normale Downloads
verwenden `getDownloadUrl` und den letzten Key-Abschnitt als Namen. Ein abweichender Name sowie SVG als Attachment
liefern `STORAGE_PROXY_REQUIRED`. Task 52 muss dafür die authentifizierte Downloadroute mit
`Content-Disposition: attachment`, `Content-Security-Policy: sandbox`, `Cache-Control: private, no-store`
und sicherem Content-Type ergänzen. SVG-Vorschau ausschließlich als Bild.
Ein frei signierter Inline-GET garantiert keine Vorschaufähigkeit eines beim Anbieter als Attachment behandelten
MIME-Typs; die UI aus Task 53 berücksichtigt die Formatliste der README.

Quellen: [Vercel SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk),
[signierte URLs](https://vercel.com/changelog/signed-urls-are-now-available-for-vercel-blob),
[konsistente private Reads](https://vercel.com/changelog/vercel-blob-now-supports-consistent-reads-on-private-storage).
SDK-Vertrag und Verhalten sind mit Mocks geprüft; kein Live-Store wurde kontaktiert. Die reale CDN-Abnahme bleibt
Teil der Preview-Checkliste vor 14.2.

## Dateiprüfung und Grenzen

- Metadaten: Existenz, angekündigte Größe, Endungslimit und exakt serverseitig bestimmter Content-Type.
- Binärformate: erste 64 KiB, einschließlich formatspezifischer BMFF-Brands.
- TXT/CSV: gesamter Stream mit fatalem UTF-8-Decoder; NUL wird auch hinter den ersten 64 KiB abgelehnt.
- SVG: gesamtes Dokument, striktes XML über `saxes` (bereits transitiv vorhanden, jetzt direkte Serverabhängigkeit).
  Verboten sind DTD/Entities, Skripte, Events, fremde Namespaces, externe Referenzen, Stylesheet-Processing-
  Instructions, CSS-Imports/Escapes und Animationen, die Attribute nachträglich verändern könnten.
  Lokale Fragmentverweise und einfache sichere Styles bleiben erlaubt. Keine Netzwerkauflösung.
- Office: EOCD vom Dateiende, vollständiges Central Directory, erforderlicher Hauptteil und
  `[Content_Types].xml`, keine Makrodatei `vbaProject.bin`, keine verschlüsselten oder mehrteiligen Archive,
  doppelten Namen oder Traversal-Pfade. ZIP64 und Verzeichnisse über 4 MB/10.000 Einträgen werden abgelehnt.
  Es wird nichts entpackt. Dies ist eine Formatprüfung, kein Malware-Scan.

Die Validierung liefert typisierte Fachfehler, verändert jedoch keine DB-Zeilen und löscht keine Objekte.
Task 52 orchestriert bei ungültigen Inhalten zuerst die Objektlöschung und danach die Pending-Zeile.
Temporäre Storagefehler werden als Fehler weitergereicht und dürfen nicht zu `ready` führen.
Pending-Limits, Idempotenz, Activities, Autorisierung und Aufräumjob liegen bei ihren Folge-Tasks.

## Prüfung und Übergabe

- Gemeinsamer Adaptervertrag gegen In-Memory und gemocktes Vercel.
- Negativtests für Limits, Metadaten, Dateisignaturen, SVG, Office, Range-Antworten, Konfiguration und Tokenfehler.
- `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` und
  `pnpm --filter @invessiv/workspace build` erfolgreich.
- 2.809 Tests erfolgreich, 87 bestehende Workspace-Integrationstests übersprungen;
  davon 63 Tests für dieses Fundament. Die übersprungenen Tests benötigen ihre gesonderten DB-Modi.
- Bestehende Warnung: `no-img-element` in einem Marketing-Test; keine Lintfehler.
- Kein DB-Smoke erforderlich: keine Änderung an DB oder Persistenz.
- Kein E2E/A11y-Smoke erforderlich: keine neue sichtbare Route und kein neuer interaktiver Ablauf.
- Vor Merge Review durch das andere Modell gemäß Ordner-README; kein automatischer Commit/Merge.

## Betrieb und Rollback

Neue serverseitige Variablen stehen in beiden `.env.example`: `STORAGE_PROVIDER`, `BLOB_STORE_ID`,
`BLOB_READ_WRITE_TOKEN`; `VERCEL_OIDC_TOKEN` wird auf Vercel zur Laufzeit gesetzt. Deployment-Konfiguration ist
gemäß `VERCEL-SETUP.md` vor 14.2 zu ergänzen; in diesem Task wurden keine entfernten Einstellungen verändert.
Kein Upload-Callback und damit aktuell kein `BLOB_WEBHOOK_PUBLIC_KEY` nötig.
Rollback durch Revert der Einheit; keine Datenmigration und keine Löschung vorhandener Blobs.
