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

Generates, parses, and persists an outreach draft from structured lead data and form context.

### Body

```jsonc
{
  "leadId": "string",
  "channel": "linkedin | email | instagram | direct-message",
  "contextNote": "string (optional, max. 200 chars)",
}
```

### Response `200`

```json
{
  "ok": true,
  "channel": "linkedin | email | instagram | direct-message",
  "subject": "string (for email and LinkedIn)",
  "body": "string"
}
```

## Errors

- `400 VALIDATION_ERROR` - Body is missing, invalid JSON, or violates the schema.
- `404 LEAD_NOT_FOUND` - Lead does not exist.
- `503 NOT_CONFIGURED` - No AI provider is configured.
- `503 PROVIDER_UNAVAILABLE` - The configured providers could not generate a draft.
- `500 INTERNAL` - Unexpected error.

## Server-side generation flow

- The server loads `local-skills/invessiv-outreach-skill/SKILL.md` as the canonical instruction source.
- Lead data is resolved server-side by `leadId`.
- The server derives structured context such as `websiteExists` from existing lead data and decides internally whether
  improvements are relevant.
- The server generates outreach drafts with OpenAI.
- `OPENAI_API_KEY` remains server-only and is never exposed to the client.
