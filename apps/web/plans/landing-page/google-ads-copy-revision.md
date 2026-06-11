# Plan: Landingpage /services/landing-page als Google-Ads-Zielseite überarbeiten

## Kontext

Die Landingpage `/de/services/landing-page` soll Zielseite für Google Search Ads werden (Testbudget ~100 €). Ziel:
kalter Traffic versteht sofort das Angebot (Landingpage Starter, 999 € für definierten Umfang), vertraut trotz fehlender
Referenzen über Prozessklarheit und stellt eine niedrigschwellige Anfrage. Genutzte Skills: `copywriting` +
`invessiv-landing` (decken Conversion-/Direct-Response-Copywriting, Landingpage-Strategie, UX Writing, Ads-Readiness,
Positionierung und Trust-Building ab — keine Skill-Installation nötig).

**Entscheidungen des Users (bestätigt):**

- Danke-Flow: **Echte Danke-Seiten mit Redirect nach erfolgreichem Absenden.** Pro Formular eine eigene Route (sauberes
  Tracking), aber **eine gemeinsame Thank-You-Komponente**, die nur unterschiedliche Copy über Props/Dictionaries
  entgegennimmt. Das bisherige Inline-Erfolgspanel wird entfernt bzw. sein Inhalt auf der Danke-Seite wiederverwendet.
- Inhalte der Danke-Seite: Bestätigung + Mini-Ablauf „Wie es weitergeht" + direkter Kontakt für Rückfragen + Hinweis,
  was man vorbereiten kann + Zurück-Link; minimaler Header + Standard-Footer.
- Haupt-CTA: **„Kostenlose Ersteinschätzung anfragen"** (Header-Kurzform: „Kostenlose Ersteinschätzung", Submit:
  „Ersteinschätzung anfragen")
- Starter-Umfang: **2 Feedback-Runden inklusive** (macht „ab"-Logik transparent)
- Tracking: **Minimaler Consent-Banner + Consent Mode v2 + gtag** (kein GTM, kein GA4)

**Wichtige Befunde aus dem Code:**

- Es gibt **keine Danke-Seite** (nur Inline-Success-Panel in `final-cta-section.tsx`) — wird im Rahmen dieses Plans neu
  gebaut.
- `FinalCtaSection` wird von **zwei Seiten** genutzt: Landingpage und LinkedIn-Post-Seite (`linkedin-post-page.tsx`) —
  der Redirect betrifft beide; jede Seite bekommt ihre eigene Danke-Route.
- Formularfelder stimmen bereits: Name, E-Mail, Anliegen (goal) Pflicht; Website optional; plus DSGVO-Consent-Checkbox (
  Pflicht). ✓
- Der Vercel-Analytics-Sanitizer (`apps/web/src/components/providers/vercel-analytics/vercel-analytics.tsx`) **entfernt
  alle Query-Parameter → UTM-Daten gehen verloren.**
- Es existiert bereits eine Trust-Section (`trust-section/` + `dictionaries/landing/trust/`) mit 4 Punkten — wird
  erweitert, nicht neu gebaut.
- Vercel-Events vorhanden: `cta_click`, `form_start`, `form_submit_attempt`, `lead_submit_success`, `form_submit_error`.
  ✓
- Kein Google-Tag, kein Consent-Banner im Code (Vercel Analytics ist cookieless).

---

## 1. Kurzdiagnose der aktuellen Seite

Die Seite ist strukturell bereits sehr gut: Eine Zielgruppe, ein Angebot, ein Formular, eigener Landing-Header ohne
Ablenkung, alle Sektionen vorhanden. Die Schwächen liegen im Detail:

1. **CTA ist hart statt weich:** „Landingpage anfragen" klingt nach Kaufentscheidung, nicht nach kostenlosem
   Erstkontakt. Für kalten Ads-Traffic zu hohe Hürde.
2. **„ab 999 €" ist erklärungsbedürftig:** Label „Preisrahmen" + „ab" wirkt offen; was den Preis erhöht (Iterationen, >6
   Sektionen, Sonderfunktionen) steht nur versteckt in einer FAQ-Antwort. Feedback-Runden sind nirgends beziffert.
