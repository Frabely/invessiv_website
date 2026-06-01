# Umsetzungsplan: LinkedIn-Post-Seite

## Zielbild

Die Seite `/services/linkedin-post` positioniert den kostenlosen LinkedIn-Post-Generator als Einstieg und Proof of
Concept.
Die eigentliche Conversion ist die Anfrage fuer einen individuellen Content- oder KI-Workflow.

> Status: Arbeitsblock 1 ist umgesetzt. Die weiteren Bloecke bleiben als offene Planung stehen.

Primaere Nutzeraktionen:

- `Post generieren`: Generator testen und direkt einen Beispielpost erhalten.
- `Projekt anfragen`: individuellen Workflow ueber das Anfrageformular anfragen.

Leitlinie fuer Copy und Design:

- Copy folgt `$copywriting`: klar, konkret, ohne ueberzogene Claims, mit sauberer Trennung zwischen Free-Generator und
  individuellem Workflow.
- UI folgt `$frontend-design`: Mobile-first, klare CTA-Hierarchie, sichtbar unterschiedliche Sections, keine generischen
  Layout-Erweiterungen.

## Arbeitsblock 1: Copy- und Conversion-Fundament

Status: umgesetzt.

Ziel: Die Seite erklaert klarer, dass der Free-Generator nur ein Beispiel fuer individuelle Automatisierung ist.

Aufgaben:

- Hero, Generator-Intro, Custom-Post-Section und Final-CTA auf eine konsistente Argumentationslinie pruefen.
- CTA-Sprache vereinheitlichen: `Post generieren` fuer den Generator, `Projekt anfragen` oder `Workflow anfragen` fuer
  das Anfrageformular.
- DE/EN-Dictionaries parallel pflegen.
- Claims ohne harte Belege vermeiden.
- Begriffe in Header und Footer differenzieren, damit nicht mehrfach `Workflow` direkt nebeneinander steht.

Akzeptanzkriterien:

- Auf Mobile ist sofort klar: kostenlos testen oder individuelles Projekt anfragen.
- Kein Abschnitt verkauft den Free-Generator als Hauptprodukt.
- Alle sichtbaren Texte liegen in Dictionaries.
- Header und Footer nutzen unterscheidbare Begriffe wie `Beispielposts`, `Ablauf`, `Projekt anfragen`.

Tests:

- Route-Test fuer `/services/linkedin-post`.
- `npm run typecheck`.
- Manuelle Copy-Pruefung fuer DE und EN.

## Arbeitsblock 2: Beispielposts Verstaendlicher Machen

Ziel: Der Nutzen des Generators wird schneller verstaendlich, indem Beispielposts Input und Output zeigen.

Aufgaben:

- Example Section um eine `Input` + `Output`-Darstellung erweitern.
- Pro Beispiel zeigen: Thema, Rolle oder Branche, Ton als Input; erzeugtes Bild und Caption als Output.
- Unteren Teil der Example Section so umbauen, dass er aktiv zum Generator fuehrt.
- Mobile Layout zuerst planen: Input kompakt, Output prominent.

Akzeptanzkriterien:

- Nutzer versteht ohne Formularausfuellen, was der Generator aus welchen Angaben macht.
- Beispielsektion bleibt scanbar und nicht textlastig.
- CTA fuehrt zum Generator.
- Beispielposts sind auf 360 px ohne horizontales Scrollen lesbar.

Tests:

- Component-Test, falls neue Renderlogik entsteht.
- Visual Check fuer 360 px, Tablet und Desktop.
- `npm run typecheck`.

## Arbeitsblock 3: Generator UX Umbauen

Ziel: Weniger fruehe Reibung, bessere Mobile-Erfahrung und klarerer Weg vom Ergebnis zur Anfrage.

Aufgaben:

- Generator-Eingaben von Name/E-Mail trennen: erst Thema, Rolle/Branche und Ton, danach E-Mail optional fuer Zusendung
  oder Download.
- Nach erfolgreicher Generierung auf Mobile direkt zum erzeugten Post scrollen.
- Direkt am generierten Post eine klare Ueberleitung zur Anfrage platzieren.
- Zwei Gratis-Nutzungen positiv formulieren: `Du kannst den Generator 2x kostenlos testen`.
- Nach der zweiten Nutzung direkt zum Anfrageformular fuehren.

Akzeptanzkriterien:

- Nutzer kann den Generator starten, ohne direkt Kontaktdaten einzugeben.
- Mobile Success State ist sichtbar, ohne manuelles Suchen.
- Anfrage-CTA im Success State ist klar, aber nicht aufdringlich.
- Form-State, Request-DTO und Persistenz-Input bleiben getrennt.

Tests:

- Generator-Component-Tests fuer Submit, Success und Scroll-Verhalten.
- API-/Service-Tests fuer Generator-Flows.
- E2E-Smoke fuer Generator Happy Path, falls in der bestehenden Teststruktur sinnvoll.

## Arbeitsblock 4: Privacy, Consent und Limitierung

Ziel: Nutzungslimits und Datenerfassung rechtlich und technisch sauber einordnen, bevor harte Limits live gehen.

