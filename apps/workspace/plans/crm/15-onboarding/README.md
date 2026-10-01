# Ordner 15 — Onboarding

> **Status:** läuft (15.1–15.3 gemergt, 15.4 im Review) · **Abhängigkeiten:** 07 (Projekte, Projektleistungen), 08 (Aufgaben), 12a/12b/13 (Portal), 13a
> (Chat, Systemnachrichten), 14 (Dateien), 16 (Feedbackrunden, deren Bausteine hier verallgemeinert werden) — alle
> gemerged · **Aufwand:** 16–21 Tage gesamt · **Reviewziel:** acht Teil-PRs mit je 30–110 Dateien

> **Neuzuschnitt 30.09.2026 (mit dem Owner abgestimmt):** Ersetzt die Ordner `15b-onboarding-bogen` (Tasks 44/45) und
> `15c-onboarding-abschluss` (Tasks 46/47) vollständig. Nicht mehr gültig: Fragenkatalog als Code-Konstante ohne
> Pflegeoberfläche, `onboarding_submissions`, Aufgaben-Verzahnung (Task 46), „Onboarding abgeschlossen = Projektphase
> über `onboarding` hinaus“. Task 47 (Buchungslink) lebt überarbeitet als Task 69 weiter.

> **Quelle der Inhalte:** Die ausführliche Liste des Owners („Standard-Onboarding Webdesign – Portalstruktur“) ist
> kuratiert in [`64a-standardkatalog.md`](./64a-standardkatalog.md) eingeflossen. Diese Datei ist die verbindliche
> Fassung; die Ursprungsliste wird nicht weiter gebraucht.

> **Portal-Fundament:** Seiten über `requirePortalActor(locale, customerId)` bzw. `requirePortalReader`, Endpunkte über
> `withPortalActor` bzw. `withPortalReader`, jede Portal-Query über `portalAccessCondition`, jede Portal-Mutation über
> `portalCanOn` (alles in `apps/workspace/src/server/portal/shared/` bzw. `auth/`). Eigene Portal-Permissions dieses
> Ordners, in `portal_standard` ergänzt: `portal.onboarding.read` und `portal.onboarding.submit`. Firmenweites Modul.

## Benennung: `questionnaire` und `onboarding` (01.10.2026, mit dem Owner abgestimmt)

Der Baukasten (Bausteine, Felder, Optionen, Übersetzungen, Vorlagen, Block-Editor, Vollständigkeits- und
Wertprüfung) soll später auch außerhalb des Onboardings nutzbar sein, mindestens als einbindbare UI. Er ist deshalb
im Code **fachneutral als `questionnaire`** benannt: Tabellen `questionnaire_*`, Konstanten, DTOs und Patterns unter
`…/crm/questionnaire/`, Komponenten unter `components/workspace/crm/questionnaire/`, Services unter
`services/questionnaire/`, API unter `/api/workspace/crm/questionnaire/…`, Katalogseite `/crm/questionnaire-templates`,
Permissions `questionnaire_templates.read/write`, Fehlercodes `QuestionnaireErrorCode`.

**`onboarding` heißt nur, was fachlich Onboarding ist:** der Bogen am Projekt (`onboarding_forms`), sein Statusfluss,
die Prüfung je Block (`onboarding_form_blocks`), Antworten, Gruppeneinträge und Datei-Verknüpfungen
(`onboarding_answers`, `onboarding_group_entries`, `onboarding_answer_files`), der Leistungs-Snapshot, die
Portal-Permissions `portal.onboarding.*` und die Fehlercodes `OnboardingErrorCode`.

Bewusst **nicht** gebaut: eine neutrale Bogen-Instanz, ein Einsatzbereich-Merkmal am Katalog oder ein zweiter
Einsatzort. `questionnaire_blocks.owner_form_id` zeigt weiter auf `onboarding_forms`. Ein weiterer Einsatzort bringt
seine eigenen Tabellen mit und bindet Editor und Patterns ein. Die Task-Dateien 65–70 nennen Bausteine des
Baukastens bereits mit den neuen Namen; neue Dateien dort folgen derselben Trennung.

