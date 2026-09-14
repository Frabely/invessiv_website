# Task 02a — Geteilte Listen-Komponenten

> **Merge-Einheit:** Ordner 05 · **Branch:** `feat/crm-kundenliste-und-zuweisung`
> **Aufwand:** M · **Abhängigkeiten:** keine (kann parallel zu Task 01 und 02 laufen)
> **Migration:** keine

Der Umzug bleibt rein mechanisch: nur Bausteine mit mindestens zwei tatsächlichen Nutzern werden
geteilt, bestehende Lead-Tests ändern ausschließlich Importpfade, und keine CRM-Fachlogik wandert
nach `shared`.

## Context

Die Kundenliste ab Task 03 braucht dieselben Bausteine, die die Leads-Oberfläche längst hat:
Tabelle, Pagination, Sortier-Header, Suchfeld, Mehrfachauswahl, Facettenfilter, leerer Zustand,
Timeline. Der ursprüngliche Plan sah vor, sie zu kopieren — sieben Komponenten doppelt, die über die
Zeit auseinanderlaufen („die Leads-Tabelle hat den Fix bekommen, die Kundentabelle nicht").

Dieser Task hebt die generischen Teile vorher nach `components/workspace/shared/`. Der Zeitpunkt ist
bewusst gewählt: Solange die Leads-Seite der **einzige** Aufrufer ist, ist der Umzug risikoarm und
sofort verifizierbar — die bestehenden Tests müssen unverändert grün bleiben. Nach Task 03 wäre es
ein Refactoring über zwei Bereiche.

Gleichzeitig wird der Facettenfilter mehrfachauswahlfähig gemacht. Task 30 braucht das für Status
und Tags; heute kennt `LeadFacetFilter` nur `activeValue: string | undefined`
(`lead-facet-filter.tsx:9`), also genau einen Wert.

**Reines Refactoring.** Kein neues Verhalten in der Leads-Oberfläche, keine neue Funktion. Der Task
existiert getrennt, damit der Umzug isoliert reviewbar ist und nicht in einem Feature-PR untergeht.

## Entscheidungen

> **Ersetzt (13.09.2026):** Ziel und Zeitpunkt des Umzugs sind durch Ordner 03d neu entschieden — Hybrid aus
> `packages/ui` (app-neutrale Grundbausteine) und `components/workspace/shared/` (URL-/Dictionary-gebundene Teile), vor
> Ordner 04. Siehe `../03d-geteilte-ui-bausteine/README.md`. Die Zeilen „Ziel" und „Warum nicht ui" gelten nicht mehr.

| Bereich             | Entscheidung                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Ziel                | `apps/workspace/src/components/workspace/shared/` — app-intern geteilt, **nicht** `packages/ui`                       |
| Warum nicht ui      | Die Komponenten hängen an Workspace-Konventionen (URL-State, Dictionary-Shapes). `packages/ui` bleibt app-neutral     |
| Schnitt             | Umgezogen wird nur, was wirklich generisch ist. Lead-spezifische Badges und Zeilen bleiben, wo sie sind               |
| Texte               | Alle Beschriftungen kommen als Props. Keine Dictionary-Importe in geteilten Komponenten                               |
| Mehrfachauswahl     | `activeValues: readonly string[]` statt `activeValue`. Die Leads-Seite übergibt ein Array mit null oder einem Eintrag |
| Rückwärtskompatibel | Die Leads-Oberfläche verhält sich unverändert — Single-Select bleibt Single-Select, nur die Datenform ist breiter     |
| Timeline            | Wird generisch: Einträge, Typ-Symbole und Beschriftungen als Props, keine Annahme über Lead oder Kunde                |
| Nicht enthalten     | Kein visuelles Redesign. Wer die Optik ändern will, macht das in einem eigenen PR                                     |

## Umzugsliste

```txt
von components/workspace/leads/…                 nach components/workspace/shared/…

table/sortable-header/                        →  table/sortable-header/
table/leads-pagination/                       →  table/list-pagination/
table/leads-empty-state/                      →  table/list-empty-state/
table/leads-table-selection-provider/         →  table/list-selection-provider/
table/leads-table-select-all-checkbox/        →  table/list-select-all-checkbox/
toolbar/lead-search-field/                    →  toolbar/list-search-field/
toolbar/lead-facet-filter/                    →  toolbar/facet-filter/          + Mehrfachauswahl
detail/lead-detail-activities/                →  activity/activity-timeline/    generisch

bleibt, wo es ist: lead-status-badge, lead-source-badge, lead-category-badge,
lead-score-bar, lead-social-profiles, improvements-list-editor, leads-table-row
```

## Tickets

### CRM-02a-T1 — Generische Tabellen-Bausteine

- **Files:** `components/workspace/shared/table/**`, Importe in `components/workspace/leads/table/**`
- **Skills:** `frontend-design`, `accessibility`, `best-practices`
- **Inhalt:**
  - Fünf Komponenten umziehen, Props auf Beschriftungen als Eingaben umstellen
  - Barrel `shared/table/index.ts`
  - Keine Verhaltensänderung, keine Änderung an den CSS-Modulen außer umbenannten Klassen
- **Akzeptanz:**
  - **Die bestehenden Tests der Leads-Tabelle bleiben inhaltlich unverändert und grün** — angepasst
    wird ausschließlich der Importpfad
  - Sortierung, Seitenwechsel, Mehrfachauswahl und Alle-auswählen verhalten sich identisch
  - Kein Verweis mehr auf die alten Pfade

### CRM-02a-T2 — Suchfeld und Facettenfilter mit Mehrfachauswahl

- **Files:** `components/workspace/shared/toolbar/**`, `components/workspace/leads/toolbar/**`
- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:**
  - `FacetFilter` nimmt `activeValues: readonly string[]` und meldet Änderungen als Array zurück
  - Neue Prop `selectionMode: "single" | "multiple"`; die Leads-Seite nutzt `"single"`
  - Bei `"multiple"`: Chips schalten einzeln um, „Alle" leert die Auswahl,
    `aria-pressed` je Chip, Anzahl aktiver Werte über eine Live-Region
  - Suchfeld mit Verzögerung und Löschen-Schaltfläche, Verzögerungsdauer als Prop
- **Akzeptanz:**
  - Alle bestehenden Filter-Tests der Leads-Seite unverändert grün
  - Komponententest für `"multiple"`: zwei Werte auswählen, einen entfernen, alle leeren
  - Vollständig per Tastatur bedienbar, sichtbarer Fokus in Dark und Light

### CRM-02a-T3 — Generische Timeline

- **Files:** `components/workspace/shared/activity/activity-timeline/**`,
  `components/workspace/leads/detail/lead-detail-panel/lead-detail-panel.tsx`
- **Skills:** `frontend-design`, `accessibility`
- **Inhalt:**
  - Einträge, Typ-Symbole, Beschriftungen und Datumsformatierung als Props
  - Tagesweise Gruppierung, relative Zeitangabe mit genauem Zeitpunkt im `title`-Attribut
  - Metadaten werden über übergebene Type-Wächter geprüft, nicht blind umgedeutet — das bestehende
    Muster aus `lead-detail-activities` bleibt erhalten
  - Das Lead-Detail-Panel übergibt seine bisherigen Texte und Symbole
- **Akzeptanz:**
  - Die Lead-Detailansicht sieht unverändert aus (Screenshot im PR)
  - Bestehende Tests unverändert grün
  - Ein unbekannter Aktivitätstyp führt zu einer verständlichen Zeile, nicht zu einem Absturz

### CRM-02a-T4 — Scope-Regeldatei

- **Files:** `components/workspace/shared/AGENTS.md`, Root-`AGENTS.md` (Index-Tabelle)
- **Skills:** `best-practices`
- **Inhalt:** Regeln auf Deutsch: keine Dictionary-Importe, keine Domänenannahmen, alle Texte als
  Props, jede Komponente muss aus mindestens zwei Bereichen nutzbar sein
- **Akzeptanz:** Der Scope steht in der Index-Tabelle der Root-`AGENTS.md`

## Deploy-Sicherheit

1. **Live sichtbar:** nichts. Die Leads-Oberfläche sieht und verhält sich exakt wie vorher.
2. **Bricht nichts:** Das größte Risiko ist ein übersehener Import — abgesichert dadurch, dass die
   alten Ordner vollständig entfernt werden. Bliebe ein Verweis zurück, bricht der Typecheck, nicht
   erst die Produktion. Die unveränderten Bestandstests sind der Beleg für Verhaltensgleichheit.
3. **Offen:** nichts. Die Mehrfachauswahl ist vorhanden, wird aber erst in Task 30 benutzt — bis
   dahin ruft sie niemand mit `"multiple"` auf.

## End-to-End-Akzeptanz

1. Die Leads-Liste sortiert, blättert, filtert, sucht und wählt aus wie vorher.
2. Die Lead-Detailansicht zeigt dieselbe Timeline.
3. Kein Codepfad verweist auf die alten Komponentenpfade.
4. Der Facettenfilter beherrscht Mehrfachauswahl, nachgewiesen durch einen Komponententest.
5. Dark und Light unverändert, Tastaturbedienung vollständig.
6. `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm build:workspace` grün.
