# Review — Credentials im Portal und interne Freigabe

**Stand:** 07.10.2026, Branch `feat/crm-credentials-2-portal`, HEAD `bb0fb6c21fe5937a27db7f4fdcfcbf49d4a45f29`. Gegenstand sind die lokalen Änderungen gegenüber HEAD einschließlich neuer Dateien (bei der abschließenden Inventur 78 getrackte Änderungen und 60 neue Dateien, vor diesem Bericht).

**Auftrag:** Umsetzung von `apps/workspace/plans/crm/19-credentials/71-credentials-portal.md`, einschließlich Freigabe interner Zugangsdaten beim Anlegen, Bearbeiten und über den separaten Freigabe-Dialog. Die dokumentierte Entscheidung vom 07.10.2026, den Portalbereich als Dashboard-Dialog statt als eigene Seite umzusetzen, wurde berücksichtigt.

**Gesamturteil:** Zwei belegte Funktionsfehler, eine relevante Abnahmelücke und eine kleinere Architekturabweichung. Vor Merge insbesondere F01 korrigieren und die reale Portal-Abnahme nachholen. Im geprüften Zugriffspfad wurde kein P0-/P1-Befund festgestellt; das ist keine Bestätigung der noch nicht ausgeführten DB- und Session-Gates.

## Abdeckung und Zusammenspiel

- Vollständig verfolgt: vier neue API-Routen, Portal-Client-Service, Portal-Hook, Portal-Handler und Credential-Services, gemeinsame Schreib-/Reveal-/Schema-Services, interne Create-/Update-/Reveal-/Freigabe-Handler, interne Zugriffsdienste und Mapper, beide Formularbindungen, gemeinsames Formular und Faktenliste, Credential-Zeilen, Portal-Dialog, Widget und Dashboard-Verdrahtung. Relevante Form-, Dialog-, Routen-, Mapper- und PostgreSQL-Integrationstests wurden gelesen.
- Ergänzend geprüft: Permission-/Systemrollenänderungen, Endpunkt- und Widget-Konfiguration, Request-/Response-Contracts, DE/EN-Texte, CSS, Migration `0055`, Drizzle-Modelle, RBAC-Katalogvergleich und Credential-Fixtures. Große angrenzende Dateien wie `seed-crm-fixture.ts` und bestehende Katalog-/Endpunktmodule wurden an den betroffenen Änderungen und Aufrufern geprüft; keine vollständige Prüfung ihrer fachfremden Bereiche.
- Regeln: Root und Workspace, API-/Portal-Routen, Portal-/CRM-Komponenten, Common, Client, Hooks, Lib, Server und seine Portal-/Shared-/CRM-Scopes sowie Packages/Common/DB und CRM-Plan. CLAUDE-Verweise auf dieselben Regeln wurden als Verweise behandelt.
- Nicht geprüft: produktive Daten, Schlüssel/Secret-Dateien, Deployment-Konfiguration, reale Sessions und Browserdarstellung. Keine Migration, Seeds oder schreibenden DB-Smokes ausgeführt. Keine Codeänderungen oder neuen Tests; dieser Bericht ist die einzige dauerhafte Review-Ausgabe.

Die Verantwortungstrennung ist überwiegend nachvollziehbar: Zugriffsentscheidungen bleiben in den jeweiligen Serverwelten, Verschlüsselung und Nebenwirkungen werden geteilt, UI und API verwenden eigene Portal-DTOs. `visibleCondition` bündelt Kunde, Freigabe, Projektstatus und Aktionsrecht für Lesen, Schreiben und Reveal. Listen selektieren keine Chiffrate; Dashboard-Daten enthalten nur Anzahl und Fähigkeiten. Die neue Rolle wird additiv eingeführt und nicht automatisch bestehenden Kontakten zugewiesen. Die Freigabelogik ist dagegen zwischen mehreren internen Handlern dupliziert und bereits in ihrer Reihenfolge auseinandergefallen (F02).

## Findings

### F01 · P2 · Erfolgreiche Portal-Änderungen ohne Leserecht werden als Fehler angezeigt

