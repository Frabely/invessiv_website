# Task 42 — Projektwerte in Akte und Listen

> **Merge-Einheit:** Ordner 07 · **Branch:** `feat/crm-projekte`  
> **Aufwand:** S · **Abhängigkeiten:** Task 41  
> **Migration:** keine

## Ziel

Projekt- und Kundenwerte werden ausschließlich aus `project_services` berechnet, nie gespeichert.
Kundenwerte sind die Summe ihrer Projekte; kundenweite Pakete, `customer_packages` und eine
zweite Berechnungsquelle entfallen. `projects.budget_cents` bleibt als klar beschrifteter Planwert
neben dem gebuchten Projektwert bestehen.

Die gemeinsame, reine Berechnung liefert mindestens einmalige, monatlich wiederkehrende und jährlich
wiederkehrende EUR-Cent-Werte. `rate` ist ein Konditionswert und zählt in keine Umsatzsumme.

## Darstellung und Rechte

- Kundenakte, Kundenliste und Projektkarte verwenden denselben Query-/Mapping-Pfad.
- Wertfelder werden nur mit `project_services.read` geliefert. Ohne Recht existieren sie nicht im
  DTO und werden nicht clientseitig ausgeblendet.
- Die UI beschreibt wiederkehrende Werte mit ihrem Intervall; leere Projekte erhalten keinen
  irreführenden Nullwert-Block.

## Akzeptanz

- [ ] Mehrere Projektleistungen und mehrere Projekte eines Kunden ergeben in allen Ansichten exakt
      dieselben Werte.
- [ ] Ein `rate`-Snapshot verändert keine Wertsumme.
- [ ] Ohne Leserecht fehlen Wertfelder serverseitig; fremde Kunden/Projekte bleiben unsichtbar.
- [ ] Planwert und berechneter Projektwert sind eindeutig getrennt beschriftet.
