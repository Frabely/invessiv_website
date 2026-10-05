# Task 64a — Standardkatalog und Vorlagen (Seed-Inhalt)

> **Abgelöst am 04.10.2026.** Migration `0052_replace_onboarding_standard_catalog.sql` löscht diesen Katalog samt
> beiden Vorlagen und liefert einen neuen. Die gültige inhaltliche Fassung steht in
> [`D-standardbogen-website-onboarding.md`](../../18-portal-prozess-nacharbeiten/D-standardbogen-website-onboarding.md).
> Diese Datei bleibt nur als Beschreibung des Stands von `0048`.

> **Teil von:** Teil-PR 15.2, Ticket CRM-64-T5 ([`64-baustein-katalog-und-vorlagen.md`](./64-baustein-katalog-und-vorlagen.md)).
> **Vor dem Start lesen:** [`63-datenmodell-und-regeln.md`](./63-datenmodell-und-regeln.md) (Feldtypen, Bedingungen,
> Gruppen, Prefill-Quellen). Diese Datei ist die **verbindliche inhaltliche Fassung** des Katalogs; sie ersetzt die
> ursprüngliche Liste des Owners („Standard-Onboarding Webdesign – Portalstruktur“).

## Kurationsregeln (mit dem Owner abgestimmt)

1. **Nichts erneut abfragen, was feststeht.** Gebuchte Leistungen, Seitenumfang, Wartung/SEO/Stunden, Hosting (Vercel),
   Preis, Feedbackrunden und Zeitrahmen kommen aus dem Projekt. Sie erscheinen nur im Block „Projektleistungen“ (Feldtyp
   `project_services`) zur Bestätigung.
2. **Jede Frage genau einmal.** Team nur im Block „Team“; Firmen-Kontaktdaten nur in „Kontakt & Social Media“;
   Firmenname und Adresse nur in „Unternehmen“ bzw. „Kontakt“ (CRM-vorbelegt) — das Impressum fragt sie nicht erneut ab;
   Zertifikate/Auszeichnungen/Mitgliedschaften nur in „Social Proof“; Analytics, Search Console, Tag Manager nur in
   „Integrationen“.
3. **Status und Vollständigkeit sind keine Blöcke.** „Nicht erforderlich“ entsteht über Ja/Nein-Auslöser, „vollständig“
   über Pflichtfelder und `min_items`, „Rückfrage“ über die interne Prüfung (Task 68).
4. **Rechte:** globale Bestätigungen im Block „Rechte & Freigaben“ plus optionales Feld „Bildnachweise“; keine
   Rechte-Metadaten je Datei.
5. **Zugänge:** nur Fakten, keine Passwörter. Konten legt das Team an und pflegt sie im Credentials-Bereich (Ordner 19).
6. **Pflicht nur, wo ohne die Angabe kein Start möglich ist.** Alles andere optional.
7. **Portal-Texte in Du-Form**, kurz, ohne Fachjargon. Hilfetexte erklären, _wofür_ wir die Angabe brauchen.

## Legende

- **Typ:** `st` short_text · `lt` long_text · `em` email · `ph` phone · `url` url · `ch` choice · `mc` multi_choice ·
  `yn` yes_no · `sc` scale · `co` color · `fi` files · `cf` confirmation · `gr` group · `ps` project_services
- **P:** `P` required, leer = optional
- **Bed.:** Bedingung `feldkey=optionkey` (im selben Block). Bei `yn` sind die Optionen `yes`/`no`.
- **Konfig:** `max` = `max_length`, `min`/`max#` = `min_items`/`max_items`, Dateiarten aus `ASSET_KIND_VALUES` (`packages/common/src/constants/files/asset-kind.ts`:
  `document`, `image`, `video`, `font`), `pre` = `prefill_source`
- Unterfelder einer Gruppe sind mit `↳` eingerückt. Optionen stehen in der Zeile darunter als `key: DE / EN`.
- `yn`-Optionen: `yes: Ja / Yes`, `no: Nein / No`. `sc`-Pole stehen in der Konfig-Spalte als `low ↔ high`.
- **carry** = `carry_over = true` (firmenweit, wird aus dem letzten abgeschlossenen Bogen vorbefüllt).

---

## Katalogblöcke

### 1 · `contacts_approvals` — Ansprechpartner & Freigaben

DE: „Ansprechpartner & Freigaben“ / EN: „Contacts & approvals“ · nicht carry
Intro DE: „Damit Abstimmungen schnell gehen: Wer ist erreichbar, und wer entscheidet?“ /
EN: „So decisions move quickly: who can we reach, and who signs off?“

| Key                | Typ | P   | Bed. | Konfig                      | DE                                                                                            | EN                                       |
| ------------------ | --- | --- | ---- | --------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------- |
| main_contact_name  | st  | P   |      | pre `primary_contact_name`  | Hauptansprechpartner                                                                          | Main contact                             |
| main_contact_email | em  | P   |      | pre `primary_contact_email` | E-Mail                                                                                        | Email                                    |
| main_contact_phone | ph  | P   |      | pre `primary_contact_phone` | Telefon                                                                                       | Phone                                    |
| content_provider   | st  | P   |      |                             | Wer liefert Inhalte und Dateien?                                                              | Who provides content and files?          |
| design_approver    | st  | P   |      |                             | Wer gibt Designs frei?                                                                        | Who approves designs?                    |
| final_approver     | st  | P   |      |                             | Wer gibt die Website final frei?                                                              | Who gives final sign-off on the website? |
| preferred_channel  | ch  |     |      |                             | Bevorzugter Kanal für Rückfragen                                                              | Preferred channel for questions          |
|                    |     |     |      |                             | `portal_chat: Portal-Chat / Portal chat` · `email: E-Mail / Email` · `phone: Telefon / Phone` |                                          |
| other_people       | gr  |     |      | max# 10                     | Weitere Beteiligte                                                                            | Other people involved                    |
| ↳ name             | st  | P   |      |                             | Name                                                                                          | Name                                     |
| ↳ role             | st  |     |      |                             | Rolle im Projekt                                                                              | Role in the project                      |
| ↳ email            | em  |     |      |                             | E-Mail                                                                                        | Email                                    |
| absences           | lt  |     |      | max 1000                    | Geplante Abwesenheiten während des Projekts                                                   | Planned absences during the project      |

### 2 · `project_services` — Das ist vereinbart