- **Fundstelle:** `apps/workspace/src/client/portal/portal-credentials-api-service.ts:98` (`update`, besonders Zeile 109); `apps/workspace/src/components/portal/credentials/portal-credential-form-dialog/portal-credential-form-dialog.tsx:90`; Serververtrag in `update-portal-credential.command-handler.ts` und `portal-credential-updated.dto.ts`.
- **Problem und Auswirkung:** Der Server unterstützt ausdrücklich Schreiben ohne Lesen und antwortet dann erfolgreich mit `{ updated: true, credential: null }`. Der Client gibt diesen gültigen Erfolg an `mutate` als `null` weiter; der gemeinsame Transport wertet `null` als fehlenden Erfolgswert und liefert `internal`. Das tritt etwa auf, wenn einem Kontakt bei offenem Bearbeitungsformular nur das Leserecht entzogen wird: Die Änderung ist gespeichert, der Dialog meldet dennoch einen Fehler und bleibt offen. Ein anschließender Versionskonflikt mit `current: null` wird ebenfalls als `internal` behandelt; die Formularbindung setzt zusätzlich einen vorhandenen DTO-Titel voraus.
- **Nachweis:** Ausführung des tatsächlichen transpilierten Client-Services mit simulierten HTTP-Antworten: Sowohl HTTP 200 mit gültiger Bestätigung als auch HTTP 409 mit `code: version_conflict, current: null` ergeben `{ ok: false, code: internal }`. Die Server-Integrationstests bestätigen gerade diese vorgesehenen Antwortformen, UI-Tests mocken den Client-Service und erfassen die Transportlücke deshalb nicht.
- **Empfehlung:** Bestätigung und optionales DTO im Client-Ergebnis getrennt modellieren; einen fehlenden DTO-Wert nicht als fehlenden Erfolg behandeln. Das Formular kann den eingegebenen Titel für die Erfolgsmeldung nutzen. Konflikte ohne DTO als erkennbaren Konflikt behandeln, ohne Daten nachzuladen, für die das Leserecht fehlt. Transporttests für beide Antwortformen und einen Rechtewechsel bei offenem Formular ergänzen.

### F02 · P2 · Unveränderte Freigabe scheitert abhängig vom verwendeten Endpunkt

- **Fundstelle:** `apps/workspace/src/server/workspace/crm/command-handler/set-credential-portal-visibility.command-handler.ts:51`–`61`; Gegenstück `update-credential.command-handler.ts:61`–`84`, zusätzlich Freigabeprüfung in `create-credential.command-handler.ts`.
- **Problem und Auswirkung:** Bei einem bereits freigegebenen Eintrag, dessen Projekt inzwischen archiviert oder abgesagt wurde, prüft der separate Freigabebefehl den Projektstatus vor dem unveränderten Wert. Ein erneutes `visibleToCustomer: true` mit aktueller Version liefert daher `project_hidden`, obwohl nichts geändert werden soll. Derselbe Request über den Bearbeitungs-Endpunkt ist erfolgreich. Das verletzt die ausdrücklich dokumentierte Regel in `src/server/workspace/crm/AGENTS.md`, Abschnitt „Zugangsdaten“: Der gleiche gespeicherte Freigabewert ist auf jedem Weg ein Erfolg ohne Write/Event. Die duplizierten Freigabebedingungen verletzen außerdem Root-`AGENTS.md`, Abschnitt „Keine Logik-Duplikate“.
- **Nachweis:** Beide tatsächlichen Handler mit derselben simulierten gesperrten Zeile und einem nicht sichtbaren Projekt ausgeführt: separater Befehl → `project_hidden`, Bearbeiten → Erfolg mit unveränderter Version. Es gab dabei keine echte Datenbank und keinen Write.
- **Empfehlung:** Nach Zugriff und Versionsprüfung den unveränderten Wert vor einer neuen Freigabeprüfung behandeln. Gemeinsame Freigaberegeln als benannten Helfer im internen Credential-Service-Kontext bündeln; Zugriff, Versionierung und Event-Orchestrierung bleiben beim jeweiligen Handler. Einen Regressionstest für den gleichen Freigabewert auf einem inzwischen versteckten Projekt ergänzen.

### F03 · P2 · Der neue Geheimniszugriff hat keine Abnahme mit echten Portal-Sessions

