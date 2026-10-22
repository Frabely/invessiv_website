# Vercel Analytics — Auswertungs-Leitfaden

> **Stichtag:** _noch offen_ — Datum des Production-Deploys von `feat/vercel-analytics-v2` hier eintragen.
> Im Dashboard immer einen eigenen Zeitraum **ab Stichtag** wählen. Davor liegen die alten Events
> (`cta_click`, `form_start`, `lead_submit_success` …); sie werden bei Vercel nicht gelöscht und tauchen ab dem Stichtag
> nicht mehr auf.

## Vorbereitung (einmalig)

1. Eigene Geräte ausschließen: `https://invessiv.com/de?analytics=off` auf jedem eigenen Browser/Handy einmal öffnen.
   Rückgängig mit `?analytics=on`.
2. Dashboard: Projekt → **Analytics** → Umgebung **Production**, Zeitraum ab Stichtag.
3. Für Startseite-Analysen das **Routes**-Panel nutzen (`/[locale]` fasst `/de` und `/en` zusammen); das Pages-Panel
   trennt die Sprachen.

## Grenzen von Vercel (bewusst akzeptiert)

- Besucher werden über einen täglich wechselnden Hash gezählt — keine Wiedererkennung über mehrere Tage.
- Die **Bounce Rate** zählt nur Ein-Seiten-Besuche; Events zählen nicht. Für den One-Pager `/de` ist sie wertlos —
  stattdessen die Abschnittskurve (`section_reached`) und `page_engaged` nutzen.
- Verhältnisse zwischen Events sind Quoten, keine nachgewiesenen Einzelpfade (dafür bräuchte es einen Drain).
- `lead_created` kommt vom Server und hat keine Seiten-/Geräte-/UTM-Zuordnung; dafür ist `form_completed` da.

## Die Kernfragen

### 1. Wie viele unterschiedliche Besucher, woher?

- Kopfzahl **Visitors**, Panel **Referrers** (Drill-down auf Domains), **Countries**, **Devices**.
- Mit Web Analytics Plus zusätzlich Panel **UTM** (Kampagne = einzelner LinkedIn-Post).

### 2. Wo springen Besucher ab, wie weit scrollen sie? (Absprungkurve)

- Events → `section_reached` → nach `section` aufteilen, Filter Route `/[locale]` (bzw. `/[locale]/references`).
- Die Spalte **Visitors** je Abschnitt in Seitenreihenfolge lesen:
  `hero → problem → usp → services → references → process → faq → contact → footer`.
- Der größte relative Einbruch zwischen zwei Abschnitten ist die Absprungstelle.
- `page_engaged` (30 s sichtbar) ÷ Besucher der Route = Anteil echter Leser.

### 3. Welche CTAs werden geklickt?

- Events → `cta_clicked` → nach `cta` aufteilen (z. B. `home_hero_primary`, `home_services_select`, `header_primary`).
- Navigation separat: `nav_clicked` → `item` + `area` (header, header_mobile, footer, faq).
- Interesse an Inhalten: `option_selected` (Leistungs- und Referenzauswahl), `reference_opened`, `faq_opened`.

### 4. Wer startet das Formular, wer sendet ab, wo scheitert es?

| Schritt | Event             | Bedeutung                                                                      |
| ------- | ----------------- | ------------------------------------------------------------------------------ |
| 1       | `form_started`    | erste echte Eingabe (`placement`: home_contact, landing_final, linkedin_final) |
| 2       | `form_submitted`  | Klick auf Absenden (`form`: discovery_call oder quick_contact)                 |
| 3a      | `form_invalid`    | Validierung scheitert, `field` = erstes fehlerhaftes Feld                      |
| 3b      | `form_failed`     | Server-/Netzfehler, `reason`                                                   |
| 4       | `form_completed`  | Anfrage angenommen (Client, segmentierbar nach Gerät/Seite)                    |
| 5       | `lead_created`    | **maßgebliche Lead-Zahl** (Server, nach DB-Speicherung)                        |
| 6       | `calendar_opened` | Calendly geöffnet (`after_submit` oder `success_page`)                         |

- Abbruchquote = 1 − `form_submitted` ÷ `form_started`.
- `form_completed` < `lead_created` ist normal (Adblocker blockieren Client-Events).
- Echte Termin-Buchungen sind mit Calendly Free nicht messbar → monatlich manuell aus Calendly gegen
  `calendar_opened` vergleichen.

### 5. Wo treten auf Mobilgeräten Fehler auf?

- Filter **Devices = Mobile**, dann `form_invalid` → `field` und `form_failed` → `reason` gegen Desktop vergleichen.

### 6. Führt der Generator zu Kontaktinteresse? (nebensächlich)

- `generator_step` → `step` (start, submit, success, error, download, copy).
- Danach Filter Route `/[locale]/services/linkedin-post` und `form_started` mit `placement=linkedin_final`.

## Terminal statt Dashboard (Vercel CLI)

Verfügbare Dimensionen vorher mit `vercel metrics schema vercel.analytics` prüfen.

```bash
# Events ab Stichtag nach Name
vercel metrics vercel.analytics.event.count --group-by eventName --since 30d --project <projekt> --prod

# CTA-Ranking getrennt nach Gerät
vercel metrics vercel.analytics.event.count --filter 'eventName:cta_clicked' --group-by deviceType --since 30d --project <projekt> --prod
```

Für Gruppierung nach Event-Eigenschaften die REST-API `GET /v1/query/web-analytics/events/aggregate` mit
`by=eventData/section` bzw. `filter=eventName eq 'section_reached'` nutzen.

## UTM-Konvention für eigene Links (ab Web Analytics Plus auswertbar)

```text
?utm_source=linkedin&utm_medium=post&utm_campaign=2026-11-kurztitel
?utm_source=linkedin&utm_medium=profile&utm_campaign=profil-link
?utm_source=visitenkarte&utm_medium=qr&utm_campaign=2026-druck
```

Nur Kleinbuchstaben, Ziffern, `-`, `_`, `.` (max. 64 Zeichen). Andere Werte verwirft der Sanitizer. Keine Namen oder
E-Mail-Adressen in UTM-Werten.

## Wochenroutine (10 Minuten)

1. Visitors + Referrers der Woche notieren.
2. Absprungkurve Startseite: größter Einbruch?
3. Top-3 CTAs und Formular-Funnel (Starts → Leads).
4. Mobile-Fehler prüfen.
5. Änderungen an der Seite mit Datum hier dokumentieren, damit Effekte zuordenbar bleiben.

## Änderungslog

| Datum      | Änderung                                                   |
| ---------- | ---------------------------------------------------------- |
| _Stichtag_ | Neues Eventmodell live (siehe `vercel-analytics-umbau.md`) |
