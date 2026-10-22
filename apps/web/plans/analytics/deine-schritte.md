# Analytics — deine Schritte

## Vor dem Merge

1. Diff reviewen, committen, PR von `feat/vercel-analytics-v2` öffnen.
2. Datenschutztext DE/EN gegenlesen (`src/i18n/dictionaries/legal/privacy/*.json`, Abschnitt „Vercel Web Analytics“).
3. Preview-Deploy öffnen → Vercel-Dashboard → Analytics → Umgebung **Preview** → Startseite durchscrollen, CTA klicken,
   Formular falsch und richtig absenden → Events erscheinen nach ein paar Minuten.
4. Nur falls die Preview passwortgeschützt ist: Projekt-Settings → Deployment Protection → „Protection Bypass for
   Automation“ anlegen, sonst kommt `lead_created` aus der Preview nicht an.

## Nach dem Production-Deploy

1. Datum als **Stichtag** in `plans/analytics/auswertung.md` (oben + Änderungslog) eintragen.
2. In jedem eigenen Browser (auch jedem Chrome-Profil und auf dem Handy) einmal öffnen:
   `https://invessiv.com/de?analytics=off` (mit `?`, nicht `/analytics=off`). Gilt dauerhaft, bis Websitedaten
   gelöscht werden; Inkognito-Fenster zählen trotzdem. Prüfen: DevTools → Local Storage → `www.invessiv.com` →
   `invessiv:analytics-disabled = 1`. Rückgängig: `?analytics=on`.
3. Dashboard immer mit Zeitraum **ab Stichtag** und Umgebung **Production** ansehen.

## Wöchentlich (10 Minuten)

Routine siehe `auswertung.md` → „Wochenroutine“: Besucher, Absprungkurve, Top-CTAs, Formular-Funnel, Mobile-Fehler.

## Monatlich

- Calendly-Buchungen manuell zählen und mit `calendar_opened` vergleichen.

## Wenn die LinkedIn-Posts starten

1. Vercel → Team Settings → Billing → Add-ons → **Web Analytics Plus** aktivieren (10 $/Monat).
2. Jeden geteilten Link mit UTM versehen: `?utm_source=linkedin&utm_medium=post&utm_campaign=2026-11-kurztitel`.
3. Im Dashboard Panel **UTM** → Kampagne anklicken → Events-Panel zeigt, was der Post ausgelöst hat.
