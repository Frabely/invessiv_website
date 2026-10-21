# Review: Portal-Dateivorschauen gegen master

Stand: 21.10.2026. Branch `feat/portal-file-thumbnails`, HEAD `24ade92f60fa73e3ca33650658643da68150d4c9`.
Verglichen mit lokalem `master` / Merge-Base `a9e65f301675f3a662826dab547a9e3b14a5439f`:
3 Commits, 62 geänderte Dateien. Beim Start war der Arbeitsbaum sauber. Remote-Refs wurden nicht aktualisiert.
Keine Codeänderungen, Migrationen, Backfills oder schreibenden Datenbanktests im Rahmen dieses Reviews.

**Gesamturteil:** Vor dem Merge nacharbeiten. Zwei Befunde mit hoher Priorität betreffen Leserechte und
Umgebungstrennung. Dazu kommen drei relevante Funktions-/Strukturmängel und zwei kleinere Befunde zur
Fehlerbehandlung und Dokumentation. Die grünen lokalen Tests decken die problematischen Kombinationen nicht ab.

## Abdeckung und Architektur

Die betroffenen Implementierungen wurden vollständig gelesen, einschließlich Thumbnail-Service, geändertem
Upload-Abschluss, Löschung, beiden Listen-Handlern, Bearbeiten-Handler, Mappern, Storage-Adaptern, Validierung,
Migration/Modell, Contracts, Backfill-Skript, DB-Zielwahl und den geänderten UI-Komponenten samt CSS. Die
betroffenen Testdateien und der Plan wurden einbezogen. Der generierte Lockfile wurde über seine Änderungen
geprüft, nicht wie handgeschriebener Quellcode behandelt.

Angrenzend verfolgt: API-Gate für Dateiänderungen, Datei-Download und `files.read`-Scope, Portal-Sichtbarkeitsfilter,
Dashboard-/Dateiseiten-Aufrufer, Upload-Queue, Listen-Revision und lokaler Listen-State, Storage-Factory,
Env-Lader und relevante Auth-Contracts. Für die Storage-Authentifizierung wurde auch die lokal installierte
SDK-Implementierung `@vercel/blob` 2.8.0 gelesen. Secret-Dateien und echte Datei-Inhalte wurden nicht gelesen.

Die einschlägigen Root-, Workspace-, Server-/Portal-/CRM-/Shared-, Komponenten-, Common- und Paketregeln sowie
deren CLAUDE-Verweise wurden berücksichtigt. Bewusste Ausnahmen aus dem Plan wurden nicht als Fehler gewertet:
insbesondere das technische Update von `thumbnail_key` ohne Versionssprung und die kleinere Bildkante von 160 px.

Die Grundstruktur ist passend: gemeinsame Erzeugung/Signierung in `server/shared/files`, getrennte autorisierende
Handler für CRM und Portal, reine Mapper sowie eine gemeinsame `FileThumbnail`-Komponente. Es gibt keinen Anlass,
den fachlich zusammenhängenden Thumbnail-Service allein aufgrund seiner Länge in Mini-Services aufzuspalten.
Die Ergänzung in der bestehenden Storage-Abstraktion vermeidet einen zweiten Upload-/Download-Pfad. Die additive,
nullable Migration stimmt mit dem Modell überein. Die Fundstellen unten betreffen die tatsächlichen Grenzen und
Fehlerpfade dieser ansonsten sinnvollen Aufteilung.

## Findings

### F01 · P1 · Bearbeiten signiert Bildinhalte ohne Leserecht

- **Fundstelle:** `apps/workspace/src/server/workspace/crm/command-handler/update-file.command-handler.ts:72`,
  Zugriffsprüfung dort ab Zeile 32; `apps/workspace/src/common/constants/auth/crm-endpoint-access-rules.ts:109`.
- **Problem und Auswirkung:** `updateFile` prüft `files.write`, signiert anschließend aber uneingeschränkt
  `row.thumbnail_key` und liefert die URL zurück. `files.read` ist ein unabhängiges Recht; der reguläre Download
  verlangt es über `fileService.findReadable`. Ein Akteur mit Schreibrecht, aber ohne Leserecht am betreffenden
  Scope kann deshalb durch eine gültige Metadatenänderung an einer bekannten Bild-ID deren Bildinhalt als
  Vorschaubild abrufen. Eine veraltete Version liefert zunächst ohnehin die aktuelle Version als Konfliktantwort.
  Bei einer Verschiebung muss zusätzlich der relevante Ziel-Scope der Antwort bedacht werden.
