# Invessiv Workspace — LinkedIn Outreach & Sales Intelligence (MVP)

**Status:** Abgestimmte Produktanforderungen / fachliche Projektspezifikation  
**Stand:** 20.10.2026 — ergänzt: GoSprint-/Unipile-Erkenntnisse und ausdrückliche MVP-Ausklammerung  
**Adressat:** Moritz / Invessiv; später als Input für Claude Code, GPT oder eine separate technische Planung  
**Zweck:** Alle bisherigen Entscheidungen konservieren, den **verbindlichen MVP-Umfang** festhalten und die noch zu prüfenden Integrationsfragen transparent kennzeichnen.  
**Wichtig:** Dies ist **kein** fertiger Implementierungsplan für das bestehende Repository. Der konkrete technische Plan muss nach Einsicht in Codebasis, Datenmodell, vorhandene CRM-Funktionen und tatsächlich verfügbare API-Berechtigungen erstellt werden.

---

## 1. Kurzfassung — die endgültige Produktentscheidung

Invessiv erweitert seinen bereits vorhandenen, eigenen Workspace/CRM um ein **LinkedIn-zentriertes Outreach- und Sales-Intelligence-Modul**.

Das System soll LinkedIn-Kontakte, bestehende und neue Vernetzungen, ausstehende Einladungen, Chatverläufe, Lead-Status, Wiedervorlagen und Aktivitäten möglichst vollständig und automatisch **synchronisieren und verwalten**. Eine KI soll Kontaktprofile und nachprüfbare Informationen zum Unternehmen auswerten, bereits **vor dem Öffnen** eines neu vernetzten Kontakts einen hochwertigen individuellen Pitch mit Icebreaker vorbereiten und Gespräche hinsichtlich Interesse sowie nächster Aktion einschätzen.

**Der Nutzer löst jede LinkedIn-Schreibaktion selbst aus.** Keine automatische Nachricht, kein zeitgesteuerter LinkedIn-Versand und keine automatische Einladung bzw. erneute Einladung. Für V1 wird **kein Ein-Klick-Versand aus dem Workspace über eine inoffizielle LinkedIn-Schreibschnittstelle** entwickelt. Der Versand soll trotzdem extrem reibungsarm sein: sichtbare Profil-/Chat-Schaltfläche, vorbereiteter Text, Copy-&-Open-Aktion und möglichst wenige Interaktionen.

**Wichtigste UX-Vorgabe:** Für einen vorbereiteten Pitch soll der Weg bis zur **manuell auf LinkedIn versendeten Nachricht** im Normalfall höchstens **vier Benutzeraktionen/Klicks** beanspruchen. **Zielgröße: ca. 2–4 Sekunden aktiver Bedienaufwand**, _ohne_ Lesen/Prüfen/Neugenerieren des Pitches und _ohne Garantie für externe Seitenladezeiten_. Die Zeitangabe ist ein zu testender UX-Zielwert, kein SLA.

**V1 enthält ausdrücklich auch:** Chat-Synchronisierung und Auswertung, Lead-Scoring, Antwortpriorisierung, automatische Synchronisierung des Vernetzungs-/Einladungsstatus, Verwaltung offener Einladungen, Wiedervorlagen nach Zurückziehen und Wochenlimits.

**Nicht V1:** Instagram, E-Mail, andere Kanäle, automatische Follow-up-Sequenzen oder eigenständiges automatisches Versenden von Nachrichten, Einladungen und Rückzügen. **Ebenfalls nicht V1: Unipile-Anbindung (auch nicht probeweise), Cookie-Integration, inoffizieller LinkedIn-Schreibzugriff, serverseitiger Versand oder Rückzug über Drittanbieter.** Die bisherigen Unipile-/GoSprint-Erkenntnisse stehen ausschließlich im separaten Recherche-/Entscheidungsanhang und bleiben für eine mögliche spätere Phase erhalten.

---

## 2. Geschäftsziele und Erfolgskriterien

### Ausgangslage

- Invessiv nutzt LinkedIn aktiv zur Kundenakquise, insbesondere für Rechtsanwälte/Kanzleien, daneben Steuerberater und B2B-Unternehmen.
- Es gibt bereits einen eigenen Workspace mit Leadmanagement, CRM und Softwarestack. Die bestehende Struktur soll weiterverwendet, nicht neu erfunden werden.
- GoSprint (Drittanbieter aus einem Coaching) liefert bereits starke Outreach-Funktionen, einschließlich KI-Icebreakern, Nachrichtenerstellung, Synchronisierung und Einladungsverwaltung.
- Langfristig sollen **Datenhoheit, Prozesshoheit und möglichst geringe SaaS-Abhängigkeit** erreicht werden. Eine externe Integrations-API als austauschbarer Adapter ist möglich, die CRM-Datenbasis bleibt aber Invessiv-eigen.
- Hauptproblem ist der hohe manuelle Zeitaufwand je Kontakt: recherchieren, Chat öffnen, Informationen zusammentragen, Pitch erstellen, ggf. warten, kopieren, senden, dokumentieren.

### Ziele des MVP

1. **Eine zentrale Arbeitsoberfläche** statt verstreuter LinkedIn-Tabs und manueller Statuspflege.
2. **Neue Vernetzungen mit bereits fertigem Pitch** vorfinden; normalerweise keine Generierungswartezeit beim Öffnen.
3. **Kontakte, offene Einladungen und Chats zuverlässig abgleichen**, inklusive nachträglicher LinkedIn-Aktionen.
4. **Wissen, wen man heute beantworten oder kontaktieren sollte** und welche Kontakte echtes Interesse zeigen.
5. **Zurückgezogene Einladungen dokumentieren** und frühestens nach zulässiger Wartezeit wieder vorlegen.
6. **Nie unbemerkt senden oder zurückziehen**; manuelle Kontrolle und eigene Wochenlimits beibehalten.
7. **Minimaler Klick- und Arbeitsaufwand** bei gleichzeitig nachvollziehbarer Qualität der KI-Personalisierung.

### Messbare MVP-Abnahmeziele

- Neue bestätigte LinkedIn-Vernetzungen werden nach dem nächsten erfolgreichen Sync als Kontakte angelegt/aktualisiert und für Pitch-Vorbereitung eingereiht.
- Für **jede neue, relevante Vernetzung** wird automatisch **ein Pitch** zur Vorbereitung angestoßen, sofern genügend Informationen/Zugriff vorhanden sind; optional **ein zweiter Entwurf** (konfigurierbar). Fehlende Informationen werden sichtbar angezeigt statt halluziniert.
- Ein vorbereiteter Text ist beim Öffnen einer fertig bearbeiteten Kontaktkarte **sofort** vorhanden (ohne laufenden KI-Aufruf auf der kritischen UX-Strecke).
- Standardablauf „Pitch vorhanden → LinkedIn-Nachricht manuell versendet“: **max. vier Aktionen** als UX-Ziel; 2–4 Sekunden aktiver Bedienaufwand unter günstigen Bedingungen, gesondert messen.
- Jeder sichtbare Kontakt und jede Einladung hat **einen klar auffindbaren Profil-Link**, und relevante Aktionsbuttons liegen **direkt daneben**.
- Offene und zurückgezogene Einladungen sind getrennt filterbar; `withdrawn_at` und `reinvite_eligible_at` werden dokumentiert.
- Der Sync ist idempotent: Wiederholtes Abrufen erzeugt keine doppelten Kontakte, Einladungen oder Nachrichten.
- Die Inbox zeigt mindestens **Antwort offen**, **neue Nachricht**, **Follow-up prüfen**, **heißer Lead**, **kein Outreach/Absage**.
- Bei Sync-/API-Ausfall werden Daten **nicht als aktuell ausgegeben**; letzte erfolgreiche Synchronisierung und Fehlerstatus sind sichtbar.
- Es gibt **keine automatisch ausgelöste LinkedIn-Schreibaktion**.

---

## 3. Verbindliche MVP-Entscheidungen

