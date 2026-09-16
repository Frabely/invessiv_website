# Ordner 05 — Kundenliste und Status

> **Status:** im Review · **Abhängigkeit:** Ordner 04 · **Aufwand:** 2–3 Tage · **Reviewziel:** 40–70 Dateien

## Ziel und Stand nach Merge

Die Kundenübersicht ist analog zur Lead-Liste alltagstauglich: serverseitige Pagination,
URL-basierte Sortierung, zuschaltbare archivierte Kunden, Owner, Hauptansprechpartner und letzte
Änderung. Der Kundenstatus ist in der Tabelle als Badge sichtbar und wird ausschließlich in den
Stammdaten des Kunden geändert. Jeder tatsächliche Wechsel wird versioniert und als Activity protokolliert.

## Konkrete Task-Pläne

- [`02a-geteilte-listen-komponenten.md`](./02a-geteilte-listen-komponenten.md) — Referenz; in Ordner 03d umgesetzt.
- [`03-kundenliste.md`](./03-kundenliste.md) — vollständige Kundenliste.
- [`07-status.md`](./07-status.md) — Statusanzeige und Statuswechsel.

Bewusst nach [`../22a-kundenorganisation-und-uebergabe/`](../22a-kundenorganisation-und-uebergabe/) verschoben:

- Suche, Facettenfilter und Tags, weil die fachlichen Filterachsen erst nach den CRM-Domänen vollständig sind.
- Globale Zuständigkeitsübergabe, weil sie erst nach Projekten, Aufgaben und Renewals exhaustiv umgesetzt werden kann.

## Merge-Gate

- [x] Pagination ist deterministisch und begrenzt die Liste auf 25 Einträge je Seite.
- [x] Sortierung und Seitenzustand sind als URL-State teilbar.
- [x] Archivierte Kunden sind standardmäßig ausgeblendet und über eine Checkbox zuschaltbar.
- [x] Owner, Hauptansprechpartner und letzte Änderung sind sichtbar.
- [x] Der Status bleibt in jeder Tabellenzeile als nicht interaktives Badge sichtbar.
- [x] Statuswechsel erfolgen im Kundenformular, verwenden `version` und erzeugen genau bei einer tatsächlichen Änderung
      eine Activity.

## Rollback

Die neue Tabellenoberfläche und die Statuseingabe im Kundenformular können entfernt werden. Es gibt
keine Schemaänderung; Kundenakte und bestehende Statuswerte bleiben erhalten.
