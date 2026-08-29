# Todo

## Offen

### project-request-form.tsx hardcoded error codes ersetzen

In `src/components/marketing/home/sections/contact-section/project-request-form/project-request-form.tsx` werden noch
hartcodierte String-Fehlercodes verwendet. Das muss in einem separaten Schritt auf zentrale Error-Code-Konstanten und
ein sauberes Mapping umgestellt werden, aber nicht in diesem Branch.

### Zeitangabe Landingpage überarbeiten

**Aktuell:** `5–10 Tage` an allen Stellen (Hero, Trust, Process, FAQ, Pricing, Meta)

**Offene Frage:** Marktüblich ist „1–2 Wochen". Beides beschreibt denselben Zeitraum, aber die Wochen-Formulierung ist
ehrlicher gegenüber Kunden (Feedback-Latenz liegt fast immer beim Kunden, nicht beim Entwickler) und klingt
professioneller.

**Betroffene Dateien:**

- `src/i18n/dictionaries/landing/hero/{de,en}.json`
- `src/i18n/dictionaries/landing/trust/{de,en}.json`
- `src/i18n/dictionaries/landing/process/{de,en}.json`
- `src/i18n/dictionaries/landing/faq/{de,en}.json`
- `src/i18n/dictionaries/landing/pricing/{de,en}.json`
- `src/i18n/dictionaries/landing/meta/{de,en}.json`
- `.claude/skills/invessiv-landing/SKILL.md`
- Tests: `page.test.tsx`, `landing-structured-data.test.ts`

**Entscheidung steht aus:** Bleibt es bei `5–10 Tage` oder Wechsel auf `1–2 Wochen`?

---

### LinkedIn-Post-Generator: Qualitätsgrenze ohne persönliche Daten

Der Generator liefert technisch saubere, strukturell hochwertige Posts — aber die Copy bleibt **zwangsläufig generisch
**, weil er keine persönlichen Informationen kennt:

- Kein eigenes Branding, keine Logofarben, keine visuelle Identität
- Keine persönliche Stimme, keine konkreten Erfahrungen, keine Referenzen
- Keine Unternehmensfotos, Teambilder oder eigene Bild-Assets
- Keine spezifischen Zahlen, Case Studies oder Kundenzitate

Das ist kein Fehler — es ist die bewusste Grenze des öffentlichen Lead-Magnet-Tools.

**Der Hinweis sollte irgendwo auf der Seite sichtbar sein** (z. B. unterhalb der Beispiele oder im Success-State), damit
Besucher verstehen, warum das Ergebnis noch nicht „nach ihnen" klingt — und was dagegen helfen würde.

**Mögliche Erweiterung: Custom Workflow per Skill**

Ein dedizierter `custom-linkedin-post`-Skill (analog zu `invessiv-social-post`) könnte genau diese Lücke schließen:

- Persönliche Angaben (Stimme, Expertise-Tiefe, Referenzen) als Skill-Kontext
- Eigenes Logo oder Bild-URL als Input — **Bild-Input wäre kein technisches Problem**: der Skill nimmt eine URL oder
  einen lokalen Pfad entgegen und bettet das Bild direkt in das HTML-Template ein; Playwright rendert es pixelgenau in
  den PNG-Export
- Individuelle Farbpalette statt der 10 generischen Paare
- Persistente Persona-Daten (Name, Rolle, Profilbild) für konsistente Posts über mehrere Runs hinweg

Der Skill würde nicht im öffentlichen Generator laufen, sondern als interner Workflow (wie `invessiv-social-post`) —
Besucher, die das Ergebnis sehen, erkennen den Qualitätsunterschied und haben einen konkreten nächsten Schritt: eigenen
Workflow anfragen.

---

### Zeiten in Home Services-Sektion überarbeiten

Sobald die Zeitangabe für die Landingpage entschieden ist, müssen die Delivery-Werte aller Service-Cards in
`src/i18n/dictionaries/marketing/home.ts` geprüft und ggf. angepasst werden:

