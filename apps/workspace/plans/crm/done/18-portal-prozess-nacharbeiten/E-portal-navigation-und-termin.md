# Paket E — Kleine Portal-Korrekturen

> Teil von [README.md](./README.md) (Ziel, Entscheidungen, Reihenfolge, gemeinsame Regeln, Abnahme). Nur Plan, nichts umgesetzt.

- **E1 — Logo und Firmenname führen zum Dashboard (bugs 11).**
  `portal-shell.tsx`: Der Link umfasst Logo und Namen und zeigt auf `portalPathFor(locale, customerId)` statt auf die
  Firmenauswahl. `PortalShell` bekommt dafür `homeHref` vom Layout. Bei mehreren Firmen bleibt der Umschalter
  (`CustomerSwitcher`) ein eigenes Bedienelement neben dem Link. `brandHomeAriaLabel` neu: „Zum Überblick“.
  `layout.test.tsx` anpassen.
- **E2 — Zurück-Link überall (bugs 10).**
  Die drei eigenen `.back`-Links (Feedback, Onboarding-Übersicht, Onboarding-Bogen) werden eine gemeinsame Komponente
  `components/portal/portal-back-link/` und kommen zusätzlich auf `files` und `messages`. Text einheitlich „Zurück zum
  Überblick“ (so steht es schon in zwei Dictionaries). Damit ist Lücke 2 aus `portal-messages-page-offen.md`
  (Variante A, Rückweg) mit erledigt.
- **E3 — Buchungslink beim Ansprechpartner und im Feedback-Gespräch (bugs 8, 14).**
  `onboarding-booking-card` wird zur neutralen `components/portal/booking-link/` (Anbieterhinweis vor dem Klick, neuer
  Tab, nichts eingebettet — die Consent-Regel bleibt). Datenweg wie beim Onboarding:
  `projectResponsibleMemberService.findBookingContact` → `toBookingDto`. `PortalOnboardingBookingDto` wird zum
  neutralen `PortalBookingDto`.
  - Feedback: `getPortalProjectFeedback` liefert `booking`; `FeedbackTeamNotice` zeigt im Zustand „Gespräch“ den Button
    „Termin buchen“ über dem Chat-Link. Ohne Link bleibt der heutige Text.
  - Ansprechpartner-Widget: `PortalContactDto` bekommt `booking`; Button „Termin buchen“ neben „E-Mail schreiben“.
  - Cross-Customer-Negativtest für den erweiterten Feedback-Endpunkt bleibt grün; neuer Test „inaktives Mitglied
    liefert keinen Link“.
