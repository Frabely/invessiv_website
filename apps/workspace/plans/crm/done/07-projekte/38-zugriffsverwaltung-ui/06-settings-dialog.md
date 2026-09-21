# 06 — Settings-Dialog „Zugriffe“ und Mitgliederliste

> **Ordner:** 07c · **Aufwand:** M · **Hängt ab von:** 05 · **Blockiert:** 08

## Warum

Der Einstieg, den du im Alltag benutzt: ein Mitarbeiter, ein Dialog, darin alle seine Zugriffe. Die
Mitgliederliste zeigt vorab, wie viele gebundene Zuweisungen jemand hat, damit man sie nicht erst öffnen muss.

## Umfang

```txt
src/components/workspace/settings/members/member-access-dialog/…      (Ordner liegt leer bereit)
src/components/workspace/settings/members/members-list/               fünfter Dialog-State
src/components/workspace/settings/members/member-row/                 Zähler + Aktion
src/app/[locale]/(app)/settings/page.tsx                              Daten und canManageAccess
src/i18n/dictionaries/workspace/settings/{access,members}/{de,en}.json
```

## Dialog

Hülle nach dem Muster von `member-roles-dialog`:

- `Dialog size={DialogSize.Wide}`, Eyebrow mit dem Mitgliedsnamen.
- Links der `AccessScopeTree` aus Task 05, rechts die Rechtevorschau.
- Kein Footer mit „Speichern" — jede Änderung wirkt sofort. Der Footer trägt nur „Fertig".
  Das ist der bewusste Unterschied zum Rollen-Dialog und muss in der Microcopy stehen, damit niemand ein
  Speichern erwartet.
- Die Zugriffszuweisungen werden als versionierter Gesamtsatz gespeichert. Die konfliktfeste
  Entwurfsübernahme bei 409 folgt erst mit
  [`Task 41`](../../../24-zustaendigkeitszugriff-absicherung/41-zugriffsbereich-konflikte.md).
- Fokus-Rückgabe auf den auslösenden Button beim Schließen.

### `MEMBER_WITHOUT_ROLE`

Entfernt man die letzte Zuweisung eines Mitglieds, das auch keine workspace-weite Rolle hat, antwortet der
Server mit `MEMBER_WITHOUT_ROLE`. Die Meldung erklärt das verständlich und nennt den Ausweg: entweder eine
workspace-weite Rolle im Tab „Rollen" vergeben oder das Mitglied deaktivieren. Kein roher Fehlercode.

## Mitgliederliste

- `member-row` zeigt die Anzahl gebundener Zuweisungen (aus Task 02) neben den Rollen-Chips.
- Die Markierung „Keine wirksame Rolle" berücksichtigt beide Zuweisungsarten — serverseitig über
  `hasActiveRole` bereits gegeben, hier nur korrekt beschriftet.
- Neue Zeilen-Aktion „Zugriffe" mit `aria-label` nach dem bestehenden Muster „Aktion: Name".
- Aktion und Zähler erscheinen nur mit `members.manage`; ohne das Recht fehlen sie, statt gesperrt zu sein.

## Page

`settings/page.tsx` lädt die Zugriffsdaten nur für den Mitglieder-Tab mit — analog zur bestehenden
tab-abhängigen Ladung. Das Gate bleibt `requireWorkspaceArea(locale, WorkspaceArea.Settings)` in der Page,
nicht im Layout. `canManageAccess` wird daraus abgeleitet und als Prop durchgereicht.

## Tests

- opens the dialog from the member row and returns focus to the trigger on close
- saves the edited assignment set from the dialog
- removing the last assignment explains `MEMBER_WITHOUT_ROLE` and offers the next step
- the counter matches the number of listed assignments
- without `members.manage` the action and the counter are absent, not disabled

## Akzeptanz

- Ein Mitarbeiter wird vollständig über diesen Dialog konfiguriert; kein Umweg über die API.
- Kein toter Button, kein Verweis auf Unfertiges.
- DE und EN vollständig.
