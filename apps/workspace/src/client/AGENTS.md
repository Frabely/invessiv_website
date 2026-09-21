# AGENTS.md — Workspace Client Layer

## Geltungsbereich

Diese Regeln gelten für alle Dateien unter `apps/workspace/src/client/`.

## Services im Client

- Ein Client-Service ist im Regelfall die **Schnittstelle zur API**: Er nimmt das Request-DTO aus
  `packages/common/src/contracts/<domain>/` entgegen, ruft den passenden Endpoint auf und liefert ein typisiertes
  Client-Ergebnis zurück. Datei: `<entity>-api-service.ts` in einem fachlichen Unterordner (`crm/`, `leads/`, …).
- Anders als im Server (`src/server/AGENTS.md`, Abschnitt „Handler vs. Service“) ist `Service` hier also kein
  Bindeglied zwischen Handlern, sondern die Transportgrenze zwischen UI und API.
- UI-Komponenten bauen kein `fetch` selbst; sie mappen Formwerte über `common/patterns/**` auf das DTO und übergeben es
  dem Service.
- Service-Module exportieren ein benanntes Service-Objekt; einzelne Fetch-Funktionen bleiben unexportiert.
- Endpoints kommen aus den typisierten Endpoint-Helfern, HTTP-Konstanten aus `@invessiv/common/constants/http/`.
