# Briefing für Codex/Claude: KI-LinkedIn-Post-Generator als Lead-Magnet

## Ziel dieses Dokuments

Dieses Dokument ist ein Produkt-, Kampagnen- und Umsetzungsbriefing.  
Codex/Claude soll daraus im nächsten Schritt einen konkreten technischen Umsetzungsplan für mein bestehendes Projekt
ableiten.

Wichtig:  
Dieses Dokument ist **nicht** als kleinteilige technische Schritt-für-Schritt-Anleitung gedacht. Es beschreibt Ziele,
Rahmenbedingungen, Business-Logik, Sicherheitsgrenzen und Erfolgskriterien.

---

## Projektkontext

Ich betreibe bereits eine eigene Webseite auf Basis von Next.js.

Es existiert außerdem bereits ein Backend beziehungsweise eine Backend-Logik, mit der Leads erfasst werden können.

Die neue Funktion soll als Landingpage an meine bestehende Webseite angebunden werden.

Die Landingpage soll über LinkedIn-Traffic erreichbar sein. Der Einstieg erfolgt voraussichtlich über Posts auf meinem
eigenen LinkedIn-Profil.

---

## Grundidee

Besucher sollen auf einer Landingpage testen können, wie ein individueller KI-Assistent aus einem bis maximal 3 Bildern
und kurzem Kontext einen LinkedIn-Beitrag erstellt.

Die Funktion ist ein Lead-Magnet und keine eigenständige SaaS-Plattform.

Der Besucher soll erleben:

> Ich lade ein Bild hoch, gebe ein paar Stichpunkte ein und bekomme daraus einen professionellen LinkedIn-Post.

Das eigentliche Verkaufsziel ist jedoch nicht der einzelne kostenlose Post, sondern:

> Ich baue individuelle KI-Workflows und Custom-Skills für Unternehmen, die wiederkehrende Aufgaben automatisieren oder
> beschleunigen.

---

## Hauptziel der Kampagne

Das Hauptziel ist die Gewinnung qualifizierter Leads für individuelle KI-Workflows.

Die Landingpage soll:

1. Aufmerksamkeit aus LinkedIn-Traffic auffangen.
2. Name und E-Mail-Adresse erfassen.
3. Einen echten Nutzwert durch eine einmalige kostenlose KI-Generierung bieten (evtl. auch 2x falls wirklich der Inhalt
   nicht gefällt).
4. Die Leistungsfähigkeit eines individuellen KI-Skills demonstrieren.
5. Den Lead nach der Generierung gezielt zu einem Beratungsgespräch oder einer Projektanfrage führen.

---

## Wichtige Nicht-Ziele

Das MVP soll bewusst schlank bleiben.

Nicht Ziel der ersten Version:

- kein vollständiges SaaS-Produkt
- kein Nutzer-Dashboard
- kein Login-System mit Accounts
- keine Abos
- keine unbegrenzten Generierungen
- keine automatische Veröffentlichung auf LinkedIn
- keine komplexe Content-Kalender-Funktion
- keine Teamverwaltung
- keine perfekte Bildgenerierung
- keine zu große Prompt-Bibliothek für viele Branchen
- keine unnötig komplexe Architektur

Das Ziel ist Validierung:

> Bringt diese Demo qualifizierte Leads und Gespräche für individuelle KI-Workflow-Projekte?

---

## Zielgruppe

Primäre Zielgruppen:

- Selbstständige
- kleine Unternehmen
- B2B-Dienstleister
- Handwerker
- Berater
- Coaches
- Agenturen
- Immobilienmakler
- lokale Dienstleister
- kleine Geschäftsführer-Teams

Die Zielgruppe ist nicht primär technisch. Die Sprache der Landingpage soll deshalb geschäftlich, konkret und
nutzenorientiert sein.

Nicht verkaufen:

> KI, API, Prompting, Tooling

Sondern verkaufen:

> Zeitersparnis, bessere Sichtbarkeit, strukturierter Content, individueller Workflow

---

## Positionierung der Landingpage

Die Landingpage soll nicht generisch wie ein beliebiger KI-Textgenerator wirken.

Schwache Positionierung:

> Lass dir deine Social-Media-Posts von KI erstellen.

Bessere Positionierung:

