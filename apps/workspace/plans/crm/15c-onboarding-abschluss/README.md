# Ordner 15c — Onboarding-Abschluss und Termin

> **Status:** offen · **Abhängigkeiten:** 08, 13, 15b · **Aufwand:** 2–3 Tage · **Reviewziel:** 50–70 Dateien

> **Hinweis Neuplanung Ordner 08 (21.09.2026):** Hängt an den zurückgestellten Aufgaben-Vorlagen (Task 12); siehe
> Kopf von `46-aufgaben-verzahnung-und-fortschritt.md`.

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`46-aufgaben-verzahnung-und-fortschritt.md`](./46-aufgaben-verzahnung-und-fortschritt.md) —
  Absenden hakt die zugehörigen Kundenaufgaben ab, Bogen erscheint im Portal-Dashboard.
- [`47-onboarding-termin.md`](./47-onboarding-termin.md) — Buchungslink je Mitarbeiter, Terminkarte
  im Portal nach Abschluss.

Nach dem Merge ist der Onboarding-Ablauf durchgängig: Einladung → Aufgaben und Bogen im Dashboard →
Bogen ausfüllen und absenden → zugehörige Aufgaben sind erledigt → Termin beim zuständigen
Mitarbeiter buchen.

## Regeln

- Der Bogen ersetzt keine Aufgabe. Er erledigt die Aufgaben, die er inhaltlich abdeckt, über eine
  explizite Zuordnung im Code — nicht über Namensähnlichkeit.
- Abhaken durch den Bogen schreibt dieselbe Herkunft wie ein Klick des Kunden (`completed_by_portal_membership_id`, Task 21)
  und ist in der Timeline unterscheidbar.
- Der Buchungslink ist eine Eigenschaft des Mitarbeiters, nicht des Kunden. Der Kunde sieht den Link
  des für ihn zuständigen Mitarbeiters.
- Externe Buchungstools werden erst nach einem Klick geladen, nie beim Seitenaufruf.
- „Onboarding abgeschlossen" ist kein neues Feld: es gilt, sobald die Projektphase über `onboarding`
  hinaus ist.

## Portal-Widget (aus Ordner 13)

Das Dashboard-Widget `onboarding` (Registry `PORTAL_WIDGET_LAYOUT`, seit Ordner 15b mit echtem Fortschritt) bekommt
hier den Termin und sein Ende: Nach dem Absenden zeigt es die Terminbuchung; sobald die Projektphase über
`onboarding` hinaus ist, **verschwindet das Widget** (`onlyWithContent`). Die Karten aus Task 46/47 sind Zustände
dieses einen Widgets, keine zusätzlichen Dashboard-Karten.

## Merge-Gate

- [ ] Portal-Widget `onboarding` vollständig echt (Registry ohne Mock-Anteil): Fortschritt, Termin, verschwindet nach
      Abschluss; keine zusätzliche Karte außerhalb der Registry.
- [ ] Absenden hakt genau die zugeordneten Aufgaben ab, keine weiteren; Test über die Zuordnungstabelle.
- [ ] Bereits erledigte oder intern liegende Aufgaben bleiben unangetastet.
- [ ] Ohne Bogen verhält sich das Portal-Dashboard unverändert (Regressionstest).
- [ ] Fortschritt im Dashboard und im Formular stammen aus derselben Funktion.
- [ ] Ohne konfigurierten Buchungslink erscheint keine tote Karte, sondern ein Kontakthinweis.
- [ ] Kein Drittanbieter-Skript wird geladen, bevor der Kunde die Karte aktiv öffnet (Netzwerktest).
- [ ] Der Kunde sieht den Link des Projekt-Owners, ersatzweise des bei der Kundenanlage vorhandenen technischen
      Kunden-Owners (Test mit zwei Mitarbeitern). Ein späterer Customer-Owner-Wechsel in Ordner 20a verändert diesen
      Fallback nur für künftige Auflösungen, nicht den Projekt-Owner.
- [ ] Mitglied ohne `members.manage` kann nur den eigenen Buchungslink ändern.

## Rollback

Terminkarte über Feature-Flag ausblenden und die Aufgaben-Zuordnung auf eine leere Tabelle setzen.
Bögen, Aufgaben und Dashboard bleiben funktionsfähig.
