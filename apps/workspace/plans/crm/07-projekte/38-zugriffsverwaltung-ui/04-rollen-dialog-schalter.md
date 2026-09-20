# 04 — Rollen-Dialog: Schalter „An Kunden und Projekte vergebbar“

> **Ordner:** 07c · **Aufwand:** S · **Hängt ab von:** — · **Unabhängig einschiebbar**

## Warum

`roles.scope_assignable` entscheidet, ob eine Rolle überhaupt im Zugriffs-Baum auftaucht. Der Server kennt
das Feld, `createRole` und `updateRole` schreiben es, die Fehlercodes und ihre DE/EN-Texte existieren —
aber `role-form-dialog.tsx` reicht den Wert nur unverändert durch (`current.scopeAssignable ?? false`).
Ohne Schalter kann niemand eine bindbare Rolle anlegen, und der Zugriffs-Baum bliebe leer.

## Umfang

```txt
src/components/workspace/settings/roles/role-form-dialog/role-form-dialog.tsx
src/components/workspace/settings/shared/permission-picker/permission-picker.tsx
src/i18n/dictionaries/workspace/settings/roles/{de,en}.json
src/i18n/dictionaries/workspace/settings/permissions/{de,en}.json
```

### Schalter

`CheckboxControl` mit Label „An Kunden und Projekte vergebbar" plus erklärendem Hinweistext. Beim Anlegen
frei wählbar, beim Bearbeiten ebenfalls — der Server lehnt das Zurücksetzen mit bestehenden Zuweisungen
selbst ab. Systemrollen-Ansicht bleibt read-only (bestehender Early Return).

Der Hinweistext sagt, was der Schalter bewirkt, nicht wie er heißt: eine bindbare Rolle wird je Kunde oder
Projekt vergeben und erscheint dafür nicht mehr in der workspace-weiten Rollenauswahl. Für Rechte über alle Kunden
wird stattdessen eine eigene workspace-weite Rolle verwendet.

### Sperrlogik im `PermissionPicker`

Der Picker kennt bereits `lockNonDelegable` mit `data-locked`, Sperr-Badge und ergänztem Hinweistext. Dasselbe
Muster wird für nicht bindbare Permissions ergänzt: ist der Schalter aktiv, werden alle Permissions mit
`scopeAssignable: false` sichtbar gesperrt — mit eigener Erklärung, nicht mit derselben wie bei
Nicht-Delegierbarkeit. Beide Sperrgründe können gleichzeitig zutreffen; dann gewinnt der zuerst zutreffende
Text und die Checkbox bleibt einmal gesperrt.

**Nicht verstecken.** Regel aus `components/workspace/settings/AGENTS.md`.

### Fehlermeldungen

Bereits als Codes vorhanden, Texte liegen in `settings/roles/{de,en}.json`:

- `ROLE_PERMISSION_NOT_SCOPE_ASSIGNABLE` — bindbare Rolle enthält eine nicht bindbare Permission
- `ROLE_SCOPE_ASSIGNMENTS_EXIST` — Schalter kann nicht zurückgesetzt werden, es gibt gebundene Zuweisungen
- `ROLE_WORKSPACE_ASSIGNMENTS_EXIST` — Schalter kann nicht gesetzt werden, die Rolle ist workspace-weit vergeben

Texte prüfen und, falls nötig, so formulieren, dass sie den nächsten Schritt nennen.

## Tests

- toggling the switch locks non-scopable permissions visibly and keeps them listed
- an already selected non-scopable permission is reported, not silently dropped
- the conflict message names the reason when assignments exist
- the system-role view stays read-only and shows no switch

## Akzeptanz

- Eine neue bindbare Rolle ist vollständig über die Oberfläche anlegbar.
- Ein manipulierter Request bleibt serverseitig 422 (Bestandstest aus Task 36).
- DE und EN gepflegt.
