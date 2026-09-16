# Ordner 15c — Onboarding-Abschluss und Termin

> **Status:** offen · **Abhängigkeiten:** 08, 13, 15b · **Aufwand:** 2–3 Tage · **Reviewziel:** 50–70 Dateien

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
- Abhaken durch den Bogen schreibt dieselbe Herkunft wie ein Klick des Kunden (`done_by_side = customer`)
  und ist in der Timeline unterscheidbar.
- Der Buchungslink ist eine Eigenschaft des Mitarbeiters, nicht des Kunden. Der Kunde sieht den Link
  des für ihn zuständigen Mitarbeiters.
- Externe Buchungstools werden erst nach einem Klick geladen, nie beim Seitenaufruf.
- „Onboarding abgeschlossen" ist kein neues Feld: es gilt, sobald die Projektphase über `onboarding`
  hinaus ist.

## Merge-Gate

- [ ] Absenden hakt genau die zugeordneten Aufgaben ab, keine weiteren; Test über die Zuordnungstabelle.
- [ ] Bereits erledigte oder intern liegende Aufgaben bleiben unangetastet.
- [ ] Ohne Bogen verhält sich das Portal-Dashboard unverändert (Regressionstest).
- [ ] Fortschritt im Dashboard und im Formular stammen aus derselben Funktion.
- [ ] Ohne konfigurierten Buchungslink erscheint keine tote Karte, sondern ein Kontakthinweis.
- [ ] Kein Drittanbieter-Skript wird geladen, bevor der Kunde die Karte aktiv öffnet (Netzwerktest).
- [ ] Der Kunde sieht den Link des Projekt-Owners, ersatzweise des Kunden-Owners (Test mit zwei Mitarbeitern).
- [ ] Mitglied ohne `members.manage` kann nur den eigenen Buchungslink ändern.

## Rollback

Terminkarte über Feature-Flag ausblenden und die Aufgaben-Zuordnung auf eine leere Tabelle setzen.
Bögen, Aufgaben und Dashboard bleiben funktionsfähig.
