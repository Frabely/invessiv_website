# Ordner 19 — Stundenkontingente und konsolidierte History

> **Status:** offen · **Abhängigkeiten:** 02, 07, 12 · **Aufwand:** 3–4 Tage · **Reviewziel:** 60–100 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`27-stundenbuchungen.md`](./27-stundenbuchungen.md) — Kontingent, Buchungen, Korrekturen und
  Portalansicht.
- [`29-aktivitaet-und-history.md`](./29-aktivitaet-und-history.md) — Timeline, Pagination und
  sichere Feldänderungen.

Interne Nutzer führen informative Stundenkontingente pro Kunde und Buchungen mit optionalem
Projektbezug. Kunden sehen Saldo und alle Buchungen im Portal. Die Kundenakte zeigt eine
konsolidierte Timeline aller bisher implementierten CRM-Ereignisse.

## Stundenmodell

- Additive Migrationen und Modelle für `retainers` und `time_entries` entstehen in diesem Ordner.
- Kontingent gehört zum Kunden und speichert gekaufte Minuten sowie optionalen Zeitraum.
- Buchung speichert positive Dauer in Minuten, Datum, kundensichtbare Beschreibung, Autor und
  optional konsistentes Projekt.
- Rest wird aus Kontingent minus Buchungen berechnet, nie redundant gespeichert.
- Alle Buchungen sind automatisch portalöffentlich. Formular und Bestätigung kennzeichnen die
  Beschreibung unübersehbar als kundensichtbar.
- Bearbeiten oder Entfernen verlangt aktuelle `version` und protokolliert vorherigen/neuen Wert.
- Keine Rechnungslogik, Steuern, Preise, Gegenbuchungen oder Lexware-IDs.

## Timeline

- Einheitliche chronologische Query über Activities mit stabiler Cursor-Pagination.
- Automatische Activities unveränderlich; manuelle Notiz darf bearbeitet werden, Änderung bleibt
  als eigenes Ereignis erhalten.
- Credential-Inhalte, geheime Notizen, Mailtoken und unnötige PII sind ausgeschlossen.
- Portal erhält keine interne Timeline, sondern nur die fachlichen Portalmodule.

## Merge-Gate

- [ ] Saldo stimmt bei parallelen Buchungen, Änderungen und Löschungen.
- [ ] Projekt einer Buchung gehört zwingend zum selben Kunden.
- [ ] Jede Buchung ist im Portal sichtbar; interner Text warnt vor dieser Öffentlichkeit.
- [ ] Activity-Pagination überspringt oder dupliziert keine identischen Zeitstempel.
- [ ] Reveal-Audit zeigt nur Credential-ID und Actor, nie einen Geheimwert.
- [ ] Historische Lead-Activities aus Ordner 02 bleiben vollständig sichtbar.

## Rollback

Stunden- und Timeline-Module per Flag ausblenden. Daten bleiben erhalten; bestehende CRM-Funktionen
arbeiten unabhängig.