DE: „Das ist vereinbart“ / EN: „What we agreed on“ · nicht carry
Intro DE: „Diese Leistungen sind Teil deines Projekts. Bitte prüfe kurz, ob alles so passt.“ /
EN: „These services are part of your project. Please check that everything is right.“

| Key      | Typ | P   | Bed. | Konfig | DE                     | EN              |
| -------- | --- | --- | ---- | ------ | ---------------------- | --------------- |
| services | ps  | P   |      |        | Vereinbarte Leistungen | Agreed services |

Hilfe DE: „Stimmt etwas nicht? Schreib es in die Anmerkung — wir klären es vor dem Start.“ /
EN: „Something off? Add a note — we’ll sort it out before we start.“

### 3 · `company_profile` — Unternehmen & Positionierung (carry)

Intro DE: „Wofür steht ihr — und warum kommen Kunden zu euch? Stichpunkte reichen.“ /
EN: „What do you stand for, and why do customers choose you? Bullet points are fine.“

| Key                    | Typ | P   | Bed.                       | Konfig                      | DE                                                      | EN                                                 |
| ---------------------- | --- | --- | -------------------------- | --------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| company_name           | st  | P   |                            | pre `customer_company_name` | Unternehmensname                                        | Company name                                       |
| short_description      | lt  | P   |                            | max 600                     | Beschreibe dein Unternehmen in zwei, drei Sätzen        | Describe your company in two or three sentences    |
| stands_for             | lt  | P   |                            | max 1500                    | Wofür steht ihr?                                        | What do you stand for?                             |
| unique_strengths       | lt  | P   |                            | max 1500                    | Was zeichnet euch besonders aus?                        | What makes you stand out?                          |
| why_customers_choose   | lt  | P   |                            | max 1500                    | Warum entscheiden sich Kunden für euch?                 | Why do customers choose you?                       |
| vs_competitors         | lt  | P   |                            | max 1500                    | Was unterscheidet euch vom Wettbewerb?                  | How are you different from competitors?            |
| must_not_convey        | lt  | P   |                            | max 1000                    | Was soll die Website ausdrücklich **nicht** vermitteln? | What should the website explicitly **not** convey? |
| founded_year           | st  |     |                            | max 4                       | Gründungsjahr                                           | Year founded                                       |
| employee_count         | st  |     |                            | max 20                      | Anzahl Mitarbeitende                                    | Number of employees                                |
| has_multiple_locations | yn  |     |                            |                             | Habt ihr mehrere Standorte?                             | Do you have multiple locations?                    |
| locations              | gr  | P   | has_multiple_locations=yes | min 2, max# 20              | Standorte                                               | Locations                                          |
| ↳ name                 | st  | P   |                            |                             | Bezeichnung                                             | Name                                               |
| ↳ address              | lt  | P   |                            | max 300                     | Adresse                                                 | Address                                            |
| ↳ phone                | ph  |     |                            |                             | Telefon                                                 | Phone                                              |
| ↳ opening_hours        | lt  |     |                            | max 500                     | Öffnungszeiten                                          | Opening hours                                      |
| ↳ google_business_url  | url |     |                            |                             | Google-Unternehmensprofil                               | Google Business Profile                            |
| qualifications         | lt  |     |                            | max 1500                    | Besondere Qualifikationen                               | Special qualifications                             |

### 3k · `company_profile_compact` — Unternehmen (kompakt, carry)

| Key                  | Typ | P   | Bed. | Konfig                      | DE                                               | EN                                              |
| -------------------- | --- | --- | ---- | --------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| company_name         | st  | P   |      | pre `customer_company_name` | Unternehmensname                                 | Company name                                    |
| short_description    | lt  | P   |      | max 600                     | Beschreibe dein Unternehmen in zwei, drei Sätzen | Describe your company in two or three sentences |
| why_customers_choose | lt  | P   |      | max 1500                    | Warum entscheiden sich Kunden für euch?          | Why do customers choose you?                    |
| target_customers     | lt  | P   |      | max 1500                    | Wer sind eure wichtigsten Kunden?                | Who are your most important customers?          |
| customer_problems    | lt  | P   |      | max 1500                    | Welche Probleme lösen eure Kunden mit euch?      | Which problems do customers solve with you?     |
| must_not_convey      | lt  |     |      | max 1000                    | Was soll die Website **nicht** vermitteln?       | What should the website **not** convey?         |

### 4 · `target_audience` — Zielgruppe (carry)

| Key                 | Typ | P   | Bed. | Konfig   | DE                                                          | EN                                               |
| ------------------- | --- | --- | ---- | -------- | ----------------------------------------------------------- | ------------------------------------------------ |
| main_customers      | lt  | P   |      | max 1500 | Wer sind eure wichtigsten Kunden?                           | Who are your most important customers?           |
| market              | ch  | P   |      |          | Zielmarkt                                                   | Market                                           |
|                     |     |     |      |          | `b2b: B2B / B2B` · `b2c: B2C / B2C` · `both: Beides / Both` |                                                  |
| problems            | lt  | P   |      | max 1500 | Welche typischen Probleme haben diese Kunden?               | What problems do these customers typically have? |
| goals               | lt  | P   |      | max 1500 | Was wollen diese Kunden erreichen?                          | What do these customers want to achieve?         |
| search_reasons      | lt  | P   |      | max 1500 | Warum suchen Kunden nach eurer Leistung?                    | Why do customers look for your service?          |
| objections          | lt  | P   |      | max 1500 | Welche Bedenken oder Einwände hört ihr häufig?              | Which concerns or objections do you hear often?  |
| pre_sales_questions | lt  | P   |      | max 1500 | Welche Fragen stellen Kunden vor einer Zusammenarbeit?      | What do customers ask before working with you?   |
| industries          | lt  |     |      | max 800  | Typische Branchen                                           | Typical industries                               |
| company_size        | st  |     |      | max 200  | Typische Unternehmensgröße                                  | Typical company size                             |
| buyer_roles         | lt  |     |      | max 800  | Typische Ansprechpartner / Rollen                           | Typical contacts / roles                         |
| region              | st  |     |      | max 300  | Geografische Zielregion                                     | Target region                                    |
| other_audiences     | lt  |     |      | max 800  | Weitere Zielgruppen                                         | Other audiences                                  |

### 5 · `offers` — Deine Leistungen und Angebote

DE Intro: „Leg für jede Leistung, die auf der Website vorkommen soll, einen Eintrag an. Vollständigkeit ist wichtiger
als schöne Formulierungen.“ / EN: „Add an entry for every service that should appear on the website. Completeness
matters more than polished wording.“ · nicht carry

