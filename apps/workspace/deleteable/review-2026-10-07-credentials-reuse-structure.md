# Review: Zugangsdaten — Wiederverwendung und Ablagestruktur

## Umfang und Gesamturteil

- Stand: `feat/crm-credentials-1-intern`, Commit `be81a685`; Arbeitsbaum zu Beginn sauber.
- Vergleichsbasis: `master`, gemeinsamer Vorfahr `75cff4a6`. Für die Implementierungsstatistik: `64f047e1..HEAD` (Task 17 und 18). Die davor liegenden Planänderungen und Verschiebungen sind separat inventarisiert.
- Schwerpunkt: doppelte Logik, vorhandene Alternativen, kleinste sinnvolle Extraktionen, Ablage gegen die geltenden `AGENTS.md`/`CLAUDE.md`. Keine Implementierung im Rahmen dieses Reviews.
- Ergebnis: **drei P2-Findings zur Wiederverwendung und zwei P3-Findings**. Der Branch enthält vermeidbare Parallelimplementierungen, ist aber nicht insgesamt ein unnötiger Neubau. Aus den hier untersuchten Stellen ergibt sich kein neuer P0/P1-Befund. Das ist keine vollständige Sicherheits- oder Releasefreigabe.

Der Implementierungsdiff umfasst **140 Dateien, 9.478 hinzugefügte und 45 entfernte Zeilen**:

| Bereich                                                  | Dateien | Hinzugefügte Zeilen |
| -------------------------------------------------------- | ------: | ------------------: |
| Tests                                                    |      20 |               3.574 |
| CSS                                                      |       7 |                 553 |
| Dictionaries einschließlich Einbindung                   |       4 |                 329 |
| Dokumentation einschließlich Regeln und früherer Reviews |       8 |                 222 |
| DB-Skripte und SQL                                       |       7 |                 548 |
| Übriger Code und Konfiguration                           |      94 |               4.252 |

Die Menge wirkt größer als die sichtbare UI, weil Kryptografie, Schlüsselrotation, Schema, Audit, Rechte und Konfliktbehandlung dazugehören. Die Regeln verlangen zudem einzelne Contract-Dateien: Viele kleine Typdateien sind deshalb kein Strukturfehler. Die folgenden Extraktionen würden vor allem parallele Wartung reduzieren; eine belastbare Einsparung von Tausenden Zeilen lässt sich daraus nicht ableiten.

## Findings

### F01 · P2 · Scope-Rechte kopiert, Wiederverwendung gleichzeitig an den Dateibereich gekoppelt

- **Fundstellen:** `apps/workspace/src/lib/workspace/crm/credentials-view-model.ts:21` und `:35`; bestehende Gegenstücke `apps/workspace/src/lib/workspace/crm/files-view-model.ts:22` und `:37`. Identische Shapes in `common/contracts/crm/credentials/credentials-scope-rights.ts:2` und `common/contracts/crm/files/files-scope-rights.ts:2`, ebenso `credentials-project-option.ts:2` und `files-project-option.ts:2`. `components/workspace/crm/credentials/customer-credentials-section/customer-credentials-section.tsx:16` importiert `filesScopeRights` aus `common/patterns/crm/files/files-scope-rights.ts:28`.
- **Problem und Auswirkung:** Berechnung von Kunden-/Projektrechten, Vereinigung lesbarer und schreibbarer Projekt-IDs sowie Projektoptionen wurden praktisch unverändert kopiert. Zugleich verwendet die neue Oberfläche den mit Files-Typen definierten Scope-Helper. Das funktioniert durch strukturelle Typkompatibilität, bindet Zugangsdaten aber an einen fremden Featureordner und lässt dieselbe Rechteableitung zweimal warten.
- **Regelbezug:** Root-`AGENTS.md`, „Architektur-Prinzipien“: keine Logik-Duplikate und fachliche Gruppierung; `apps/workspace/src/common/AGENTS.md`, „Datei- und Ordnerstruktur“.
- **Empfehlung:** Gemeinsame Kunden-/Projekt-Scope-Contracts und `allows`/`targets`/`any` unter neutralen `common/contracts/crm/` und `common/patterns/crm/` ablegen. Einen parameterisierten Rechtehelfer unter `lib/workspace/crm/` aus der vorhandenen Berechnung extrahieren. Files- und Credentials-ViewModels getrennt lassen: Mitglieder/Löschrecht beziehungsweise Reveal/Schlüsselstatus sind unterschiedliche Aufgaben. Keine zusätzliche Scope-Engine bauen.

