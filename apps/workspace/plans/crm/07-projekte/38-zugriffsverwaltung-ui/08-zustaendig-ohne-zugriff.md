# 08 — „Zuständig ohne Zugriff“

> **Ordner:** 07c · **Aufwand:** M · **Hängt ab von:** 02, 06, 07

## Warum

`owner_member_id` gewährt keine Rechte — das ist eine bewusste Entscheidung aus Task 36: Zuständigkeit ist
Verantwortung, kein Zugriff. Daraus entsteht ein stiller Fehlzustand: Jemand ist als zuständig eingetragen,
kann den Kunden aber nicht öffnen. Ohne Hinweis merkt das niemand, bis eine Anfrage liegen bleibt.

Der Zustand wird deshalb sichtbar gemacht — und zwar dort, wo man ihn beheben kann.

## Umfang

### Serverseitig

- `OwnershipAdapter` erhält `requiredPermission` und `scopeOf(entityId)` (aus Task 37 vorgesehen, im Code
  nicht vorhanden).
- Neuer Fehlercode `HANDOVER_TARGET_WITHOUT_ACCESS`: Eine Übergabe an ein Mitglied ohne Zugriff antwortet
  422, statt still eine unwirksame Zuständigkeit zu schreiben.
- Die Verantwortlichkeits-Registry (`services/responsibilities/`) wertet zusätzlich aus, ob der zuständige
  Actor auf dem Datensatz `canOn(requiredPermission)` erfüllt. Prüfung pro Request, kein Cache.

### In der Oberfläche

| Ort             | Darstellung                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| Kundenakte      | Badge am Zuständigkeits-Feld, Aktion öffnet den Zugriffs-Dialog des Mitglieds |
| Projekt         | dasselbe Badge am Zuständigkeits-Feld                                         |
| Mitgliederliste | Zähler „zuständig ohne Zugriff", Aktion führt in den Zugriffs-Dialog          |

Baustein `crm/shared/owner-without-access-badge/`, weil er in Kundenakte und Projekt gebraucht wird.

Jeder Hinweis führt zu einer Handlung — Zugriff geben oder Zuständigkeit übergeben. Kein Hinweis ohne Ziel (Regel aus
`plans/crm/AGENTS.md`: kein toter Button, kein Verweis ins Leere).

## Abgrenzung

Der Badge behauptet nichts über Absicht. Es kann gewollt sein, dass jemand zuständig ist, ohne die Akte zu
sehen — etwa bei rein fachlicher Verantwortung. Der Text formuliert deshalb eine Beobachtung, keine Warnung,
und bietet beide Auswege an.

## Tests

- a handover to a member without access answers 422 with `HANDOVER_TARGET_WITHOUT_ACCESS`
- the badge appears when the responsible member lacks the required permission on that record
- granting access removes the badge on the next render
- the member list counter matches the number of badged records

## Akzeptanz

- Der Zustand ist an allen drei Orten sichtbar und an jedem Ort behebbar.
- Eine unwirksame Zuständigkeit kann nicht mehr neu entstehen.
