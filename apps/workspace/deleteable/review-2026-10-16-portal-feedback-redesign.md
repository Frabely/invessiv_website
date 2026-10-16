# Review: Portal-Feedback-Redesign

Stand: 16.10.2026 · Branch `feat/portal-ui-optimierung` · HEAD `05552add194a8fdc8c665feddcd615bfacf70e90`.

Nachtrag: Die Findings wurden anschließend auf Nutzerwunsch korrigiert. Der ursprüngliche Review-Stand bleibt unten nachvollziehbar; Umsetzung und Nachprüfung stehen im Abschnitt „Korrekturstand“ am Ende.

## Umfang und Gesamturteil

Geprüft wurde das lokale Changeset gegen HEAD, einschließlich vorgemerkter, nicht vorgemerkter und neuer Dateien. Dies ist kein Review sämtlicher bereits im Branch enthaltener Commits gegen `main`.

Die Aufteilung in Editor, Reader, Seitenrahmen und einzelne Runden ist nachvollziehbar. Die gemeinsame Verwendung der Schritt-Komponenten durch Feedback und Onboarding passt zur Architektur. Die eigentlichen Schreib-Handler und der Autosave-Hook wurden nicht funktional umgebaut. Die wesentliche neue Verhaltensänderung ist die Navigation zwischen Runden bei weiterlaufendem Entwurf; dort fehlen Schutzmechanismen an zwei Stellen. Zusätzlich bleibt ein E2E-Test mit dem neuen Markup inkompatibel.

**Ergebnis: vier P2- und zwei P3-Findings; kein belegtes P0/P1-Problem.** Vor Freigabe sollten insbesondere F01–F03 behoben werden. Die grünen Unit-Tests ersetzen keine E2E- oder Datenbankprüfung.

## Findings

### F01 · P2 · Browser-Zurück bricht Uploads ohne Bestätigung ab

- **Fundstelle:** `apps/workspace/src/components/portal/feedback/feedback-editor/feedback-editor.tsx:116`, `apps/workspace/src/hooks/portal/use-portal-step-search.ts:7`; beteiligter Abbruch: `apps/workspace/src/components/portal/shared/portal-attachment-field/portal-attachment-field.tsx:124`.
- **Problem und Auswirkung:** Die Upload-Bestätigung steckt ausschließlich in `FeedbackEditor.goTo`. `popstate` aktualisiert dagegen direkt den URL-Snapshot und damit die gerenderte Runde. Beispiel: Runde 1 ansehen, über Weiter zu Runde 2 gehen, dort einen Upload starten und Browser-Zurück betätigen. Die Dateifelder werden ohne Nachfrage unmountet und ihre laufenden Uploads abgebrochen. `useLeaveWarning` schützt nur Dokumentverlassen und Linkklicks; bei diesem Wechsel innerhalb der History greift es nicht.
- **Empfehlung:** Den Wechsel der tatsächlich angezeigten Runde auch für History-Navigation absichern oder die aktiven Upload-Felder beim Rundenwechsel erhalten. Eine abgelehnte Bestätigung muss URL und sichtbare Runde konsistent zurückstellen. Den Ablauf mit echtem Zurück/Vorwärts und aktivem Upload absichern.

### F02 · P2 · Speicherfehler und Konflikte verschwinden beim Lesen früherer Runden

- **Fundstelle:** `apps/workspace/src/components/portal/feedback/feedback-editor/feedback-editor.tsx:204` und `:248`; Fehler-/Konfliktzustand in `apps/workspace/src/hooks/portal/use-feedback-draft.ts:93` und `:130`.
- **Problem und Auswirkung:** Der Entwurf bleibt beim Wechsel auf eine frühere Runde aktiv und speichert weiter. Speicherstatus, Wiederholen-Aktion und Konfliktanzeige werden jedoch ausschließlich bei `editing === true` gerendert. Ändert der Kunde einen Punkt und wechselt vor Ablauf der 1,5 Sekunden zurück, bleibt ein anschließender Netzwerkfehler unsichtbar. Bei einem 409 wird sogar der lokale Entwurf gegen den aktuellen Serverstand ausgetauscht und die eigene Fassung separat aufbewahrt, ohne dass auf der sichtbaren Seite die Erklärung oder Wiederherstellung erscheint. Das alte Layout hatte keinen solchen Zustand mit weiterlaufendem, verborgenem Editor.
- **Empfehlung:** Den Speicherstatus des offenen Entwurfs in jeder ausgewählten Runde anzeigen und fehlgeschlagene Speicherung bzw. Konflikte rundenübergreifend zugänglich machen. Dabei klar sagen, auf welche Runde sich der Hinweis bezieht. Vor dem Verlassen warnt der bestehende Hook weiterhin; ein zwangsläufiger stiller Datenverlust wird hier ausdrücklich nicht behauptet.

