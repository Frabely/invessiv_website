# Task 45 — Portalformular und interne Bogenansicht

> **Merge-Einheit:** Ordner 15b · **Branch:** `feat/crm-onboarding-bogen`
> **Aufwand:** L · **Abhängigkeiten:** Task 44, Task 43 (Assets), Task 21 (Portal-Dashboard)
> **Migration:** keine

- Mehrstufiges Formular mit einem Abschnitt je Schritt, Fortschritt sichtbar, jederzeit unterbrechbar.
- Jedes Asset-Feld hat seine eigene Uploadfläche; kein Sammelpostfach für alles.
- Speichern passiert automatisch beim Verlassen eines Feldes, mit sichtbarem Status.
- Interne Ansicht ist lesend, vollständig und je Feld mit einem Klick übernehmbar.
- Keine neue Datenschicht: alles läuft über die Handler aus Task 44.

## Context

Der Bogen ist das einzige Formular im Projekt, das ein Kunde über mehrere Tage ausfüllt. Er
entscheidet, ob das Portal im Alltag benutzt wird oder ob die Inhalte doch wieder per Mail kommen.
Entsprechend liegt der Aufwand in Bedienbarkeit und Verlässlichkeit, nicht in der Datenlogik.

Auf der internen Seite geht es um genau eine Tätigkeit: Antworten lesen und in die Website übernehmen.

## Entscheidungen

| Bereich                 | Entscheidung                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Schrittführung          | Ein Abschnitt je Schritt, Reihenfolge aus dem Katalog; Sprung zwischen Schritten jederzeit erlaubt                                    |
| Schritt im URL-State    | `?section=brand` — Reload, Zurück-Taste und geteilter Link landen an derselben Stelle                                                 |
| Fortschritt             | Kopfzeile „Schritt 3 von 7" plus Balken aus `getOnboardingProgress`; identische Berechnung wie intern                                 |
| Pflichtfelder           | Markiert und beim Schrittwechsel **nicht** blockierend; erst das Absenden prüft vollständig                                           |
| Warum nicht blockierend | Ein Kunde springt bewusst über Fragen, für die er noch etwas nachsehen muss. Ein harter Block treibt ihn aus dem Formular             |
| Speichern               | Automatisch beim Verlassen des Feldes, entprellt; Statuszeile „Gespeichert · 14:02" oder „Nicht gespeichert"                          |
| Fehlerfall              | Schlägt das Speichern fehl, bleibt der Wert im Feld, die Statuszeile wird rot und bietet „Erneut versuchen"                           |
| Textfelder              | Zeichenzähler ab 80 Prozent der Grenze; Zwischenüberschriften und Absätze als reiner Text, kein Rich-Text                             |
| Warum kein Rich-Text    | Externer Text wird nirgends als HTML gerendert (Sicherheitsregel). Formatierung entsteht beim Einbau in die Website, nicht im Bogen   |
| Asset-Felder            | Eigene Uploadfläche je Feld über den Pfad aus Task 43; hochgeladene Dateien erscheinen als Kachel unter dem Feld mit Entfernen-Aktion |
| Große Videos            | Das Feld `media_link` nimmt eine `https`-Adresse entgegen, mit Hinweis auf zulässige Dienste                                          |
| Mehrere Bearbeiter      | Kopfzeile nennt „zuletzt bearbeitet von …", kein Sperren von Feldern                                                                  |
| Absenden                | Eigener Abschlussschritt mit Zusammenfassung, Hinweis auf Unveränderlichkeit und Liste fehlender Pflichtfelder samt Sprunglink        |
| Nach dem Absenden       | Leseansicht mit Datum und absendender Person; Portalseite bleibt erreichbar                                                           |
| Interne Ansicht         | Eigener Tab am Projekt, Abschnitte in Katalogreihenfolge, unbeantwortete Felder sichtbar als „nicht beantwortet"                      |
| Übernahme               | Kopierschaltfläche je Textfeld und je Abschnitt; Assets verlinken in die Dateiliste                                                   |
| Veraltete Felder        | Antworten zu Feldern, die es im Katalog nicht mehr gibt, erscheinen am Ende unter „Nicht mehr im Katalog"                             |
| Benachrichtigung        | Absenden erzeugt eine interne Benachrichtigung über die Glocke; keine sofortige Mail                                                  |
| Gestaltung              | Ruhig und eigenständig wie das Portal-Dashboard — kein verkleinertes CRM                                                              |

## Architektur

