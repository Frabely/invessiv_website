# Workspace Outreach API

Server-authenticated JSON API for the outreach generator under `/api/workspace/outreach`.

## Auth

Every route is wrapped with `withWorkspaceApiAuth(handler)` from `src/lib/auth/api.ts`. Access rules match the other
Workspace APIs: unauthenticated requests return `401`, non-allowlisted requests return `404`.

## `POST /api/workspace/outreach/build-prompt`

Builds the DSGVO-safe prompt bundle for a lead without exposing email or phone data in the prompt payload.

### Body

```jsonc
{
  "leadId": "string",
  "promptKey": "first-touch",
  "channel": "linkedin | email | instagram | direct-message",
  "includeImprovements": true,
  "contextNote": "string (optional, max. 200 chars)",
}
```

### Response `200`

```json
{
  "systemPrompt": "string",
  "userPrompt": "string"
}
```

## `POST /api/workspace/outreach/save-generated-message`

Persists a locally generated outreach draft after the client generated it via LM Studio.

### Body

```jsonc
{
  "leadId": "string",
  "promptKey": "first-touch",
  "channel": "linkedin | email | instagram | direct-message",
  "rawText": "string",
}
```

### Response `200`

```json
{
  "ok": true,
  "channel": "linkedin | email | instagram | direct-message",
  "promptKey": "first-touch",
  "subject": "string (only for email)",
  "body": "string"
}
```

## `POST /api/workspace/outreach/generate`

Server-side fallback that generates with OpenAI only. This route does not use LM Studio and never reaches a local host.

### Body

Same shape as `build-prompt`.

### Response `200`

Same shape as `save-generated-message`.

## Errors

- `400 VALIDATION_ERROR` - Body is missing, invalid JSON, or violates the schema.
- `404 LEAD_NOT_FOUND` - Lead does not exist.
- `503 PROVIDER_UNAVAILABLE` - OpenAI is not available.
- `500 INTERNAL` - Unexpected error.

## Client-side LM Studio flow

- The browser calls `GET http://127.0.0.1:1234/v1/models` with a short timeout.
- If reachable, the browser calls `POST /v1/chat/completions` on the same local base URL.
- The local base URL must stay loopback-only (`127.0.0.1:1234/v1`).
- `OPENAI_API_KEY` remains server-only and is never exposed to the client.