3. **Trust-Section löst das Referenzen-Problem nicht aktiv:** 4 gute Punkte, aber kein 24h-Versprechen, keine
   Über-Umfang-Transparenz, kein ehrlicher Umgang mit „noch keine Referenzen". Reassurance-Zeile referenziert einen
   „Check", den die Seite nicht (mehr) anbietet — Inkonsistenz.
4. **Fake wirkender Social Proof:** Die Solution-Grafik zeigt „4,9 von 5 Sternen" — ohne echte Bewertungen ein
   Vertrauensrisiko, genau das Gegenteil des ehrlichen Positionierungsansatzes.
5. **Tracking nicht Ads-ready:** UTM-Parameter werden weggeworfen, kein Conversion-Tag, kein Consent-Setup.
6. **Ablauf zeigt nicht, dass die Anfrage unverbindlich ist:** Schritt 1 ist „Briefing" — der kostenlose, unverbindliche
   Erstkontakt fehlt als expliziter erster Schritt.

## 2. Empfohlener Ziel-Flow

Bestehende Reihenfolge **beibehalten** (entspricht dem Soll-Flow, kein Code-Umbau nötig):

Hero (Angebot + Preis + weicher CTA) → Problem → Lösung → Umfang (Inclusions) → **Vertrauen (erweitert)** → Für wen →
Ablauf (neu: Schritt 1 = kostenlose Ersteinschätzung) → Preis (geschärft) → FAQ → Formular → **Redirect auf Danke-Seite
**.

Die Danke-Seite schließt den Flow ab: Bestätigung, Erwartung setzen (Antwort in 24h), Mini-Ablauf, Kontakt für
Rückfragen — und dient als sauberer Conversion-Anker für Google Ads (Seitenaufruf = Conversion).

## 3. Section-by-Section Audit

| Sektion                  | Aufgabe                                  | Befund (Klarheit / Flow / CTA-Support / Ads-Tauglichkeit)                                                                                            |
| ------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hero**                 | Angebot, Zielgruppe, CTA in 5 Sek.       | Headline stark („…klar verkauft — fertig in 5–10 Tagen"). Aber: kein Preis above the fold (Message-Match zur Anzeige „ab 999 €" fehlt), CTA zu hart. |
| **Problem**              | Schmerz spiegeln                         | Gut: konkret, scannbar, kein Überschuss. Übergang zur Lösung sauber. Keine Änderung nötig.                                                           |
| **Lösung**               | Mechanik erklären                        | Text gut. Grafik: Fake-Rating „4,9 Sterne" muss raus; Button-Label in Grafik auf neuen CTA anpassen.                                                 |
| **Umfang (Inclusions)**  | „Was bekomme ich?"                       | Items teils vage („Launch-Unterstützung"); Sektionszahl (6) und Feedback-Runden (2) fehlen hier — stehen nur beim Preis.                             |
| **Vertrauen (Trust)**    | Referenz-Lücke kompensieren              | 4 solide Punkte, aber unvollständig (kein 24h, keine Über-Umfang-Regel, kein ehrlicher Pilotprojekt-Hinweis). „Check"-Inkonsistenz in Reassurance.   |
| **Für wen (Audience)**   | Selbstqualifizierung                     | Gut: konkrete Berufsgruppen, Helper-Text, CTA. Nur CTA-Label tauschen.                                                                               |
| **Ablauf (Process)**     | Unsicherheit nehmen                      | 4 Schritte klar, aber Schritt 1 überspringt die unverbindliche Ersteinschätzung — für weichen CTA muss sichtbar sein: Anfrage ≠ Beauftragung.        |
| **Preis (Pricing)**      | Kaufentscheidung vorbereiten             | „Preisrahmen / ab 999 €" wirkt offen. Hint gut, aber die Erhöhungs-Trigger fehlen direkt am Preis. Feedback-Runden fehlen in Items.                  |
| **FAQ**                  | Einwände abbauen                         | Gute Auswahl inkl. „Was ist ab 999 € enthalten?" — Antwort schärfen (konkrete Trigger), Frage zu Feedback-Runden/Ablauf nach Anfrage ergänzen.       |
| **Formular (Final CTA)** | Conversion                               | Felder korrekt (Name/E-Mail/Anliegen Pflicht, Website optional). Body gut. Submit-Label anpassen. Inline-Success-Panel wird durch Redirect ersetzt.  |
| **Danke-Seite (neu)**    | Erwartung nach Submit + Conversion-Anker | Existiert noch nicht. Wird neu gebaut: gemeinsame Komponente, eigene Route + Copy pro Formular (Details in Abschnitt 6b).                            |