```txt
(portal)/portal/[customerId]/onboarding/[submissionId]/page.tsx     Server Component
  ├─ requirePortalActor(locale)
  ├─ getOnboardingSubmission(submissionId)      prueft Zugehoerigkeit serverseitig
  ├─ Katalog ueber form_key + schema_version aufloesen
  └─ Client-Komponente je Abschnitt

onboarding-form-client
  ├─ URL-State fuer den Abschnitt
  ├─ saveAnswer(fieldKey, value)   entprellt, ueber portal-onboarding-api-service
  └─ Statuszeile mit letztem Speicherzeitpunkt

Intern
  crm/projects/[projectId]  → Tab „Onboarding"
    └─ read-only Rendering derselben Katalogstruktur
```

## Verzeichnisstruktur

```txt
apps/workspace/src/app/[locale]/(portal)/portal/[customerId]/onboarding/[submissionId]/page.tsx
apps/workspace/src/components/portal/onboarding/
  onboarding-form-client/
  onboarding-step-header/
  onboarding-section-fields/
  onboarding-field/            schaltet auf den Feldtyp
  onboarding-asset-field/
  onboarding-media-link-field/
  onboarding-save-status/
  onboarding-submit-step/
  onboarding-read-view/
apps/workspace/src/client/portal/onboarding-api-service.ts
apps/workspace/src/common/constants/portal/onboarding/onboarding-query-params.ts

apps/workspace/src/components/workspace/crm/onboarding/
  project-onboarding-tab/
  onboarding-answer-list/
  onboarding-answer-row/        mit Kopierschaltflaeche
  onboarding-assign-dialog/
  onboarding-reopen-dialog/
apps/workspace/src/i18n/dictionaries/portal/onboarding/{de,en}.json       (erweitert)
apps/workspace/src/i18n/dictionaries/workspace/crm/onboarding/{de,en}.json
```

## Tickets

### CRM-45-T1 — Formularrahmen und Feldtypen

- **Files:** `onboarding-form-client`, `onboarding-step-header`, `onboarding-section-fields`,
  `onboarding-field`, `onboarding-save-status`, Client-Service, Query-Parameter, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Inhalt:** Schrittführung über URL-State, alle Textfeld- und Auswahltypen, automatisches Speichern
- **Akzeptanz:**
  - Reload mitten im Bogen landet im selben Abschnitt mit gespeicherten Werten
  - Speicherfehler verliert den eingegebenen Wert nicht und bietet erneuten Versuch
  - Tastaturbedienung vollständig; Fokus nach Schrittwechsel auf der Abschnittsüberschrift
  - Mobil ohne horizontales Scrollen; Dark und Light geprüft

### CRM-45-T2 — Asset- und Medienlink-Felder

- **Files:** `onboarding-asset-field`, `onboarding-media-link-field`, Anbindung an Task 43, Tests
- **Skills:** `frontend-design`, `best-practices`
- **Inhalt:** Upload je Feld mit Fortschritt, Kachelanzeige, Entfernen, Linkfeld mit Validierung
- **Akzeptanz:**
  - Hochgeladene Datei ist dem Feld zugeordnet und nach Reload sichtbar
  - Zu große oder unzulässige Datei erzeugt einen Feldfehler, nicht eine Seitenfehlermeldung
  - Entfernen löst die Verknüpfung; die Datei bleibt intern erhalten
  - Linkfeld akzeptiert nur `https` und zeigt den Hinweis auf zulässige Dienste

### CRM-45-T3 — Abschlussschritt und Leseansicht

- **Files:** `onboarding-submit-step`, `onboarding-read-view`, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Inhalt:** Zusammenfassung, fehlende Pflichtfelder mit Sprunglink, Leseansicht nach Absenden
- **Akzeptanz:**
  - Fehlende Pflichtfelder sind einzeln benannt und anspringbar
  - Nach dem Absenden ist kein Feld mehr editierbar, die Seite bleibt erreichbar
  - Absendedatum und Person sind sichtbar

### CRM-45-T4 — Interner Onboarding-Tab

- **Files:** `project-onboarding-tab`, `onboarding-answer-list`, `onboarding-answer-row`,
  `onboarding-assign-dialog`, `onboarding-reopen-dialog`, Dictionary, Tests
- **Skills:** `frontend-design`, `best-practices`, `copywriting`
- **Inhalt:** Leseansicht in Katalogreihenfolge, Kopierschaltflächen, Zuweisen und erneutes Öffnen
- **Akzeptanz:**
  - Unbeantwortete Pflichtfelder sind als solche erkennbar
  - Antworten zu unbekannten Feldern erscheinen, statt zu verschwinden
  - Kopieren legt den reinen Text ohne Beschriftung in die Zwischenablage
  - Ohne `portal.manage` fehlen Zuweisen und erneutes Öffnen; der Endpunkt antwortet 403
  - Empty-State erklärt, wofür der Tab gedacht ist, und bietet das Zuweisen an
