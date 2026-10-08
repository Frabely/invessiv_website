# Portal-E2E: Ursachen und Merge-Bewertung

Stand: `feat/crm-credentials-2-portal`, Commit `b2887340`; lokale Änderungen an drei Unit-Testdateien und der Merge-Checkliste. Umfang: die vier Fehler des unmittelbar vorher ausgeführten Portal-E2E-Laufs. Kein erneutes vollständiges Feature-Review, keine Codeänderungen.

## Gesamturteil

Die vier Fehler treten weiterhin auf: 9 Tests bestanden (inklusive Setup), 4 fehlgeschlagen, 5 Folgetests nicht ausgeführt. Credentials, Portalzugang und Aufgaben bestanden.

Drei Fehler sind durch veraltete Testannahmen direkt erklärbar; Feedback hat einen bestätigten Locator-Fehler. Eine durch Task 71 verursachte Produktregression ist damit nicht belegt. Die Suite bleibt dennoch ein offenes Merge-Gate: Ihre abgebrochenen Abläufe sind nicht vollständig validiert. Erst Testkorrekturen und ein vollständiger erfolgreicher Lauf schließen das Gate; die grüne Credentials-Prüfung allein reicht dafür nicht.

## F01 · P2 · Responsive-Test prüft den geschlossenen Mobilhinweis

- **Fundstelle:** `e2e/portal-dashboard.e2e.ts:47`; `src/components/portal/portal-shell/portal-shell.module.css:143`, `portal-shell.tsx:128` und `:141`.
- **Ursache:** Unter 768 px wird der Header-Slot mit dem Owner-Hinweis ausgeblendet. Das mobile Menü enthält denselben Hinweis, wird vom Test aber nicht geöffnet. Der Test erwartet weiterhin den sichtbaren Headertext bei 360 px.
- **Bewertung:** Veraltete Testannahme gegenüber der bestehenden mobilen Navigation. Kein Nachweis eines verschwundenen Owner-Hinweises oder einer Credentials-Regression. Die Shell-Dateien wurden zwischen `bb0fb6c2` und `b2887340` nicht geändert.
- **Empfehlung:** Auf Mobil das Menü öffnen und darin den Owner-Hinweis prüfen; Desktop/Tablet weiterhin im Header prüfen. Nach dem Schließen Dashboard und Überlauf gesondert prüfen.

## F02 · P2 · Feedback-Locator ist nicht eindeutig

- **Fundstelle:** `e2e/portal-feedback.e2e.ts:93`; `src/components/portal/feedback/feedback-page-view/feedback-page-view.tsx:114`.
- **Ursache:** `getByText("Feedbackrunde 1 von 2")` trifft im Fehlerlauf zwei H2-Elemente. Playwright bricht bereits wegen Strict Mode ab. Im Quellcode existiert nur eine Einbindung von `FeedbackRoundIntro`.
- **Bewertung:** Der Locator-Fehler ist bestätigt. Ob die zweite Instanz ausschließlich aus einem temporären Next-Streaming-Fragment stammt, ist ohne genauere Trace-Auswertung nicht abschließend belegt. Daraus lässt sich keine fachliche Feedback-Störung ableiten. Die betreffenden Test- und Intro/View-Dateien liegen außerhalb der Credentials-Änderung.
- **Empfehlung:** Sichtbare zugängliche Überschrift im relevanten Seitenbereich eindeutig adressieren und anschließend den gesamten seriellen Feedback-Flow ausführen. Nicht blind einen beliebigen Treffer auswählen, wenn beide sichtbar sind.

## F03 · P2 · Dateien-Test überspringt das Aufklappen

