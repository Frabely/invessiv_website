# Planregeln — Grundlage für einen späteren Plan-Skill

Gesammelt bei der Planung des Portal-Dashboards (Ordner 13, 26.09.2026). Allgemeingültig formuliert.

1. **Goal zuerst.** Das Ziel zu Beginn als Goal festhalten und im Plan ganz oben führen.
2. **Plan kann veraltet sein.** Bestehende Pläne als möglicherweise veraltet behandeln; jede Aussage gegen den Code
   verifizieren (existiert die Komponente, der Handler, die Spalte wirklich?).
3. **Vom internen Pendant ausgehen.** Für Kundensichten alle implementierten **und** geplanten Features der internen
   Entsprechung (z. B. Mitarbeiter-Cockpit) als Ausgangspunkt nehmen und je Feature kritisch fragen, ob und was der
   Kunde sieht und wie er damit interagiert.
4. **Feature-weise fragen.** Fragen je Feature stellen, die Empfehlung zuerst, Widersprüche im Plan offen ansprechen.
5. **Wiederverwenden statt kopieren.** Vorhandene Komponenten nutzen; wird eine Komponente 1:1 an zweiter Stelle
   gebraucht, wird sie ausgelagert (`packages/ui` bzw. `common`), nie kopiert.
6. **Präventiv prüfen.** Code-Duplikate, falsche Strukturierung und AGENTS.md-Verstöße schon im Plan verhindern;
   Konflikte mit Regeln vorher klären statt stillschweigend bauen.
7. **Skills benennen.** UI: `impeccable` (passend zum bestehenden Design); Texte: `copywriting`; Designfragen:
   `ui-ux-pro-max`.
8. **Zukünftiges mitdenken.** Noch nicht gebaute Features im Design vorsehen (Mock, klar gekennzeichnet) und in den
   Folge-Einheiten als Merge-Gate verankern, damit am Ende alles tatsächlich landet.
9. **Erweiterungen schätzen.** Erweiterungswünsche (z. B. Widgets verschieben) mit Aufwandsschätzung in Varianten
   beantworten und die Architektur vorbereiten, statt sie sofort zu bauen.
10. **Owner-Prüfzugang.** Einen Zugang vorsehen, mit dem der Owner jeden Kundenbereich sehen und abnehmen kann —
    protokolliert und nicht schreibend.
11. **Wiederverwendbare Rahmen.** Dashboards als Raster mit Wrapper-Widget; Größe und Öffnungsart (Dialog, Vergrößern,
    Dock) sind Registry-Daten, nicht Code je Widget.
12. **Ablage.** Den finalen Umsetzungsplan als `.md` im Plan-Ordner der Einheit ablegen; allgemeine Planregeln in
    `deleteable/` sammeln.