## 4. Konkrete Copy-Probleme

1. `hero/de.json`: `primaryCta: "Landingpage anfragen"` — harte Conversion-Sprache für kalten Traffic; kein „kostenlos".
2. CTA-Wildwuchs droht: Header, Hero, Audience, Pricing, Solution-Grafik nutzen „Landingpage anfragen", FAQ-CTA und
   Submit weichen ab — nach Umstellung müssen **alle** identisch zur neuen Linie sein.
3. `pricing/de.json`: `priceLabel: "Preisrahmen"` schwächt den Festpreis-Charakter; „ab" ohne unmittelbare Erklärung am
   Preis.
4. Keine bezifferte Feedback-Runden-Angabe → „zusätzliche Iterationen kosten extra" wäre intransparent.
5. `trust/de.json`: `reassurance` erwähnt „Der Check bleibt bewusst schlank" — es gibt keinen „Check" auf der Seite.
6. `solution/de.json` → `graphic.rating: "4,9 von 5 Sternen"` — unbelegter Social Proof.
7. `process/de.json`: Schritt 1 „Ziel/Briefing" setzt bereits Beauftragung voraus.
8. `inclusions/de.json`: „Angebots- und Textgrundlage", „Launch-Unterstützung" sind abstrakt; Umfangsgrenzen (6
   Sektionen, 2 Runden) fehlen.
9. `final-cta/de.json`: `submitLabel: "Anfrage senden"` — okay, aber inkonsistent zur neuen Ersteinschätzungs-Linie.

## 5. Konkrete Copy-Verbesserungen (DE; EN parallel synchron pflegen)

**Hero** (`dictionaries/landing/hero/{de,en}.json`):

- `primaryCta`: „Kostenlose Ersteinschätzung anfragen"
- `trustLine`: „Klarer Umfang. Fester Preis: 999 € für den Starter. Alles darüber stimmen wir vorher ab."
- `tag`: „LANDINGPAGE STARTER · 999 €" (Message-Match zur Anzeige)
- Title + description bleiben (sind stark).

**Solution-Grafik** (`solution/de.json`): `rating` ersetzen durch ehrliches Element, z. B. „Antwort in 24 Stunden";
`buttonLabel` → neuer CTA.

**Inclusions** (`inclusions/de.json`):

- Items konkretisieren: „Bis zu 6 Sektionen mit klarer Struktur", „Texte: Ich bringe dein Angebot auf den Punkt", „2
  Feedback-Runden inklusive", „Responsives Design (Mobile zuerst)", „Anfrageformular, getestet und einsatzbereit",
  „Launch: Domain, Technik, Go-live".

**Process** (`process/de.json`), Schritt 1 neu:

- Titel: „Ersteinschätzung" — Beschreibung: „Du schickst die Anfrage, ich antworte innerhalb von 24 Stunden mit einer
  ehrlichen Einschätzung — kostenlos und unverbindlich. Erst danach entscheidest du."
- Schritt 3 ergänzen: „…Du gibst Feedback (2 Runden inklusive), ich setze es um."

**Pricing** (`pricing/de.json`): siehe Abschnitt 7.

**FAQ** (`faq/de.json`):

- Antwort „Was ist ab 999 € enthalten?" schärfen: „999 € gelten für den beschriebenen Starter-Umfang: bis zu 6
  Sektionen, 2 Feedback-Runden, responsive Umsetzung, Formular und Launch. Mehr Sektionen, zusätzliche Feedback-Runden
  oder Sonderfunktionen (z. B. Buchungssystem, Mehrsprachigkeit) bespreche ich vorher transparent mit dir — es entstehen
  keine Kosten, denen du nicht zugestimmt hast."
