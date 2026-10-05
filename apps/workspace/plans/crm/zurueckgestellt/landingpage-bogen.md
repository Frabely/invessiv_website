# Zurückgestellt — Vorlage „Landingpage-Onboarding“

> **Status:** nur geplant, nichts umgesetzt. Entstanden am 04.10.2026 zusammen mit
> [Paket D](../18-portal-prozess-nacharbeiten/D-standardbogen-website-onboarding.md). Der Owner entscheidet nach den
> ersten echten Projekten mit dem Standardbogen, ob er diese zweite Vorlage braucht.
>
> **Abgleich 05.10.2026:** Gegen den Ist-Stand geprüft (Migrationen `0052` und `0053`). Alle unten genannten
> Baustein- und Feld-Keys existieren im Katalog, die Obergrenzen der Listen stimmen. Der Katalog hat 31 Bausteine:
> die 22 des Standardbogens und neun Zusatz-Bausteine aus
> [Paket D2](../18-portal-prozess-nacharbeiten/D2-zusatz-bausteine.md). Es gibt weiterhin genau eine Vorlage,
> „Website-Onboarding“.

## Ziel

Ein Kunde, der „nur“ eine Landingpage bucht, soll inhaltlich gut abgeholt, aber nicht überfordert werden. Die
Landingpage-Vorlage ist eine abgeschwächte Fassung des Standardbogens „Website-Onboarding“: weniger Schritte, weniger
Fragen je Schritt, dieselbe Pflicht-Regel (Dreier-Auslöser, Freitexte nie Pflicht).

## Offene Grundsatzfrage

| Weg                               | Was es bedeutet                                                                            | Bewertung                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A · Teilmenge**                 | Zweite Vorlage aus denselben Katalog-Bausteinen, nur weniger davon. Keine neuen Bausteine. | Sofort machbar im Katalog-Editor, ohne Migration. Fragen je Baustein bleiben aber so lang wie im Standardbogen.                                                               |
| **B · Eigene schlanke Bausteine** | Für gekürzte Bausteine eigene Katalog-Bausteine (eigener Key).                             | Genau zugeschnitten, aber doppelte Pflege. Die Vorbefüllung aus einem früheren Bogen greift über `source_block_id` und damit **nicht** zwischen schlanker und voller Fassung. |

Empfehlung: mit **A** starten (der Owner entfernt im Bogen einzelne Felder, wo nötig) und erst bei wiederholtem
Bedarf auf B gehen.

## Zuschnitt je Baustein

„identisch“ = Baustein unverändert übernehmen. Die Feld-Keys beziehen sich auf Paket D. „Höchstens n Einträge“ senkt
die heutige Obergrenze der Liste (`offers` 30, `testimonials` 20, `faq` 50, `references` 15).

| #   | Baustein (`key`)          | Landingpage                                                                                                                                  |
| --- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `project_contacts`        | identisch                                                                                                                                    |
| 2   | `project_services`        | identisch                                                                                                                                    |
| 3   | `company_profile`         | ohne `employee_count`, `competitors`                                                                                                         |
| 4   | `target_audience`         | identisch                                                                                                                                    |
| 5   | `offers`                  | höchstens 5 Einträge; ohne `scope_process`, `notes`, `main_offer`                                                                            |
| 6   | `about_us`                | entfällt                                                                                                                                     |
| 7   | `team`                    | entfällt (bei Bedarf einzeln hinzufügen)                                                                                                     |
| 8   | `testimonials_references` | nur Kundenstimmen (`has_testimonials`, `testimonials`), höchstens 5; ohne `has_examples`, `examples`                                         |
| 9   | `trust_signals`           | ohne `review_links`                                                                                                                          |
| 10  | `faq`                     | höchstens 10 Einträge                                                                                                                        |
| 11  | `texts_tone`              | ohne `technical_language`, `terms`                                                                                                           |
| 12  | `brand_assets`            | identisch                                                                                                                                    |
| 13  | `brand_colors_fonts`      | identisch                                                                                                                                    |
| 14  | `design_direction`        | Auslöser `has_design_idea`, nur die Regler `modern_classic`, `minimal_expressive`, `serious_casual`, dazu `desired_feeling`, `avoid_feeling` |
| 15  | `reference_websites`      | höchstens 5 Einträge                                                                                                                         |
| 16  | `media_assets`            | identisch                                                                                                                                    |
| 17  | `existing_website`        | nur `has_website`, `current_url`                                                                                                             |
| 18  | `search_visibility`       | entfällt                                                                                                                                     |
| 19  | `domain_services`         | identisch                                                                                                                                    |
| 20  | `contact_social`          | ohne `contact_notes`, `has_multiple_locations`, `locations`                                                                                  |
| 21  | `legal`                   | identisch                                                                                                                                    |
| 22  | `closing`                 | identisch                                                                                                                                    |

Ergebnis: 19 statt 22 Schritte. Bei Weg A sind es die 19 Bausteine in voller Länge; bei Weg B wären 10 davon eigene
schlanke Fassungen (3, 5, 8, 9, 10, 11, 14, 15, 17, 20).

## Zusatz-Bausteine aus Paket D2

Die neun Zusatz-Bausteine stehen nur im Katalog und gehören zu keiner Vorlage. Für eine Landingpage kommen in Frage:

| Baustein (`key`) | Einschätzung für die Landingpage                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `campaign_ads`   | Naheliegend: Angebot, Dringlichkeit, Herkunft der Besucher, Erfahrung mit Anzeigen, Ablauf nach einer Anfrage. |
| `inquiry_forms`  | Nur wenn die Landingpage ein besonderes Formular hat (eigene Felder, eigener Empfänger).                       |
| `newsletter`     | Nur wenn die Seite auf eine Newsletter-Anmeldung zielt.                                                        |
| `downloads`      | Nur wenn die Seite eine Datei anbietet (z. B. Checkliste gegen E-Mail-Adresse).                                |
| übrige fünf      | `blog_news`, `careers`, `products_pricing`, `events`, `languages`: nur bei entsprechend gebuchtem Thema.       |

Kein Zusatz-Baustein fragt nach der gewünschten Handlung des Besuchers; das bleibt bei
`target_audience.desired_actions`.

## Was vor einer Umsetzung zu klären ist

1. Weg A oder B.
2. Ob `campaign_ads` fest in die Landingpage-Vorlage gehört (dann 20 Schritte) oder je Projekt von Hand dazukommt.
   Der früher erwogene eigene Fokus-Baustein ist damit erledigt: Angebot und Herkunft der Besucher fragt
   `campaign_ads`, die gewünschte Handlung `target_audience.desired_actions`.
3. Name und Beschreibung der Vorlage.

## Umsetzung (wenn es so weit ist)

- Weg A: Vorlage im Katalog-Editor anlegen, keine Migration nötig. Soll sie auf allen Umgebungen gleich sein, kommt
  sie als additive Migration (nur `INSERT` in `questionnaire_templates` und `questionnaire_template_blocks`).
- Weg B: additive Migration nach dem Muster `0053` (nur `INSERT`, feste Ids) mit den schlanken Bausteinen und der
  Vorlage. Die Baustein-Keys müssen neu sein, weil Keys im Katalog eindeutig sind.
- In beiden Fällen: Migrationsnummer im Repository ermitteln (`0052` und `0053` werden nicht mehr geändert) und die
  neue Datei in die Liste von `packages/db/src/record-configuration/crm/onboarding-catalog-migrations.test.ts`
  aufnehmen.