### F02 · P2 · Client-Service wiederholt vorhandenes Fehler- und Ergebnis-Unwrapping

- **Fundstellen:** `apps/workspace/src/client/crm/credentials-api-service.ts:45` (`readCode`), `:53` (`readWriteFailure`), `:65`, `:93`, `:108`, `:123`, `:137`; vorhandene Gegenstücke `apps/workspace/src/common/patterns/client/read-api-error-code.ts:2`, `apps/workspace/src/client/crm/files-api-service.ts:43`, `apps/workspace/src/client/shared/file-api-transport-service.ts:37` und `apps/workspace/src/client/shared/versioned-json-mutation-service.ts:61`/`:140`.
- **Problem und Auswirkung:** Der Code nutzt zwar das gemeinsame `send` und `readVersionConflict`, baut darum jedoch dieselben Netzwerkfehler-/Erfolgs-/Fachfehler-Verzweigungen erneut. Die Fehlercodeprüfung existiert bereits passend für `{ code }`; `readWriteFailure` entspricht dem vorhandenen Files-Block bis auf Decoder und DTO-Guard. Transportänderungen und Konfliktkorrekturen müssen dadurch an mehreren Stellen erfolgen.
- **Regelbezug:** Root-`AGENTS.md`, „Keine Logik-Duplikate“ nennt ausdrücklich Unwrap-Blöcke; `apps/workspace/src/client/AGENTS.md`, „Services im Client“.
- **Empfehlung:** Sofort `readApiErrorCode` nutzen. Den gemeinsamen JSON-Service minimal um einen übergebenen Fehlerdecoder und einen gemeinsamen Konflikt-/Fehlerleser erweitern; die generische Request-/Result-Verarbeitung aus dem File-Transport in den neutralen Client-Transport übernehmen, wenn beide ihn nutzen. Credentials behält Endpunkte und DTO-Decoder, Files seine Datei-/Ticket-Decoder. **Wichtig:** Der bisherige `versionedJsonMutationService` liest reguläre Fehler aus `payload.error`, Credentials aus `payload.code`; ihn unverändert anzuschließen wäre falsch. Delete-Erfolg ohne DTO ebenfalls ausdrücklich unterstützen.

### F03 · P2 · Schema-validierter JSON-Body als zweiter Feature-Wrapper implementiert

- **Fundstellen:** `apps/workspace/src/lib/credentials/credential-api-response.ts:38` (`parseCredentialBody`) und `apps/workspace/src/lib/files/file-api-response.ts:46` (`parseFileBody`); bestehender JSON-Unterbau `apps/workspace/src/lib/http/with-json-body.ts:8`.
- **Problem und Auswirkung:** Schema-Interface, `safeParse`, Weitergabe von `parsed.data` und Trennung von ungültigem JSON und ungültiger Shape sind derselbe Ablauf. Nur die Fehlerantworten unterscheiden sich. Dieser allgemeine HTTP-Ablauf wird nun in zwei fachlichen Antwortmodulen gepflegt.
- **Regelbezug:** Root-`AGENTS.md`, „Keine Logik-Duplikate“ und Trennung der Verantwortlichkeiten.
- **Empfehlung:** Aus dem vorhandenen Parser einen schemafähigen Helfer unter `lib/http/` extrahieren, mit Callbacks für ungültiges JSON und Schemafehler. Feature-Wrapper dürfen die eigenen Fehlerantworten vorbelegen. Rate-Limit-Header, Storage-Fehler, Audit-sichere Fehlerprotokollierung und fachliche Result-Unions bleiben in den jeweiligen Modulen; keine große generische Response-Abstraktion erforderlich.

### F04 · P3 · HTTP-Linkprüfung neu geschrieben, obwohl passender Parser existiert

