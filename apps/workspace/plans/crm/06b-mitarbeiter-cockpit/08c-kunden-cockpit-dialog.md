# Task 08c — Kunden-Cockpit-Dialog

> **Merge-Einheit:** Ordner 06b · **Branch:** `feat/crm-mitarbeiter-cockpit`
> **Aufwand:** M · **Abhängigkeiten:** Task 08b, Task 03 (Kundenakte), Task 04 (Kundenliste), Task 08
> (Lead-Konvertierung)
> **Migration:** keine

## Ziel

Macht die in Task 08b für die „Meine Kunden"-Liste gebaute Aggregation zusätzlich für **genau einen**
Kunden als eigenständigen Fullsize-Dialog nutzbar — aufrufbar aus Kundenliste, Kundenformular und
Lead-Liste.

**Der Dialog ist die interne Mitarbeitersicht auf diesen Kunden, nicht die Kundenportal-Ansicht.** Er
zeigt, was der aufrufende Mitarbeiter laut seinen eigenen Permissions sehen darf — inklusive Daten, die
das spätere Kundenportal dem Kunden bewusst nie zeigt (z. B. Preise oder der interne Pipeline-Stand einer
Anfrage). Zwei Mitglieder mit unterschiedlichen Permissions sehen für denselben Kunden unterschiedliche
Sektionen. Bis das Datenmodell vollständig ist, wächst der Dialog in denselben Wellen wie Task 08b.

**Kein zweiter Berechnungspfad.** Dieser Task fügt keine eigene Zähl- oder Aggregationslogik hinzu. Er
ruft dieselbe Funktion wie Task 08b mit genau einem `customerId` auf und rendert das Ergebnis in einem
anderen Layout (Einzelkunde statt Liste).

## Entscheidungen

| Bereich                    | Entscheidung                                                                                                                                                                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wiederverwendung           | Derselbe Query-Handler/dieselbe Service-Funktion aus Task 08b, parametrisiert auf einen Kunden statt auf die Zuständigkeit eines Mitglieds.                                                                                                                                       |
| Darstellung                | Fullsize-Dialog (kein Seitenpanel wie die bestehende Kundenakte). Layout in Kartenform aus geteilten Bausteinen; der Dateninhalt bleibt unabhängig von jedem späteren Kundenportal-Inhalt.                                                                                        |
| Einstiegspunkte            | (1) Tabellen-Action in der Kundenliste (Ordner 05), (2) Button im Kundenformular (Ordner 04), (3) Sprung-Action in der Lead-Liste, sichtbar nur bei bereits konvertiertem Lead.                                                                                                   |
| Berechtigung               | Wie Task 08b: `customers.read` genügt für den Kundenkopf; ab Ordner 07b zusätzlich der wirksame `accessScope` auf genau diesen Kunden.                                                                                                                                            |
| Datensichtbarkeit          | Jede Sektion prüft ihre eigene Permission unabhängig vom Kundenkopf (z. B. `packages.read` für Preise/Pipeline ab Task 42a, künftig die jeweilige Permission für Aufgaben/Renewals/Chat). Fehlt sie, fehlt die Sektion vollständig statt leer oder maskiert angezeigt zu werden.  |
| Lead-Einstieg              | Sichtbar ausschließlich, wenn `leads.customer_id IS NOT NULL` und der Actor `customers.read` besitzt. Keine Änderung an Lead-Daten, -Rechten oder -Status.                                                                                                                        |
| Abgrenzung zum Portal      | Kein Bezug zu `portal.manage` oder einem künftigen Portal-Handler. Der Dialog läuft ausschließlich über `src/server/workspace/**`; ein späterer Kundenportal-Endpunkt (Ordner 12/13) ist ein eigener, separater Handler mit eigener Autorisierung und eigenem Datenumfang.        |
| Inhalt zu diesem Zeitpunkt | Kundenkopf, Zuständigkeit, offene strukturierte Projektanfragen — identisch zur Zeile in Task 08b. Projekte, Aufgaben, Dealvolumen, Renewals und Chat erscheinen automatisch, sobald die jeweiligen späteren Tasks (07, 08, 42a, 11, 17) dieselbe Aggregationsfunktion erweitern. |

