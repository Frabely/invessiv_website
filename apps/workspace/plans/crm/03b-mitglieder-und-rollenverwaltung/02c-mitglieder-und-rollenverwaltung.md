# Task 02c — Mitglieder- und Rollenverwaltung

> **Merge-Einheit:** Ordner 03b · **Branch:** `feat/crm-mitglieder-und-rollenverwaltung`
> **Aufwand:** L · **Abhängigkeiten:** Task 02 (Ordner 03)

## Kontext

Ordner 03 liefert Identität, Katalog, Systemrollen, Gates und den Owner-Bootstrap — aber keinen Weg, weitere
Mitglieder anzulegen. Dieser Task liefert die Verwaltung vertikal vollständig. Er folgt aus dem Split-Gate von Task 02.

## Endpunkte (alle über `WorkspaceApiEndpoint`)

| Methode + Pfad                                                   | Permission       |
| ---------------------------------------------------------------- | ---------------- |
| `GET /api/workspace/members`                                     | `members.read`   |
| `GET /api/workspace/members/clerk-candidates`                    | `members.manage` |
| `POST /api/workspace/members`                                    | `members.manage` |
| `PATCH /api/workspace/members/[id]` (aktiv, Version)             | `members.manage` |
| `PUT /api/workspace/members/[id]/roles`                          | `members.manage` |
| `POST /api/workspace/members/[id]/owner` / `DELETE`              | `members.manage` |
| `POST /api/workspace/members/[id]/handover`                      | `members.manage` |
| `GET /api/workspace/roles`, `GET /api/workspace/permissions`     | `roles.manage`   |
| `POST /api/workspace/roles`, `PATCH …/roles/[id]`                | `roles.manage`   |
| `GET /api/workspace/members/[id]/effective-permissions?roleIds=` | `members.manage` |

## Invarianten

- `PUT …/roles` darf `workspace_owner` weder setzen noch entfernen; dafür gibt es ausschließlich den Owner-Flow.
- Systemrollen: Name, Realm und Rechtesatz unveränderlich; nur Zuweisung möglich.
- Mindestens ein aktiver Owner: geprüft in derselben Transaktion mit `SELECT … FOR UPDATE` auf die Owner-Zuweisungen.
- Niemand entzieht sich selbst die letzte Owner-Zuweisung.
- Clerk-Kandidaten: nur Konten ohne `users`-Zeile; die Bindung erfolgt über die gewählte Clerk-ID, nie über E-Mail.
- Registry: neue `OwnableEntity` ohne Adapter bricht den Typecheck (Ordner 07, 08, 11 registrieren ihre Entität).

## Tickets

- **CRM-03b-T1** Mitglieder-Commands/-Queries + Clerk-Kandidaten + Security-Events
- **CRM-03b-T2** Rollen-Commands/-Queries + effektive Vorschau
- **CRM-03b-T3** Owner-Flow + Letzter-Owner-Schutz
- **CRM-03b-T4** Ownership-Registry, Übergabe, Deaktivierungssperre
- **CRM-03b-T5** Settings-UI (Liste, Dialoge, Rollen-Editor), Dictionaries, Sidebar-Bereich
- **CRM-03b-T6** Permissionabhängige Aktionen in Leads/Outreach
- **CRM-03b-T7** Integrationstests der Merge-Gate-Szenarien gegen die Dev-DB