| Entscheidung                         | Status                           | Konkretisierung                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plattformfokus                       | **Fest**                         | Ausschließlich LinkedIn in V1. Datenmodell später erweiterbar.                                                                                                                                     |
| Eigenes CRM                          | **Fest**                         | Bestehender Invessiv Workspace bleibt System of Record.                                                                                                                                            |
| Kontakt-/Chat-Sync                   | **Fest (funktionales Ziel)**     | Automatisiert, soweit Datenquelle technisch und rechtlich zugänglich.                                                                                                                              |
| Einladungs-Sync                      | **Fest (funktionales Ziel)**     | Gesendet, empfangen, offen, angenommen, zurückgezogen etc., soweit lieferbar.                                                                                                                      |
| Auto-Status                          | **Fest**                         | Beobachtbare LinkedIn-Verbindungszustände werden bei Sync aktualisiert.                                                                                                                            |
| Automatische Pitch-Erstellung        | **Fest**                         | Nach jeder neu erkannten Verbindung ohne Benutzeraktion; 1 Entwurf, optional 2.                                                                                                                    |
| Recherche für Icebreaker             | **Fest**                         | LinkedIn-Profil, Unternehmenswebsite & Impressum, aktuelle LinkedIn-Beiträge, Fakten, Text, Qualitäts-/Quellencheck.                                                                               |
| Chat-Auswertung                      | **Fest**                         | Gesprächskontext, Kaufsignale, Antwortbedarf und nächste Schritte.                                                                                                                                 |
| KI-Lead-Scoring                      | **Fest**                         | Mit Begründung; getrennt von Antwortpriorität und Vernetzungsstatus.                                                                                                                               |
| Copy-/Open-Workflow                  | **Fest**                         | Gut sichtbare Aktionen zum LinkedIn-Profil/Chat und zum Kopieren/Öffnen.                                                                                                                           |
| Direkter API-Nachrichtenversand      | **Nicht V1**                     | Auch nicht bei einem Klick auf den Workspace-Button; LinkedIn-Versand erfolgt manuell.                                                                                                             |
| Nachrichten-/Einladungs-Automatismen | **Ausgeschlossen**               | Niemals selbstständig senden, vernetzen, zurückziehen oder neu vernetzen.                                                                                                                          |
| Zurückziehen                         | **Fest als Verwaltungsfunktion** | Alle offenen sehen; LinkedIn-Einladungsseite per gut sichtbarem Button öffnen, **dort manuell zurückziehen** und anschließend synchronisieren oder dokumentieren. Kein Unipile-/API-Rückzug in V1. |
| Neuvernetzen                         | **Fest als Wiedervorlage**       | Frühestzulässiges Datum errechnen; neue Einladung nur manuell auf LinkedIn.                                                                                                                        |
| Wochenlimits                         | **Fest**                         | Frei konfigurierbare interne Zähler/Warnungen, keine automatischen Sendungen.                                                                                                                      |
| Follow-ups                           | **Einfach in V1**                | Erkennung, Wiedervorlage, Textvorlage/Copy; **keine** automatischen Follow-up-Sequenzen nötig.                                                                                                     |
| Instagram/E-Mail                     | **Später**                       | Nicht Teil von V1, keine Implementierungszeit investieren.                                                                                                                                         |
| Externe Integration                  | **Fest für V1**                  | Zuerst offizielle LinkedIn-Datenportabilitäts-API als Lese-POC; bei Datenlücken transparente manuelle/Export-Fallbacks. **Unipile nur dokumentieren, nicht testen, anbinden oder implementieren.** |

**Interpretationshinweis:** „Automatisch“ ist für **Lesen, Sync, Analyse, Statusabgleich und Pitch-Vorbereitung** erwünscht, **nicht** für externe LinkedIn-Schreibaktionen.

---

## 4. Nutzeroberfläche: Arbeitsbereiche

### 4.1 Sales-Cockpit / Tagesübersicht

Kennzahlen und handlungsorientierte Listen:

- **Antworten offen**: Letzte relevante Nachricht vom Gegenüber, von mir noch nicht beantwortet.
- **Neue Verbindungen**: Verbunden, aber Erstnachricht noch nicht gesendet.
- **Pitch bereit**: KI-Entwurf fertig, noch nicht gesendet.
- **Pitch prüfen / unvollständig**: Recherche oder Qualitätsprüfung fehlt.
- **Heiße Leads**: Konkretes Interesse, z. B. Termin-, Angebot-, Budget- oder Leistungsanfrage.
- **Follow-up prüfen**: Keine Antwort seit konfigurierbarem Zeitfenster.
- **Offene Einladungen**: Nach Alter sortiert, insbesondere Kandidaten zur manuellen Rücknahme.
- **Erneut vernetzbar**: Rückgezogene Einladung, frühestes Datum erreicht.
- **Wochenaktivität**: Einladungen, Erstnachrichten, Follow-ups, Rückzüge — eigene Limits und aktuelle Zähler.
- **Sync-Status**: Verbunden/getrennt, Zeitstempel letzter erfolgreicher Sync, ggf. Teilabdeckung einzelner Datenbereiche.

**Priorisierung:** Action-Queues statt einer unstrukturierten Gesamtliste. Filter nach Status, Lead-Score, Gesprächsdatum, Rolle, Branche, Region, Pipeline-Phase und Wiedervorlage.

### 4.2 Zentrale Kontaktliste / CRM-Abgleich

- Kontaktname, Unternehmensname, Position, LinkedIn-Profil, Website, Quelle, vorhandener CRM-Eintrag.
- Vernetzungsstatus, Einladungsstatus, Erstansprache-Status, letzter Chat-Kontakt, letzte eingehende Nachricht, offene Aufgabe.
- Begründeter Lead-Score und davon **separate Antwort-/Aktionspriorität**.
- Sichtbare Aktionsspalte: **Profil öffnen** immer präsent; kontextabhängig **Chat öffnen**, **Pitch anzeigen**, **Kopieren & Chat öffnen**, **Rückzug prüfen**, **Wiedervorlage**.
- Bulk-Filter/Sortierung okay, aber **keine Bulk-Sende-/Bulk-Rückzugsaktionen**.
- Keine Dubletten bei erneutem Sync; Verknüpfung mit bereits existierendem CRM-Kontakt.

### 4.3 Kontakt-Detailansicht (wichtigste operative UI)

Oberer, auch bei Scrollen gut sichtbarer Bereich:

`Name | Rolle | Unternehmen | Vernetzt? | Lead-Score | [Profil öffnen] [Chat öffnen] [Pitch kopieren & Chat öffnen]`

Je nach Einladungsstatus:

`[Profil öffnen] [Einladung auf LinkedIn ansehen] [Zurückziehen / Zurückzug dokumentieren] [Erneut vernetzen]`

**Profil-Link muss stets direkt neben Versand-/Einladungsaktionen stehen**, nicht in einem tiefen Menü.

Tabs oder Panels:

1. **Pitch**: vorab erzeugter Entwurf, Quellen, Qualitätsstatus, direkt editierbar, „Neue Variante“ (1–2 Mal bei Bedarf), „Kopieren“, „Kopieren & Chat öffnen“.
2. **Chat**: Verlauf, chronologisch, gesendet/empfangen, Zeitstempel, neue Nachrichten, Analyse und empfohlene Antwort.
3. **Kontakt/Recherche**: Profil, Website, Impressum, relevante Posts, zugehörige Quellen und Zeitpunkt der letzten Prüfung.
4. **Aktivitäten**: Einladung gesendet, angenommen/zurückgezogen, Nachrichten, manuelle Bestätigungen, Follow-ups, Sync-Beobachtungen.
5. **Wiedervorlage/Notizen**: eigene CRM-Notizen und Aufgaben.

### 4.4 Vernetzungsmanager

Getrennte Filter/Tabs:

- **Gesendet/offen** (Datum, Alter, Zielprofil, ggf. Einladungsnachricht).
- **Eingehend/offen**.
- **Angenommen/verbunden**.
- **Zurückgezogen** (mit Datum und Wiederkontakt-Datum).
- **Erneut vernetzbar** (erst nach Wartefrist).
- **Unklar / nicht mehr auffindbar** (Sync liefert keinen beweiskräftigen Zustand).

An jedem Datensatz: **Profil-Button direkt neben passender Aktion**. Rücknahme niemals aufgrund von Zeitablauf automatisch durchführen.

---

## 5. End-to-End-Workflows

### Workflow A — Neue Vernetzung → Pitch steht bereit

1. Lese-Integration bemerkt eine **neu angenommene Vernetzung**.
2. Upsert in `contacts`, `platform_accounts`, `connections` und passende CRM-Verknüpfung; Dublettenprüfung.
3. Vernetzungsstatus automatisch auf `CONNECTED` setzen; Datum/Quelle dokumentieren.
4. Prüfen, ob bereits Erstnachricht, bestehende Unterhaltung, Absage oder Ausschlussvermerk vorliegt. **Bei bestehender Ansprache keine neue Erstnachricht blind erzeugen.**
5. Für geeignete neue Kontakte **Recherchejob** einreihen.
6. Profil + Unternehmenswebsite/Impressum + aktuelle Beiträge prüfen; belegte Fakten extrahieren.
7. **1 Pitch** generieren; **optional 2. Variante** gleich vorhalten (konfigurierbar; im MVP standardmäßig 1, zweiter Entwurf je nach Konfiguration/Kostenbudget).
8. Automatischer Quellen-/Qualitätscheck; Status `READY` / `NEEDS_REVIEW` / `INSUFFICIENT_CONTEXT`.
9. Nutzer sieht Kontakt in **Pitch bereit**. **Kein automatischer Versand.**
10. Bei Bedarf Text editieren oder gezielt neu generieren.