- Neue Frage: „Was passiert nach meiner Anfrage?" → „Du bekommst innerhalb von 24 Stunden eine persönliche
  Ersteinschätzung. Die ist kostenlos und unverbindlich — du entscheidest danach in Ruhe."

**Final CTA** (`final-cta/de.json`):

- `submitLabel`: „Ersteinschätzung anfragen"
- `successTitle`/`successBody` entfallen hier — die Danke-Copy zieht in die neuen Success-Dictionaries um (Abschnitt
  6b).

## 6. Neue/erweiterte Vertrauens-Section (Trust)

Bestehende `trust-section` wird auf 6 Punkte erweitert (Komponente rendert Items aus Dictionary — voraussichtlich nur
Dictionary-Änderung + ggf. Grid-Anpassung im CSS-Modul).

**Headline/Intro — 3 Varianten:**

- **Variante A (Empfehlung):**
  - Titel: „Du arbeitest direkt mit mir — nicht mit einer Agentur."
  - Body: „Keine Zwischenstellen, kein Projekt-Pingpong. Du bekommst eine ehrliche Ersteinschätzung, einen klar
    definierten Umfang und Antwort innerhalb von 24 Stunden."
  - Reassurance (ehrlicher Referenz-Umgang): „Ehrlich gesagt: Mein erstes öffentliches Referenzprojekt ist gerade in
    Umsetzung. Bis es online ist, überzeuge ich lieber mit klarem Prozess als mit Logos — und du entscheidest erst
    nach der kostenlosen Ersteinschätzung."
- **Variante B:** Titel: „Noch keine Logo-Wand. Dafür ein Prozess, auf den du dich verlassen kannst." — führt mit dem
  Defizit; ehrlich, aber ankert die Schwäche zuerst. Für kalten Traffic riskanter.
- **Variante C:** Titel: „Klarer Umfang. Direkter Draht. Ehrliche Einschätzung." — sachlich-solide, aber austauschbar
  und ohne emotionalen Unterschied zur Agentur.

**Warum A:** Die Headline führt mit dem stärksten Differenzierungsmerkmal (direkte Zusammenarbeit), die
Referenz-Ehrlichkeit kommt als glaubwürdigkeitsstiftende Fußnote statt als Aufmacher. B macht das Defizit zum ersten
Eindruck; C verkauft nicht, warum.

**Die 6 Items:**

1. **Direkter Ansprechpartner** — „Du schreibst mit der Person, die deine Seite baut. Keine Übergaben, keine Stille
   Post."
2. **Klar definierter Umfang** — „Bis zu 6 Sektionen, Text, Design, Technik, Formular und 2 Feedback-Runden. Du weißt
   vor dem Start, was enthalten ist."
3. **Keine Agentur-Schleife** — „Kein Projektmanagement-Overhead, keine Meeting-Kaskaden. Dein Feedback geht direkt in
   die Umsetzung."
4. **Ehrliche Ersteinschätzung** — „Wenn eine Landingpage für dein Angebot nicht der richtige Schritt ist, sage ich es
   dir — kostenlos und unverbindlich."
5. **Antwort innerhalb von 24 Stunden** — „Auf deine Anfrage bekommst du innerhalb von 24 Stunden eine persönliche
   Einschätzung, keine Autoresponder-Mail."
6. **Transparente Abstimmung** — „Geht etwas über den Starter-Umfang hinaus, bekommst du vorher ein klares Angebot.
   Keine versteckten Kosten."

## 6b. Danke-Seite (neu)

**Architektur:**

- **Eine gemeinsame Komponente** `components/shared/success-page/success-page.tsx` (+ `*.module.css`, `*.test.tsx`), die
  ausschließlich Content über Props entgegennimmt — keine seitenspezifische Logik in der Komponente.
- **Pro Formular eine eigene Route** (sauberes, getrenntes Tracking):
  - `/[locale]/services/landing-page/success` → Dictionary `dictionaries/landing/success/{de,en}.json`
  - `/[locale]/services/linkedin-post/success` → Dictionary `dictionaries/linkedin-post/success/{de,en}.json`
