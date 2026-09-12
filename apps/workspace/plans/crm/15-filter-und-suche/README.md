# Ordner 15 — Filter und Suche

> **Merge-Einheit 15 von 16** · **Aufwand:** ~1 Tag · **Review-Umfang:** geschätzt ~35 Dateien
> **Setzt voraus:** Ordner 01 (Facettenfilter), 05 (Status, Tags), 06 (Projektphase)
> **Migrationen:** `0036_add_customer_search_index`

## Ziel

Substring-Suche über Nummer, Name, Firma, Ort und Ansprechpartner, dazu Filter nach Status, Tags,
Kategorie, Projektphase und Kennzeichen — Filterzustand ausschließlich in der URL.

## Tasks in Umsetzungsreihenfolge

| Task | Datei                    | Aufwand | Inhalt                                         |
| ---- | ------------------------ | ------- | ---------------------------------------------- |
| 30   | `30-filter-und-suche.md` | M       | Trigramm-Index, Filterauswertung, Filterleiste |

## Nach dem Merge live

Filterleiste über der Kundenliste, Suchfeld mit Verzögerung, aktive Filter als entfernbare Chips.

## Warum zuletzt (vor dem optionalen Ordner 16)

Bewusst spät: Filtern lohnt sich erst, wenn es etwas zu filtern gibt. Bei fünf Kunden ist eine
Filterleiste Zierrat, ab fünfzig wird sie zur Notwendigkeit. Alle Ordnungsachsen müssen vorher
existieren — sonst filtert man nach Feldern, die niemand gepflegt hat.

Der mehrfachauswahlfähige Facettenfilter kommt aus Ordner 01 und wird hier nur benutzt, nicht gebaut.

## Merge-Gate

- [ ] `EXPLAIN` zeigt, dass die Suche den Trigramm-Index nutzt und keinen vollständigen
      Tabellendurchlauf macht
- [ ] **Teilwörter treffen mitten im Wort:** „part" findet „Partner GmbH", „mül" findet
      „Müller & Partner"
- [ ] Die Suche nach einer Kundennummer (`42` oder `K0042`) findet den Kunden
- [ ] Groß- und Kleinschreibung ist unerheblich
- [ ] Migration idempotent; kein Backfill nötig, weil der Index auf einem Ausdruck liegt
- [ ] Filter nach Status, Tags, Kategorie, Projektphase und Kennzeichen wirken einzeln und kombiniert
- [ ] Zwei Tags liefern nur Kunden mit **beiden**
- [ ] Ein manipulierter Filterwert wird verworfen und führt nicht zu einem Fehler
- [ ] Weiterhin genau **zwei** Abfragen je Seitenaufruf
- [ ] Der Filterzustand steht in der URL, ist teilbar und über die Zurück-Taste bedienbar
- [ ] Die Verzögerung erzeugt keine Flut von Verlaufseinträgen (Adresse wird ersetzt, nicht angehängt)
- [ ] Ein leeres Ergebnis ist vom leeren Datenbestand unterscheidbar
- [ ] Auf Mobil verdeckt die Leiste keine Tabellenzeilen
- [ ] Alle Texte in DE und EN; Dark und Light geprüft
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün

## Hinweis für den PR

Auf großen Tabellen kann das Anlegen eines GIN-Index kurz sperren. Bei der aktuellen Datenmenge
irrelevant, im PR aber als Hinweis vermerken.

## Bewusst noch offen

Gespeicherte Filteransichten wären der nächste Ausbauschritt. Da der URL-State teilbar ist, taugt
ein Lesezeichen fast genauso gut.
