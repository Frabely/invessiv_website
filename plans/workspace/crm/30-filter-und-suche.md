# Task 30 — Filter und Suche

> **Branch:** `feat/crm-filter-suche`
> **Aufwand:** M (rund ein Tag)
> **Abhängigkeiten:** Task 07 (Status und Tags), Task 10 (Projekte)
> **Migration:** `0035_add_customer_search_index.sql` (Planwert)

## Context

Der bewusst letzte Task: Filtern lohnt sich erst, wenn es etwas zu filtern gibt. Bei fünf Kunden ist
eine Filterleiste Zierrat, ab fünfzig wird sie zur Notwendigkeit.

Jetzt sind alle Ordnungsachsen vorhanden — Status, Tags, Projektphase, Ansprechpartner — und die
Leads-Oberfläche liefert ein vollständig ausgereiftes Vorbild: Filterzustand in der URL, generische
Facettenfilter, serverseitige Auswertung.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Zustand                 | Ausschließlich in der URL. Kein React-State, kein `localStorage` für Filter                                                                                  |
| Warum                   | Teilbar, neu ladbar, mit Zurück-Taste bedienbar — und serverseitig auswertbar, ohne Daten doppelt zu halten                                                  |
| Wiederverwendung        | Die generische Facettenfilter-Komponente der Leads wird genutzt, nicht nachgebaut                                                                            |
| Filter                  | Status (mehrfach), Tags (mehrfach, UND-Verknüpfung), Projektphase, „hat Portalzugang", „hat offene Aufgaben"                                                 |
| Suche                   | Über Firmenname, Ansprechpartnername, E-Mail und Ort                                                                                                         |
| Technik der Suche       | Postgres-Volltext mit einer generierten Spalte plus GIN-Index                                                                                                |
| Warum nicht `ILIKE %…%` | Das kann keinen Index nutzen und wird mit wachsender Datenmenge linear langsamer. Die generierte Spalte kostet einmalig Schemaarbeit und bleibt dann schnell |
| Verzögerung             | Eingabe wird 300 Millisekunden verzögert, dann wird die URL ersetzt (kein neuer Verlaufseintrag je Tastendruck)                                              |
| Zurücksetzen            | Sichtbare Schaltfläche, sobald ein Filter aktiv ist, mit Anzahl aktiver Filter                                                                               |
| Leeres Ergebnis         | Eigener Zustand mit Zurücksetzen-Angebot — klar unterschieden vom „noch keine Kunden"-Zustand                                                                |

## Architektur

```txt
Spalte:  search_vector tsvector GENERATED ALWAYS AS (…) STORED
Index:   GIN auf search_vector

/crm?status=active,onboarding&tags=wordpress&phase=development&q=müller&page=2
  → parseCustomerListSearchParams   erweitert
  → listCustomers                   erweitert um Filterbedingungen
```

Die Suchspalte wird von Postgres automatisch gepflegt — es gibt keinen Anwendungscode, der sie
aktualisieren müsste und dabei vergessen werden könnte.

## Verzeichnisstruktur

```txt
packages/db/migrations/0035_add_customer_search_index.sql
packages/db/src/record-configuration/crm/customers.ts          + search_vector

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
  customer-phase-filter/
  customer-flag-filter/
  customer-active-filters/
apps/workspace/src/i18n/dictionaries/workspace/crm/toolbar/{de,en}.json
```

## Tickets

### CRM-30-T1 — Suchspalte und Index

- **Files:** `0035_add_customer_search_index.sql`, `record-configuration/crm/customers.ts`
- **Skills:** `best-practices`, `performance`
- **Inhalt:**
  - Generierte `tsvector`-Spalte über Firmenname, Ort und Umsatzsteuer-Identifikationsnummer, mit
    deutscher Textsuchkonfiguration
  - GIN-Index darauf
  - Ansprechpartner werden über eine Unterabfrage durchsucht, nicht in die Spalte gezogen (sie
    ändern sich unabhängig)
- **Akzeptanz:**
  - Migration idempotent, bestehende Zeilen bekommen den Wert automatisch
  - `EXPLAIN` zeigt, dass die Suche den GIN-Index nutzt
  - Umlaute und Teilwörter finden das Erwartete („müller" findet „Müller & Partner")

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
  - Facettenfilter über die bestehende generische Komponente der Leads
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

1. Die Suche findet Kunden über Firma, Ort und Ansprechpartner, auch mit Umlauten.
2. Filter nach Status, Tags, Projektphase und Kennzeichen funktionieren einzeln und kombiniert.
3. Zwei Tags liefern nur Kunden mit beiden.
4. Der Filterzustand steht in der URL, ist teilbar und über die Zurück-Taste bedienbar.
5. Aktive Filter sind als Chips sichtbar und einzeln entfernbar.
6. Ein leeres Ergebnis ist vom leeren Datenbestand unterscheidbar.
7. Ein manipulierter Filterwert führt nicht zu einem Fehler.
8. Die Suche nutzt den Index statt eines vollständigen Tabellendurchlaufs.
9. Mobil, Dark und Light geprüft; Tastaturbedienung vollständig.
10. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