Aufgaben:

- Pruefen, welche Daten beim Generieren verarbeitet oder gespeichert werden: E-Mail, IP, Prompt/Input, Generated Output.
- Privacy-Hinweis im Generator ergaenzen, falls personenbezogene oder nutzungsbezogene Daten verarbeitet werden.
- Klaeren, ob ein Cookie-Banner noetig ist. Default-Annahme: nur, wenn nicht notwendige Cookies, Tracking oder Storage
  eingefuehrt werden.
- Limitierungsmodell festlegen: empfohlen serverseitig ueber E-Mail plus technische Abuse-Grenze, nicht rein
  clientseitig.
- Monatsbudget als Betriebsgrenze dokumentieren, nicht als alleinige UI-Logik.

Akzeptanzkriterien:

- Nutzer sieht vor Dateneingabe, wofuer E-Mail/Input genutzt werden.
- Keine neue Tracking- oder Storage-Mechanik ohne dokumentierten Zweck.
- Limit-Regeln sind verstaendlich und positiv formuliert.
- Datenschutzrelevante Texte werden in DE/EN parallel gepflegt.

Tests:

- Unit-/Integration-Test fuer Limitierungslogik, sobald implementiert.
- API-Tests fuer Rate-Limit-Fehlerpfade.
- Privacy-/Consent-Copy manuell gegen aktuelle Datenfluesse pruefen.

## Arbeitsblock 5: Submission-Typen und Anfragefluss

Ziel: Anfragen aus Landingpage und LinkedIn-Post-Service werden sauber unterscheidbar.

Aufgaben:

- Eigene Submission-Typen fuer `service/landing-page` und `service/linkedin-post` einfuehren.
- Payload-Kontext fuer LinkedIn-Post-Anfrage klar setzen.
- Analytics/Form-ID fuer LinkedIn-Post-Anfrage eindeutig halten.
- Bestehende Kontakt- und Submission-Pfade nicht brechen.

Akzeptanzkriterien:

- Eingehende Leads lassen sich nach Service-Quelle unterscheiden.
- Landingpage-Anfragen behalten ihr bisheriges Verhalten.
- LinkedIn-Post-Anfragen enthalten genug Kontext fuer Follow-up.
- Error-Codes und Messages folgen dem Projektpattern.

Tests:

- DTO-/Mapper-/Route-Tests fuer neue Submission-Typen.
- Bestehende Contact-Tests bleiben gruen.
- `npm run typecheck`.

## Arbeitsblock 6: Layout, Spacing und Mobile Polish

Ziel: Die Seite wirkt auf Mobile und Desktop bewusst gefuehrt und nicht wie lose Generator-Bloecke.

Aufgaben:

- Desktop-Section-Abstaende pruefen und moderat erhoehen, wo Sections zu dicht wirken.
- Mobile Hero mit zwei sichtbaren CTAs beibehalten: primaer `Post generieren`, sekundaer Anfrage-CTA.
- Workflow Showcase im 4:5-Postformat beibehalten, damit Logo oben und Link unten sichtbar bleiben.
- Footer-Inhalte auf die LinkedIn-Post-Seite zuschneiden, aber die gemeinsame Footer-Komponente weiterverwenden.

Akzeptanzkriterien:

- 360 px: keine ueberlappenden CTAs, kein abgeschnittener Post, klare Section-Reihenfolge.
- Desktop: Sections haben mehr Ruhe, ohne die Seite unnoetig lang zu machen.
- Fokus-States und Tap-Ziele bleiben sauber.
- Header und Footer enthalten keine rohen Hash-Labels.

Tests:

- `npm run lint`.
- `npm run typecheck`.
- Manuelle responsive Checks fuer 360 px, 768 px und Desktop.
- Optional Playwright-Screenshot, falls visuelle Regressionen im Review schwer einzuschaetzen sind.

## Backlog / Spaeter

- Monatsbudget-Anzeige im UI: erst nach stabiler Kostenberechnung pro Post.
- ZIP-Download fuer Bild + Caption.
- Versand von Bild und Caption per E-Mail.
- Harte Monatsbudget-Integration mit OpenAI-Budget.
- Desktop-Hero mit Post-Vorschauen, falls die aktuelle Hero-Botschaft danach noch zu abstrakt wirkt.

## Empfohlene Review-Reihenfolge

1. Arbeitsblock 1 + 2: Positionierung und Beispiele schaerfen.
2. Arbeitsblock 3: Generator-UX und Success-Ueberleitung verbessern.
3. Arbeitsblock 4 + 5: Privacy, Limits und Submission-Typen stabilisieren.
4. Arbeitsblock 6: Layout-Feinschliff und responsive QA.

## Annahmen

- Die Umsetzung erfolgt blockweise in kleinen PRs.
- DE und EN bleiben immer synchron.
- Die bestehende Route, Dictionary-Struktur und gemeinsame Footer/Header-Komponenten werden beibehalten.
- Neue Logik wird nah an bestehenden Generator-, Contact- und DTO-Layern umgesetzt.