| Key                 | Typ | P   | Bed. | Konfig                              | DE                                    | EN                                   |
| ------------------- | --- | --- | ---- | ----------------------------------- | ------------------------------------- | ------------------------------------ |
| offers              | gr  | P   |      | min 1, max# 30                      | Leistungen                            | Services                             |
| ↳ name              | st  | P   |      | max 120                             | Name der Leistung                     | Service name                         |
| ↳ short_description | lt  | P   |      | max 500                             | Kurzbeschreibung                      | Short description                    |
| ↳ long_description  | lt  |     |      | max 5000                            | Ausführliche Beschreibung             | Detailed description                 |
| ↳ for_whom          | lt  | P   |      | max 1000                            | Für wen ist die Leistung gedacht?     | Who is it for?                       |
| ↳ problem           | lt  | P   |      | max 1500                            | Welches Problem hat der Kunde?        | What problem does the customer have? |
| ↳ solution          | lt  | P   |      | max 1500                            | Wie löst ihr es?                      | How do you solve it?                 |
| ↳ deliverables      | lt  |     |      | max 1500                            | Was bekommt der Kunde konkret?        | What exactly does the customer get?  |
| ↳ process           | lt  |     |      | max 1500                            | Wie läuft die Zusammenarbeit ab?      | How does the collaboration work?     |
| ↳ benefits          | lt  | P   |      | max 1500                            | Wichtigste Vorteile                   | Key benefits                         |
| ↳ why_us            | lt  |     |      | max 1000                            | Warum sollte man sie bei euch buchen? | Why book it with you?                |
| ↳ faq               | lt  |     |      | max 3000                            | Typische Fragen zur Leistung          | Common questions about it            |
| ↳ references        | lt  |     |      | max 1500                            | Passende Referenzen                   | Related references                   |
| ↳ pricing           | lt  |     |      | max 800                             | Preisangaben (falls gewünscht)        | Pricing (if wanted)                  |
| ↳ requirements      | lt  |     |      | max 800                             | Voraussetzungen                       | Requirements                         |
| ↳ exclusions        | lt  |     |      | max 800                             | Ausschlüsse / Besonderheiten          | Exclusions / special notes           |
| ↳ files             | fi  |     |      | max# 20, `image`,`document`,`video` | Bilder und Dokumente                  | Images and documents                 |

### 5k · `offers_compact` — Deine Leistungen (kompakt)

| Key                 | Typ | P   | Bed. | Konfig                      | DE                                 | EN                                   |
| ------------------- | --- | --- | ---- | --------------------------- | ---------------------------------- | ------------------------------------ |
| offers              | gr  | P   |      | min 1, max# 15              | Leistungen                         | Services                             |
| ↳ name              | st  | P   |      | max 120                     | Name der Leistung                  | Service name                         |
| ↳ short_description | lt  | P   |      | max 500                     | Kurzbeschreibung                   | Short description                    |
| ↳ problem_solution  | lt  | P   |      | max 2000                    | Welches Problem löst sie, und wie? | What problem does it solve, and how? |
| ↳ benefits          | lt  |     |      | max 1500                    | Wichtigste Vorteile                | Key benefits                         |
| ↳ files             | fi  |     |      | max# 10, `image`,`document` | Bilder und Dokumente               | Images and documents                 |

### 6 · `brand_assets` — Logos & Corporate Design (carry)

Intro DE: „Am besten als SVG, sonst PNG mit transparentem Hintergrund.“ /
EN: „SVG works best, otherwise PNG with a transparent background.“

| Key                  | Typ | P   | Bed.                     | Konfig                            | DE                                        | EN                                        |
| -------------------- | --- | --- | ------------------------ | --------------------------------- | ----------------------------------------- | ----------------------------------------- |
| has_corporate_design | yn  | P   |                          |                                   | Gibt es ein bestehendes Corporate Design? | Do you have an existing corporate design? |
| brand_guide          | fi  |     | has_corporate_design=yes | max# 5, `document`,`image`        | Brand Guide / Style Guide                 | Brand guide / style guide                 |
| logo_main            | fi  | P   |                          | min 1, max# 5, `image`,`document` | Hauptlogo                                 | Main logo                                 |
| logo_light           | fi  |     |                          | max# 3, `image`,`document`        | Logo für dunkle Hintergründe              | Logo for dark backgrounds                 |
| logo_dark            | fi  |     |                          | max# 3, `image`,`document`        | Logo für helle Hintergründe               | Logo for light backgrounds                |
| logo_mark            | fi  |     |                          | max# 3, `image`,`document`        | Bildmarke / Icon                          | Logo mark / icon                          |
| favicon              | fi  |     |                          | max# 3, `image`                   | Favicon                                   | Favicon                                   |

### 7 · `brand_colors_fonts` — Farben & Schriften (carry)

| Key              | Typ | P   | Bed.                 | Konfig          | DE                                                      | EN                                       |
| ---------------- | --- | --- | -------------------- | --------------- | ------------------------------------------------------- | ---------------------------------------- |
| has_brand_colors | yn  | P   |                      |                 | Habt ihr festgelegte Markenfarben?                      | Do you have defined brand colours?       |
| color_primary    | co  | P   | has_brand_colors=yes |                 | Primärfarbe                                             | Primary colour                           |
| color_secondary  | co  |     | has_brand_colors=yes |                 | Sekundärfarbe                                           | Secondary colour                         |
| color_accent     | co  |     | has_brand_colors=yes |                 | Akzentfarbe                                             | Accent colour                            |
| colors_more      | lt  |     | has_brand_colors=yes | max 500         | Weitere Markenfarben (HEX)                              | Other brand colours (HEX)                |
| colors_avoid     | lt  |     |                      | max 500         | Farben, die nicht verwendet werden sollen               | Colours to avoid                         |
| has_brand_fonts  | yn  | P   |                      |                 | Habt ihr festgelegte Schriftarten?                      | Do you have defined brand fonts?         |
| font_names       | st  | P   | has_brand_fonts=yes  | max 300         | Welche Schriftarten?                                    | Which fonts?                             |
| font_files       | fi  |     | has_brand_fonts=yes  | max# 20, `font` | Schriftdateien (am besten WOFF2)                        | Font files (WOFF2 preferred)             |
| font_license     | cf  |     | has_brand_fonts=yes  |                 | Wir haben die Nutzungsrechte für diese Schriften im Web | We hold web usage rights for these fonts |

### 6+7k · `brand_compact` — Marke (kompakt, carry)