- **Empfehlung:** Vor jeder Signierung in Schreibantworten das Leserecht am tatsächlichen Antwortobjekt prüfen;
  ohne Leserecht `thumbnailUrl: null`. Die Prüfung bleibt im autorisierenden Handler, nicht im gemeinsamen
  Thumbnail-Service. Negativtest mit ausschließlich `files.write` und Test für unterschiedliche Lese-/Schreib-Scopes
  ergänzen. Regelbezug: Root-AGENTS „Security by default“ und CRM-Server-AGENTS „Zugriffsbereiche“.

### F02 · P1 · Backfill kann Datenbank und Storage verschiedener Umgebungen verwenden

- **Fundstelle:** `apps/workspace/scripts/files-backfill-thumbnails.ts:27`,
  `packages/db/src/core/database-target.ts:72` und `:81`, `packages/db/src/core/env.ts:13`.
- **Problem und Auswirkung:** Das Skript lädt die App-Zieldatei und ergänzt fehlende Werte aus `.env.local`.
  Die DB-Zielwahl lädt zusätzlich sämtliche Root-Umgebungen mit `override: false`; nur `DATABASE_URL` wird danach
  gezielt ausgewählt. Fehlen Zielwerte, kann sogar die Datenbank auf eine allgemeine/geerbte URL zurückfallen.
  Beispiel: Preview-DB ist korrekt konfiguriert, Preview-Storage fehlt, `.env.local` enthält Dev-Storage. Das Skript
  meldet „preview“, liest aber Dev-Blob. Bei geklonten Dateien mit identischen Storage-Keys kann es dort Vorschaubilder
  schreiben und Preview-Zeilen als erledigt markieren; andernfalls entstehen irreführende Storage-Fehler. Auch ein
  gesetztes `BLOB_STORE_ID` reicht ohne passende Authentifizierung nicht zur Isolation: Das lokale SDK kann ohne OIDC
  den allgemeinen Read-Write-Token und dessen Store verwenden.
- **Empfehlung:** Für dieses schreibende Skript DB- und Storage-Konfiguration gemeinsam und ausdrücklich an das
  ausgewählte Ziel binden. Fehlende oder widersprüchliche Zielkonfiguration vor dem ersten Schreibzugriff ablehnen;
  keine Ergänzung aus anderen Zielumgebungen. Zielabhängige Konfiguration mit synthetischen Env-Fällen absichern.
  Die permissive DB-Fallback-Logik bestand bereits im bisherigen DB-Skripthelfer; neu ist ihre Verwendung zusammen
  mit dem unabhängigen App-Storage-Lader in diesem Backfill.

### F03 · P2 · Fehlende Thumbnail-Konfiguration blockiert auch reine Metadatenpfade

- **Fundstelle:** `apps/workspace/src/server/portal/query-handler/list-portal-files.query-handler.ts:65`,
  `apps/workspace/src/server/workspace/crm/query-handler/list-customer-files.query-handler.ts:116`,
  `apps/workspace/src/server/workspace/crm/command-handler/update-file.command-handler.ts:72`.
- **Problem und Auswirkung:** Alle drei Stellen rufen `storageService.getAdapter()` vor der geschützten
  Signierung auf. Die Factory wirft bei fehlender Konfiguration synchron. Das passiert selbst bei einer leeren
  Liste, reinen Links oder Dateien ohne Thumbnail. Die Dateiliste bzw. eine reine Notizänderung scheitert dadurch,
  obwohl dafür kein Blob-Zugriff erforderlich ist. Im Portal hängt das Dashboard an diesen Listen über
  `Promise.all`, sodass die Ausnahme sogar den gesamten Seiten-Render abbrechen kann.
- **Empfehlung:** Adapter nur bei tatsächlich vorhandenen Thumbnail-Keys auflösen und dessen Auflösung ebenfalls
  in den vorgesehenen Fallback aufnehmen. Bei einem ausschließlich die Vorschau betreffenden Fehler Metadaten
  mit `thumbnailUrl: null` liefern. Tests für leere Listen, Links und fehlende Storage-Konfiguration ergänzen.
  Regelbezug: `src/server/shared/AGENTS.md`, „Vorschaubilder“: Eine nicht signierbare Vorschau darf die Liste nicht
  scheitern lassen. Die aktuelle Ausnahmebehandlung innerhalb von `signUrls` umfasst diesen Fehler nicht.

