# Lead-Formular Conversion-Plan

## Ziel

Das Kontaktformular soll mehr qualifizierte Leads erzeugen, ohne Besucher durch einen zu großen Fragebogen oder zu viel sichtbare UI-Fläche auszubremsen.

Aktueller Befund:

- Der Hauptpfad `Projektanfrage` ist inhaltlich sinnvoll, wirkt auf Desktop aber zu groß.
- Auf 1920x1080 nimmt die Kombination aus Contact-Header, drei Kontaktweg-Tabs, Panel-Header, dreiteiligem Stepper und hohen Formularfeldern zu viel vertikalen Raum ein.
- Schritt 3 hat aktuell als einziges Pflichtfeld die Consent-Checkbox; alle anderen Felder sind optional. Dadurch wirkt der dritte Schritt schwerer, als er fachlich ist.
- `Website`, `Ziel`, `Workflow` und `Seiten` werden bereits abhängig vom gewählten Leistungsmodell eingeblendet bzw. verpflichtend gemacht. Diese Logik ist sinnvoll und soll erhalten bleiben.
- Die bestehende Quick-Contact-Logik kann als sekundärer Lead-Pfad genutzt werden: Vorname, Nachname, E-Mail, Nachricht und Consent schreiben bereits einen Lead und senden eine E-Mail.

## Zielbild

- Hauptpfad bleibt `Projektanfrage starten`.
- Sekundärpfad bleibt `Kurze Nachricht`, aber weniger prominent als die Projektanfrage.
- Call bleibt eine optionale Alternative für warme Leads oder Abstimmungsbedarf.
- Das Hauptformular wird perspektivisch auf einen klaren 2-Schritt-Flow reduziert:
  - Schritt 1: Kontakt + Angebotsart.
  - Schritt 2: Projektdetails + relevante dynamische Felder + Consent + Absenden.
- Optionale Zusatzangaben werden entweder entfernt oder deutlich zurückgenommen, damit sie den Abschluss nicht blockieren.
- Desktop wird kompakter: weniger vertikale UI-Schichten, kleinere Step-Anzeige, dichtere Felder, bessere Nutzung der Breite.
- Mobile bleibt klar einspaltig und darf nicht durch ein Desktop-Redesign komplizierter werden.

## Festgelegte Entscheidungen

- `Telefon`: behalten, optional.
- `Unternehmen`: behalten, optional.
- `Rolle`: perspektivisch entfernen.
- `Budgetrahmen`: behalten, aber zurückgenommen und optional.
- `Gewünschter Start`: behalten, optional.
- `Kurze Nachricht`: als sekundären Formularpfad behalten, weil bestehende Quick-Contact-Logik Lead und E-Mail bereits sauber verarbeitet.
- `mailto`: nicht als primärer Backup-Mechanismus nutzen, da es eine eingerichtete lokale E-Mail-App voraussetzt.

## Umsetzungsschritte

### 1) UI-Optimierung Contact Flow ohne Logikänderung

- Status: [x]
- Skills: `frontend-design`, `ux-design`, `copywriting`, `accessibility`, `web-design-guidelines`, `core-web-vitals`
- Ziel: Den bestehenden Contact Flow deutlich kompakter, klarer und conversionstärker darstellen, ohne Formularlogik, Validierung, DTOs, API, Lead-Erstellung, Mailversand oder Tracking umzubauen.
- Änderung:
  - Projektanfrage als dominanten Default-Pfad darstellen.
  - `Kurze Nachricht` und `Call` als kompaktere sekundäre Optionen zeigen, aber technisch weiter über die bestehende Tab-/Panel-Logik laufen lassen.
  - Kontaktweg-Auswahl von großen Karten zu einer schlanken segmentartigen Auswahl verdichten.
  - Contact-Header, Panel-Header, Stepper, Feldabstände und Textarea-Höhe auf Desktop reduzieren.
  - Projektformular visuell weniger wie ein langer Fragebogen wirken lassen.
  - Copy nur soweit schärfen, wie es die UI/UX verbessert; DE und EN parallel pflegen.
- Nicht ändern:
  - kein Umbau auf 2 Schritte.
  - keine Feldentfernung.
  - keine Änderung an Pflichtfeldern.
  - kein neues Kurzformular.
  - keine Änderung an API, DTOs, Validation, Persistenz, Mailversand oder Tracking.
- Review-Gate:
  - Desktop 1920x1080 zeigt deutlich mehr vom Formular ohne Scrollen.
  - Projektanfrage bleibt visuell Hauptpfad.
  - `Kurze Nachricht` und `Call` bleiben erreichbar und bedienbar.
  - Fokuszustände und Tab-Bedienung bleiben klar.
  - danach fragen, ob Schritt 2 umgesetzt werden soll.

### 2) Conversion-Scope und Feldentscheidungen dokumentieren

- Status: [ ]
- Skills: `ux-design`, `copywriting`, `web-design-guidelines`
- Ziel: Die festgelegten Feldentscheidungen auswertbar im Code-Plan halten, bevor Logik geändert wird.
- Ergebnis:
  - finale Feldliste für Pflichtfelder, bedingte Pflichtfelder und optionale Angaben
  - `Rolle` als Entfernen-Kandidat bestätigen
  - `Budget`, `Start`, `Telefon`, `Unternehmen` als optionale Angaben bestätigen
- Review-Gate:
  - Entscheidung wird dokumentiert
  - danach fragen, ob Schritt 3 umgesetzt werden soll

### 3) Hauptformular auf 2 Schritte reduzieren

