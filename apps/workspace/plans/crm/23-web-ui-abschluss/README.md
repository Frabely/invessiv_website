# Ordner 23 — Web-UI-Abschluss

> **Status:** offen · **Abhängigkeiten:** alle Ordner 01 bis 22 gemerged · **Aufwand:** 2–3 Tage ·
> **Reviewziel:** 25–40 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`39-web-ui-anpassung.md`](./39-web-ui-anpassung.md) — alle im CRM-Umbau nach `packages/ui` verschobenen Button- und
  Formularbausteine auf der Invessiv-Website bewusst gestalten und den Gesamtplan abschließen.

Diese Einheit beginnt erst, wenn der gesamte fachliche CRM-, Portal-, Rollout- und Cleanup-Umbau abgeschlossen ist.
Sie verändert keine CRM-Funktion, kein Schema und keine Workspace-Optik. Ihr eigener Web-PR entwickelt ausschließlich
die Darstellung der bereits gemeinsam genutzten UI-Bausteine in `apps/web` weiter.

## Merge-Gate

- [ ] Alle Ordner 01 bis 22 sind gemerged; es gibt keinen parallelen Umbau an den betroffenen `packages/ui`-APIs.
- [ ] Alle produktiven Web-Nutzer der verschobenen Button- und Formularbausteine sind erneut inventarisiert.
- [ ] Dark und Light sowie Mobile, Tablet und Desktop sind mit Vorher-/Nachher-Screenshots dokumentiert.
- [ ] Kontaktformular und LinkedIn-Generator bestehen ihre Conversion-, Formular- und A11y-Smokes.
- [ ] Workspace-Darstellung und -Tests bleiben unverändert grün.
- [ ] `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` und `pnpm --filter @invessiv/web build` sind grün.

## Rollback

Reiner Code-Revert des Web-PRs. Die Zentralisierung in `packages/ui` und alle CRM-Einheiten bleiben bestehen.
