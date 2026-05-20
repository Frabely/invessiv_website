# Rückbau des temporären `ENABLE_MARKETING_PROOF`-Launch-Gates

Diese Notiz beschreibt exakt, wie der temporäre Env-Check später wieder entfernt wird, nachdem Reviews und Projects dauerhaft live sein sollen.

Ziel: kein toter Flag-Code, keine übrig gebliebenen Test-Helfer, keine nutzlosen Props, keine Rückbau-Lücken in Sitemap oder Redirects.

## Betroffene Dateien

Geänderte Bestandsdateien:

- `apps/web/src/app/[locale]/page.tsx`
- `apps/web/src/app/[locale]/projects/page.tsx`
- `apps/web/src/app/sitemap.ts`
- `apps/web/src/components/marketing/home/home-sections-renderer.tsx`
- `apps/web/src/components/marketing/home/marketing-home-page-client.tsx`
- `apps/web/src/components/marketing/home/home-sections-renderer.test.tsx`
- `apps/web/src/proxy.ts`

Nur für das temporäre Launch-Gate neu angelegte Dateien:

- `apps/web/src/config/marketing-launch.ts`
- `apps/web/src/config/marketing-launch.test.ts`
- `apps/web/src/app/[locale]/projects/page.test.tsx`

## Rückbau in konkreten Schritten

### 1. Zentrale Flag-Datei vollständig löschen

Diese Datei wurde ausschließlich für den temporären Launch-Hebel angelegt und soll danach komplett entfernt werden:

- `apps/web/src/config/marketing-launch.ts`

Inhalt, der dadurch verschwindet:

- `isMarketingProofEnabled()`

### 2. Flag-Test vollständig löschen

Auch dieser Test existiert nur wegen des temporären Flags und soll danach komplett entfernt werden:

- `apps/web/src/config/marketing-launch.test.ts`

### 3. Home-Page wieder ohne Flag-Prop verdrahten

In `apps/web/src/app/[locale]/page.tsx`:

- Import `isMarketingProofEnabled` entfernen
- `MarketingHomePageClient showProofSection={isMarketingProofEnabled()}` zurückbauen zu:
  - `MarketingHomePageClient`

In `apps/web/src/components/marketing/home/marketing-home-page-client.tsx`:

- `MarketingHomePageClientProps` vollständig entfernen
- Prop `showProofSection` aus der Funktionssignatur entfernen
- Übergabe `showProofSection={showProofSection}` an `HomeSectionsRenderer` entfernen

In `apps/web/src/components/marketing/home/home-sections-renderer.tsx`:

- Prop `showProofSection: boolean` aus `HomeSectionsRendererProps` entfernen
- `showProofSection` aus der Funktionssignatur entfernen
- den Guard im `proof`-Branch entfernen:
  - `if (!showProofSection) { return null; }`

Erwarteter Endzustand:

- Die Proof-Section rendert wieder immer, sobald sie im Section-Content vorhanden ist.

### 4. Projects-Route wieder dauerhaft aktiv machen

In `apps/web/src/app/[locale]/projects/page.tsx`:

- Import `redirect` wieder entfernen, falls danach ungenutzt
- Import `isMarketingProofEnabled` entfernen
- den `generateMetadata`-Sonderfall komplett löschen:
  - `if (!isMarketingProofEnabled()) { return { robots: { index: false, follow: false } }; }`
- den Redirect-Block im Seiten-Body komplett löschen:
  - `if (!isMarketingProofEnabled()) { redirect(\`/${activeLocale}\`); }`

Erwarteter Endzustand:

- `generateMetadata` liefert wieder immer die echte Projects-Metadata
- `/de/projects` und `/en/projects` rendern wieder direkt die Projects-Seite

### 5. Projects-Sitemap dauerhaft wieder aufnehmen

In `apps/web/src/app/sitemap.ts`:

- Import `isMarketingProofEnabled` entfernen
- lokale Variable `entries` zurück auf ein direktes `return [...]` reduzieren, wenn keine andere Zwischenlogik mehr nötig ist
- den kompletten konditionalen Block entfernen:
  - `if (isMarketingProofEnabled()) { entries.splice(...) }`
