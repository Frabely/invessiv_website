# Upgrade Contact Form

Status: step 2 completed  
Last updated: 2026-04-09

Ziel dieses Neustarts ist eine deutlich schlankere und wartbarere Contact-Form-Architektur mit drei separaten Formular-/Kontaktwegen, klarer Verantwortlichkeit zwischen UI, Frontend-Service, API-Route, Backend-Command-Handler und Persistenz. Bereits sinnvolle Shared-UI-Bausteine koennen weiterverwendet werden. Die aktuell im laufenden Changeset entstandenen dedizierten Form-Implementierungen und deren Logik gelten nicht als Zielzustand und werden verworfen.

## Zielbild

- Drei separate Contact-Wege bleiben bestehen:
  - Form 1: Projektanfrage
  - Form 2: Kennenlern-Call als CTA-only
  - Form 3: Kurze E-Mail
- Die Form-Komponenten bleiben moeglichst schlank.
- UI validiert nur:
  - required / presence
  - einfache E-Mail-/URL-Syntax
  - sichtbare Inline-Fehler
- Ein Frontend-Service verarbeitet den Submit und erhaelt ein klares DTO.
- Eine oeffentliche REST-Route nimmt Requests entgegen.
- Die Route delegiert intern an getrennte Backend-Commands / Handler.
- Die Backend-Handler validieren fachlich mit `zod`.
- Persistenz und Mailversand werden unterhalb des Handlers sauber getrennt organisiert.
- Bestehende Shared-UI-Komponenten duerfen wiederverwendet oder vereinfacht werden, wenn sie zum Zielbild passen.

## Architekturfluss

`UI + leichte Validation -> Frontend Service -> REST API Route -> Backend Command Handler + Validation -> Repository / DB`

## Verbindliche Architekturentscheidungen

- Transport: oeffentliche REST-Route
- API-Schnitt: ein oeffentlicher Endpoint, intern Dispatch auf zwei Commands
- DTO-Schnitt:
  - `ProjectRequestDto`
  - `QuickContactDto`
- Kennenlern-Call bleibt CTA-only und nimmt nicht an Submit/Persistenz teil
- Backend-Validation erfolgt mit `zod`
- Frontend soll fuer Form-State und UI-nahe Validation auf `react-hook-form` ausgelegt werden

## Zielstruktur

### UI / Components

- `src/components/.../contact-section/...`
- Enthaelt nur:
  - Wrapper / Layout
  - Shared-Field-Komponenten
  - die drei Contact-Wege als UI
  - `react-hook-form`-Anbindung
  - Anzeigen von Inline-Fehlern
- Keine API-Details, keine Business-Logik, keine komplexe DTO-Orchestrierung in den Formular-Komponenten

### Client / Feature Layer

- `src/features/contact/client/`
- Geplante Inhalte:
  - `project-request.dto.ts`
  - `quick-contact.dto.ts`
  - `project-request-form.schema.ts`
  - `quick-contact-form.schema.ts`
  - `contact-form-service.ts`
  - optionale Mapper von Form-Values auf DTOs
- Verantwortlich fuer:
  - DTO-Erstellung
  - Request-Absendung
  - schlanke Response-/Error-Normalisierung fuer die UI

### Shared Contact Layer

- `src/features/contact/shared/`
- Geplante Inhalte:
  - Contracts
  - Option Keys / diskrete Select-Werte
  - gemeinsame Contact-Typen
  - gemeinsame Schema-Bausteine nur bei echter Wiederverwendung
- Ziel:
  - keine Vermischung von Client-Only- und Server-Only-Code

### Server / Contact Domain

- `src/server/contact/commands/`
- `src/server/contact/handlers/`
- `src/server/contact/repositories/`
- `src/server/contact/services/`
- Geplante Verantwortlichkeiten:
  - Commands definieren den auszufuehrenden Use Case
  - Handler validieren DTOs fachlich und orchestrieren den Ablauf
  - Repositories kapseln DB-Zugriffe
  - Services kapseln Mail, Anti-Abuse und technische Nebendienste

### API Route