**Alle neuen Vernetzungen** sollen in den Prozess gelangen; nicht nur Kontakte, die man manuell öffnet. Für nicht ausreichende Quellenlage wird ein offener Prüfstatus statt eines erfundenen Icebreakers erzeugt.

### Workflow B — Vorbereiteten Pitch manuell verschicken (Performance-Kern)

**Bevorzugte Variante ohne inoffizielle Schreib-API:**

1. In der Queue Pitch kurz prüfen (Zeit für Prüfung zählt **nicht** in 2–4-Sekunden-Ziel).
2. **`Kopieren & LinkedIn-Chat öffnen`** klicken. Der Workspace kopiert den finalen Text in die Zwischenablage und öffnet einen **verifizierten** Chat-Link bzw. falls nicht vorhanden die Profilseite.
3. Auf LinkedIn ggf. „Nachricht“ auswählen.
4. Text einfügen und **selbst** auf „Senden“ klicken.
5. Späterer Nachrichten-Sync erkennt die Nachricht und setzt Erstansprache-Status auf `SENT`.

**UX-Ziel:** nach erfolgreicher Pitch-Vorbereitung höchstens 4 Benutzeraktionen bis zum Versand; 2–4 Sekunden **aktiver Bedienaufwand** unter günstigen Bedingungen. Bei gesondertem Chat-Link sind weniger Aktionen möglich; bei langsamer LinkedIn-Seite oder fehlendem Deep-Link eventuell mehr. Das muss im echten Browser empirisch getestet werden.

**Wichtig:** LinkedIn-Chat-URL nicht aus geratenen IDs zusammenbauen. Erst die tatsächlich gelieferten/verifizierten URLs verwenden, sonst Profil öffnen.

**Versandzustand:** Keine fälschliche Statusänderung schon beim Kopieren. Bis bestätigter Sync: `PREPARED` / optional `COPY_OPEN_STARTED`; `SENT` erst durch verifizierte gesendete Nachricht oder bewusst manuell bestätigte Aktion mit Kennzeichnung „nicht verifiziert“.

### Workflow C — Eingangsnachricht → Antwortpriorität / Lead-Scoring

1. Neu eingegangene Nachricht wird synchronisiert und dedupliziert.
2. Gesprächsverlauf oder relevanter Ausschnitt wird analysiert.
3. KI klassifiziert **Antwort erforderlich?**, **Interesse?**, **Absage?**, **Termin-/Preisfrage?**, **Follow-up sinnvoll?**.
4. Separates **Kaufinteresse (Lead-Score)** und **Handlungspriorität**; Begründung anhand konkreter Chat-Aussagen.
5. CRM-Aufgabe/Queue wird aktualisiert; vorhandene manuelle CRM-Vertriebsphase nur nach definierten Regeln ändern, keine ungefragte Überschreibung bewusster Vertriebsentscheidungen.
6. KI kann Antwortvorschlag liefern, **nicht automatisch absenden**.
7. Bei Absage/Opt-out automatische Follow-up-Unterdrückung und deutlich sichtbarer Status.

### Workflow D — Offene Einladung → prüfen → ggf. zurückziehen → erneut vormerken

1. Gesendete offene Einladungen aus Datenquelle listen und mit `sent_at`/Profil verknüpfen.
2. Nach einstellbarem Alter (z. B. 21/28 Tage **nur als interne Erinnerung**, nicht als LinkedIn-Regel) in Queue `Rückzug prüfen` anzeigen.
3. Nutzer entscheidet selbst, ob er zurückzieht.
4. **Verbindlicher V1-Ablauf:** Profil/LinkedIn-Einladungsverwaltung per gut sichtbarem Button öffnen und **auf LinkedIn eigenhändig zurückziehen**. Keine Drittanbieter-Schreibaktion, auch nicht nach explizitem Klick.
5. Rückzug beim nächsten offiziellen Sync erkennen oder ausdrücklich im CRM **als manuell bestätigt** dokumentieren; nie schon beim Öffnen des Links als erledigt markieren.
6. `withdrawn_at`, Quelle/Verifikation und ggf. Grund speichern. `reinvite_eligible_at = withdrawn_at + 21 Tage` als konservativer Mindestwert gemäß LinkedIn-Hilfe (LinkedIn spricht von **bis zu** drei Wochen; weitere Restriktionen können gelten).
7. Nach Datum in `Erneut vernetzbar` erscheinen; Button **Profil öffnen / Einladung selbst senden**. Neuer Einladungsversand **nie automatisch**.
8. Status erst bei beobachteter/aktiv bestätigter Aktion aktualisieren, nicht beim Öffnen eines Buttons.

Wenn eine Einladung aus der Anbieterantwort verschwindet, **nicht automatisch auf `WITHDRAWN` schließen**; sie könnte angenommen, abgelaufen, entfernt oder nicht mehr abrufbar sein. `UNKNOWN/RECONCILIATION_REQUIRED` bis zur Klärung.

### Workflow E — Bestehende Kontakte initial importieren

- Historische Verbindungen, Chats und Einladungen seitenweise importieren.
- Existierende CRM-Datensätze per eindeutiger LinkedIn-Kennung/normalisierter Profil-URL abgleichen.
- Viele bestehende Kontakte nicht sofort ungefragt mit Tausenden KI-Recherchejobs überlasten; **alle neu hinzukommenden Kontakte** immer priorisieren. Für Altbestand optional priorisierte/batchweise Nachgenerierung.
- Bestehende `last_contacted_at`, Vertriebspipeline und manuelle Notizen nicht überschreiben.
- Lücken in der Datenquelle kenntlich machen; Sync-Coverage nicht als Vollständigkeitsgarantie darstellen.

---

## 6. KI-Pipeline für Icebreaker und Pitch (Pflichtumfang)

Die sechs vom Nutzer festgelegten Schritte bleiben **explizit verbindlich**:

### 1. LinkedIn-Kontaktprofil auslesen

- Profil-URL, Name, Position, Arbeitgeber/Unternehmen, Profilzusammenfassung und sinnvolle Tätigkeitsschwerpunkte, **nur soweit über gewählte Quelle legitim/verfügbar**.
- Aktualität und Quelle pro relevanter Aussage festhalten.
- Titel/Arbeitgeber nicht aus Profil-Slugs erraten.

### 2. Unternehmenswebsite **und Impressum** auslesen

- Website anhand verifizierter Firmendomain finden/zuordnen.
- Relevante Leistungen, Spezialisierungen, Positionierung, Zielgruppe, Team/Kanzlei, Kontaktangebot.
- Impressum zur **Identitäts- und Firmenzuordnung** prüfen (z. B. richtiger Unternehmensname/Standort), nicht für ungerechtfertigtes Sammeln persönlicher Kontaktinformationen.
- Weiterleitungen, mehrere gleichnamige Firmen und unklare Zuordnung markieren.

### 3. Aktuelle LinkedIn-Beiträge recherchieren

- Priorität auf jüngere, **tatsächlich zuordenbare** Posts des Kontakts; optional Firmenbeiträge, klar als solche markiert.
- Beitragsdatum, URL und exakte inhaltliche Beobachtung speichern.
- Wenn Beiträge nicht verfügbar sind: nichts erfinden; Profil-/Website-Fakten nutzen oder Rückfrage-/Qualitätsstatus setzen.

### 4. Passende Fakten und Vorlage auswählen

- Evidenz-Objekte priorisieren: eigener aktueller Beitrag > konkrete individuelle Tätigkeit/Spezialisierung > konkretes Unternehmensangebot > allgemeiner Profilkontext.
- Maximal 1–2 belastbare Beobachtungen für einen natürlichen Icebreaker, keine lange Zusammenfassung.
- Passende Pitch-Vorlage aus Invessiv-Bibliothek (z. B. Kanzlei, Steuerberatung, B2B; Ton: ruhig, persönlich, kein generischer Sales-Sprech).
- Kernangebot: unverbindliche/kostenlose Startseiten-Vorabansicht nur, **wenn dies tatsächlich das aktuelle, vom Nutzer freigegebene Outreach-Angebot ist**. Textbausteine zentral versionierbar statt im Prompt hart verdrahtet.

### 5. Icebreaker und Pitch formulieren

- Deutsch als Standard; ansprechender, lockerer, professioneller Ton, **Du/Sie** je nach gewünschter Ansprache/Chat-Kontext.
- Individueller Einstieg → glaubwürdige Überleitung zur Website/Vertrauenswirkung → knapper Mehrwert → **eine** natürliche Handlungsaufforderung.
- Nicht behaupten, die Website sei schlecht, wenn kein konkreter, belegter Befund vorliegt.
- Keine Behauptung über Beiträge, Gespräche, berufliche Erfolge oder Unternehmensdaten ohne Quelle.
- Ziel: hochwertiger Erstentwurf, der meist ohne umfangreiche Nacharbeit verwendbar ist.