| Key             | Typ | P   | Bed. | Konfig                            | DE                                    | EN                                 |
| --------------- | --- | --- | ---- | --------------------------------- | ------------------------------------- | ---------------------------------- |
| logo_main       | fi  | P   |      | min 1, max# 5, `image`,`document` | Logo (am besten SVG)                  | Logo (SVG preferred)               |
| logo_variants   | fi  |     |      | max# 10, `image`,`document`       | Weitere Logo-Varianten, Icon, Favicon | Other logo variants, icon, favicon |
| brand_guide     | fi  |     |      | max# 5, `document`,`image`        | Brand Guide (falls vorhanden)         | Brand guide (if available)         |
| color_primary   | co  |     |      |                                   | Primärfarbe                           | Primary colour                     |
| color_secondary | co  |     |      |                                   | Sekundärfarbe                         | Secondary colour                   |
| font_names      | st  |     |      | max 300                           | Schriftarten (falls festgelegt)       | Fonts (if defined)                 |

### 8 · `design_direction` — Designrichtung

Intro DE: „Schieb die Regler dahin, wo sich eure Website anfühlen soll.“ /
EN: „Move each slider to where your website should feel.“ · nicht carry

| Key                      | Typ | P   | Bed. | Konfig                                                 | DE                                        | EN                                   |
| ------------------------ | --- | --- | ---- | ------------------------------------------------------ | ----------------------------------------- | ------------------------------------ |
| modern_classic           | sc  | P   |      | modern ↔ klassisch / modern ↔ classic                  | Stil                                      | Style                                |
| minimal_expressive       | sc  | P   |      | minimalistisch ↔ ausdrucksstark / minimal ↔ expressive | Wirkung                                   | Impact                               |
| serious_casual           | sc  | P   |      | seriös ↔ locker / serious ↔ casual                     | Ton                                       | Tone                                 |
| elegant_technical        | sc  |     |      | elegant ↔ technisch / elegant ↔ technical              | Charakter                                 | Character                            |
| light_dark               | sc  |     |      | hell ↔ dunkel / light ↔ dark                           | Helligkeit                                | Brightness                           |
| calm_dynamic             | sc  |     |      | ruhig ↔ dynamisch / calm ↔ dynamic                     | Bewegung                                  | Motion                               |
| conservative_progressive | sc  |     |      | konservativ ↔ progressiv / conservative ↔ progressive  | Haltung                                   | Attitude                             |
| desired_feeling          | lt  | P   |      | max 1500                                               | Wie soll sich die Website anfühlen?       | How should the website feel?         |
| avoid_feeling            | lt  |     |      | max 1000                                               | Was soll sie auf keinen Fall ausstrahlen? | What should it never come across as? |

### 9 · `reference_websites` — Referenz-Websites & Inspiration

| Key           | Typ | P   | Bed. | Konfig          | DE                                                                                                                                                                                                                                                                                                                                                     | EN                     |
| ------------- | --- | --- | ---- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| references    | gr  |     |      | max# 15         | Websites, die dir gefallen                                                                                                                                                                                                                                                                                                                             | Websites you like      |
| ↳ url         | url | P   |      |                 | Adresse                                                                                                                                                                                                                                                                                                                                                | URL                    |
| ↳ likes       | lt  | P   |      | max 1000        | Was gefällt dir?                                                                                                                                                                                                                                                                                                                                       | What do you like?      |
| ↳ dislikes    | lt  |     |      | max 1000        | Was gefällt dir nicht?                                                                                                                                                                                                                                                                                                                                 | What don’t you like?   |
| ↳ aspects     | mc  |     |      |                 | Worauf bezieht sich das?                                                                                                                                                                                                                                                                                                                               | What does it refer to? |
|               |     |     |      |                 | `colors: Farben / Colours` · `typography: Typografie / Typography` · `hero: Einstiegsbereich / Hero` · `navigation: Navigation / Navigation` · `layout: Seitenaufbau / Layout` · `animation: Animationen / Animations` · `imagery: Bildsprache / Imagery` · `components: Buttons & Karten / Buttons & cards` · `overall: Gesamtwirkung / Overall feel` |                        |
| ↳ screenshots | fi  |     |      | max# 5, `image` | Screenshots (optional)                                                                                                                                                                                                                                                                                                                                 | Screenshots (optional) |

### 8+9k · `design_compact` — Designrichtung & Inspiration (kompakt)

| Key                | Typ | P   | Bed. | Konfig                                                 | DE                                  | EN                           |
| ------------------ | --- | --- | ---- | ------------------------------------------------------ | ----------------------------------- | ---------------------------- |
| modern_classic     | sc  | P   |      | modern ↔ klassisch / modern ↔ classic                  | Stil                                | Style                        |
| minimal_expressive | sc  | P   |      | minimalistisch ↔ ausdrucksstark / minimal ↔ expressive | Wirkung                             | Impact                       |
| serious_casual     | sc  | P   |      | seriös ↔ locker / serious ↔ casual                     | Ton                                 | Tone                         |
| desired_feeling    | lt  | P   |      | max 1500                                               | Wie soll sich die Website anfühlen? | How should the website feel? |
| references         | gr  |     |      | max# 5                                                 | Websites, die dir gefallen          | Websites you like            |
| ↳ url              | url | P   |      |                                                        | Adresse                             | URL                          |
| ↳ likes            | lt  | P   |      | max 1000                                               | Was gefällt dir daran?              | What do you like about it?   |

### 10 · `images_assets` — Bilder & Dateien (carry)

Intro DE: „Bitte lade Dateien im Original und in voller Auflösung hoch — nicht über WhatsApp oder Messenger
verschickt, nicht zugeschnitten. Lieber zu viel Auswahl als zu wenig.“ / EN: „Please upload originals in full
resolution — not sent via WhatsApp or messengers, not cropped. More choice is better than too little.“