## Worum es geht

Ziel ist ein möglichst reibungsloser Prozess, um **alle Informationen und Assets eines Projekts vollständig
einzusammeln, bevor die Arbeit beginnt** — ohne dass danach Logos, Bilder, Texte, Links, Ansprechpartner oder
Zugangsinfos einzeln per Mail nachgefordert werden müssen. Der anschließende Onboarding-Call dient der Abstimmung,
nicht der Datensammlung.

Das Onboarding findet **zu Beginn jedes Projekts** statt (ein Kunde kann mehrere Projekte haben). Firmenweite Inhalte
(Unternehmen, Marke, Kontakt, Rechtliches …) werden beim Folgeprojekt aus dem letzten abgeschlossenen Bogen vorbefüllt,
der Kunde prüft sie nur noch.

Was bereits feststeht (gebuchte Leistungen, Anzahl Seiten, Wartung/SEO, Feedbackrunden, Hosting, Preis), wird
**nicht erneut abgefragt**. Die Projektleistungen erscheinen nur lesbar im Bogen und werden vom Kunden bestätigt.

## Ablauf

```txt
1 Katalog & Vorlagen pflegen (intern, einmalig)       Bausteine = Blöcke mit Feldern, Vorlagen = geordnete Blockauswahl
        ↓
2 Onboarding starten (intern, je Projekt)             Vorlage wählen → Snapshot-Kopie als Bogen (draft)
        ↓                                             Blöcke/Fragen im selben Editor anpassen; Vorbefüllung aus
        ↓                                             Vorbogen (carry_over) und CRM (prefill_source)
3 Freigeben                                           status open; Sprachwarnung; Chat-Systemnachricht
        ↓
4 Kunde füllt aus (Portal, über Tage)                 Block = Schritt, Autosave je Feld, Upload je Feld,
        ↓                                             Bedingungen, Fortschritt, Projektleistungen bestätigen
5 Absenden                                            nur mit allen sichtbaren Pflichtfeldern; danach gesperrt
        ↓
6 Prüfung je Block (intern)                           vollständig | Rückfrage (Nachforderung ans Portal oder Call-Agenda)
        ↓   ↺ Nachforderung: status changes_requested, nur betroffene Blöcke editierbar, erneut absenden
7 Onboarding-Call                                     Buchungslink des Projekt-Owners im Portal-Widget
        ↓
8 Onboarding abschließen (intern)                     Pflichtfelder vollständig + Call-Datum; Leistungen eingefroren;
                                                      optional Phase onboarding → design; Bogen dauerhaft read-only
```

Nach dem Abschluss bleibt der Bogen in Portal und CRM **nur lesbar mit allen Anhängen** — er ist die Arbeitsgrundlage.
Weitere Dateien kommen über den Dateibereich, den Chat oder Aufgaben, nicht mehr über den Bogen.

## Teil-PRs (bewusste Ausnahme von „ein Ordner = ein PR“)

Wie `14-dateien` und `16-feedbackrunden` liegt das Onboarding in **einem** Ordner, wird aber in acht Teil-PRs
geliefert. Jede Teil-Einheit hat einen eigenen Branch, einen eigenen PR, einen eigenen Status und hält `master`
deploybar. Reine Fundamente bleiben unsichtbar; sichtbare Funktionen werden vertikal vollständig geliefert.