- `src/app/api/public/contact/route.ts`
- Verantwortlich nur fuer:
  - HTTP-Parsing
  - Content-Type / Payload-Limits
  - Dispatch anhand des Request-Typs
  - normierte API-Responses
- Keine Business-Orchestrierung direkt in der Route

## DTO-Plan

### `ProjectRequestDto`

- nur Felder fuer Form 1
- enthaelt einen Typ-/Discriminant-Wert fuer den API-Dispatch
- enthaelt alle fuer Projektanfrage noetigen Eingaben

### `QuickContactDto`

- nur Felder fuer Form 3
- enthaelt ebenfalls einen Typ-/Discriminant-Wert
- bleibt bewusst klein und getrennt von Form 1

## Validation-Regeln

### Frontend

- required / leer
- E-Mail-/URL-Grundsyntax
- touched/errors
- Inline-Fehler direkt am Feld
- keine fachliche Cross-Field-Validierung im UI, ausser wenn fuer Step-Navigation zwingend noetig

### Backend

- vollstaendige DTO-Validierung mit `zod`
- fachliche und Cross-Field-Regeln liegen im Backend-Flow
- Backend ist die Wahrheitsquelle

### Datenbank

- keine Business-Logik
- nur Persistenz / Statuspflege

## Geplanter Neustart-Ablauf

### Schritt 0 [Abgeschlossen]

- Diese Datei als neue Planbasis ueberschreiben
- Den bisherigen Zwischenstand ausdruecklich als verworfenen Refactor markieren
- Festhalten, dass bestehende Shared-UI-Bausteine weiterverwendet werden duerfen

### Schritt 1 [Abgeschlossen]

- Ziel-Ordnungsstruktur im Projekt konkret festziehen
- Bestehende Contact-bezogene Dateien in Kategorien einordnen:
  - wiederverwenden
  - neu schneiden
  - spaeteres Architektur-Todo
- Noch keine funktionale Neuimplementierung

### Schritt 2 [Abgeschlossen]

- Form-State-Ansatz mit `react-hook-form` fuer Form 1 und Form 3 festziehen
- Shared-Field-Komponenten auf Kompatibilitaet pruefen und ggf. vereinfachen
- Ziel: Form-Komponenten nur fuer Values, Register, Errors, Submit

### Schritt 3

- Frontend-DTOs und `contact-form-service.ts` definieren
- Mapping aus den Formularen in den Client-Layer verlagern
- Form-Komponenten kennen keine API-Details mehr

### Schritt 4

- Oeffentliche Contact-Route auf Adapter-Rolle zuschneiden
- Request-Typ erkennen und an den passenden Command dispatchen

### Schritt 5

- Zwei getrennte Backend-Commands / Handler definieren:
  - Projektanfrage
  - Kurze E-Mail
- Fachliche Validation und Orchestrierung in die Handler legen

### Schritt 6

- Repository-/Service-Schnitt fuer Persistenz und Mail klar schneiden
- DB-Schreiben und Mail-Status technisch sauber kapseln

### Schritt 7

- Form 1 und Form 3 neu und schlank aufbauen
- Form 2 sauber als CTA-only daneben halten
- UI-Konsistenz in Dark und Light Mode pruefen

## Schritt 1 Ergebnis: Ziel-Ordnungsstruktur

### Verbindlicher Zielbaum

```text
src/
  components/
    marketing/home/sections/contact-section/
      contact-section.tsx
      contact-section.module.css
      contact-consent-text.tsx
      contact-consent-text.module.css
      contact-required-marker.tsx
      contact-required-marker.module.css
      contact-field-label.tsx
      project-request-form/
        project-request-form.tsx
        project-request-form.module.css
      quick-contact-form/
        quick-contact-form.tsx
        quick-contact-form.module.css
      discovery-call-panel/
        discovery-call-panel.tsx
        discovery-call-panel.module.css

  features/
    contact/
      client/
        project-request.dto.ts
        quick-contact.dto.ts
        project-request-form.schema.ts
        quick-contact-form.schema.ts
        contact-form-service.ts
        map-project-request-form-to-dto.ts
        map-quick-contact-form-to-dto.ts
      shared/
        contact.contract.ts
        contact-options.ts
        contact-request-kind.ts
        contact-base.schema.ts
        project-request.schema.ts
        quick-contact.schema.ts

  app/
    api/public/contact/
      route.ts

  server/
    contact/
      commands/
        submit-project-request.command.ts
        submit-quick-contact.command.ts
      handlers/
        submit-project-request.handler.ts
        submit-quick-contact.handler.ts
      repositories/
        contact-lead.repository.ts
      services/
        contact-mail.service.ts
        contact-rate-limit.service.ts
        contact-lead-metadata.service.ts
```