| Key            | Typ | P   | Bed. | Konfig                              | DE                                                              | EN                                                            |
| -------------- | --- | --- | ---- | ----------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| company_images | fi  | P   |      | min 5, max# 30, `image`             | Unternehmensbilder (Räume, Gebäude, Arbeit, Projekte, Produkte) | Company photos (premises, building, work, projects, products) |
| hero_images    | fi  |     |      | max# 10, `image`,`video`            | Wunschmaterial für den Einstiegsbereich                         | Preferred material for the hero area                          |
| videos         | fi  |     |      | max# 10, `video`                    | Videos (MP4 bevorzugt)                                          | Videos (MP4 preferred)                                        |
| video_links    | lt  |     |      | max 1000                            | Links zu großen Videos (z. B. YouTube, Vimeo, Cloud-Link)       | Links to large videos (e.g. YouTube, Vimeo, cloud link)       |
| graphics       | fi  |     |      | max# 20, `image`,`document`         | Grafiken, Icons, Illustrationen, Infografiken                   | Graphics, icons, illustrations, infographics                  |
| documents      | fi  |     |      | max# 20, `document`                 | Broschüren, Flyer, Präsentationen, Infomaterial                 | Brochures, flyers, presentations, info material               |
| other_assets   | fi  |     |      | max# 20, `image`,`document`,`video` | Sonstiges (Social-Media-Material, Werbemittel …)                | Other (social media assets, ads …)                            |

### 11 · `team` — Team (carry)

| Key                | Typ | P   | Bed.          | Konfig                 | DE                                                    | EN                                     |
| ------------------ | --- | --- | ------------- | ---------------------- | ----------------------------------------------------- | -------------------------------------- |
| show_team          | yn  | P   |               |                        | Soll das Team auf der Website vorkommen?              | Should the team appear on the website? |
| members            | gr  | P   | show_team=yes | min 1, max# 50         | Teammitglieder                                        | Team members                           |
| ↳ name             | st  | P   |               |                        | Name                                                  | Name                                   |
| ↳ position         | st  | P   |               |                        | Position                                              | Position                               |
| ↳ responsibilities | st  |     |               | max 300                | Aufgabenbereich                                       | Responsibilities                       |
| ↳ bio              | lt  |     |               | max 800                | Kurzbeschreibung                                      | Short bio                              |
| ↳ qualifications   | lt  |     |               | max 500                | Qualifikationen                                       | Qualifications                         |
| ↳ photo            | fi  | P   |               | min 1, max# 5, `image` | Porträt                                               | Portrait                               |
| ↳ profile_url      | url |     |               |                        | LinkedIn / Profil                                     | LinkedIn / profile                     |
| ↳ publish_ok       | cf  | P   |               |                        | Die Person ist mit der Veröffentlichung einverstanden | This person agrees to be published     |
| team_photos        | fi  |     | show_team=yes | max# 10, `image`       | Gruppen- und Teamfotos                                | Group and team photos                  |

### 12 · `social_proof` — Kundenstimmen & Referenzen (carry)

| Key              | Typ | P   | Bed.                 | Konfig                      | DE                                                                                                                                                                                                                                                                                | EN                                                        |
| ---------------- | --- | --- | -------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| has_testimonials | yn  | P   |                      |                             | Habt ihr Kundenstimmen, die wir zeigen dürfen?                                                                                                                                                                                                                                    | Do you have testimonials we may show?                     |
| testimonials     | gr  | P   | has_testimonials=yes | min 1, max# 20              | Kundenstimmen                                                                                                                                                                                                                                                                     | Testimonials                                              |
| ↳ name           | st  | P   |                      |                             | Name                                                                                                                                                                                                                                                                              | Name                                                      |
| ↳ company        | st  |     |                      |                             | Unternehmen                                                                                                                                                                                                                                                                       | Company                                                   |
| ↳ position       | st  |     |                      |                             | Position                                                                                                                                                                                                                                                                          | Position                                                  |
| ↳ quote          | lt  | P   |                      | max 1000                    | Zitat                                                                                                                                                                                                                                                                             | Quote                                                     |
| ↳ portrait       | fi  |     |                      | max# 1, `image`             | Porträt                                                                                                                                                                                                                                                                           | Portrait                                                  |
| ↳ logo           | fi  |     |                      | max# 1, `image`,`document`  | Firmenlogo                                                                                                                                                                                                                                                                        | Company logo                                              |
| ↳ website        | url |     |                      |                             | Website                                                                                                                                                                                                                                                                           | Website                                                   |
| ↳ publish_ok     | cf  | P   |                      |                             | Freigabe zur Veröffentlichung liegt vor                                                                                                                                                                                                                                           | Permission to publish is in place                         |
| has_case_studies | yn  | P   |                      |                             | Habt ihr Projektreferenzen?                                                                                                                                                                                                                                                       | Do you have project references?                           |
| case_studies     | gr  | P   | has_case_studies=yes | min 1, max# 20              | Projektreferenzen                                                                                                                                                                                                                                                                 | Case studies                                              |
| ↳ client         | st  | P   |                      |                             | Kunde                                                                                                                                                                                                                                                                             | Client                                                    |
| ↳ project        | st  | P   |                      |                             | Projekt                                                                                                                                                                                                                                                                           | Project                                                   |
| ↳ situation      | lt  |     |                      | max 1000                    | Ausgangssituation                                                                                                                                                                                                                                                                 | Starting point                                            |
| ↳ service        | lt  |     |                      | max 1000                    | Eure Leistung                                                                                                                                                                                                                                                                     | What you did                                              |
| ↳ result         | lt  | P   |                      | max 1000                    | Ergebnis                                                                                                                                                                                                                                                                          | Result                                                    |
| ↳ images         | fi  |     |                      | max# 10, `image`,`document` | Logo und Bilder                                                                                                                                                                                                                                                                   | Logo and images                                           |
| ↳ website        | url |     |                      |                             | Website                                                                                                                                                                                                                                                                           | Website                                                   |
| ↳ publish_ok     | cf  | P   |                      |                             | Freigabe zur Veröffentlichung liegt vor                                                                                                                                                                                                                                           | Permission to publish is in place                         |
| key_figures      | gr  |     |                      | max# 10                     | Kennzahlen (z. B. Kunden, Projekte, Jahre Erfahrung)                                                                                                                                                                                                                              | Key figures (e.g. clients, projects, years of experience) |
| ↳ label          | st  | P   |                      |                             | Kennzahl                                                                                                                                                                                                                                                                          | Figure                                                    |
| ↳ value          | st  | P   |                      |                             | Wert                                                                                                                                                                                                                                                                              | Value                                                     |
| trust_elements   | mc  |     |                      |                             | Weitere Vertrauenselemente                                                                                                                                                                                                                                                        | Other trust signals                                       |
|                  |     |     |                      |                             | `certificates: Zertifikate / Certificates` · `awards: Auszeichnungen / Awards` · `partners: Partner / Partners` · `memberships: Mitgliedschaften / Memberships` · `press: Presse / Press` · `known_clients: Bekannte Kunden / Notable clients` · `reviews: Bewertungen / Reviews` |                                                           |
| trust_details    | lt  |     |                      | max 2000                    | Details dazu                                                                                                                                                                                                                                                                      | Details                                                   |
| trust_files      | fi  |     |                      | max# 20, `image`,`document` | Logos, Siegel, Urkunden                                                                                                                                                                                                                                                           | Logos, badges, certificates                               |