- **Fundstelle:** `e2e/portal-files.e2e.ts:35`; `src/components/workspace/crm/files/customer-files-section/customer-files-section.tsx:168` und `:306`; `src/components/workspace/crm/shared/collapsible-section/collapsible-section.tsx:31`.
- **Ursache:** Der Dateienabschnitt startet standardmäßig eingeklappt. „Link hinzufügen“ liegt im nur bei Expansion gerenderten Körper. Der Fehler-Snapshot zeigt ausdrücklich „Dateien & Links ausklappen“, aber der Test sucht direkt nach dem Link-Button.
- **Bewertung:** Fehlender Vorbereitungsschritt im Test, kein belegter Rechte- oder API-Fehler. Dateienabschnitt und Test wurden durch Task 71 nicht geändert. Die Links, Anhänge und Downloads werden wegen dieses frühen Abbruchs noch nicht validiert.
- **Empfehlung:** Den kundenweiten Dateienabschnitt gezielt aufklappen, danach Linkanlage prüfen. Weitere betroffene interne Einstiegspunkte derselben Suite berücksichtigen.

## F04 · P2 · Onboarding-Test prüft das falsche Projekt

- **Fundstelle:** `e2e/portal-onboarding.e2e.ts:179–181`; `src/app/[locale]/(portal)/portal/[customerId]/page.tsx:74–83` und `:110`; `src/common/patterns/portal/select-portal-current-project.ts:10`.
- **Ursache:** Das Fixture hat mehrere aktive Projekte derselben Firma. Der Test legt den Bogen an `fixture.onboardingProject` an, ruft das Dashboard aber ohne Projektauswahl auf. Das Dashboard wählt das erste aktuelle Projekt und lädt ausschließlich dessen Onboarding-Widget. Der Snapshot zeigt „Feedback-Website“ statt „Onboarding-Website“.
- **Bewertung:** Falscher Testkontext; das Fehlen eines Onboarding-Widgets für das andere Projekt entspricht der Implementierung. Die Projektauswahl und die Bindung des Widgets bestanden bereits vor Task 71. Auch die spätere Rückkehr ins Dashboard nach der Nachforderung benötigt denselben Projektkontext.
- **Empfehlung:** Beim Dashboardaufruf bzw. über den Projektwechsler das Onboarding-Projekt explizit auswählen und erst danach den Widget-Status prüfen.

## Prüfungen, Architektur und Grenzen

- Grundlage: tatsächlicher E2E-Lauf mit `pnpm --filter @invessiv/workspace test:e2e:portal` vom 08.10.2026; Development-Datenbank-Guard, Migrationen und Development-Build erfolgreich. Kein weiterer Lauf in dieser Ursachenprüfung, keine zusätzlichen Datenänderungen.
- Gelesen: relevante E2E-Einstiege und Fehlerkontexte; Shell und Owner-Banner einschließlich CSS; CollapsibleSection und Dateien-Einstieg; Projektauswahl und Dashboard-/Onboarding-Ladekette; ergänzende Unit-Teststellen und Fixture-Aufbau. Größere Test-/Service-Dateien wurden für diese abgegrenzte Ursachenprüfung an den relevanten Abschnitten gelesen, nicht vollständig neu reviewt.
- Git-Abgleich: die maßgeblichen mobilen Shell-, Collapsible-/Dateien- und Projektauswahlmechanismen sowie die vier betroffenen E2E-Dateien sind gegenüber dem Stand vor Task 71 unverändert. Task 71 ergänzt im Dashboard Credentials; die bestehende Auswahl des Onboarding-Projekts bleibt erhalten.
- Architektur: keine neue Portal-/Workspace-Vermischung als Ursache festgestellt. Die Tests müssen die bestehenden UI- und Projektzustände korrekt herstellen.
- Nicht nachgewiesen: dass die nach den Fehlerstellen liegenden Datei-, Feedback- und Onboarding-Schritte funktionieren. Fünf Folgetests wurden wegen serieller Abhängigkeiten nicht ausgeführt. Der optionale reale Blob-Upload benötigt zusätzlich `E2E_LIVE_BLOB=true`; diesen nicht als geprüft werten.
- Artefakte: lokale Screenshots, `error-context.md` und Traces unter `apps/workspace/test-results/`; keine Auth-States oder Secrets im Bericht.
- Keine Skill-Ergänzung erforderlich: Locator-Eindeutigkeit, UI-Zustände und Testkontext sind bereits durch die bestehenden Review-Schwerpunkte abgedeckt.