> Teste kostenlos, wie ein eigener KI-Assistent aus deinem Bild und ein paar Stichpunkten einen LinkedIn-Beitrag
> erstellt.

Alternative Positionierung:

> Lade ein Bild hoch, gib kurz Kontext ein und erhalte einen fertigen LinkedIn-Post — als Demo für deinen eigenen
> KI-Workflow.

Zentrale Botschaft:

> Das Tool ist eine Demo dafür, wie individuelle KI-Workflows in Unternehmen Zeit sparen können.

---

## Kernversprechen an den Nutzer

Der Nutzer soll verstehen:

1. Ich bekomme sofort einen nutzbaren LinkedIn-Post.
2. Ich sehe, was ein individueller KI-Assistent leisten kann.
3. Ich kann so etwas für mein eigenes Unternehmen anfragen.
4. Der Anbieter kann nicht nur Webseiten bauen, sondern auch konkrete KI-Workflows integrieren.

---

## Nutzerfluss

Der gewünschte Nutzerfluss:

1. Nutzer kommt über LinkedIn oder direkt auf die Landingpage.
2. Landingpage erklärt kurz den Nutzen.
3. Nutzer gibt Name und E-Mail-Adresse ein.
4. Nutzer bestätigt Datenschutz-/Nutzungshinweise.
5. Optional: E-Mail wird verifiziert.
6. Nach erfolgreicher Lead-Erfassung wird die einmalige Tool-Nutzung freigeschaltet.
7. Nutzer lädt ein Bild hoch.
8. Nutzer gibt kurzen Kontext ein.
9. System prüft Limits und Berechtigung.
10. Backend ruft eine KI-API auf.
11. Die KI nutzt einen von mir definierten Custom Skill.
12. Nutzer erhält einen LinkedIn-Post.
13. Ergebnis wird optional per E-Mail gesendet.
14. Direkt nach dem Ergebnis erscheint ein klarer CTA zum nächsten Schritt.

---

## Lead-Erfassung

Es existiert bereits eine Lead-Erfassung. Diese soll verwendet und erweitert werden, falls notwendig.

Pflichtdaten:

- Name
- E-Mail-Adresse
- Zeitpunkt der Lead-Erfassung
- Kampagnenquelle, falls verfügbar
- Status der Tool-Nutzung
- Zeitpunkt der Tool-Nutzung
- eingegebener Kontext
- generiertes Ergebnis
- optional: Branche
- optional: Zielgruppe
- optional: CTA-Klick oder Anfrage-Status

Wichtige Statuslogik:

- Lead neu
- E-Mail verifiziert
- Tool freigeschaltet
- Tool genutzt
- Ergebnis ausgeliefert
- CTA geklickt
- Anfrage gestellt
- Follow-up sinnvoll
- nicht relevant
- Kunde geworden

Ziel:

> Jeder KI-Request muss einem Lead zugeordnet werden können.

---

## Voraussetzung vor Tool-Nutzung

Das Tool darf erst nach erfolgreicher Lead-Erfassung verfügbar sein.

Zielzustand:

> Ohne Kontaktdaten keine Generierung.

Empfohlene Logik:

1. Nutzer trägt Name und E-Mail ein.
2. Lead wird gespeichert.
3. System erstellt einen einmaligen Freischaltstatus.
4. Erst danach kann die KI-Funktion genutzt werden.

Optional, aber empfohlen:

- E-Mail-Verifikation per Magic Link oder Einmal-Code
- Tool erst nach bestätigter E-Mail freischalten

Begründung:

> E-Mail-Verifikation erhöht Lead-Qualität und reduziert Spam-/Bot-Nutzung.

---

## Definition eines Nutzers

Ein Nutzer soll primär über die verifizierte E-Mail-Adresse definiert werden.

Zusätzliche Missbrauchssignale:

- IP-Adresse
- Session/Cookie
- User-Agent
- Zeitpunkt und Häufigkeit der Requests
- Anzahl fehlgeschlagener Versuche
- globale Tageslimits

Ziel ist nicht, Missbrauch mathematisch unmöglich zu machen.  
Ziel ist, Missbrauch so stark zu begrenzen, dass Kosten und Spam kontrollierbar bleiben.

---

## Nutzungslimit pro Lead

Regel:

> Jeder verifizierte Lead darf genau eine erfolgreiche KI-Generierung kostenlos durchführen.

