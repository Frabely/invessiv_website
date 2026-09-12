# Task 30 — Filter und Suche

> **Merge-Einheit:** Ordner 05 · **Branch:** `feat/crm-kundenliste-und-zuweisung`
> **Aufwand:** M · **Abhängigkeiten:** Task 07 (Status und Tags), Task 10 (Projekte)
> **Migration:** Nummer im Repository ermitteln (höchste bestehende plus eins)

- Normalisierte Substring-/Präfixsuche über Nummer, Anzeigename, Firma, Ort, Person und Firmen-E-Mail.
- `42`, `K42` und `K0042` werden vor der Query zur gleichen numerischen Kundennummer normalisiert.
- Groß-/Kleinschreibung sowie Rand-/Mehrfachleerzeichen sind tolerant; Schreibfehler nicht.
- `pg_trgm` darf ausschließlich als Indexbeschleunigung für `ILIKE`/Substring dienen; keine
  Similarity-Schwelle, kein unscharfes Ranking und keine entsprechende UI-Behauptung.
- Filter ergänzt Owner und persönliche Ansicht; `deleted_at` spielt keine Rolle.

## Context

Der bewusst letzte Task: Filtern lohnt sich erst, wenn es etwas zu filtern gibt. Bei fünf Kunden ist
eine Filterleiste Zierrat, ab fünfzig wird sie zur Notwendigkeit.

Jetzt sind alle Ordnungsachsen vorhanden — Status, Tags, Kategorie, Projektphase, Ansprechpartner —
und die Bausteine liegen bereit: Filterzustand in der URL, der mehrfachauswahlfähige Facettenfilter
aus Task 02a, serverseitige Auswertung nach dem Muster von `lead-filter.query-handler.ts`.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zustand                 | Ausschließlich in der URL. Kein React-State, kein `localStorage` für Filter                                                                                                                      |
| Warum                   | Teilbar, neu ladbar, mit Zurück-Taste bedienbar — und serverseitig auswertbar, ohne Daten doppelt zu halten                                                                                      |
| Wiederverwendung        | Die geteilten Toolbar-Komponenten aus Task 02a — dort wurde der Facettenfilter bereits mehrfachauswahlfähig gemacht, hier wird er nur benutzt                                                    |
| Filter                  | Status (mehrfach), Tags (mehrfach, UND-Verknüpfung), Kategorie, Projektphase, „hat Portalzugang", „hat offene Aufgaben"                                                                          |
| Suche                   | Über Anzeigename, Firmenname, Kundennummer, Ort und Ansprechpartnername                                                                                                                          |
| Technik der Suche       | **`pg_trgm`** mit GIN-Index über einen zusammengesetzten Ausdruck                                                                                                                                |
| Warum nicht `tsvector`  | Volltextsuche matcht nur ganze Wortstämme: „part" findet „Partner GmbH" **nicht**, „Mül" findet gar nichts. Genau das war als Akzeptanzkriterium versprochen und mit `tsvector` nicht erreichbar |
| Was `pg_trgm` liefert   | Substring-Treffer mitten im Wort, tippfehlertolerant, indexgestützt — und eine Zeile Migration statt einer generierten Spalte mit Sprachkonfiguration                                            |
| Warum nicht `ILIKE %…%` | Ohne Trigramm-Index kann Postgres das nicht indizieren; die Suche wird mit wachsender Datenmenge linear langsamer                                                                                |
| Ansprechpartner         | Über eine `EXISTS`-Unterabfrage durchsucht, nicht in den Index gezogen — sie ändern sich unabhängig vom Kunden                                                                                   |
| Verzögerung             | Eingabe wird 300 Millisekunden verzögert, dann wird die URL ersetzt (kein neuer Verlaufseintrag je Tastendruck)                                                                                  |
| Zurücksetzen            | Sichtbare Schaltfläche, sobald ein Filter aktiv ist, mit Anzahl aktiver Filter                                                                                                                   |
| Leeres Ergebnis         | Eigener Zustand mit Zurücksetzen-Angebot — klar unterschieden vom „noch keine Kunden"-Zustand                                                                                                    |

## Architektur

```txt
Extension: CREATE EXTENSION IF NOT EXISTS pg_trgm
Index:     GIN auf lower(coalesce(display_name,'') || ' ' || coalesce(company_name,'') || ' '
                     || coalesce(city,'') || ' ' || customer_number::text)  gin_trgm_ops
Abfrage:   dieser Ausdruck LIKE '%' || lower(:q) || '%'
           ODER EXISTS (Ansprechpartner dieses Kunden mit Treffer in Name oder E-Mail)

/crm?status=active,onboarding&tags=wordpress&phase=development&q=müller&page=2
  → parseCustomerListSearchParams   erweitert
  → listCustomers                   erweitert um Filterbedingungen
```

Der Index liegt auf einem Ausdruck, nicht auf einer gespeicherten Spalte — Postgres hält ihn
automatisch aktuell. Es gibt keinen Anwendungscode, der etwas nachpflegen müsste und dabei
vergessen werden könnte, und kein Backfill bestehender Zeilen.

## Verzeichnisstruktur

```txt
packages/db/migrations/<nr>_add_customer_search_index.sql
packages/db/src/record-configuration/crm/customers.ts          + Trigramm-Index

apps/workspace/src/common/constants/crm/list/customer-list-query-params.ts   erweitert
apps/workspace/src/server/workspace/crm/
  shared/customer-list-search-params.ts        erweitert
  query-handler/list-customers.query-handler.ts erweitert
  services/customer-filter-service.ts          Filterbedingungen bauen
apps/workspace/src/lib/workspace/crm/customer-list-query-string.ts  erweitert

apps/workspace/src/components/workspace/crm/toolbar/
  customers-toolbar/
  customer-search-field/
  customer-status-filter/
  customer-tag-filter/
  customer-category-filter/
  customer-phase-filter/
  customer-flag-filter/
  customer-active-filters/
apps/workspace/src/i18n/dictionaries/workspace/crm/toolbar/{de,en}.json
```