| Service      | DE                      | EN                         |
| ------------ | ----------------------- | -------------------------- |
| Landingpage  | `3–10 Tage`             | `3–10 days`                |
| Website      | `10–21 Tage`            | `10–21 days`               |
| Upgrade      | `3–14 Tage`             | `3–14 days`                |
| Wartung      | `24–72h Antwortzeit`    | `24–72h response time`     |
| Prozess-Tool | `stark projektabhängig` | `highly project-dependent` |

Frage: Sind diese Zeitangaben realistisch und konsistent mit der Landing-Positionierung?

---

### Landing-Page Tracking/Consent: Playwright E2E-Smoke

Ausgelagert aus `apps/web/plans/landing-page/google-ads-tracking-consent-success.md` (dortiger Task 8). Tasks 1–7 des
Plans stehen; dieser E2E-Smoke ist der letzte offene Schritt und wird separat nachgezogen.

**Scope:** Playwright-Smoke für den Kernablauf der Landing-/Success-Route.

**Abzudeckende Fälle:**

- Consent-Banner ist sichtbar, Accept/Reject sind gleichwertig erreichbar und per Tastatur (Tab/Enter, `Escape`)
  bedienbar.
- Vor jeder Auswahl gilt Consent-Default `denied` (kein `consent update` auf `granted` ohne Klick).
- Erfolgreicher Formular-Submit → Redirect auf die Success-Route → Conversion-Event feuert **genau einmal**.
- Direktaufruf der Success-Route und Reload/Back nach konsumiertem Guard feuern **nicht**.
- Honeypot-Treffer redirectet identisch, feuert aber **nicht**.

**Hinweise zur Umsetzung:**

- `gtag`/`dataLayer` im Test stubben und die gepushten Events asserten, statt echte Google-Calls abzuwarten — so läuft
  der Smoke ohne gesetzte `AW-`Env-Vars und ohne externe Abhängigkeit.
- Mobile-Viewport (360 px) mit prüfen: Banner verdeckt den Haupt-CTA nicht dauerhaft.
- Erst umsetzen, wenn die übrigen Tasks stabil sind (Tasks 1–7 erledigt).

---

### Webdesign-Angebotsseite vollständig neu positionieren und gestalten

#### Ziel

Das bisher primär als „Landingpage erstellen lassen“ kommunizierte Angebot zu einem breiteren, klar gegliederten
**Webdesign-Angebot** weiterentwickeln. Die Seite soll sichtbar von einem echten Entwickler und Webdesigner stammen:
individuell, technisch glaubwürdig und persönlich – ohne austauschbare Kartenraster, beliebige Verläufe oder andere
typische „AI-Slop“-/0815-Muster.

Die Landingpage bleibt als buchbares Einstiegspaket erhalten; zusätzlich werden passende Pakete für umfangreichere
Websites angeboten.

#### Phase 0: Routing und Conversion-Fokus verbindlich entscheiden

Die bestehende Route `/[locale]/services/landing-page` ist aktuell eine fokussierte Google-Ads-Zielseite mit genau
einem Angebot, einem Ergebnis und einem Haupt-CTA. Drei Webdesign-Pakete auf dieser Route würden dieser Vorgabe sowie
der bestehenden Anzeigen- und Tracking-Logik widersprechen.

**Empfohlene Lösung:**

- Neue Angebotsseite unter `/[locale]/services/webdesign` für das breite Webdesign-Angebot mit drei Paketen anlegen.
- `/[locale]/services/landing-page` als fokussierte Zielseite für das Landingpage-Angebot und Google Ads erhalten.
- Das Landingpage-Paket der neuen Webdesign-Seite crawlbar mit der Detailseite verlinken.
- Navigation, Homepage-Servicekarten, Sitemap, Canonicals, Structured Data und interne Links auf die neue
  Angebotsarchitektur abstimmen.
- Falls stattdessen die bestehende Landingpage-Route ersetzt werden soll, vor Umsetzung bewusst entscheiden, wie mit
  Google-Ads-Kampagnen, bestehender Preis-/CTA-Logik, Success-Route, Tracking und Weiterleitungen umgegangen wird.

