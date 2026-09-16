# Ordner 22a — Kundenorganisation und Zuständigkeitsübergabe

> **Status:** offen · **Abhängigkeit:** Ordner 22 · **Aufwand:** 4–6 Tage · **Reviewziel:** 70–110 Dateien

## Ziel und Einordnung

Diese bewusst späte Merge-Einheit ergänzt die Organisationsfunktionen erst, wenn Kunden,
Projekte, Aufgaben, Renewals, Portal und Kommunikation vollständig modelliert sind. Die individuellen
Zuweisungen entstehen zuvor jeweils mit ihrer Domäne. Dadurch werden
Filterachsen und die exhaustive Zuständigkeitsübergabe einmal vollständig gebaut, statt in mehreren
Zwischenständen erweitert zu werden.

## Enthaltene Pläne

- [`30-filter-und-suche.md`](./30-filter-und-suche.md) — Suche, Facettenfilter und persönliche Ansichten.
- [`07-tags.md`](./07-tags.md) — normalisierte Kundentags samt Zuweisung und Listenanzeige.
- [`02f-zustaendigkeitsuebergabe.md`](./02f-zustaendigkeitsuebergabe.md) — atomare Übergabe aller zu diesem Zeitpunkt
  vorhandenen offenen Zuständigkeiten.
- Tags aus Task 07 werden zusammen mit Suche und Filtern umgesetzt, weil sie vorher keine ausreichend nützliche
  Ordnungsachse bilden.

## Merge-Gate

- [ ] Suche und Filter berücksichtigen die bis Ordner 22 vorhandenen fachlichen Achsen.
- [ ] Liste und Count verwenden dieselbe Querydefinition und einen realistischen Queryplan.
- [ ] Tags sind pflegbar und als Mehrfachfilter nutzbar.
- [ ] Die Ownership-Registry enthält jeden bis dahin besitzbaren Entitätstyp.
- [ ] Eine globale Zuständigkeitsübergabe umfasst Kunden, Projekte, Aufgaben, Renewals und Chatverantwortung atomar
      und erzeugt keinen Teilzustand.
- [ ] Parallele Bearbeitung führt zu einem Konflikt statt zu still überschriebenen Daten.

## Rollback

Toolbar, Suche und Übergabe-UI können ausgeblendet werden. Die fachlichen Datensätze und ihre
bestehenden Owner-Zuordnungen bleiben unverändert nutzbar.
