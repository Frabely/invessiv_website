# Task 39 — Web-UI-Anpassung nach dem CRM-Umbau

> **Merge-Einheit:** Ordner 23 · **Branch:** `feat/web-shared-ui-polish`
> **Aufwand:** M (2–3 Tage) · **Abhängigkeiten:** alle CRM-Ordner 01 bis 22 gemerged
> **Migration:** keine · **Changeset:** vor Beginn anhand der tatsächlichen Web-Nutzer neu schneiden

## Abgrenzung

Dieser Task wird **erst am Ende des gesamten CRM-Umbaus** umgesetzt. Die früheren Einheiten zentralisieren die
Bausteine ohne visuelle Veränderung. Erst nach fachlicher Umsetzung, Produktivrollout, Backup-Nachweis und
Activity-Cleanup folgt dieser eigenständige Web-Branch und PR.

Ziel ist keine Angleichung der Website an die Workspace-Optik. `packages/ui` bleibt app-neutral; die Website erhält
eine eigenständige, zur Invessiv-Marke und zu ihren Conversion-Flows passende Ausprägung über Web-seitige Tokens,
co-locatete Wrapper-Styles und klar begründete Opt-in-Props.

## Betroffene verschobene Bausteine

Der Abschluss umfasst ausnahmslos alle Komponenten, die im CRM-Ordner 03d aus den Apps nach `packages/ui` verschoben
werden und Nutzer in `apps/web` besitzen:

- `ButtonControl`, `ButtonLink`, `PrimaryCtaButton`, `PrimaryCtaLink`
- `FormRequiredMarker`, `FormFieldLabel`, `FormField`
- `FormStatus`, `FormActions`

`ContactConsentField` bleibt als fachlicher Web-Baustein app-lokal, wird aber als Nutzer der geteilten Formularbasis in
die visuelle Prüfung einbezogen. Weitere `packages/ui`-Komponenten gehören nur dann in diesen Task, wenn sie am Ende des
CRM-Umbaus produktiv in `apps/web` verwendet werden; die Nutzerliste wird deshalb vor Beginn erneut per Suche erhoben.

## Betroffene Web-Oberflächen

- Startseite: Hero, Prozess, Leistungen, Referenzen und Kontaktformular
- Landingpage: Audience-Detail-Panel und Pricing
- LinkedIn-Post-Generator: Hero, Formular, Limit-, Ergebnis- und Erfolgszustände
- Referenzen-Abschluss-CTA, Site-Header und gemeinsame Success-Page
- Formularfelder für Identität, Nachricht, Projektumfang und Einwilligung

## Vorgehen

1. Nach Merge von Ordner 22 alle produktiven Web-Nutzer der oben genannten Exporte erneut inventarisieren und das
   Changeset in kleine, reviewbare Schritte schneiden.
2. Vor der Umsetzung Ist-Screenshots für Mobile, Tablet und Desktop sowie Dark und Light erstellen.
3. Eine Web-spezifische visuelle Richtung für Buttons, Felder, Statusmeldungen und Aktionsleisten festlegen. Bestehende
   Theme-Tokens zuerst verwenden; neue Tokens zentral in der Web-App definieren.
4. App-neutrale Unterschiede als Props oder Tokens modellieren. Keine Marketingannahmen, Dictionaries, Routen oder
   Analytics in `packages/ui` verschieben.
5. Alle betroffenen Oberflächen gemeinsam prüfen, damit derselbe Baustein nicht je Seite widersprüchlich gestaltet
   wird.

## Unveränderliche Grenzen

- CTA-Ziele, Tracking-Events, Formvalidierung, Submit-Verhalten und bestehende Fehler-/Lade-/Erfolgszustände bleiben
  funktional erhalten.
- Nutzersichtbare Texte werden nur geändert, wenn der Web-PR den Copy-Scope ausdrücklich aufnimmt; dann DE und EN
  parallel in den Dictionaries sowie mit dem verpflichtenden `copywriting`-Skill.
- Keine Workspace-spezifischen Styles oder Abhängigkeiten in `packages/ui`.
- Kein globales Komponenten-CSS; Web-spezifische Gestaltung erfolgt über zentrale Tokens oder co-locatete CSS Modules.
- WCAG 2.2 AA, sichtbare Fokuszustände und Reduced-Motion-/Responsive-Anforderungen bleiben verbindlich.

## Akzeptanz

- Alle produktiven Web-Nutzer der neun verschobenen Exporte sind inventarisiert und visuell geprüft.
- Buttons, Formularfelder, Statusmeldungen und Aktionsleisten bilden in Dark und Light ein konsistentes, bewusstes
  Web-System, ohne die Workspace-Darstellung zu verändern.
- Mobile 360/390 px, Tablet und Desktop sind mit Vorher-/Nachher-Screenshots dokumentiert.
- Kontaktformular und LinkedIn-Generator bestehen Tastatur-, Fokus-, Pflichtfeld-, Disabled-, Lade-, Erfolgs- und
  Submit-Fehler-Smokes; alle CTAs behalten Ziel und Tracking.
- Relevante Komponenten- und E2E-Tests, `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` sowie
  `pnpm --filter @invessiv/web build` sind grün.
- PR dokumentiert Scope, Designentscheidung, Screenshots, Testplan, Security/Privacy-Auswirkung und Rollback.

## Deploy-Sicherheit

1. **Live sichtbar:** ausschließlich die bewusst angepasste Web-Darstellung.
2. **Bricht nichts:** Package-APIs sind seit Ordner 03d produktiv im Einsatz; der Task ändert nur Web-Tokens,
   Web-Wrapper und ausdrücklich benötigte app-neutrale Opt-ins.
3. **Offen:** nichts. Nach Merge dieses Tasks ist der gesamte CRM-Plan einschließlich Web-Nachlauf abgeschlossen.

## Rollback

Reiner Code-Revert des eigenständigen Web-PRs. Die Zentralisierung aus Ordner 03d und alle CRM-Einheiten bleiben
bestehen; ein Rollback stellt nur die vorherigen Web-Tokens und Web-spezifischen Styles wieder her.