**Gate:** Kein Design und keine Copy umsetzen, bevor diese Routing-Entscheidung dokumentiert ist.

#### SEO-/Indexierungsstatus vor dem Rebranding klären

Die deutsche Detailroute `/de/services/landing-page` ist trotz mehrmonatiger Erreichbarkeit offenbar noch nicht bei
Google indexiert, während die jüngere Route `/de/services/linkedin-post` bereits indexiert wurde. Vor einer Änderung der
Angebotsarchitektur muss deshalb geklärt werden, ob ein technisches Problem, Googles Canonical-Auswahl oder eine
inhaltliche Qualitätsbewertung die Indexierung verhindert.

**Aktueller technischer Befund (Produktion, geprüft am 29.08.2026):**

- Die Landingpage antwortet nach der permanenten Weiterleitung auf `www.invessiv.com` mit HTTP `200`.
- `robots.txt` erlaubt das Crawling; es wird kein `noindex` ausgeliefert.
- Die Seite besitzt einen Self-Canonical auf `https://www.invessiv.com/de/services/landing-page`.
- Die `de`-, `en`- und `x-default`-Alternates zeigen auf die korrekten Locale-Varianten.
- Beide Locale-Varianten stehen in der XML-Sitemap.
- Die Homepage verlinkt die Detailseite crawlbar.
- Homepage und Landingpage behandeln teilweise dasselbe Themenfeld, sind in Hauptinhalt, H1, Title und Suchintention
  aber ausreichend unterschiedlich. Eine einfache Wortmengen-Heuristik ergab rund 22 % Überschneidung; das ist kein
  Google-Grenzwert, liefert aktuell aber keinen starken Hinweis auf ein Near-Duplicate.

**Bewertung:** Ein harter technischer Indexierungsblock ist im aktuellen Stand nicht erkennbar. Eine Zusammenfassung mit
der Homepage bleibt theoretisch möglich, weil Google trotz Self-Canonical eine andere Canonical wählen kann. Ohne die
URL-Prüfung in der Google Search Console lässt sich diese Hypothese nicht bestätigen. Wahrscheinliche Alternativen sind
`Gecrawlt – zurzeit nicht indexiert`, schwache externe beziehungsweise interne Qualitätssignale oder eine aus Googles
Sicht noch nicht ausreichend eigenständige kommerzielle Suchintention. Die jüngere LinkedIn-Seite kann durch den klar
abgrenzbaren Generator einen leichter erkennbaren eigenständigen Nutzen besitzen.

**Verbindliches Diagnose-Gate vor Routing-, Copy- oder Canonical-Änderungen:**

- [ ] In der Search Console die exakte URL `https://www.invessiv.com/de/services/landing-page` prüfen.
- [ ] Grund der Nichtindexierung, letzten Crawl, verweisende Seite und Sitemap-Erkennung dokumentieren.
- [ ] Vom Nutzer festgelegte Canonical und von Google ausgewählte Canonical dokumentieren.
- [ ] Wenn Google die Homepage als Canonical gewählt hat: Suchintention, H1, Meta-Daten, Hauptinhalt und interne
      Ankertexte der beiden Seiten klarer trennen; keine vorschnelle Weiterleitung einrichten.
- [ ] Wenn der Status `Gecrawlt – zurzeit nicht indexiert` bei korrektem Self-Canonical lautet: eigenständigen Nutzen,
      Referenzen/Belege, fachliche Tiefe, interne Verlinkung und externe Signale priorisieren.
- [ ] Wenn der Status `Gefunden – zurzeit nicht indexiert` lautet: Crawl- und Discovery-Signale, Sitemap-Verarbeitung,
      interne Linkposition und Serverantworten prüfen.
- [ ] Nach dem Rebranding Live-Test ausführen, Indexierung erneut beantragen und Status beziehungsweise Google-Canonical
      nach zwei bis vier Wochen kontrollieren.

**Technische Punkte für den Umbau:**

- Das Locale-Layout setzt derzeit alle Marketingseiten über `dynamic = "force-dynamic"` und `revalidate = 0` auf eine
  dynamische Auslieferung mit `private, no-cache, no-store`. Das blockiert Google nicht, sollte für statische
  Marketingseiten aber überprüft und nach Möglichkeit auf cachebare beziehungsweise statisch erzeugte Seiten umgestellt
  werden.
