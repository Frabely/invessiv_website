# Branch-Review — Vercel Analytics v2

Stand: 22.10.2026. Branch `feat/vercel-analytics-v2`, HEAD `1b843d53e323fcc4437506c440b86e4de6de237a`,
Vergleich mit `master` / `b5b3dc151b08681326ee1554ceb891c234c27fe7`.
Arbeitsbaum zu Reviewbeginn sauber. Produktivcode nicht geändert.

## Ergebnis

**Noch nicht vollständig abnahmefähig.** Neun konkrete Findings: ein P1 und acht P2.
Die üblichen Klick-/Formularabläufe sind deutlich besser abgedeckt, aber einzelne Interaktionen fehlen,
ein Hook verliert unter einem Timer-Randfall sein Ereignis, und die serverseitige Messung umgeht Teile des
im Client implementierten Datenschutz-/Opt-out-Verhaltens.

P1 = vor Merge beheben; P2 = relevante Mess-/Auswertungsfehler, vor produktiver Analytics-Abnahme beheben.
Keine Behauptung, dass alle neun Probleme neue UI-Regressionen sind: Einige sind weiterhin offene Lücken
gegen den beanspruchten vollständigen Trackingumfang. Die neue Vercel-Anbindung macht die beschriebenen
Generator-Ereignisse und serverseitigen Effekte erstmals relevant für diese Auswertung.

## F1 — P1: Der Server-URL-Schutz wird vom tatsächlichen SDK umgangen

**Fundstelle:** `src/server/services/analytics/server-analytics-service.ts:45`, insbesondere Übergabe des
bereinigten `referer` in `pickAnalyticsHeaders` (Zeilen 17–37).

Das lokal installierte `@vercel/analytics` 2.0.1 verwendet im Servertransport für `body.o` zuerst
`requestContext.url` und erst danach `headers.referer`. Im Vercel-Requestkontext ist dadurch die URL des
API-Requests maßgeblich. Der bereinigte Seiten-Referrer überschreibt sie nicht. Ein Queryparameter an
einem gültigen Formular-POST kann somit ungefiltert in Analytics landen; die Client-`beforeSend`-Prüfung
greift hier überhaupt nicht. Auch die im Servicekommentar versprochene Seitenzuordnung ist so nicht gewährleistet.

**Reproduktion:** echtes installiertes SDK mit synthetischem Vercel-Kontext und gemocktem `fetch`, keine
Netzwerkanfrage. Kontext-URL `https://review.example/api/contact?email=synthetic-test`, übergebener sauberer
Referrer `https://review.example/de?utm_source=linkedin`. Gesendetes `body.o` war unverändert die API-URL
einschließlich `email`. Das beweist den SDK-Vorrang; der reale Deploymentkontext ist zusätzlich live zu prüfen.

**Behebung:** tatsächlichen Transport/Requestkontext in die Schutzgrenze einbeziehen. Bis zur sicheren
SDK-seitigen Lösung sensible Request-URLs vor dem Tracking ablehnen; auch normale API-URL-/Seitenattribution
bewusst definieren. Keine globale Mutation des Vercel-Kontexts als nebenläufigkeitsunsicheren Workaround.
Transporttest mit echtem SDK und gemocktem HTTP statt ausschließlich gemocktem `track` ergänzen.

## F2 — P2: „Eigene Geräte ausschließen“ unterdrückt keine Server-Leads

**Fundstellen:** `src/lib/analytics/analytics-before-send.ts:12`,
`src/server/services/analytics/server-analytics-service.ts:60`,
`src/components/marketing/home/sections/contact-section/contact-form/contact-form.tsx:220`.

`?analytics=off` setzt ausschließlich `localStorage`; nur `beforeSend` wertet dies aus. Die Formularrequests
übermitteln keinen Ausschlusszustand. Nach jeder erfolgreichen Speicherung sendet der Server trotzdem
`lead_created`. Eigene Testanfragen erscheinen damit weiterhin in der als maßgeblich beschriebenen Lead-Zahl,
während ihre Client-Events fehlen. Das betrifft auch die Erläuterung im Auswertungsleitfaden, eigene Geräte
seien ausgeschlossen.

