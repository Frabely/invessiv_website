# CRM & Kundenportal — Core Features

Kurzüberblick über den Funktionsumfang. Je Feature ein bis zwei Sätze und der Task, der es baut.
Details in `00-entscheidungen.md` und den nummerierten Task-Dateien.

## Kundenverwaltung

**Kundenstammdaten** · Task 01, 03, 04, 05
Zentrale Kundenakte mit Kundennummer, Anzeigename, Firmierung, Adresse, Website und Notizen, als
Liste mit Sortierung und Pagination sowie als Detailansicht. Firmen und Privatpersonen sind beide
abbildbar, und die Detailansicht ist die Klammer, in der alle weiteren Features als Sektionen
zusammenlaufen.

**Kundennummer** · Task 01
Jeder Kunde bekommt automatisch eine fortlaufende Nummer, angezeigt als `K0001` — sprechbar am
Telefon, tippbar in der Suche und stabil über Jahre. Belege behalten ihre eigene Nummerierung mit
Jahr.

**Ansprechpartner** · Task 06
Beliebig viele Kontakte je Kunde mit Name, Funktion, Mail und Telefon, einer davon als Primärkontakt
markiert. Der Primärkontakt erscheint in der Kundenliste und ist Standardempfänger für die
Portal-Einladung.

**Status, Kategorie und Tags** · Task 01, 07
Fester Statuswert je Kunde (Onboarding bis Archiviert) für den Beziehungsstand, eine Branche als
Kategorie aus derselben gepflegten Liste wie bei den Leads, dazu frei vergebbare Tags für alles
andere (WordPress, SEO, Retainer). Der Status ist direkt im Detail umschaltbar und jeder Wechsel wird
protokolliert.

**Lead zu Kunde** · Task 08
Ein gewonnener Lead wird per Dialog zum Kunden, wahlweise als neuer Kunde oder zugeordnet zu einem
bestehenden. Der Lead bleibt mit seiner kompletten History erhalten und wird beidseitig verlinkt —
und seine Akquise-Historie wandert mit in die Kundenakte, statt an der Konvertierung abzureißen.

**Filter und Suche** · Task 30
Substring-Suche über Nummer, Name, Firma, Ort und Ansprechpartner sowie Filter nach Status, Tags,
Kategorie, Projektphase und Kennzeichen. Der Filterzustand lebt in der URL und ist damit teilbar, neu
ladbar und über die Zurück-Taste bedienbar.

**Aktivität und History** · Task 01a, 29
Ein durchgehender Zeitstrahl von der ersten Lead-Berührung bis in die laufende Betreuung: Anlage,
Statuswechsel, Feldänderungen mit Vorher-Nachher, Uploads, Einreichungen. Dazu manuelle Notizen —
automatische Einträge bleiben unveränderlich, damit das Protokoll eines bleibt.

**Sicheres Löschen** · Task 05
Löschen entfernt den Kunden aus Liste und Detail, behält die Daten aber — Zeitbuchungen sind
Abrechnungsgrundlage und Einreichungen sind Freigabe-Nachweise. Endgültiges Löschen ist ein zweiter,
bewusster Schritt und räumt dabei auch die Dateien im Speicher ab.

## Projekte und Aufgaben

**Projekte mit Phasen** · Task 09, 10
Mehrere Projekte je Kunde mit fester Phasensequenz von Onboarding bis Wartung, Budget und
Stundensatz, Preview-Link und nächstem Schritt samt Termin. Die Phasenleiste ist dieselbe Komponente,
die der Kunde im Portal sieht — beide Seiten zeigen garantiert denselben Stand.

**Aufgaben** · Task 11
Eine Aufgabenliste je Kunde und Projekt mit zwei Schaltern: wer verantwortlich ist (du oder der
Kunde) und ob der Kunde sie sieht. Kundensichtbare Aufgaben sind die Bringschuld-Checkliste im
Portal, ein Haken des Kunden landet direkt in deiner Liste.

**Aufgabenübersicht über alle Kunden** · Task 11a
Eine Ansicht, die die Frage „was ist diese Woche fällig" beantwortet: alle offenen Aufgaben über alle
Kunden nach Fälligkeit, überfällige zuerst, direkt aus der Liste abhakbar. Dazu ein Block im
Dashboard und ein Zähler überfälliger Aufgaben in der Seitenleiste.

**Onboarding-Checklisten** · Task 12
Vordefinierte Aufgabenvorlagen für wiederkehrende Projektarten, die per Klick die immer gleichen
Schritte erzeugen — inklusive korrekt gesetzter Verantwortung und Fälligkeit. Mehrfaches Anwenden
erzeugt keine Dubletten, und die Titel erscheinen dem Kunden in seiner Sprache.

## Dateien

**Dateiverwaltung** · Task 13, 14, 15
Assets, Ergebnisse und Einreichungen je Kunde und Projekt, mit Drag-and-drop-Upload, Vorschaubildern
im Raster, Inline-Vorschau für Bild und PDF sowie Download über kurzlebige signierte Links. Der
Speicher liegt hinter einem Adapter-Interface, ein Wechsel zu R2 oder einem eigenen Server ist eine
einzelne Datei.

