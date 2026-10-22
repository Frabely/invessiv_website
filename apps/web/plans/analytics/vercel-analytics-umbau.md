# Plan: Vercel-Analytics-Umbau für invessiv.com (Startseite + Referenzen)

> Status: Phasen 0–6 umgesetzt, ungecommittet auf `feat/vercel-analytics-v2` · Stand: 22.10.2026
> **Stichtag (Production-Deploy):** _noch offen_ — ab diesem Datum im Dashboard auswerten. Auswertung:
> `auswertung.md`.

## Abweichungen in der Umsetzung

- Click-Attribute als Paar `data-analytics-event` + `data-analytics-payload` (JSON) statt `-p1`/`-p2`; erzeugt über
  `analyticsAttributes()` in `common/patterns/analytics/`, damit die Payload typgeprüft ist.
- `form_started` nutzt `form=contact`, weil beim ersten Tippen noch nicht feststeht, ob per Termin oder Mail gesendet
  wird. `form_failed`-Grund `network` entfällt (der Client-Service liefert Netzfehler bereits als `generic`).
- FAQ-Kontakt-Link der Startseite ist `cta_clicked` (`home_faq_contact` → `contact_email`), Antwort-Links in FAQs sind
  `nav_clicked` mit `area=faq`.
- Referenzseite trackt jede Projektkarte als eigenen Abschnitt (`allmacher`, `kolja`, …); Testimonial-Aufklappen wird
  nicht getrackt (geteilte Komponente, geringer Erkenntniswert).
- Generator-Submit-Button hat kein `cta_clicked` mehr; `generator_step=submit` deckt ihn ab.
- Tracking-Werte (`analyticsTarget`, `analyticsEvent` …) aus den Landing-Dictionaries entfernt — Dictionaries enthalten
  nur noch Text.
- Ungenutzte Komponenten `featured-service-card`, `service-card` und `service-card-link` gelöscht (trugen noch alte
  `cta_click`-Attribute).
- **`lead_created` gestrichen (22.10.2026):** Das Server-SDK sendet die URL seines Request-Kontexts am
  `beforeSend`-Schutz vorbei; eine sichere Umsetzung brauchte eine eigene URL-Prüfung gegen Vercel-Interna,
  Header-Weitergabe (IP, User-Agent) und einen Opt-out-Header. Der Nutzen war gering, weil die echte Lead-Zahl
  ohnehin in der Datenbank steht. Alle Erwähnungen von `lead_created` weiter unten sind damit hinfällig; maßgeblich
  ist die Datenbank, `form_completed` die Näherung im Dashboard.

## Ergänzungen aus dem verworfenen Codex-Plan (`plans/analytics/README.md`, entfernt)

- **„No route data found“:** Der Provider nutzt `@vercel/analytics/react` ohne Route. Erst der Next-Adapter
  (`@vercel/analytics/next`) liefert Route-Muster wie `/[locale]`; ohne ihn bleibt das Routes-Panel leer.
  Historische Daten werden dadurch nicht nachträglich ergänzt.
- **Abschnitts-Erreichung mit Mindestdauer:** Ein Abschnitt gilt erst als erreicht, wenn er ≥ 1 s sichtbar war.
  Sonst zählt Smooth-Scroll per Anker-Sprung alle überflogenen Abschnitte mit. Die Sichtbarkeit misst einen
  Anteil des Viewports statt des Abschnitts, damit hohe Mobil-Abschnitte nicht an Prozent-Schwellen scheitern.
  Timer bei verborgenem Tab abbrechen.
- **UTM-Werte-Allowlist:** Nicht nur die Schlüssel freigeben, auch die Werte: Werte, die nicht dem Muster
  `^[a-z0-9][a-z0-9._-]{0,63}$` (Kleinbuchstaben) entsprechen, werden verworfen (z. B. E-Mail-Adressen in `utm_campaign`).
  Negativtests dafür.
