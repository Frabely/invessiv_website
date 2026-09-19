# 03 — Client-Service für Zugriffsbereiche

> **Ordner:** 07c · **Aufwand:** S · **Hängt ab von:** 02 · **Blockiert:** 05, 06, 07

## Warum

`apps/workspace/src/client/access/access-api-service.ts` kennt Mitglieder, Rollen und den Owner-Flow, aber
keine Zugriffsbereiche. Ohne diese Methoden gibt es keinen Schreibweg aus der UI. Die Endpunkt-Helfer
existieren bereits (`src/common/patterns/access/access-api-endpoints.ts`).

## Umfang

Neue Methoden am bestehenden Service-Objekt:

| Methode                                       | Endpunkt                                        |
| --------------------------------------------- | ----------------------------------------------- |
| `listMemberAccessScopes(memberId)`            | `GET  …/members/{id}/access-scopes`             |
| `grantAccessScope(memberId, input)`           | `POST …/members/{id}/access-scopes`             |
| `revokeAccessScope(memberId, scopeId, input)` | `DELETE …/members/{id}/access-scopes/{scopeId}` |
| `listCustomerAccessScopes(customerId)`        | `GET  …/crm/customers/{id}/access-scopes`       |
| `listAccessCustomers(query)`                  | Lookup aus Task 02                              |

Dazu:

- `WorkspaceApiEndpoint` um den Lookup-Pfad aus Task 02 ergänzen. Keine URL-Literale, keine
  zusammengesetzten Strings — Pfade laufen über die vorhandenen Helfer.
- HTTP-Methoden, Header, Media-Types und Statuscodes ausschließlich aus
  `@invessiv/common/constants/http/` (`HttpMethod.Delete`, `HttpResponseCode.Conflict`, …).
- 409 trägt `VersionConflictDto` und wird unverändert an `useVersionedMutation` durchgereicht.
- Fehlercodes werden durchgereicht, nicht übersetzt: `ACCESS_SCOPE_ALREADY_GRANTED`,
  `ACCESS_SCOPE_NOT_ASSIGNABLE`, `ACCESS_SCOPE_PROJECT_CUSTOMER_MISMATCH`, `ACCESS_SCOPE_NOT_FOUND`,
  `MEMBER_WITHOUT_ROLE`. Die Texte liegen bereits in `settings/members/{de,en}.json`.

## Tests

Nach dem Muster der bestehenden Client-Service-Tests:

- sends the versioned payload and returns the granted scope
- maps a 409 response to the conflict shape without losing `current`
- surfaces each access-scope error code unchanged
- builds every path through the endpoint helpers (kein Literal im Test)

## Akzeptanz

- Kein String-Literal für Pfade, Methoden oder Statuscodes im neuen Code.
- Der Service übersetzt keinen Fehlercode in Text — das bleibt Sache der Komponente.