### F03 · P2 · E2E-Test für Freigabe ohne Änderungen hat einen mehrdeutigen Locator

- **Fundstelle:** `apps/workspace/e2e/portal-feedback.e2e.ts:451`; neues Markup in `apps/workspace/src/components/portal/feedback/feedback-round-head/feedback-round-head.tsx:90` und `apps/workspace/src/components/portal/feedback/feedback-round-notice/feedback-round-notice.tsx:62`.
- **Problem und Auswirkung:** Nach erfolgreicher Freigabe enthält die Hauptansicht zweimal „Abgenommen am …“: einmal als Datum im Rundenkopf und einmal als Titel des Statushinweises. Der letzte E2E-Fall erwartet weiterhin `getByRole("main").getByText(/Abgenommen am/).toBeVisible()`. Dieser Locator ist im neuen Markup nicht eindeutig und scheitert im Strict-Modus. Im vorherigen E2E-Fall wurde dieselbe Stelle bereits mit `.first()` angepasst; dieser Fall blieb stehen.
- **Empfehlung:** Die Abnahme semantisch über die konkrete Statusüberschrift prüfen, beispielsweise mit `getByRole("heading", { name: /Abgenommen am/ })`, und den vollständigen seriellen Feedback-Flow laufen lassen. Der Fehler ist aus Locator und Renderpfaden belegbar; der authentifizierte E2E wurde in diesem Review nicht ausgeführt.

### F04 · P2 · Neuer Kontakt-Contract liegt außerhalb von `common`

- **Fundstelle:** `apps/workspace/src/server/shared/services/project-responsible-member-types.ts:9` (`ProjectResponsibleContact`).
- **Problem und Auswirkung:** Der neue exportierte Contract enthält ausschließlich `displayName` und `email` als Strings. Er enthält weder DB-Typen noch Server-only-Imports, wird aber in einer serverseitigen Sammeldatei ergänzt. Damit erweitert das Changeset die bestehende Ausnahmeablage um einen weiteren gewöhnlichen Contract; die zentrale Contract-Struktur wird umgangen.
- **Regelbezug:** Root-`AGENTS.md`, „Export entscheidet über den Ort von Typen/Konstanten/Patterns“; `apps/workspace/src/server/AGENTS.md`, „Typen-Regel“ erlaubt lokale `*-types.ts` für rein serverseitige Typen mit Server-only-/DB-Abhängigkeiten.
- **Empfehlung:** Den neuen Contract als eigene Datei unter `apps/workspace/src/common/contracts/` ablegen oder einen passenden vorhandenen Kontakt-Contract verwenden. Der bereits vorhandene `ProjectBookingContact` ist ein Altbestand und wird hier nicht als neu eingeführter Fehler gewertet.

### F05 · P3 · History-Wechsel vor der ersten UI-Navigation setzt weder Fokus noch Scroll zurück