**Behebung:** datensparsamen, ausschließlich telemetrybezogenen Opt-out-Zustand an den Server übertragen
und dort berücksichtigen. Dieser darf niemals Speicherung oder Spam-/Berechtigungsprüfungen ändern.
Alternativ den Ausschluss bewusst als nur clientseitig dokumentieren und Test-Leads separat zuverlässig
aus der KPI ausschließen. Positiv-/Negativtest über den echten Submissionpfad ergänzen.

## F3 — P2: `usePageEngagementTracking` kann sein Event dauerhaft verlieren

**Fundstelle:** `src/hooks/analytics/use-page-engagement-tracking.ts:20` und `:26`.

`pause()` zieht die verstrichene Zeit ab und löscht den Timer. Wenn der Timer nach 30 Sekunden zwar fällig,
aber wegen verzögertem Eventloop noch nicht ausgeführt ist, kann ein Visibility-Wechsel vorher `pause()`
auslösen. `remainingMs` wird null oder negativ. Bei der Rückkehr beendet `resume()` sich dann wegen
`remainingMs <= 0`, obwohl noch kein Event gesendet wurde. Auch bei weiterem minutenlangem Lesen fehlt
`page_engaged` dauerhaft.

**Reproduziert:** Hook sichtbar starten; Uhr auf 31 Sekunden setzen, ohne Timer auszuführen; hidden → visible;
weitere 60 Sekunden Timer ausführen. Null Events statt eines. Das simuliert eine verzögerte Timerzustellung,
keinen normalen pünktlichen Timerablauf.

**Behebung:** „Zeit erreicht“ und „bereits gesendet“ getrennt speichern, monotone Zeit verwenden und bei
erreichtem Budget kontrolliert genau einmal abschließen. Regressionstest für den beschriebenen Ablauf.

## F4 — P2: Landingpage-FAQs senden kein `faq_opened`

**Fundstelle:** `src/components/marketing/landing/faq-section/faq-section.tsx:72`.

Die nativen `details`/`summary` besitzen weder einen Öffnungs-Handler noch passende Analytics-Attribute.
Getrackt werden dort nur Antwortlinks und der Abschluss-CTA. `faq_opened` existiert auf der Startseite,
aber nicht für diese Landingpage. Eine Filterung nach der Landingpage liefert damit ein falsches Bild
fehlenden Interesses an FAQ-Inhalten.

**Reproduziert:** tatsächliche `FaqSection` zusammen mit `AnalyticsClickTracker` rendern, Summary klicken
und geöffnetes `details` toggeln: kein Event.

**Behebung:** tatsächlichen Zustandswechsel auf geöffnet messen, stabile sprachunabhängige Fragekennung
verwenden. Schließen nicht mitzählen; Maus und Tastatur sowie „mehr Fragen“ testen.

## F5 — P2: Generator-Validierungsfehler verschwinden aus der Fehlerauswertung

**Fundstelle:** `src/components/marketing/linkedin-post/generator-section/generator-section.tsx:232`.

`generator_step=submit` wird vor Validierung gesendet. Bei leerem/ungültigem Thema oder Tätigkeitsfeld
setzt der Code danach nur Feldfehler und kehrt zurück. `step=error` wird ausschließlich für spätere
Limit-/API-/Netzwerkprobleme gesendet. Der Versuch hat somit weder Erfolg noch ein messbares Fehlerergebnis.

**Reproduziert:** leeres Generatorformular absenden. Genau ein `submit`, kein `error`.

**Behebung:** kontrollierte Fehlerklasse wie `validation` senden, ohne Feldinhalt. Ein Vorgang darf nicht
zusätzlich vom Button als zweiter Submit gezählt werden; die bereits entfernten CTA-Attribute beibehalten.

## F6 — P2: Verspätete Generatorantworten werden nach Seitenwechsel weiter getrackt

**Fundstelle:** `src/components/marketing/linkedin-post/generator-section/generator-section.tsx:256`.

Der asynchrone Ablauf besitzt keinen Abbruch-/Unmount-Schutz. Nach Verlassen der Generatorseite laufen
die `trackAnalyticsEvent`-Aufrufe in Catch/Fehler/Erfolg weiter. Bei clientseitiger Navigation ist die neue
Seite bereits aktiv, sodass ein Generatorergebnis unter deren Kontext auftauchen kann. Ein nicht mehr
angezeigtes Ergebnis wird trotzdem als Client-Erfolg erfasst.

