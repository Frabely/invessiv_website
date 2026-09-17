# Ordner 06b — Mitarbeiter-Cockpit

> **Status:** läuft · **Abhängigkeiten:** 04, 05, 06 · **Aufwand:** S · **Reviewziel:** 15–25 Dateien

## Ziel und Stand

Dieser erste Slice schafft eine kompakte, read-only Kundenansicht im breiten Dialog. Sie ist aus der Kundenliste und aus dem bestehenden Kundenformular erreichbar und zeigt ausschließlich Kundenkopf, Status, Zuständigkeit und Primärkontakt.

Die Ansicht ist intern und benötigt `customers.read`. Bearbeiten bleibt getrennt an `customers.write` gebunden. URL-State bewahrt Listenfilter und einen gleichzeitig offenen Bearbeitungsdialog.

## Umgesetzt

- Schlankes `CustomerCockpitDto` und eine serverseitige Query für genau einen Kunden.
- Wiederverwendbare Kundenansicht im Dialog mit Kundenkopf, Status, Zuständigkeit und Primärkontakt.
- Tabellen-Action für Leseberechtigte sowie Formular-Button nur bei bestehenden Kunden.
- DE/EN-Dictionaries und URL-State über `cockpit=<uuid>`.

## Bewusst nicht Teil dieses Slices

- Dashboard-Umschalter, Kundenauswahl und Dashboard-URL-State.
- Website-Lead-Submissions, Leads, Anfragen oder ein Lead-Einstieg.
- Projekte, Aufgaben, Chat, Feature-Wünsche, Renewals, Aktivitäten, Herkunfts-Leads und Owner-Wechsel.
- Neue Tabellen, Migrationen oder API-Routen.

## Nächster fachlicher Ausbau: Projekte

Projekte können erst in dieser Kundenansicht erscheinen, nachdem Ordner 07 die Projektdomäne bereitstellt: Schema und Migration, Contracts, Berechtigungen, Query-/Command-Pfad sowie Projektanlage und -liste. Danach erweitert die Projekt-Query denselben Kunden-DTO- und Darstellungsweg; es entsteht keine parallele Dialoglogik.

## Späterer Dashboard-Ausbau

Der Dashboard-Umschalter bleibt bewusst vertagt. Wenn er umgesetzt wird, benötigt er `dashboard.read` und `customers.read`, zeigt ausschließlich eigene zugewiesene Kunden und hält Ansicht, Auswahl sowie Kunden-ID im URL-State. Ein Select verwendet dieselbe Cockpit-Query und dieselbe Kundenansicht.

## Noch offen in diesem Ordner

- Server-Tests für unbekannte Kunden-ID und das minimale DTO ohne zusätzliche Kundendaten.
- Dialogtests für Escape, Fokusführung sowie DE/EN.
- Entscheidung für die UX bei einer unbekannten Cockpit-ID; aktuell öffnet sich entsprechend dem bestehenden CRM-Muster kein Dialog.

## Rollback

Tabellen-Action, Formular-Button und Dialog ausblenden. Die Query liest nur bestehende Tabellen und schreibt nichts.
