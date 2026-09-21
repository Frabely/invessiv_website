# 08 — „Zuständig ohne Zugriff“

> **Ordner:** 07c · **Aufwand:** M · **Hängt ab von:** 02, 06, 07

## Warum

`owner_member_id` gewährt keine Rechte — das ist eine bewusste Entscheidung aus Task 36: Zuständigkeit ist
Verantwortung, kein Zugriff. Daraus entsteht ein stiller Fehlzustand: Jemand ist als zuständig eingetragen,
kann den Kunden aber nicht öffnen. Ohne Hinweis merkt das niemand, bis eine Anfrage liegen bleibt.

Der Zustand wird deshalb sichtbar gemacht — und zwar dort, wo man ihn beheben kann.

## Umfang

### Serverseitig

- Die Verantwortlichkeitsauswertung erkennt pro Request, ob der zuständige Actor die erforderliche Permission am
  Datensatz über `canOn` erfüllt. Sie erzeugt keinen Cache und blockiert bestehende Zuständigkeiten nicht.
- **Bewusst verschoben nach Ordner 24:** Die kanonische Ownership-Registry mit `requiredPermission` und `scopeOf`,
  die Absicherung eines Owner-Wechsels beziehungsweise einer Übergabe mit
  `HANDOVER_TARGET_WITHOUT_ACCESS` und HTTP 422 sowie deren atomare Tests. Ein passender Schreibpfad existiert in
  dieser Einheit noch nicht; eine parallele Übergabe-API wäre Architektur-Duplikation.

### In der Oberfläche

| Ort             | Darstellung                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| Kundenakte      | Badge am Zuständigkeits-Feld, Aktion öffnet den Zugriffs-Dialog des Mitglieds |
| Projekt         | dasselbe Badge am Zuständigkeits-Feld                                         |
| Mitgliederliste | Zähler „zuständig ohne Zugriff", Aktion führt in den Zugriffs-Dialog          |

Baustein `crm/shared/owner-without-access-badge/`, weil er in Kundenakte und Projekt gebraucht wird.

Für aktive Zuständige führt der Hinweis direkt in den Zugriffs-Dialog. Für inaktive Zuständige bleibt er eine reine
Beobachtung, bis Ordner 24 die sichere Übergabe bereitstellt; es gibt keinen toten CTA.

## Abgrenzung

Der Badge behauptet nichts über Absicht. Es kann gewollt sein, dass jemand zuständig ist, ohne die Akte zu
sehen — etwa bei rein fachlicher Verantwortung. Der Text formuliert deshalb eine Beobachtung, keine Warnung,
und bietet beide Auswege an.

## Tests dieser Einheit

- the badge appears when the responsible member lacks the required permission on that record
- granting access removes the badge on the next render
- the member list counter matches the number of badged records

## Akzeptanz

- Der Zustand ist an allen drei Orten sichtbar.
- Aktive Zuständige können direkt Zugriff erhalten; die Übergabe-Absicherung folgt vollständig in Ordner 24.
