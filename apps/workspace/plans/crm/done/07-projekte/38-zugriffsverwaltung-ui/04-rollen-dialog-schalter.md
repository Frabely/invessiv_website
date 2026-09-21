# 04 — Rollen-Dialog: Rollentyp beim Anlegen auswählen

> **Ordner:** 07c · **Aufwand:** S · **Hängt ab von:** — · **Unabhängig einschiebbar**

## Warum

`roles.scope_assignable` entscheidet, ob eine Rolle überhaupt im Zugriffs-Baum auftaucht. Der Wert wird beim
Anlegen festgelegt und ist danach absichtlich unveränderlich: Ein Rollentypwechsel könnte bereits vergebene
Rollen unbemerkt aus der globalen oder der kundenbezogenen Verwaltung verschieben. Ohne Auswahl beim Anlegen
kann niemand eine bindbare Rolle anlegen, und der Zugriffs-Baum bliebe leer.

## Umfang

```txt
src/components/workspace/settings/roles/role-form-dialog/role-form-dialog.tsx
src/components/workspace/settings/shared/permission-picker/permission-picker.tsx
src/i18n/dictionaries/workspace/settings/roles/{de,en}.json
src/i18n/dictionaries/workspace/settings/permissions/{de,en}.json
```

### Rollentyp-Auswahl

Vor dem Rollenformular erscheint beim Anlegen eine eindeutige Auswahl zwischen workspace-weiter und kunden-/
projektbindbarer Rolle. Beim Bearbeiten wird der gewählte Typ nur als Badge angezeigt; der Update-DTO lehnt
ein mitgesendetes `scopeAssignable` absichtlich ab. Systemrollen-Ansicht bleibt read-only (bestehender Early
Return).

Der Hinweistext sagt, was die Auswahl bewirkt, nicht nur wie sie heißt: eine bindbare Rolle wird je Kunde oder
Projekt vergeben und erscheint dafür nicht mehr in der workspace-weiten Rollenauswahl. Für Rechte über alle Kunden
wird stattdessen eine eigene workspace-weite Rolle verwendet.

### Sperrlogik im `PermissionPicker`

Der Picker kennt bereits `lockNonDelegable` mit `data-locked`, Sperr-Badge und ergänztem Hinweistext. Dasselbe
Muster wird für nicht bindbare Permissions ergänzt: ist der bindbare Rollentyp gewählt, werden alle Permissions mit
`scopeAssignable: false` sichtbar gesperrt — mit eigener Erklärung, nicht mit derselben wie bei
Nicht-Delegierbarkeit. Beide Sperrgründe können gleichzeitig zutreffen; dann gewinnt der zuerst zutreffende
Text und die Checkbox bleibt einmal gesperrt.

**Nicht verstecken.** Regel aus `components/workspace/settings/AGENTS.md`.

### Fehlermeldungen

Bereits als Codes vorhanden, Texte liegen in `settings/roles/{de,en}.json`:

- `ROLE_PERMISSION_NOT_SCOPE_ASSIGNABLE` — bindbare Rolle enthält eine nicht bindbare Permission
  Die beiden historischen Codes `ROLE_SCOPE_ASSIGNMENTS_EXIST` und `ROLE_WORKSPACE_ASSIGNMENTS_EXIST` bleiben
  für Abwärtskompatibilität dokumentiert, sind aber aus der aktuellen Oberfläche bewusst nicht erreichbar:
  Der Rollentyp wird nach dem Anlegen nicht gewechselt.

Texte prüfen und, falls nötig, so formulieren, dass sie den nächsten Schritt nennen.

## Tests

- selecting the role type locks non-scopable permissions visibly and keeps them listed
- an already selected non-scopable permission is reported, not silently dropped
- an update request carrying `scopeAssignable` is rejected as an immutable type change
- the system-role view stays read-only and shows no switch

## Akzeptanz

- Eine neue bindbare Rolle ist vollständig über die Oberfläche anlegbar.
- Ein manipulierter Request bleibt serverseitig 422 (Bestandstest aus Task 36).
- DE und EN gepflegt.
