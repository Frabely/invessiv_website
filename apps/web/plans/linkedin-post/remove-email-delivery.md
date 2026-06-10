# LinkedIn-Post-Generator: E-Mail-Zustellung vollständig entfernen

## Ziel

Der öffentliche LinkedIn-Post-Generator darf keine E-Mails mehr an beliebige oder unbekannte Postfächer senden. Die
gesamte feature-spezifische Zustelllogik wird entfernt: Delivery-Route, Delivery-Token, Delivery-Handler,
Delivery-Rate-Limit, Delivery-DTOs und LinkedIn-Post-spezifische Mail-/Persistenzpfade.

Kontaktformulare und deren allgemeiner Mailversand bleiben unverändert.

## Begründung

Der aktuelle Flow erlaubt nach erfolgreicher Generierung einen Versand über die Invessiv-Domain an eine frei eingegebene
E-Mail-Adresse. Selbst mit Rate-Limits oder Double-Opt-In-artigen Varianten bliebe mindestens ein initialer Versand an
eine eingegebene Adresse möglich. Da das Ziel ist, Versand an unbekannte Postfächer komplett zu vermeiden, wird der
öffentliche Generator auf rein browserseitige Ausgabe umgestellt.

## Nicht-Ziele

- Kein neuer Verifikations- oder Double-Opt-In-Flow.
- Kein neuer serverseitiger ZIP- oder Download-Endpunkt.
- Keine Änderung am allgemeinen `sendMail`-Service für Kontaktformulare.
- Kein Refactor der verbleibenden Generator-Usage-Limit-Mechanik, außer es wird durch entfernte Delivery-Referenzen
  zwingend notwendig.

## Umsetzungsplan

### 1. Delivery-API und Serverlogik entfernen

- Entferne die Route `apps/web/src/app/api/public/generator/linkedin-post/deliver/`.
- Entferne den Command-Handler `deliver-linkedin-post.command-handler.ts`.
- Entferne `linkedin-post-deliver-validation.ts`.
- Entferne `linkedin-post-delivery-token-service.ts` und die zugehörigen Tests.
- Entferne `linkedin-post-delivery-rate-limit-service.ts`.
- Entferne `linkedin-post-delivery-lead-mapper.ts`, sofern danach keine produktiven Referenzen mehr existieren.
- Entferne feature-spezifische Delivery-Log-Events nur dann aus Konstanten, wenn sie ausschließlich vom entfernten Flow
  genutzt wurden.

### 2. Shared Contracts und API-Konstanten bereinigen

- Entferne Deliver-DTOs und Inputs:
  - `linkedin-post-deliver-request.ts`
  - `linkedin-post-deliver-response.ts`
  - `linkedin-post-deliver-input.ts`
  - `linkedin-post-deliver-command.ts`, falls ausschließlich für den entfernten Handler genutzt
  - `linkedin-post-delivery-token.ts`
- Entferne die zugehörigen Reexports aus `apps/web/common/contracts/generator/index.ts`.
- Entferne den Deliver-Endpunkt aus `WebApiEndpoint`, falls vorhanden.
- Entferne `deliveryToken` aus `LinkedInPostGeneratorSuccessResponseDto`.
- Entferne `deliveryToken` aus `GeneratorState.Success`.

### 3. Generate-Handler vereinfachen

- Entferne Import und Nutzung von `linkedinPostDeliveryTokenService`.
- Entferne `DeliveryTokenSecretMissingError`.
- Entferne `createDeliveryTokenForResult`.
- Der Generate-Handler liefert bei Erfolg weiterhin:
  - `post`
  - `caption`
  - `downloadFileName`
  - `previewHtml`
  - `imageDataUrl`
  - `usageLimit`
- Der Handler darf keinen Token mehr erzeugen und keine Delivery-Konfiguration benötigen.

### 4. Mail- und DB-Pfade entfernen, die nur Delivery betreffen

- Entferne das LinkedIn-Post-spezifische Result-Mail-Template
  `apps/web/src/server/services/mail/templates/linkedin-post-generator-result.ts`, wenn es danach keine Referenzen mehr
  gibt.
- Entferne die zugehörigen Mail-Template-Tests.
- Entferne `packages/db/src/contact/persist-linkedin-post-delivery.ts`, sofern es nur vom entfernten Delivery-Handler
  genutzt wird.
- Prüfe und entferne ungenutzte DB-Contracts für LinkedIn-Post-Delivery-Persistenz.
- Entferne Mail-Dictionaries für `mail/linkedin-post-generator-result`, wenn sie danach nicht mehr genutzt werden.
- Der allgemeine Mail-Service, Resend-Provider und Kontaktformular-Mailtemplates bleiben bestehen.

### 5. Environment und Dokumentation bereinigen

- Entferne `GENERATOR_DELIVERY_TOKEN_SECRET` aus `apps/web/.env.example`.
- Entferne oder aktualisiere Plan-/Dokureferenzen, die den E-Mail-Delivery-Flow als Zielzustand beschreiben.
- In veralteten Plan-Dateien darf historischer Kontext bestehen bleiben, wenn klar ist, dass der neue Rückbauplan den
  Zielzustand ersetzt.

### 6. Tests anpassen

- Entferne Route-Tests für `/api/public/generator/linkedin-post/deliver`.
- Entferne Token-Service-Tests.
- Entferne Client-Delivery-Service-Tests, falls vorhanden.
- Passe Generate-Route-Tests an:
  - Erfolg enthält kein `deliveryToken`.
  - Fehlendes `GENERATOR_DELIVERY_TOKEN_SECRET` ist kein Testfall mehr.
  - Erfolg enthält weiterhin `imageDataUrl`, `previewHtml`, `caption`, `downloadFileName`.
- Ergänze einen Referenzcheck per `rg`:
  - `deliveryToken`
  - `LinkedInPostDeliver`
  - `linkedinPostDeliver`
  - `GENERATOR_DELIVERY_TOKEN_SECRET`
  - `persistLinkedInPostDeliveryLead`
  - `linkedin-post-generator-result`

## Akzeptanzkriterien

- Der öffentliche LinkedIn-Generator sendet keine E-Mail mehr.
- Es existiert keine öffentliche Deliver-API-Route mehr.
- Der Generator erzeugt keine Delivery-Tokens mehr.
- Es gibt keine produktiven Referenzen mehr auf `GENERATOR_DELIVERY_TOKEN_SECRET`.
- Kontaktformulare senden weiterhin wie bisher über den allgemeinen Mail-Service.
- `npm run typecheck`, `npm run lint`, `npm run build:web` laufen grün.

## Folgearbeit

Der Download-Ersatz für den entfernten Mailflow wird im separaten Plan
`zip-download-refactor.md` beschrieben.
