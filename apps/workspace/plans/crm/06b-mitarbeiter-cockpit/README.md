# Ordner 06b — Mitarbeiter-Cockpit

> **Status:** läuft · **Abhängigkeiten:** 04, 05, 06 · **Aufwand:** 2–3 Tage · **Reviewziel:** 35–60 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan (aktualisiert)**

- [`08b-mitarbeiter-cockpit.md`](./08b-mitarbeiter-cockpit.md) — späterer Dashboard-Umschalter mit
  Kundenansicht für eigene zugewiesene Kunden.
- [`08c-kunden-cockpit-dialog.md`](./08c-kunden-cockpit-dialog.md) — kompakte read-only Kundenansicht
  im Dialog, erreichbar aus Kundenliste und Kundenformular.

Die Kundenansicht zeigt keinen Anfragen- oder Lead-Bereich. Sie öffnet sich per Tabellen-Action oder im
Kundenformular, ohne die Liste zu verlassen oder ungespeicherte Formulareingaben zu verwerfen.

Der aktuelle Stand zeigt ausschließlich Kundenkopf, Status, Zuständigkeit und Primärkontakt. Projekte,
Aufgaben, Chat, Feature-Wünsche, Renewals, Aktivitäten, Herkunfts-Leads und Owner-Wechsel folgen erst
mit ihren jeweiligen CRM-Tasks am selben DTO- und Darstellungspfad.

Der spätere Dashboard-Umschalter verlangt `dashboard.read` und `customers.read`, bietet nur eigene
zugewiesene Kunden an und hält Ansicht, Auswahl und gewählten Kunden im URL-State. Ein Select verwendet
dieselbe Query und dieselbe Kundenansicht; es entsteht keine zweite Detaildarstellung.

**Der Dialog ist die interne Mitarbeitersicht auf genau diesen Kunden — nicht die Kundenportal-Ansicht.**
Er zeigt, was der aufrufende Mitarbeiter laut seinen eigenen Permissions zu diesem Kunden sehen darf.
Das ist bewusst nicht identisch mit dem, was der Kunde später im Kundenportal sieht: interne Daten wie
Preise oder der Pipeline-/Prozessstand einer Anfrage (angefragt/angeboten/beauftragt) bleiben im Dialog
sichtbar, sobald die jeweilige Permission vorliegt — auch wenn der spätere Kundenportal-Bereich genau
diese Felder dem Kunden bewusst nie zeigt (`07d`: „Kein Portalzugriff auf Beträge"). Layout-Bausteine
dürfen wiederverwendet werden, der Dateninhalt aber nicht.

Diese Einheit liegt bewusst vor den Projekten, Aufgaben und dem Kundenchat: Sie macht die bereits bei der Anlage als
technischen Default gesetzte Zuständigkeit und
offene Anfragen sichtbar, bevor weitere, aufwändigere Funktionen entstehen, die diese Sichtbarkeit erst
richtig nötig machen. Dealvolumen-, Aufgaben-, Renewal- und Chat-Widgets ergänzen dieselbe Ansicht später
in Ordner 07d, 08, 11 und 17, ohne dass diese Einheit erneut angefasst wird — sowohl in der Listenübersicht (Task 08b)
als auch im Einzelkunden-Dialog (Task 08c), weil beide dieselbe Datenquelle nutzen.

**Verbindliches Wiederverwendungsprinzip:** Task 08b und Task 08c lesen exakt dieselbe Aggregationsfunktion (z. B.
`getCustomerCockpitSummary`) — die Liste ruft sie für alle zugewiesenen Kunden auf, der Dialog für
genau einen. Jede spätere Anreicherung (Task 42a und Folgeaufgaben in 08, 11, 17) erweitert ausschließlich
diese eine Funktion. Es entsteht **keine** zweite, dialogspezifische Berechnung.

## Fachliche Grenzen

- Keine neue Tabelle, Migration oder API-Route.
- Kein Dealvolumen und keine Pipeline-Werte — die entstehen erst mit dem Paketmodell in Ordner 07d (Task 42a).
- Keine Leads, Website-Submissions oder Anfragen als eigener Dateninhalt.
- Reine Leseansicht: Änderungen an Kunde oder Anfrage laufen weiterhin über die bestehenden Handler.
- Der Einzelkunden-Dialog (Task 08c) ist keine neue Fachlogik, sondern eine zweite Darstellung derselben
  Aggregationsfunktion aus Task 08b.
- Der Dialog ist kein Kundenportal-Vorschaupfad. Er hat keinen Bezug zu einem Portal-Handler oder zu
  `portal.manage`; er läuft ausschließlich über `src/server/workspace/**` mit den ganz normalen
  internen CRM-Permissions des aufrufenden Mitglieds.
- Jede Sektion des Dialogs prüft ihre eigene Permission unabhängig (z. B. `packages.read` für
  Preise/Pipeline). Ohne die Permission fehlt die Sektion vollständig, statt leer oder maskiert
  angezeigt zu werden — dasselbe Muster wie in der Kundenakte und in `packages.read`-Nutzung aus
  Ordner 07d.

## Merge-Gate

- [ ] Ein Mitglied sieht in der Liste (Task 08b) ausschließlich die eigenen zugewiesenen Kunden und deren
      offene Anfragen.
- [ ] `workspace_owner` kann die Sicht eines anderen aktiven Mitglieds einsehen; jedes andere Mitglied
      erhält bei abweichendem Parameter dennoch nur die eigene Liste.
- [ ] Kunden ohne offene Anfrage erscheinen mit Zähler 0, nicht fehlend.
- [ ] Empty-States unterscheiden „keine zugewiesenen Kunden" von „keine offenen Anfragen".
- [ ] Liste und Dialog sind per Tastatur bedienbar und in DE/EN vorhanden; `noindex`/`force-dynamic`
      gesetzt.
- [ ] Der Kunden-Cockpit-Dialog öffnet sich aus Kundenliste, Kundenformular und Lead-Liste identisch und
      zeigt für denselben Kunden dieselben Werte wie die entsprechende Zeile in Task 08b.
- [ ] Der Dialog zeigt bei zwei Mitgliedern mit unterschiedlichen Permissions unterschiedliche Sektionen
      für denselben Kunden — nicht dieselbe Ansicht für alle.
- [ ] Der Dialog läuft nachweislich über `src/server/workspace/**`; kein Import aus oder nach einem
      künftigen `src/server/portal/**`.
- [ ] Die Lead-Liste zeigt den Sprung-Button ausschließlich bei bereits konvertierten Leads
      (`leads.customer_id IS NOT NULL`) und nur mit `customers.read`.
- [ ] Eine Code-Suche bestätigt genau eine Implementierung der Aggregationsfunktion; Liste und Dialog rufen
      dieselbe Funktion auf, keine ist eine Kopie der anderen.

## Rollback

Route, Navigationspunkt, Tabellen-Action, Formular-Button und Lead-Sprung-Button ausblenden. Der
Query-Handler liest nur bestehende, unveränderte Tabellen; ein Entfernen hinterlässt keinen
inkonsistenten Zustand.