### 13 · `about_us` — Über uns (carry)

| Key             | Typ | P   | Bed. | Konfig   | DE                                     | EN                            |
| --------------- | --- | --- | ---- | -------- | -------------------------------------- | ----------------------------- |
| history         | lt  |     |      | max 3000 | Geschichte                             | History                       |
| founding_reason | lt  |     |      | max 1500 | Warum wurde das Unternehmen gegründet? | Why was the company founded?  |
| mission         | lt  |     |      | max 1500 | Mission                                | Mission                       |
| values          | lt  |     |      | max 1500 | Werte                                  | Values                        |
| way_of_working  | lt  |     |      | max 1500 | Arbeitsweise und Philosophie           | Way of working and philosophy |

### 14 · `faq` — Häufige Fragen

| Key              | Typ | P   | Bed. | Konfig   | DE                                                                 | EN                                               |
| ---------------- | --- | --- | ---- | -------- | ------------------------------------------------------------------ | ------------------------------------------------ |
| guiding_question | lt  |     |      | max 2000 | Welche Fragen stellen Kunden besonders oft vor dem ersten Kontakt? | What do customers ask most before first contact? |
| items            | gr  |     |      | max# 30  | Fragen und Antworten                                               | Questions and answers                            |
| ↳ question       | st  | P   |      | max 300  | Frage                                                              | Question                                         |
| ↳ answer         | lt  | P   |      | max 2000 | Antwort                                                            | Answer                                           |

### 15 · `contact_social` — Kontakt & Social Media (carry)

| Key             | Typ | P   | Bed. | Konfig                          | DE                                                     | EN                                                    |
| --------------- | --- | --- | ---- | ------------------------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| public_email    | em  | P   |      |                                 | Allgemeine E-Mail-Adresse für die Website              | General email address for the website                 |
| public_phone    | ph  | P   |      |                                 | Telefonnummer für die Website                          | Phone number for the website                          |
| address         | lt  | P   |      | max 300, pre `customer_address` | Geschäftsanschrift                                     | Business address                                      |
| opening_hours   | lt  |     |      | max 500                         | Öffnungszeiten                                         | Opening hours                                         |
| whatsapp        | ph  |     |      |                                 | WhatsApp                                               | WhatsApp                                              |
| fax             | ph  |     |      |                                 | Fax                                                    | Fax                                                   |
| contact_notes   | lt  |     |      | max 1000                        | Weitere Kontaktpersonen oder Durchwahlen               | Other contacts or extensions                          |
| linkedin        | url |     |      |                                 | LinkedIn                                               | LinkedIn                                              |
| instagram       | url |     |      |                                 | Instagram                                              | Instagram                                             |
| facebook        | url |     |      |                                 | Facebook                                               | Facebook                                              |
| youtube         | url |     |      |                                 | YouTube                                                | YouTube                                               |
| tiktok          | url |     |      |                                 | TikTok                                                 | TikTok                                                |
| x               | url |     |      |                                 | X                                                      | X                                                     |
| xing            | url |     |      |                                 | Xing                                                   | Xing                                                  |
| google_business | url |     |      |                                 | Google-Unternehmensprofil                              | Google Business Profile                               |
| review_profiles | lt  |     |      | max 1000                        | Bewertungsportale (ProvenExpert, Trustpilot, Kununu …) | Review platforms (ProvenExpert, Trustpilot, Kununu …) |
| other_profiles  | lt  |     |      | max 1000                        | Weitere Profile und Branchenportale                    | Other profiles and directories                        |

### 16 · `existing_website` — Bestehende Website

| Key             | Typ | P   | Bed.            | Konfig                      | DE                                                                                 | EN                                                                    |
| --------------- | --- | --- | --------------- | --------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| has_website     | yn  | P   |                 |                             | Gibt es bereits eine Website?                                                      | Is there an existing website?                                         |
| current_url     | url | P   | has_website=yes | pre `customer_website_url`  | Aktuelle Adresse                                                                   | Current URL                                                           |
| keep_content    | lt  | P   | has_website=yes | max 2000                    | Was soll inhaltlich übernommen werden?                                             | What content should be carried over?                                  |
| remove_content  | lt  |     | has_website=yes | max 2000                    | Was soll wegfallen?                                                                | What should be removed?                                               |
| important_pages | lt  |     | has_website=yes | max 2000                    | Welche Seiten sind besonders wichtig oder werden viel besucht?                     | Which pages matter most or get the most traffic?                      |
| important_urls  | lt  |     | has_website=yes | max 3000                    | Wichtige Adressen, die erhalten bleiben müssen (Downloads, Blog, verlinkte Seiten) | Important URLs that must keep working (downloads, blog, linked pages) |
| export_files    | fi  |     | has_website=yes | max# 30, `document`,`image` | Texte, Bilder, PDFs, Exporte, SEO-Unterlagen                                       | Texts, images, PDFs, exports, SEO documents                           |

### 17 · `seo_basics` — SEO-Grundlagen

| Key                      | Typ | P   | Bed. | Konfig   | DE                                                           | EN                                                    |
| ------------------------ | --- | --- | ---- | -------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| main_services_for_google | lt  | P   |      | max 1500 | Mit welchen Leistungen wollt ihr bei Google gefunden werden? | Which services do you want to be found for on Google? |
| target_regions           | lt  | P   |      | max 800  | Wichtigste Regionen                                          | Key regions                                           |
| known_keywords           | lt  |     |      | max 1500 | Bekannte Suchbegriffe                                        | Known search terms                                    |
| google_competitors       | lt  |     |      | max 1500 | Wettbewerber, die bei Google vor euch stehen                 | Competitors ranking above you on Google               |
| has_google_business      | yn  |     |      |          | Gibt es ein Google-Unternehmensprofil?                       | Is there a Google Business Profile?                   |

### 18 · `domain_access` — Domain & Zugänge (carry)

Intro DE: „Wir brauchen hier nur Fakten — **keine Passwörter**. Die nötigen Konten legen wir mit der Zugangs-E-Mail an
und verwalten sie sicher.“ / EN: „We only need facts here — **no passwords**. We set up the required accounts with the
access email and manage them securely.“