**Reproduziert:** gültige Eingabe, noch offene Submit-Promise, Komponente unmounten, Request anschließend
ablehnen. Trotzdem entsteht `generator_step {step:error,reason:network}`. Die Erfolgspfade haben denselben
fehlenden Schutz. Kein realer OpenAI-Aufruf nötig.

**Behebung:** Request abbrechen oder Lebenszyklus/Requestgeneration prüfen; nach Unmount keine
UI-Ergebnisereignisse mehr senden. Soll serverseitig jede Generierung gezählt werden, dafür ein eigenes
fachliches Event mit klarer Semantik verwenden. Analogen Schutz beim Kontaktformular mitprüfen.

## F7 — P2: Die direkten Generator-zu-Kontakt-CTAs sind nicht instrumentiert

**Fundstellen:** `src/components/marketing/linkedin-post/generator-section/success-preview.tsx:103`,
`src/components/marketing/linkedin-post/generator-section/limit-reached-preview/limit-reached-preview.tsx`.

Die prominenten Follow-up-Links nach erfolgreicher Generierung und nach erreichtem Limit haben nur
`onRequestCustomWorkflow`. Dieser Handler setzt ein Vorbefüllungs-Event und löst kein Analytics-Event aus.
Analytics-Attribute fehlen ebenfalls. Gerade der Übergang, der die Frage „führt der Generator zu
Kontaktinteresse?“ direkt beantworten könnte, wird im CTA-Ranking nicht sichtbar.

**Behebung:** eigene stabile CTA-IDs für Ergebnis und Limit ergänzen und den vorhandenen zentralen
Klicktracker verwenden. Vorbefüllung erhalten; kein zusätzliches zweites Event im onClick-Handler.

## F8 — P2: Mittelklick auf Links wird vollständig übersehen

**Fundstelle:** `src/components/shared/analytics/analytics-click-tracker/analytics-click-tracker.tsx:46`.

Der zentrale Tracker hört ausschließlich auf `click`. Ein Mittelklick zum Öffnen von Referenz-/Leistungslinks
in einem neuen Tab erzeugt `auxclick` und kein entsprechendes `click`. Die Navigation findet statt, das
zugehörige CTA-/Referenzereignis fehlt. Strg-/Cmd-Linksklick ist davon zu unterscheiden und läuft über `click`.

**Reproduziert:** registrierter Referenzlink mit `auxclick`, `button=1`: null Events.

**Behebung:** `auxclick` ausschließlich für Mitteltaste und echte Links ergänzen; Rechtsklick und normale
Buttons ausschließen. Linksklick, Tastatur, Strg-/Cmd-Klick und Mittelklick müssen jeweils genau einmal zählen.

## F9 — P2: Die dokumentierte „Abbruchquote“ kann negativ werden

**Fundstellen:** `plans/analytics/auswertung.md:57`, `plans/analytics/vercel-analytics-umbau.md:123`.

Ein Start wird pro Formularversuch einmal gezählt, Absendeversuche dagegen bei jeder Validierung/Retry.
Eine Person mit einem Start und drei Absendeversuchen ergibt nach der dokumentierten Rechnung
`1 - 3/1 = -200 %`. Ein direktes ungültiges Absenden kann sogar einen Versuch ohne Start erzeugen.
Filter auf `form=discovery_call` passen außerdem nicht zu `form_started`, das `form=contact` verwendet.
Die Differenz Server-Leads zu Client-Erfolgen ist auch kein messbarer Adblocker-Anteil: Opt-out, Navigation,
Transportverluste und Lifecycle-/Prefillfehler wirken ebenfalls hinein.

**Behebung:** Versuchsquote und Besucherquote getrennt beschreiben; keine personenbezogene Abbruchquote
aus unvereinbaren Aggregaten ableiten. Für besucherbasierte Näherungen denselben Zeitraum, Seitenfilter
und Visitors statt Total nutzen und Grenzen klar benennen. Tatsächliche Lead-Zahl aus der DB gegenprüfen;
ein best-effort Analytics-Event ist kein dauerhaft garantiertes Buchungsjournal.

