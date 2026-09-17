# Ordner 07d — Pakete und Kundenvolumen

> **Status:** offen · **Abhängigkeiten:** 04, 05, 06b, 07, 07b · **Aufwand:** 4–5 Tage · **Reviewziel:** 90–125 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`40-paketkatalog-und-kundenpakete.md`](./40-paketkatalog-und-kundenpakete.md) — versionierter
  Paketkatalog im Code, Kundenpaket-Schema mit Menge und Preisart, Wertberechnung.
- [`41-paketverwaltung-und-rechte.md`](./41-paketverwaltung-und-rechte.md) — Buchen, Bearbeiten,
  Beenden, Preiswechsel, Permission `packages.*`, Routen und Activities.
- [`42-kundenwert-in-akte-und-listen.md`](./42-kundenwert-in-akte-und-listen.md) — Tab in der
  Kundenakte, Wertanzeige in Kundenliste und Projektkarte.
- [`42a-mitarbeiter-cockpit-dealvolumen.md`](./42a-mitarbeiter-cockpit-dealvolumen.md) — ergänzt die
  Mitarbeiter-Cockpit-Liste **und** den Kunden-Cockpit-Dialog aus Ordner 06b um Kundenwert, Projektwert
  und Pipeline, über dieselbe geteilte Aggregationsfunktion.

Nach dem Merge ist je Kunde nachvollziehbar, **was er gebucht hat, zu welchem Inhalt und zu welchem
Preis** — einmalig wie laufend, projektbezogen wie kundenweit. Kundenwert und Projektwert sind in
der Liste sichtbar. Preisänderungen erzeugen eine Nachfolgeposition statt einer Überschreibung, die
Historie bleibt damit ehrlich.

## Abgrenzung (verbindlich)

- **Lexware bleibt führend für Angebot, Rechnung und Zahlung.** Das CRM bildet kein Angebot ab und
  kopiert keine Angebotstexte. Es hält die gebuchten Bausteine, ihre Konditionen und optional die
  Lexware-Angebotsnummer als Freitext.
- Kein Zahlungsstatus, keine Mahnstufe, keine Summenrechnung mit Steuer. Sobald das entsteht, läuft
  ein zweites Buchhaltungssystem neben Lexware.
- Keine Rabatt-Regel-Engine. Ein Kombipreis ist ein **eigenes Paket** im Katalog; zusätzlich ist der
  Preis jeder gebuchten Position frei editierbar.
- Kein Portalzugriff. Beträge bleiben vollständig intern (`00-entscheidungen.md`, „Portal und
  Kommunikation“). Der Kunde fragt Erweiterungen über Chat (Ordner 17/18) an.

## Regeln

- Der Katalog liegt als versioniertes Const-Objekt in `packages/common`, nicht in der Datenbank.
  Eine Preisänderung ist eine neue Version im Code, keine Migration und kein Pflege-UI.
- Eine gebuchte Position ist ein **Snapshot**: Bezeichnung, Leistungspunkte und Preise werden beim
  Buchen in die Kundenzeile kopiert und sind danach je Kunde frei editierbar.
- Vorgeschlagen wird die Katalogversion zum **Konditionsanker** des Kunden, nicht automatisch die
  neueste. Der Wechsel auf die aktuelle Version ist ein sichtbarer, bewusster Klick.
- Preisänderung an einer laufenden Position = alte Position beenden (`ends_on`) und Nachfolger mit
  `replaces_package_id` anlegen. Kein stilles Überschreiben eines laufenden Preises.
- Menge und Stückpreis sind getrennt (`quantity`, `unit_cents`); der Gesamtbetrag wird nie gespeichert.
- Mehr Stück zu einem neuen Preis sind eine **neue** Position, keine Mengenerhöhung der alten.
- Der Stundensatz ist eine Position mit `pricing_mode = 'rate'` — kein zweiter Mechanismus, keine
  eigene Tabelle. Er zählt in keiner Wertsumme und hat keinen Stand.
- `status` (läuft die Position) und `stage` (wo steht das Geschäft) sind zwei getrennte Achsen.
- Umsatz zählt erst ab `ordered`; `requested` und `offered` laufen als Pipeline getrennt mit.
- `invoiced` und `paid` sind manuelle Vermerke und **nicht führend** — Lexware bleibt die Wahrheit.
  Bei wiederkehrenden Positionen sind sie gar nicht zulässig.
- Werte werden immer berechnet, nie gespeichert.
- `packages.read`/`packages.write` sind workspace-weit und **nicht** bindbar (`scopable = false`).

## Merge-Gate

- [ ] Katalogtest: jede Paketversion hat aufsteigende `validFrom`, lückenlose `versionNumber` und
      jeder `labelKey`/`itemKey` existiert in DE und EN.
- [ ] `getServicePackageVersion(key, anker)` liefert die zum Anker gültige Version, nie eine spätere.
- [ ] Buchen einer Position kopiert Bezeichnung, Leistungspunkte und Preise; eine spätere
      Katalogänderung verändert die gebuchte Zeile nachweislich nicht.
- [ ] Preiswechsel erzeugt genau zwei Zeilen mit lückenlosem Zeitraum; der Wert zum Stichtag vor dem
      Wechsel bleibt unverändert.
- [ ] Position mit `project_id` eines fremden Kunden wird von der zusammengesetzten Constraint
      abgelehnt (Negativtest).
- [ ] Kundenwert und Projektwert stimmen in Liste, Akte und Projektkarte überein — eine Quelle.
- [ ] Menge zählt in jeder Summe: 3 × 300 € ergeben 900 €.
- [ ] Angefragte und angebotene Positionen erhöhen den Kundenwert nicht, sondern die Pipeline.
- [ ] `invoiced`/`paid` an einer wiederkehrenden Position wird abgelehnt — DB und Handler.
- [ ] „Was ansteht" nennt offene Angebote mit Liegedauer und filtert die Liste per Klick.
- [ ] Die Mitarbeiter-Cockpit-Liste **und** der Kunden-Cockpit-Dialog aus Ordner 06b zeigen Kundenwert und
      Pipeline identisch zur Kundenakte; ohne `packages.read` bleiben die Wertspalten an beiden Stellen
      serverseitig weg.
- [ ] Zweite aktive `rate`-Position je Kunde wird abgelehnt; `rate` zählt in keiner Wertsumme.
- [ ] Aktive `rate`-Position und `customers.default_hourly_rate_cents` sind nach jedem Schreibpfad
      deckungsgleich (DB-Smoke).
- [ ] `db:seed:crm` erzeugt einen Kunden mit einmaliger Position mit Menge, laufender Position,
      eigenem Stundensatz und einem Preiswechsel in der Vergangenheit.

## Rollback

Navigation zum Tab und die Wertspalten ausblenden; die Permission bleibt vergeben. Die Tabellen sind
additiv und werden von keinem anderen Ordner gelesen — Bestandsdaten bleiben unberührt.