- **Keine Scheinerfolge:** Honeypot-Treffer erzeugen weder `form_completed` noch `lead_created`; deaktivierte
  Buttons während des Sendens verhindern doppelte `form_submitted`.
- **Generator:** `generator_step` zusätzlich mit `step=copy`, wenn die Clipboard-API das Kopieren bestätigt.
- **Rollout:** Alte und neue Eventnamen nie parallel senden. Rollback = letzten Deploy wiederherstellen;
  Formulare funktionieren unabhängig vom Tracking.

## Context

Die heutigen Vercel-Events sind um die Landingpage herum gebaut. Für die Hauptseite fehlt eine durchgängige Messung, und mehrere vorhandene Events sind fehlerhaft:

- **Generator:** Die Events erreichen Vercel nie. Sie laufen nur als `window.dispatchEvent`, und niemand hört darauf.
- **Formularstart:** `form_start` feuert erst zusammen mit dem Absendeversuch und nicht bei der ersten Eingabe.
- **Event-Eigenschaften:** Formular-Events senden 4–5 Eigenschaften. Vercel Pro wertet nur 2 aus.
- **Kampagnenparameter:** `beforeSend` entfernt alle Query-Parameter, also auch `utm_*`. Kampagnen sind so nicht auswertbar.
- **Lücken:**
  - Referenzseite, Referenz-Showcase, Leistungsauswahl, FAQ-Öffnen und Footer-Navigation sind ungetrackt.
  - Abschnittssichtbarkeit wird nur auf der Landingpage gemessen.
  - Der Calendly-CTA auf der Success-Seite ist ungetrackt.
- **Erfolgsmessung:** Der Lead-Erfolg wird nur im Client gemessen. Eine verlässliche Zahl aus dem Server gibt es nicht.

**Ziel:** Nach dem Umbau beantwortet das Vercel-Dashboard für Startseite und Referenzen:

- wo Besucher abspringen bzw. bis wohin sie scrollen,
- welche CTAs geklickt werden,
- wer das Formular startet und abschickt, und wo es scheitert,
- wie viele unterschiedliche Besucher kommen,
- später zusätzlich, welcher LinkedIn-Post Besucher bringt.

Landingpage und Generator bleiben nebensächlich mitgemessen.

## Entscheidungen (mit Moritz geklärt)

- **Tarif:** Erst nur Vercel Pro. Analytics Plus (10 $/Monat) wird gebucht, sobald die regelmäßigen LinkedIn-Posts starten (in ca. 1 Monat). Das Eventmodell kommt mit **2 Eigenschaften pro Event** aus. `utm_*` wird ab sofort durchgelassen.
- **Drain:** Kein Drain in die eigene Datenbank. Er bleibt eine optionale spätere Phase (siehe Phase 7).
- **Historie:** Alte Events werden komplett entfernt, neue Eventnamen im Partizip („`*_clicked`“, „`*_reached`“) eingeführt und ein **Stichtag** dokumentiert.
  - Vercel bietet keine Löschfunktion für Analytics-Daten.
  - Ab dem Stichtag wird im Dashboard ein eigener Zeitraum ab Stichtag gewählt. Die alten Eventnamen tauchen dann nicht mehr auf.
- **Consent:** Kein Banner nötig. Vercel ist cookielos und nutzt einen täglich wechselnden Hash. Es gibt keinen gtag-, GA4- oder Ads-Code im Repo; die Datenschutzerklärung stützt sich bereits auf Art. 6 Abs. 1 lit. f DSGVO.
- **Calendly (Free):** Ohne Einbettung ist eine echte Buchung nicht messbar.
  - Weiterleitung nach der Buchung und Webhooks sind laut Calendly-Hilfe erst ab dem Standard-Tarif verfügbar.
  - Gemessen wird deshalb nur `calendar_opened`.
  - Die echten Buchungen zählt Moritz in Calendly bzw. über die Buchungs-Mails und vergleicht sie manuell mit `calendar_opened`.
