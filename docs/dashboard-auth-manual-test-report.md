# Dashboard Auth Manual Test Report

Datum: 2026-04-30

Scope: Ticket 8 aus `plans/dashboard/clerk-auth-and-shell.md`.

## Ergebnis

Die automatisierbaren Checks fuer Redirects, noindex/dynamic Rendering, Legacy-Redirects und Public-Nav-Verhalten sind ueber Unit-/E2E-Gates abgedeckt. Die echten Clerk-Login-Szenarien bleiben ein manueller Owner-Check, weil dafuer interaktive Test-Accounts und Clerk-Session-Cookies benoetigt werden.

## Szenarien

| #   | Szenario                                     | Status            | Nachweis                                                                                                                              |
| --- | -------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Nicht eingeloggt -> `/de/dashboard`          | Verifiziert       | `src/proxy.test.ts` prueft locale-aware Redirect zu `/de/sign-in?redirect_url=%2Fde%2Fdashboard`.                                     |
| 2   | Nicht erlaubter Test-User -> `/de/dashboard` | Owner-Check offen | Erfordert echten Clerk-Test-Login mit nicht allowlisteter E-Mail. Erwartung: `notFound()` / HTTP 404.                                 |
| 3   | Allowlist-User -> `/de/dashboard`            | Owner-Check offen | Erfordert Clerk-Test-Login mit E-Mail aus `DASHBOARD_ALLOWED_EMAILS`. Erwartung: deutsche Dashboard-Headline.                         |
| 4   | Owner -> `/en/dashboard`                     | Owner-Check offen | Erfordert Clerk-Test-Login mit E-Mail aus `DASHBOARD_ALLOWED_EMAILS`. Erwartung: englische Dashboard-Headline.                        |
| 5   | `/de` ohne sichtbaren Dashboard-Link         | Verifiziert       | Bestehende Public-Nav-E2E decken Header/Links ab; Dashboard ist nicht in der Public Navigation verlinkt.                              |
| 6   | `/de/sign-in` direkt                         | Teilverifiziert   | Route, Metadata und Auth-Frame sind implementiert; finale Clerk-Form-Sprache im Browser per Owner-Login pruefen.                      |
| 7   | `/en/sign-in` direkt                         | Teilverifiziert   | Route, Metadata und Auth-Frame sind implementiert; finale Clerk-Form-Sprache im Browser per Owner-Login pruefen.                      |
| 8   | Legacy `/imprint`                            | Verifiziert       | `src/proxy.test.ts` prueft 308 Redirect zu `/de/imprint`.                                                                             |
| 9   | `/de/dashboard` Cache-Control                | Teilverifiziert   | `dynamic = "force-dynamic"` und `revalidate = 0` sind gesetzt; Header im laufenden Preview/Local Browser pruefen.                     |
| 10  | `/de/dashboard` robots noindex,nofollow      | Verifiziert       | `generateMetadata()` setzt `robots: { index: false, follow: false, nocache: true }`; Build zeigt `/[locale]/dashboard` als dynamisch. |

## Noch noetig vor finalem Merge

1. Mit einem nicht allowlisteten Clerk-Test-User `/de/dashboard` aufrufen und 404 bestaetigen.
2. Mit einem allowlisteten Clerk-Test-User `/de/dashboard` und `/en/dashboard` aufrufen und die jeweilige Locale-Headline bestaetigen.
3. In DevTools fuer `/de/dashboard` den finalen `Cache-Control` Header im Ziel-Environment pruefen.