- **Fundstelle:** `apps/workspace/src/hooks/portal/use-feedback-round-navigation.ts:19` und `:27`.
- **Problem und Auswirkung:** `navigated` wird nur durch `goTo` gesetzt. Nach einem Reload auf einer URL mit Rundenauswahl bleibt es `false`; wechselt der Nutzer anschließend über Browser-Zurück/Vorwärts auf eine andere Runde derselben Seite, ändert sich `current`, aber der Effekt kehrt weiterhin sofort zurück. Die neue Runde beginnt daher nicht verlässlich am Anfang und ihre Überschrift erhält keinen Fokus. Das betrifft insbesondere Tastatur- und Screenreader-Nutzung und weicht vom zugesagten Verhalten der Runden-Navigation ab.
- **Regelbezug:** `apps/workspace/src/components/portal/AGENTS.md`, „Feedbackbogen“: Ein Wechsel setzt Scrollbereich und Fokus zurück.
- **Empfehlung:** Das erstmalige Laden von einem tatsächlichen Wechsel des effektiven Rundenschlüssels unterscheiden. Nach dem Mount muss jede Änderung der angezeigten Runde die Navigationseffekte auslösen, unabhängig davon, ob sie aus `goTo` oder `popstate` stammt.

### F06 · P3 · Auswahl der navigierbaren Runden ist in Editor und Reader dupliziert

- **Fundstelle:** `apps/workspace/src/components/portal/feedback/feedback-editor/feedback-editor.tsx:79` und `apps/workspace/src/components/portal/feedback/feedback-reader/feedback-reader.tsx:66`.
- **Problem und Auswirkung:** Beide Komponenten berechnen dieselben Schritte und führen denselben `filter`-/`map`-Block für `selectable` aus. Damit wird die Regel, welche Schritte die URL-Navigation öffnen darf, bereits an zwei Stellen gepflegt. Bei einer Erweiterung der Schrittarten können Editor und Reader auseinanderlaufen, obwohl beide dieselbe Navigation verwenden.
- **Regelbezug:** Root-`AGENTS.md`, „Keine Logik-Duplikate“ verlangt die Extraktion auch bei duplizierten Mapping-Blöcken.
- **Empfehlung:** Die Ableitung der navigierbaren Nummern einmal unter `common/patterns/portal/feedback-round-steps.ts` anbieten oder die Ableitung im gemeinsamen Navigations-Hook kapseln. Die unterschiedlichen Startwerte von Editor und Reader bleiben Parameter.

## Besonders geprüfte Logik

- **Schreibrechte und Kundentrennung:** Die neue UI verwendet weiterhin `canSubmit`/`canAttach`; die Owner-Sicht gelangt in den Reader. Die unveränderten Schreibpfade verlangen einen Portal-Actor und prüfen Kundenbindung, Projektsichtbarkeit und Schreibrecht unter Rundensperre. Keine neue Umgehung durch die Runden-URL gefunden.
- **Autosave, Einreichen und Freigeben:** `finish` wartet weiterhin `flush()` ab und sendet danach die aktuelle Version. Aktive Uploads blockieren das Einreichen. Konflikte, Pflichttextfehler und gesperrte Runden werden weiter über dieselben Ergebnisarten behandelt. Der neue Editor hält den Draft außerhalb der beim Rundenwechsel unmounteten Ansicht; Texte bleiben dadurch beim Blick zurück erhalten. F01/F02 betreffen den ergänzten Lebenszyklus und dessen Sichtbarkeit.
- **Endgültige Abnahme:** Reader bietet sie nur für die neueste abgeschlossene Runde ohne aktive Runde und mit Schreibrecht an. Der Server prüft weiterhin Pflichtbestätigung, Status, Version und neueste Runde; bei Abnahme aus `completed` bleibt die zusätzliche Projektsperre erhalten. Keine neue fachliche Änderung an diesen Invarianten festgestellt.
- **Ansprechpartner:** Der neue Leseweg bevorzugt den aktiven Projekt-Owner, danach den aktiven Kunden-Owner. Der Kalender darf weiterhin von der anderen aktiven Person kommen, wenn der erste Owner keinen Link anbietet. Das entspricht der dokumentierten Regel. `findActiveMemberId` und dessen Sperre wurden nicht geändert. Die zusätzliche Kontaktadresse wird nicht zur Autorisierung verwendet.
- **Datenminimierung:** Der Service selektiert die E-Mail intern; `findBookingContact` gibt sie nicht versehentlich an seine bestehenden Aufrufer weiter. Die neue Feedback-Query läuft erst nach der bisherigen projekt- und kundengebundenen Leseprüfung.
- **Schritte und Status:** Enthaltene, zusätzliche und nach Abnahme entfallene Runden werden berücksichtigt. Nicht verfügbare Schritte rendern keinen Button; das zentrale `ProcessTrack` behält sein bisheriges Verhalten für andere Nutzer. Rundenstatus wird zusätzlich zu Farbe textlich vermittelt.
- **Onboarding:** Die Extraktion von URL-Snapshot und Schritt-Komponenten erhält dessen bisherige Parameterbehandlung. Keine zurückgebliebenen Quellcode-Imports der entfernten Komponenten oder des alten Event-Moduls gefunden.
- **UI/i18n:** Beide Feedback-Dictionaries und ihre geänderten Keys geprüft; sichtbare Formularlabels, Fehlermeldungsbindung, Icon-Beschriftungen, externe Vorschau-Links, Anbieterhinweis, Theme-Tokens und responsive CSS berücksichtigt. Kalender bleiben externe Links ohne neu eingeführtes Embed.