### F04 · P2 · Neu hochgeladene Bilder können dauerhaft bis zum nächsten Reload als Icon bleiben

- **Fundstelle:** `apps/workspace/src/server/workspace/crm/command-handler/complete-file-upload.command-handler.ts:38`,
  `apps/workspace/src/server/portal/command-handler/complete-portal-file-upload.command-handler.ts:32`,
  `apps/workspace/src/server/shared/files/file-thumbnail-service.ts:248`.
  Aufrufer: `src/hooks/shared/use-upload-queue.ts:120` und
  `src/components/portal/files/portal-files-view/portal-files-view.tsx:192` unter `apps/workspace/`.
- **Problem und Auswirkung:** Der Abschluss antwortet mit `thumbnailUrl: null` und erzeugt erst über `after()`
  die Vorschau. Der Client lädt unmittelbar nach der Abschlussantwort die Liste neu. Ist die Bildverarbeitung
  langsamer als dieser Listenabruf, speichert die Liste erneut `null`. Nach dem späteren Attach gibt es weder ein
  weiteres Signal noch einen begrenzten Nachladeversuch. Das erfolgreiche Erzeugen erscheint deshalb nicht von
  selbst in der bereits geöffneten Liste; der Benutzer muss die Seite oder den Filter erneut laden.
- **Empfehlung:** Den Übergang „Upload fertig, Vorschau noch in Arbeit“ bis in die Listenaktualisierung berücksichtigen,
  beispielsweise durch begrenztes Nachladen ausschließlich frisch hochgeladener, unterstützter Bilder. Das Rendering
  muss weiterhin asynchron bleiben. Den Ablauf mit absichtlich verzögerter Generierung und früher Listenantwort
  absichern; die vorhandenen Tests prüfen Scheduling und spätere Generierung getrennt, nicht diesen Übergang.

### F05 · P2 · Verschobene DB-Zieldefinition verletzt die Export- und Union-Struktur

- **Fundstelle:** `packages/db/src/core/database-target.ts:6` und `:12`.
- **Problem und Auswirkung:** Die jetzt app-übergreifend verwendete Datei exportiert das String-Literal-Array
  `DATABASE_TARGETS` und den daraus abgeleiteten fachlichen Typ direkt aus einem Logikmodul. Dafür gelten die
  Common-Ablage und das Const-Objekt-Pattern. Die reine Zieldefinition bleibt hier an Dateisystem-/Env-Code gekoppelt,
  obwohl sie unabhängig davon benötigt und geprüft werden kann. Die neue DB-AGENTS-Regel legt den Ort der
  Zielwahlfunktionen fest, erklärt aber keine Ausnahme für Typen und Konstanten.
- **Empfehlung:** `DatabaseTarget` als Const-Objekt mit abgeleitetem Typ und Werte-Array unter
  `packages/common/src/constants/database/` ablegen. Die Node-spezifischen Auswahl-/Ladefunktionen bleiben unter
  `packages/db/src/core/`; vorhandene Skriptimporte können kompatibel weitergeleitet werden.
  Regelbezug: Root-AGENTS „Export entscheidet über den Ort“ und `packages/common/AGENTS.md` „Konstanten-Regel“.
  Es geht um die neu öffentlich genutzte Struktur; der Inhalt war zuvor bereits im Skripthelfer vorhanden.

### F06 · P3 · Die zugesicherte Fehlergrenze von generate umfasst den DB-Read nicht

- **Fundstelle:** `apps/workspace/src/server/shared/files/file-thumbnail-service.ts:121` bis `:128`.
- **Problem und Auswirkung:** Der erste DB-Read liegt vor dem `try`. Bei einem DB-Fehler verwirft `generate` somit
  sein Promise, statt `Failed` samt kontrolliertem Log zu liefern. Im Backfill bricht dann der Lauf ohne die
  vorgesehene Ergebniszählung ab; im `after()`-Pfad übernimmt das Framework die Fehlermeldung. Das widerspricht
  der Zusage „Never throws“ und der Shared-AGENTS-Regel zur einheitlichen Protokollierung. Der erfolgreiche Upload
  ist zu diesem Zeitpunkt bereits committet; ein Rollback des Uploads wird hier ausdrücklich nicht behauptet.