| Key             | Typ | P   | Bed. | Konfig   | DE                                                               | EN                                                         |
| --------------- | --- | --- | ---- | -------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| domain          | st  | P   |      | max 253  | Domain (z. B. beispiel.de)                                       | Domain (e.g. example.com)                                  |
| domain_provider | st  | P   |      | max 200  | Bei welchem Anbieter liegt die Domain?                           | Where is the domain registered?                            |
| domain_manager  | st  | P   |      | max 200  | Wer verwaltet die Domain?                                        | Who manages the domain?                                    |
| access_email    | em  | P   |      |          | E-Mail-Adresse, über die wir Konten anlegen und Zugänge erhalten | Email address we use to create accounts and receive access |
| mail_on_domain  | yn  | P   |      |          | Laufen E-Mail-Postfächer über diese Domain?                      | Do email mailboxes run on this domain?                     |
| dns_notes       | lt  |     |      | max 1500 | Besonderheiten bei DNS oder E-Mail                               | DNS or email specifics                                     |

### 19 · `integrations` — Integrationen

Intro DE: „Welche Dienste gibt es schon oder sollen angebunden werden? Zugänge klären wir separat.“ /
EN: „Which services already exist or should be connected? We handle access separately.“

| Key           | Typ | P   | Bed. | Konfig   | DE                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | EN                          |
| ------------- | --- | --- | ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| services      | mc  |     |      |          | Vorhandene oder gewünschte Dienste                                                                                                                                                                                                                                                                                                                                                                                                                                  | Existing or wanted services |
|               |     |     |      |          | `search_console: Google Search Console` · `analytics: Google Analytics` · `tag_manager: Google Tag Manager` · `calendly: Calendly` · `newsletter: Newsletter-System / Newsletter tool` · `crm: CRM` · `meta_pixel: Meta Pixel` · `linkedin_insight: LinkedIn Insight Tag` · `maps: Google Maps` · `video: YouTube / Vimeo` · `reviews: Bewertungsplattform / Review platform` · `other: Sonstiges / Other` (Beschriftung in beiden Sprachen gleich, wo Produktname) |                             |
| details       | gr  |     |      | max# 20  | Details je Dienst                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Details per service         |
| ↳ provider    | st  | P   |      |          | Dienst / Anbieter                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Service / provider          |
| ↳ has_account | yn  | P   |      |          | Konto vorhanden?                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Account exists?             |
| ↳ owner       | st  |     |      |          | Wer ist verantwortlich?                                                                                                                                                                                                                                                                                                                                                                                                                                             | Who is responsible?         |
| ↳ notes       | lt  |     |      | max 1000 | Besonderheiten                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Notes                       |

### 20 · `legal` — Impressum & Datenschutz (carry)

Intro DE: „Firmenname und Anschrift übernehmen wir aus deinen Angaben oben.“ /
EN: „We take company name and address from your details above.“

| Key                   | Typ | P   | Bed.                    | Konfig                | DE                                                                                                                                          | EN                                                                        |
| --------------------- | --- | --- | ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| imprint_source        | ch  | P   |                         |                       | Impressum                                                                                                                                   | Legal notice                                                              |
|                       |     |     |                         |                       | `fill_in: Ich trage die Angaben hier ein / I’ll fill it in here` · `existing: Es gibt ein bestehendes Impressum / There is an existing one` |                                                                           |
| existing_imprint_url  | url |     | imprint_source=existing |                       | Link zum bestehenden Impressum                                                                                                              | Link to the existing legal notice                                         |
| existing_imprint_file | fi  |     | imprint_source=existing | max# 3, `document`    | Bestehendes Impressum als Datei                                                                                                             | Existing legal notice as file                                             |
| legal_form            | st  | P   | imprint_source=fill_in  |                       | Rechtsform                                                                                                                                  | Legal form                                                                |
| representative        | st  | P   | imprint_source=fill_in  |                       | Vertretungsberechtigte Person(en)                                                                                                           | Authorised representative(s)                                              |
| register              | st  |     | imprint_source=fill_in  |                       | Registergericht                                                                                                                             | Register court                                                            |
| register_number       | st  |     | imprint_source=fill_in  |                       | Registernummer                                                                                                                              | Register number                                                           |
| vat_id                | st  |     | imprint_source=fill_in  | pre `customer_vat_id` | USt-ID                                                                                                                                      | VAT ID                                                                    |
| regulated_profession  | lt  |     | imprint_source=fill_in  | max 1500              | Aufsichtsbehörde, Kammer, Berufsbezeichnung, berufsrechtliche Regelungen (falls zutreffend)                                                 | Supervisory authority, chamber, professional title, rules (if applicable) |
| privacy_provider      | ch  | P   |                         |                       | Wer stellt die finale Datenschutzerklärung bereit?                                                                                          | Who provides the final privacy policy?                                    |
|                       |     |     |                         |                       | `us: Ihr (invessiv) / You (invessiv)` · `customer: Wir selbst / We do` · `lawyer: Unsere Rechtsberatung / Our legal advisor`                |                                                                           |
| existing_privacy      | fi  |     |                         | max# 3, `document`    | Bestehende Datenschutzerklärung                                                                                                             | Existing privacy policy                                                   |
| privacy_notes         | lt  |     |                         | max 1500              | Datenschutzbeauftragter, Compliance-Vorgaben, Rechtsberatung                                                                                | Data protection officer, compliance requirements, legal advice            |

### 21 · `rights_consent` — Rechte & Freigaben

| Key               | Typ | P   | Bed. | Konfig   | DE                                                               | EN                                                       |
| ----------------- | --- | --- | ---- | -------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| usage_rights      | cf  | P   |      |          | Wir dürfen die hochgeladenen Inhalte für die Website verwenden   | We may use the uploaded content for the website          |
| media_rights      | cf  | P   |      |          | Die nötigen Rechte an Bildern, Videos und Logos liegen vor       | We hold the necessary rights to images, videos and logos |
| people_consent    | cf  | P   |      |          | Abgebildete Personen sind mit der Veröffentlichung einverstanden | People shown have agreed to publication                  |
| reference_consent | cf  | P   |      |          | Genannte Kundenreferenzen dürfen veröffentlicht werden           | Listed client references may be published                |
| image_credits     | lt  |     |      | max 2000 | Bildnachweise, Fotografen, Lizenzhinweise, Einschränkungen       | Image credits, photographers, licences, restrictions     |

### 22 · `texts_tone` — Texte & Tonalität (carry)