- **Lead-Herkunft:** Nicht in der Datenbank speichern, nur in Vercel auswerten.

## Was Vercel Pro kann und was nicht (Rechercheergebnis)

| Thema          | Stand                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Besucher       | Anonymer Hash, wird **täglich** zurückgesetzt. Keine Wiedererkennung über mehrere Tage.                                                             |
| Bounce Rate    | Nur Ein-Seiten-Sessions; Custom Events zählen nicht. Für den One-Pager `/de` ist der Wert praktisch wertlos. Die Abschnitts-Erreichung ersetzt ihn. |
| Custom Events  | Pro: 2 Eigenschaften (Plus: 8). Werte: String/Number/Boolean/null. Max. 255 Zeichen. Keine verschachtelten Objekte.                                 |
| Kosten         | 0,03 $ pro 1.000 Events. Bei ca. 3.000 Besuchern × 15 Events sind das ca. 1,35 $/Monat.                                                             |
| Auswertung     | Panels und Filter kombinierbar: Route, Seite, Referrer, Land, Gerät, Event, Eigenschaft. „Split by dimension“ seit 12/2025. CSV-Export.             |
| API/CLI        | `vercel metrics …` bzw. REST `events/aggregate` mit `by=eventData/<prop>`. Liefert Besucher je Eventwert, also eine Absprungkurve.                  |
| UTM            | Nur mit Plus sichtbar. Voraussetzung: `beforeSend` lässt `utm_*` durch.                                                                             |
| Server-Events  | `@vercel/analytics/server` `track()`. Ohne Bezug zu Seite oder Besucher, daher nur als verlässliche Gesamtzahl geeignet.                            |
| v2-Paket       | `@vercel/analytics` 2.x mit „Resilient Intake“ (First-Party-Pfad). Dadurch gehen weniger Events durch Adblocker verloren.                           |
| Eigene Besuche | Ausschluss nur über `beforeSend` → `null` bei gesetztem `localStorage`-Flag. Ein IP-Ausschluss existiert nicht.                                     |
| Preview        | Das Dashboard trennt Production und Preview (Standard: Production). Gut für Tests vor dem Livegang.                                                 |

## Neues Eventmodell (max. 2 Eigenschaften, nur Strings, keine personenbezogenen Daten)

Seite (Route), Gerät, Land und Referrer liefert Vercel automatisch zu jedem Event. Die Eigenschaften enthalten deshalb nur, was Vercel nicht selbst erfasst.

