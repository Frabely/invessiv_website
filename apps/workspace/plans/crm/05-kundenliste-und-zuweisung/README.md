# Ordner 05 — Kundenliste, Suche und Zuweisung

> **Status:** offen · **Abhängigkeit:** Ordner 04 · **Aufwand:** 3–4 Tage · **Reviewziel:** 60–100 Dateien

## Ziel und Stand nach Merge

**Konkrete Task-Pläne**

- [`02a-geteilte-listen-komponenten.md`](./02a-geteilte-listen-komponenten.md) — risikoarmer
  UI-Umzug ohne Verhaltensänderung.
- [`03-kundenliste.md`](./03-kundenliste.md) — Liste, Pagination und URL-State.
- [`07-status-und-tags.md`](./07-status-und-tags.md) — Status, Kategorien, Tags und Audit.
- [`30-filter-und-suche.md`](./30-filter-und-suche.md) — normalisierte Suche, Filter und Queryplan.

Die Kundenverwaltung ist im Alltag navigierbar: paginierte Liste, URL-basierte Filter, schnelle
normalisierte Suche, persönliche Ansichten, Owner-Wechsel und Aufbewahrungshinweise funktionieren
vollständig.

## Änderungen

- Geteilte Listenbausteine nur bei tatsächlicher Wiederverwendung aus Leads nach `shared` ziehen;
  bestehende Lead-Tests bleiben dabei inhaltlich unverändert.
- Filter: Status, Owner, Kategorie, Tags, Projektstatus sowie „meine Kunden“ und „archiviert“.
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
- [ ] Owner-Übergabe ist vollständig atomar und erzeugt Activities pro betroffener Entität.
- [ ] Parallele Übergabe und Bearbeitung führt zu 409 statt Teilzustand.
- [ ] Archivierte Kunden sind standardmäßig ausgeblendet, aber bewusst filterbar.
- [ ] Suche besitzt realistischen Query-Plan und Pagination ist deterministisch.

## Rollback

Neue Toolbar/Route kann ohne Schemaänderung ausgeblendet werden; Kundenakte aus Ordner 04 bleibt
nutzbar.
