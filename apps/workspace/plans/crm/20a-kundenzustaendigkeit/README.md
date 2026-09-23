# Ordner 20a — Kundenzuständigkeit

> **Status:** offen · **Abhängigkeiten:** 07, 07a–07c, 12–15c, 16–20 · **Aufwand:** 1–2 Tage · **Reviewziel:** 25–45
> Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`08a-kundenverantwortung.md`](./08a-kundenverantwortung.md) — Auswahl, Wechsel und Protokollierung des
  Kundenverantwortlichen.

Jeder Kunde hat einen klar sichtbaren internen Verantwortlichen. Bis zu dieser Einheit ist der bei direkter Anlage und
Lead-Konvertierung gesetzte Actor lediglich der technische Default. Jetzt kann ein anderes aktives Mitglied mit
wirksamem Kunden-Zugriff bewusst ausgewählt und die Verantwortung später einzeln und versioniert geändert werden.

Die Einheit liegt bewusst nach Projekten, Zugriffsbereichen, Portal, Dateien, Onboarding, Feedback, Chat,
Zugangsdaten sowie Stunden und History. Damit ist das Mitarbeiter-Dashboard für Projekte vor den nachgelagerten
Aufgabenserien, Jobs und Renewals vollständig. Die Kundenakte kann den vorhandenen Kontext erklären, ohne beim
einzelnen Wechsel still Projekt-, Portal-, Aufgaben-, Renewal- oder Chat-Zuweisungen zu übertragen.

## Fachliche Grenzen

- Zuständigkeit gewährt keine Berechtigung. Das Zielmitglied muss aktiv sein und nach dem vorhandenen
  `accessScope`-/`canOn`-Muster wirksamen Kunden-Zugriff besitzen.
- Ein Kunden-Owner-Wechsel ändert nur `customers.owner_member_id`; bestehende untergeordnete Zuweisungen werden nicht
  still überschrieben.
- Jede Änderung läuft über `updateVersioned` und erzeugt eine Activity mit alter und neuer Member-ID.
- Die Kundenliste bleibt Übersicht. Der Wechsel erfolgt ausschließlich in einem eigenen Bereich der Kundenakte, damit
  er nicht als unbeabsichtigte Tabellenaktion ausgelöst wird.
- Die vollständige, atomare Übergabe aller Zuständigkeiten eines Mitglieds bleibt eine explizite Aktion in Ordner 22a.
- Keine neue Tabelle und keine Migration: `customers.owner_member_id` und `version` existieren bereits.

## Merge-Gate

- [ ] Direkte Kundenanlage und Lead-Konvertierung erlauben die Auswahl eines aktiven Mitglieds mit wirksamem
      Kunden-Zugriff.
- [ ] Ohne Auswahl bleibt das aktuelle Mitglied der Kundenverantwortliche.
- [ ] Der Verantwortliche ist in Kundenliste und Kundenakte sichtbar; der Wechselbereich existiert ausschließlich in
      der Kundenakte.
- [ ] Inaktive oder Mitglieder ohne wirksamen Kunden-Zugriff können nicht zugewiesen werden.
- [ ] Ein veralteter Versionsstand liefert 409 und überschreibt keine parallele Änderung.
- [ ] Der Wechsel erzeugt genau eine Activity und ändert keine bestehenden Projekt-, Aufgaben-, Renewal- oder
      Chat-Zuweisungen.
- [ ] Owner-Auswahl und Fehlerzustände sind per Tastatur bedienbar und in DE/EN vorhanden.

## Rollback

Owner-Auswahl und Wechselaktion ausblenden. Bestehende Kunden behalten ihre gültige bisherige Zuordnung; Anlage und
Lead-Konvertierung verwenden wieder ausschließlich das aktuelle Mitglied als technischen Default.
