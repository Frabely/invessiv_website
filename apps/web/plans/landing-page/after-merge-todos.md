# After-Merge-Todos — Landing-Page Google Tracking & Consent

Operative Schritte, die **nach dem Merge und Deploy** erledigt werden müssen, damit GA4 + Google Ads Conversion
Tracking auf `/services/landing-page` und der Success-Route korrekt laufen. Der Code ist fertig (Tasks 1–7); diese
Liste ist rein operativ (kein Code mehr nötig).

> Reihenfolge-Hinweis: **Zuerst mergen und deployen.** Google (Tag Assistant, Ads-Diagnose, „Tag erkannt") sieht das
> `gtag.js` erst, wenn es auf einer erreichbaren URL (Production oder Vercel-Preview) ausgeliefert wird. Lokal lässt
> sich
> das Verhalten prüfen, aber die offizielle Tag-Erkennung von Google braucht die deployte Seite.

## 1. Env-Variablen (müssen noch korrigiert werden)

> Status: Werte sind vorläufig gesetzt und **müssen nach Anlegen der Conversion-Aktion korrigiert werden** (siehe
> Schritt 2). Solange ID/Label nicht stimmen, no-op't die Ads-Conversion sauber — GA4 läuft trotzdem.

```
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-5T4BC28Z0F             # korrekt, bleibt so
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID=AW-XXXXXXXXXX      # mit "AW-"-Präfix (Teil VOR dem "/")
NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL=AbCdEfGhIjK...  # nur das Label (Teil NACH dem "/")
```

Wie der Code die Werte nutzt:

- `gtag('config', '<ID>')` und `send_to: '<ID>/<Label>'`
- Quelle: `apps/web/src/lib/analytics/google-tag/google-tag-config.ts` + `google-tag-script.ts` +
  `lib/analytics/google-ads-conversion/conversion-event.ts`

Wichtig:

- `NEXT_PUBLIC_*` wird **zur Build-Zeit eingebacken** → nach jeder Wert-Korrektur **neu deployen**, sonst greift es
  nicht.
- In Vercel für **Production und Preview** setzen (Project → Settings → Environment Variables), lokal in
  `apps/web/.env.local`.

## 2. Conversion-Aktion in Google Ads anlegen (liefert ID + Label)

1. Google Ads → **Ziele → Conversions → Neue Conversion-Aktion → Website**.
2. Aktion anlegen, z. B. „**Angebotsanfrage Landingpage**".
3. Bei der Tag-Einrichtung „**Tag selbst hinzufügen / Event-Snippet**" wählen. Dort steht:
   ```js
   gtag("event", "conversion", { send_to: "AW-XXXXXXXXXX/AbCdEfGhIjK..." });
   ```
   - Teil **vor** dem `/` → `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID` (mit `AW-`)
   - Teil **nach** dem `/` → `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`
4. Env-Vars korrigieren (Schritt 1) → **redeploy**.
5. Conversion-Aktion als **primär** für die Gebotsoptimierung markieren.
6. Landingpage-Besuch und CTA-Klicks **nicht** als primäre Conversion konfigurieren (bleiben sekundäre Events).

## 3. GA4 ↔ Google Ads verknüpfen

- Google Ads → **Tools → Verknüpfungen → Google Analytics 4** verknüpfen.
- Vorteil: bessere Attribution, Zielgruppen später nutzbar.
- GA4-Datenstream für `G-5T4BC28Z0F` muss aktiv sein.

## 4. Legal-Freigabe (vor/zum Merge)

- Die Datenschutz-Änderung (neuer Abschnitt „Google Analytics 4 und Google Ads", korrigierter Cookies-Abschnitt,
  Empfänger + Drittland um Google) unterliegt der **Legal-Merge-Regel: zwei Reviews**.
- Finale Freigabe durch die rechtlich verantwortliche Person (die recherchierten Quellen im Plan sind Fachartikel,
  keine Rechtsberatung).

## 5. Manueller Test (nach Deploy)

Auf der deployten URL `…/de/services/landing-page`:

**Browser-DevTools:**

- **Consent-Banner**: erscheint beim ersten Besuch. Application → Local Storage → Consent-Key gesetzt nach
  Accept/Reject; Banner kommt danach nicht wieder.
- **Default denied vor Auswahl**: Network → Filter `googletagmanager` / `collect` / `google` → vor Klick nur
  **cookielose Pings**, keine `_ga`-Cookies (Application → Cookies). Nach „Alle akzeptieren" → `consent update` + volle
  Hits.
- **Conversion**: Formular real absenden → Redirect auf `…/success` → **genau ein** `conversion`-Hit mit
  `send_to=AW-…/Label`. **Reload (F5)/Zurück** auf Success feuert **nicht** erneut (Guard konsumiert). **Direktaufruf**
  der Success-URL feuert **nicht**.
- **Inkognito** zusätzlich für frischen Consent-Zustand.
- **Mobile (360 px)**: Banner verdeckt den Haupt-CTA nicht dauerhaft.

**Google-Tooling:**

- **Google Tag Assistant** (`tagassistant.google.com` → Domain hinzufügen): zeigt live, welche Tags (GA4 + `AW-`) feuern
  und mit welchem Consent-State.
- **Google Ads → Ziele → Conversions → Diagnose**: Tag-/Consent-Probleme; Status wechselt von „Keine aktuellen
  Conversions" zu „Conversions werden aufgezeichnet" (kann **Stunden** dauern).

## 6. Wo du die Auswertung siehst

- **GA4 → Berichte → Echtzeit**: `page_view` der Landing-/Success-Seite in Sekunden (schnellste Sofort-Kontrolle).
- **GA4 → Berichte → Engagement**: Funnel, Absprünge, Engagement, Quellen der Landingpage.
- **Google Ads → Ziele → Conversions**: aufgezeichnete Angebotsanfragen (mit Verzögerung von oft mehreren Stunden).
- **Vercel Analytics** (Vercel Dashboard → Analytics): cookielose Sekundär-Events wie `cta_click`,
  `faq_exit_services_click`,
  Formular-Events — unabhängig vom Google-Consent.

## 7. Offen / später

- **Playwright E2E-Smoke** für den Kernablauf — ausgelagert nach `apps/web/plans/Todo.md` (Abschnitt „Landing-Page
  Tracking/Consent: Playwright E2E-Smoke").
- **Enhanced Conversions for Leads** (gehashte E-Mail an das Conversion-Event) — V2-Follow-up, nicht im ersten Go; bei
  Aktivierung muss die Datenschutzerklärung ergänzt werden.