**Freigabe für den Kunden** · Task 15
Je Datei ein Schalter, der sie im Portal sichtbar macht — eindeutig gekennzeichnet, damit bei einer
Freigabe an Dritte kein Zweifel besteht. Neue Uploads sind standardmäßig nicht freigegeben.

**Gebündelter Upload und Download** · Task 16
Mehrere Dateien gleichzeitig hochladen mit Fortschritt je Datei, und beliebig viele ausgewählte
Dateien als ZIP herunterladen. Das Archiv wird serverseitig gestreamt und nach Kategorie sortiert,
mit Grenzen, die zur Laufzeit einer Serverless-Funktion passen.

## Zugangsdaten

**Verschlüsselte Credentials** · Task 17, 18
Hosting, FTP, CMS, Registrar und Analytics je Kunde, mit AES-256-GCM verschlüsselt abgelegt — ein
Datenbank-Abzug ohne den Hauptschlüssel enthält nichts Verwertbares. Klartext verlässt den Server
nur auf ausdrückliche Anforderung für genau einen Eintrag, verschwindet nach 30 Sekunden wieder und
jede Aufdeckung wird protokolliert.

## Rechte

**Rollen und Berechtigungen** · Task 02
Clerk beantwortet nur, wer jemand ist; die Datenbank hält die Rolle und der Code die Berechtigungen
als typisiertes Const-Objekt. Alle Prüfungen laufen über ein zentrales `can()`, und eine
Datenbankzeile genügt als Zugang — ein zweiter interner Nutzer braucht damit keinen Deploy.

## Kundenportal

**Portalzugang** · Task 20
Kunden bekommen ein echtes Konto über eine Einladung, die an einen Ansprechpartner gebunden ist, und
landen in einem eigenen, vom internen Bereich strikt getrennten Bereich. Der Zugang ist jederzeit
widerrufbar und wirkt sofort.

**Kunden-Dashboard** · Task 21
Der Kunde sieht auf einer Seite seinen Projektstatus als Phasenleiste, die offene Bringschuld zum
Abhaken, den nächsten Schritt mit Datum, den Preview-Link und sein Stundenkontingent. Bereiche ohne
Inhalt erscheinen gar nicht erst, statt als leere Kästen.

**Upload- und Feedback-Schnittstelle** · Task 22
Der Kunde lädt gebündelt Dateien hoch und schreibt sein Feedback in ein Freitextfeld — beides
zusammen als eine Einreichung, die den Status von hochgeladen über in Prüfung bis freigegeben
durchläuft. Entwürfe überleben einen geschlossenen Tab, und du wirst per Mail benachrichtigt.

**Download freigegebener Ergebnisse** · Task 22
Der Kunde holt sich seine fertigen Dateien selbst — Logo-Paket, finale Assets, Zugangsübergabe —
einzeln oder als ZIP. Sichtbar ist ausschließlich, was du ausdrücklich freigegeben hast; alles andere
ist über keinen Portal-Endpunkt erreichbar.

**Einreichungen im CRM** · Task 23
Sammelbereich mit Ungelesen-Zähler über alle Kunden, in dem du Freitext liest, Dateien ansiehst oder
gebündelt herunterlädst und den Status mit einem kurzen Antworttext setzt. Der Kunde sieht die
Statusänderung sofort in seinem Portal.

**Chat** · Task 24, 25, 26
Eine durchlaufende Unterhaltung je Kunde, auf beiden Seiten mit demselben Verlauf, Datumstrennern,
Lesestand und Ungelesen-Zähler. Statt Echtzeit-Infrastruktur gibt es gebündelte
Mail-Benachrichtigungen — höchstens eine je 15 Minuten, und keine an jemanden, der ohnehin gerade
online ist.

**Mail senden** · Task 31
Wenn eine echte Mail nötig ist, geht sie aus der Kundenakte oder aus dem Portal raus und wird in
Timeline und Verlauf protokolliert — im Gegensatz zum eigenen Postfach bleibt eine Spur. Der Chat
bleibt ausdrücklich der übliche Weg, dieses Feature ist die Ausnahme.

## Betreuung

**Stundenkontingent** · Task 27
Wartungsverträge mit festem Kontingent und einzelnen Buchungen aus Datum, Dauer und Beschreibung;
der Rest wird immer berechnet und nie gespeichert. Der Kunde sieht im Portal nicht nur eine
schrumpfende Zahl, sondern wofür die Stunden verbraucht wurden.

**Renewal-Tracking** · Task 28
Ablaufdaten für Domain, Hosting, SSL und Lizenzen je Kunde, mit Widget im Dashboard und täglicher
Sammel-Erinnerungsmail vor dem Stichtag. Verlängern verschiebt das Datum und protokolliert den
Vorgang, statt den Eintrag neu anzulegen.
