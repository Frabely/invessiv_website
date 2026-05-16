# Workspace Outreach API

JSON-API fÃ¼r die generierte Outreach-Nachricht unter `/api/workspace/outreach/generate`. Server-only,
Clerk-authentifiziert, allowlist-gated.

## Auth

Jeder Handler ist mit `withWorkspaceApiAuth(handler)` aus `src/lib/auth/api.ts` gewrappt. Die Zugriffsregeln sind
identisch zu den anderen Workspace-APIs: unauthenticated â†’ `401`, nicht allowlisted â†’ `404`.

## `POST /api/workspace/outreach/generate`

Generiert eine personalisierte Outreach-Kurznachricht fÃ¼r einen bestehenden Lead.

### Body

```jsonc
{
  "leadId": "string",
  "promptKey": "first-touch",
  "channel": "linkedin | email | instagram | direct-message",
  "includeImprovements": true,
  "contextNote": "string (optional, max. 200 Zeichen)",
}
```

### Response `200`

```json
{
  "ok": true,
  "channel": "linkedin | email | instagram | direct-message",
  "promptKey": "first-touch",
  "subject": "string (nur bei E-Mail)",
  "body": "string"
}
```

### Fehler

- `400 VALIDATION_ERROR` â€” Body fehlt, ist kein valides JSON oder verletzt das Zod-Schema.
- `404 LEAD_NOT_FOUND` â€” Lead existiert nicht.
- `503 PROVIDER_UNAVAILABLE` â€” Weder LM Studio noch OpenAI waren verfÃ¼gbar.
- `500 INTERNAL` â€” Unerwarteter Fehler.
