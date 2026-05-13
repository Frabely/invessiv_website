# Kontaktformular-E2E-Plan vom 2026-05-13

## Status

- Zurueckgestellt.
- Der E2E-Versuch wird nicht weiterverfolgt, bis die unten genannten Voraussetzungen wieder erfuellt sind.
- Die bereits gefundenen Befunde bleiben dokumentiert und dienen als Wiedereinstiegsbasis.

## Ziel

- Die vier kritischen Kontaktfluesse per E2E absichern.
- Fokus auf die Formulare, die echte Besucher benutzen:
  - Home: Projektanfrage
  - Home: Quick Contact
  - Home: Discovery Call
  - Landingpage: finales CTA-/Kontaktformular

## Aktueller Stand

- `npm run build` ist gruen.
- Die neue Playwright-Suite `e2e/contact-lead-persistence.e2e.ts` ist rot.
- Drei Flows schlagen mit `POST /api/public/contact` -> `internal_error` fehl.
- Der Home-Projektanfrage-Flow laeuft in einen Playwright-Timeout von 90 Sekunden.
- Vor dem E2E-Lauf wurde ein echter Server-Bug behoben: `persistSharedLeadSubmission` schrieb `display_name` nicht in
  den Lead-Upsert.

## Erkenntnisse

1. Der Build ist nicht das Problem.
2. Die Persistenzschicht ist nicht mehr der erste naheliegende Defekt fuer `display_name`; dieser Teil wurde bereits
   repariert und durch Unit-Tests abgesichert.
3. Die E2E-Fehler sind aktuell auf den Kontakt-Request und/oder den Flow-Start begrenzt, nicht auf die generelle
   Produktionsfaehigkeit der App.
4. Die Suite braucht eine klare Trennung zwischen:
   - UI-Problem
   - API-Fehler
   - Persistenzfehler
   - Timeout durch nicht ausgeloesten Submit

## Bekannte Befunde

- Fehlgeschlagene Flows:
  - Home Projektanfrage: Timeout
  - Home Quick Contact: `internal_error`
  - Home Discovery Call: `internal_error`
  - Landingpage finales CTA-/Kontaktformular: `internal_error`
- Die Playwright-Artefakte liegen unter `test-results/contact-lead-persistence.*`.
- Die Fehlerantwort der API war strukturiert und enthaelt eine `requestId`.

## Bereits verifiziert

```powershell
npx vitest run --exclude .claude/** src/server/tests/db/contact/shared-lead-submission.test.ts src/server/tests/db/contact/persist-quick-contact.test.ts src/server/tests/db/contact/persist-project-request.test.ts src/server/tests/db/contact/persist-discovery-call.test.ts
```

```powershell
npx tsc --noEmit
```

```powershell
npm run build
```

Alle drei Checks waren gruen.

## Was fehlt, um das wieder aufzunehmen

1. Die exakte Server-Fehlerursache fuer `POST /api/public/contact` pro Request-ID sichtbar machen.
2. Den Projektanfrage-Timeout zerlegen:
   - Wird der Button-Click wirklich ausgelost?
   - Kommt der API-Request an?
   - Antwortet der Server, aber die UI bleibt haengen?
3. Pruefen, ob der Playwright-Setup-State sauber ist:
   - frische DB
   - keine Rate-Limit-Rueckstaende
   - keine unerwuenschte externe Mail-Abhaengigkeit
4. Nach der Analyse die E2E-Suite erneut laufen lassen.

## Wiedereinstiegsplan

1. E2E-Test nur fuer einen einzelnen Flow wieder aktivieren, zuerst den schnellsten `quick_contact`.
2. Den API-Response des Formulars mit Request-ID direkt in den Test-Fehlertext schreiben, falls noch nicht ausreichend.
3. Nach dem ersten gruenen Flow die restlichen drei Flows nacheinander dazunehmen.
4. Erst wenn alle Flows gruen sind, die Suite wieder als Release-Gate behandeln.

## Wiederaufnahme-Commands

```powershell
npx playwright test e2e/contact-lead-persistence.e2e.ts --workers=1 --reporter=list
```

```powershell
npx playwright test e2e/contact-lead-persistence.e2e.ts -g "home quick contact"
```

```powershell
npx playwright test e2e/contact-lead-persistence.e2e.ts -g "home project request"
```

## Abschlusskriterium

- Alle vier Flows liefern eine erfolgreiche Persistenzantwort.
- Kein Flow produziert `internal_error`.
- Der Projektanfrage-Flow laeuft nicht mehr in einen Timeout.
- Der Test bleibt ohne externe Mail-Zustellung stabil.
