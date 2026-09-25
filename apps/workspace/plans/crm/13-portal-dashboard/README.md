# Ordner 13 — Portal-Dashboard

> **Status:** offen · **Abhängigkeiten:** 07, 08, 12b · **Aufwand:** 3–4 Tage · **Reviewziel:** 60–100 Dateien

> **Neuzuschnitt 23.09.2026:** Auth, Zugriffsfilter, Shell, Navigation und Flag kommen aus Ordner 12a; Portalrollen
> sind je Kontakt konfigurierbar. Dieses Dashboard prüft deshalb Portal-Permissions statt „jeder Kontakt darf alles“.

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`21-portal-dashboard.md`](./21-portal-dashboard.md) — Portal-Permissions, Portalqueries, Projektstatus,
  Kundenaufgaben, Abschluss durch den Kunden, Vorschau-Erweiterung und UI.

Das Kundenportal zeigt freigegebene Projektinformationen und kundenseitige Aufgaben. Kontakte mit
`portal.tasks.complete` können Kundenaufgaben abschließen. Das Dashboard ist die Startseite des Portals; spätere
Ordner ergänzen eigene Karten (Dateien 15, Leistungsanfragen 13a, Nachrichten 18, Stunden 20), jeweils an ihre
Permission gebunden.

## Inhalte und Regeln

- Neue Portal-Permissions: `portal.projects.read`, `portal.tasks.read`, `portal.tasks.complete`; `portal_standard`
  wird ergänzt. Jeder Block erscheint nur mit seiner Permission und fehlt sonst vollständig.
- Aktive/pausierte Projekte mit Phase, nächstem Schritt, Termin und explizit freigegebenem Preview-Link; keine
  Budgets, Stundensätze, Preise oder Owner.
- Kundenaufgaben nur mit `action_side = customer AND visible_to_customer = true`; Filter und Firmenkontext zwingend in
  der Query über `portalAccessCondition`.
- Abschluss speichert Portalmitgliedschaft und Zeitpunkt (additive Spalte), erzeugt eine Activity; die interne
  Benachrichtigung folgt mit Ordner 20c.
- Bereits erledigte Aufgaben bleiben als Verlauf sichtbar; Wiederöffnen nur intern.
- Der Firmenkontext steht im Pfad; clientseitige Caches sind nach `customerId` geschlüsselt, damit ein Firmenwechsel
  nie Daten der vorherigen Firma zeigt.
- Die Portalvorschau (Task 20) zeigt Projekte und Aufgaben über dieselben Query-Handler und DTOs wie das Portal.

## Merge-Gate

- [ ] Portal-DTO und HTML enthalten keinerlei interne Finanz-, Notiz- oder Ownerdaten.
- [ ] Unsichtbare oder interne Aufgaben sind auch über direkte ID nicht abrufbar (404).
- [ ] Ohne `portal.tasks.complete` kein Abhaken (Endpunkt 404, kein Bedienelement); fremde Firma 404.
- [ ] Ohne `portal.projects.read` bzw. `portal.tasks.read` fehlt der jeweilige Block vollständig.
- [ ] Doppelklick/Retry schließt genau einmal ab.
- [ ] Zwei Firmen in zwei Tabs zeigen nie gemischte Daten.
- [ ] Responsive, Keyboard, Fokus, DE/EN sowie Dark/Light sind geprüft.

## Rollback

Die drei Portal-Permissions aus `portal_standard` und eigenen Portalrollen entfernen: Blöcke und Endpunkte
verschwinden. Sichere Portalidentität und Minimalportal aus Ordner 12a/12b bleiben nutzbar.