- **Empfehlung:** Auch Lesen und Eligibility-Prüfung in die dokumentierte Fehlergrenze aufnehmen und mit der bereits
  übergebenen `fileId` einen kontrollierten Fehler melden. Bewusst globale Backfill-Abbrüche gesondert behandeln.
  Den DB-Ausfall vor dem Rendern prüfen, nicht nur fehlgeschlagene Storage-Schreibvorgänge.

### F07 · P3 · Plan und DTO-Kommentar beschreiben teilweise einen anderen Endzustand

- **Fundstelle:** `apps/workspace/plans/crm/26-portal-dateien-layout/L-file-thumbnails.md:48`, `:120`, `:150`;
  `packages/common/src/contracts/files/file.dto.ts:10` und `:44`.
- **Problem und Auswirkung:** Der Plan sagt zunächst korrekt, dass die Entfernung verwaister Thumbnail-Objekte
  nicht gebaut ist, verspricht sie im Rollback-Abschnitt aber durch das Skript. Außerdem wird das Dashboard weiter
  als automatischer `FileEntryRow`-Nutzer beschrieben, obwohl es `FileThumbnail` direkt nutzt. Der DTO-Kommentar
  verbietet signierte Capabilities generell und erklärt Vorschauen in Schreibantworten als `null`; `updateFile`
  liefert sie tatsächlich mit. Diese Widersprüche erschweren Wartung und lassen beim geplanten Löschen des
  Backfill-Skripts eine nicht vorhandene Bereinigungsfunktion erwarten.
- **Empfehlung:** Plan und öffentliche Contract-Kommentare auf den tatsächlichen Endzustand bringen. Die oben
  dokumentierten, ausdrücklich begründeten 160-px-/Versions-Ausnahmen sind davon zu unterscheiden.

## Prüfungen und Grenzen

- **115 lokale Tests grün, 19 Testdateien:** Workspace 72 (acht Dateien: Thumbnail-Unit, beide Mapper,
  Dashboard, Portal-Dateiansicht, CRM-Dateiliste/-Sektion, Konstanten); UI-Dateikomponenten 19 (acht Dateien);
  Storage 22 (zwei Dateien); DB-Dateischema 2 (eine Datei).
- **Typecheck grün** für `@invessiv/workspace`, `@invessiv/common`, `@invessiv/db`, `@invessiv/storage`, `@invessiv/ui`.
- **ESLint ohne Fehler** für diese fünf Pakete. Vorhandene Warnung zu `_omitted` in einem unveränderten
  Projekt-Handler-Test sowie Tool-Konfigurationshinweise zu React-/Next-Erkennung in Paketen.
- **`git diff --check master` grün.** Die lokalen Test-/Lint-Prozesse wurden nach sandboxbedingtem `EPERM` mit
  Freigabe außerhalb der Sandbox ausgeführt.
- Die PostgreSQL-Integrationstests wurden gelesen, aber nicht ausgeführt: Ihre Fixtures schreiben in eine externe
  Dev-Datenbank. Kein Preview-/Production-Backfill, keine Migration, kein Live-Blob-Test, kein Browser-E2E und kein
  App-Build in diesem Review. Die vollständigen Monorepo-Merge-Gates sind damit nicht als erfüllt bestätigt.
- Der vom Nutzer gemeldete Preview-SQL-Fehler wurde hier nicht gegen echte Umgebungen reproduziert. Insbesondere
  ist eine fehlende Preview-Migration weiterhin eine offene Ursache, kein bestätigtes Ergebnis dieses Reviews.
- Die Findings beruhen auf verfolgten Codepfaden und den genannten vorhandenen Prüfungen; für die neuen
  Negativfälle wurden gemäß Review-Skill keine Tests oder Fixes angelegt.
- Der Lockfile aktualisiert zusätzlich unter anderem Root-Playwright, Prettier, lint-staged und Resend der Web-App.
  Das geht über die zwei Thumbnail-Abhängigkeiten hinaus. Daraus wurde ohne belegten Funktionsfehler kein eigenes
  Finding gemacht; diese zusätzlichen Änderungen sollten beim PR-Scope und bei den vollständigen Gates bewusst
  berücksichtigt werden. `sharp` und `tsx` selbst sind für die implementierten Aufgaben nachvollziehbar.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche Regel vorgeschlagen. Die vorhandenen Schwerpunkte zu unabhängigen Berechtigungen,