Wichtig:

- Fehlgeschlagene Systemfehler sollen den Nutzer nicht unfair blockieren.
- Erfolgreich abgeschlossene Generierungen zählen als verbraucht.
- Abgebrochene oder technische Fehler sollen separat bewertet werden.
- Wiederholte manuelle Versuche dürfen nicht zu unbegrenzten API-Kosten führen.

Empfohlene Zustände:

- `not_started`
- `lead_created`
- `verified`
- `generation_available`
- `generation_in_progress`
- `generation_completed`
- `generation_failed_retry_allowed`
- `generation_failed_blocked`
- `generation_used`

---

## Spam- und Abuse-Schutz

Die Lösung soll verhindern, dass Bots oder einzelne Personen massenhaft API-Kosten erzeugen.

Ziele:

1. Keine anonyme Nutzung.
2. Keine unbegrenzte Nutzung pro E-Mail.
3. Keine unbegrenzte Nutzung pro IP.
4. Keine unkontrollierten Wiederholungen bei Fehlern.
5. Keine clientseitig manipulierbare Freischaltung.
6. Keine API-Keys im Browser.

Empfohlene Schutzlogik auf Zielebene:

- 1 erfolgreiche Generierung pro verifizierter E-Mail-Adresse
- Rate Limit pro IP
- Rate Limit pro E-Mail
- Rate Limit pro Session/Cookie
- globales Tageslimit
- globales Monatsbudget
- maximale Bildgröße
- maximale Textlänge
- Bot-Schutz für das Lead-Formular
- serverseitige Prüfung vor jedem KI-Request
- Idempotenzschutz gegen mehrfaches Absenden
- optional Blockierung offensichtlicher Wegwerf-E-Mail-Domains
- optional Captcha bei auffälligem Verhalten

---

## Kostenrahmen

Das Tool darf monatlich ungefähr 50 € kosten.

Dieser Betrag ist ein Zielbudget, kein unbegrenztes Budget.

Ziel:

> Das Tool soll genug Nutzung ermöglichen, um Leads zu gewinnen, aber niemals unkontrolliert API-Kosten erzeugen.

Budgetrahmen:

- Zielbudget pro Monat: ca. 50 €
- rechnerischer Tagesdurchschnitt: ca. 1,60 € bis 1,70 €
- Soft-Limit pro Tag: ca. 1,50 €
- Hard-Limit pro Tag: ca. 2,00 €
- Soft-Limit pro Monat: ca. 45 €
- Hard-Limit pro Monat: ca. 50 €

Wichtig:

Diese Werte sollen konfigurierbar sein, nicht hart im Code versteckt.

---

## Sinnvolle Request-Limits

Das Limit soll nicht so eng sein, dass nach 10 Nutzern pro Tag Schluss ist.

Ziel:

> Das System soll für eine realistische LinkedIn-Kampagne genügend Kapazität bieten.

Empfohlener Startpunkt:

- Ziel: mindestens 25 bis 50 erfolgreiche Generierungen pro Tag ermöglichen
- globales Hard-Limit: z. B. 100 erfolgreiche Generierungen pro Tag
- pro IP: z. B. 5 Formularversuche pro Stunde
- pro IP: z. B. 10 bis 20 Generierungsversuche pro Tag
- pro E-Mail: 1 erfolgreiche Generierung insgesamt
- pro E-Mail: begrenzte Fehlversuche
- globaler Monatsdeckel: abhängig vom Budget

Wichtig:

Die tatsächlichen Limits sollen anhand der realen Kosten pro Request nachjustierbar sein.

---

## Kostenkontrolle pro Request

Jeder KI-Request soll intern protokolliert werden.

Zu speichern oder zumindest intern nachvollziehbar:

- Lead-ID
- Zeitpunkt
- Modell
- geschätzte Kosten
- tatsächliche Token-Nutzung, falls verfügbar
- Request-Status
- Fehlerstatus
- Dauer
- ob Ergebnis ausgeliefert wurde

Ziel:

> Ich möchte sehen können, wie viel ein Lead im Durchschnitt kostet.

---

## Verhalten bei erreichtem Tages- oder Monatslimit

Wenn das Tages- oder Monatsbudget erreicht ist, soll die Kampagne nicht einfach abbrechen.

