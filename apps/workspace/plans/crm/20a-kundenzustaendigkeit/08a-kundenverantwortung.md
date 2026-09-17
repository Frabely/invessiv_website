# Task 08a — Kundenverantwortung zuweisen

> **Merge-Einheit:** Ordner 20a · **Branch:** `feat/crm-kundenzustaendigkeit`
> **Aufwand:** S–M · **Abhängigkeiten:** Ordner 07, 07a–07c, 12–15c, 16–20
> **Migration:** keine

## Ziel

Die bereits vorhandene technische Kunden-Owner-Zuordnung wird erst im vollständigen Kundenkontext zu einer vollständig
bedienbaren fachlichen Verantwortung. Sie bleibt der Standard für neue Projekte, Aufgaben, Renewals und
Kundenchats, ohne deren individuelle Zuweisungen nachträglich zu koppeln.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Standard            | Bei direkter Anlage und Lead-Konvertierung ist das aktuelle Mitglied vorausgewählt.                                                                                                              |
| Auswahl             | Zulässig sind ausschließlich aktive Mitglieder mit wirksamem Kunden-Zugriff nach dem vorhandenen `accessScope`-/`canOn`-Muster. Eine Übergangslogik für die Zeit vor Ordner 07b existiert nicht. |
| Wechsel             | Ein eigener typisierter Owner-Endpunkt verwendet `updateVersioned`; der allgemeine Stammdaten-Write bleibt davon getrennt.                                                                       |
| Wirkung             | Der Wechsel betrifft nur den Kunden. Bestehende Projekt-, Aufgaben-, Renewal- und Chat-Zuweisungen bleiben unverändert. Portal- und Termin-Kontext werden nur erläutert, nicht übertragen.       |
| Nachvollziehbarkeit | Genau eine `field_change`-Activity enthält alte und neue Member-ID, aber keine Namen oder E-Mail-Adressen.                                                                                       |
| Berechtigung        | Ausführen darf nur, wer `customers.write` am Kunden besitzt. Zuständigkeit selbst gewährt keinen Zugriff.                                                                                        |
| UI-Ort              | Die Kundenliste zeigt die Verantwortung nur an. Der Wechsel erfolgt ausschließlich in einem eigenen Bereich der Kundenakte.                                                                      |

## Contracts und Endpunkt

```txt
PATCH /api/workspace/crm/customers/[id]/owner
Body: { ownerMemberId: string, version: number }
```

Der Erfolgsfall liefert das aktuelle `CustomerDetailDto`. Erwartete Fehler sind ungültige Eingaben, unbekannter Kunde,
inaktives oder nicht zugriffsberechtigtes Zielmitglied und `VERSION_CONFLICT` mit aktuellem DTO.

## Tickets

### CRM-08a-T1 — Contracts und Zielmitgliedsabfrage

- Request-/Result-Contracts, Endpoint-Konstante und Schema ergänzen.
- Serverseitige Auswahl aktiver Mitglieder mit wirksamem Kunden-Zugriff bereitstellen.
- **Akzeptanz:** Inaktive, gelöschte oder nicht zugriffsberechtigte Mitglieder fehlen in der Auswahl und werden vom
  Command dennoch separat abgelehnt.

### CRM-08a-T2 — Versionierter Owner-Wechsel

- Command, Route, Client-Service und Activity implementieren.
- Ziel-Membership während des Schreibens sperren und ihren aktiven Zustand sowie den wirksamen Kunden-Zugriff erneut
  prüfen.
- **Akzeptanz:** Parallelkonflikt ergibt 409; genau der Kunde wechselt den Owner und keine andere Entität wird geändert.

### CRM-08a-T3 — Anlage und Lead-Konvertierung

- Owner-Auswahl in direkte Kundenanlage und Konvertierungsdialog integrieren.
- Ohne bewusste Änderung bleibt der aktuelle Actor vorausgewählt.
- **Akzeptanz:** Beide Anlagewege speichern denselben validierten Owner und erzeugen keinen Kunden ohne Zuständigkeit.

### CRM-08a-T4 — Kundenakte

- Vorhandene Owner-Anzeige in der Kundenakte um einen zugänglichen separaten Wechselbereich mit Custom Select im
  gemeinsamen FormField erweitern; die Kundenliste bleibt reine Übersicht.
- Projekt-, Portal-, Aufgaben-, Renewal- und Chat-Kontext nur erläuternd anzeigen, ohne Übertragungsaktion.
- Loading-, Empty-, 403-, 409- und Serverfehlerzustände in DE/EN ergänzen.
- **Akzeptanz:** Wechsel ist mobil und per Tastatur vollständig bedienbar; ein Konflikt behält die Auswahl und erklärt
  die notwendige Aktualisierung.

### CRM-08a-T5 — Tests und Abnahme

- Tests für wirksamen Zugriffsscope, inaktive oder entzogene Zielmitgliedschaft, Membership-Lock und
  Versionskonflikt ergänzen.
- Direkte Anlage, Lead-Konvertierung und alle bereits vorhandenen Folgeobjekte weiterhin mit einem gültigen
  Default-Owner prüfen.
- **Akzeptanz:** Der Einzelwechsel aktualisiert ausschließlich den Kunden, schreibt genau eine `field_change`-Activity
  ohne Namen oder E-Mail-Adressen und verändert keine Projekt-, Aufgaben-, Renewal- oder Chat-Zuweisung.

## Nicht Teil dieses Tasks

- Projekt-, Aufgaben-, Renewal- oder Chat-Zuweisungen.
- Automatische Kaskade auf bestehende Kindentitäten.
- Globale Übergabe aller Zuständigkeiten eines Mitglieds; sie folgt ausschließlich als atomare Aktion in Ordner 22a.

## Rollback

Owner-Auswahl und Wechselaktion ausblenden. Der bestehende Pflicht-Fremdschlüssel bleibt unverändert gültig; direkte
Anlage und Lead-Konvertierung verwenden wieder ausschließlich den aktuellen Actor als technischen Default.