### 6. Qualität und Quellenbezug prüfen

- **Claim-by-claim-Prüfung**: Bezieht sich jede konkrete Personen-/Firmenaussage auf gespeicherte verifizierbare Evidenz?
- Fakten/URLs/Beitragsalter sichtbar an den Pitch anhängen.
- Kein erfundenes Posting, keine falsch zugeschriebene Aussage, keine Verwechslung von Firma/Person.
- Lesbarkeit, Kürze, Wiederholungen, Aufdringlichkeit, Ton und CTA prüfen.
- Quality-Status: `READY` (belegbar), `NEEDS_REVIEW` (Unsicherheit), `INSUFFICIENT_CONTEXT` (kein belastbarer Icebreaker).
- Optional **Confidence/Qualitätswert**, aber keine falsche Scheingenauigkeit.

### Vorberechnung und Regeneration

- Der Job startet nach neuem Vernetzungsereignis bzw. bei bestätigter Verbindung nach Sync.
- **Ein primärer Entwurf** automatisch; **optional ein zweiter**, konfigurierbar und budgetabhängig.
- In Kontaktansicht „Neu generieren“ mit optionalen Vorgaben: `kürzer`, `lockerer`, `stärkerer Post-Bezug`, `andere Beobachtung`, `weniger Sales`.
- Varianten und letzte manuelle Bearbeitung nicht überschreiben.
- Alte Entwürfe bei neuen Fakten als `STALE` markieren, nicht ungefragt bereits bearbeitete Entwürfe ersetzen.
- Eingangsquellen/Erkenntnisse zwischenspeichern; nicht bei jeder neuen Formulierung erneut LinkedIn/Websites abrufen.
- **Kein KI-Job auf dem kritischen Sendeklick**: fertig gerenderter Pitch liegt in der eigenen Datenbank.

---

## 7. Automatische Auswertung, Score und CRM-Status

### 7.1 Sauber getrennte Zustandsdimensionen

**A. LinkedIn-Verbindungsstatus (durch Sync, soweit beobachtbar):**

`UNKNOWN`, `NOT_CONNECTED`, `OUTGOING_PENDING`, `INCOMING_PENDING`, `CONNECTED`, `WITHDRAWN`, `REINVITE_ELIGIBLE`, ggf. `EXPIRED` / `REJECTED` **nur wenn Daten das belegen**.

**B. Outreach-Status (aus Nachrichten/CRM):**

`NOT_CONTACTED`, `PITCH_GENERATING`, `PITCH_READY`, `NEEDS_REVIEW`, `CONTACTED`, `REPLIED`, `FOLLOW_UP_DUE`, `CONVERSATION_ACTIVE`, `NO_INTEREST`, `DO_NOT_CONTACT`.

**C. Vertriebspipeline (CRM):**

Bestehende Workspace-Phasen bleiben erhalten, z. B. `new`, `qualified`, `meeting`, `offer`, `won`, `lost` — **tatsächliche vorhandene Enum-Werte erst im Repository prüfen**.

**D. Pitch-Status:**

`QUEUED`, `RESEARCHING`, `GENERATING`, `VALIDATING`, `READY`, `NEEDS_REVIEW`, `INSUFFICIENT_CONTEXT`, `STALE`, `FAILED`.

Eine Person kann gleichzeitig `CONNECTED`, `PITCH_READY` und CRM-Phase `new` sein. **Nicht alles zu einem einzelnen Statusfeld vermischen.**

### 7.2 Automatische Statusregeln

- Neue Beziehung erkannt → `CONNECTED` (mit Provider-Evidenz und Zeitstempel).
- Offene ausgehende Einladung erkannt → `OUTGOING_PENDING`.
- Zurückgezogene Einladung bestätigt → `WITHDRAWN`, Wiedervorlage setzen.
- Datum erreicht → `REINVITE_ELIGIBLE` als **Workflow-Indikator**; eigentlicher Verbindungsstatus bleibt zurückgezogen/nicht verbunden.
- Nachricht selbst gesendet und tatsächlich synchronisiert → `CONTACTED` bzw. Erstnachricht gesendet.
- Antwort vom Kontakt → `REPLIED`; ggf. Antwortaufgabe öffnen.
- Explizite Absage → `NO_INTEREST`/`DO_NOT_CONTACT` gemäß Regel; keine ungefragten weiteren Pitches.
- API meldet Unbekanntes/fehlende Information → **nicht** bestehende bestätigte Werte zerstören; `last_verified_at`/Unsicherheit anzeigen.
- Manuelle CRM-Bearbeitungen haben bei subjektiven Vertriebsbewertungen Vorrang; objektive LinkedIn-Zustände werden aus bestätigter Provider-Evidenz gepflegt.

### 7.3 Lead-Score und Aktionspriorität

Zwei **unabhängige** Bewertungen:

1. **Lead-Interesse** (z. B. `cold/warm/hot` und optional 0–100): fragt nach Website/Preis/Termin, signalisiert Budget/Bedarf, äußert Einwand, schließt Zusammenarbeit aus etc.
2. **Aktionspriorität** (`reply_now`, `reply_soon`, `follow_up_review`, `pitch_ready`, `no_action`): letzte Nachricht von wem, Wartezeit, konkrete Frage, gesetzter Wiedervorlagetermin.

Jede KI-Einschätzung mit kurzer Begründung und Referenz auf relevante Nachricht/Quelle. Keine endgültigen Geschäftsentscheidungen ohne Nutzerkontrolle. Rückmeldungen aus Chat und CRM fließen in die Aktualisierung ein; keine ungerechtfertigte automatische Kontaktaufnahme.

---

## 8. Wochenlimits und Aktivitätstracking

**Wichtig:** Es sind selbst gesetzte **interne Arbeitslimits**, keine Behauptung über offizielle LinkedIn-Grenzen.

- Konfigurierbar: Einladungen/Woche, Erstnachrichten/Woche, Follow-ups/Woche, Rückzüge/Woche; bei Bedarf separate Tageswerte.
- Übersicht `Verwendet / intern gesetztes Limit` und deutliche Warnung vor Erreichen.
- Zähler basieren auf **verifiziert beobachteten Aktionen**, ersatzweise als manuell bestätigt gekennzeichnet.
- Keine Erhöhung beim bloßen Kopieren oder beim Öffnen eines Chats.
- Deduplizierung wiederholter Sync-Ereignisse.
- Wöchentlichen Zeitraum und Zeitzone explizit definieren (Standard für den Workspace: **Europe/Berlin**, Wochenbeginn Montag).
- Wenn aktuelle Daten unvollständig sind, `mindestens X / möglicherweise unvollständig` statt falscher exakter Zähler.
- Keine automatische Kontingentauffüllung durch Abbrechen oder Zurückziehen, wenn es LinkedIn-seitig keinen solchen Effekt gibt.

---

## 9. LinkedIn-Integration und Architekturentscheidung

### 9.1 Abgrenzung: implementierte V1 vs. dokumentierte Recherchen

**Verbindliche Implementierungsentscheidung (20.10.2026):** **Unipile und die untersuchte GoSprint-Technik werden in V1 nicht integriert, nicht als POC getestet und nicht als Abhängigkeit eingeführt.** Keine Unipile-SDKs, Accounts, Zugangsdaten, Auth-Flows, Session-Cookies, Webhooks, API-Endpunkte oder Schreibfunktionen in der V1-Codebasis. Auch keine lokale Browserextension, die LinkedIn-Nachrichten sendet oder Einladungen zurückzieht.

Die Untersuchung ergab plausible technische Möglichkeiten, **aber keinen Auftrag, diese jetzt zu implementieren**. Die detaillierten Beobachtungen, Hypothesen, Risiken, Erkenntnisse und späteren Entscheidungskriterien stehen in **Abschnitt 18 (Recherche- und Entscheidungsanhang)**. Der Anhang ist informativ und **kein Bestandteil der V1-Umsetzungsaufträge**.

### 9.2 Zugelassener Integrationsumfang für V1

**Pfad A — Offizielle LinkedIn Member Data Portability API (Lese-POC für V1):**

- Für berechtigte EWR-/Schweizer LinkedIn-Mitglieder mit geeigneter Entwickler-App; tatsächliche Zugriffsberechtigung zuerst nachweisen.
- Eigene Datenbereiche inklusive `INBOX`, `CONNECTIONS`, `INVITATIONS` anhand realer API-Schemas prüfen.
- Snapshot für historischen Import, Changelog für neue Ereignisse, jeweils mit Provider-Grenzen und möglicher Verzögerung.
- **Nur lesen:** keine allgemeine offizielle Nachrichtenversand- oder Einladungsrückzugsfunktion daraus ableiten.
- Kein Anspruch auf vollständige Fremdprofile oder aktuelle Posts anderer Personen; Recherchequellen getrennt bewerten.
- Beim POC IDs, Abdeckung, Aktualität, Einladungszustände, Chatdaten und mögliche Deep-Links dokumentieren.