- Der aktuelle Homepage-Title wird durch Title-Inhalt plus Layout-Template doppelt gebrandet
  (`Invessiv | … | Invessiv`). Beim Rebranding gemäß projektweiter Title-Konvention korrigieren.
- Die Sitemap enthält aktuell die richtigen kanonischen URLs, aber keine `lastModified`-Angaben oder Sitemap-`hreflang`
  -Alternates. Beides ist kein Indexierungsblock; beim Umbau kann `lastModified` für tatsächlich substanziell geänderte
  Seiten ergänzt werden. Die bestehenden HTML-Alternates müssen erhalten bleiben.
- Bei einer neuen Route `/[locale]/services/webdesign` die Landingpage nicht allein wegen der aktuellen Nichtindexierung
  ersetzen oder weiterleiten. Erst Suchintention und Aufgaben beider URLs festlegen, dann Canonicals, Sitemap, interne
  Links und gegebenenfalls Redirects konsistent umsetzen.

#### Positionierung und USP

Die zentrale Differenzierung ist die Verbindung aus Softwareentwicklung und Webdesign:

- rund 10 Jahre praktische Coding-Erfahrung
- davon rund 3 Jahre professionelle Erfahrung in der Softwareentwicklung
- rund 1 Jahr fokussierte Erfahrung im Webdesign
- Umsetzung mit Next.js und echter, wartbarer Codebasis statt reinem Baukasten- oder No-Code-Aufbau
- direkter Ansprechpartner für Konzeption, Design und technische Umsetzung
- verständliche, unkomplizierte Zusammenarbeit auf Augenhöhe: technische Tiefe, ohne in Entwicklerjargon oder
  Agentursprech auszuweichen

**Branding-Hypothese:** „Der einzige Programmierer und Webdesigner, mit dem man normal reden kann.“ Die Aussage trifft
die gewünschte Persönlichkeit – technisch kompetent, zugänglich, direkt und unprätentiös – darf wegen des absoluten
Alleinstellungsanspruchs aber nicht ungeprüft als Tatsachenbehauptung veröffentlicht werden. In der Copy-Phase daraus
einen eigenständigen, rechtlich und inhaltlich belastbaren Claim entwickeln. Mögliche Arbeitsrichtungen:

- „Webdesign mit Code – und Gesprächen, die du nicht erst übersetzen musst.“
- „Technisch tief drin. Im Gespräch angenehm unkompliziert.“
- „Ein Entwickler und Webdesigner, mit dem du ganz normal über dein Projekt sprechen kannst.“

Die Zeitangaben nicht irreführend addieren. Empfohlene Formulierung für die spätere Copy:

> Seit rund 10 Jahren arbeite ich mit Code – davon 3 Jahre professionell in der Softwareentwicklung und seit rund
> einem Jahr mit klarem Fokus auf Webdesign.

Next.js nicht nur als Technologie nennen, sondern in Kundennutzen übersetzen: schnelle Ladezeiten, saubere technische
Basis, individuelle Erweiterbarkeit und keine Beschränkung durch starre Baukastenvorlagen. Aussagen wie „besser“,
„schneller“ oder „skalierbar“ nur verwenden, wenn sie konkret erklärt oder belegt werden.

#### Angebots- und Paketstruktur

Arbeitstitel für drei klar unterscheidbare Pakete:

1. **Landingpage** – eine fokussierte Seite für ein Angebot oder eine Kampagne; das bestehende Landingpage-Angebot
   bleibt erhalten.
2. **Business-Website** – eine vollständige Website für Selbstständige und kleine Unternehmen mit mehreren
   Kernseiten.
3. **Website nach Maß** – größere, individuell strukturierte Websites mit zusätzlichen Seitentypen, Inhalten oder
   technischen Anforderungen.

