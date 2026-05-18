# Workspace Outreach API

Server-authenticated JSON API for the outreach generator under `/api/workspace/outreach`.

## Auth

Every route is wrapped with `withWorkspaceApiAuth(handler)` from `src/lib/auth/api.ts`. Access rules match the other
Workspace APIs: unauthenticated requests return `401`, non-allowlisted requests return `404`.

## `GET /api/workspace/outreach/provider-status`

Returns which server-side AI providers are configured. Never exposes secrets.

### Response `200`

```json
{
  "ok": true,
  "providers": {
    "openai": {
      "available": true,
      "model": "gpt-4.1-mini"
    }
  }
}
```

## `POST /api/workspace/outreach/generate`

Generates, parses, and persists an outreach draft. When `clientGeneratedRawText` is provided the server skips the AI
call and uses that text directly for parsing and persistence. Without it the server calls OpenAI.

### Body

```jsonc
{
  "leadId": "string",
  "promptKey": "first-touch",
  "channel": "linkedin | email | instagram | direct-message",
  "includeImprovements": true,
  "contextNote": "string (optional, max. 200 chars)",
  "clientGeneratedRawText": "string (optional — raw text from local LM Studio)",
  "provider": "local-lm-studio | openai (optional, informational)",
}
```

### Response `200`

```json
{
  "ok": true,
  "channel": "linkedin | email | instagram | direct-message",
  "promptKey": "first-touch",
  "subject": "string (for email and LinkedIn)",
  "body": "string"
}
```

## Errors

- `400 VALIDATION_ERROR` - Body is missing, invalid JSON, or violates the schema.
- `404 LEAD_NOT_FOUND` - Lead does not exist.
- `503 NOT_CONFIGURED` - No OpenAI key configured and no local raw text provided.
- `503 PROVIDER_UNAVAILABLE` - OpenAI call failed.
- `500 INTERNAL` - Unexpected error.

## Client-side LM Studio flow

- The browser calls `GET http://127.0.0.1:1234/v1/models` with a short timeout to check local availability.
- If reachable, the browser calls `POST http://127.0.0.1:1234/v1/chat/completions` and sends the resulting raw text
  to `POST /api/workspace/outreach/generate` as `clientGeneratedRawText`.
- If the local call fails, the browser falls back to calling `POST /api/workspace/outreach/generate` without
  `clientGeneratedRawText`, letting the server use OpenAI.
- The local base URL must stay loopback-only (`127.0.0.1:1234/v1`). Vercel never reaches local hosts.
- `OPENAI_API_KEY` remains server-only and is never exposed to the client.
