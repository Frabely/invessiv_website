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
- Tracking & Consent: **nicht Teil dieses Plans** — Consent-Banner, Consent Mode v2, Google Tag und
  Conversion-Tracking werden vollständig im separaten Plan `google-ads-tracking-consent-success.md` umgesetzt.

**Wichtige Befunde aus dem Code:**

- Es gibt **keine Danke-Seite** (nur Inline-Success-Panel in `final-cta-section.tsx`) — wird im Rahmen dieses Plans neu
  gebaut.
- `FinalCtaSection` wird von **zwei Seiten** genutzt: Landingpage und LinkedIn-Post-Seite (`linkedin-post-page.tsx`) —
  der Redirect betrifft beide; jede Seite bekommt ihre eigene Danke-Route.
- Formularfelder stimmen bereits: Name, E-Mail, Anliegen (goal) Pflicht; Website optional; plus DSGVO-Consent-Checkbox (
  Pflicht). ✓
- Es existiert bereits eine Trust-Section (`trust-section/` + `dictionaries/landing/trust/`) mit 4 Punkten — wird
  erweitert, nicht neu gebaut.

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
5. **Ablauf zeigt nicht, dass die Anfrage unverbindlich ist:** Schritt 1 ist „Briefing" — der kostenlose, unverbindliche
   Erstkontakt fehlt als expliziter erster Schritt.

## 2. Empfohlener Ziel-Flow

Bestehende Reihenfolge **beibehalten** (entspricht dem Soll-Flow, kein Code-Umbau nötig):

Hero (Angebot + Preis + weicher CTA) → Problem → Lösung → Umfang (Inclusions) → **Vertrauen (erweitert)** → Für wen →
Ablauf (neu: Schritt 1 = kostenlose Ersteinschätzung) → Preis (geschärft) → FAQ → Formular → **Redirect auf Danke-Seite
**.

Die Danke-Seite schließt den Flow ab: Bestätigung, Erwartung setzen (Antwort in 24h), Mini-Ablauf, Kontakt für
Rückfragen. (Ihre Rolle als Conversion-Anker für Google Ads regelt der Plan `google-ads-tracking-consent-success.md`.)

## 3. Section-by-Section Audit

| Sektion                  | Aufgabe                            | Befund (Klarheit / Flow / CTA-Support / Ads-Tauglichkeit)                                                                                            |
| ------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hero**                 | Angebot, Zielgruppe, CTA in 5 Sek. | Headline stark („…klar verkauft — fertig in 5–10 Tagen"). Aber: kein Preis above the fold (Message-Match zur Anzeige „ab 999 €" fehlt), CTA zu hart. |
| **Problem**              | Schmerz spiegeln                   | Gut: konkret, scannbar, kein Überschuss. Übergang zur Lösung sauber. Keine Änderung nötig.                                                           |
| **Lösung**               | Mechanik erklären                  | Text gut. Grafik: Fake-Rating „4,9 Sterne" muss raus; Button-Label in Grafik auf neuen CTA anpassen.                                                 |
| **Umfang (Inclusions)**  | „Was bekomme ich?"                 | Items teils vage („Launch-Unterstützung"); Sektionszahl (6) und Feedback-Runden (2) fehlen hier — stehen nur beim Preis.                             |
| **Vertrauen (Trust)**    | Referenz-Lücke kompensieren        | 4 solide Punkte, aber unvollständig (kein 24h, keine Über-Umfang-Regel, kein ehrlicher Pilotprojekt-Hinweis). „Check"-Inkonsistenz in Reassurance.   |
| **Für wen (Audience)**   | Selbstqualifizierung               | Gut: konkrete Berufsgruppen, Helper-Text, CTA. Nur CTA-Label tauschen.                                                                               |
| **Ablauf (Process)**     | Unsicherheit nehmen                | 4 Schritte klar, aber Schritt 1 überspringt die unverbindliche Ersteinschätzung — für weichen CTA muss sichtbar sein: Anfrage ≠ Beauftragung.        |
| **Preis (Pricing)**      | Kaufentscheidung vorbereiten       | „Preisrahmen / ab 999 €" wirkt offen. Hint gut, aber die Erhöhungs-Trigger fehlen direkt am Preis. Feedback-Runden fehlen in Items.                  |
| **FAQ**                  | Einwände abbauen                   | Gute Auswahl inkl. „Was ist ab 999 € enthalten?" — Antwort schärfen (konkrete Trigger), Frage zu Feedback-Runden/Ablauf nach Anfrage ergänzen.       |
| **Formular (Final CTA)** | Conversion                         | Felder korrekt (Name/E-Mail/Anliegen Pflicht, Website optional). Body gut. Submit-Label anpassen. Inline-Success-Panel wird durch Redirect ersetzt.  |
| **Danke-Seite (neu)**    | Erwartung nach Submit setzen       | Existiert noch nicht. Wird neu gebaut: gemeinsame Komponente, eigene Route + Copy pro Formular (Details in Abschnitt 6b).                            |

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

