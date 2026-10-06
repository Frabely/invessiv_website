# Paket C — Onboarding intern

> Teil von [README.md](./README.md) (Ziel, Entscheidungen, Reihenfolge, gemeinsame Regeln, Abnahme). Umsetzung abgeschlossen.

- [x] **C1 — Vorlage auf leeren Entwurf anwenden (bugs 2).**
      Neuer Endpunkt `POST …/onboarding/forms/[formId]/template` mit Handler `apply-onboarding-form-template`. Erlaubt nur
      im Status `draft` und nur, solange der Bogen keinen Block hat. Wiederverwendet `findTemplateBlocks`,
      `appendCatalogBlock` und `onboardingPrefillService.prefillBlocks` aus `onboarding-form-create-service.ts` (private
      Funktionen werden Methoden des Service-Objekts). UI: Im leeren Entwurf steht statt der leeren Liste „Vorlage wählen“
      neben „Baustein hinzufügen“. Eintrag in `CRM_ENDPOINT_ACCESS_RULES`, Negativtests für fremden Kunden und fremdes
      Projekt, Test „Bogen mit Blöcken wird abgewiesen“.
- [x] **C2 — Mehrere Bausteine auf einmal (bugs 3, Server).**
      `add-onboarding-form-block` nimmt `catalogBlockIds: string[]` (1–30) statt einer Id und kopiert alle in einer
      Transaktion mit einer Sperre, einer Vorbefüllung und einer Antwort. Das beseitigt die Wartezeit je Klick.
      `onboarding-form-schemas.ts`, DTO und `onboardingFormApiService.addBlock` anpassen.
- [x] **C3 — Mehrfachauswahl und Ladeanzeige (bugs 3, UI).**
      `questionnaire-block-picker-dialog.tsx` bekommt Checkboxen je Zeile, einen Fußbereich „n ausgewählt · Hinzufügen“
      und eine `busy`-Prop (Button mit Ladezustand, Zeilen gesperrt). Bei Fehler bleibt der Dialog offen und zeigt die
      Meldung. Der Vorlagen-Editor nutzt denselben Dialog und bekommt die Mehrfachauswahl ohne Zusatzaufwand.