- Beide Routen: `robots: noindex`, kein Sitemap-Eintrag, eigene `metadata` (Title nach Konvention „… | Invessiv").
- **Minimaler Header** (Logo, kein Nav/CTA — es gibt nichts mehr zu konvertieren) + **Standard-Footer**.
- `FinalCtaSection` bekommt ein Prop `successRedirectHref`; bei Erfolg `router.push` statt Inline-Panel. Das
  Inline-Success-Panel wird entfernt; sein visuelles Konzept (Check-Icon + Titel + Body) wird als Kopf der
  Success-Komponente wiederverwendet. Honeypot-Treffer redirecten identisch (Bots dürfen keinen Unterschied sehen).

**Inhalte (Landing-Variante, DE — EN parallel):**

1. **Bestätigung:** „Danke für deine Anfrage." + „Ich melde mich innerhalb von 24 Stunden mit einer ehrlichen
   Ersteinschätzung — kostenlos und unverbindlich."
2. **Mini-Ablauf „Wie es weitergeht":** 1. Ich lese deine Anfrage in Ruhe → 2. Du bekommst innerhalb von 24 Stunden eine
   persönliche Ersteinschätzung → 3. Du entscheidest, ob wir starten.
3. **Vorbereitungs-Hinweis:** „Du machst die Ersteinschätzung besser, wenn du dir kurz überlegst: Was soll die Seite
   erreichen? Gibt es eine bestehende Website oder ein Profil, das ich anschauen soll?"
4. **Direkter Kontakt:** „Dir fällt noch etwas ein? Schreib mir direkt: [E-Mail-Adresse]."
5. **Zurück-Link:** „Zurück zur Übersicht" → Landingpage.

Die LinkedIn-Post-Variante nutzt dieselbe Struktur mit eigener Copy (Bestätigung + nächste Schritte passend zum
Generator-Kontext); Umfang der Copy wird in der Umsetzung des Tasks abgestimmt.

## 7. Empfehlung zu „ab 999 €"

**Prinzip:** Auf der Karte wird aus „ab 999 €" ein **Festpreis für definierten Umfang**; das „ab" lebt nur noch in
Meta-Title und Anzeigen (dort korrekt und Erwartungs-Match), die Seite selbst erklärt die Logik explizit.

Änderungen in `pricing/de.json`:

- `priceLabel`: „Preisrahmen" → „Preis"
- `priceValue`: „999 €" (statt „ab 999 €")
- Neues Item in `items`: „2 Feedback-Runden inklusive"
- `hint`: „999 € gelten für genau diesen Umfang. Mehr Sektionen, zusätzliche Feedback-Runden oder Sonderfunktionen
  kalkuliere ich vorab transparent — du entscheidest, bevor Kosten entstehen."

Meta (`meta/de.json`) bleibt bei „ab 999 €" (korrekt, weil Gesamtpreis variieren kann). FAQ-Antwort erklärt die „ab"
-Logik im Detail (Abschnitt 5). Damit ist „ab" weder unseriös noch unklar: Die Anzeige sagt „ab", die Seite zeigt
sofort, wofür genau 999 € gelten und was den Preis erhöht.

## 8. CTA-Empfehlung

Einheitlich überall (Skill-Prinzip: ein CTA, wiederholt):

