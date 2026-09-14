# Ordner 23 — Web-UI-Abschluss

> **Status:** offen · **Abhängigkeiten:** alle Ordner 01 bis 22 gemerged · **Aufwand:** 3–4 Tage ·
> **Reviewziel:** 35–55 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`39-web-ui-anpassung.md`](./39-web-ui-anpassung.md) — die Website auf alle in Ordner 03d zentralisierten Button- und
  Formularbausteine umstellen, bewusst gestalten und den Gesamtplan abschließen.

Diese Einheit beginnt erst, wenn der gesamte fachliche CRM-, Portal-, Rollout- und Cleanup-Umbau abgeschlossen ist.
Sie verändert keine CRM-Funktion, kein Schema und keine Workspace-Optik. Ihr eigener Web-PR migriert die bestehenden
Web-Kopien auf `@invessiv/ui` und entwickelt deren Darstellung in `apps/web` weiter.

## Merge-Gate

- [ ] Alle Ordner 01 bis 22 sind gemerged; es gibt keinen parallelen Umbau an den betroffenen `packages/ui`-APIs.
- [ ] Alle Web-Kopien und produktiven Web-Nutzer der zentralisierten Button- und Formularbausteine sind erneut
      inventarisiert.
- [ ] Alle Nutzer importieren aus `@invessiv/ui`; die bisherigen Web-Kopien sind gelöscht.
- [ ] Dark und Light sowie Mobile, Tablet und Desktop sind mit Vorher-/Nachher-Screenshots dokumentiert.
- [ ] Kontaktformular und LinkedIn-Generator bestehen ihre Conversion-, Formular- und A11y-Smokes.
- [ ] Workspace-Darstellung und -Tests bleiben unverändert grün.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` und `pnpm --filter @invessiv/web build` sind grün.

## Rollback

Reiner Code-Revert des Web-PRs. Die Workspace-Zentralisierung in `packages/ui` und alle CRM-Einheiten bleiben bestehen.
