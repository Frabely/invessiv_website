# Workspace Auth Manual Test Report

Datum: 2026-04-30

Scope: Ticket 8 aus `plans/workspace/clerk-auth-and-workspace-shell.md`.

## Ergebnis

Die automatisierbaren Checks fuer Redirects, noindex/dynamic Rendering, Legacy-Redirects und Public-Nav-Verhalten sind ueber Unit-/E2E-Gates abgedeckt. Die echten Clerk-Login-Szenarien bleiben ein manueller Owner-Check, weil dafuer interaktive Test-Accounts und Clerk-Session-Cookies benoetigt werden.

## Szenarien

| #   | Szenario                                     | Status            | Nachweis                                                                                                                              |
| --- | -------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Nicht eingeloggt -> `/de/workspace`          | Verifiziert       | `src/proxy.test.ts` prueft locale-aware Redirect zu `/de/sign-in?redirect_url=%2Fde%2Fworkspace`.                                     |
| 2   | Nicht erlaubter Test-User -> `/de/workspace` | Owner-Check offen | Erfordert echten Clerk-Test-Login mit nicht allowlisteter E-Mail. Erwartung: `notFound()` / HTTP 404.                                 |
| 3   | Allowlist-User -> `/de/workspace`            | Owner-Check offen | Erfordert Clerk-Test-Login mit E-Mail aus `WORKSPACE_ALLOWED_EMAILS`. Erwartung: deutsche Workspace-Headline.                         |
| 4   | Owner -> `/en/workspace`                     | Owner-Check offen | Erfordert Clerk-Test-Login mit E-Mail aus `WORKSPACE_ALLOWED_EMAILS`. Erwartung: englische Workspace-Headline.                        |
| 5   | `/de` ohne sichtbaren Workspace-Link         | Verifiziert       | Bestehende Public-Nav-E2E decken Header/Links ab; Workspace ist nicht in der Public Navigation verlinkt.                              |
| 6   | `/de/sign-in` direkt                         | Teilverifiziert   | Route, Metadata und Auth-Frame sind implementiert; finale Clerk-Form-Sprache im Browser per Owner-Login pruefen.                      |
| 7   | `/en/sign-in` direkt                         | Teilverifiziert   | Route, Metadata und Auth-Frame sind implementiert; finale Clerk-Form-Sprache im Browser per Owner-Login pruefen.                      |
| 8   | Legacy `/imprint`                            | Verifiziert       | `src/proxy.test.ts` prueft 308 Redirect zu `/de/imprint`.                                                                             |
| 9   | `/de/workspace` Cache-Control                | Teilverifiziert   | `dynamic = "force-dynamic"` und `revalidate = 0` sind gesetzt; Header im laufenden Preview/Local Browser pruefen.                     |
| 10  | `/de/workspace` robots noindex,nofollow      | Verifiziert       | `generateMetadata()` setzt `robots: { index: false, follow: false, nocache: true }`; Build zeigt `/[locale]/workspace` als dynamisch. |

## Noch noetig vor finalem Merge

1. Mit einem nicht allowlisteten Clerk-Test-User `/de/workspace` aufrufen und 404 bestaetigen.
2. Mit einem allowlisteten Clerk-Test-User `/de/workspace` und `/en/workspace` aufrufen und die jeweilige Locale-Headline bestaetigen.
3. In DevTools fuer `/de/workspace` den finalen `Cache-Control` Header im Ziel-Environment pruefen.