| PR   | Task | Branch                               | Datei                                                                                                              | Nach Merge sichtbar                                                                        | Dateien | Status    |
| ---- | ---- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------: | --------- |
| 15.1 | 63   | `feat/crm-onboarding-1-datenmodell`  | [`63-datenmodell-und-regeln.md`](./63-datenmodell-und-regeln.md)                                                   | nichts                                                                                     |   55–75 | gemergt   |
| 15.2 | 64   | `feat/crm-onboarding-2-katalog`      | [`64-baustein-katalog-und-vorlagen.md`](./64-baustein-katalog-und-vorlagen.md) + [`64a`](./64a-standardkatalog.md) | CRM-Seite „Onboarding-Vorlagen“ mit Bausteinen und Vorlagen, Standardkatalog               |  90–110 | gemergt   |
| 15.3 | 65   | `feat/crm-onboarding-3-bogen-intern` | [`65-bogen-anlegen-und-anpassen.md`](./65-bogen-anlegen-und-anpassen.md)                                           | Intern: Onboarding je Projekt starten und anpassen (Entwurf)                               |   70–90 | gemergt   |
| 15.4 | 66   | `feat/crm-onboarding-4-portal-form`  | [`66-portal-formular.md`](./66-portal-formular.md)                                                                 | nichts für Kunden (Portal-Seite existiert, ist aber ohne freigegebenen Bogen unerreichbar) |  80–100 | im Review |
| 15.5 | 67   | `feat/crm-onboarding-5-portal-voll`  | [`67-portal-gruppen-dateien-leistungen.md`](./67-portal-gruppen-dateien-leistungen.md)                             | Freigeben, Portal-Navigation, Widget, vollständiger Bogen inkl. Gruppen und Uploads        |  80–105 | läuft     |
| 15.6 | 68   | `feat/crm-onboarding-6-pruefung`     | [`68-pruefung-und-nachforderung.md`](./68-pruefung-und-nachforderung.md)                                           | Intern: Prüfung je Block, Nachforderung, Call-Agenda. Portal: Nachforderung bearbeiten     |   60–80 | offen     |
| 15.7 | 69   | `feat/crm-onboarding-7-termin`       | [`69-onboarding-termin.md`](./69-onboarding-termin.md)                                                             | Buchungslink im Profil, Terminkarte im Onboarding-Widget                                   |   35–50 | offen     |
| 15.8 | 70   | `feat/crm-onboarding-8-abschluss`    | [`70-abschluss-und-leseansicht.md`](./70-abschluss-und-leseansicht.md)                                             | Onboarding abschließen, dauerhafte Leseansicht, Vorbefüllung für Folgeprojekte aktiv       |   45–65 | offen     |

**Reihenfolge ist zwingend:** 15.1 → 15.2 → 15.3 → 15.4 → 15.5 → 15.6 → 15.7 → 15.8. Jede Einheit setzt die
vorherige als gemerged voraus.

**Umsetzung (Modell · Variante):** Empfehlung wie in `16-feedbackrunden`: GPT für Migrationen mit vielen Constraints,
Nebenläufigkeit und Autorisierungs-Negativtests (15.1, 15.3-Server, 15.6-Server); Claude für UI, Copy
(`frontend-design`, `copywriting`) und querschnittliche Refactorings (15.2, 15.4, 15.5). Review jeder Teil-PR durch das
jeweils **andere** Modell.

### Warum kein Feature-Flag

Das Repository hat keine Feature-Flag-Infrastruktur. Die Sichtbarkeit wird stattdessen über den Zuschnitt gesteuert:
Bis 15.5 existiert **keine Aktion „Freigeben“**, also gibt es keinen Bogen im Status `open`, und die Portal-Seite aus
15.4 ist für Kunden unerreichbar (404, weil kein freigegebener Bogen existiert; kein Navigationseintrag, kein Widget).
Tests und Seeds erzeugen freigegebene Bögen direkt.

### Bewusste Zwischenstände

- **Nach 15.3:** Intern lassen sich Bögen anlegen und anpassen, sie bleiben `draft`. Das ist ein vollständiger,
  eigenständig nutzbarer Vorbereitungsschritt.
- **Nach 15.5 bis 15.6:** Ein Kunde kann absenden; die Prüfung je Block kommt mit 15.6. Ein abgesendeter Bogen ist bis
  dahin intern vollständig lesbar (kein toter Button). Vertretbar, solange noch keine Kunden eingeladen sind
  (Rollout-Gate). Werden vorher Kunden eingeladen, werden 15.5 und 15.6 gemeinsam gemergt.