- **Fundstelle:** `apps/workspace/src/server/tests/portal/credentials/portal-credentials.integration.test.ts:79` (`contact` baut Actors direkt); `apps/workspace/src/server/tests/portal/api/portal-credential-routes.test.ts:33` (Authentifizierung gemockt); `apps/workspace/e2e/` enthält keinen Credentials-Flow.
- **Problem und Auswirkung:** Handler-Integration und Routen-Unit-Tests prüfen Isolation jeweils unterhalb beziehungsweise mit Ersatz der echten Session-/Mitgliedschaftsauflösung. Kein neuer Test verbindet eine echte Kontakt-Session mit Widget, Liste und Reveal-Endpunkt; insbesondere ist der Rollenentzug beim nächsten Credential-Request nicht durch einen solchen Flow abgesichert. Damit bleibt die zentrale Sicherheitskette für den neu eingeführten Klartextzugriff ungetestet. Verbindliche Grundlage: `apps/workspace/plans/crm/AGENTS.md`, „Definition of Done je Einheit“ fordert Cross-Customer-Negativtests mit echten Sessions; Root-`AGENTS.md` fordert E2E für Kernabläufe.
- **Empfehlung:** Das vorhandene Portal-E2E-Setup um Kontakte zweier Firmen, Standardkontakt ohne Credential-Rechte und Owner-Sicht erweitern. Freigabe → Liste/Reveal → Freigabe- und Rollenentzug sowie Fremdzugriff prüfen; Secrets nur als offensichtliche Fixture-Werte verwenden. Die manuelle Abnahme aus Task 71 samt DE/EN, Tastatur und beiden Themes dokumentieren.

### F04 · P3 · Zwei eigenständige Label-Contracts liegen in einer Datei

- **Fundstelle:** `apps/workspace/src/common/contracts/credentials/credential-form-dialog-labels.ts:8` und `:60` (`CredentialFormDialogLabels`, `CredentialFormReleaseLabels`).
- **Problem und Auswirkung:** Die neue Datei exportiert zwei eigenständige Contracts und bündelt außerdem mehrere benannte Formbereiche als Inline-Shapes. Das widerspricht `apps/workspace/src/common/AGENTS.md`, „Eine Contract-Datei pro Contract“, einschließlich der Regel für Unter-DTOs. Es ist kein Laufzeitfehler, macht aber die neue geteilte Formular-API entgegen der vorgeschriebenen Ablage von einer Sammeldefinition abhängig.
- **Empfehlung:** Zumindest `CredentialFormReleaseLabels` in eine eigene `credential-form-release-labels.ts` verschieben; eigenständige Form-Untercontracts nach derselben Regel benennen und importieren. Keine Änderung im Review vorgenommen.

## Prüfungen und verbleibende Grenzen

| Prüfung                                                                 | Ergebnis                                                                                                                      |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Workspace: fokussierte Credential-/Dashboard-/Widget-Tests              | 27 Dateien, 241 Tests grün; 3 Dateien mit 44 DB-Integrationstests übersprungen                                                |
| Common: Credential-, Permission-, Systemrollen- und Nachrichten-Tests   | 5 Dateien, 34 Tests grün                                                                                                      |
| Zusätzliche Workspace-Dictionary-/Permissiongruppen-/Endpunktregeltests | 3 Dateien, 22 Tests grün                                                                                                      |
| Workspace-Typecheck                                                     | Grün                                                                                                                          |
| Workspace-Lint                                                          | Keine Fehler; eine Warnung zu `_omitted` in der unveränderten `update-project.command-handler.test.ts:189`                    |
| F01-/F02-Reproduktion                                                   | Bestätigt mit tatsächlichem transpiliertem Code und simulierten externen Antworten/DB-Zeilen; keine produktiven Seiteneffekte |

Die ersten Vitest-Versuche wurden durch Sandbox-`spawn EPERM` blockiert; die anschließend freigegebenen Läufe waren erfolgreich. Insgesamt **297 fokussierte Tests grün**. Dies ersetzt weder die PostgreSQL-Integrationstests noch den App-Build, die paketweiten Merge-Gates oder die reale Browser-/Session-Abnahme. Migration `0055` wurde statisch mit Permission-Katalog, Systemrolle und Modell abgeglichen, aber nicht gegen PostgreSQL ausgeführt.

Keine Aussage über bereits außerhalb dieses Reviews erledigte manuelle Abnahmen. MFA/Reverification wurde nicht als fehlendes Feature beanstandet: Der Plan behandelt es ausdrücklich als optional und dokumentiert das akzeptierte Risiko.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche Regel vorgeschlagen. Transportvertrag, Rechtewechsel, Testlücken und duplizierte Invarianten werden bereits von den vorhandenen Skill-Prüfschwerpunkten abgedeckt. Der Skill bleibt unverändert.
