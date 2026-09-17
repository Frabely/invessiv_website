# Task 08c — Kunden-Cockpit-Dialog

> **Merge-Einheit:** Ordner 06b · **Status:** läuft · **Abhängigkeiten:** 04, 05

## Ziel

Stellt einen einzelnen CRM-Kunden in einem breiten, read-only Dialog dar. Der Dialog ist die interne Mitarbeitersicht und zugleich der verbindliche Darstellungsbaustein für den späteren Dashboard-Detailbereich.

## Datenumfang dieses Slices

- Kundenkopf: Kundennummer und Anzeigename.
- Status.
- Zuständiges Workspace-Mitglied.
- Primärkontakt einschließlich vorhandener E-Mail-Adresse.

## Umsetzung

- Die serverseitige Query liefert nur den kompakten `CustomerCockpitDto`; unbekannte oder ungültige IDs ergeben keinen Treffer.
- Der Dialog wird über `cockpit=<uuid>` im URL-State geöffnet und geschlossen.
- Die Tabellenaktion ist mit `customers.read` sichtbar. Bearbeiten bleibt unabhängig davon nur mit `customers.write` sichtbar.
- Der Formular-Button ist ausschließlich im bestehenden Kundenformular vorhanden. Öffnen und Schließen bewahren dessen Zustand und ungespeicherte Eingaben.
- Texte liegen vollständig in den CRM-Dictionaries für DE und EN.

## Nicht Teil dieses Tasks

- Dashboard-Umschalter oder Kundenauswahl.
- Leads, Website-Lead-Submissions, Anfragen und Lead-Einstieg.
- Projekte, Aufgaben, Chat, Feature-Wünsche, Renewals, Aktivitäten, Herkunfts-Leads und Owner-Wechsel.
- API-Route, Migration oder Schreibpfad.

## Restarbeiten

- Query-Test für unbekannte ID und minimalen Datenumfang.
- Dialogtest für Escape, Fokusführung und beide Sprachen.
- Optionaler expliziter UX-Zustand für eine unbekannte Cockpit-ID; derzeit öffnet sich kein Dialog.

## Weiterentwicklung

Nach Ordner 07 erweitert eine Projektsektion denselben DTO-, Query- und Darstellungspfad. Jede weitere CRM-Domäne ergänzt diesen Pfad statt eine dialogspezifische Abfrage oder Komponente einzuführen.

## Rollback

Tabellenaktion, Formular-Button und Dialog entfernen. Der Leseweg schreibt keine Daten.