## Geprüfte Hooks und Doppelzählungen ohne bestätigtes Finding

- `useSectionReachTracking`: ein Timer pro ID, gemeinsamer Timer für beide Observer, Abbruch bei hidden,
  Cleanup und Deduplizierung über Effect-Neustarts vorhanden. Die vorhandenen Tests decken diese Normalfälle ab.
- `usePageEngagementTracking`: normale Pause/Fortsetzung und einmalige Meldung funktionieren; Sonderfall F3 bleibt.
- `useContactFormStartTracking`: Ref verhindert wiederholten Start pro Eingabephase; Reset nach erfolgreichem
  Abschluss vorhanden. Formularstart wird inzwischen an `onInput` gebunden.
- `useContactFormAnalytics`: keine eigenen Effekte/Listener, stabile Callbacks; Formular-Submit ist nicht zugleich
  als zusätzlicher CTA markiert. Normale gültige und ungültige Abläufe zählen nicht pauschal doppelt.
- `AnalyticsClickTracker`: ein Capture-Listener mit Cleanup; `closest` nimmt genau das nächste markierte Element.
- Auswahlbuttons entfernen Trackingattribute für die bereits aktive Auswahl; Startseiten-FAQ zählt nur Öffnen.
- `form_completed` und `lead_created` sind absichtlich unterschiedliche Ereignisse; deren Existenz ist keine
  Doppelzählung, solange sie nicht addiert werden.
- `ResultDownloadCard`: Downloadcallback wird erst nach dem synchronen ZIP-Downloadservice aufgerufen.
- Entfernte Kartenkomponenten/alte Tracker haben keine verbliebenen produktiven Aufrufer.

## Durchgeführte Prüfungen

- Branch-Diff: 135 Dateien; Fokus auf sämtliche geänderten Tracking-Hooks, Adapter, Contracts,
  Client-/Server-Submission und Event-Aufrufstellen. Neue Namen statt frühere Planannahmen verwendet.
- `pnpm --filter @invessiv/web exec vitest run src common`: **123 Dateien, 529 Tests bestanden**.
- `pnpm --filter @invessiv/web typecheck`: bestanden.
- Fünf zusätzliche Review-Probes: **alle fünf erwarteten Schutz-/Vollständigkeitsassertions scheitern**
  und reproduzieren F3, F4, F5, F6 und F8. Kein Installations- oder Mock-Startfehler.
- Echtes Server-SDK mit gemocktem HTTP: F1 reproduziert, keine Daten an Vercel gesendet.
- Lokales Chromium mit synthetischem DOM und zwei Viewports: Observer-Geometrie geprüft.
  Kein belastbares zusätzliches Finding allein aus der Prozentangabe des rootMargin abgeleitet.
- Keine produktiven Formularanfragen, kein OpenAI-Aufruf, kein Zugriff auf reale Analytics-Daten.
- Kein vollständiger Produktionsbuild/Live-E2E ausgeführt; reale Requestkontexte, Dashboardeingang,
  SDK-Verluste und SPA-/Locale-Navigation bleiben zusätzliche Deployment-Abnahme.

Die Probe-Datei liegt als [inaktive Textdatei](analytics-review-probes.test.tsx.txt) neben diesem Report,
damit die normale Testsuite durch die bewusst fehlschlagenden Reviewtests nicht verändert wird.
Zur Reproduktion temporär `.txt` entfernen und unter `apps/web` mit Vitest ausführen; anschließend zurückbenennen.

## Empfohlene Reihenfolge

1. F1 und F2: tatsächliche Server-Datengrenze und Opt-out.
2. F3 und F6: Lifecycle-/Timerkorrekturen mit Regressionstests.
3. F4, F5, F7, F8: fehlende Interaktionen ergänzen.
4. F9: Auswertungsleitfaden korrigieren; danach echte Events auf dem Deployment kontrolliert nachweisen.

Erst nach diesen Korrekturen ist die Aussage „alle vorgesehenen Interaktionen werden sauber getrackt“
für den untersuchten Umfang gerechtfertigt. Eine allgemeine Vollständigkeitsgarantie für Browseranalytics
ist auch dann wegen Adblockern, Netzwerkfehlern und geschlossenen Tabs nicht möglich.
