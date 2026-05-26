# Angebotsstruktur Umsetzungsplan

## Zielbild

Die Website wird von mehreren gleichwertigen Einzelleistungen auf zwei klare Kernangebote ausgerichtet:

- `Webauftritt & Landingpages`
- `Prozessoptimierung & digitale Workflows`

`Support & Wartung` bleibt als sekundäre Zusatzleistung sichtbar, aber nicht als gleichwertiges Hauptangebot.

`Landingpages` sind das Hauptangebot im Bereich `Webauftritt & Landingpages`. Die bestehende Service-Detailseite
`/services/landing-page` bleibt die Detailseite dafür und wird weiter wie bisher verlinkt.

Im Bereich `Prozessoptimierung & digitale Workflows` gibt es zwei Angebotsstufen:

- kleines Angebot: `Custom KI-Skills für wiederkehrende Prozesse`
- großes Angebot: `Individuelle Softwarelösung für Prozesse`

Diese Angebotsstufen werden nicht als zusätzliche Pflichtauswahl im Formular eingeführt. Sie dienen als klare
Orientierung in der Services Section und in der Formular-Microcopy.

## Resultate der Copy-Planphase

Diese Entscheidungen stammen aus der Copywriting-Planphase und sind für die weitere Umsetzung verbindlich.

Relevante Umsetzungsdateien:

- Services-Content: [`../src/i18n/dictionaries/marketing/home.ts`](../src/i18n/dictionaries/marketing/home.ts)
- Services-UI-Texte DE: [
  `../src/i18n/dictionaries/marketing/home-ui.de.json`](../src/i18n/dictionaries/marketing/home-ui.de.json)
- Services-UI-Texte EN: [
  `../src/i18n/dictionaries/marketing/home-ui.en.json`](../src/i18n/dictionaries/marketing/home-ui.en.json)
- Services-Section: [
  `../src/components/marketing/home/sections/services-section/services-section.tsx`](../src/components/marketing/home/sections/services-section/services-section.tsx)
- Services-Tests: [
  `../src/components/marketing/home/sections/services-section/services-section.test.tsx`](../src/components/marketing/home/sections/services-section/services-section.test.tsx)
- Dictionary-Tests: [`../src/i18n/dictionaries/marketing/home.test.ts`](../src/i18n/dictionaries/marketing/home.test.ts)

### Zielgruppe und Tonalität

- Primäre Zielgruppe: Dienstleister und KMU, insbesondere Inhaber und kleine Teams.
- Hauptfrage der Nutzer: `Passt das für mich?`
- Die Copy muss zuerst einordnen, welches Angebot sinnvoll ist, bevor sie Details erklärt.
- Tonalität: direkt, pragmatisch, klar, ohne überzogene Versprechen.
- Primäre CTA-Richtung: `Angebot einschätzen lassen`.

### Webauftritt & Landingpages

- Landingpages bleiben der klare Einstieg und das Hauptangebot.
- Website, Relaunch und Upgrade bleiben als kompakte Anwendungsfälle sichtbar.
- Hauptnutzen: passendere Anfragen, weil Angebot, Zielgruppe und nächster Schritt klarer werden.
- Sichtbarer Lieferumfang in der kompakten Copy:
  - Struktur
  - Design
  - mobile Umsetzung
  - SEO-Basis
  - Kontaktweg/Formular
  - Launch
- Prozesslogik: `Ziel klären -> Struktur entwickeln -> Umsetzung -> Launch`.
- Preislogik: In der kompakten Services Section keine Preise nennen; Preisdetails bleiben auf der
  Landingpage-Detailseite
  oder werden nach Scope im Anfrageprozess geklärt.

### Prozessoptimierung & digitale Workflows

- Kernnutzen: Prozesse beim Kunden einfacher, schneller, zentraler und weniger fehleranfällig machen.
- Das Angebot soll nicht nur als Automatisierung wirken, sondern als bessere Arbeitsweise für wiederkehrende Abläufe.
- Zwei Angebotsstufen bleiben als Orientierung sichtbar:
  - `Custom KI-Skills für wiederkehrende Prozesse`
  - `Individuelle Softwarelösung für zentrale Prozessabläufe`
- Beispielrahmen für die Copy:
  - Kundenanfragen oder E-Mails auswerten
  - wiederkehrende Inhalte oder Antworten vorbereiten
  - Kundendaten, Status und Folgeschritte zentral verwalten
  - verstreute Arbeit aus mehreren Systemen in einen klaren Workflow bringen
- Prozesslogik: `Prozess verstehen -> Engpass finden -> passende Lösung bauen -> Übergabe`.
- Grenze: Kein Overengineering; die kleinste sinnvolle Lösung wird bevorzugt.

