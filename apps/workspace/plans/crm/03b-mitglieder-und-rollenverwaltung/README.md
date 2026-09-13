# Ordner 03b — Mitglieder- und Rollenverwaltung

> **Status:** offen · **Branch:** `feat/crm-mitglieder-und-rollenverwaltung` · **Abhängigkeit:** Ordner 03 gemergt
> **Aufwand:** 4–5 Tage · **Reviewziel:** 60–100 Dateien

## Ziel und Stand nach Merge

Der Owner verwaltet Mitglieder und Rollen vollständig in der App. Ab hier arbeiten mehrere interne Nutzer mit
unterschiedlichen Rechten, und jede sichtbare Aktion respektiert die Permissions des Actors.

**Konkreter Task-Plan**

- [`02c-mitglieder-und-rollenverwaltung.md`](./02c-mitglieder-und-rollenverwaltung.md)

## Umfang

- Bereich `settings` mit eigener Area-Permission (`members.manage`) in `WORKSPACE_AREA_PERMISSIONS`.
- Mitglied anlegen: Owner wählt ein noch nicht verknüpftes Clerk-Konto (Clerk Backend API); Stammdaten werden
  übernommen und bei jedem Öffnen der Liste aus Clerk aktualisiert. Die Einladung selbst bleibt im Clerk-Dashboard.
- Mitglied aktivieren/deaktivieren; mehrere Rollen zuweisen und entziehen; Vorschau der effektiven Permissions.
- Custom-Rollen erstellen, umbenennen, deaktivieren und mit delegierbaren Permissions bestücken.
- Separater Owner-Flow für Vergabe/Entzug von `workspace_owner`; letzter aktiver Owner geschützt.
- Exhaustive Ownership-Registry (`OwnableEntity`, `satisfies Record<OwnableEntity, OwnershipAdapter>`), Übergabe
  und Deaktivierungssperre inklusive „Alles an den Owner übergeben".
- `security_events` für jede Mitglieder-, Rollen- und Owner-Änderung (CHECK um neue Typen und `role` erweitern).
- Permissionabhängige Buttons in bestehenden Bereichen (z. B. Lead löschen nur mit `leads.delete`).

## Merge-Gate

- [ ] Mitglied mit Custom-Rolle darf die erlaubte Aktion (200) und erhält für eine andere 403.
- [ ] Rollenentzug und Deaktivierung wirken beim nächsten Request.
- [ ] Letzter aktiver Owner kann weder deaktiviert noch seiner Owner-Rolle beraubt werden (409 mit Begründung).
- [ ] Custom-Rolle mit nicht delegierbarer Permission wird abgewiesen (422), auch bei manipuliertem Request.
- [ ] Rollen- und Mitgliedsänderungen sind versioniert (`updateVersioned`, 409 mit aktuellem Stand).
- [ ] Deaktivierung ist gesperrt, solange Zuständigkeiten bestehen; Konflikt nennt Anzahl je Entität.
- [ ] Jede Änderung erzeugt genau einen `security_events`-Eintrag mit tatsächlichem Actor.
- [ ] Keine sichtbare Aktion ohne passende Permission; Empty-States erklären Mitglieder- und Rollenbereich.
- [ ] DE/EN-Dictionaries vollständig; A11y-Smoke für Liste, Dialoge und Fokus-Reihenfolge.

## Rollback

App-Revert auf Ordner 03. Angelegte Mitglieder, Rollen und Zuweisungen bleiben gültig und werden von der
Ordner-03-Auth weiter ausgewertet; es fehlt nur die Oberfläche.
