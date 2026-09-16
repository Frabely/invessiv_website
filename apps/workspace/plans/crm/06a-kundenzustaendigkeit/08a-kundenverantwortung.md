# Task 08a — Kundenverantwortung zuweisen

> **Merge-Einheit:** Ordner 06a · **Branch:** `feat/crm-kundenzustaendigkeit`
> **Aufwand:** S–M · **Abhängigkeiten:** Task 04, Task 05, Task 08
> **Migration:** keine

## Ziel

Die bereits vorhandene technische Kunden-Owner-Zuordnung wird zu einer vollständig bedienbaren fachlichen
Verantwortung. Sie dient später als Standard für neue Projekte, Aufgaben, Renewals und Kundenchats, ohne deren
individuelle Zuweisungen nachträglich zu koppeln.

## Entscheidungen

| Bereich             | Entscheidung                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Standard            | Bei direkter Anlage und Lead-Konvertierung ist das aktuelle Mitglied vorausgewählt.                                                           |
| Auswahl             | Zulässig sind ausschließlich aktive Mitglieder mit `customers.read`; ab Ordner 07b erfolgt dieselbe Prüfung über den wirksamen `accessScope`. |
| Wechsel             | Ein eigener typisierter Owner-Endpunkt verwendet `updateVersioned`; der allgemeine Stammdaten-Write bleibt davon getrennt.                    |
| Wirkung             | Der Wechsel betrifft nur den Kunden. Bestehende Projekt-, Aufgaben-, Renewal- und Chat-Zuweisungen bleiben unverändert.                       |
| Nachvollziehbarkeit | Genau eine `field_change`-Activity enthält alte und neue Member-ID, aber keine Namen oder E-Mail-Adressen.                                    |
| Berechtigung        | Ausführen darf nur, wer `customers.write` am Kunden besitzt. Zuständigkeit selbst gewährt keinen Zugriff.                                     |

## Contracts und Endpunkt

```txt
PATCH /api/workspace/crm/customers/[id]/owner
Body: { ownerMemberId: string, version: number }
```

Der Erfolgsfall liefert das aktuelle `CustomerDetailDto`. Erwartete Fehler sind ungültige Eingaben, unbekannter Kunde,
inaktives oder unberechtigtes Zielmitglied und `VERSION_CONFLICT` mit aktuellem DTO.

## Tickets

### CRM-08a-T1 — Contracts und Zielmitgliedsabfrage

- Request-/Result-Contracts, Endpoint-Konstante und Schema ergänzen.
- Serverseitige Auswahl aktiver Mitglieder mit der erforderlichen Kundenpermission bereitstellen.
- **Akzeptanz:** Inaktive, gelöschte oder unberechtigte Mitglieder fehlen in der Auswahl und werden vom Command dennoch
  separat abgelehnt.

### CRM-08a-T2 — Versionierter Owner-Wechsel

- Command, Route, Client-Service und Activity implementieren.
- Ziel-Membership während des Schreibens sperren und ihren aktiven Zustand erneut prüfen.
- **Akzeptanz:** Parallelkonflikt ergibt 409; genau der Kunde wechselt den Owner und keine andere Entität wird geändert.

### CRM-08a-T3 — Anlage und Lead-Konvertierung

- Owner-Auswahl in direkte Kundenanlage und Konvertierungsdialog integrieren.
- Ohne bewusste Änderung bleibt der aktuelle Actor vorausgewählt.
- **Akzeptanz:** Beide Anlagewege speichern denselben validierten Owner und erzeugen keinen Kunden ohne Zuständigkeit.

### CRM-08a-T4 — Kundenliste und Kundenakte

- Vorhandene Owner-Anzeige um eine zugängliche Wechselaktion mit Custom Select im gemeinsamen FormField erweitern.
- Loading-, Empty-, 403-, 409- und Serverfehlerzustände in DE/EN ergänzen.
- **Akzeptanz:** Wechsel ist mobil und per Tastatur vollständig bedienbar; ein Konflikt behält die Auswahl und erklärt
  die notwendige Aktualisierung.

## Nicht Teil dieses Tasks

- Projekt-, Aufgaben-, Renewal- oder Chat-Zuweisungen.
- Automatische Kaskade auf bestehende Kindentitäten.
- Globale Übergabe aller Zuständigkeiten eines Mitglieds; sie folgt in Ordner 22a.

## Rollback

Owner-Auswahl und Wechselaktion ausblenden. Der bestehende Pflicht-Fremdschlüssel bleibt unverändert gültig.
