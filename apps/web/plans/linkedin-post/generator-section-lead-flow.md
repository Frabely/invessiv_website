# Plan: GeneratorSection — Lead-Tausch, Versuchszähler & LimitReached-Flow

## Context

Die LinkedIn-Post-Generator-Sektion (`/[locale]/services/linkedin-post`, Anchor `#generator`) zeigt aktuell **immer**
ein einziges Formular mit kreativen Feldern (Thema, Rolle, Ton, Farbe) **und** den Lead-Feldern (Name, E-Mail, Consent).
Das hat drei Schwächen:

1. **Falscher Moment für die Lead-Abfrage.** Name/E-Mail werden verlangt, bevor der Nutzer überhaupt ein Ergebnis
   gesehen hat. Es gibt keinen erlebten Gegenwert. Conversion-Best-Practice: erst Wert liefern, dann Kontaktdaten als
   bewussten „Tausch" abfragen.
2. **Versuchskontingent ist unsichtbar.** Der Nutzer hat 2 kostenlose Generierungen (DB-abgesichert über pseudonyme
   IP-Kennung, 30-Tage-Fenster), aber „wie viele noch" und „wann Reset" stehen nur als kleiner `aria-live`-Hinweis im
   Formular.
3. **Limit-Erreicht wirkt wie ein technischer Fehler.** Bei erreichtem Limit (HTTP 429, `usage_limit_reached`) rendert
   dieselbe `ErrorPreview` wie bei echten Fehlern („⌗ ERROR / Etwas ist schiefgegangen"). Verschenkt die beste
   Conversion-Chance, statt sie als Brücke zum Custom-Workflow zu nutzen.

**Gewünschtes Ergebnis** (vom Nutzer bestätigt):

- Generierung wird **anonym** (kreative Felder only). Das fertige Bild zeigt den bestehenden Platzhalter „Dein Name".
- Nach erfolgreicher Generierung erscheint ein klar abgegrenzter **Lead-Schritt**: Name + E-Mail als Tausch, um den Post
  **herunterzuladen oder per E-Mail zugeschickt** zu bekommen (jeweils mit Caption). **Beide** Aktionen sind gated.
- **DSGVO-konformes 2-Consent-Modell**: (1) Pflicht-Consent für die transaktionale Zusendung, (2) optionaler,
  nicht vorausgewählter Marketing-Consent + vertrauensbildende Microcopy.
- **Prominenter Versuchszähler** inkl. Reset-Datum.
- Neuer State `GeneratorStateKind.LimitReached` mit eigenem, conversion-orientiertem Preview-Flow + CTA zum
  Kontaktformular (Name/E-Mail nach Möglichkeit vorbefüllt).

Skills für die Umsetzung: `copywriting` (alle Texte), `frontend-design` (Design), `invessiv-landing` (Sektions-/
CTA-Konventionen). Recherche-Quellen zum Consent-Modell: MailerLite, Kerstin Martin, Suzanne Dibble (siehe Abschnitt
„Consent-Recherche").

---

## Architekturentscheidung: Generierung vs. Zustellung trennen

Heute laufen Generierung **und** E-Mail-Versand in **einem** Request
(`POST /api/public/generator/linkedin-post` → `generate-linkedin-post.command-handler.ts`, versendet Mail wenn `email`
gesetzt). Da E-Mail nun **nach** der Generierung erfasst wird, muss der Versand ein **zweiter** Request werden.

**Empfohlener Ansatz — signierter Deliver-Schritt (kein schwerer Server-State):**

1. Der Generierungs-Response liefert zusätzlich einen **signierten `deliveryToken`** (HMAC über die kleinen,
   reproduzierbaren Post-Felder: `post`-DTO, `caption`, `downloadFileName`, `exp`-Ablauf). Kein Caching der großen
   `imageDataUrl` nötig.
2. Neuer Endpoint `POST /api/public/generator/linkedin-post/deliver` nimmt `{ deliveryToken, displayName, email,
consentDelivery, consentMarketing, intent }`. Server **verifiziert die Signatur** (verhindert, dass beliebiger Inhalt
   an beliebige Adressen verschickt wird — Anti-Abuse), **rendert das PNG deterministisch neu** aus dem Post-DTO
   (gleiches `render-linkedin-post-service.ts`) und versendet die Mail über das bestehende
   `linkedin-post-generator-result.ts`-Template.
3. Rate-Limiting des Deliver-Endpoints über denselben IP-Key-Mechanismus (
   `linkedin-post-generator-usage-key-service.ts`),
   eigener Scope, damit der Generierungs-Zähler unberührt bleibt.

Der **Download** braucht technisch keinen Server (Bytes liegen im Browser). Da er aber als Lead-Tausch gilt, löst die
Lead-Form-Submission einen leichten **Lead-Record-Call** (gleicher Deliver-Endpoint, `intent: "download"`, ohne
Mailversand) aus und triggert danach den client-seitigen Download.

> Diese Trennung ist als **Phase B** ausgewiesen und kann unabhängig von der Frontend-Umstrukturierung (Phase A)
> abgenommen werden. Ohne Phase B funktioniert der Download-Pfad, der E-Mail-Pfad würde als „Coming soon"
> gekennzeichnet.

---

## Geplante Änderungen

### Phase A — Frontend-Umstrukturierung (Kern)

#### A1. State-Machine erweitern

- `apps/web/common/constants/generator/generator-state-kind.ts`: neuen Key ergänzen
  `LimitReached: "limit_reached"` (Const-Objekt-Pattern, PascalCase-Key).
- `apps/web/common/contracts/generator/generator-state.ts`: neue Variante
  `{ kind: typeof GeneratorStateKind.LimitReached; usageLimit: { limit; remaining; resetAt } }`.
  Success-Variante um optionalen `deliveryToken: string` ergänzen (für Phase B; in Phase A unbenutzt/optional).
- `generator-section.tsx` `handleSubmit`: bei
  `!result.ok && result.code === LinkedInPostGeneratorErrorCode.UsageLimitReached`
  → State `LimitReached` (mit `usageLimit`) statt `Error`. Echte Fehler bleiben `Error`.

#### A2. Generier-Formular verschlanken (anonym)

- `generator-form.tsx`: `delivery`-Fieldset (displayName, email, consent) **entfernen**. Es bleiben: topic, expertise,
  tone, color, Honeypot, Submit, Versuchszähler, schlanke Privacy-Notiz.
- `linkedin-post-generator-form-values.ts` / Request-DTO: Generierungs-Request sendet künftig leere bzw. keine
  Identitätsfelder. Validierung in `generator-section.tsx` `validate()` entfällt für displayName/email/consent.
  Server-`validation` so anpassen, dass Identitätsfelder optional/leer akzeptiert werden (siehe Phase B Hinweis).
- Privacy-Notiz im Generier-Schritt vereinfachen (kein „E-Mail ist optional" mehr, da hier gar keine E-Mail erfasst
  wird).

#### A3. Versuchszähler als eigene Komponente (prominent)

- Neue Komponente `generator-section/usage-meter/usage-meter.tsx` (+ `.module.css` + `.test.tsx`).
  - Props: `{ usageLimit?: { limit; remaining; resetAt }, locale, content }`.
  - Vor erstem Lauf (kein `usageLimit`): „2 kostenlose Tests" (aus Dictionary).
  - Nach Lauf: „Noch {remaining} von {limit} · Reset am {Datum}" + visuelle Pips/Punkte für verbrauchte/freie Tests.
  - Reset-Datum locale-sicher via `Intl.DateTimeFormat(locale, …)` (kleiner Helper, kein `de`/`en`-Branch).
  - Platzierung: im Formular-Header sichtbar (Desktop oben, Mobile gut sichtbar).
- Ersetzt den bisherigen kombinierten `generatorNote`-Block in `generator-form.tsx`.

#### A4. Lead-Schritt nach Erfolg (eigene Komponente)

- Neue Komponente `generator-section/lead-capture/lead-capture-card.tsx` (+ `.module.css` + `.test.tsx`).
  - Erscheint nur bei `state.kind === Success`. Ersetzt das bisherige `successPanel`-Markup in `generator-form.tsx`
    sowie die Download-Buttons in `success-preview.tsx` (Download/Versand wandert in den gated Lead-Schritt).
  - Felder: `displayName` (Pflicht für Tausch), `email` (Pflicht), Consent-Pflicht (transaktional), Consent-Marketing
    (optional, nicht vorausgewählt) + Microcopy.
  - Zwei Aktionen: **„Herunterladen"** und **„Per E-Mail schicken"** — beide erst nach valider Eingabe aktiv.
  - Lokaler Form-State + Validierung (eigener, von der Generierung getrennter State; folgt
    Error-Code/Message-Konvention).
  - Erfolgs-/Fehlerzustände sichtbar (Mail versendet / Download gestartet / Fehler).
- `success-preview.tsx`: zeigt weiterhin den gerenderten Post (Vorschau mit Platzhalter-Autor) + Follow-up-Card,
  bindet aber die `LeadCaptureCard` für die Aktionen ein. Reine Copy-Buttons (Clipboard) dürfen frei bleiben
  (kein personenbezogener Tausch), Download/Versand sind gated.

#### A5. LimitReached-Preview (eigene Komponente, conversion-orientiert)

- Neue Komponente `generator-section/limit-reached-preview/limit-reached-preview.tsx` (+ `.module.css` + `.test.tsx`).
  - Props: `{ content, usageLimit, locale, followUpHref, onRequestCustomWorkflow }`.
  - **Kein** Alert-/Error-Look. Positive Rahmung: „Du hast deine 2 kostenlosen Posts erstellt." → „Gefällt dir das
    Ergebnis? Dann bauen wir daraus einen eigenen Workflow." + Reset-Hinweis „Neue Tests ab {Datum}." + Primär-CTA zum
    Kontaktformular.
  - Nutzt Follow-up-/Accent-Styling (wie `followUpCard`), nicht das `data-state="error"`-Styling.
- `preview-panel.tsx`: Routing-Zweig ergänzen `if (state.kind === LimitReached) return <LimitReachedPreview … />;`.
  `ErrorPreview` verliert den `UsageLimitReached`-Sonderfall (wird nur noch für echte Fehler genutzt).

#### A6. Prefill des Kontaktformulars (best-effort)

- `apps/web/common/contracts/marketing/…` (`ProjectOfferSyncDetail`): optionale Felder `displayName?`, `email?`
  ergänzen.
- `project-request-form.tsx` `handleOfferSync`: vorhandene `displayName`/`email` per `setValue` vorbefüllen
  (neuer kleiner `applyIdentitySeed`-Helper analog zu `applyProjectGoalSeed`).
- Generator-CTAs (LimitReached + Success-Follow-up) dispatchen `PROJECT_OFFER_CHANGE_EVENT` mit den im Lead-Schritt
  erfassten `displayName`/`email`, bevor zum `#contact`-Anchor gescrollt wird. Offer-Key passend setzen
  (z. B. LinkedIn-/Content-Offer). Hinweis: Bei „kalt" erreichtem Limit (ohne vorherigen Lead-Schritt) liegen keine
  Daten vor → Prefill bleibt leer, kein Fehler.

#### A7. i18n (DE + EN parallel, identische Keys)

- `apps/web/src/i18n/dictionaries/linkedin-post/generator/{de,en}.json` + `index.ts`-Typen erweitern:
  - `usageMeter`: `{ idle, remaining ({{remaining}}/{{limit}}), resetPrefix }`.
  - `leadCapture`: `{ headline, body, displayName{…}, email{…}, consentDelivery, consentMarketing, marketingMicrocopy,
downloadAction, emailAction, success{download,email}, error{…} }`.
  - `preview.limitReached`: `{ headline, body, resetPrefix, ctaLabel, ctaAriaLabel }`.
  - Generier-Schritt-`privacyNotice` vereinfachen; alte `delivery`/`displayName`/`email`/`consent`-Keys aus dem
    Form-Namespace in den Lead-Namespace verschieben.
- Alle Texte via `copywriting`-Skill, DE/EN konsistent, UTF-8 sauber.

### Phase B — Backend: anonyme Generierung, signierter Deliver-Schritt & Lead-Persistenz

> **Entscheidungen (vom Nutzer bestätigt, 2026-06):**
>
> - **Download-Aktion entfällt komplett.** Der Lead-Schritt nach der Generierung hat nur noch **eine** Aktion
>   „Per E-Mail schicken". Die bisherige „Herunterladen"-Logik in `lead-capture-card.tsx` und das Download-Wiring in
>   `success-preview.tsx`/`generator-section.tsx` werden **ersatzlos entfernt**. Clipboard-Copy bleibt frei (kein
>   personenbezogener Tausch).
> - **Lead-Persistenz über die bestehende Contact-Pipeline** (kein neues Schema-Silo). Es entsteht **immer** ein Lead,
>   sobald die Pflicht-Consent (transaktional) gesetzt ist; der optionale Marketing-Consent wird als **Flag**
>   gespeichert und steuert ausschließlich spätere Marketing-Mails (DSGVO-Zwecktrennung, §7 UWG). Nur der
>   **E-Mail-Versand** persistiert — einen reinen Download gibt es nicht mehr.
> - **Typ-Modell: Channel + Origin.** Neuer Channel `linkedin_post_delivery` für die Post-Zustellung; Projekt-Anfragen
>   bleiben `project_request`, erhalten aber einen neuen **Origin**-Marker. Origin `linkedin_post` markiert beide
>   LinkedIn-Post-Flows (Post-Zustellung + Projekt-Anfrage von der LinkedIn-Post-Seite); bestehende Flows = Origin
>   `website`.

#### B1. Shared Constants & Contracts (`packages/common`)

- `CONTACT_REQUEST_KIND` um `LinkedInPostDelivery: "linkedin_post_delivery"` erweitern (+ `CONTACT_REQUEST_KINDS`-Array,
  - Test). Channel ist nur DB-`text` (keine CHECK-Constraint) → keine Enum-Migration nötig.
- Neues Const-Objekt `ContactSubmissionOrigin` (`Website: "website"`, `LinkedInPost: "linkedin_post"`) +
  `CONTACT_SUBMISSION_ORIGIN_VALUES` + Test in `packages/common/src/constants/contact/`.
- Neue DTOs: Deliver-Request (`{ deliveryToken, displayName, email, consentDelivery, consentMarketing, locale }`) und
  Save-DTO für den Post-Delivery-Lead.
- Generator-Error-Codes erweitern: `DeliveryTokenInvalid`, `DeliveryTokenExpired`, `DeliveryRateLimited`
  (+ Message-Mapping in der Nutzungsschicht, nicht inline).

#### B2. DB: Migration + Persistenz (`packages/db`)

- `lead_submissions` um `origin` (text, notNull, default `'website'`) und `marketing_consent` (boolean, notNull,
  default false) erweitern — Record-Config (`record-configuration/lead-submissions.ts`) + Migration.
- Channel-Detailrecord für die Post-Zustellung: Default = bestehendes `lead_email_contact` wiederverwenden
  (Topic-Kontext im Message-Feld), keine neue Tabelle, sofern nicht zwingend nötig — in B2 final entscheiden.
- Persistenzfunktion nach Contact-Pattern (`@invessiv/db/<domain>/**`), vom Web-Server aufgerufen; Mapping API→DB an der
  Server-zu-DB-Grenze (siehe `server/linkedin-post/AGENTS.md`).

#### B3. Deliver-Token-Service + Generierungs-Response (`apps/web/src/server/linkedin-post`)

- Neuer `linkedin-post-delivery-token-service.ts`: HMAC-SHA256 (eigenes Secret `GENERATOR_DELIVERY_TOKEN_SECRET`,
  Pattern wie `linkedin-post-generator-usage-key-service.ts`) über `{ post, caption, downloadFileName, locale, exp }`;
  `createDeliveryToken` + `verifyDeliveryToken`. Unit-Test (sign/verify/expiry/tamper).
- Generierungs-Service/Handler: optionales `deliveryToken` in den Success-Response aufnehmen
  (`linkedin-post-generator-success-response.ts`). Mailversand im Generate-Schritt bleibt entfernt.

#### B4. Deliver-Endpoint + Command-Handler

- `apps/web/src/app/api/public/generator/linkedin-post/deliver/route.ts` (dünner HTTP-Adapter) +
  `handlers/deliver-linkedin-post.command-handler.ts`: Body validieren (Zod gegen Deliver-DTO) → Token verifizieren →
  Post-DTO re-rendern (`renderLinkedInPostHtml` → `renderLinkedInPostPng`) → Mail via bestehendem Template versenden →
  Lead persistieren (Channel `linkedin_post_delivery`, Origin `linkedin_post`, `marketing_consent`) → Rate-Limit über
  eigenen, getrennten Scope (gleiche IP-Key-Mechanik) → Fehler-Mapping.

#### B5. Frontend-Anpassung (Lead-Schritt)

- `lead-capture-card.tsx`: „Herunterladen"-Button + `onDownload`-Prop + Download-Feedback **entfernen**; nur
  „Per E-Mail schicken" bleibt → ruft Deliver-Endpoint mit `deliveryToken` + Identität + Consents auf; Erfolg/Fehler
  sichtbar (kein „coming soon" mehr).
- `success-preview.tsx`/`generator-section.tsx`: Download-Wiring (`onDownloadImage`/`onDownloadCaption` Richtung
  Lead-Schritt) entfernen; `deliveryToken` aus dem Success-State in die Karte reichen.
- Projekt-Anfrage über die LinkedIn-Post-Seite mit `origin: linkedin_post` taggen (project-request-Flow um optionales
  Origin-Feld erweitern; Default `website`).
- i18n DE/EN parallel: Lead-Schritt-Texte auf „nur E-Mail" reduzieren; Deliver-Erfolg/-Fehler ergänzen.

#### B6. Tests

- Unit: delivery-token-service, neue Constants, Deliver-Command-Handler (Token-Verify, Re-Render-/Mail-/Persist-Mock,
  Rate-Limit), Deliver-Validation-Schema.
- jsdom: `lead-capture-card` (nur E-Mail-Aktion, Consent-Gating, Marketing-Flag), `generator-section`
  (deliveryToken-Fluss).
- DB-Smoke für Migration/Persistenz, soweit Pattern vorhanden.

### Phase C — Tests & Verifikation

- Logik-/jsdom-Tests: `usage-meter.test.tsx` (idle vs. remaining vs. 0), `lead-capture-card.test.tsx`
  (Validierung, Consent-Gating, Download- vs. Email-Aktion), `limit-reached-preview.test.tsx` (CTA + Prefill-Dispatch).
- `generator-section.test.tsx` erweitern: `usage_limit_reached` → `LimitReached`-Preview (nicht Error); Lead-Schritt
  erscheint erst nach Success.
- Phase B: Handler-Tests für Token-Verifikation, Rate-Limit, Mailversand (analog bestehender Handler-Tests).

---

## Kritische Dateien (Referenz)

| Zweck                   | Pfad                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Section-Orchestrierung  | `apps/web/src/components/marketing/linkedin-post/generator-section/generator-section.tsx`                                                                                             |
| Generier-Formular       | `…/generator-section/generator-form.tsx`                                                                                                                                              |
| Preview-Routing         | `…/generator-section/preview-panel.tsx`                                                                                                                                               |
| Success-Preview         | `…/generator-section/success-preview.tsx`                                                                                                                                             |
| State-Kind-Konstante    | `apps/web/common/constants/generator/generator-state-kind.ts`                                                                                                                         |
| State-Contract          | `apps/web/common/contracts/generator/generator-state.ts`                                                                                                                              |
| Form-Values             | `apps/web/common/contracts/generator/linkedin-post-generator-form-values.ts`                                                                                                          |
| Error-Codes             | `apps/web/common/constants/generator/linkedin-post-generator-error-codes.ts`                                                                                                          |
| Generator-Dictionary    | `apps/web/src/i18n/dictionaries/linkedin-post/generator/{de,en}.json` + `index.ts`                                                                                                    |
| Generierungs-Handler    | `apps/web/src/server/linkedin-post/handlers/generate-linkedin-post.command-handler.ts`                                                                                                |
| Mail-Template           | `apps/web/src/server/services/mail/templates/linkedin-post-generator-result.ts`                                                                                                       |
| PNG-Render              | `apps/web/src/server/linkedin-post/services/rendering/linkedin-post-render-service.ts`                                                                                                |
| Usage-Limit (IP-Key/DB) | `apps/web/src/server/linkedin-post/services/usage-limit/linkedin-post-generator-usage-key-service.ts`, `packages/db/src/linkedin-post/reserve-linkedin-post-generator-usage-limit.ts` |
| Contact-Prefill-Event   | `apps/web/common/constants/marketing/project-offer-change-event.ts`, `…/contact-section/project-request-form/project-request-form.tsx`                                                |

**Wiederverwenden statt neu bauen:** `linkedin-post-render-service.ts` (Re-Render im Deliver), Mail-Template,
`linkedin-post-generator-usage-key-service.ts` (Rate-Limit), `PROJECT_OFFER_CHANGE_EVENT`-Mechanik (Prefill),
`PrimaryCtaLink`/`PrimaryCtaButton`, `Field`-Komponente, bestehender Honeypot.

---

## Consent-Recherche (Begründung 2-Consent-Modell)

- DSGVO verlangt aktiven Opt-in; **keine** vorausgewählten Boxen, **kein** Soft-Opt-in.
- Die für die **Zustellung** angegebene E-Mail darf nur für genau diesen Zweck genutzt werden (transaktional). Für
  **Marketing-Follow-up** ist eine **separate, optionale** Einwilligung nötig (oder ein klarer Hinweis im Formular).
- Vertrauensbildende **Microcopy** direkt am Feld („Kein Spam, jederzeit abbestellbar") senkt Abbruchquote.
- → Modell: Pflicht-Consent (transaktional, nur bei E-Mail) + optionaler Marketing-Consent + Microcopy. Ehrlich,
  nicht versteckt, nicht aufdringlich.

Quellen: MailerLite (GDPR Sign-Up Forms), Kerstin Martin (GDPR Lead Magnets), Suzanne Dibble (GDPR & Lead Magnets),
CampaignCleaner (Opt-In Form Best Practices).

---

## Verifikation (End-to-End)

1. `npm run typecheck` + `npm run lint` grün.
2. Vitest/jsdom: neue + erweiterte Tests grün (`usage-meter`, `lead-capture-card`, `limit-reached-preview`,
   `generator-section`).
3. App lokal starten (`run`/dev), Route `/de/services/linkedin-post#generator` und `/en/...`:
   - Generieren ohne Name/E-Mail → Erfolg, Vorschau mit Platzhalter-Autor.
   - Versuchszähler zeigt „Noch 1 von 2 · Reset am …".
   - Lead-Schritt erscheint erst nach Erfolg; Download/Versand erst nach valider Name+E-Mail+Pflicht-Consent aktiv;
     Marketing-Consent optional; Microcopy sichtbar.
   - Zweiter Lauf → Zähler 0; dritter Versuch → `LimitReached`-Preview (kein Error-Look) mit CTA zum Kontaktformular,
     Name/E-Mail vorbefüllt (sofern vorher erfasst).
   - Phase B: E-Mail-Versand-Pfad liefert Mail mit Bild + Caption; manipuliertes Token wird abgelehnt.
4. A11y-Smoke: Fokus-Reihenfolge Generierung → Lead-Schritt → CTA; sichtbare Focus-States; `aria-live` für
   Statusmeldungen.
5. Mobile-first (360 px) + Dark/Light konsistent.

---

## Offene Punkte / bewusste Entscheidungen

- **Lead-Persistenz**: ENTSCHIEDEN (2026-06) — Contact-Pipeline wiederverwenden, Channel + Origin, Marketing-Consent als
  Flag, nur E-Mail-Versand persistiert. Siehe Phase-B-Entscheidungsblock.
- **Download-Aktion**: ENTSCHIEDEN (2026-06) — komplett entfernt; einzige Lead-Aktion ist „Per E-Mail schicken".
- **Channel-Detailrecord** für die Post-Zustellung (eigene Tabelle vs. `lead_email_contact` wiederverwenden): in B2
  final zu entscheiden; Default = Wiederverwendung.
- Architektur-Gate: Alle neuen Komponenten als eigener Ordner + scoped `*.module.css` + Test; Texte nur in
  Dictionaries; Routen/Pfade aus Konstanten; Error-Codes via Const-Objekt + Message-Helper.
