# Ordner 06a — Kundenzuständigkeit

> **Status:** offen · **Abhängigkeiten:** 04, 05, 06 · **Aufwand:** 1–2 Tage · **Reviewziel:** 25–45 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`08a-kundenverantwortung.md`](./08a-kundenverantwortung.md) — Auswahl, Wechsel und Protokollierung des
  Kundenverantwortlichen.

Jeder Kunde hat einen klar sichtbaren internen Verantwortlichen. Bei direkter Anlage und Lead-Konvertierung wird das
aktuelle Mitglied vorausgewählt, kann aber durch ein anderes berechtigtes aktives Mitglied ersetzt werden. Der
Verantwortliche lässt sich anschließend einzeln und versioniert ändern.

Diese Einheit liegt bewusst vor den Projekten: Projekte, Aufgaben, Renewals und Chat übernehmen bei ihrer Anlage einen
sinnvollen Standard aus der bereits vorhandenen Kundenzuständigkeit. Ihre spätere individuelle Zuweisung bleibt davon
unabhängig.

## Fachliche Grenzen

- Zuständigkeit gewährt keine Berechtigung. Das Zielmitglied muss aktiv sein und `customers.read` besitzen.
- Ein Kunden-Owner-Wechsel ändert nur `customers.owner_member_id`; bestehende untergeordnete Zuweisungen werden nicht
  still überschrieben.
- Jede Änderung läuft über `updateVersioned` und erzeugt eine Activity mit alter und neuer Member-ID.
- Die vollständige Übergabe aller Zuständigkeiten eines Mitglieds bleibt eine explizite atomare Aktion in Ordner 22a.
- Keine neue Tabelle und keine Migration: `customers.owner_member_id` und `version` existieren bereits.

## Merge-Gate

- [ ] Direkte Kundenanlage und Lead-Konvertierung erlauben die Auswahl eines aktiven berechtigten Mitglieds.
- [ ] Ohne Auswahl bleibt das aktuelle Mitglied der Kundenverantwortliche.
- [ ] Der Verantwortliche ist in Kundenliste und Kundenakte sichtbar und dort änderbar.
- [ ] Inaktive oder unberechtigte Mitglieder können nicht zugewiesen werden.
- [ ] Ein veralteter Versionsstand liefert 409 und überschreibt keine parallele Änderung.
- [ ] Der Wechsel erzeugt genau eine Activity und ändert keine bestehenden Kindentitäten.
- [ ] Owner-Auswahl und Fehlerzustände sind per Tastatur bedienbar und in DE/EN vorhanden.

## Rollback

Owner-Auswahl und Wechselaktion ausblenden. Bestehende Kunden behalten ihre gültige bisherige Zuordnung; Anlage und
Lead-Konvertierung verwenden wieder das aktuelle Mitglied als Standard.