## Abdeckung

Vollständig gelesen wurden die betroffenen aktuellen Produktionsdateien und Tests in folgenden Gruppen, einschließlich neuer Dateien, CSS Modules und der entfernten Komponenten aus HEAD:

- Feedback: `feedback-page-view`, `feedback-editor`, `feedback-reader`, `feedback-page-frame`, `feedback-round-head`, `feedback-round-notice`, `feedback-round-step`, `feedback-round-track`, `feedback-state-notice`, `feedback-contact-ways`, `feedback-sheet`, `feedback-item-editor`, `feedback-item-list`, `feedback-item-attachments`, `feedback-final-approval`, `feedback-quota-notice`; Dialoge ebenfalls geprüft, auch soweit ihre Änderungen gegenüber HEAD bereits aufgehoben waren.
- Gemeinsame Portal-Schritte: `portal-step-bar`, `portal-step-frame`, `portal-step-header`, `portal-step-heading`; sämtliche drei angepassten Onboarding-Komponenten und die beiden neuen Navigations-Hooks sowie `use-portal-onboarding-step`.
- Contracts/Patterns/Konstanten: Runden-Schrittmodell und Tests, Query-Parameter, Event-Umbenennung und Konstantentests; `PortalProjectFeedbackDto`, `ProcessTrackStep`; Feedback-Dictionaries DE/EN.
- Server/Pakete: Feedback-Query, Verantwortlichen-Service und Typdatei; `ProcessTrack` samt Styles und Tests.
- Tests/Dokumentation: geänderter Route-Test, Feedback-View- und Quota-Tests, kompletter Feedback-E2E sowie der Redesign-Plan und geänderte Scope-Regeln. Geltende AGENTS-/CLAUDE-Dateien berücksichtigt; CLAUDE-Dateien verweisen hier auf AGENTS.

Zusätzlich zur Einordnung gelesen: Feedback-Route, Autosave- und Leave-Warning-Hooks, gemeinsames Upload-Feld, API-Service, Save-/Submit-/Approve-Handler, Feedback-Service und DTO-Mapper, Projekt-Sichtbarkeitsfilter, Kalender-Link/-Hinweis und deren Mapper, `DraftSaveStatus`, Portal-Shell-Styles. Angrenzende Datenbank-Integrationstests wurden gezielt auf vorhandene Absicherung von Kontaktfallbacks und Feedback-Invarianten untersucht; dies ist kein vollständiges Review aller bestehenden Integrations- und Persistenzdateien.

## Ausgeführte Prüfungen