Intro DE: „Du musst keine fertigen Texte liefern. Vollständigkeit ist wichtiger als perfekte Formulierung — wir
bereiten alles für die Website auf.“ / EN: „You don’t need finished copy. Completeness matters more than perfect
wording — we’ll shape everything for the website.“

| Key                | Typ | P   | Bed. | Konfig              | DE                                                   | EN                                              |
| ------------------ | --- | --- | ---- | ------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| existing_texts     | fi  |     |      | max# 30, `document` | Vorhandene Texte, Präsentationen, alte Website-Texte | Existing texts, presentations, old website copy |
| notes              | lt  |     |      | max 10000           | Stichpunkte und weitere Informationen                | Bullet points and further information           |
| address_form       | ch  | P   |      |                     | Wie sprecht ihr eure Kunden an?                      | How do you address your customers?              |
|                    |     |     |      |                     | `du: Du / Informal (du)` · `sie: Sie / Formal (Sie)` |                                                 |
| technical_language | yn  |     |      |                     | Darf es Fachsprache sein?                            | Is technical language okay?                     |
| tone               | lt  |     |      | max 1000            | Gewünschte Tonalität                                 | Desired tone of voice                           |
| must_use_terms     | lt  |     |      | max 1000            | Begriffe, die unbedingt vorkommen sollen             | Terms that must be used                         |
| avoid_terms        | lt  |     |      | max 1000            | Begriffe, die vermieden werden sollen                | Terms to avoid                                  |

### 23 · `other_wishes` — Sonstiges

| Key           | Typ | P   | Bed. | Konfig                                     | DE                                               | EN                                  |
| ------------- | --- | --- | ---- | ------------------------------------------ | ------------------------------------------------ | ----------------------------------- |
| wishes        | lt  |     |      | max 3000                                   | Weitere Wünsche oder Vorstellungen               | Other wishes or ideas               |
| must_have     | lt  |     |      | max 2000                                   | Was soll unbedingt auf die Website?              | What must be on the website?        |
| must_not      | lt  |     |      | max 2000                                   | Was soll ausdrücklich nicht umgesetzt werden?    | What should explicitly not be done? |
| anything_else | lt  |     |      | max 2000                                   | Gibt es etwas, das wir noch nicht gefragt haben? | Anything we haven’t asked yet?      |
| files         | fi  |     |      | max# 20, `image`,`document`,`video`,`font` | Weitere Dateien                                  | Other files                         |

### 22+23k · `texts_misc_compact` — Texte & Sonstiges (kompakt, carry)

| Key            | Typ | P   | Bed. | Konfig                              | DE                                                   | EN                                    |
| -------------- | --- | --- | ---- | ----------------------------------- | ---------------------------------------------------- | ------------------------------------- |
| address_form   | ch  | P   |      |                                     | Wie sprecht ihr eure Kunden an?                      | How do you address your customers?    |
|                |     |     |      |                                     | `du: Du / Informal (du)` · `sie: Sie / Formal (Sie)` |                                       |
| tone           | lt  |     |      | max 1000                            | Gewünschte Tonalität                                 | Desired tone of voice                 |
| existing_texts | fi  |     |      | max# 20, `document`                 | Vorhandene Texte und Unterlagen                      | Existing texts and documents          |
| notes          | lt  |     |      | max 10000                           | Stichpunkte und weitere Informationen                | Bullet points and further information |
| wishes         | lt  |     |      | max 3000                            | Weitere Wünsche                                      | Other wishes                          |
| files          | fi  |     |      | max# 20, `image`,`document`,`video` | Weitere Dateien                                      | Other files                           |

---

## Vorlagen

| Position | Landingpage kompakt (`title`: „Landingpage kompakt“) | Landingpage ausführlich (`title`: „Landingpage ausführlich“) |
| -------: | ---------------------------------------------------- | ------------------------------------------------------------ |
|        0 | `contacts_approvals`                                 | `contacts_approvals`                                         |
|        1 | `project_services`                                   | `project_services`                                           |
|        2 | `company_profile_compact`                            | `company_profile`                                            |
|        3 | `offers_compact`                                     | `target_audience`                                            |
|        4 | `brand_compact`                                      | `offers`                                                     |
|        5 | `design_compact`                                     | `brand_assets`                                               |
|        6 | `images_assets`                                      | `brand_colors_fonts`                                         |
|        7 | `contact_social`                                     | `design_direction`                                           |
|        8 | `domain_access`                                      | `reference_websites`                                         |
|        9 | `legal`                                              | `images_assets`                                              |
|       10 | `rights_consent`                                     | `team`                                                       |
|       11 | `texts_misc_compact`                                 | `social_proof`                                               |
|       12 |                                                      | `about_us`                                                   |
|       13 |                                                      | `faq`                                                        |
|       14 |                                                      | `contact_social`                                             |
|       15 |                                                      | `existing_website`                                           |
|       16 |                                                      | `seo_basics`                                                 |
|       17 |                                                      | `domain_access`                                              |
|       18 |                                                      | `integrations`                                               |
|       19 |                                                      | `legal`                                                      |
|       20 |                                                      | `rights_consent`                                             |
|       21 |                                                      | `texts_tone`                                                 |
|       22 |                                                      | `other_wishes`                                               |

Beschreibungen: kompakt — „Schlanker Bogen für Standard-Landingpages: nur, was wir für den Start wirklich brauchen.“;
ausführlich — „Vollständiger Bogen für größere Kunden. Beim Anlegen des Bogens auf das Projekt zuschneiden.“

## Hinweise für die Umsetzung (CRM-64-T5)

- Katalogblöcke mit Kompakt-Varianten sind eigenständige Blöcke (eigener `key`). Die Vorbefüllung (Task 65) greift
  über `source_block_id`; eine Kompakt- und eine Vollvariante übernehmen deshalb **nicht** gegenseitig.
  Das ist bewusst: Unterschiedliche Feldsätze sollen nicht halb vorbefüllt werden.
- Beschriftungen, die Produktnamen sind (Google Analytics, Calendly …), stehen in beiden Sprachen gleich.
- Alle Hilfetexte, die hier fehlen, bleiben leer; der Owner ergänzt sie bei Bedarf im Katalog.
- Die Texte durchlaufen bei der Umsetzung den `copywriting`-Skill (Du-Form im DE-Portal, keine Floskeln); inhaltliche
  Änderungen an Feldern, Pflicht oder Bedingungen nur nach Rücksprache mit dem Owner.