Stattdessen:

1. Lead-Erfassung bleibt möglich.
2. Nutzer wird nicht zur KI-Generierung weitergelassen.
3. Nutzer bekommt eine freundliche Wartelisten-/Hinweismeldung.
4. Nutzer kann trotzdem eine Anfrage stellen.
5. Optional: Ergebnis wird später nicht automatisch versprochen.

Beispielhafte Meldungslogik:

> Die heutigen kostenlosen Testgenerierungen sind bereits vergeben. Du kannst dich trotzdem eintragen, und ich melde
> mich bei dir, wenn du einen eigenen KI-Workflow für dein Unternehmen testen möchtest.

Wichtig:

Keine Formulierung verwenden, die eine spätere automatische Lieferung verspricht, wenn kein entsprechender Prozess
existiert.

---

## Modell- und API-Rahmen

Die KI soll über eine serverseitige API-Anbindung laufen, beispielsweise über OpenAI.

Wichtige Anforderungen:

- API-Key niemals im Client
- Requests nur aus dem Backend
- Modellname konfigurierbar
- Temperature/Output-Länge konfigurierbar
- Skill/Prompt nicht im Frontend
- Kostenkontrolle pro Request
- Fehlerbehandlung bei API-Ausfällen
- Timeout-Handling
- Logging ohne unnötige sensible Daten

Die Lösung soll so gestaltet sein, dass das verwendete Modell später austauschbar ist.

---

## Custom Skill

Die KI soll nicht mit einem losen Einmal-Prompt arbeiten.

Sie soll einen von mir definierten Custom Skill nutzen.

Der Skill beschreibt:

- Rolle der KI
- Zielgruppe
- Qualitätskriterien
- Stilregeln
- LinkedIn-spezifische Struktur
- Umgang mit Bildinhalt
- Umgang mit unklarem Input
- Ausgabeformat
- No-Gos
- CTA-Logik
- Tonalität
- Anti-KI-Floskeln
- Qualitätscheck vor Ausgabe

Ziel:

> Der Skill ist ein wiederverwendbarer, anpassbarer Baustein, mit dem ich später auch kundenspezifische Varianten bauen
> kann.

---

## Ziel des KI-Ergebnisses

Die KI soll nicht nur einen einfachen Text ausgeben.

Das Ergebnis soll strukturiert und für den Nutzer sofort verständlich sein.

Mindestbestandteile:

- starke Hook
- fertige LinkedIn-Caption
- klare Struktur mit Absätzen
- optionaler Call-to-Action
- Hashtag-Vorschläge
- kurze Begründung, warum der Post funktioniert
- alternative Hook oder alternative Einleitung

Optional:

- Vorschlag für Bildtext
- Vorschlag für Karussell-Slide-Titel
- Verbesserungshinweis für den Post
- Hinweis, wie der Nutzer den Beitrag persönlicher machen kann

---

## Qualitätsanforderungen an den KI-Output

Der Output soll:

- professionell wirken
- nicht übertrieben klingen
- nicht nach generischem KI-Text aussehen
- keine erfundenen Fakten behaupten
- aus dem eingegebenen Kontext ableiten
- bei Unsicherheit vorsichtig formulieren
- keine unrealistischen Versprechen machen
- LinkedIn-tauglich sein
- gut scanbar sein
- auf B2B-Nutzen einzahlen

Der Nutzer soll denken:

> Das ist besser als das, was ich selbst in fünf Minuten geschrieben hätte.

---

## Bild-Upload

Der Nutzer soll ein Bild hochladen können.

Ziele:

- Das Bild dient als Kontext für den LinkedIn-Post.
- Die KI soll beschreiben oder interpretieren können, was wahrscheinlich auf dem Bild zu sehen ist.
- Das Bild soll nicht unnötig dauerhaft gespeichert werden, falls es nicht gebraucht wird.

Rahmenbedingungen:

- maximale Dateigröße
- erlaubte Dateitypen
- serverseitige Validierung
- keine ungeprüften Uploads
- keine Ausführung von Dateien
- klare Nutzerhinweise zu Bildrechten
- Hinweis, keine vertraulichen Daten hochzuladen
- optional automatische Löschung nach Verarbeitung

---

## Datenschutz- und Vertrauensrahmen

Die Landingpage muss transparent sein.