- **Nach 15.6 bis 15.8:** Rückfragen und Call-Agenda funktionieren; der Abschluss kommt mit 15.8. Das Portal-Widget
  zeigt bis dahin „Abgesendet · Wir melden uns“.

## Fachmodell (Kurzfassung — Details in den Task-Dateien)

- **Bausteine (Blöcke)** bestehen aus **Feldern**. Ein Block ist im Portal ein Schritt. Blöcke haben einen internen
  `key`, übersetzte Titel/Intro-Texte und das Merkmal `carry_over` (firmenweit → wird aus dem Vorbogen übernommen).
- **Feldtypen** sind ein fester Satz im Code (Const-Objekt + DB-CHECK): `short_text`, `long_text`, `email`, `phone`,
  `url`, `choice`, `multi_choice`, `yes_no`, `scale`, `color`, `files`, `confirmation`, `group`, `project_services`.
  Das Verhalten eines Typs (Darstellung, Validierung) ist Code; die Inhalte (Texte, Optionen, Pflicht, Grenzen,
  Bedingungen) sind Daten.
- **Gruppe** (`group`) = wiederholbare Unterstruktur (Teammitglied, Testimonial, FAQ, Referenz-Website …) mit eigenen
  Unterfeldern, genau eine Ebene tief.
- **Bedingung** = „Feld sichtbar, wenn Feld X die Option Y hat“ (eine Ebene, im selben Block, nur Auswahl- und Ja/Nein-Felder als
  Auslöser). Unsichtbare Pflichtfelder sind nicht Pflicht.
- **Übersetzungen** liegen in eigenen Lokalisierungstabellen je übersetzbarem Element (Block, Feld, Option). Pflicht ist
  **mindestens eine** Sprache; weitere Sprachen sind reine Datenpflege.
- **Vorlagen** sind geordnete Listen von Katalogblöcken („Landingpage kompakt“, „Landingpage ausführlich“).
- **Katalog und Bogen teilen dieselben Definitionstabellen.** Ein Block gehört entweder dem Katalog
  (`owner_form_id IS NULL`) oder genau einem Bogen. Beim Start und beim Ergänzen wird tief kopiert (Snapshot);
  spätere Katalogänderungen ändern keinen bestehenden Bogen.
- **Bogen** = genau einer je Projekt, Status `draft → open → submitted ⇄ changes_requested → completed`.
- **Antworten** sind relationale Zeilen (kein `jsonb`), Dateien hängen über eine Verknüpfungstabelle am Feld.

## Regeln

- Kein Feld fragt ab, was im CRM bereits steht, ohne es vorzubelegen (`prefill_source`). Es gibt **kein
  Zurückschreiben** aus dem Bogen ins CRM.
- Im Bogen stehen **keine Passwörter oder Secrets**. Abgefragt werden nur Fakten (Zugangs-E-Mail, Domain,
  Domain-Anbieter, Verwalter, Postfächer, DNS-Besonderheiten). Konten und Zugangsdaten pflegt das Team im
  Credentials-Bereich (Ordner 19). Ein Hilfetext am Block weist darauf hin.
- Externer Text (Antworten des Kunden) wird nie als HTML gerendert; nur reiner Text mit `LinkedText`.
- Autorisierung wie im restlichen CRM: intern `crmAccessCondition`/`canOn`, Endpunkte in `CRM_ENDPOINT_ACCESS_RULES`;
  im Portal `portalAccessCondition`/`portalCanOn`. Fremder Kunde, fremdes Projekt, fremder Bogen → 404.
- Portal-Code importiert nie aus `components/workspace/**`. Was beide Seiten brauchen, liegt in `components/shared`
  oder `packages/ui`.
- **Keine Logik-Duplikate:** Sichtbarkeit, Pflichtprüfung und Fortschritt kommen ausschließlich aus
  `packages/common/src/patterns/crm/questionnaire/questionnaire-completeness.ts` (Task 63). Blockkopien entstehen ausschließlich über den
  Kopierdienst (`questionnaireBlockCopyService`, Task 64). Der Block-Editor aus Task 64 wird in Task 65 für Bögen wiederverwendet, nicht kopiert.