- **Haupt-CTA:** „Kostenlose Ersteinschätzung anfragen" → `hero.primaryCta`, `audience.cta.label`, `pricing.ctaLabel`
- **Header-Kurzform:** „Kostenlose Ersteinschätzung" → `header.ctaLabel`
- **Submit-Button:** „Ersteinschätzung anfragen" → `final-cta.form.submitLabel`
- **Solution-Grafik:** `graphic.buttonLabel` angleichen
- Sekundär-CTA Hero („So läuft es ab") bleibt.
- **Skill-Datei aktualisieren:** `.claude/skills/invessiv-landing/SKILL.md` definiert als kanonischen CTA noch
  „Kostenlosen Landingpage-Check anfragen" — auf die neue Linie umschreiben, damit künftige Sessions konsistent
  arbeiten.

## 9. Tracking-Check vor Ads-Start

**Zwingend (vor erster Anzeige):**

1. **UTM-Fix:** `sanitizeAnalyticsUrl` in `vercel-analytics.tsx` setzt `parsedUrl.search = ""` → `utm_*`-Parameter
   whitelisten (gclid weiterhin strippen, ist Identifier). Test in `vercel-analytics`-Tests ergänzen.
2. **Google Ads Conversion-Tag:** `gtag.js` als eigene Provider-Komponente, nur auf Landing-Route + Landing-Danke-Route
   geladen, Conversion-ID/-Label über `NEXT_PUBLIC_*`-Env-Vars. **Primäre Conversion = Seitenaufruf
   von `/services/landing-page/success`** (klassisches seitenbasiertes Tracking — durch die getrennten Danke-Routen
   zählt nur das Landing-Formular). Optionaler Schutz gegen Direktaufrufe (verfälschte Conversions): Redirect setzt ein
   kurzlebiges `sessionStorage`-Flag, Conversion feuert nur, wenn es vorhanden ist.
3. **Consent:** Minimaler Consent-Banner (nur auf den Routen, wo der Tag lädt), Google Consent Mode v2 mit Default
   `denied`; Tag feuert erst nach Einwilligung. Entscheidung wird persistiert (gilt über den Redirect hinweg).
4. **Datenschutzerklärung ergänzen** (`dictionaries/legal/privacy/{de,en}.json`): Google Ads Conversion Tracking +
   Consent-Mechanik.
5. **Button-Klicks bleiben sekundär:** `cta_click` existiert bereits in Vercel Analytics — nicht als
   Google-Ads-Conversion anlegen (verwässert Optimierung).

**Optional / bewusst weggelassen:**

- **GA4:** nicht nötig bei 100 € Budget — Vercel Analytics (Funnel-Events) + Ads-Conversions reichen. Später
  nachrüstbar.
- **GTM:** Overkill für einen einzelnen Tag; direktes gtag ist schlanker und schneller.
- **Enhanced Conversions:** erst sinnvoll bei mehr Volumen.

**Schlanker 100-€-Start (operativ, außerhalb des Codes):**

- 1 Kampagne, 1 Anzeigengruppe, nur Suchnetzwerk (kein Display/Partner), Standort eingrenzen
- Wenige exakte/Phrase-Keywords („landingpage erstellen lassen" u. ä.), „ab 999 €" in der Anzeige als Vorqualifizierung
- Conversion „Ersteinschätzung angefragt" als einzige primäre Conversion; UTM-Schema:
  `?utm_source=google&utm_medium=cpc&utm_campaign=landingpage-starter`

## 10. Tasks (klein, einzeln reviewbar, in Reihenfolge)

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Scope (Dateien)                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | CTA-Texte vereinheitlichen (DE+EN) + Skill-Datei aktualisieren                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `dictionaries/landing/{header,hero,audience,pricing,solution,final-cta}/{de,en}.json`, `.claude/skills/invessiv-landing/SKILL.md`              |
| 2   | Hero-Copy überarbeiten: Preis-Anker in tag/trustLine (DE+EN)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `dictionaries/landing/hero/{de,en}.json`                                                                                                       |
| 3   | Preis- und Umfangslogik schärfen: Pricing-Karte, FAQ, Inclusions, 2 Feedback-Runden (DE+EN)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `dictionaries/landing/{pricing,faq,inclusions}/{de,en}.json`                                                                                   |
| 4   | Trust-Section auf 6 Punkte erweitern, Variante A, Reassurance-Fix (DE+EN; ggf. Grid im CSS-Modul)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `dictionaries/landing/trust/{de,en}.json`, `trust-section/`                                                                                    |
| 5   | Solution-Grafik (Fake-Rating raus), Process Schritt 1 „Ersteinschätzung" (DE+EN)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `dictionaries/landing/{solution,process}/{de,en}.json`                                                                                         |
| 5a  | Gemeinsame Success-Komponente bauen (Content nur über Props) + jsdom-Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `components/shared/success-page/`                                                                                                              |
| 5b  | Success-Routen anlegen: Landing + LinkedIn-Post (noindex, eigene metadata, minimal Header + Standard-Footer) + Success-Dictionaries (DE+EN)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `app/[locale]/(marketing)/services/{landing-page,linkedin-post}/success/page.tsx`, `dictionaries/{landing,linkedin-post}/success/{de,en}.json` |
| 5c  | `FinalCtaSection`: `successRedirectHref`-Prop, Redirect statt Inline-Panel (Panel entfernen, Honeypot redirectet identisch), Success-Keys aus `final-cta`-Dictionaries entfernen, Tests anpassen                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `components/shared/final-cta-section/`, `dictionaries/{landing,linkedin-post}/final-cta/{de,en}.json`, beide Page-Orchestratoren               |
| 6a  | UTM-Whitelist im Analytics-Sanitizer + Tests                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `components/providers/vercel-analytics/`                                                                                                       |
| 6b  | Consent-Banner (Landing- + Danke-Route) + Consent Mode v2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | neue Komponente unter `components/providers/` o. ä., Dictionary für Banner-Texte                                                               |
| 6c  | Google-Ads-Tag + seitenbasierte Conversion auf Landing-Danke-Route (inkl. sessionStorage-Guard), Env-Vars                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | neue Provider-Komponente, `lib/analytics/`, Danke-Route                                                                                        |
| 6d  | Datenschutzerklärung um Ads-Tracking ergänzen (DE+EN)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | `dictionaries/legal/privacy/{de,en}.json`                                                                                                      |
| 7   | Quality Gates + Ads-Launch-Checkliste                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | —                                                                                                                                              |
| 8   | **Finaler Gesamt-Copy-Check (Pflicht: `copywriting`-Skill laden):** Nach Abschluss aller Umbauten die komplette Copy der `/services/landing-page` entlang des Ablaufs prüfen — Hero → Problem → Lösung → Umfang → Vertrauen → Für wen → Ablauf → Preis → FAQ → Formular → Success-Seite. Geprüft wird: passt jede Sektion zur vorherigen und nächsten, ist der rote Faden zum CTA durchgängig, sind CTA-Texte, Preis-Logik (999 €, 2 Feedback-Runden), 24h-Versprechen und Tonalität überall konsistent, keine Redundanzen oder Restbestände alter Copy (z. B. „Check", „Landingpage anfragen"), DE und EN synchron. Gefundene Brüche werden direkt behoben. | alle `dictionaries/landing/**` + `dictionaries/{landing,linkedin-post}/success/**`                                                             |

Copy-Tasks (1–5) sind reine Dictionary-Änderungen und unabhängig reviewbar; Danke-Seiten-Tasks (5a–5c) bauen aufeinander
auf (Komponente → Routen → Redirect); Tracking-Tasks (6a–6d) enthalten Logik und brauchen Tests (6a Unit-Test, 6b/6c
jsdom-Tests für Consent-Gate und Conversion-Feuerung). Die `invessiv-landing`-Skill-Datei wird in Task 1 zusätzlich beim
Formular-Abschnitt aktualisiert („Kein Redirect" → Redirect auf Danke-Seite).

## Verifikation

- `npm run lint`, `npm run typecheck`, betroffene Tests (`final-cta-section.test.tsx`, `vercel-analytics`-Tests,
  `landing-page.test.tsx`), `npm run build`
- Beide Locales (`/de/...`, `/en/...`) visuell prüfen: identische Struktur, kein Encoding-Zerfall (ä/ö/ü/ß), Mobile 360
  px, Dark/Light
- Formular-Flow end-to-end: Validierungsfehler, Erfolg → Redirect auf die richtige Danke-Route (Landing vs.
  LinkedIn-Post), Conversion feuert nur nach Consent + echtem Submit (Direktaufruf der Danke-Seite zählt nicht)
- Danke-Seiten: noindex gesetzt, nicht in Sitemap, beide Locales, minimal Header + Standard-Footer
- UTM-Test: Seite mit `?utm_source=test` aufrufen → Parameter erscheint in Vercel-Analytics-Payload, sensible Parameter
  weiterhin gestrippt
- Ads-Launch-Checkliste: Conversion in Google Ads als „primär" markiert, Consent-Banner blockiert Tag bis Einwilligung,
  Datenschutz aktualisiert
- Abschluss: Task 8 (Gesamt-Copy-Check mit `copywriting`-Skill) ist als letzter Schritt verpflichtend — erst danach gilt
  der Plan als fertig umgesetzt