| Prüfung                                                                                                    | Ergebnis                                                                                        |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Workspace: Feedback-Komponenten, Runden-Pattern, Portal-Konstanten und vorhandener Onboarding-Schritt-Test | 22 Dateien, 52 Tests grün                                                                       |
| Workspace: ergänzende Onboarding-Komponenten, Schritt-Hook, Feedback-API-/Schema-/Mapping-Tests            | 9 Dateien, 102 Tests grün                                                                       |
| UI-Paket: `process-track.test.tsx`                                                                         | 10 Tests grün                                                                                   |
| Typecheck: Workspace, UI, Common                                                                           | Alle grün                                                                                       |
| Lint: Workspace                                                                                            | Exit 0; eine Warnung in unverändertem `update-project.command-handler.test.ts:189` (`_omitted`) |
| Lint: UI                                                                                                   | Exit 0; Konfigurationshinweis zu fehlendem Next-`pages`-Verzeichnis im UI-Paket                 |
| `git diff --check HEAD`                                                                                    | Keine Whitespace-Fehler; Git meldet LF/CRLF-Konvertierungshinweise                              |

Die beiden Workspace-Testläufe überlappen beim Onboarding-Schritt-Test; ihre Testzahlen sind nicht als Anzahl unterschiedlicher Tests zu addieren. Die ersten Teststarts scheiterten an Sandbox-`spawn EPERM`; die Wiederholungen außerhalb der Sandbox waren erfolgreich.

Eine isolierte Chromium-Sichtprüfung mit den tatsächlichen `PortalStepFrame`-Styles zeigte, dass Chromium einen sonst nicht interaktiven Scrollbereich per Tab fokussiert. Der vermutete grundsätzlich unzugängliche Scrollbereich wurde deshalb verworfen. Das war eine reduzierte Layoutprüfung ohne App, Auth oder Datenbank, kein visueller Abnahmetest des Portals.

## Offene Prüfungen und Grenzen

- Kein authentifizierter Portal-E2E und keine Datenbank-Smokes ausgeführt: Diese bestehenden Tests legen Daten an und ändern fachliche Zustände. Die grüne Testausgabe oben stammt aus Unit-/Komponententests, nicht aus echten Session-/DB-Prüfungen.
- Der neue `findContact`-Weg und das neue zusammengesetzte `contact`-Feld besitzen im Changeset keine gezielten serverseitigen Verhaltenstests. Vor Freigabe sollten aktiver/inaktiver Projekt- und Kunden-Owner, verschiedene Mail-/Kalender-Ansprechpartner und fehlender Kontakt gegen eine isolierte Testdatenbank abgesichert werden. Bestehende Onboarding-Integrationstests decken Teile der Kalenderfallbacks ab, wurden hier jedoch nicht ausgeführt.
- Vollständige Sichtprüfung in Dark/Light auf Desktop und Mobil, mobile Tastatur, Safari/WebKit, Kontrastmessung und Zoom bleiben offen. Auch der Redesign-Plan nennt Sichtprüfung und E2E noch als offen. Keine Lighthouse-/CWV-Freigabe behauptet.
- Kein App-Build und keine vollständigen monorepo-weiten Merge-Gates ausgeführt. Der geänderte Route-Test wurde gelesen, aber nicht separat ausgeführt.
- Keine Secrets, lokalen Secret-Dateien, Binärartefakte oder Dependencies als Review-Quellumfang gelesen. Produktivcode, Tests, Skills und Projektregeln wurden nicht verändert; einzig dieser Bericht wurde angelegt.

## Vorschläge zur Skill-Verbesserung

Keine zusätzliche Regel erforderlich. History-Navigation, asynchrone Zustände, Unmount-Verhalten, A11y, Testlücken und Contract-Ablage werden vom bestehenden Review-Skill bereits abgedeckt. Der Skill bleibt unverändert.

Für die ergänzende UI-Prüfung wurden die aktuellen [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) herangezogen; die Findings oben beruhen jeweils auf den angegebenen Projektdateien.

## Korrekturstand · 16.10.2026

Alle sechs Findings sind umgesetzt:

- **F01:** Die offene Runde bleibt beim Lesen früherer Runden mit ihren Upload-Feldern eingebunden und ist über `hidden` vollständig ausgeblendet. Laufende Uploads werden durch den Rundenwechsel nicht mehr abgebrochen. Ein gezielter Regressionstest prüft denselben weiterhin eingebundenen Eingabeknoten, ausbleibende Upload-Abbrüche und die weiterhin gesperrte Einreichen-Aktion nach History- und Stepper-Wechseln.
- **F02:** `DraftSaveStatus` bleibt unabhängig von der gewählten Runde in der Fußleiste. Konflikte stehen außerhalb der ausgeblendeten Runde. Beide Hinweise nennen beim Lesen früherer Runden die betroffene offene Runde. Neue Tests prüfen fehlgeschlagenen Autosave mit Wiederholung und einen 409 mit Wiederherstellung der eigenen Fassung während des Lesens einer früheren Runde.
- **F03:** Beide Abnahme-Prüfungen auf der Feedback-Seite verwenden eine eindeutige Statusüberschrift statt einer mehrdeutigen Textsuche.
- **F04:** `ProjectResponsibleContact` liegt jetzt als eigener Contract unter `apps/workspace/src/common/contracts/crm/project-responsible-contact.ts`; der Service importiert ihn von dort.
- **F05:** Der Fokus-/Scroll-Effekt vergleicht die tatsächlich ausgewählte Runde statt eines nur durch UI-Klicks gesetzten Flags. Ein Test nutzt echtes `history.back()`/`forward()`. Der echte E2E deckte zusätzlich auf, dass Next.js nach Reload eine Seite beim History-Wechsel neu aufbauen kann. `usePortalStepSearch` behandelt deshalb reine Änderungen seiner expliziten lokalen Schrittparameter selbst vor der Router-Restaurierung. Änderungen anderer Query-Parameter, des Hashs oder des Pfads bleiben dem Router überlassen; die Abgrenzung ist getestet. So bleiben auch Entwürfe und Uploads bei dieser Variante des Rundenwechsels eingebunden.
- **F06:** Die Auswahl navigierbarer Runden wird einmal im gemeinsamen Navigations-Hook aus den Schritteinträgen abgeleitet. Die beiden kopierten Filter-/Mapping-Blöcke entfallen.

Nachprüfung:

- Vollständiger sequenzieller Monorepo-Testlauf: **5.369 Tests bestanden**; **477 DB-/Integrationstests gemäß Konfiguration übersprungen**. Ein vorheriger Lauf hatte unter paralleler Build-Last einen Timeout in einem unveränderten Web-Kontaktformular-Test; der vollständige Wiederholungslauf war grün.
- Nach der abschließenden Anpassung der gemeinsamen History-Behandlung: **127 gezielte Feedback-/Onboarding-/API-Tests bestanden**, einschließlich der neuen Regressionstests und der Abgrenzung von lokalen Schritten gegenüber Server-Query-/Routenwechseln.
- Monorepo-Lint und Monorepo-Typecheck grün; nach der abschließenden Hook-Anpassung zusätzlich Workspace-Lint und -Typecheck erneut grün. Die bereits genannten Warnungen bestehen unverändert.
- Workspace-Produktionsbuild erfolgreich; der E2E-Runner baut zusätzlich mit den geprüften Entwicklungszugangsdaten. Der bekannte Turbopack-Hinweis zum breiten Dateimuster in `packages/db/src/core/env.ts` bleibt bestehen.
- Authentifizierter Feedback-E2E: **4 Tests bestanden**, einschließlich Setup, zwei parallelen Kontakten, Verarbeitung/Zurückgabe, Reload mit interaktivem Formular und Zurück/Vorwärts sowie beiden Abnahmewegen. Die ergänzte History-Prüfung wartet nach Reload auf eine erfolgreiche Formularinteraktion, bevor sie den Schrittwechsel auslöst.

Die abschließende Browser-Prüfung ohne Diagnoseinstrumentierung war ebenfalls vollständig grün (4 Tests, 51,8 Sekunden). Der Fokuswechsel wartet auf die bestätigte Synchronisierung der Router-URL, damit ein noch ausstehender Router-Commit keine direkt folgende History-Navigation überschreibt. Temporäre Diagnoseausgaben sind entfernt.

Die Entwicklerumgebung für den E2E wird vom vorhandenen Repository-Guard gegen die freigegebene Datenbankidentität sowie gegen Preview und Produktion geprüft. Es wurden keine neuen Env-Variablen oder Dependencies eingeführt.
