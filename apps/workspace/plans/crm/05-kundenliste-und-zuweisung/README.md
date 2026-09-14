# Ordner 05 — Kundenliste, Suche und Zuweisung

> **Status:** offen · **Abhängigkeit:** Ordner 04 · **Aufwand:** 3–4 Tage · **Reviewziel:** 60–100 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`02a-geteilte-listen-komponenten.md`](./02a-geteilte-listen-komponenten.md) — nur noch Referenz; der Umzug ist in
  Task 02e (Ordner 03d) aufgegangen und nicht Teil dieses Ordners.
- [`03-kundenliste.md`](./03-kundenliste.md) — Ausbau der Übersicht aus Ordner 04 zur vollen Liste: Pagination,
  Sortierung und URL-State.
- [`07-status-und-tags.md`](./07-status-und-tags.md) — Status, Kategorien, Tags und Audit.
- [`30-filter-und-suche.md`](./30-filter-und-suche.md) — normalisierte Suche, Filter und Queryplan.

Die Kundenverwaltung ist im Alltag navigierbar: paginierte Liste, URL-basierte Filter, schnelle
normalisierte Suche, persönliche Ansichten, Owner-Wechsel und Aufbewahrungshinweise funktionieren
vollständig.

## Änderungen

- Die Kundenliste nutzt die in Ordner 03d geteilten Listenbausteine aus `components/workspace/shared/` und
  `packages/ui`; Mehrfachauswahl im Facettenfilter wird hier erstmals aktiviert (`selectionMode: "multiple"`).
- Filter: Status, Owner, Kategorie, Tags sowie „meine Kunden" und „archiviert". **Kein Projekt- oder
  Aufgabenfilter** — `projects` und `tasks` existieren hier noch nicht, und Ordner 07 hängt an dieser
  Einheit; ein solcher Filter wäre eine Zirkelabhängigkeit zwischen zwei Merge-Einheiten.
- Die Filterleiste liest ihre Facetten aus `CUSTOMER_LIST_FACETS`. Ordner 07 (Projektphase), 08 („hat offene Aufgaben")
  und 12 („hat Portalzugang") registrieren dort nach, ohne die Toolbar
  anzufassen.
- Suche über Kundennummer, Anzeigename, Firma, Ort, Person und Firmen-E-Mail.
- Normalisierung für Groß-/Kleinschreibung, Rand-/Mehrfachleerzeichen und Kundennummern; `K42`,
  `K0042` und `42` finden denselben Kunden. Keine Tippfehlertoleranz bewerben.
- Owner-Wechsel übernimmt atomar alle offenen Projekte, Aufgaben und Renewals. Vorschau zeigt
  betroffene Zahlen; abgeschlossene Einträge bleiben unverändert.
- Pausiert nach 180 Tagen und archiviert nach 90 Tagen als Aufbewahrungsprüfung anzeigen; individuelle
  Frist hat Vorrang. Kein automatischer Statuswechsel und keine automatische Löschung.

## Merge-Gate

- [ ] Filterzustand überlebt Reload, Linkteilen und Browser-Zurück.
- [ ] Liste und Count verwenden identische Filter.
- [ ] Eine neu registrierte Facette erscheint in der Toolbar, ohne dass diese geändert wird.
- [ ] Owner-Übergabe ist vollständig atomar und erzeugt Activities pro betroffener Entität — in
      diesem Ordner ist das ausschließlich `customers`; Projekte, Aufgaben und Renewals kommen über
      die Ownership-Registry in Ordner 07, 08 und 11 hinzu.
- [ ] Parallele Übergabe und Bearbeitung führt zu 409 statt Teilzustand.
- [ ] Archivierte Kunden sind standardmäßig ausgeblendet, aber bewusst filterbar.
- [ ] Suche besitzt realistischen Query-Plan und Pagination ist deterministisch.

## Rollback

Neue Toolbar/Route kann ohne Schemaänderung ausgeblendet werden; Kundenakte aus Ordner 04 bleibt
nutzbar.