- diese beiden Einträge wieder direkt fest in die Sitemap setzen:
  - `${SITE_URL}/de/projects`
  - `${SITE_URL}/en/projects`

Erwarteter Endzustand:

- Beide Projects-URLs sind wieder dauerhaft in der Sitemap enthalten.

### 6. Legacy-Redirect `/projects` wieder auf die Projects-Seite setzen

In `apps/web/src/proxy.ts`:

- Import `isMarketingProofEnabled` entfernen
- ternäre Sonderlogik in `targetPath` entfernen:
  - `request.nextUrl.pathname === "/projects" && isMarketingProofEnabled() ? "/de/projects" : ...`
- `LEGACY_REDIRECTS["/projects"]` zurückbauen von:
  - `"/de"`
  - auf:
  - `"/de/projects"`

Erwarteter Endzustand:

- Ein manueller Aufruf von `/projects` leitet wieder dauerhaft nach `/de/projects`.

### 7. Temporären Projects-Route-Test vollständig löschen

Diese Testdatei wurde nur eingeführt, um das Flag-Verhalten für Redirect vs. Render zu prüfen. Nach Entfernung des Flags soll sie komplett gelöscht werden:

- `apps/web/src/app/[locale]/projects/page.test.tsx`

Grund:

- Sie testet ausschließlich den temporären Launch-Gate-Pfad und hat danach keinen eigenständigen Wert mehr.

### 8. Home-Renderer-Test auf den dauerhaften Zustand zurückbauen

In `apps/web/src/components/marketing/home/home-sections-renderer.test.tsx`:

- in bestehenden Render-Aufrufen `showProofSection={true}` entfernen
- den zusätzlichen Test komplett entfernen:
  - `it("does not render the proof section while the launch flag is disabled", ...)`

Wichtig:

- Der zusätzliche Import `@testing-library/jest-dom/vitest` wurde in dieser Datei nur für den neuen Negativtest ergänzt.
- Prüfen, ob er nach Rückbau noch benötigt wird.
- Falls in der Datei danach kein Matcher wie `toBeInTheDocument()` mehr verwendet wird, diesen Import ebenfalls entfernen.

## Dateien, die nach dem Rückbau gelöscht sein müssen

Diese Dateien dürfen nach dem Entfernen des Env-Gates nicht mehr im Repo liegen:

- `apps/web/src/config/marketing-launch.ts`
- `apps/web/src/config/marketing-launch.test.ts`
- `apps/web/src/app/[locale]/projects/page.test.tsx`

## Repo-weiter Abschluss-Check

Nach dem Rückbau diese Suchen ausführen und auf `0` Treffer bestehen:

```powershell
rg -n "ENABLE_MARKETING_PROOF|isMarketingProofEnabled|showProofSection" apps packages docs
```

Zusätzlich prüfen:

```powershell
rg -n '"/projects": "/de"' apps/web/src/proxy.ts
rg -n "robots: \\{\\s*index: false,\\s*follow: false" apps/web/src/app/[locale]/projects/page.tsx
```

Die erste Suche darf nach dem Rückbau keinen Treffer mehr liefern.
Die zweite und dritte Suche dürfen ebenfalls keinen Treffer mehr liefern.

## Verifikation nach dem Rückbau

Nach dem Entfernen des Gates mindestens ausführen:

```powershell
pnpm --filter @invessiv/web typecheck
pnpm --filter @invessiv/web test home-sections-renderer
```

Zusätzlich fachlich prüfen:

1. `/de` zeigt die Review-/Proof-Section wieder an.
2. `/en` zeigt die Review-/Proof-Section wieder an.
3. `/de/projects` ist direkt erreichbar.
4. `/en/projects` ist direkt erreichbar.
5. `/projects` leitet wieder nach `/de/projects`.
6. `sitemap.xml` enthält wieder `/de/projects` und `/en/projects`.

## Erwarteter Endzustand

Wenn der Rückbau korrekt durchgeführt wurde, gibt es:

- keinen Env-Check mehr
- keine Launch-Flag-Hilfsfunktion mehr
- keine nur für das Gate angelegten Tests mehr
- keine unnötige Prop-Weitergabe mehr
- keine temporären Redirect-/Noindex-Sonderfälle mehr

Damit bleibt nach dem Go-live kein nutzloser oder toter Code zurück.