- **Fundstellen:** `apps/workspace/src/common/patterns/credentials/credential-link.ts:7`; vorhandene Implementierung `packages/common/src/patterns/url/parse-http-url.ts:2` und `:11`.
- **Problem und Auswirkung:** `new URL`, HTTP(S)-Protokollprüfung und Fehlerbehandlung werden erneut implementiert. Beide Helfer akzeptieren dieselbe Protokollmenge; zukünftige Änderungen müssten parallel gepflegt werden.
- **Regelbezug:** Root-`AGENTS.md`, „Keine Logik-Duplikate“; `apps/workspace/src/common/AGENTS.md`, kanonische Quelle in `packages/common`.
- **Empfehlung:** `toCredentialLink` als fachlichen Null-/Freitext-Adapter behalten und darin `isHttpUrl` verwenden. Bei Erfolg den Originaltext zurückgeben, damit keine unbeabsichtigte URL-Normalisierung durch `.href` entsteht. Die strengere Datei-Linkvalidierung ist kein geeigneter Ersatz.

### F05 · P3 · Testablage neuer CRM-Komponenten erfüllt die lokale Strukturregel nicht

- **Fundstellen:** `apps/workspace/src/components/workspace/crm/credentials/credential-row/`, `credential-delete-dialog/`, `credential-project-filter/` und `credential-group/` enthalten TSX/CSS, aber keinen co-located Test; zahlreiche Unterkomponentenfälle liegen stattdessen in `customer-credentials-section/customer-credentials-section.test.tsx` (604 Zeilen). Der Benutzername-Kopierpfad in `credential-row/credential-row.tsx:81` wird dort nicht als erfolgreiche/fehlgeschlagene Clipboard-Aktion geprüft; der Clipboard-Test ab `customer-credentials-section.test.tsx:456` betrifft den Secret-Reveal.
- **Problem und Auswirkung:** Die lokale Regel verlangt pro Komponente einen Ordner mit CSS und Test. Verhalten kleiner Komponenten wird überwiegend über den großen Orchestrator-Test geprüft; isolierte Fehlerpfade der normalen Username-Kopie bleiben ungetestet. Bestehende Delete-Konflikttests fehlen ausdrücklich nicht, sie liegen nur beim Orchestrator.
- **Regelbezug:** `apps/workspace/src/components/workspace/crm/AGENTS.md`, „Struktur“: „Pro Komponente ein Ordner … mit co-located … und Test“.
- **Empfehlung:** Vorhandene Unterkomponentenfälle bei einer Bereinigung in die jeweiligen Ordner verschieben, statt sie zu duplizieren. Bei der Zeile Clipboard-Erfolg/-Fehler und Feedback-Rücksetzung sinnvoll prüfen. Orchestrator-Tests für Reload, Rechtewechsel, Fokus und Zusammenspiel behalten; keine bloßen Render-Snapshots hinzufügen.

## Architektur und Ablage: was bereits passend umgesetzt ist

