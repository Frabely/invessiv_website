# Task 08b — Dashboard-Kundenansicht (vertagt)

> **Merge-Einheit:** nach Ordner 07 · **Status:** vertagt · **Abhängigkeiten:** Dashboard, 06b, 07, 07b

## Ziel

Ergänzt das bestehende Dashboard später um einen Umschalter für die Kundenansicht. Dieser Task implementiert bewusst keine zweite Kundenberechnung und keine zweite Detaildarstellung.

## Voraussetzungen

- Die Kundenansicht aus Task 08c und ihre serverseitige Cockpit-Query bestehen bereits.
- Die Projektdomäne aus Ordner 07 liefert die erste fachliche Erweiterung der Ansicht.
- Der Zugriffsfilter aus Ordner 07b kann die Auswahl auf tatsächlich sichtbare Kunden begrenzen.

## Umsetzung

- Zugriff nur mit `dashboard.read` und `customers.read`.
- Umschalter, Kundenauswahl und gewählte Kunden-ID liegen im URL-State.
- Das Select enthält ausschließlich eigene zugewiesene und sichtbare Kunden.
- Unter dem Select rendert derselbe Kundenansichtsbaustein und dieselbe Cockpit-Query wie im CRM-Dialog.

## Akzeptanz

- Ohne eine der beiden Berechtigungen ist die Dashboard-Kundenansicht nicht erreichbar.
- Ein Mitglied kann keinen fremden Kunden auswählen oder per URL laden.
- Dashboard und CRM-Dialog zeigen für denselben Kunden denselben DTO-Stand.

## Nicht Teil dieses Tasks

- Eigene Dashboard-spezifische Kunden-Query oder Detailkomponente.
- Website-Lead-Submissions, Leads oder Anfragen als CRM-Datenquelle.
- Projektanlage oder Projektbearbeitung; diese bleiben in Ordner 07.