- Status: [ ]
- Skills: `ux-design`, `accessibility`
- Ziel: Den dritten Schritt entfernen und Consent plus optionale Angaben in Schritt 2 integrieren.
- Änderung:
  - Stepper von 3 auf 2 Schritte reduzieren
  - `Schritt 1` bleibt Kontakt + Leistungsmodell
  - `Schritt 2` enthält Projektdetails, dynamische Felder, optionale Zusatzangaben, Consent und Submit
  - Validierungslogik so anpassen, dass Consent weiterhin erst vor Submit verpflichtend ist
  - Fokusführung, Fehlernavigation und Step-Validierung für 2 Schritte prüfen
- Review-Gate:
  - Formular lässt sich mit Pflichtfeldern absenden
  - bedingte Pflichtfelder greifen weiter
  - danach fragen, ob Schritt 4 umgesetzt werden soll

### 4) Optionale Felder bereinigen

- Status: [ ]
- Skills: `ux-design`, `copywriting`, `accessibility`
- Ziel: Reibung im Hauptformular senken, ohne nützliche Qualifizierung zu verlieren.
- Änderung:
  - `Rolle` entfernen, sofern keine neue fachliche Begründung dagegen spricht
  - `Telefon`, `Unternehmen`, `Budgetrahmen` und `Gewünschter Start` optional und visuell zurückgenommen führen
  - `Budgetrahmen` weicher benennen, z. B. `Budgetrahmen, falls schon bekannt`
  - `Website`, `Ziel`, `Workflow` und `Seiten` weiter abhängig vom Leistungsmodell steuern
- Review-Gate:
  - weniger sichtbare Reibung im Hauptformular
  - gespeicherte Lead-Daten bleiben fachlich ausreichend
  - danach fragen, ob Schritt 5 umgesetzt werden soll

### 5) Sekundärpfade vereinfachen

- Status: [ ]
- Skills: `ux-design`, `copywriting`, `accessibility`
- Ziel: Der Hauptpfad soll nicht durch drei gleich starke Kontaktoptionen verwässert werden.
- Änderung:
  - Projektanfrage als sichtbarer Default beibehalten
  - `Kurze Nachricht` als sekundären Formularpfad behalten und weniger prominent als die Projektanfrage darstellen
  - Call als tertiäre Option für warme Leads formulieren
  - keine `mailto`-Abhängigkeit als primären Backup-Pfad einführen
- Review-Gate:
  - Haupt-CTA und Hauptformular sind visuell eindeutig dominant
  - Quick Contact bleibt als echter Lead-Pfad nutzbar
  - danach fragen, ob Schritt 6 umgesetzt werden soll

### 6) Formular-Copy auf Lead-Conversion schärfen

- Status: [ ]
- Skills: `copywriting`, `seo`, `ux-design`
- Ziel: Die Formulartexte sollen nach geringem Aufwand klingen und trotzdem qualifizierte Informationen abfragen.
- Änderung:
  - Titel/Subtitel stärker auf Ergebnis ausrichten
  - `conditionalFieldHint` kürzer und vertrauensbildender formulieren
  - Placeholder im Projektfeld konkreter, aber nicht überladen
  - CTA nicht generisch halten; bevorzugt Richtung `Anfrage senden` oder `Projekt einschätzen lassen`
  - alle Copy-Änderungen parallel in DE und EN pflegen
- Review-Gate:
  - DE/EN sind inhaltlich synchron
  - keine sprachabhängige Inline-Copy entsteht
  - danach fragen, ob Schritt 7 umgesetzt werden soll

### 7) Tracking und Lead-Signale prüfen

- Status: [ ]
- Skills: `seo`, `web-quality-audit`
- Ziel: Die Conversion-Verbesserung muss messbar bleiben.
- Änderung:
  - bestehende Events für CTA-Klick, Contact-Klick und Submit-Erfolg prüfen
  - prüfen, ob ein `form_start` oder `step_continue` Event bereits sinnvoll vorhanden ist oder ergänzt werden sollte
  - keine Formularinhalte an Analytics senden
  - Kontaktziel-Auswertung nach Redesign prüfen
- Review-Gate:
  - Lead-Erfolg bleibt messbar
  - keine PII in Analytics
  - danach fragen, ob Schritt 8 umgesetzt werden soll

### 8) A11y-, Mobile- und Regression-Check

- Status: [ ]
- Skills: `accessibility`, `web-quality-audit`, `core-web-vitals`
- Ziel: Das kompaktere Formular darf nicht schlechter bedienbar werden.
- Prüfung:
  - Tastaturbedienung der Tabs, Step-Navigation und Formularfelder
  - sichtbare Fokuszustände
  - Fehlertexte und `aria-invalid`/`aria-describedby`
  - Mobile einspaltig, Touch-Ziele ausreichend groß
  - Reduced-Motion unverändert stabil
  - INP-Risiko durch zusätzliche Interaktion gering halten
- Tests:
  - betroffene Komponenten-Tests
  - Contact-Flow-E2E oder vorhandener Lead-Persistence-Smoke, falls durch die Änderung betroffen
  - `npm run lint`
  - `npm run build`
- Review-Gate:
  - alle relevanten Checks dokumentiert
  - Plan-Schritte nach Abschluss einzeln als erledigt markieren

## Umsetzungsvorgabe

- Jeder Schritt wird einzeln umgesetzt.
- Nach jedem abgeschlossenen Schritt wird der Schritt in diesem Dokument von `Status: [ ]` auf `Status: [x]` gesetzt.
- Nach jedem Schritt wird gestoppt und gefragt, ob der nächste Schritt umgesetzt werden soll.
- Änderungen bleiben klein und reviewbar.
- Keine stillschweigenden Architektur-Ausnahmen. Wenn eine Regel aus `AGENTS.md` verletzt würde, wird zuerst gefragt oder der Punkt in `architecture-open-items.md` dokumentiert.