**Solution-Grafik** (`solution/de.json`): ~~`rating` ersetzen durch ehrliches Element~~ — **überholt durch
Abschnitt 7b:** Die Grafik entfällt komplett (User-Entscheidung); Umsetzung in Task 3e.

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
- Der Link auf `/{locale}#services` in der Antwort „Für wen ist das nicht geeignet?" **bleibt bewusst bestehen**
  (ehrliche Selbst-Disqualifikation statt Sackgasse, kein Versehen). Absprünge über diesen Link werden als sekundäres
  Tracking-Event erfasst — siehe Plan `google-ads-tracking-consent-success.md`.

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

Hinweise für Task 3:

- EN ist teilweise vorgezogen: `priceLabel: "Price"` ist bereits umgestellt, `priceValue: "from €999"` noch nicht —
  beim Umsetzen beide Locales auf den Zielstand synchronisieren (kein Merge mit asynchronen Sprachständen).
- Structured Data (`dictionaries/landing/structured-data/{de,en}.json`, `priceRangePrefix: "ab"/"from"`) behält den
  „ab"-Prefix **bewusst** — sie ist wie der Meta-Title SERP-gerichtet, nicht On-Page. Im Task nur prüfen, dass das
  konsistent bleibt.

## 7b. Textdichte & Design-Differenzierung (Mobile-first)

**Befund:** Das Problem der Seite ist nicht die absolute Textmenge, sondern Struktur-Wiederholung. Fast jede Sektion
folgt dem Muster _Eyebrow + Headline + Einleitungsabsatz + Liste (4–6 Bullets) + Abschluss-/Reassurance-Satz_; auf
Mobile stapelt sich das zu einer gleichförmigen Textsäule, die Besucher überspringen. Zusätzlich werden zentrale Fakten
mehrfach als volle Sätze erklärt:

| Fakt                                   | Erscheint als voller Satz in              |
| -------------------------------------- | ----------------------------------------- |
| 999-€-Scope / „darüber stimmen wir ab" | Hero-trustLine, Pricing-hint, FAQ-Antwort |
| 5–10 Tage                              | Hero, Trust, Process, Pricing, FAQ        |
| „Kein Agentur-Pingpong"                | Trust-Item + Done-for-you-Bullet          |
| 24-Stunden-Antwort                     | Trust, FAQ, Final-CTA-trustLine           |

**Regeln für alle 3x-Tasks:**

1. Headline trägt die Botschaft, die Liste trägt die Details, maximal **ein** Stützsatz pro Sektion (Body **oder**
   Reassurance/Summary, nie beides); wörtlich doppelte Title/itemsLabel-Paare entfernen (z. B. Done-for-you: Title und
   itemsLabel sind identisch).
