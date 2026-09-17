# Task 42a — Cockpit um Projektwerte erweitern

> **Merge-Einheit:** Ordner 07 · **Branch:** `feat/crm-projekte`  
> **Aufwand:** XS · **Abhängigkeiten:** Task 42, Task 08c  
> **Migration:** keine

Die bestehende Cockpit-Aggregation aus Task 08b/08c wird um die aus `project_services` berechneten
Kunden- und Projektwerte erweitert. Es entsteht ausdrücklich keine zweite Kundendarstellung und
keine eigene Berechnungsfunktion.

- Werte werden nur mit `project_services.read` in Liste und Dialog geliefert und gerendert.
- Der Kunden-Cockpit-Dialog zeigt dieselbe Summe wie Kundenakte und Kundenliste; Projektwerte
  stammen aus demselben Mapping-Pfad wie die Projektkarte.
- Ohne Recht bleiben die bisherigen Cockpit-Sektionen unverändert nutzbar, die Wertsektion fehlt
  vollständig.

## Akzeptanz

- [ ] Regressionstest: Cockpit, Kundenakte, Kundenliste und Projektkarte stimmen für denselben
      Datenbestand überein.
- [ ] Es gibt keine zweite Kunden-Detailroute und keine doppelte Wertberechnung.
- [ ] Rechtefall und DE/EN-Texte sind getestet.