- **Vollständigkeit ist ein Pattern, kein Service.** `getQuestionnaireCompleteness` und
  `isQuestionnaireFieldVisible` sind reine Funktionen (Eingabe rein, Ergebnis raus, kein Zustand, kein Zugriff auf
  Datenbank oder Zeit) und liegen deshalb unter `packages/common/src/patterns/`; so laufen Server und Client
  (Portal, CRM) mit derselben Logik. **Ab Task 65 kommt ein Service dazu, aber nur für das Beschaffen der Eingaben:**
  `onboarding-form-read-service` lädt Bogen, Antworten, Dateien und Gruppeneinträge und ruft die Funktion auf. Die
  Regeln selbst bleiben im Pattern; ein Service darf sie nie nachbauen oder um eine eigene Variante ergänzen. Braucht
  ein zweiter Einsatzort des Baukastens eine andere Berechnung, wird sie ein weiteres Pattern, nicht ein Schalter im
  bestehenden.
- Chat-Systemnachrichten über `announceSystemMessage` (wie Feedbackrunden), bis Ordner 20c Benachrichtigungen liefert.

## Bewusst nicht enthalten

- Automatisches Abhaken von Kundenaufgaben (früherer Task 46) — der Bogen selbst ist die Checkliste.
- Eigene Entitäten für Person, Testimonial, Standort, Integration — sie sind Gruppen im Bogen.
- Rechte-Metadaten je Datei (Urheber, Lizenz) — stattdessen globale Bestätigungen plus Freitext „Bildnachweise“.
- Eingabe von Zugangsdaten im Portal (gehört zu Ordner 19).
- Löschen oder Neustarten eines abgeschlossenen Bogens; ein zweiter Bogen je Projekt.
- Drag-and-drop (keine dnd-Bibliothek im Repo); Sortieren über Hoch/Runter-Schaltflächen wie im `ProcessStepEditor`.
- Eigene Terminverwaltung (nur Buchungslink, Task 69).

## Merge-Gates (gesamt, zusätzlich zu den Gates je Task)

- [ ] Katalog und Bogen nutzen dieselben Definitionstabellen und denselben Block-Editor; kein zweites Schema, keine
      kopierte Editor-Komponente.
- [ ] Sichtbarkeit, Pflicht und Fortschritt stammen in Portal, CRM, Absenden und Abschließen aus derselben Funktion
      (Test, der alle Aufrufer über diese Funktion laufen lässt).
- [ ] Eine Katalogänderung verändert keinen bestehenden Bogen (Test).
- [ ] Jeder neue Portalendpunkt hat einen Cross-Customer-Negativtest mit echter Session und einen Test ohne
      Portal-Permission.
- [ ] Jeder neue CRM-Endpunkt steht in `CRM_ENDPOINT_ACCESS_RULES` und hat Negativtests für fremden Kunden und fremdes
      Projekt.
- [ ] Ein abgesendeter bzw. abgeschlossener Bogen lässt sich über keinen Portalpfad ändern (Negativtests).
- [ ] Drizzle-Modelle deckungsgleich zur Migration; kein fachlicher DB-Default.
- [ ] DE- und EN-Dictionaries vollständig für alle neuen UI-Texte; Katalogtexte des Standardkatalogs in DE und EN.

## Rollback

- Bis einschließlich 15.4: Revert der Teil-PR; Tabellen sind additiv und bleiben leer bzw. werden nicht gelesen.
- Ab 15.5: `portal.onboarding.*` per Migration aus `portal_standard` und eigenen Portalrollen nehmen → Portal-Navigation,
  Widget und Seiten verschwinden (Permission-Filter), interne Bögen bleiben vollständig lesbar.
- 15.7: Buchungslinks leeren → das Widget zeigt den Kontakt-Fallback.