**Pfad B — Manuelle Ergänzungen / Fallback für V1:**

- Sichtbare Links zu LinkedIn-Profil und, wo verifiziert, LinkedIn-Chat oder Einladungsverwaltung.
- Autorisierte Datenexporte, manuelle Erfassung und markierte Bestätigung einzelner Aktivitäten, wo eine offizielle Schnittstelle Daten nicht liefert.
- Bei nicht verfügbarem oder unvollständigem Sync immer den entsprechenden Unsicherheitsstatus anzeigen; keine Vollständigkeit vortäuschen.
- Die Kernprozesse (CRM, gespeicherte Pitches, Recherche, Aufgaben, Scores) sollen auch ohne vollständige LinkedIn-Integration nutzbar bleiben.

**Außerhalb V1 — Unipile / Cookie-Anbindung / Browser-Automation:**

- Die Option bleibt im Recherche-/Entscheidungsanhang für später erhalten, wird aber **nicht in die erste technische Planung, die V1-Aufwandskalkulation, den initialen Integrations-POC oder den Implementierungsauftrag aufgenommen**.
- Ein späterer Einsatz bedarf einer **neuen ausdrücklichen Produkt- und Risikofreigabe**; keine automatische Freigabe durch diese Spezifikation.

### 9.3 Provider-unabhängige Schnittstelle (konzeptionell)

Das spätere technische Design soll sinngemäß diese Fähigkeiten isolieren (keine Vorgabe konkreter Funktionsnamen):

- `listConnections`, `listPendingInvitations`, `getInvitationStatus`
- `listChats`, `getMessages`, `getNewEvents`
- `getProfile`, `getRecentPosts` **wenn Provider dafür eine zulässige Quelle besitzt**
- `getConnectionHealth`, `reconcileSince(cursor)`
- `withdrawInvitation` **nur denkbare spätere Provider-Fähigkeit; in V1 weder als API-Funktion noch als Stub mit Schreibwirkung implementieren**
- `sendMessage` **denkbare spätere Provider-Fähigkeit; in V1 nicht implementieren/verwenden**

In UI und Backend je Capability einen Status (`available`, `unavailable`, `requires_review`, `disconnected`), statt von Vollzugriff auszugehen.

### 9.4 Synchronisierung (technische Mindestanforderungen)

- Initialer Import + fortlaufende Webhooks/Changelog/Polling gemäß Anbieterfunktionen.
- Idempotente Upserts, Pagination, Cursor/Watermarks, Wiederholungslogik, Rate-Limit-Behandlung, Replay nach Unterbrechung.
- Regelmäßiger Reconciliation-Job, um verpasste Ereignisse zu korrigieren.
- `source`, `provider_event_id`, `synced_at`, `last_verified_at`, `sync_run_id` für nachvollziehbaren Ursprung.
- Erst nach belegten Providerdaten objektive Statuswechsel auslösen.
- Keine endlosen Loops von `sync → score → draft → sync`.
- Status `PARTIAL`, `STALE`, `ERROR` und Reconnect-Hinweise sichtbar machen.

---

## 10. Konzeptionelles Datenmodell (vorläufig, Repository muss geprüft werden)

Das **bestehende** Workspace-/CRM-Schema erweitern, kein zweites isoliertes CRM aufbauen.

| Tabelle / Domäne                          | Wesentliche Felder oder Zweck                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `contacts` (vorhanden oder erweitern)     | Name, Position, Unternehmen, Website, CRM-Zuordnung, manuelle Attribute                                   |
| `social_identities` / `platform_accounts` | Kontakt-ID, Provider=`linkedin`, Profil-URL, Provider-ID(s), Identifier, Zuordnungs-Vertrauen             |
| `connected_provider_accounts`             | Eigenes verbundenes LinkedIn-Konto, Adapter, Provider-Account-ID, Auth-Status, letzter Sync               |
| `connection_relations`                    | Kontakt-ID, Status, `connected_at`, `last_verified_at`, Quelle                                            |
| `connection_invitations`                  | Provider-Invitation-ID, Richtung, Status, `sent_at`, `withdrawn_at`, `reinvite_eligible_at`, Statusquelle |
| `conversations`                           | Provider-Chat-ID, Teilnehmende, Kontakt/CRM-Verknüpfung, letzter Nachrichteneingang                       |
| `messages`                                | Provider-Message-ID, Richtung, Text, Zeitstempel, Sync-Metadaten; idempotent                              |
| `pitch_drafts`                            | Kontakt-ID, Version, Text, Qualität, Quellenbezug, Bearbeitungsstatus, Erstellungstyp, Zeitstempel        |
| `research_evidence`                       | Kontakt-ID, Art (`profile`, `website`, `imprint`, `post`), URL, faktische Beobachtung, Datum, Gültigkeit  |
| `lead_ai_assessments`                     | Kontakt, Modell-/Prompt-Version, Interesse, Priorität, Begründung, Nachrichtenreferenz                    |
| `follow_up_tasks` / vorhandene Tasks      | Fälligkeitsdatum, Aufgabe, manuelle Erledigung, Unterdrückungsgrund                                       |
| `activity_events`                         | Ereignisse wie Einladung, Verbindung, Nachricht, Rückzug; verified/manual; Zählerbasis                    |
| `sync_state` / `sync_runs`                | Adapter, Cursor, Start/Ende, Status, Fehler, letzte erfolgreiche Synchronisation                          |
| `outreach_preferences`                    | Wochenlimits, Wartezeiten, Entwurfszahl, Ton, Vorlagen, Quiet-/Opt-out-Status                             |

**Datenmodell-Prinzipien:**

- Eigene stabile Contact-IDs, Provider-IDs nur in Adaptertabellen.
- Statusdimensionen getrennt (Connection, Invitation, Outreach, Sales).
- Für datenschutzrelevante Rohdaten Lösch- und Aufbewahrungskonzept vorsehen.
- Keine Session-Cookies, LinkedIn-Passwörter oder 2FA-Secrets in Kontakt-/Nachrichtentabellen oder Client-Logs speichern.
- Sensitive Secrets ausschließlich in geeigneter Secret-Verwaltung; Auth-Integrationen serverseitig und mit geringsten nötigen Rechten.

---

## 11. Technische Leitplanken für den späteren Implementierungsplan

**Vorhandener Stack nach bisherigem Kontext:**

- Next.js App Router, TypeScript, Tailwind.
- Clerk für Login/Auth.
- Neon Postgres und Drizzle ORM.
- Vercel als Hosting-Plattform.
- Bereits vorhandener Invessiv Workspace mit CRM-/Lead-Funktionen.

**Keine unnötige Neuentwicklung:**

- Auf aktuelle Repository-Struktur, vorhandene Komponenten, Berechtigungen, Tabellen und Designsystem aufsetzen.
- Kein Wechsel zu Convex nur weil GoSprint Convex verwendet.
- Bei Bedarf geplanter Job/Queue: `detect_connection` → `research` → `generate_draft` → `validate` → `save`.
- Langlaufende Recherche/KI-Jobs **nicht** in einer normalen synchronen UI-Anfrage abwickeln; Async-Worker oder dafür passende Jobinfrastruktur prüfen.
- Web- und LinkedIn-Recherche cachen und zeitlich begrenzen; Replay/Retry ohne teure Duplikate.
- Serverseitige APIs mit AuthZ: Jeder Zugriff bleibt auf den autorisierten Workspace/Kontoinhaber beschränkt.
- Monitoring: Syncfehler, Research-Misserfolg, Draft-Latenz, Quellenlücken, fehlerhafte Statuszuordnung und Queue-Staus sichtbar machen.
- Capability-/Statusanzeigen nur für tatsächlich in V1 vorhandene offizielle Lese-Schnittstellen und manuelle Fallbacks; **keine Unipile-Feature-Flags, -Clients oder -Schreibaktionen in V1**.
- Gute mobile Nutzung als Bonus; **Desktop-Produktivität** hat Vorrang.

---

## 12. Wichtige Produktregeln / Edge Cases