## Contracts und Endpunkt

```txt
GET /api/workspace/crm/cockpit/customers/[customerId]
```

Ruft dieselbe Aggregationsfunktion wie der Listen-Endpunkt aus Task 08b auf, gefiltert auf genau diesen
Kunden. Fremder oder unberechtigter Kunde antwortet 404, nicht 403 — wie an anderer Stelle im CRM.

## Tickets

### CRM-08c-T1 — Aggregationsfunktion parametrisieren

- Die in Task 08b gebaute Funktion so umbauen, dass sie sowohl „alle Kunden eines Mitglieds" als auch
  „genau ein Kunde" als Eingabe akzeptiert, ohne die Zähllogik zu duplizieren.
- **Akzeptanz:** Ein Unit-Test ruft dieselbe exportierte Funktion aus beiden Aufrufstellen auf; es gibt
  keine zweite Implementierung der Zähllogik im Diff.

### CRM-08c-T2 — Fullsize-Dialog-Komponente

- Neue Dialog-Komponente aus geteilten Bausteinen (`packages/ui`, `components/workspace/shared`),
  Kundenkopf, Zuständigkeit und offene Anfragen als eigene, unabhängig ausblendbare Sektionen.
- Jede Sektion rendert nur, wenn die Antwort die dafür nötigen Felder enthält — serverseitiges Fehlen
  einer Permission blendet die Sektion aus, statt sie leer oder deaktiviert zu zeigen.
- **Akzeptanz:** Dialog ist per Tastatur bedienbar (Fokusfalle, Escape schließt), DE/EN vorhanden.
  Ein Mitglied ohne `packages.read` sieht nach Task 42a keine Preis-Sektion, ein Mitglied mit der
  Permission sieht sie im selben Dialog für denselben Kunden.

### CRM-08c-T3 — Einstiegspunkt Kundenliste

- Tabellen-Action „Kunden-Cockpit öffnen" in der bestehenden Kundenliste (Ordner 05) ergänzen.
- **Akzeptanz:** Action ist nur bei vorhandenem `customers.read` sichtbar und öffnet den Dialog für die
  Zeile, ohne die Seite zu verlassen (URL-State bleibt erhalten).

### CRM-08c-T4 — Einstiegspunkt Kundenformular

- Zusätzlichen Button im bestehenden Kundenformular (Ordner 04) ergänzen, sichtbar nur beim Bearbeiten
  eines existierenden Kunden (nicht bei der Neuanlage).
- **Akzeptanz:** Button öffnet denselben Dialog wie die Tabellen-Action, ohne das Formular zu schließen
  oder ungespeicherte Eingaben zu verwerfen.

### CRM-08c-T5 — Einstiegspunkt Lead-Liste

- Sprung-Action in der Lead-Liste/Lead-Detail-Ansicht ergänzen, sichtbar ausschließlich bei
  `leads.customer_id IS NOT NULL`.
- **Akzeptanz:** Ein nicht konvertierter Lead zeigt die Action nicht; ein konvertierter Lead ohne
  `customers.read` beim Actor zeigt sie ebenfalls nicht (Negativtest).

## Nicht Teil dieses Tasks

- Änderungen an Lead-Daten, Lead-Rechten oder Lead-Status.
- Projekte, Aufgaben, Dealvolumen, Renewals oder Chat-Inhalte — diese kommen automatisch mit, sobald die
  jeweiligen späteren Tasks die gemeinsame Aggregationsfunktion erweitern.
- Eine zweite, dialogeigene Berechnung irgendeines im Cockpit gezeigten Werts.
- Jeglicher Kundenportal-Handler, jegliche Kundenportal-Autorisierung oder ein Abgleich mit dem, was der
  Kunde später im Portal sehen wird. Dieser Task betrifft ausschließlich die interne Mitarbeitersicht.

## Rollback

Die drei Einstiegspunkte (Tabellen-Action, Formular-Button, Lead-Sprung-Action) und die Dialog-Route
ausblenden. Task 08b bleibt unverändert funktionsfähig, da beide nur dieselbe, unveränderte
Aggregationsfunktion lesen.