Der Nutzer soll verstehen:

- welche Daten erhoben werden
- warum Daten erhoben werden
- dass Bild und Eingabe zur Generierung verarbeitet werden
- dass ein externer KI-Anbieter genutzt werden kann
- dass Name und E-Mail zur Lead-Kommunikation genutzt werden
- ob und wie lange Eingaben gespeichert werden
- wie der Nutzer Kontakt aufnehmen oder Löschung verlangen kann

Vor Upload/Generierung soll der Nutzer bestätigen:

> Ich bestätige, dass ich die Rechte am hochgeladenen Bild habe und keine vertraulichen oder unberechtigt
> personenbezogenen Daten Dritter hochlade.

Wichtig:

Das Dokument ersetzt keine Rechtsberatung.  
Die finale Datenschutzerklärung und Einwilligungs-/Hinweistexte müssen rechtlich geprüft oder zumindest sorgfältig
formuliert werden.

---

## Landingpage-Zielstruktur

Die Landingpage soll kurz, klar und conversion-orientiert sein.

Empfohlene Abschnitte:

1. Hero-Bereich
   - klares Versprechen
   - kurzer Nutzen
   - CTA zur kostenlosen Demo

2. Problem
   - Unternehmen haben Bilder/Ideen, aber keine Zeit für Content

3. Demo-Erklärung
   - Bild hochladen
   - Kontext eingeben
   - LinkedIn-Post erhalten

4. Formular
   - Name
   - E-Mail
   - optional Branche
   - Datenschutz-/Nutzungshinweis

5. Tool-Bereich
   - nach Lead-Erfassung oder Verifizierung verfügbar

6. Ergebnisbereich
   - KI-generierter Post
   - Copy-Button
   - Ergebnis per Mail
   - CTA zum Custom Workflow

7. Verkaufsbrücke
   - Erklärung: Das war eine allgemeine Demo
   - Angebot: individueller KI-Workflow für dein Unternehmen

8. Beispiele für mögliche Custom Workflows
   - Social-Media-Assistent
   - Angebots-Assistent
   - E-Mail-Antwort-Assistent
   - FAQ-/Support-Assistent
   - interne Wissensdatenbank
   - Lead-Vorqualifizierung

9. Abschluss-CTA
   - kostenloses Erstgespräch
   - Custom Workflow anfragen

---

## Conversion-Ziel nach der Generierung

Der wichtigste Conversion-Moment ist direkt nach dem Ergebnis.

Die Seite soll nicht nur das Ergebnis anzeigen, sondern aktiv weiterführen.

Mögliche Anschlussbotschaft:

> Das war eine allgemeine Demo. Für dein Unternehmen kann ich so einen KI-Assistenten individuell bauen — mit deiner
> Tonalität, deinen Angeboten, deinen Vorlagen und deinem Freigabeprozess.

Mögliche CTAs:

- Eigenen KI-Workflow anfragen
- Kostenloses Erstgespräch buchen
- Ich will so etwas für mein Unternehmen
- Ergebnis besprechen lassen
- Custom Skill für meine Branche anfragen

Ziel:

> Der Nutzer soll verstehen, dass der kostenlose Generator nur der Einstieg ist.

---

## Follow-up-Logik

Nach Nutzung des Tools soll ein sinnvoller Follow-up-Prozess möglich sein.

Direkt nach der Nutzung:

- E-Mail mit generiertem Ergebnis
- kurze Erklärung, was der KI-Skill gemacht hat
- Hinweis auf individuelle Anpassung
- CTA zum Gespräch

Nach 1 bis 2 Tagen:

- Nachfrage, ob das Ergebnis hilfreich war
- Angebot, einen Workflow für das Unternehmen zu skizzieren

Nach einigen Tagen:

- Beispiele für andere KI-Workflows
- konkreter Nutzen
- erneuter CTA

Wichtig:

Follow-ups nur im Rahmen einer sauberen rechtlichen Grundlage und transparenten Kommunikation.

---

## Messbarkeit

Die Kampagne soll messbar sein.

Wichtige Kennzahlen:

- Seitenaufrufe
- Besucherquelle
- Conversion Besucher zu Lead
- Anteil verifizierter E-Mails
- Anteil gestarteter Generierungen
- Anteil erfolgreicher Generierungen
- Kosten pro erfolgreicher Generierung
- Kosten pro Lead
- CTA-Klickrate nach Ergebnis
- gebuchte Gespräche
- Projektanfragen
- Angebote
- Kunden
- Spam-/Missbrauchsquote