2. Jeder Fakt bekommt genau ein Zuhause als ausformulierter Satz; überall sonst nur Kurzsignal (Badge/Label statt
   Satz). Die ausführliche Scope-Erklärung lebt in der Pricing-hint; die lange 999-€-FAQ-Antwort wird entsprechend
   gekürzt (die Pricing-Karte steht direkt darüber).
3. Bullets keyword-first und kurz (Ziel ≤ 6 Wörter, wichtigstes Wort zuerst) statt voller Sätze mit Punkt.
4. Design-Differenzierung: Sektionen dürfen nicht alle dasselbe Layout-Pattern nutzen; bei Umbauten bewusst visuelle
   Varianten wählen (die Audience-Chips sind das Positivbeispiel — am wenigsten „textig").

**Entscheidungen des Users (bestätigt):**

- **Kernänderungen (Copy + Design)** für vier Sektionen: Problem, Lösung, Done-for-you („Was ich dir abnehme"), Trust
  („So arbeite ich").
- **Problem + Lösung** werden zu **einer** Sektion zusammengeführt: Vorher/Nachher-Kontrast bzw. Paarung
  „Problem X → löse ich mit Lösung Y".
- **Die Solution-Grafik entfällt komplett** (Mock-Browser-Visual inkl. `graphic.*`-Keys) — damit ist auch der
  Grafik-Teil von Task 5 (Fake-Rating, formButton) hinfällig.
- **Trust + Done-for-you** werden konsolidiert (starke Überlappung: eine Person, kein Pingpong, klarer Rahmen);
  Content-Basis sind die 6 Items aus Abschnitt 6 in gekürzter Form — Task 4 geht darin auf.
- **Audience („Für wen")** bleibt: Im Kern reichen Headline + Zielgruppen-Badges + CTA; Subheadline/Body und/oder
  einer der beiden Textabschnitte über dem CTA (helper/reassurance) entfallen.
- **Process & Pricing** bleiben: maximal Subheadline/Body-Text entfernen.
- **FAQ bleibt vollständig** (alle Fragen sind sinnvoll): statt Streichen mit Einklappen/„Mehr Fragen anzeigen"
  arbeiten; höchstens eine Frage entfällt.
- **Final-CTA/Formular** bleibt im Kern: ggf. Body kürzen.

## 8. CTA-Empfehlung

Einheitlich überall (Skill-Prinzip: ein CTA, wiederholt):

- **Haupt-CTA:** „Kostenlose Ersteinschätzung anfragen" → `hero.primaryCta`, `audience.cta.label`, `pricing.ctaLabel`
- **Header-Kurzform:** „Kostenlose Ersteinschätzung" → `header.ctaLabel`
- **Submit-Button:** „Ersteinschätzung anfragen" → `final-cta.form.submitLabel`
- **Solution-Grafik:** `graphic.buttonLabel` angleichen
- Sekundär-CTA Hero („So läuft es ab") bleibt.
- **Skill-Datei:** `.claude/skills/invessiv-landing/SKILL.md` wurde bereits vorab auf die neue Linie aktualisiert
  (kanonischer CTA, Platzierungen, Kurzformen) ✓.

## 9. Tracking & Consent (ausgelagert)

Technisches Tracking ist nicht Teil dieses Plans. Consent-Banner, Google Consent Mode v2, Google-Tag-Einbindung,
Conversion-Tracking auf der Danke-Route und die Datenschutz-Ergänzung werden vollständig im separaten Plan
`google-ads-tracking-consent-success.md` geplant und umgesetzt.

Hinweis: Die UTM-Whitelist im Vercel-Analytics-Sanitizer bleibt laut Entscheidung im Tracking-Plan vorerst weg
(optionaler Follow-up) — Quellen-/Kampagnen-Auswertung übernimmt GA4.

**Schlanker 100-€-Start (operativ, außerhalb des Codes):**

- 1 Kampagne, 1 Anzeigengruppe, nur Suchnetzwerk (kein Display/Partner), Standort eingrenzen
- Wenige exakte/Phrase-Keywords („landingpage erstellen lassen" u. ä.), „ab 999 €" in der Anzeige als Vorqualifizierung
- UTM-Schema: `?utm_source=google&utm_medium=cpc&utm_campaign=landingpage-starter`

## 10. Tasks (klein, einzeln reviewbar, in Reihenfolge)

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Scope (Dateien)                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ✅ **Umgesetzt.** CTA-Texte vereinheitlichen (DE+EN) — Skill-Datei wurde bereits vorab vollständig auf die neue Linie aktualisiert ✓; auch der Footer-CTA nutzt bereits die neue Linie                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `dictionaries/landing/{header,hero,audience,pricing,solution,final-cta}/{de,en}.json`                                                                                  |
| 2   | ✅ **Umgesetzt.** Hero-Copy überarbeiten: Preis-Anker in tag/trustLine (DE+EN)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | `dictionaries/landing/hero/{de,en}.json`                                                                                                                               |
| 3   | ✅ **Umgesetzt.** Preis- und Umfangslogik geschärft: Pricing-Karte, FAQ, Done-for-you-Section, 2 Feedback-Runden (DE+EN); EN-Drift synchronisiert + Structured-Data-Check erledigt (siehe Hinweise in Abschnitt 7)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `dictionaries/landing/{pricing,faq,done-for-you}/{de,en}.json`, `dictionaries/landing/structured-data/{de,en}.json` (nur Check)                                        |
| 3a  | **Textdichte (7b):** Behaltene Sektionen straffen (DE+EN): Audience auf Headline + Badges + CTA reduzieren (Body und helper/reassurance bis auf max. einen Text raus), Process-Body und Pricing-Body entfernen, Final-CTA-Body kürzen; ggf. betroffene Props in den Sektions-Komponenten optional machen                                                                                                                                                                                                                                                                                                                                                                                                                                               | `dictionaries/landing/{audience,process,pricing,final-cta}/{de,en}.json`, ggf. `audience-section/`, `process-section/`, `pricing-section/`                             |
| 3b  | **Textdichte (7b):** Cross-Sektion-Dedupe nach Regel 2 — jeder Fakt (999-€-Scope, 5–10 Tage, 24h, Pingpong) genau ein Zuhause als Satz, sonst Kurzsignal; lange 999-€-FAQ-Antwort kürzen (DE+EN)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `dictionaries/landing/{hero,trust,done-for-you,process,pricing,faq,final-cta}/{de,en}.json`                                                                            |
| 3c  | **Textdichte (7b):** Bullets keyword-first kürzen (Regel 3) in allen verbleibenden Listen (DE+EN)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `dictionaries/landing/**/{de,en}.json` (nur Listen-Keys)                                                                                                               |
| 3d  | **Textdichte (7b):** FAQ-Sektion: „Mehr Fragen anzeigen" — initial ~5 Fragen sichtbar, Rest aufklappbar; keine Fragen streichen; Toggle-Label als Dictionary-Key (DE+EN); jsdom-Test für das Auf-/Zuklappen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `faq-section/`, `dictionaries/landing/faq/{de,en}.json`                                                                                                                |
| 3e  | **Kernumbau (7b):** Problem + Lösung zu einer Sektion zusammenführen — Vorher/Nachher-Kontrast bzw. Paarung „Problem X → Lösung Y"; Solution-Grafik komplett entfernen (inkl. `graphic.*`-Keys); Copy nach Regeln aus 7b neu schneiden; vor Umsetzung Mockup-Check `animation_mockups/` + `effects-catalog.json` (AGENTS.md); Page-Orchestrator anpassen                                                                                                                                                                                                                                                                                                                                                                                               | `problem-section/`, `solution-section/` (→ neue zusammengeführte Sektion), `dictionaries/landing/{problem,solution}/{de,en}.json`, `landing-page/`                     |
| 3f  | **Kernumbau (7b):** Trust + Done-for-you konsolidieren — Content-Basis: die 6 Items aus Abschnitt 6 (Variante A) in gekürzter Form; **Task 4 geht in diesem Task auf** (nicht doppelt umsetzen); eigenständiges Layout statt identischem Listen-Pattern; vor Umsetzung Mockup-Check `animation_mockups/`                                                                                                                                                                                                                                                                                                                                                                                                                                               | `trust-section/`, `done-for-you-section/`, `dictionaries/landing/{trust,done-for-you}/{de,en}.json`, `landing-page/`                                                   |
| 3g  | **Design-Differenzierungs-Check (7b, Regel 4):** Nach 3e/3f alle Sektionen durchgehen — kein durchgängig identisches Eyebrow+H2+Body+Liste-Pattern; wo nötig kleine visuelle Varianten umsetzen oder Abweichung mit Begründung dokumentieren; Mobile 360 px prüfen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `components/marketing/landing/**` (CSS-Module)                                                                                                                         |
| 4   | ~~Trust-Section auf 6 Punkte erweitern~~ — **geht in Task 3f auf** (Items aus Abschnitt 6, Variante A, in gekürzter Form; Reassurance-„Check"-Fix wird dort miterledigt)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | siehe 3f                                                                                                                                                               |
| 5   | Process Schritt 1 „Ersteinschätzung" (DE+EN) — der Solution-Grafik-Teil ist hinfällig: Grafik entfällt komplett in Task 3e (siehe 7b)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `dictionaries/landing/process/{de,en}.json`                                                                                                                            |
| 5a  | Gemeinsame Success-Komponente bauen (Content nur über Props) + jsdom-Test                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `components/shared/success-page/`                                                                                                                                      |
| 5b  | Success-Routen anlegen: Landing + LinkedIn-Post (noindex, eigene metadata, minimal Header + Standard-Footer) + Success-Dictionaries (DE+EN); Routen-Pfade als `SITE_ROUTES`-Konstanten in `src/config/routes.ts` ergänzen — keine String-Literale (AGENTS.md-Regel); 5c nutzt die Konstante für `successRedirectHref`                                                                                                                                                                                                                                                                                                                                                                                                                                  | `app/[locale]/(marketing)/services/{landing-page,linkedin-post}/success/page.tsx`, `dictionaries/{landing,linkedin-post}/success/{de,en}.json`, `src/config/routes.ts` |
| 5c  | `FinalCtaSection`: `successRedirectHref`-Prop, Redirect statt Inline-Panel (Panel entfernen, Honeypot redirectet identisch), Success-Keys aus `final-cta`-Dictionaries entfernen, Tests anpassen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `components/shared/final-cta-section/`, `dictionaries/{landing,linkedin-post}/final-cta/{de,en}.json`, beide Page-Orchestratoren                                       |
| 5d  | Lead-Origin für Landing-Leads erkennbar machen: Befund — `FinalCtaSection` hat ein `origin`-Prop (Default `ContactSubmissionOrigin.Website`); die LinkedIn-Post-Seite übergibt `LinkedInPost`, die Landingpage übergibt nichts → Landing-Leads sind in der DB nicht von Startseiten-Quick-Contacts unterscheidbar. Umsetzung: neuen Wert `LandingPage: "landing_page"` in `ContactSubmissionOrigin` + `CONTACT_SUBMISSION_ORIGIN_VALUES` ergänzen (Const-Objekt-Pattern, Konstanten-Test aktualisieren), Landing-Orchestrator übergibt `origin={ContactSubmissionOrigin.LandingPage}` an `FinalCtaSection`. Keine DB-Migration nötig (`origin` ist `text`-Spalte ohne Check-Constraint; Drizzle-`enum` und Zod-Schema leiten aus dem Values-Array ab). | `packages/common/src/constants/contact/contact-submission-origin.ts` (+ `.test.ts`), `components/marketing/landing/landing-page/`, ggf. `final-cta-section.test.tsx`   |
| 6   | Tracking & Consent — entfällt hier; siehe Plan `google-ads-tracking-consent-success.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | —                                                                                                                                                                      |
| 7   | Quality Gates (Lint/Typecheck/Tests/Build, Locales, A11y)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | —                                                                                                                                                                      |
| 8   | **Finaler Gesamt-Copy-Check (Pflicht: `copywriting`-Skill laden):** Nach Abschluss aller Umbauten die komplette Copy der `/services/landing-page` entlang des Ablaufs prüfen — Hero → Problem → Lösung → Umfang → Vertrauen → Für wen → Ablauf → Preis → FAQ → Formular → Success-Seite. Geprüft wird: passt jede Sektion zur vorherigen und nächsten, ist der rote Faden zum CTA durchgängig, sind CTA-Texte, Preis-Logik (999 €, 2 Feedback-Runden), 24h-Versprechen und Tonalität überall konsistent, keine Redundanzen oder Restbestände alter Copy (z. B. „Check", „Landingpage anfragen"), DE und EN synchron. Gefundene Brüche werden direkt behoben.                                                                                           | alle `dictionaries/landing/**` + `dictionaries/{landing,linkedin-post}/success/**`                                                                                     |

Copy-Tasks (1–3, 3a–3c, 5) sind reine Dictionary-Änderungen und unabhängig reviewbar; 3d ist eine kleine
Komponenten-Änderung mit Test; 3e/3f sind die beiden Kernumbauten (je eigener PR) und 3g ist der abschließende
Design-Check. Empfohlene Reihenfolge innerhalb der 3x-Serie: erst die Streich-Durchgänge (3a–3c), dann 3d, dann die
Kernumbauten (3e, 3f), zuletzt 3g — so wird in 3e/3f keine Copy doppelt angefasst, die vorher schon gestrichen wurde.
Mit 3e/3f ändert sich die Sektions-Reihenfolge der Seite; die `invessiv-landing`-Skill-Datei (Sektions-Reihenfolge +
Sektions-Index) wird im jeweiligen Task mitgepflegt.
Danke-Seiten-Tasks (5a–5c) bauen aufeinander
auf (Komponente → Routen → Redirect). Task 5d ist eine kleine, unabhängige Logik-Änderung mit Konstanten-Test. Die
`invessiv-landing`-Skill-Datei wurde bereits vorab
vollständig an diesen Plan angepasst (CTA, Preis-Logik, Trust-Sektion, Success-Seiten, Formular-Redirect, Tracking,
SEO-Defaults, Sektions-Index) ✓.

## Verifikation

- `npm run lint`, `npm run typecheck`, betroffene Tests (`final-cta-section.test.tsx`, neuer `success-page.test.tsx`
  aus Task 5a, Konstanten-Test aus Task 5d), `npm run build`
- Beide Locales (`/de/...`, `/en/...`) visuell prüfen: identische Struktur, kein Encoding-Zerfall (ä/ö/ü/ß), Mobile 360
  px, Dark/Light
- Formular-Flow end-to-end: Validierungsfehler, Erfolg → Redirect auf die richtige Danke-Route (Landing vs.
  LinkedIn-Post)
- Danke-Seiten: noindex gesetzt, nicht in Sitemap, beide Locales, minimal Header + Standard-Footer
- Lead-Origin: Submit über die Landingpage persistiert `origin: "landing_page"` in `lead_submissions`; Startseiten- und
  LinkedIn-Post-Submits behalten ihre bisherigen Origins
- Tracking-/Consent-Verifikation (Consent-Gate, Conversion-Feuerung, UTM): siehe Plan
  `google-ads-tracking-consent-success.md`
- Abschluss: Task 8 (Gesamt-Copy-Check mit `copywriting`-Skill) ist als letzter Schritt verpflichtend — erst danach gilt
  der Plan als fertig umgesetzt
