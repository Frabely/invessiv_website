# Upgrade Contact Form

Status: in progress  
Last updated: 2026-04-09

Ziel dieses Refactors ist eine wartbare, wiederverwendbare Contact-Form-Architektur mit drei dedizierten Formular-Komponenten, einem gemeinsamen Struktur-Wrapper, klar extrahierten Shared-Teilen und vollständiger Dark-/Light-Mode-Unterstützung. Form 3 wird strukturell aus `mockups/contactForm3.png` umgesetzt. Form 1 und Form 2 bleiben im Erscheinungsbild so nah wie möglich am aktuellen Zustand.

## Umsetzungsregeln

- In kleinen, reviewbaren Schritten arbeiten.
- Nach jedem abgeschlossenen Schritt Status im Dokument aktualisieren.
- Keine Folgeänderung beginnen, bevor der aktuelle Schritt nachvollziehbar umgesetzt ist.
- Form 1 und Form 2 nur dort visuell ändern, wo Konsistenz oder Shared-Components es erfordern.
- Form 3 strukturell eng am Mockup ausrichten.
- Alle Shared-Components und Form-Komponenten müssen in Dark und Light Mode funktionieren.

## Zielbild

- Drei Tabs rendern drei dedizierte Formular-Komponenten.
- `ContactSection` orchestriert nur noch Tabs, gemeinsame Section-Logik, Analytics und Rendering.
- Wiederkehrende Bausteine werden in Shared-Components ausgelagert.
- Consent-/Legal-Link, Required-Marker und wiederkehrende Feldmuster sind konsistent.
- Eine gemeinsame Abschlusszone sorgt für ein stimmiges System über alle drei Formulare hinweg.
- Primäre CTAs sollen überall auf der gemeinsamen CTA-Komponente basieren; solange Form 2 und Form 3 noch in der Legacy-Panel-Struktur von `ContactSection` leben, darf die CTA-Komponente dort direkt verwendet werden. Im Zielzustand laufen diese CTAs über `ContactFormActions` innerhalb der dedizierten Form-Komponenten.

## Reviewbare Schritte

### Schritt 0

- [x] `upgrade-contact-form.md` anlegen
- [x] Plan und Checkliste eintragen
- [x] Ausgangszustand dokumentieren

### Schritt 1

- [x] Shared UX/UI-Bausteine identifizieren
- [x] Ziel-Zuschnitt für Shared-Components festhalten
- [x] Erste kleine Shared-Components umsetzen

### Schritt 2

- [x] Gemeinsamen Form-Wrapper umsetzen
- [x] Slots/Props für Titel, Subheadline, Meta-Zone und Abschlusszone definieren
- [x] Dark-/Light-Mode im Wrapper absichern

### Schritt 3

- [ ] Form 1 in eigene dedizierte Komponente überführen
- [ ] Multi-Step-Logik erhalten
- [ ] Required-Hint auf Schritt 1 und Schritt 2 ergänzen
- [ ] Tests für Form 1 verifizieren

### Schritt 4

- [ ] Form 2 in eigene dedizierte Komponente überführen
- [ ] Kompakten Charakter beibehalten
- [ ] Shared-Teile anbinden ohne visuelle Regression
- [ ] Tests für Form 2 verifizieren

### Schritt 5

- [ ] Form 3 aus `mockups/contactForm3.png` umsetzen
- [ ] Eigene dedizierte Komponente bauen
- [ ] Gemeinsame Abschlusszone und Shared-Teile integrieren
- [ ] Dark-/Light-Mode absichern
- [ ] Tests für Form 3 ergänzen

### Schritt 6

- [ ] `ContactSection` auf drei dedizierte Form-Komponenten umbauen
- [ ] Alte Inline-Panel-Struktur entfernen
- [ ] ContactSection-Tests anpassen und verifizieren

### Schritt 7

- [ ] Konsistenz-Pass über alle drei Formulare
- [ ] Tote Styles und Altcode entfernen
- [ ] Dark-/Light-Mode visuell prüfen

## Entscheidungsstand

- Alle drei Tabs werden als dedizierte Formular-Komponenten behandelt.
- Form 3 wird strukturell eng am Mockup umgesetzt.
- Die Formulare sollen kompakt und ruhig bleiben.
- Die Abschlusszone folgt einem gemeinsamen Muster.
- Form 3 soll klar zur Familie von Form 1 und Form 2 gehören.

## Ausgangszustand

- Form 1 existiert aktuell als dedizierte `ProjectRequestForm`-Komponente.
- Form 2 und Form 3 sind noch als Inline-Panel-Struktur in `ContactSection` umgesetzt.
- `ContactSection` enthält aktuell sowohl Tab-Orchestrierung als auch Formular-/Panel-Markup.
- Mehrere UI-Bausteine sind dupliziert oder nur lose vereinheitlicht:
  - Consent-/Legal-Link
  - Required-Marker
  - Headline-/Intro-/Footer-Zonen
  - Kanal-/Abschlussinformationen

## Änderungsprotokoll

- 2026-04-09: Dokument angelegt, Plan eingetragen, Ausgangszustand festgehalten.
- 2026-04-09: Schritt 1 umgesetzt: erste Shared-Bausteine für Required-Marker, Feld-Label, Consent-Text und ein gemeinsames Input-/Field-Primitive angelegt.
- 2026-04-09: Vor Schritt 2 weitere Shared-Bausteine ergänzt: Form-Shell, Actions-Zone und Status-Komponente; Form 1 Validierung auf Inline-Fehler statt Browser-Popup umgestellt.
- 2026-04-09: Schritt 2 abgeschlossen: `ContactFormShell` auf Subtitle-/Meta-/Footer-Slots erweitert, Dark-/Light-Mode im Wrapper abgesichert und Form 1 an die gemeinsame Abschlusszone angebunden.