„Große Webseite“ nicht als finalen Paketnamen verwenden, weil der Begriff keinen Nutzen und keine klare Abgrenzung
vermittelt. „Website nach Maß“ ist vorerst der bevorzugte Arbeitsname; Alternativen vor der Copy-Phase anhand der
Zielgruppe prüfen.

**Paketinhalte sind TBD.** Vor der Umsetzung je Paket mindestens festlegen:

- ideale Zielgruppe und konkreter Einsatzzweck
- Anzahl beziehungsweise Art der Seiten und Sektionen
- enthaltene Leistungen für Strategie, Copy, Design, Entwicklung, Formular, SEO-Basis und Launch
- Anzahl der Feedback-Runden
- realistischer Zeitrahmen
- Festpreis, „ab“-Preis oder individuelle Kalkulation
- klare Abgrenzung und typische Gründe für ein Upgrade ins nächste Paket
- nicht enthaltene Leistungen und transparente Regeln für Zusatzaufwand

Die Pakete dürfen nicht nur über Umfang verkauft werden. Jede Stufe braucht ein verständliches Ergebnis und eine klare
Antwort auf die Frage „Welches Paket passt zu meiner Situation?“.

#### Seiten- und Copy-Konzept

Nach der Routing-Entscheidung eine vollständige Argumentationsfolge ausarbeiten. Vorläufige Reihenfolge:

1. Hero mit Webdesign-Kernversprechen, persönlichem Bild und einem primären Anfrage-CTA
2. Problem und gewünschtes Ergebnis der Zielgruppe
3. persönliche Differenzierung: Designverständnis plus echte Softwareentwicklung
4. drei Angebotspakete mit Entscheidungshilfe
5. Arbeitsweise beziehungsweise Projektablauf
6. ausgewählte Arbeiten oder ehrlicher aktueller Referenzstatus
7. Technik- und Qualitätsprinzipien in verständlichem Kundennutzen
8. FAQ zu Umfang, Zeit, Preis, Pflege und Zusammenarbeit
9. Abschluss-CTA und Anfrageformular

Für die spätere Copy gelten:

- eine primäre Zielgruppe und eine primäre Aktion pro Seite definieren
- ruhig, direkt, konkret und in „du“-Ansprache schreiben
- Erfahrung sachlich als Vertrauenssignal nutzen, nicht als Selbstzweck
- keine unbelegten Superlative, Garantien, erfundenen Referenzen oder Buzzword-Cluster
- CTA-Text und Formularziel über die gesamte Seite konsistent halten
- deutsche und englische Dictionaries mit identischer Struktur parallel pflegen
- Meta-Texte, OpenGraph-Inhalte und Structured Data in den Copy-Scope aufnehmen

#### Visuelle Richtung und benötigte Assets

Das Design vollständig neu entwickeln; nicht lediglich Farben und Karten des aktuellen Layouts austauschen.

**Vorgeschlagene Richtung:** eine persönliche, editorial-technische Gestaltung, die Präzision aus der
Softwareentwicklung mit einem ruhigen, hochwertigen Webdesign-Auftritt verbindet.

- Invessiv-Logo beziehungsweise Logoform als großes, angeschnittenes Hintergrundmotiv oder dezentes Wasserzeichen
  einsetzen; Lesbarkeit und Kontrast müssen in Dark und Light Theme erhalten bleiben.
- Hintergrundfarben zwischen Sektionen bewusst wechseln, um Rhythmus und klare Kapitel zu schaffen. Dafür wenige,
  markentypische Flächenfarben und zentrale Design-Tokens verwenden.
- Asymmetrische, aber kontrollierte Komposition statt wiederholter Standard-Kartenraster prüfen.
- Typografie, Abstände, Bildsprache und Linien-/Rasterdetails als zusammenhängendes System definieren.
- Codebezug nur subtil und glaubwürdig einsetzen; keine dekorativen Terminalfenster oder beliebigen Code-Snippets ohne
  inhaltliche Funktion.
- Animationen sparsam und zielgerichtet einsetzen; Reduced Motion, mobile Performance und Lesefluss priorisieren.

**Eigenes Foto produzieren:**

