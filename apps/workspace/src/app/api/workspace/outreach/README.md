# Workspace Outreach API

Server-authenticated JSON API for the pitch generator under `/api/workspace/outreach`.

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

## `POST /api/workspace/outreach/pitch`

Generates and persists a pitch draft from a lead and a profile snapshot. The client captures the snapshot through the
Profile-Bridge extension (`apps/profile-bridge`) or the paste fallback — the server never fetches profiles itself.

### Body

```jsonc
{
  "leadId": "string",
  "channel": "instagram | linkedin",
  "snapshot": {
    "platform": "instagram | linkedin",
    "source": "bridge_api | bridge_dom | manual_paste",
    "handle": "string | null",
    "displayName": "string | null",
    "biography": "string | null",
    "headline": "string | null",
    "category": "string | null",
    "followerCount": "number | null",
    "isVerified": false,
    "posts": [
      {
        "caption": "string | null",
        "postedAt": "string | null",
        "likeCount": "number | null",
      },
    ],
    "capturedAt": "ISO date string",
  },
}
```

### Response `200`

```json
{
  "ok": true,
  "draft": {
    "id": "string",
    "leadId": "string",
    "channel": "instagram",
    "audience": "single | team",
    "salutationName": "string",
    "icebreaker": "string",
    "body": "string",
    "charCount": 847,
    "model": "gpt-4.1-mini",
    "profileSource": "bridge_api",
    "profileCapturedAt": "string | null",
    "createdAt": "string"
  }
}
```

## `GET /api/workspace/outreach/pitch?leadId=<id>&channel=<channel>`

Returns the newest stored draft for that lead and channel, or `null`.

### Response `200`

```json
{ "ok": true, "draft": null }
```

## Errors

- `400 VALIDATION_ERROR` - Body or query is missing, invalid JSON, or violates the schema.
- `404 LEAD_NOT_FOUND` - Lead does not exist.
- `422 NO_PROFILE_DATA` - The snapshot holds too little for a grounded icebreaker; no draft is stored.
- `422 ICEBREAKER_TOO_LONG` - The icebreaker still exceeded the channel limit after the retries.
- `503 NOT_CONFIGURED` - No AI provider is configured.
- `503 PROVIDER_AUTHENTICATION_FAILED` - The configured API credentials were rejected.
- `503 PROVIDER_MODEL_UNAVAILABLE` - The configured model does not exist or is unavailable.
- `429 PROVIDER_RATE_LIMITED` - The provider rate limit was reached.
- `502 PROVIDER_REJECTED` - The provider rejected the request configuration.
- `502 PROVIDER_INVALID_RESPONSE` - The provider returned no usable structured output.
- `503 PROVIDER_UNAVAILABLE` - The configured provider could not be reached.
- `500 TEMPLATE_INVALID` - A pitch template is missing or lost a placeholder.
- `500 PITCH_INTERNAL` - Unexpected error. The response includes an `errorId` for diagnostics.

## Server-side generation flow

- The server loads `local-skills/invessiv-pitch-skill/SKILL.md` as the instruction source and the matching
  `templates/<channel>.<audience>.txt` as the message body.
- The AI produces only `salutationName`, `audience`, and `icebreaker` as JSON. The server renders the template around
  it, so `{{Name}}` and `{{Icebreaker}}` are the only variable parts.
- Draft and `MessageDrafted` activity are stored in one transaction. The activity references the draft but never
  duplicates the pitch body.
- The icebreaker budget is computed from the template length and the name length, and passed to the model as an exact
  number. On overflow the server retries up to twice with a recomputed budget before failing.
- Previous icebreakers for the same lead and channel are passed as a negative list, so regenerating yields a different
  angle rather than a reworded one.
- Every draft is stored in `lead_outreach_drafts` and logged as a `message_drafted` lead activity.
- `OPENAI_API_KEY` remains server-only and is never exposed to the client.