| Event                     | Eigenschaft 1                                                | Eigenschaft 2                                                                                           | Auslöser                                                                                                        |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `section_reached`         | `page` (home, references, landing, linkedin)                 | `section` (`hero`, `problem`, `usp`, `services`, `references`, `process`, `faq`, `contact`, `footer` …) | IntersectionObserver, einmal pro Seitenaufruf und Abschnitt. Daraus ergibt sich die Scroll- bzw. Absprungkurve. |
| `page_engaged`            | `page`                                                       | –                                                                                                       | Einmalig nach 30 s sichtbarer Verweildauer (Visibility API). Trennt echte Leser von Schnellabsprüngen.          |
| `cta_clicked`             | `cta` (`<page>_<section>_<slot>`, z. B. `home_hero_primary`) | `target` (contact_form, contact_email, services, references, landing_page, calendly, external)          | Jeder Inhalts-CTA.                                                                                              |
| `nav_clicked`             | `item` (Abschnitt bzw. Route)                                | `area` (header, header_mobile, footer)                                                                  | Header- und Footer-Navigation.                                                                                  |
| `contact_channel_clicked` | `channel` (email, phone, linkedin, instagram, whatsapp)      | `area` (contact, footer, qna)                                                                           | Kontakt-Icons und mailto-/tel-Links.                                                                            |
| `option_selected`         | `group` (home_services, home_references, landing_audience)   | `option` (stabiler Key)                                                                                 | Leistungsauswahl, Referenz-Selector, Zielgruppen-Pills.                                                         |
| `reference_opened`        | `project` (Key)                                              | `target` (internal, external)                                                                           | Showcase-Links auf der Startseite und Projektkarten auf der Referenzseite.                                      |
| `faq_opened`              | `page`                                                       | `question` (stabiler Key, kein Text)                                                                    | Aufklappen einer FAQ-Frage.                                                                                     |
| `form_started`            | `form` (discovery_call, quick_contact)                       | `placement` (home_contact, landing_final, linkedin_final)                                               | **Erste echte Eingabe** (`onInput`, einmal pro Mount).                                                          |
| `form_submitted`          | `form`                                                       | `placement`                                                                                             | Jeder Klick auf Absenden, **vor** der Validierung.                                                              |
| `form_invalid`            | `form`                                                       | `field` (Feldname des ersten Fehlers, kein Wert)                                                        | Client-Validierung schlägt fehl.                                                                                |
| `form_failed`             | `form`                                                       | `reason` (delivery, generic, rate_limited, network)                                                     | API- oder Netzwerkfehler.                                                                                       |
| `form_completed`          | `form`                                                       | `placement`                                                                                             | API meldet `ok`. Client-seitig, damit nach Seite und Gerät segmentierbar.                                       |
| `lead_created` (Server)   | `form`                                                       | `origin` (website, landing_page, linkedin_post)                                                         | Nach erfolgreichem Speichern in der Datenbank. **Maßgebliche Lead-Zahl.**                                       |
| `calendar_opened`         | `source` (after_submit, success_page, footer)                | `placement`                                                                                             | Calendly wird geöffnet.                                                                                         |
| `generator_step`          | `step` (start, submit, success, error, download)             | `reason` (nur bei error)                                                                                | Bestehende `emitAnalytics`-Aufrufe werden angebunden.                                                           |
| `preference_changed`      | `type` (language, theme)                                     | `value`                                                                                                 | Ersetzt `language_switch` und `theme_switch`.                                                                   |

**Doppelzählung:** `form_completed` (Client) und `lead_created` (Server) haben unterschiedliche Namen und Aufgaben und werden nie addiert.

- `lead_created` ist die maßgebliche Zahl.
- `form_completed` dient nur der Segmentierung nach Seite, Gerät und später UTM.
- Die Differenz ist kein Adblocker-Anteil: Navigation, Opt-out, Prefillfehler und Transportverluste wirken ebenfalls hinein.
- Für tatsächlich gespeicherte Anfragen bleibt die DB die fachliche Referenz; `lead_created` wird bestmöglich gesendet.

**Entfernt werden:**

- Click-Events: `cta_click`, `contact_click`, `calendar_click`, `faq_exit_services_click`, `audience_select`
- Formular-Events: `form_start`, `form_submit_attempt`, `form_submit_error`, `lead_submit_success`
- Abschnitts- und Einstellungs-Events: `landing_page_section_view`, `language_switch`, `theme_switch`
- `GeneratorAnalyticsEvent` als CustomEvent-Dispatch

## Umsetzung in Phasen

### Phase 0 – Dokumentation zuerst (Memory-Regel)

- **Plan ablegen:** `apps/web/plans/analytics/vercel-analytics-umbau.md`, mit Platzhalter für den Stichtag.
- **Neue Datei `apps/web/src/lib/analytics/AGENTS.md`** mit folgenden Regeln:
  - max. 2 Eigenschaften pro Event,
  - nur stabile Keys, keine Texte und keine personenbezogenen Daten,
  - neue Events nur über die Konstanten,
  - `lead_created` ist die maßgebliche Lead-Zahl,
  - Stichtag dokumentiert.
- **Root-`AGENTS.md`:** Indexzeile ergänzen.