## Tickets

### CRM-30-T1 — Trigramm-Index

- **Files:** `<nr>_add_customer_search_index.sql`, `record-configuration/crm/customers.ts`
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - `CREATE EXTENSION IF NOT EXISTS pg_trgm`
  - GIN-Index mit `gin_trgm_ops` auf dem zusammengesetzten Ausdruck aus Anzeigename, Firmenname,
    Ort und Kundennummer
  - Ein zweiter Trigramm-Index auf `people` (Anzeigename, E-Mail) plus einer auf der abweichenden Firmen-E-Mail in
    `customer_contact_assignments` für die
    `EXISTS`-Unterabfrage
- **Akzeptanz:**
  - Migration idempotent; kein Backfill nötig, weil der Index auf einem Ausdruck liegt
  - `EXPLAIN` zeigt, dass die Suche den Trigramm-Index nutzt und keinen vollständigen
    Tabellendurchlauf macht
  - **Teilwörter treffen mitten im Wort:** „part" findet „Partner GmbH", „mül" findet
    „Müller & Partner"
  - Groß- und Kleinschreibung ist unerheblich
  - Die Suche nach einer Kundennummer (`42` oder `K0042`) findet den Kunden

### CRM-30-T2 — Filterauswertung

- **Files:** `customer-list-search-params.ts`, `customer-filter-service.ts`,
  `list-customers.query-handler.ts`, `customer-list-query-params.ts`,
  `customer-list-query-string.ts` + Tests
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - Parameter validieren und auf gültige Werte begrenzen (ein manipulierter Statuswert wird
    verworfen, nicht durchgereicht)
  - Tags mit UND-Verknüpfung über `EXISTS`-Unterabfragen (Muster: `lead-filter.query-handler.ts`)
  - Filter kombinierbar; Seite wird bei Filterwechsel auf 1 zurückgesetzt
- **Akzeptanz:**
  - Tests je Filter einzeln und in Kombination
  - Test: ungültige Werte werden ignoriert statt zu einem Fehler zu führen
  - Test: zwei Tags liefern nur Kunden mit **beiden**
  - Weiterhin genau zwei Abfragen je Seitenaufruf

### CRM-30-T3 — Filterleiste

- **Files:** `components/workspace/crm/toolbar/**`,
  `dictionaries/workspace/crm/toolbar/{de,en}.json`
- **Skills:** `frontend-design`, `accessibility`, `copywriting`
- **Inhalt:**
  - Suchfeld mit Verzögerung, Löschen-Schaltfläche und Tastaturkürzel zum Fokussieren
  - Facettenfilter über die geteilte Komponente aus Task 02a mit `selectionMode: "multiple"`
  - Aktive Filter als entfernbare Chips unter der Leiste, dazu „Alle zurücksetzen"
  - Auf Mobil als ausklappbare Leiste mit Zähler aktiver Filter
- **Akzeptanz:**
  - Vollständig per Tastatur bedienbar, Ergebnisanzahl über Live-Region angekündigt
  - Verzögerung erzeugt keine Flut von Verlaufseinträgen (Adresse wird ersetzt, nicht angehängt)
  - Auf Mobil verdeckt die Leiste keine Tabellenzeilen

### CRM-30-T4 — Leeres Ergebnis

- **Files:** `table/customers-empty-state/**` erweitert
- **Skills:** `frontend-design`, `copywriting`
- **Inhalt:** Zwei klar unterschiedene Zustände — „noch keine Kunden angelegt" mit Anlegen-Schaltfläche
  und „keine Treffer für diese Filter" mit Zurücksetzen-Schaltfläche und Auflistung der aktiven Filter
- **Akzeptanz:** Die beiden Zustände sind nicht verwechselbar; das Zurücksetzen führt zurück zur
  vollständigen Liste

## Deploy-Sicherheit

1. **Live sichtbar:** neue Filterleiste über der Kundenliste, Suchfeld, Filter-Chips.
2. **Bricht nichts:** Migration additiv — eine generierte Spalte und ein Index, keine bestehende
   Spalte verändert. Ohne gesetzte Filter verhält sich die Liste exakt wie vorher; die bestehenden
   Abfragetests bleiben gültig. Auf großen Tabellen kann das Anlegen des GIN-Index kurz sperren — bei
   der aktuellen Datenmenge irrelevant, im PR aber als Hinweis vermerkt.
3. **Offen:** nichts. Gespeicherte Filteransichten wären der nächste Ausbauschritt und sind bewusst
   nicht enthalten.

## End-to-End-Akzeptanz

1. Die Suche findet Kunden über Anzeigename, Firma, Ort, Kundennummer und Ansprechpartner — auch
   mit Umlauten und mit Teilwörtern mitten im Wort.
2. Filter nach Status, Tags, Kategorie, Projektphase und Kennzeichen funktionieren einzeln und
   kombiniert; Status und Tags erlauben Mehrfachauswahl.
3. Zwei Tags liefern nur Kunden mit beiden.
4. Der Filterzustand steht in der URL, ist teilbar und über die Zurück-Taste bedienbar.
5. Aktive Filter sind als Chips sichtbar und einzeln entfernbar.
6. Ein leeres Ergebnis ist vom leeren Datenbestand unterscheidbar.
7. Ein manipulierter Filterwert führt nicht zu einem Fehler.
8. Die Suche nutzt den Index statt eines vollständigen Tabellendurchlaufs.
9. Mobil, Dark und Light geprüft; Tastaturbedienung vollständig.
10. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