Konfiguration, asynchronen Reihenfolgen, Fehlerpfaden und Exportgrenzen decken die hier gefundenen Muster ab.
Der Skill wurde nicht geändert.

## Autorisierte Nacharbeiten nach dem Review

Stand 21.10.2026, nach Rückmeldung des Nutzers:

- **F01 behoben:** Vorschaubild-URLs in Bearbeiten-Antworten verlangen Leserecht an Quell- und Ziel-Scope.
  Write-only und Verschiebungen ohne Leserecht sind durch lokale Handler-Tests abgesichert.
- **F02 präzisiert und abgesichert:** Dev und Preview dürfen ausdrücklich denselben Blob-Store verwenden.
  Das temporäre Backfill hat jetzt eine eigene strikte Konfigurationsprüfung: keine allgemeine DB-URL als Fallback,
  Vergleich mit der bekannten Prod-DB einschließlich direkter/gepoolter Neon-URLs, Ablehnung widersprüchlicher
  Root-/App-Zuordnungen, explizite Storage-Zugangsdaten je Ziel. Vercel-Runtime-Werte werden nur bei exakt passendem
  `VERCEL_ENV` und `VERCEL=1` verwendet. Der Nutzer bestätigt, dass die eigenständige Prod-Storage-Konfiguration nur
  in Vercel liegt; `.env.local` wird deshalb ausdrücklich nicht als Production-Storage ausgelegt.
- **F03 behoben:** Ohne Thumbnail-Schlüssel wird kein Adapter aufgelöst; auch Factory-Fehler fallen auf `null`
  zurück. Neue Unit-Tests prüfen beide Fälle.
- **F04 behoben:** Der gemeinsame Datei-Listen-Hook ergänzt Vorschaubilder mit höchstens fünf Hintergrundversuchen.
  Er lädt die betroffenen vorhandenen Seiten, ersetzt nur die Vorschau-URL und bewahrt Pagination und neuere lokale
  Änderungen. Nicht unterstützte Formate, Abbruch bei Scope-Wechsel und Ende der Wiederholungen sind getestet.
- **F05 behoben:** Const-Objekt, Typ und Werte-Array liegen unter `packages/common/src/constants/database/`;
  die bisherigen DB-Skripte behalten einen kompatiblen Re-Export.
- **F06 behoben:** Auch der erste DB-Zugriff der Generierung wird kontrolliert abgefangen und ohne SQL-/Secret-Details
  protokolliert.
- **F07 erläutert und Doku angeglichen:** Keine neue fachliche Entscheidung nötig. Insbesondere verspricht der
  Rollback-Abschnitt keine nicht vorhandene Bereinigung mehr; Widget-/DTO-Beschreibung entsprechen dem Endzustand.

Validierung der Nacharbeiten:

- `pnpm -r test`: alle sechs Pakete grün; 5.686 Tests bestanden, DB-Integrationstests im Standardmodus übersprungen.
  Anschließend ergänzte Vercel-Zielfälle sind im separaten Regressionstestlauf enthalten: 44 Tests in fünf Dateien grün.
- `pnpm -r typecheck` und `pnpm -r lint` grün (bestehende Warnungen wie im ursprünglichen Bericht).
- Workspace-Produktionsbuild grün. Bestehender Turbopack-Hinweis zum breiten Env-Dateimuster in
  `packages/db/src/core/env.ts`; diese globale Ladefunktion wurde nicht verändert.
- Reale lokale Konfiguration mit `--check` geprüft: Dev und Preview bestehen; Production bricht wegen fehlender
  expliziter lokaler Blob-Store-ID ab. Dieser Schalter spricht weder DB noch Storage an.
- Zusätzliche **rein lesende** Production-Schemaabfrage: `hasThumbnailKey: false`, `migrationApplied: false`.
  Damit ist die noch ausstehende Migration 0061 auf der explizit konfigurierten Prod-DB bestätigt. Keine
  Production-Zeilen oder Blob-Objekte wurden verändert; die Prod-Blob-Objekte konnten lokal nicht validiert werden.
  Das hierfür verwendete Diagnoseskript wurde wieder entfernt.

Offen bleibt ausschließlich der Deployment-/Betriebsschritt: Migration auf Production und anschließender Backfill
mit den echten Prod-Storage-Werten. Das bereits im Plan vorgesehene spätere Entfernen des temporären Backfill-Codes
bleibt bestehen und umfasst nun auch dessen Konfigurationshelfer und Test.