Wichtigstes Business-Kriterium:

> Wie viele qualifizierte Gespräche entstehen pro 100 Landingpage-Besuchern?

---

## Fehlerfälle

Folgende Fehlerfälle sollen sauber abgedeckt werden:

- ungültige E-Mail
- E-Mail bereits genutzt
- Lead bereits generiert
- Tageslimit erreicht
- Monatsbudget erreicht
- Bild zu groß
- Bildformat nicht erlaubt
- Text zu lang
- API nicht erreichbar
- KI-Request Timeout
- KI-Output leer oder ungültig
- Nutzer lädt problematische Datei hoch
- mehrfaches Absenden durch Doppelklick
- parallele Requests desselben Leads

Ziel:

> Fehler sollen kontrolliert, verständlich und ohne unnötige Kosten behandelt werden.

---

## Akzeptanzkriterien

Das Projekt gilt als konzeptionell richtig umgesetzt, wenn:

1. Die Landingpage ist in meine bestehende Next.js-Webseite integrierbar.
2. Das bestehende Lead-Backend wird genutzt.
3. Ohne Lead-Erfassung ist keine KI-Generierung möglich.
4. Ein Lead kann genau eine erfolgreiche Generierung durchführen.
5. E-Mail, IP, Session und globale Limits schützen vor Missbrauch.
6. Es gibt Tages- und Monatsbudgetgrenzen.
7. Die KI-Anfrage läuft ausschließlich serverseitig.
8. Der API-Key ist niemals im Browser sichtbar.
9. Der verwendete KI-Skill ist von mir kontrollierbar und später anpassbar.
10. Das Ergebnis ist ein hochwertiger LinkedIn-Post mit strukturierter Ausgabe.
11. Nach dem Ergebnis gibt es eine klare Verkaufsbrücke zum Custom-KI-Workflow.
12. Leads und Nutzungen sind messbar.
13. API-Kosten sind nachvollziehbar.
14. Datenschutz- und Upload-Hinweise sind sichtbar.
15. Das System hat ein sinnvolles Fallback bei erreichtem Budget.

---

## Erwartung an Codex/Claude

Bitte erstelle aus diesem Briefing einen konkreten Umsetzungsplan für mein bestehendes Next.js-Projekt.

Der Plan soll enthalten:

- empfohlene Architektur auf hoher Ebene
- Datenmodell-Erweiterungen für Leads/Nutzung/Budget
- benötigte API-Routen oder Server-Actions
- UI-Bereiche der Landingpage
- Schutz- und Limitierungslogik
- KI-API-Anbindung
- Struktur des Custom Skills
- Fehler- und Fallback-Verhalten
- Testfälle
- sinnvolle Reihenfolge der Umsetzung
- MVP-Scope
- spätere Ausbaustufen

Bitte nicht direkt mit der Implementierung starten, sondern zuerst den Umsetzungsplan erstellen.

---

# LinkedIn-Post-Hinweise für Traffic auf die Landingpage

## Ziel des LinkedIn-Posts

Der LinkedIn-Post soll nicht wie Werbung für ein Tool wirken, sondern wie ein konkretes Experiment:

> Ich habe eine kleine Demo gebaut, die zeigt, wie individuelle KI-Workflows für Unternehmen aussehen können.

Der Post soll Neugier erzeugen und gleichzeitig die Zielgruppe qualifizieren.

---

## Gute Hook-Richtungen

Mögliche Hook-Ideen:

- Ich teste gerade einen kleinen KI-Workflow für LinkedIn-Content.
- Viele Unternehmen haben Bilder von Projekten, aber keine Zeit daraus Content zu machen.
- Aus einem Bild und ein paar Stichpunkten wird in Sekunden ein LinkedIn-Beitrag.
- Ich baue gerade eine Demo für individuelle KI-Assistenten.
- Kein neues SaaS. Nur ein Beispiel, wie ein kleiner KI-Workflow Zeit sparen kann.

---

## Inhaltliche Struktur für den LinkedIn-Post

Empfohlene Struktur:

1. Problem benennen  
   Viele Unternehmen haben gute Inhalte, aber veröffentlichen sie nicht.

2. Demo erklären  
   Bild hochladen, Kontext eingeben, LinkedIn-Post erhalten.

3. Eigentlichen Nutzen erklären  
   Das ist ein Beispiel für individuelle KI-Workflows.

4. Zielgruppe direkt ansprechen  
   Für Selbstständige, kleine Unternehmen, Dienstleister, Handwerker oder Agenturen.

5. Niedrige Hürde setzen  
   Kostenlos testen, nur einmal nutzbar.

6. CTA  
   Link zur Landingpage.

---

## Conversion-Hinweise für den LinkedIn-Post

Der Post sollte:

- nicht zu technisch sein
- nicht zu sehr nach KI-Hype klingen
- nicht versprechen, dass KI komplette Strategie ersetzt
- den konkreten Nutzen zeigen
- den Testcharakter betonen
- klar sagen, für wen es gedacht ist
- neugierig machen
- den Link nicht zu früh bringen
- mit einer Frage oder klaren Einladung enden

---

## Beispielhafte CTA-Formulierungen

- Teste die Demo hier: [Landingpage-Link]
- Lade ein Bild hoch und schau, was daraus wird: [Landingpage-Link]
- Wenn du sehen willst, wie so ein Workflow für dein Unternehmen aussehen könnte: [Landingpage-Link]
- Ich freue mich über Feedback zur Demo: [Landingpage-Link]

---

## Beispiel-Post-Entwurf 1

Viele Unternehmen haben gute Inhalte.

Projektbilder.  
Kundenergebnisse.  
Einblicke aus dem Alltag.  
Vorher-Nachher-Situationen.  
Kleine Learnings.

Aber daraus wird oft kein LinkedIn-Post, weil im Alltag die Zeit fehlt.

Ich habe deshalb eine kleine Demo gebaut:

Bild hochladen.  
Ein paar Stichpunkte eingeben.  
LinkedIn-Post erhalten.

Die Demo ist kein fertiges SaaS-Produkt, sondern ein Beispiel dafür, wie ein individueller KI-Workflow für Unternehmen
aussehen kann.

Zum Beispiel für:

- Dienstleister
- Handwerker
- Agenturen
- Berater
- kleine B2B-Unternehmen

Mein Ziel: zeigen, wie KI nicht abstrakt bleibt, sondern ganz konkrete Arbeitsschritte abnimmt.

Du kannst die Demo kostenlos testen: [Landingpage-Link]

Mich interessiert besonders:

Würdest du so einen KI-Assistenten für dein Unternehmen nutzen?

---

## Beispiel-Post-Entwurf 2

Ich glaube, viele kleine Unternehmen brauchen keine 20 neuen KI-Tools.

Sie brauchen 1 bis 2 kleine Workflows, die wirklich in ihren Alltag passen.

Zum Beispiel:

Ein Projektfoto machen.  
Kurz beschreiben, was passiert ist.  
Daraus einen LinkedIn-Beitrag bekommen.

Genau dafür habe ich eine kleine Demo gebaut.

Sie zeigt, wie ein individueller KI-Assistent aussehen könnte, der aus Bildern und Stichpunkten verwertbaren Content
macht.

Das Ziel ist nicht, Menschen zu ersetzen.

Das Ziel ist, aus vorhandenen Ideen schneller sichtbaren Content zu machen.

Hier kannst du es testen: [Landingpage-Link]

Feedback ist sehr willkommen.

---

## Beispiel-Post-Entwurf 3

Ich baue gerade eine kleine Landingpage als Experiment.

Die Idee:

Du lädst ein Bild hoch.  
Du gibst ein paar Stichpunkte ein.  
Ein KI-Skill erstellt daraus einen LinkedIn-Post.

Warum?

Weil viele Selbstständige und kleine Unternehmen zwar genug Inhalte hätten, aber keine Zeit, daraus regelmäßig Beiträge
zu machen.

Für mich ist das gleichzeitig eine Demo:

So können individuelle KI-Workflows aussehen, die genau auf ein Unternehmen angepasst werden.

Wenn du möchtest, kannst du es hier testen: [Landingpage-Link]

Es ist bewusst auf eine kostenlose Generierung pro Person begrenzt, damit es ein echter Test bleibt.