### Phase 1 – Fundament

- **Paket-Update:** `@vercel/analytics` auf die aktuelle 2.x heben. Die Version beim Umsetzen per `pnpm view` prüfen.
- **Import:** künftig aus `@vercel/analytics/next`.
- **Konstanten** in `apps/web/common/constants/analytics/`, alles im Const-Objekt-Pattern:
  - `analytics-event-names.ts`
  - `analytics-pages.ts`
  - `analytics-sections.ts`
  - `analytics-cta-ids.ts`
  - `analytics-targets.ts`
  - `analytics-forms.ts`
  - Storage-Key für das Opt-out
- **Bestehende Konstanten-Dateien** werden ersetzt bzw. gelöscht: `click-tracked-event-names.ts`, `conversion-event-names.ts`, `conversion-payload-fields.ts`.
- **Contracts** in `apps/web/common/contracts/analytics/`: `AnalyticsEventPayloadMap`, also Eventname → genau typisierte Eigenschaften mit höchstens 2 Keys. Ersetzt `conversion-event-payload.ts`.
- **Zentrale Tracking-Funktion:** `src/lib/analytics/conversion-events.ts` wird zu `track-analytics-event.ts`. Typisiertes `trackAnalyticsEvent<E>(name, payload)`, und dies bleibt die einzige Stelle mit `track()`.
- **Deklaratives Click-Tracking:** `conversion-click-tracker.tsx` wird generalisiert.
  - Attribut-Paar: `data-analytics-event` plus `data-analytics-p1`/`-p2`.
  - Die Attribute erzeugt ein Pattern-Helfer `analyticsAttributes(event, payload)` in `common/patterns/analytics/`, damit die Typen geprüft werden.
  - Der Tracker validiert den Eventnamen gegen die Konstanten.
- **`beforeSend`** in `components/providers/vercel-analytics/vercel-analytics.tsx`:
  - Allowlist `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`; alle anderen Parameter und der Hash fallen weg.
  - Die bestehende Sensitive-Key-Sperre bleibt.
  - Opt-out: Bei gesetztem `localStorage`-Key wird `null` zurückgegeben (alle Zugriffe in try/catch).
  - `?analytics=off` bzw. `?analytics=on` setzt oder entfernt den Key. So lässt sich auch das eigene Handy einfach ausschließen.
- **Architektur-Fix:** `src/lib/analytics/contact-form-submit-error-type.ts` exportiert heute Konstanten und Typ aus `lib`. Beides wandert nach `common/constants/analytics/` bzw. `common/contracts/analytics/` (verletzt aktuell die Export-Regel).

### Phase 2 – Startseite (`components/marketing/home/**`)

- **Generischer Abschnitts-Tracker:** `hooks/analytics/use-section-funnel-tracking.ts` wird zu `use-section-reach-tracking.ts`. Er bekommt `page` und eine Liste von Section-IDs. `LandingFunnelTracker` wird zu `SectionReachTracker`.
  - Mounten in `home-page.tsx` mit den IDs aus `config/navigation/home.ts` plus `footer`.
- **`page_engaged`:** neuer Hook `use-page-engagement-tracking.ts`, mit gemountet im selben Tracker.
- **CTAs** auf das neue Attribut-Paar umstellen:
  - Header (Desktop, Mobil-Icon, Mobil-Menü)
  - Hero primär und sekundär
  - USP
  - `selected-service`, inklusive dem bisher ungetrackten `ServiceActionCta` → `landing_page`
  - Process
  - FAQ-Kontakt → `contact_channel_clicked`
  - Footer: Navigation, Rechtliches und Referenzlink → `nav_clicked`; Kanäle → `contact_channel_clicked`
- **Neu getrackt:**
  - Leistungsauswahl → `option_selected` `home_services`
  - Referenz-Selector → `option_selected` `home_references`
  - Stage- und Details-Link → `reference_opened` `internal`
  - FAQ-Aufklappen → `faq_opened`
  - Antwort-Links in FAQ-Fragen → `cta_clicked`