- authentisches Portrait beziehungsweise Arbeitssituation fotografieren; keine generische Stock-Optik
- vor dem Shooting Einsatzzweck, Seitenverhältnis und benötigten Negativraum für Hero-Copy festlegen
- Varianten für Desktop und Mobile aufnehmen; nach Möglichkeit Querformat, Hochformat und enger Portrait-Crop
- ruhiges Licht, reale Arbeitsumgebung und farbliche Anschlussfähigkeit an beide Themes sicherstellen
- finale Assets als optimierte responsive Bilder über `next/image` einbinden; Alt-Texte und feste Dimensionen
  vorsehen

#### Umsetzung in kleinen, prüfbaren Schritten

- [ ] Routing-/Conversion-Entscheidung treffen und betroffene bestehende Landingpage-Pläne aktualisieren.
- [ ] Zielgruppe, Haupt-CTA und gewünschtes Anfrageergebnis festlegen.
- [ ] Branding-Claim zur unkomplizierten, verständlichen Zusammenarbeit schärfen und mit echten Kundenaussagen prüfen.
- [ ] Paketnamen, Leistungsumfang, Preise, Zeitrahmen und Grenzen definieren.
- [ ] Content-Wireframe und finale Sektionsreihenfolge erstellen.
- [ ] Copy für DE und EN inklusive SEO-/OpenGraph-/Structured-Data-Inhalten schreiben.
- [ ] Moodboard und ein verbindliches Designkonzept mit Logo-, Farb-, Typografie- und Bildsystem erstellen.
- [ ] Shotlist erstellen, eigenes Foto aufnehmen, auswählen und für alle Breakpoints exportieren.
- [ ] Jede Sektion als eigene, kleine Komponente mit co-located `*.module.css` umsetzen; Route nur orchestrieren lassen.
- [ ] Gemeinsame Contracts, Konstanten und Patterns vor einem Export in den vorgesehenen `common`-Bereich verschieben.
- [ ] CTAs, Formularzustände und strukturierte Tracking-Events für den neuen Conversion-Flow umsetzen.
- [ ] Dark und Light Theme sowie 360 px, Tablet und Desktop visuell prüfen.
- [ ] Keyboard-Navigation, Fokus-Reihenfolge, sichtbare Fokuszustände und WCAG-2.2-AA-Kontrast prüfen.
- [ ] Relevante Unit-/Integrationstests und einen Playwright-Smoke für den Kernablauf ergänzen.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` und `pnpm --filter @invessiv/web build` ausführen.
- [ ] Lighthouse mobil prüfen; Zielwerte > 90 für Performance, Best Practices und SEO sowie LCP < 2 s anstreben.

#### Akzeptanzkriterien

- Das primäre Angebot wird innerhalb weniger Sekunden als Webdesign-Leistung verstanden.
- Besucher können die drei Pakete anhand ihres Bedarfs unterscheiden; das Landingpage-Angebot bleibt klar erhalten.
- Die Kombination aus Coding-, Softwareentwicklungs- und Webdesign-Erfahrung ist konkret und glaubwürdig erklärt.
- Das Design besitzt mit Logo-Hintergrund, wechselnden Farbflächen und eigener Fotografie eine erkennbare Invessiv-
  Handschrift und wirkt nicht wie ein Template.
- Keine bestehende Google-Ads-Conversion-Strecke wird unbeabsichtigt verändert oder verwässert.
- DE und EN sind in Struktur und Aussage synchron.
- Der Anfrage-Flow ist responsiv, zugänglich, messbar und ohne toten CTA nutzbar.

#### Noch offene Entscheidungen

- Neue Route `/services/webdesign` oder bewusster Ersatz der bestehenden `/services/landing-page`?
- Wer ist die eine primäre Zielgruppe der breiten Webdesign-Seite?
- Welcher CTA und welches Formularziel gelten für alle drei Pakete?
- Welche finalen Paketnamen, Inhalte, Preise und Lieferzeiten werden angeboten?
- Welche echten Projekte, Screenshots oder belastbaren Qualitätsnachweise dürfen gezeigt werden?
- Welche Logo-Variante und welche Farbwelt bilden die verbindliche visuelle Basis?