### Verantwortlichkeit pro Schicht

- `components/.../contact-section`
  - nur UI, Layout, `react-hook-form`-Binding, Inline-Fehler, CTA-Rendering
- `features/contact/client`
  - Form-spezifische DTOs, leichte Frontend-Schemas, Mapper, Submit-Service
- `features/contact/shared`
  - Contracts, Discriminants, Option-Keys, gemeinsam genutzte Schemas
- `app/api/public/contact/route.ts`
  - reiner HTTP-Adapter und Dispatch
- `server/contact/commands`
  - Use-Case-Eingaben pro Submit-Typ
- `server/contact/handlers`
  - fachliche Zod-Validierung, Orchestrierung, Persistenz- und Mail-Aufruf
- `server/contact/repositories`
  - DB-Zugriffe
- `server/contact/services`
  - technische Nebendienste ohne UI-/HTTP-Verantwortung

## Schritt 1 Ergebnis: Einordnung des aktuellen Bestands

### Wiederverwenden

- `src/components/marketing/home/sections/contact-section/contact-consent-text.tsx`
- `src/components/marketing/home/sections/contact-section/contact-consent-text.module.css`
- `src/components/marketing/home/sections/contact-section/contact-required-marker.tsx`
- `src/components/marketing/home/sections/contact-section/contact-required-marker.module.css`
- `src/components/marketing/home/sections/contact-section/contact-field-label.tsx`
- `src/features/contact/contact-options.ts`
- `src/features/contact/contact.contract.ts`
- `src/features/contact/contact.schema.ts`
- `src/app/api/public/contact/route.ts`

### Neu schneiden

- `src/components/marketing/home/sections/contact-section/contact-section.tsx`
- `src/components/marketing/home/sections/contact-section/contact-section.module.css`
- `src/components/marketing/home/sections/contact-section/contact-section.test.tsx`
- `src/components/marketing/home/sections/contact-section/project-request-form/project-request-form.tsx`
- `src/components/marketing/home/sections/contact-section/project-request-form/project-request-form.module.css`
- `src/components/marketing/home/sections/contact-section/project-request-form/project-request-form.test.tsx`
- `src/features/contact/contact.schema.ts`
  - in gemeinsame und submit-typspezifische Schemas aufteilen
- `src/app/api/public/contact/route.ts`
  - auf HTTP-Adapter und Dispatch reduzieren
- `src/server/services/contact/submit-contact-inquiry.ts`
  - in Commands, Handler, Repository-Aufrufe und Mail-Orchestrierung zerlegen
- `src/server/services/contact/contact-lead-metadata.ts`
  - in neue `server/contact/services`-Struktur verschieben

### Spaeteres Architektur-Todo

- `src/server/db/contact-leads.ts`
  - langfristig an `server/contact/repositories/contact-lead.repository.ts` angleichen
- `src/server/services/contact/*`
  - komplette Contact-Domaene aus `server/services` in `server/contact` ueberfuehren
- `src/features/contact/*`
  - Altbestand vollstaendig in `client/` und `shared/` schneiden
- bestehende Testlandschaft
  - Contact-Tests schichtbezogen statt komponentenuebergreifend neu ordnen

## Schritt 1 Entscheidungen