1. **Nie ein automatisch ausgelöster LinkedIn-Versand.** Auch bei fertigem Pitch, fälligem Follow-up oder abgelaufener Einladung nicht.
2. **Keine doppelte Erstansprache:** Wenn Chat/CRM zeigt, dass bereits Kontakt besteht, nicht erneut unaufgefordert Erstpitch erstellen oder als „noch nicht kontaktiert“ behandeln.
3. **Absagen respektieren:** `DO_NOT_CONTACT` stoppt Empfehlungen/Follow-ups; keine künstliche Verlängerung.
4. **Keine erfundenen Icebreaker:** Fehlender LinkedIn-Beitrag ≠ Erlaubnis zum Erfinden eines Posts.
5. **Keine falschen Statuswechsel:** Verschwundene Einladung ≠ sicher zurückgezogen.
6. **Keine Datenüberschreibung:** Manuelle CRM-Notizen, Pipeline-Änderungen und editierten Pitch nicht unbemerkt ersetzen.
7. **Provider-Identität sorgfältig mappen:** Umbenannte LinkedIn-Profil-URLs, mehrere Firmen mit ähnlichen Namen, unterschiedliche Provider-IDs.
8. **Externe manuelle Aktionen erkennen:** Nutzer kann außerhalb des Workspace Nachrichten senden, Einladungen zurückziehen und erneut versenden; nächster Sync muss dies nachvollziehen.
9. **Sync-Lücken kennzeichnen:** Kein „Antwort offen“-Urteil auf Basis deutlich veralteter Chats ohne Hinweis.
10. **Opt-out/GDPR:** Vertrauliche Kunden-/Chatdaten nur in geprüfte KI-Anbieter geben; Zweckbindung und Löschkonzept.
11. **LinkedIn-Regeln:** Auch manuell ausgelöste Aktionen über eine inoffizielle Schreibschnittstelle sind nicht automatisch LinkedIn-konform; V1 vermeidet Nachrichtenversand via solchen Schnittstellen.
12. **Deutsches Wettbewerbsrecht:** Werbliche Direktnachrichten sind gesondert rechtlich zu prüfen; manuelle Bedienung ersetzt keine Einwilligung, wo diese erforderlich ist.

---

## 13. Bewusste Nicht-Ziele in V1

- **Keine Unipile-Anbindung jeglicher Art in V1:** weder Lese-POC noch Auth, SDK, Webhook, Cookie-Nutzung, API-Versand oder API-Rückzug. Die Erkenntnisse werden nur dokumentiert.
- **Kein** Versand von LinkedIn-Nachrichten über eigene/Unipile-API, selbst nicht auf Ein-Klick-Button.
- **Kein** automatisches Absenden von Nachrichten, Pitches, Follow-ups oder Einladungen.
- **Kein** automatisches Zurückziehen oder erneutes Versenden von Einladungen.
- **Keine** umfangreiche automatisierte Follow-up-Cadence; einfache Vorlagen, Inbox-Signale und Wiedervorlagen reichen.
- **Kein** Instagram-/E-Mail-/WhatsApp-Connector in V1.
- **Kein** vollständiger GoSprint-Klon, keine Funktion nur weil GoSprint sie besitzt.
- **Keine** inoffizielle Scraping- oder Browser-Bot-Infrastruktur als zwingende Grundlage des CRM.
- **Keine** neue unabhängige CRM-App, solange sich die Features im vorhandenen Workspace sauber umsetzen lassen.

---

## 14. Priorisierte Umsetzungsetappen innerhalb von V1

**Etappe 0 — Repository- und Schnittstellen-POC (Gate):**

- Vorhandenes CRM-Datenmodell, Tabellen und UI prüfen.
- Offizielle LinkedIn-Portabilitäts-API mit echtem eigenen Konto testen: Snapshot, Changelog, Nachrichten/Connections/Invitations/ID-Abdeckung.
- Falls offizielle Daten unzureichend: verfügbare Daten, unlösbare Lücken und **manuelle/Export-Fallbacks** dokumentieren; **nicht** in einen Unipile-Test wechseln. Ein mögliches späteres Unipile-Projekt wird separat entschieden.
- Reale 1:1-Chat-URLs und Profil-Links prüfen; Möglichkeiten zur Benutzer-Aktionsreduktion **ohne inoffizielle Schreibautomation** testen.
- Ergebnis: `Integration Decision Record` für die **offizielle Leseanbindung bzw. Fallbacks**; Unipile bleibt außerhalb dieser V1-Entscheidung.

**Etappe 1 — Synchronisierter LinkedIn-Datenkern:**

- Initialer Import, deduplizierte Kontakte, Messages/Conversations, Einladungen, Sync-Status.
- Kontakt-zu-CRM-Mapping und automatische objektive Verbindungs-/Einladungsstatusupdates.
- Sichtbare Listen für neue Verbindungen und ausstehende Einladungen.

**Etappe 2 — Precomputed AI Pitch Queue (größter unmittelbarer Zeitgewinn):**

- Die sechs Recherche-/Generierungs-/Validierungsschritte umsetzen.
- Automatischer Auslöser auf alle neuen Vernetzungen.
- Editor, Versionen, Quellen, Qualitätshinweise und Copy-&-Open.
- UX-Optimierung auf <=4 Aktionen und Ziel 2–4 s aktiven Bedienaufwand (ohne Prüfen/externes Laden).

**Etappe 3 — Einladungsmanager:**

- Offene/angenommene/zurückgezogene Einladungen, Alter, Profil-/Einladungslinks.
- Rückzug auf LinkedIn manuell, danach offizieller Sync oder ausdrücklich dokumentierte Benutzerbestätigung. **Kein API-/Unipile-Rückzug in V1.**
- Automatische Wiedervorlage und erneute Vernetzung **per manueller Aktion**.

**Etappe 4 — Sales Intelligence + tägliche Inbox:**

- Chat-Kontextanalyse, getrennte Lead-/Antwortpriorität, automatische CRM-Aufgaben/Statusvorschläge und definierte objektive Statusregeln.
- Wochenlimits, Aktivitätszähler, Listen mit „Heute tun“, einfache Follow-up-Vorlagen.
- Datenschutz, Performance, robuste Fehlerszenarien, Abnahmetests.

**Die Etappen sind Implementierungsreihenfolge, keine Verschiebung aus V1.** Alle aufgeführten Etappen sind Teil des vereinbarten funktionalen MVP, soweit durch den POC belegbar. Fehlen für eine erforderliche Funktion geeignete Plattformdaten, muss ein transparenter manueller Fallback vorhanden sein.

---

## 15. Konkrete Abnahmetests (Definition of Done)

### Sync & Daten

- [ ] Initialer Import erstellt keine Kontakt-/Chat-/Einladungsdubletten.
- [ ] Eine neue Verbindung erscheint nach erfolgreichem Sync und verknüpft sich korrekt mit bestehendem CRM-Eintrag.
- [ ] Neue und bereits existierende Nachrichten sind chronologisch korrekt; „wer schrieb zuletzt?“ stimmt.
- [ ] Ausgehende offene Einladungen sind mit Profil-Link und Alter sichtbar.
- [ ] Sync von bestätigter Annahme bzw. Rückzug ändert nur den passenden Status und erzeugt nachvollziehbaren Aktivitätseintrag.
- [ ] Nach Sync-Ausfall wird `STALE`/Fehler/letzter Erfolg gezeigt; beim Retry keine Duplikate.

### KI-Pitches

- [ ] Bei jeder neu erkannten, noch nicht angesprochenen Verbindung wird ein Job erstellt, ohne Kontaktkarte zu öffnen.
- [ ] Recherchierte Fakten stammen aus dokumentierten Quellen: LinkedIn-Profil, Website/Impressum, aktuelle Posts soweit zugänglich.
- [ ] Jeder konkrete individuelle Icebreaker-Fakt ist durch URL/Evidenz belegbar.
- [ ] Kein erfundener Post bei fehlenden Post-Daten; passender Qualitätsstatus.
- [ ] Pitch wird vorab gespeichert, beim Öffnen sofort angezeigt, frei editierbar und auf Wunsch regenerierbar.
- [ ] Optionaler zweiter Draft kann per Konfiguration vorgeneriert werden.
- [ ] Copy-&-Open-Workflow öffnet korrekten Kontakt/Chat und kopiert exakt die aktuell freigegebene Fassung.

### Manuelle Aktionen und UX

- [ ] Deutlich sichtbarer **Profil-Button direkt neben** Senden-/Kopier- und Rückzugs-/Neuvernetzungsaktionen.
- [ ] Ziel von maximal vier Aktionen bis zum **manuellen** LinkedIn-Senden wird in einem realistischen Desktop-Browsertest geprüft und dokumentiert.
- [ ] 2–4 Sekunden aktiver Bedienaufwand unter günstigen Bedingungen werden gemessen; externe Ladezeiten separat erfassen.
- [ ] Kopieren/Öffnen wird **nicht** automatisch als `SENT` verbucht.
- [ ] Keine LinkedIn-Schreibaktion wird ohne bewusste Benutzerhandlung ausgelöst.

### Einladungsmanager

