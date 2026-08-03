# AGENTS.md — apps/profile-bridge

Chrome-Erweiterung (Manifest V3), die Instagram- und LinkedIn-Profildaten aus dem eingeloggten Browser des Nutzers liest
und an den Invessiv Workspace zurückgibt. Sie ist die Datenquelle für den Icebreaker im Outreach-Pitch-Generator (Plan:
`apps/workspace/plans/workspace/leads/outreach-pitch-generator.md`).

## Sprachregel

Inhalte von `AGENTS.md`-Dateien in diesem Projekt immer auf Deutsch pflegen.

## Was hier hingehört

- Service Worker und Message-Handling gegenüber der Workspace-Seite
- Plattform-Clients (`instagram-client.ts`, `linkedin-client.ts`)
- Reine Normalisierung von Rohdaten auf `ProfileSnapshot`
- Der DOM-Reader, der in einen offenen LinkedIn-Tab injiziert wird

## Was hier nicht hingehört

- **Keine Secrets.** Kein API-Key, kein Token, keine Zugangsdaten — die Extension kennt ausschließlich die
  Browser-Session des Nutzers.
- **Keine Persistenz.** Nichts wird gespeichert, weder in `chrome.storage` noch sonst wo. Rohdaten fließen durch und
  werden zurückgegeben.
- **Keine Fachlogik.** Kein Icebreaker, kein Template, keine Lead-Kenntnis. Die Extension weiß nichts über Leads.
- **Kein Netzwerkzugriff auf den Workspace.** Die Seite ruft die Extension, nie umgekehrt.

## Verbindliche Regeln

- **Rate-Limit ist Pflicht.** Jeder Plattform-Abruf läuft über `throttle()` aus `rate-limiter.ts`. Kein Code-Pfad darf
  daran vorbei. Grund: Der Abruf nutzt die private Web-API mit der echten Session des Nutzers; ein Anfragen-Burst
  riskiert einen Checkpoint auf seinem Account.
- **Keine Massen-Schleifen.** Es wird immer genau ein Profil pro Anfrage geholt. Batch-Verarbeitung gehört auf die
  Client-Seite im Workspace, mit dortiger Nebenläufigkeitsgrenze.
- **LinkedIn nur per DOM.** Für LinkedIn wird ausschließlich der bereits offene Profil-Tab ausgelesen. Es geht **kein**
  zusätzlicher Request an LinkedIn (keine Voyager-Endpunkte) — LinkedIn erkennt automatisierte Abrufe deutlich
  aggressiver als Instagram.
- **Der injizierte DOM-Reader muss eigenständig sein.** `readLinkedInProfileFromDom` wird für
  `chrome.scripting.executeScript` zu einem String serialisiert. Referenzen auf Modul-Scope (Imports, Konstanten,
  Hilfsfunktionen außerhalb der Funktion) sind nach dem Bundling nicht mehr vorhanden und brechen zur Laufzeit.
- **Fehler sind typisiert.** Jede Fehlerantwort nutzt `ProfileBridgeErrorCode` aus `@invessiv/common`. Kein
  String-Literal, keine geworfene Exception über die Message-Grenze.
- **Defensiv normalisieren.** Fremde Antwortformate können sich jederzeit ändern. Jeder Feldzugriff wird geprüft;
  fehlende Felder werden zu `null`, nicht zu einem Fehler.

## Struktur

```
src/
  background/
    service-worker.ts      ← Einstiegspunkt, Message-Routing
    instagram-client.ts    ← Abruf mit Session
    linkedin-client.ts     ← Tab-Suche + Injektion
    rate-limiter.ts        ← Pflicht-Drossel
  content/
    linkedin-reader.ts     ← eigenständige, injizierte Funktion
  normalize/               ← Rohdaten → ProfileSnapshot, ohne Seiteneffekte
```

## Tests

Normalisierungsfunktionen werden mit gespeicherten Beispiel-Payloads unit-getestet. **Kein Test darf Netzwerkzugriffe
machen** und keiner darf echte Profile abrufen.

## Contracts

`ProfileSnapshot`, `ProfileBridgeRequest`, `ProfileBridgeResponse` und alle Fehlercodes liegen in
`packages/common/src/{contracts,constants}/leads/outreach/`. Sie werden hier nur importiert, nie dupliziert.