- `discovery-call-form` wird im Zielzustand als `discovery-call-panel` gefuehrt, da dieser Pfad kein Submit-Formular ist.
- Die oeffentliche API bleibt ein Endpoint, unterscheidet intern aber ueber einen expliziten Request-Kind-Discriminant.
- `contact.schema.ts` bleibt nicht monolithisch, sondern wird in gemeinsame und submit-typspezifische Zod-Schemas aufgeteilt.
- UI-Shared-Komponenten bleiben bewusst klein; es wird kein generisches Form-Framework im Component-Layer aufgebaut.

## Schritt 2 Ergebnis: UI-Form-State festgezogen

- `react-hook-form` ist als verbindlicher UI-Form-State-Ansatz eingebaut.
- `project-request-form.tsx` nutzt keinen `FormData`-/DOM-Scan-Flow mehr fuer Step-Validation und Submit, sondern `watch`, `trigger`, `setValue`, `setError`, `handleSubmit`.
- Form 3 existiert jetzt als eigene `quick-contact-form` mit kleinem `react-hook-form`-State statt als reines E-Mail-Link-Panel.
- Form 2 bleibt CTA-only und rendert weiterhin keinen Submit-Flow.
- `contact-form-field.tsx` wurde als Shared-Field-Huelle erweitert, damit Label, Hint und Inline-Fehler in Form 1 und Form 3 konsistent verwendet werden koennen.

## Schritt 2 Entscheidungen

- Frontend-Validation bleibt bewusst leichtgewichtig:
  - required / presence
  - einfache E-Mail-/URL-Syntax
  - Step-Gating nur dort, wo die UI es fuer Navigation braucht
- Die eigentliche API-/DTO-Abkopplung folgt erst in Schritt 3; Schritt 2 zieht nur den Form-State und die UI-Verantwortung gerade.
- Form 3 verwendet bis Schritt 3 noch einen vorbereiteten `mailto`-Flow als Uebergang, bleibt aber bereits als eigene Formular-Komponente geschnitten.

## Testplan

- Form 1:
  - Pflichtfelder pro Step
  - Step-Wechsel nur bei gueltigem Mindestzustand
  - Inline-Fehler korrekt sichtbar
  - DTO korrekt erzeugt
- Form 3:
  - nur relevante Pflichtfelder
  - Inline-Fehler statt Browser-Popup
  - DTO korrekt erzeugt
- Form 2:
  - bleibt CTA-only
  - keine Submit-Logik
- Frontend-Service:
  - sendet richtigen DTO-Typ
  - normalisiert Fehlerzustaende sauber
- API-Route:
  - invalid content-type
  - invalid json
  - payload too large
  - Dispatch zum richtigen Command
- Backend-Handler:
  - `zod`-Validation
  - Cross-Field-Regeln
  - Persistenzaufrufe
  - Mail-/Statusverhalten
- Regression:
  - Dark Mode
  - Light Mode
  - Shared-UI-Bausteine konsistent

## Skills / Referenzen

Vor der eigentlichen Neuimplementierung sollen etablierte Patterns beruecksichtigt werden:

- `react-hook-form`
- `zod`
- Skills.sh Kandidaten mit hoher Reife / Proof:
  - `vercel-react-best-practices`
  - `next-best-practices`
  - `frontend-design`
  - `webapp-testing`

## Separate Architektur-Todos ausserhalb dieses Plans

Diese Punkte sollen dokumentiert, aber nicht in diesem Neustart-Plan umgesetzt werden:

- bestehende Contact-Ordnerstruktur zwischen `features/contact`, `server/services/contact` und Route langfristig bereinigen
- alte gemischte Services in sauberere Commands / Handler / Repository-Grenzen zerlegen
- Altbestand konsistent in die neue Zielstruktur ueberfuehren, falls ausserhalb des unmittelbaren Form-Neustarts noetig

## Annahmen

- Die aktuell im Changeset liegenden dedizierten Form-Implementierungen werden verworfen.
- Bereits gebaute Shared-Komponenten duerfen als Ausgangsbasis erhalten bleiben.
- Die neue Zielarchitektur soll implementierungsfest sein, bevor erneut Form-Logik aufgebaut wird.
- Die neue Ordnerstruktur ist wichtiger als kurzfristiges Wiederverwenden halb passender Logik.
