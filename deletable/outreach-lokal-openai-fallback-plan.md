# Plan: Outreach-Generierung mit lokalem Modell und OpenAI-Fallback

## Zielbild

Der Button im Outreach-Dialog soll fuer Nutzer weiterhin wie ein einziger Flow wirken:

1. Dialog wird geoeffnet.
2. Verfuegbarkeit wird geprueft und sichtbar angezeigt.
3. Button ist nur klickbar, wenn mindestens ein Provider verfuegbar ist.
4. Beim Klick wird bevorzugt lokal generiert.
5. Wenn lokal nichts verfuegbar ist oder lokale Generierung fehlschlaegt, wird OpenAI in der Cloud genutzt.
6. Ergebnis wird serverseitig gespeichert und an den Dialog zurueckgegeben.

Wichtig: Das lokale Modell darf explizit nur auf dem eigenen Rechner funktionieren. Vercel soll nie versuchen, ein
lokales Modell auf einem privaten Rechner zu erreichen. OpenAI bleibt serverseitig und wird nur als Cloud-Fallback
genutzt.

## Architekturentscheidung

Es bleiben zwei App-API-Endpunkte uebrig:

- `GET /api/workspace/outreach/provider-status`
- `POST /api/workspace/outreach/generate`

Der lokale LM-Studio-Check passiert nicht ueber Vercel, sondern direkt im Browser gegen:

- `http://127.0.0.1:1234/v1/models`

Das ist absichtlich kein App-API-Endpunkt. Nur der Browser auf dem jeweiligen Rechner kann sinnvoll pruefen, ob dort
lokal LM Studio laeuft.

## Gewuenschter Ablauf

### Beim Oeffnen des Dialogs

Der Dialog startet zwei Checks:

- Server-Check ueber `GET /api/workspace/outreach/provider-status`
- Lokal-Check im Browser gegen LM Studio `/v1/models`

Danach wird im Dialog angezeigt:

- lokales Modell verfuegbar
- OpenAI-Fallback verfuegbar
- Provider wird geprueft
- kein Provider verfuegbar

Der Generate-Button ist aktiv, wenn mindestens einer der beiden Provider verfuegbar ist.

### Beim Klick auf Generieren

Wenn LM Studio lokal verfuegbar ist:

1. Client baut oder erhaelt den DSGVO-sicheren Prompt.
2. Browser ruft lokal `POST http://127.0.0.1:1234/v1/chat/completions` auf.
3. Browser sendet den fertigen Rohtext an `POST /api/workspace/outreach/generate`.
4. Server parsed den Rohtext, speichert die Activity und gibt das Ergebnis zurueck.

Wenn LM Studio nicht verfuegbar ist:

1. Browser ruft direkt `POST /api/workspace/outreach/generate` ohne lokalen Rohtext auf.
2. Server baut Prompt, nutzt OpenAI, parsed, speichert und gibt das Ergebnis zurueck.

Wenn lokale Generierung fehlschlaegt:

1. Client faellt einmalig auf `POST /api/workspace/outreach/generate` ohne lokalen Rohtext zurueck.
2. Server nutzt OpenAI, sofern konfiguriert.
3. Wenn OpenAI ebenfalls nicht verfuegbar ist, wird ein Fehler angezeigt.

## API-Aenderungen

### Neuer Endpoint: `GET /api/workspace/outreach/provider-status`

Geschuetzt mit `withWorkspaceApiAuth`.

Antwortbeispiel:

```json
{
  "ok": true,
  "providers": {
    "openai": {
      "available": true,
      "model": "gpt-4o-mini"
    }
  }
}
```

Der Endpoint prueft nur serverseitige Cloud-Verfuegbarkeit:

- `OPENAI_API_KEY` gesetzt
- optional Modellname aus `OPENAI_MODEL`

Der Endpoint gibt niemals Secrets zurueck.

### Angepasster Endpoint: `POST /api/workspace/outreach/generate`

Der Endpoint bleibt der einzige App-POST fuer Generieren, Speichern und Rueckgabe.

Das Request-DTO wird erweitert:

```ts
export interface GenerateOutreachRequestDto {
  leadId: string;
  promptKey: OutreachPromptKey;
  channel: OutreachChannel;
  includeImprovements: boolean;
  contextNote?: string;
  clientGeneratedRawText?: string;
  provider?: "local-lm-studio" | "openai";
}
```

Verhalten:

- Mit `clientGeneratedRawText`: Server ruft keinen AI-Provider auf, sondern parsed und speichert den Text.
- Ohne `clientGeneratedRawText`: Server generiert mit OpenAI.
- Ohne lokalen Text und ohne OpenAI-Konfiguration: `NOT_CONFIGURED`.
- Bei OpenAI-Fehler: `PROVIDER_UNAVAILABLE`.

## Code-Umbau

### Server

- `outreach-ai-service.ts` wird OpenAI-only.
- Server-seitiger LM-Studio-Check wird entfernt.
- `generate-outreach-message.command-handler.ts` akzeptiert optional lokalen Rohtext.
- Parsing und Activity-Speicherung werden fuer lokale und OpenAI-generierte Texte gemeinsam genutzt.
- Neuer Provider-Status-Route-Handler wird unter `src/app/api/workspace/outreach/provider-status/route.ts` angelegt.

### Client