### Copy-Umsetzungsregeln

- Services Section bleibt kompakt; keine langen Absätze.
- Pro Angebot maximal:
  - eine klare Headline
  - ein kurzer Nutzenabsatz
  - drei kompakte Ergebnis-/Lieferumfangspunkte
  - vier kurze Prozessworte
- DE/EN parallel pflegen.
- Keine neuen Inline-Texte in Komponenten.
- Keine Preisversprechen in der kompakten Services Section.
- Preis-/Conversion-Entscheidung: Keine Preise in der Services Section ist akzeptabel, solange Preisdetails über die
  Landingpage-Detailseite oder den Anfrageprozess transparent aufgefangen werden. Hintergrund:
  - [HockeyStack: Pricing-/Demo-Page Transparenz im B2B-Kontext](https://www.hockeystack.com/lab-blog-posts/state-of-pricing-demo-case-study-pages)
  - [BAMS: Transparente Kosten am Checkout/Kaufpunkt](https://www.bams.com/blog/transparent-checkout-pricing/)

## Grundsatzentscheidungen

- Das aktuelle Design der Services Section bleibt final.
- Layout-Anpassungen sind nur minimal erlaubt, z. B. etwas mehr Raum im `SelectedService`-Content-Bereich.
- Der Content bleibt kompakt, scannbar und ohne lange Textblöcke.
- Neue Service-Landingpages sind nicht Teil dieses Plans.
- Die bestehende Landingpage-Verlinkung auf `/services/landing-page` bleibt erhalten.
- Für `Individuelle Softwarelösung für Prozesse` ist später eine eigene Detailseite geplant, aber nicht Bestandteil
  dieser Umsetzung.
- Es wird keine neue DB-Spalte für Unterservices eingeführt.
- Es wird kein neues Pflichtfeld wie `offerDetailKey` eingeführt.
- `landing` bleibt der technische Canonical-Key für das neue Web-Angebot.
- Bestehende Offer-Keys bleiben gültig und werden kompatibel behandelt:
  - `landing`, `web`, `upgrade` gehören fachlich zum Web-Angebot.
  - `process` gehört zum Prozess-/Workflow-Angebot.
  - `maintenance` gehört zu Support & Wartung.

## Zu nutzende Skills bei der Umsetzung

- `copywriting`: Angebotsnamen, Services-Copy, CTA-Texte und Formular-Microcopy.
- `frontend-design`: minimale Services-Section-Anpassungen ohne Bruch des finalen Designs.
- `accessibility`: dynamische Formularfelder, Labels, Fokusführung und Tastaturbedienung.
- `best-practices`: Offer-Mapping, DTO-/Validation-Kompatibilität und kleine reviewbare Schritte.
- `seo`: nur falls Metadata, Structured Data oder servicebezogene SEO-Texte angepasst werden.

## Schritt 1: Offer-Mapping und sichtbare Angebotslogik festziehen ✅ Erledigt

Ziel: Die UI zeigt zwei Kernangebote, während bestehende technische Werte kompatibel bleiben.

Umsetzung:

- Bestehende `CONTACT_OFFER_KEY`-Werte in `packages/common` nicht entfernen.
- In `apps/web/common` ein kleines Mapping für die Website-Logik ergänzen oder vorhandene Marketing-Contracts erweitern:
  - Web-Gruppe: `landing`, `web`, `upgrade`
  - Prozess-Gruppe: `process`
  - Support-Gruppe: `maintenance`
- `landing` als Canonical-Key verwenden, wenn die Services Section oder das Formular das neue Web-Angebot auswählt.
- `web` und `upgrade` nur noch als Legacy-Werte akzeptieren und fachlich wie Web behandeln.

Review-Grenze:

- Nur Constants/Mapping/Types.
- Keine UI-Änderungen.
- Keine DB-Migration.

Tests:

- Unit-Test für das Mapping:
  - `landing`, `web`, `upgrade` => Web
  - `process` => Prozess
  - `maintenance` => Support

Status:

- Erledigt.
- Relevante Umsetzung:
  - [`../common/constants/marketing/contact-offer-groups.ts`](../common/constants/marketing/contact-offer-groups.ts)
  - [
    `../common/constants/marketing/contact-offer-groups.test.ts`](../common/constants/marketing/contact-offer-groups.test.ts)

## Schritt 2: Services Section inhaltlich umbauen ✅ Erledigt

Ziel: Die Services Section zeigt nur zwei primäre Angebote plus Support als Zusatzleistung.

Umsetzung:

- Primäre Service-Reihenfolge auf zwei Einträge reduzieren:
  - Web-Angebot mit technischem Key `landing`
  - Prozess-Angebot mit technischem Key `process`
- `maintenance` bleibt separat in `ExtraService`.
- `web` und `upgrade` nicht mehr als eigene `SecondaryService`-Einträge rendern.
- `SelectedService` fachlich schärfen:
  - Web: Landingpages als Hauptangebot hervorheben; neue Websites, Relaunch und bestehende Website verbessern nur als
    kompakte Anwendungsfälle nennen.
  - Prozess: nur zwei Angebotsstufen nennen: `Custom KI-Skills für wiederkehrende Prozesse` und
    `Individuelle Softwarelösung für Prozesse`.
- Detail-Verlinkung:
  - Web-Angebot verlinkt weiter auf die bestehende Landingpage-Detailseite `/services/landing-page`.
  - Für Prozess-Angebote wird in diesem Plan keine neue Detailseite erstellt.
  - Solange keine Prozess-Detailseite existiert, führt die Prozess-CTA in den Anfrage-/Kontaktfluss.
- Falls nötig, den Content-Bereich leicht großzügiger setzen, ohne das Section-Design neu zu bauen.
- `service-action-cta.tsx` so belassen bzw. nur so anpassen, dass alle neuen CTA-Texte der Section weiterhin darüber
  laufen.

Content-Regeln:

- Keine Wall of Text.
- Maximal kurze Differenzierer, Chips oder kompakte Bullet-ähnliche Zeilen.
- Sichtbare Texte in DE/EN Dictionaries pflegen.
- Keine neuen Inline-Texte in Komponenten.

Review-Grenze:

- Services Section, zugehörige Unterkomponenten und Dictionaries.
- Keine Formularlogik in diesem Schritt.

Tests:

- Services-Section-Test:
  - zwei primäre Angebote werden gerendert.
  - Support wird separat gerendert.
  - `web` und `upgrade` erscheinen nicht mehr als eigenständige Hauptangebote.
  - CTA-Event liefert weiterhin einen gültigen `offerKey`.

Status:

- Erledigt.
- Relevante Umsetzung:
  - [
    `../src/components/marketing/home/sections/services-section/services-section.tsx`](../src/components/marketing/home/sections/services-section/services-section.tsx)
  - [
    `../src/components/marketing/home/sections/services-section/selected-service/selected-service.tsx`](../src/components/marketing/home/sections/services-section/selected-service/selected-service.tsx)
  - [
    `../src/components/marketing/home/sections/services-section/extra-service/extra-service.tsx`](../src/components/marketing/home/sections/services-section/extra-service/extra-service.tsx)
  - [
    `../src/components/marketing/home/sections/services-section/services-section.module.css`](../src/components/marketing/home/sections/services-section/services-section.module.css)
  - [
    `../src/components/marketing/home/sections/services-section/extra-service/extra-service.module.css`](../src/components/marketing/home/sections/services-section/extra-service/extra-service.module.css)
  - [`../src/i18n/dictionaries/marketing/home.ts`](../src/i18n/dictionaries/marketing/home.ts)
  - [`../src/i18n/dictionaries/marketing/home-ui.de.json`](../src/i18n/dictionaries/marketing/home-ui.de.json)
  - [`../src/i18n/dictionaries/marketing/home-ui.en.json`](../src/i18n/dictionaries/marketing/home-ui.en.json)

## Schritt 3: Kontaktformular auf zwei klare Angebote ausrichten ✅ Erledigt

Ziel: Das Formular bleibt dynamisch, fragt aber keine zusätzliche Unterservice-Entscheidung ab.

Umsetzung:

- Sichtbare Angebotsauswahl im Formular auf klare Optionen ausrichten:
  - Webauftritt & Landingpages
  - Prozessoptimierung & digitale Workflows
  - Support & Wartung
- Technische Werte:
  - Webauswahl setzt `offerKey: "landing"`.
  - Prozessauswahl setzt `offerKey: "process"`.
  - Supportauswahl setzt `offerKey: "maintenance"`.
- Kein neues Feld `offerDetailKey`.
- Kein zusätzlicher Unterservice-Select.
- Dynamische Felder wie bisher je nach Angebot anzeigen, aber Labels und Hilfetexte an das neue Zielbild anpassen:
  - Web: Ziel, bestehende Website, Umfang/Seiten, Projektbeschreibung.
  - Prozess: wiederkehrender Prozess, Bedarf an Custom KI-Skill oder individueller Softwarelösung, vorhandene
    Arbeitsweise/Tools, Projektbeschreibung.
  - Support: bestehendes Projekt oder Website, Änderungs-/Wartungsbedarf, Projektbeschreibung.
- Die zwei Prozess-Angebotsstufen nur als Orientierung in Hilfetexten oder Platzhaltern nennen, nicht als
  Pflichtentscheidung.

Review-Grenze:

- Project Request Form, Form-Optionen, Dictionaries und Tests.
- Keine Server-/DB-Änderung, solange DTO und Payload gleich bleiben.

Tests:

- Formular-Test:
  - Webauswahl zeigt Web-relevante Felder.
  - Prozessauswahl zeigt Prozess-relevante Felder.
  - Supportauswahl zeigt Support-relevante Felder.
  - Es existiert kein erforderliches Unterservice-Feld.

Status:

- Erledigt.
- Relevante Umsetzung:
  - [
    `../src/components/marketing/home/home-sections-renderer.tsx`](../src/components/marketing/home/home-sections-renderer.tsx)
  - [
    `../src/components/marketing/home/sections/contact-section/project-request-form/project-request-form.tsx`](../src/components/marketing/home/sections/contact-section/project-request-form/project-request-form.tsx)
  - [
    `../src/components/marketing/home/sections/contact-section/project-request-form/project-request-form.test.tsx`](../src/components/marketing/home/sections/contact-section/project-request-form/project-request-form.test.tsx)
  - [`../src/i18n/dictionaries/marketing/home.ts`](../src/i18n/dictionaries/marketing/home.ts)

## Schritt 4: Validation, Mail und Persistenz kompatibel prüfen

Ziel: Die neue UI bricht keine bestehenden Payloads und keine Lead-Persistenz.

Umsetzung:

- `SaveProjectRequestDto` unverändert lassen, sofern kein neues Feld nötig ist.
- DB-Schema unverändert lassen.
- Server-Validation prüfen:
  - `landing`, `web`, `upgrade`, `process`, `maintenance` bleiben valide.
  - Alte Pflichtlogik darf nicht gegen die neue UI arbeiten.
  - Falls die neue Webauswahl technisch `landing` nutzt, muss sie die passenden Web-/Landingpage-Felder erlauben.
- Mail-Template prüfen:
  - Offer-Labels auf neue Angebotslogik aktualisieren.
  - Legacy-Werte `web` und `upgrade` verständlich als Web-Angebot darstellen.
- Lead-Mapping prüfen:
  - Keine neue Persistenzlogik einführen.
  - Bestehende Felder weiter sauber übertragen.

Review-Grenze:

- Server-Validation, Mapper-Labels und Mail-Template.
- Nur Kompatibilitätsanpassungen, keine neue Datenstruktur.

Tests:

- Validation-Test:
  - alle bestehenden Offer-Keys bleiben gültig.
  - neue Webauswahl über `landing` funktioniert mit den erwarteten Feldern.
- Mail-/Mapper-Test, falls vorhandene Tests die Offer-Labels oder Payload-Aufbereitung abdecken.

## Schritt 5: Workspace-Leads nur bei Bedarf anfassen

Ziel: Die Leadverwaltung bleibt kompatibel und zeigt keine veraltete Angebotslogik, falls Offer-Labels dort sichtbar
sind.

Umsetzung:

- In `apps/workspace` prüfen, ob `offer_key` sichtbar gemappt oder lokal übersetzt wird.
- Nur falls sichtbar:
  - Labels für `landing`, `web`, `upgrade` fachlich auf Webauftritt/Landingpages vereinheitlichen.
  - `process` als Prozessoptimierung/digitale Workflows benennen.
  - `maintenance` als Support & Wartung benennen.
- Keine neue Leadverwaltung bauen.
- Keine neuen Workspace-Flows einführen.

Review-Grenze:

- Nur Label-/Anzeigeanpassungen im Workspace.
- Keine Workspace-Architekturänderung.

## Schritt 6: Qualitätssicherung und Abschluss

Ausführen:

- `npm run typecheck`
- `npm run lint`
- relevante Vitest-Tests für:
  - Services Section
  - Project Request Form
  - Validation/Mapper, falls angepasst

Zusätzliche Checks:

- DE/EN Dictionaries enthalten identische Keys.
- Keine neuen sichtbaren Inline-Texte in Komponenten.
- Services Section bleibt visuell kompakt.
- Keine neue DB-Migration wurde eingeführt.
- Keine Unterservice-Pflichtauswahl wurde eingeführt.

## Nicht-Ziele

- Keine neue Datenbankspalte für Unterservices.
- Kein neues `offerDetailKey`.
- Keine neue Service-Landingpage.
- Keine vollständige Neugestaltung der Services Section.
- Keine neue Workspace-Leadverwaltung.
- Keine große Copy-Erweiterung mit langen Leistungsbeschreibungen.