- **Toter Code:** `featured-service-card` und `service-card` werden nirgends importiert. Löschen statt migrieren (Bestätigung beim Umsetzen).

### Phase 3 – Formular und Lead (`contact-form.tsx`, `use-contact-form-analytics.ts`)

- **`form_started`:** per `onInput` auf dem `<form>`, mit Ref-Guard. Der Aufruf aus `trackSubmitAttempt` entfällt.
- **`form_submitted`:** bei jedem Absende-Klick vor `trigger()`. Gilt für den Anruf-Pfad und den E-Mail-Pfad.
- **Validierung:** Schlägt sie fehl, kommt `form_invalid` mit dem ersten Feld aus `formState.errors` (in Feldreihenfolge).
- **Fehler:** API- bzw. Netzwerkfehler → `form_failed` mit `reason`. Bestehendes Mapping aus `contact-submit-error-type.ts`, ergänzt um `network`.
- **Erfolg:** `form_completed`; im Anruf-Pfad zusätzlich `calendar_opened` `after_submit`.
- **Doppelte Events entfernen:** `contact_click` auf dem Submit-Button (feuert heute auch bei Validierungsfehlern).
- **Server:** In `server/contact/handlers/submit-discovery-call.command-handler.ts` und `submit-quick-contact.command-handler.ts` nach erfolgreichem Persistieren `lead_created` senden.
  - Läuft über `after()` aus `next/server`, damit die Antwort nicht wartet.
  - Neuer Service `src/server/analytics/server-analytics-service.ts` mit try/catch und Log; ein Fehler darf den Lead nie blockieren.
  - `origin` kommt aus dem bestehenden `ContactSubmissionOrigin`.
- **Success-Seite:** Calendly-CTA in `components/shared/success-page/success-page.tsx` → `calendar_opened` `success_page`.

### Phase 4 – Referenzseite (`components/marketing/references/**`)

- `SectionReachTracker` mit `page=references` und den Abschnitten `hero`, `projects`, `closing_cta`, `footer`. Fehlende `id`s an den Sections ergänzen.
- `reference-project-card.tsx`:
  - externer Link → `reference_opened` `external`
  - Testimonial aufklappen → `option_selected` `references_testimonial`
- `references-closing-cta.tsx`: beide CTAs → `cta_clicked` (`references_closing_primary`/`_secondary`).

### Phase 5 – Nebenseiten (bewusst schlank)

- **Landingpage:** `SectionReachTracker` `page=landing` ersetzt `LandingFunnelTracker`.
  - CTAs migrieren, inklusive dem bisher ungetrackten Pricing-CTA.
  - `audience_select` → `option_selected`.
  - `faq_exit_services_click` → `cta_clicked`.
- **Generator** (`generator-section.tsx`): `emitAnalytics` ruft `trackAnalyticsEvent('generator_step', …)` auf. Die ungenutzten `CustomEvent`-Typen in `generator-analytics.ts` aufräumen. LinkedIn-Seite: `SectionReachTracker` `page=linkedin`.
- **Header:** Sprach- und Theme-Wechsel → `preference_changed`.

### Phase 6 – Doku, Texte, Tests

- **Datenschutz** (`i18n/dictionaries/legal/privacy/de.json` und `en.json`): Satz zu Query-Parametern anpassen. Kampagnenparameter (`utm_*`) werden übertragen, alle anderen entfernt. Mit `copywriting`-Skill, DE und EN parallel.
- **Skill** `.claude/skills/invessiv-landing/SKILL.md` (Abschnitt Tracking, Zeilen ca. 165–188) auf das neue Eventmodell aktualisieren.
  - Der gtag-/Consent-Abschnitt beschreibt nicht existierenden Code und wird als „nicht umgesetzt / bei Google Ads neu planen“ markiert.
