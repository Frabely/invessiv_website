# Task 02e-2 — Web auf den geteilten Button umstellen

> **Teil von:** [Task 02e](./02e-geteilte-ui-bausteine.md) · **Merge-Einheit:** Ordner 03d · **Branch:**
> `chore/crm-geteilte-ui-bausteine`
> **Tickets:** CRM-03d-T2 · **Abhängigkeiten:** Task 02e-1
> **Changeset:** ~22 Dateien (Ziel ≤ 30, Stopp > 35, hart 50) · **Aufwand:** S

## Ziel

Die Web-App nutzt den Button aus `packages/ui`; danach existiert keine Button-Kopie mehr in den Apps. Dieser Task
berührt die Conversion-Flows der Website und steht deshalb für sich.

Dieser Schritt ändert die Web-Optik bewusst nicht. Die gestalterische Anpassung von `ButtonControl`, `ButtonLink`,
`PrimaryCtaButton` und `PrimaryCtaLink` samt aller Web-Nutzer ist in
[Ordner 23, Task 39](../23-web-ui-abschluss/39-web-ui-anpassung.md) erfasst und wird erst nach dem vollständigen
CRM-Umbau als eigener Web-PR umgesetzt.

## CRM-03d-T2 — Web auf den geteilten Button umstellen

- 17 Web-Nutzer umstellen; `references-closing-cta` übergibt `linkComponent={Link}`.
- `apps/web/src/app/globals.css` definiert `--button-disabled-opacity: 0.5` und
  `--button-disabled-filter: saturate(0.7)`.
- Web-Test mit dem Button-Test in `packages/ui` zusammenführen (Obermenge), Web-Kopie löschen.
- **Akzeptanz:** Conversion-Gate: Kontaktformular und LinkedIn-Generator (Submit, Disabled-Zustand, CTA-Ziele) manuell
  geprüft; kein toter CTA; Web visuell unverändert.

## Changeset

| Bereich                                                | Dateien                                                                                                                                                                               | Anzahl |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| `packages/ui`                                          | `components/button/button.test.tsx` (Web-Fälle ergänzt)                                                                                                                               |      1 |
| Web-Tokens                                             | `apps/web/src/app/globals.css`                                                                                                                                                        |      1 |
| Web-Kopie gelöscht                                     | `apps/web/src/components/shared/button/{button.tsx,button.module.css,button.test.tsx}`                                                                                                |      3 |
| Nutzer Startseite (`marketing/home/sections/`)         | `contact-section/contact-form`, `hero-section`, `process-section`, `references-section/references-showcase`, `services-section/{featured-service-card,selected-service,service-card}` |      7 |
| Nutzer Landingpage (`marketing/landing/`)              | `audience-section/audience-detail-panel`, `pricing-section`                                                                                                                           |      2 |
| Nutzer LinkedIn-Generator (`marketing/linkedin-post/`) | `generator-section/{generator-form,limit-reached-preview,result-download-card,success-preview}`, `hero-section`                                                                       |      5 |
| Weitere Nutzer                                         | `marketing/references/references-page/references-closing-cta`, `marketing/site-header`, `shared/success-page`                                                                         |      3 |
|                                                        |                                                                                                                                                                                       | **22** |

## Abschluss

- `pnpm -r lint`, `pnpm -r typecheck`, Tests `packages/ui` und `apps/web` grün; `pnpm --filter @invessiv/web build`
  grün, weil Web-Conversion-Flows betroffen sind.
- Screenshots Startseite (Hero, Services, Kontakt), Landingpage-Pricing, LinkedIn-Generator (Mobil/Desktop, Dark/Light).
- Changeset gemessen und in der Übergabe genannt.