- **Vorhandene UI wird benutzt:** `FormDialog`, `FormField`, `CustomSelect`, `ConfirmDialog`, `useVersionedMutation`, `useFocusFirstInvalidField` und `CollapsibleSection` werden wiederverwendet. Ein neuer Dialog- oder Formularrahmen wurde nicht gebaut. Die Erweiterung um Ref-Props an den vorhandenen Collapse-Komponenten ist eine kleine Wiederverwendungsänderung.
- **`crmTargetExists` ist eine echte Extraktion:** Der bisherige Files-Zielcheck wurde in `server/workspace/crm/services/crm-target-exists.ts` verlagert; Files und Credentials nutzen denselben permission-parametrisierten, sperrenden Check. Hier wurde gerade keine zweite Prüfung kopiert.
- **Produktionsablage überwiegend regelkonform:** Komponenten unter `crm/credentials/<name>/`, Hooks unter `hooks/`, geteilte Contracts/Patterns unter `common`, API-Schnittstelle unter `client/crm`, Anwendungsfälle als einzelne Command-/Query-Handler, Persistenz/Mapping getrennt. Lokale nicht exportierte Hilfstypen und Komponenten-Props sind zulässige Ausnahmen zur Common-Regel.
- **Crypto im DB-Paket ist ausdrücklich erlaubt:** `packages/db/AGENTS.md`, „Zugangsdaten-Verschlüsselung“, begründet die Nutzung durch App und Skripte. Die Shared-Credential-Services und Event-Typen sind in `server/shared/AGENTS.md`, „Zugangsdaten“, ausdrücklich geregelt. Ihr Ablageort ist kein Finding wegen des noch ausstehenden Portals.
- **Neue Projektquery ist fachlich gerechtfertigt:** `listCredentialProjectsByCustomer` liefert ausschließlich Labels und nutzt die Vereinigung von `credentials.read`/`credentials.write`. `listProjectsByCustomer` ist auf andere Permissions und vollständige Projekt-DTOs ausgelegt. Unveränderte Wiederverwendung würde Zugänge ohne allgemeines Projektleserecht beschädigen oder mehr Daten laden. Eine allgemeine Projektabfrage allein zum Sparen weniger SQL-Zeilen wäre hier keine klare Verbesserung.
- **Reveal ist kein normaler Copy-/Fetch-Hook:** Intent, erneute serverseitige Autorisierung, Audit, Begrenzung, Countdown, Tabwechsel und späte Antworten begründen `useRevealedSecret`. Die normale Username-Kopie darf nicht über diesen Secret-Workflow laufen. Ein kleiner allgemeiner Clipboard-Feedback-Hook wäre optional; vorhandene Clipboard-Flows haben unterschiedliche Rücksetzung und Fehlerdarstellung, deshalb kein zusätzliches bestätigtes Duplikat-Finding.
- **Datumshelfer nicht blind zusammenlegen:** `formatTimestampDay` nutzt die Viewer-Zeitzone, `formatMomentDay` explizit die Business-Zeitzone. Ähnliche Formatierung beweist hier keine gleiche Semantik.
- **Contract-Kleinteiligkeit ist vorgeschrieben:** „Eine Contract-Datei pro Contract“ erklärt viele Dateien. Pauschales Zusammenziehen würde die Ablageregel verletzen. Bei über 120 Dateien empfiehlt die CRM-Planregel eine erneute Scopebetrachtung; die Zahl allein belegt bei zwei Tasks noch keinen Funktions- oder Architekturfehler.

## Abdeckung und Grenzen

Gezielt geprüft wurden Produktionspfade von Cockpit/ViewModel über Filter, Liste, Formular, Reveal und Client-Service bis API, Rechtecheck, Handler, Mapping, Kryptografie, DB-Modell und Migration; außerdem Seed, Rekey und Credential-Smoke. Für Wiederverwendung wurden die bestehenden Files-ViewModels/-Contracts/-Clients/-Antwortwrapper, Projektqueries, HTTP-/URL-Helfer, Dialog-/Formularbausteine und angrenzende Clipboard-Flows verglichen. Relevante Aufrufer und die credentialbezogenen Regeln wurden einbezogen; frühere Reviews und deren Fixes gehören zum geprüften Stand.

Vorhandene Tests wurden zur Einordnung der Konflikt-, Reveal-, Filter- und Fokuspfade sowie der Testablage herangezogen. Dieser Lauf ist ein statisches Architektur-/Duplikatreview: **keine neuen Testläufe, kein Build, keine vollständigen Merge-Gates, keine DB-Ausführung und kein Browser-Smoke**. Historische verschobene Planunterlagen wurden inventarisiert, nicht als neue Implementierung behandelt; bestehende angrenzende Features wurden nur hinsichtlich der genannten Wiederverwendungspunkte geprüft. Lokale Secret-Dateien, generierte Ausgaben und Dependencies waren ausgeschlossen. Das Review beweist keine E2E-Funktion in einer realen Dev-/Portal-Session.

Sinnvolle Reihenfolge für eine spätere Bereinigung: F01 und F02, danach F03; F04 ist ein kleiner unabhängiger Fix. F05 lässt sich beim Aufteilen der betroffenen Tests erledigen. Die vorhandenen Sicherheits- und Konflikttests sollten bei diesen Extraktionen erhalten bleiben.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche Regel vorgeschlagen. Der Auftrag zur Suche nach vorhandenen Bausteinen und minimalen Extraktionen ist durch die aktuellen Prüfschwerpunkte bereits abgedeckt. Der Skill wurde nicht verändert.