- **Auswertungs-Leitfaden** in `apps/web/plans/analytics/auswertung.md`. Er enthält:
  - Stichtag;
  - Dashboard-Rezepte für die 5 Kernfragen:
    1. Woher kommen Besucher?
    2. Absprungkurve über `section_reached` → Split nach `section`, Filter auf Route `/[locale]`, Besucherzahl je Abschnitt.
    3. CTA-Ranking.
    4. Formular-Funnel: `form_started` → `form_submitted` → `form_invalid`/`form_failed` → `form_completed` → `lead_created`.
    5. Mobil gegen Desktop über den Geräte-Filter.
  - die passenden `vercel metrics`-Befehle;
  - UTM-Konvention für LinkedIn-Posts, z. B. `utm_source=linkedin&utm_medium=post&utm_campaign=<JJJJ-MM-kurztitel>`.
- **Tests (Vitest):**
  - bestehende Analytics-Tests umschreiben: `conversion-events`, `vercel-analytics` (`beforeSend` mit UTM-Allowlist und Opt-out), `conversion-click-tracker`, `landing-funnel-tracker` → `section-reach-tracker`, `use-contact-form-analytics`;
  - neue Tests: Konstanten (Pflicht laut `common/AGENTS.md`), `page_engaged`-Hook, Formular-Sequenz (Start nur bei Eingabe, invalid mit Feldname, kein Doppel-Event), Server-Service (Fehler wird geschluckt);
  - Komponententests mit `data-analytics-*`-Assertions an die neuen Attribute anpassen. Betroffen: Home-Sections, Footer, Header, Kontakt, Referenzen, Landing.

### Phase 7 – Später, optional

- **Analytics Plus buchen**, wenn die Posts starten. Code-Änderung ist keine nötig.
- **Web-Analytics-Drain** (ca. 0,50 $/GB) in die eigene DB, falls echte Pfade pro Besucher gewünscht sind.

## PR-Schnitt

Ein Branch `feat/vercel-analytics-v2`, zwei PRs:

1. Phase 0, 1, 2, 3: Fundament, Startseite, Formular. Alte Events werden hier entfernt.
2. Phase 4, 5, 6: Referenzen, Nebenseiten, Doku.

**Stichtag** = Production-Deploy von PR 2. Er wird in `plans/analytics/auswertung.md` eingetragen.

Kein Auto-Commit: Moritz reviewt und committet selbst.

## Verifikation

1. **Gates:** `pnpm lint`, `pnpm -r typecheck`, `pnpm --filter @invessiv/web test`, `pnpm --filter @invessiv/web build`.
2. **Lokal** (`pnpm --filter @invessiv/web dev`, Debug-Modus loggt automatisch in die Konsole). Per Playwright-MCP die Startseite durchscrollen, CTAs klicken, das Formular falsch und richtig ausfüllen. In der Konsole prüfen:
   - Reihenfolge und Eigenschaften (je höchstens 2),
   - kein Event doppelt,
   - `form_started` erst bei Eingabe.
3. **Preview-Deploy:** Dashboard auf „Preview“ stellen und die gleichen Abläufe auf Mobil und Desktop durchklicken. Prüfen:
   - Events erscheinen mit korrekten Eigenschaften,
   - `?utm_source=test` erscheint in der Event-URL (Network-Tab `/_vercel/insights/view`),
   - `?analytics=off` unterdrückt alles.
4. **Server-Event:** Auf der Preview einen Test-Lead senden.
   - `lead_created` muss im Dashboard erscheinen.
   - Bei Deployment Protection ist ein Bypass-Secret nötig (`VERCEL_AUTOMATION_BYPASS_SECRET`).
5. **Nach dem Prod-Deploy:** Stichtag eintragen. Eigene Geräte per `?analytics=off` ausschließen. Nach 7 Tagen die erste Auswertung nach dem Leitfaden machen.
