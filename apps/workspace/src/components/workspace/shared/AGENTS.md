# AGENTS.md — Geteilte Workspace-Komponenten

Gilt für `src/components/workspace/shared/` und alle Unterordner. Ergänzt die Repo-Root-`AGENTS.md` und die
app-weiten Regeln aus `apps/workspace/AGENTS.md`.

## Zweck

Dieser Scope enthält wiederverwendbare UI-Bausteine, die an Workspace-Infrastruktur wie `next/link`, URL-State oder
Workspace-seitige Darstellung gebunden sind und deshalb nicht nach `packages/ui` gehören. Jeder Baustein muss aus
mindestens zwei fachlichen Workspace-Bereichen nutzbar sein.

## Verbindliche Regeln

- Komponenten bleiben fach- und domänenneutral. Namen, Props, Zustände und Styles enthalten keine Annahmen über
  Leads, Kunden, Projekte, Mitglieder oder andere einzelne Bereiche.
- Keine Dictionary-Importe. Alle sichtbaren Texte, Labels, Beschreibungen und Statusmeldungen werden vom jeweiligen
  Nutzer als Props übergeben.
- Link- und URL-Bindung an Workspace-Infrastruktur ist in diesem Scope erlaubt. Routen entstehen weiterhin nur aus
  den zentralen Route-Konstanten und Pfadhelfern; freie zusammengesetzte URL-Literale bleiben verboten.
- Fachlogik, Berechtigungsentscheidungen, Analytics-Events und API-Aufrufe bleiben beim konsumierenden Bereich.
- Neue Bausteine entstehen erst bei nachgewiesener Wiederverwendung in mindestens zwei Bereichen. Ein nur einmal
  genutzter Baustein bleibt im fachlichen Scope.
- Styling liegt co-located in `*.module.css`; Zustände werden über `data-*`-Attribute ausgedrückt. Globale
  Komponentenklassen und Inline-Styles sind nicht zulässig.
- Interaktive Bausteine erhalten co-locatete Tests für ihre zentralen Tastatur-, Fokus- und URL-State-Interaktionen.
- Exportierte Typen, Konstanten und Patterns folgen der projektweiten Export-Regel und liegen vor ihrer Nutzung in
  `apps/workspace/src/common` oder `packages/common`. Komponentenspezifische `*Props`-Typen dürfen bei der Komponente
  exportiert werden.

## Laufende Bereinigung in Ordner 03d

Die im CRM-Plan `03d-geteilte-ui-bausteine` ausdrücklich benannten Altbausteine dürfen bis zu ihrem jeweiligen
Umzugsschritt vorübergehend in diesem Scope bleiben. Sie erhalten keine neuen fachlichen Abhängigkeiten. Nach Task
`02e-10` gelten die Regeln dieses Scopes ohne Übergangsausnahme.
