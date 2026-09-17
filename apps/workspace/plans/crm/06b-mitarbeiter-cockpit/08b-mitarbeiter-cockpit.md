# Task 08b — Mitarbeiter-Cockpit (Welle 1)

> **Merge-Einheit:** Ordner 06b · **Branch:** `feat/crm-mitarbeiter-cockpit`
> **Aufwand:** S–M · **Abhängigkeiten:** Task 08a
> **Migration:** keine

## Ziel

Führt Kundenzuständigkeit und offene, noch nicht bearbeitete strukturierte Projektanfragen in einer
einzigen, mitgliedsbezogenen Übersicht zusammen, damit ein Mitarbeiter seine Kunden nicht mehr einzeln
durchklicken muss, um zu sehen, wo eine Reaktion ausständig ist.

**Wiederverwendung vorausgesetzt:** Die hier gebaute Aggregationsfunktion wird in Task 08c unverändert für
genau einen Kunden wiederverwendet (Kunden-Cockpit-Dialog aus Kundenliste, Kundenformular und Lead-Liste).
Sie wird deshalb von Anfang an mit einem `customerIds`-Parameter statt eines festen „alle Kunden des
Mitglieds"-Pfads entworfen, damit Task 08c sie mit einem einzelnen Kunden aufrufen kann, ohne sie zu
duplizieren.

## Entscheidungen

| Bereich              | Entscheidung                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Umfang               | Nur Kunden mit `owner_member_id = actor`; keine Leads, kein Dealvolumen (folgt in Task 42a).                                                                    |
| Datenquelle Anfragen | `lead_project_requests` ohne verknüpften Folgeschritt gelten als offen; die konkrete Abgrenzung wird beim Umsetzen anhand des tatsächlichen Schemas festgelegt. |
| Sichtbarkeit         | Jedes aktive Mitglied sieht ausschließlich die eigene Zuständigkeit; `workspace_owner` erhält zusätzlich einen Filter „andere Mitglieder ansehen".              |
| Berechtigung         | `customers.read` genügt; ab Ordner 07b zusätzlich der wirksame `accessScope`.                                                                                   |
| Aktualität           | Reine Leseansicht ohne eigenen Schreibpfad; Änderungen laufen über die bestehenden Kunden-/Anfrage-Handler.                                                     |

## Contracts und Endpunkt

```txt
GET /api/workspace/crm/cockpit/my-customers?memberId=<uuid>
```

Liefert eine Liste aus Kundenkopf (Nummer, Anzeigename, Status) und Anzahl offener Projektanfragen je
Kunde. `workspace_owner` darf `memberId` auf ein anderes aktives Mitglied setzen; alle anderen Mitglieder
erhalten ausschließlich die eigene Zuständigkeit unabhängig vom Parameter.

## Tickets

### CRM-08b-T1 — Query-Handler und Aggregation

- Query-Handler liest zugewiesene Kunden und zählt offene `lead_project_requests` je Kunde in einer
  Abfrage.
- **Akzeptanz:** Kunden ohne offene Anfrage erscheinen mit Zähler 0, nicht fehlend.

### CRM-08b-T2 — Zugriff und Mitgliedsfilter

- `memberId`-Parameter nur für `workspace_owner` wirksam; alle anderen Anfragen ignorieren einen
  abweichenden Wert serverseitig statt ihn abzulehnen.
- **Akzeptanz:** Ein Mitglied ohne `workspace_owner`-Rechte erhält bei jedem `memberId`-Wert nur die
  eigene Liste (Negativtest).

### CRM-08b-T3 — Cockpit-Seite

- Neue Route unter einem passenden bestehenden internen Dashboard-Pfad, Karten-/Listendarstellung aus
  geteilten Bausteinen (`packages/ui`, `components/workspace/shared`).
- Empty-State erklärt „keine zugewiesenen Kunden" getrennt von „keine offenen Anfragen".
- **Akzeptanz:** Seite ist per Tastatur bedienbar, DE/EN vorhanden, `noindex`/`force-dynamic` gesetzt.

## Nicht Teil dieses Tasks

- Dealvolumen, Kundenwert und Pipeline-Positionen (folgen in Task 42a).
- Aufgaben-, Renewal- oder Chat-Widgets (folgen in Ordner 08, 11, 17).
- Leads in jeglicher Form.
- Der Einzelkunden-Dialog und seine drei Einstiegspunkte in Kundenliste, Kundenformular und Lead-Liste (folgen in Task
  08c, auf Basis derselben Aggregationsfunktion).

## Rollback

Route und Navigationspunkt ausblenden. Der Query-Handler liest nur bestehende Tabellen und schreibt
nichts; ein Entfernen hinterlässt keinen inkonsistenten Zustand.
