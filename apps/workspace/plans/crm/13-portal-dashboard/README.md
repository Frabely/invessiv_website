# Ordner 13 — Portal-Dashboard

> **Status:** offen · **Abhängigkeiten:** 07, 08, 12 · **Aufwand:** 3–4 Tage · **Reviewziel:** 60–100 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`21-portal-dashboard.md`](./21-portal-dashboard.md) — Portalqueries, Projektstatus,
  Kundenaufgaben, Vorschau und UI.

Das Kundenportal zeigt freigegebene Projektinformationen und kundenseitige Aufgaben. Jeder aktive
Kontakt einer Firma kann Kundenaufgaben abschließen. Der Dashboardflow ist nach Merge vollständig;
Dateien, Feedback und Chat erscheinen erst in ihren späteren Ordnern.

## Inhalte und Regeln

- Aktive/pausierte Projekte mit Phase, nächstem Schritt, Termin und explizit freigegebenem
  Preview-Link; keine Budgets oder Stundensätze.
- Kundenaufgaben nur mit `visible_to_customer = true`; Filter liegt zwingend in der DB-Query.
- Abschluss speichert Portalmitglied und Zeitpunkt, erzeugt Activity und interne Notification.
- Bereits erledigte Aufgaben bleiben als Verlauf sichtbar; Wiederöffnen nur intern.
- Firmenwechsler aus Ordner 12 aktualisiert alle Module ohne Daten des vorherigen Kunden im Cache.
- Bereiche ohne Inhalt werden nicht gerendert; Portalvorschau zeigt exakt dieselben DTOs wie der
  echte Portalnutzer.

## Merge-Gate

- [ ] PortalDTO und HTML enthalten keinerlei interne Finanz-, Notiz- oder Ownerdaten.
- [ ] Unsichtbare Aufgaben sind auch über direkte ID nicht abrufbar.
- [ ] Jeder Firmenkontakt kann Kundenaufgabe erledigen; fremde Firma erhält 404.
- [ ] Doppelklick/Retry schließt genau einmal ab.
- [ ] Firmenwechsel leert vorherige Querydaten und Browsercache-Schlüssel.
- [ ] Responsive, Keyboard, Fokus, DE/EN sowie Dark/Light sind geprüft.

## Rollback

Dashboardmodule per Flag ausblenden; sichere Portalidentität und Minimalportal aus Ordner 12 bleiben
nutzbar.
