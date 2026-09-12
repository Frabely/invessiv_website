# Ordner 04 — Personen und Kundenakte

> **Status:** offen · **Abhängigkeiten:** 01, 03 · **Aufwand:** 4–5 Tage · **Reviewziel:** 80–100 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`04-kunde-anlegen-bearbeiten.md`](./04-kunde-anlegen-bearbeiten.md) — CRM-Route, minimale
  Kundenübersicht, atomare Kundenanlage, Primärkontakt, Validierung und Concurrency.
- [`05-kundendetail-panel.md`](./05-kundendetail-panel.md) — Kundenakte, Archivierung und
  reaktivierbarer Detailflow.
- [`06-ansprechpartner.md`](./06-ansprechpartner.md) — globale Personen und firmenbezogene
  Zuordnungen.

Hier entsteht der CRM-Bereich als sichtbare Funktion: Sidebar-Eintrag, Route `/crm`, eine schlichte
Kundenübersicht als Einstieg, Anlegen und Bearbeiten, die Kundenakte und die Ansprechpartner.
Interne Nutzer können Kunden mit verpflichtendem Primärkontakt anlegen, ansehen, bearbeiten,
archivieren und reaktivieren. Personen können mehreren Firmen mit abweichenden Kontaktdaten und
Funktionen zugeordnet werden.

Die Übersicht ist absichtlich minimal — Nummer, Name, Status, Primärkontakt, festes Limit. Pagination,
URL-Filter und Suche folgen in Ordner 05, der an dieser Einheit hängt. Ohne diesen Einstieg wäre die
Akte nach dem Merge nur über eine geratene URL erreichbar.

## Daten und Regeln

- Kunde: Typ, Anzeigename, optionale Firma, Anschrift, Website, USt-ID, Notizen, Kategorie, Status,
  Owner, Nummer, Aufbewahrungsfrist und `version`.
- Person: Name, primäre E-Mail/Telefon, persönliche Portalsprache und `version`.
- Zuordnung: Kunde, Person, Funktion, abweichende Firmen-E-Mail/-Telefon und `is_primary`.
- Pro Kunde exakt ein Primärkontakt. Create-Command legt Kunde und Zuordnung atomar an.
- Keine Unique-Constraint auf Namen, Domain oder USt-ID; normalisierte Ähnlichkeit erzeugt nur eine
  bestätigungspflichtige Warnung.
- Archivieren blendet standardmäßig aus; Reaktivieren setzt einen aktiven Status. Kein `deleted_at`.
- Optimistic Concurrency: veraltete Mutationen liefern 409 mit aktuellem DTO.

## UI und Endpunkte

- Vollständiger Create/Edit-Dialog für Kunde plus Primärkontakt.
- Kundenakte als adressierbare Route oder URL-gesteuertes Panel mit Stammdaten, Kontakten und
  Activities; noch nicht gebaute Sektionen werden nicht gerendert.
- Kontaktzuordnung anlegen, bearbeiten, Primärkontakt wechseln und lösen. Die letzte/primäre
  Zuordnung darf nur in derselben Transaktion durch eine neue primäre ersetzt werden.
- Kategorien und Tags werden aus bestehenden Mustern wiederverwendet.

## Merge-Gate

- [ ] Kunde kann niemals ohne Primärkontakt committed werden.
- [ ] Dieselbe Person kann zwei Kunden mit unterschiedlichen Firmendaten bedienen.
- [ ] Dublettenwarnung blockiert nicht und verlangt bewusste Bestätigung.
- [ ] Veraltete Version überschreibt keine neuere Bearbeitung.
- [ ] Archivierte Kunden bleiben direkt adressierbar nur für berechtigte interne Nutzer.
- [ ] Ein bestehender Kunde ist über die Übersicht auffindbar — ohne Filter, Suche oder geratene URL.
- [ ] Die Übersicht zeigt keine deaktivierten Platzhalter für Filter oder Suche.
- [ ] Der Listen-Query-Handler wird in Task 03 erweitert, nicht ersetzt: Signatur und DTO bleiben.
- [ ] Empty-, Loading-, Validierungs- und Serverfehlerzustände sind in DE/EN vorhanden.
- [ ] A11y-Smoke deckt Create/Edit, Kontaktwechsel und Archivierung ab.

## Rollback

CRM-Navigation ausblenden. Additive Daten bleiben bestehen und die Lead-Anwendung ist unabhängig.