- [ ] Alle tatsächlich verfügbaren offenen Einladungen sind filterbar.
- [ ] Manuell zurückgezogene Einladung lässt sich durch Sync oder gekennzeichnete Bestätigung dokumentieren.
- [ ] Mindestens drei Wochen Wiedervorlage nach bestätigtem Rückzugsdatum; neu senden nur manuell.
- [ ] Unbekannte/verschwundene Einladung wird nicht als automatisch zurückgezogen fehlklassifiziert.

### KI-CRM / Aktivität

- [ ] Heiße Leads werden mit belegbarem Gesprächskontext markiert.
- [ ] „Antwort offen“ unterscheidet eingehende Fragen und zuletzt selbst gesendete Nachrichten.
- [ ] Eine Absage verhindert zukünftige ungewollte Follow-up-Vorschläge.
- [ ] Verbindungsstatus und Sales-Pipeline sind getrennte Felder.
- [ ] Wochenlimits sind konfigurierbar und zählen bestätigte Aktionen, keine bloßen Entwürfe.

---

## 16. Offene technische Prüfungen — keine neuen Produktentscheidungen

Diese Punkte sollen später **am Repository bzw. mit echten API-Antworten** geklärt werden, nicht durch erneute lange Produktdiskussion:

1. Welche Teile von `INBOX`, `CONNECTIONS` und `INVITATIONS` sind über die offizielle Member Data Portability API bei diesem Account abrufbar, wie aktuell und mit welchen IDs?
2. Kann die verwendete Datenquelle **alle** offenen Einladungen mit stabilem Status liefern? Wenn nicht: welche Coverage wird angezeigt?
3. Wie werden **aktuelle fremde LinkedIn-Posts** und vollständige Profile rechtmäßig und zuverlässig recherchiert, **ohne Unipile oder unzulässige Browserautomatisierung**? Falls nicht: Quelle fehlt, Recherche-/Qualitätsstatus und manueller Kontext-Fallback.
4. Liefert die Integration verifizierte Chat-Deep-Links oder ist nur der Profil-Link garantiert?
5. Wie lassen sich Kontakte/Chats zuverlässig den vorhandenen CRM-Entities zuordnen?
6. Wie lassen sich **manuell auf LinkedIn** zurückgezogene Einladungen am zuverlässigsten beobachten oder als manuell bestätigt dokumentieren? Ein API-Rückzug ist in V1 nicht vorgesehen.
7. Welche Queue-/Joblösung passt zum vorhandenen Vercel-/Neon-Setup für vorab generierte Drafts?
8. Welche Kosten entstehen pro 100/500 neuen Vernetzungen durch **offiziellen Datenabruf**, Website-/Post-Recherche und KI-Generierung? Unipile-Kosten nur als Hinweis im Zukunftsanhang, nicht als V1-Kalkulationsposten.
9. Wie wird die eigene Aktivitätszählung mit Nachrichten/Einladungen außerhalb des Workspace synchronisiert?
10. Welche datenschutzrechtliche Grundlage, Aufbewahrungsdauer und KI-Auftragsverarbeitung sind für gespeicherte LinkedIn-Gespräche erforderlich?

---

## 17. Quellen, Plattformdokumentation und Risikohinweise

**LinkedIn / offiziell**

- Member Data Portability API (EWR): https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability/member-data-portability-member/
- LinkedIn-Portabilitätsbedingungen: https://www.linkedin.com/legal/l/portability-api-terms
- LinkedIn-Nutzervereinbarung (insb. nicht autorisierte automatisierte Methoden): https://www.linkedin.com/legal/user-agreement
- Einladungen zurückziehen / bis zu 3 Wochen erneute Einladung gesperrt: https://www.linkedin.com/help/linkedin/answer/a566316/eine-einladung-zuruckziehen?lang=de

**Unipile / Drittanbieter (Funktionsumfang dokumentiert, keine LinkedIn-Freigabe daraus ableiten)**

- LinkedIn-Guide: https://developer.unipile.com/docs/linkedin
- Hosted Auth: https://developer.unipile.com/docs/hosted-auth
- Nachrichten abrufen: https://developer.unipile.com/docs/get-messages
- Neue Nachrichten per Webhook: https://developer.unipile.com/docs/new-messages-webhook
- Neue Verbindungen erkennen: https://developer.unipile.com/docs/detecting-accepted-invitations
- Einladungen verwalten / zurückziehen: https://developer.unipile.com/v2.0/docs/linkedin-manage-invitations
- Profile abrufen: https://developer.unipile.com/docs/retrieving-users
- Beiträge: https://developer.unipile.com/docs/posts-and-comments

**Risiko-Einordnung:** Eine inoffizielle Cookie-basierte Integration kann technisch funktionieren und dennoch gegen LinkedIns Nutzungsbedingungen verstoßen. Dass GoSprint offenbar Unipile nutzt und die Betreiber nach eigener Aussage ihre Hauptkonten verwenden, ist keine Garantie für Account-Sicherheit. **Unipile gehört vollständig in einen separaten Zukunftsentscheid, nicht in V1 oder dessen POC.**

---

## 18. Recherche- und Entscheidungsanhang — GoSprint, Unipile und inoffizielle LinkedIn-Anbindung

> **STATUS: ARCHIVIERTE ERKENNTNISSE / ZUKUNFTSOPTION — NICHT UMSETZEN IN V1.** Dieser Abschnitt dokumentiert Beobachtungen, plausible Hypothesen und verworfene bzw. zurückgestellte Wege. Er ist **kein** Backlog, keine Integrationsfreigabe und keine Einladung, die folgenden Technologien testweise in den MVP einzubauen.

### 18.1 Ausgangsfrage und angestrebter Nutzen

- GoSprint liefert bereits einen sehr bequemen Workflow: KI-Icebreaker und Pitch generieren; mit bewusstem Klick senden; manuelle Follow-ups; gesendete/offene Einladungen verwalten, zurückziehen und erneute Vernetzungen vormerken.
- Für Invessiv ist insbesondere **Ein-Klick-Versand** attraktiv, weil er das manuelle Öffnen des Profils/Chats, Einfügen und Senden reduziert.
- Der Nutzer sendet **immer bewusst manuell**. Weder in GoSprint als beschriebener Nutzung noch in der eigenen geplanten Software ist ein autonomer Nachrichten-, Einladungs- oder Follow-up-Versand erwünscht.
- **Beschluss:** Der volle Ein-Klick-Versand und ein API-Rückzug sind technisch interessante Zukunftsoptionen, aber für den eigenen MVP zurückgestellt. Bereits vorbereitete Pitches, gute Deep-Links und möglichst wenige Aktionen bleiben V1-Pflicht.

### 18.2 Tatsächliche Beobachtungen aus der GoSprint-Untersuchung

| Beobachtung                                                                                                                              | Einordnung / Grenze der Aussage                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GoSprint erforderte eine Browsererweiterung, Version `1.0.25`, Beschreibung `LinkedIn Outreach Tracking`.                                | Ein Erweiterungsbestandteil ist vorhanden; sein konkreter Aufgabenbereich ist dadurch **nicht bewiesen**.                                                                                        |
| Zur Einrichtung wurde ein LinkedIn-Session-Cookie aus den Browser-Entwicklertools in GoSprint übertragen.                                | Hinweis auf Cookie-/Session-basierte Verbindung; unklar, wo der Cookie gespeichert wird und welche Zugriffe damit erfolgen. Cookie selbst niemals in Projekt-Dokumentation oder Logs übernehmen. |
| In der GoSprint-Webseite sowie im untersuchten Service Worker erschien beim Senden kein klar zuordenbarer neuer Fetch/XHR-Request.       | **Kein Beweis**, dass keine Netzkommunikation erfolgt: WebSockets, andere Prozesse oder ein Server kommen infrage.                                                                               |
| Eine GoSprint-API-Adresse `/api/auth/get-session` wurde gefunden.                                                                        | Spricht eher für die **GoSprint-eigene Sitzung** (möglicherweise Better Auth) als für LinkedIn-Versand; Library/Framework daraus nicht sicher ableiten.                                          |
| Im Opera-Network-Filter `Socket` erschien `wss://charming-squid-235.eu-west-1.convex.cloud/api/1.36.1/sync`.                             | **Convex**-Realtime-Verbindung zwischen GoSprint-Frontend und dessen Backend. Es erklärt, warum Aktionen nicht als separate HTTP-Requests sichtbar sein müssen.                                  |
| Ein WebSocket-Frame war `type: "Mutation"`, `udfPath: "unipile/actions:recordLiveSyncActivity"`.                                         | **Starkes Indiz**, dass GoSprint intern Unipile-Funktionen ansteuert. Der spezifische Pfad betrifft aber nur das Erfassen von Live-Sync-Aktivität; **keinen nachgewiesenen Nachrichtenversand**. |
| Laut Bericht des Nutzers sagen die GoSprint-Betreiber, sie nutzten das System mit ihren Hauptaccounts und hätten bislang keine Probleme. | Anekdotische Betriebserfahrung, **kein Nachweis** für LinkedIn-Freigabe, dauerhaftes Account-Risiko oder Sicherheitsniveau.                                                                      |

