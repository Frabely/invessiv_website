# Task 30a — Listenkopf und Filterpanel abstrahieren

> **Merge-Einheit:** Ordner 22a · **Branch:** `feat/crm-kundenorganisation-und-uebergabe`
> **Aufwand:** M · **Abhängigkeiten:** Task 30 (Filter und Suche), Ordner 08 (Aufgabenübersicht), Leads-Übersicht
> **Migration:** keine

- Leads, Aufgaben und später die Kundenliste bauen ihren Listenkopf heute **jeweils einzeln**: Titel, ein-/
  ausklappbares Filterpanel (mobil standardmäßig zu), „Filter zurücksetzen“, Suchfeld und Facetten. Aus dem Aufgaben-
  Umbau (Ordner 08, Task 11a-1) ist bewusst eine zweite Kopie der Panel-Logik entstanden, damit der Leads-Code dort
  unangetastet blieb.
- Dieser Task baut daraus **einen abstrakteren, domänenneutralen Listenkopf** und stellt Leads und Aufgaben darauf um.

## Ausgangslage (zu vereinheitlichen)

| Baustein                        | Leads                                                                     | Aufgaben                                            |
| ------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- |
| Panel ein-/ausklappen, mobil zu | inline in `leads-page-header.tsx` (`matchMedia` + `useSyncExternalStore`) | `hooks/workspace/use-collapsible-filter-panel.ts`   |
| Zurücksetzen                    | eigene Schaltfläche im Header                                             | eigene Schaltfläche in `tasks-overview-toolbar.tsx` |
| Facetten                        | `leads/toolbar/<x>-filter/`                                               | `crm/tasks/overview/toolbar/<x>-filter/`            |
| Badge-Tones je Facette          | `common/constants/leads/badges/*-tones.ts`                                | `common/constants/crm/badges/task-*-badge-tones.ts` |
| Panel-CSS                       | `leads-page-header.module.css`                                            | `tasks-overview-toolbar.module.css`                 |

## Ziel

- Ein Baustein `ListFilterHeader` (Ort: `components/workspace/shared/toolbar/`) mit Slots für Suche, Primärfilter und
  Facettengruppen, eingebautem Zurücksetzen und Auf-/Zuklappen. Er kennt weder Leads noch Aufgaben.
- Der Hook `useCollapsibleFilterPanel` wird zur einzigen Quelle; die Kopie in `leads-page-header.tsx` entfällt.
- Eine **Badge-Tone-Registry** (Wert → Tone/Icon je Facette) mit gemeinsamem Muster, statt je Domäne eigener
  Konstantendateien mit gleichem Aufbau.
- Die Anzeigevariante „nur Select“ von `FacetFilter` (`FacetFilterDisplay`) bleibt Teil des Bausteins.

## Akzeptanz

- Leads und Aufgaben nutzen denselben Kopf; ihr sichtbares Verhalten bleibt unverändert (bestehende Tests grün,
  Screenshots vorher/nachher in Dark und Light, mobil).
- Keine doppelte Panel-, Reset- oder Media-Query-Logik mehr im Repository.
- Ein weiteres Listen-Feature (Kundenliste, Renewals) bindet den Kopf mit Slots ein, ohne eigenes Panel-CSS.