- Neuer Client-Service fuer Provider-Status:
  - App-API: `GET /api/workspace/outreach/provider-status`
  - lokaler Check: `GET http://127.0.0.1:1234/v1/models`
- Neuer Client-Service fuer lokale LM-Studio-Generierung:
  - `POST http://127.0.0.1:1234/v1/chat/completions`
  - kurzer Timeout
  - Netzwerkfehler, CORS-Fehler und Timeout gelten als lokal nicht verfuegbar
- `lead-outreach-dialog.tsx` zeigt Provider-Status und nutzt lokal-first Fallback.

### Prompt/Facts

Fuer lokale Generierung braucht der Browser einen Prompt, darf aber keine sensiblen Daten bekommen.

Umsetzung:

- Lead-Facts serverseitig sanitizen.
- E-Mail und Telefonnummer bleiben ausgeschlossen.
- Prompt-Building entweder in ein common-taugliches Modul verschieben oder aus dem bisherigen Server-Service
  extrahieren.
- Keine `server-only`-Imports in Client-nahem Prompt-Code.

## UI und Dictionaries

Die sichtbaren Texte muessen in beiden Sprachen gepflegt werden:

- `src/i18n/dictionaries/workspace/leads/outreach/de.json`
- `src/i18n/dictionaries/workspace/leads/outreach/en.json`

Neue Keys:

- Provider wird geprueft
- Lokales Modell aktiv
- OpenAI-Fallback aktiv
- Kein KI-Provider verfuegbar
- Lokale Generierung fehlgeschlagen, Cloud-Fallback wird genutzt
- OpenAI nicht konfiguriert

Keine neuen Inline-Texte im Dialog.

Da es eine UI-Aenderung ist:

- `frontend-design`-Regeln beachten.
- `animation_mockups/effects-catalog.json` vor Umsetzung pruefen.
- Nur einen passenden bestehenden Effekt adaptieren, wenn er wirklich zum kompakten Workspace-Dialog passt.

Da Dictionary-/Microcopy geaendert wird:

- `copywriting`-Regeln beachten.
- Texte kurz, operativ und nicht marketinglastig halten.

## Cleanup

Folgende bisherige Dead-Code-Endpunkte werden entfernt:

- `src/app/api/workspace/outreach/build-prompt/route.ts`
- `src/app/api/workspace/outreach/save-generated-message/route.ts`

Zugehoerige Dateien entfernen oder bereinigen:

- `src/server/workspace/outreach/build-outreach-prompt.schema.ts`
- `src/server/workspace/outreach/save-generated-message.schema.ts`
- `src/common/contracts/workspace/outreach/build-outreach-prompt-request.dto.ts`
- `src/common/contracts/workspace/outreach/build-outreach-prompt-result.dto.ts`
- `src/common/contracts/workspace/outreach/save-generated-message-request.dto.ts`
- Exports in `src/common/contracts/workspace/outreach/index.ts`
- Tests fuer `build-prompt`
- Tests fuer `save-generated-message`
- Veraltete README-Abschnitte in `src/app/api/workspace/outreach/README.md`

`OutreachLmStudio` bleibt als Client-Konfiguration erhalten, aber nicht mehr als serverseitiger Fallback-Mechanismus.

## Tests

### Server/API

- `provider-status` liefert OpenAI verfuegbar, wenn `OPENAI_API_KEY` gesetzt ist.
- `provider-status` liefert OpenAI nicht verfuegbar, wenn `OPENAI_API_KEY` fehlt.
- `provider-status` gibt keine Secrets zurueck.
- `generate` speichert lokalen Rohtext ohne AI-Service-Aufruf.
- `generate` nutzt OpenAI, wenn kein lokaler Rohtext uebergeben wird.
- `generate` liefert `NOT_CONFIGURED`, wenn kein lokaler Rohtext vorhanden ist und OpenAI fehlt.
- `generate` liefert `PROVIDER_UNAVAILABLE`, wenn OpenAI fehlschlaegt.

### Client

- lokaler Provider-Check erkennt erfolgreiche `/v1/models`-Antwort.
- lokaler Provider-Check behandelt Netzwerkfehler, CORS-Fehler und Timeout als nicht verfuegbar.
- Dialog deaktiviert Button, wenn weder lokal noch OpenAI verfuegbar ist.
- Dialog zeigt lokalen Provider, wenn LM Studio verfuegbar ist.
- Dialog zeigt Cloud-Fallback, wenn lokal nicht verfuegbar, aber OpenAI konfiguriert ist.
- Dialog faellt bei lokaler Generate-Fehlermeldung auf OpenAI zurueck.

### Regression

Ausfuehren:

```bash
npm run test:unit
npm run lint
npm run typecheck
```

Bei UI-Aenderungen zusaetzlich relevanten jsdom-Test fuer Dialog-Status und Button-State ergaenzen.

## Annahmen

- Lokales LM Studio ist nur ueber `127.0.0.1:1234/v1` erlaubt.
- Kein LAN-Host, kein externer Host, kein Tunnel.
- OpenAI bleibt ausschliesslich serverseitig.
- Der lokale Rohtext wird nur von authentifizierten Workspace-Nutzern gespeichert.
- Wenn Browser-Security den lokalen Aufruf blockiert, gilt lokal als nicht verfuegbar.