**Nicht festgestellt:** Ob **alle** Chats und Aktionen tatsächlich über Unipile laufen; ob ein LinkedIn-Nachrichtenversand über Unipile, eigene Server, eine Browserextension oder eine andere Komponente erfolgt; wo Session-Cookies gespeichert werden; welche Datenschutz-/Sicherheitsmaßnahmen tatsächlich gelten; wie hoch die Account-Sperrwahrscheinlichkeit ist. Keine dieser offenen Fragen für V1 durch Reverse Engineering lösen müssen.

### 18.3 Erkenntnisse zu Unipile als möglichem späteren Anbieter

- **Unipile** stellt eine API bereit, die laut eigener Dokumentation LinkedIn-Nachrichten, Chats, Profile, Beziehungen/Verbindungen, Einladungen und bestimmte Beitragsdaten integrieren kann.
- Der Anbieter dokumentiert außerdem **Schreibaktionen** wie Nachrichtensenden und Einladungsverwaltung/-rücknahme. Verfügbarkeit, Verhalten und Vollständigkeit sind im konkreten Account gesondert zu prüfen, nicht aus Marketingtexten garantieren.
- Eine **Hosted-Auth-Verbindung** könnte vermeiden, dass Invessiv den LinkedIn-Session-Cookie selbst entgegennehmen muss; sie beseitigt aber nicht die Drittanbieter-, Datenschutz- oder Plattformrisiken.
- Neue Verbindungen und Nachrichten können je nach API über Polling/Webhooks erkennbar sein; **Zeitversatz, Datenabdeckung und Kosten sind erst später anhand aktueller Dokumentation und realer Tests zu verifizieren**.
- Unipile ist für diese LinkedIn-Nachrichten-/Aktionsfunktionen **keine allgemein offiziell autorisierte LinkedIn-Schreibschnittstelle**. Die technische Machbarkeit bedeutet **keine** LinkedIn-Nutzungsberechtigung.
- Unipile wäre im Fall einer zukünftigen Freigabe **eine austauschbare Integrationsabhängigkeit**, niemals Eigentümer des Invessiv-CRM, der Lead-Historie, der Pitch-Daten oder der geschäftlichen Statusregeln.
- Früher im Gespräch genannte Preise, Limits oder Webhook-Verzögerungen sind **Momentaufnahmen und keine verbindlichen Architektur- oder Budgetannahmen**. Bei Wiederaufnahme neu verifizieren.

### 18.4 Betrachtete Alternativen und Risiken

| Option                                                                    | Erkenntnis                                                                                                                       | Entscheidung für V1                                  |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Offizielle LinkedIn-Member-Data-Portability-API                           | Dokumentierte eigene Datenbereiche `INBOX`, `CONNECTIONS`, `INVITATIONS`; für Lesen konzipiert, kein allgemeiner Schreibzugriff. | **Offiziellen Lese-POC vorsehen.**                   |
| Unipile-Lese-/Schreibintegration                                          | Technisch breiter; Cookie-/Integrationsrisiko und SaaS-Abhängigkeit.                                                             | **Nicht anbinden, nicht testen. Nur dokumentieren.** |
| Session-Cookie direkt im eigenen Backend verwenden                        | Hohe Vertrauens- und Sicherheitsanforderungen, mögliche Übernahme einer angemeldeten Sitzung, Plattformrisiko.                   | **Nicht umsetzen.**                                  |
| Browser-Agent / lokale Erweiterung mit Nachrichtenversand                 | Auch durch Benutzerklick ausgelöste nicht autorisierte Browserautomatisierung kann gegen LinkedIn-Regeln verstoßen.              | **Nicht umsetzen.**                                  |
| Lokaler Entwurfshelfer                                                    | Könnte das Einfügen vereinfachen, berührt aber möglicherweise LinkedIns Plattformregeln; nicht nötig für den ersten MVP.         | **Nicht umsetzen; zunächst Copy-&-Open.**            |
| Manuelles Senden auf LinkedIn mit vorbereitetem Pitch und sichtbarem Link | Deutlich einfacher, kein inoffizieller API-Schreibzugriff im eigenen Workspace.                                                  | **V1-Standard.**                                     |

**Zwei verschiedene Risikodimensionen:** (1) LinkedIn-Nutzungsbedingungen / mögliche Kontoeinschränkung; (2) Session-Sicherheit / Datenzugriff durch Dritte. Daneben Datenschutzrecht und Regeln für werbliche Direktnachrichten separat prüfen. Begrenzte eigene Wochenkontingente und ausschließlich manueller Versand reduzieren die Aktivitätsmenge, machen eine inoffizielle Schnittstelle **nicht automatisch zulässig oder sicher**.

### 18.5 Expliziter Beschluss / Voraussetzungen für eine spätere Wiederaufnahme

**Entscheidung vom 20.10.2026:**

1. **Unipile bleibt vollständig außerhalb von V1.** Kein SDK, keine API-Calls, kein Konto-/Cookie-Setup, kein Hosting-Auth-Flow, keine Webhooks, kein Proof of Concept, keine Kostenposition und keine Implementierungsaufgabe.
2. **In V1 niemals über inoffizielle Schnittstellen aus dem Workspace senden oder Einladungen zurückziehen.** Für Einladungsrückzüge nur LinkedIn öffnen, dort manuell handeln, anschließend Status synchronisieren/manuell bestätigen.
3. **GoSprint-/Convex-/Unipile-Befunde dokumentieren, aber den GoSprint-Stack nicht kopieren.** Der existierende Next.js-/Neon-/Drizzle-/Clerk-Workspace bleibt Basis.
4. **Datenhoheit priorisieren:** Kontakte, Chats (soweit verfügbar), Pitches, Aktivitäten und CRM-Zustände in der eigenen Datenbank sauber und exportierbar halten.
5. **Erst bei einem neuen ausdrücklichen Beschluss** die Unipile-Option erneut prüfen. Dann mindestens: LinkedIn-Regeln/Account-Risiko, Anbieter- und Cookie-Sicherheit, AVV/Datentransfer, aktuelle Preise/Feature-Abdeckung, beobachtbare Datenqualität, manueller Freigabe-Workflow, Exit-/Migrationsstrategie.
6. Auch bei einer künftigen technischen Freigabe bleibt die **Produktregel „keine autonomen LinkedIn-Schreibaktionen“** bestehen, solange der Nutzer sie nicht ausdrücklich neu entscheidet.

**Abgrenzung zu V1:** Eine fehlende offizielle Lese-Capability (z. B. aktuelle LinkedIn-Posts, vollständige offene Einladungen oder einzelne Chatfelder) ist **kein stillschweigender Freibrief**, Unipile für den MVP anzubinden. Die V1 muss stattdessen Lücken transparent anzeigen und manuelle Recherche-/Datenfallbacks ermöglichen.

---

## 19. Übergabeauftrag für eine spätere Claude-Code-/GPT-Planung

> Analysiere zuerst die vorhandene Invessiv-Workspace-Codebasis. Verwende **dieses Dokument als verbindliche Produkt-/MVP-Spezifikation**. Entwerfe darauf aufbauend einen konkreten, phasenweisen Implementierungsplan inklusive Repo-Änderungen, Datenbankmigrationen (Drizzle), API-/Provider-Adapter, AuthZ, Sync-Strategie, Jobs/Queues, Komponenten, KI-Research-/Draft-Pipeline, Kosten, Fehlerbehandlung und Tests. **Ändere die hier festgelegten Produktentscheidungen nicht stillschweigend.** Markiere technische Unsicherheiten als POC und baue transparente Fallbacks. Keinerlei automatische LinkedIn-Schreibaktionen oder API-Nachrichtenversand in V1. **Insbesondere Abschnitt 18 ist nur Archiv/Zukunftsoption: Unipile weder implementieren noch im V1-POC testen; keine Cookie-, Browserbot- oder inoffizielle Schreibintegration.** Optimiere massiv für minimale Benutzeraktionen und vorab fertige Pitches. Nutze vorhandene CRM-Komponenten und das bestehende Designsystem, statt ein neues CRM zu entwerfen. Liefere zuerst Architektur/Prüfplan, danach Implementierung in kleinen nachvollziehbaren Etappen.

---

**Kernaussage:** Der MVP ist eine **synchronisierte LinkedIn-Datenzentrale + asynchron vorbereitende KI + manuell gesteuerte Aktionsoberfläche**, nicht ein autonomer Outreach-Bot. **Unipile ist für spätere Entscheidungen dokumentiert, aber ausdrücklich nicht Teil der MVP-Umsetzung.**
