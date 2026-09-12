# Ordner 03 — Mitglieder und fail-closed Auth

> **Status:** offen · **Abhängigkeit:** Ordner 01 · **Aufwand:** 3–4 Tage · **Reviewziel:** 50–80 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`02-rechtesystem.md`](./02-rechtesystem.md) — Rollen, Permissions, Bootstrap,
  Mitgliederverwaltung und Fail-closed-Gates.

Der Owner kann interne Mitglieder einladen, globalen Credential-Zugriff vergeben und Mitglieder
nach vollständiger Übergabe deaktivieren. Die bisherige Workspace-Nutzung bleibt für den ersten
Owner möglich. DB- oder Clerk-Fehler öffnen niemals Zugriff.

## Änderungen

- Rollen `owner | member`, Aktivstatus und `credentials_access` über gemeinsame Contracts abbilden.
- Zentralen `can(actor, permission, resource)`-Einstieg für interne Rechte einführen.
- Allowlist nur dann als Bootstrap akzeptieren, wenn noch kein Owner existiert; Owner-Zeile in
  derselben Transaktion atomar anlegen. Danach entscheidet ausschließlich `workspace_members`.
- Bei DB-Fehler, unbekanntem Mitglied oder deaktiviertem Mitglied fail-closed antworten.
- Owner-only Mitgliederansicht mit Einladung, Aktivierung, Credential-Freigabe und Deaktivierung.
- Deaktivierung blockieren, solange aktive Kunden, Projekte, Aufgaben oder Renewals zugewiesen sind;
  Übergabevorschau und Zielmitglied sind Pflicht.
- Security-Aktivitäten ohne E-Mail-Inhalte oder Secrets protokollieren.

## Schnittstellen

- Query: Mitgliederliste inklusive Aktivstatus und offenen Zuständigkeitszahlen.
- Commands: Mitglied einladen, Berechtigung ändern, Übergabe prüfen, Übergabe ausführen,
  deaktivieren. Alle liefern Result-Unions und sind Owner-only.
- Interner Actor enthält Mitglieds-ID, Clerk-ID, Rolle und Permission-Set; keine Rolle aus Clerk.

## Merge-Gate

- [ ] Bestehender allowlisteter Erstnutzer wird genau einmal Owner.
- [ ] Eine bereits initialisierte Installation nutzt die Allowlist nicht mehr als Zugriffsgate.
- [ ] DB-Ausfall, Timeout und ungültige Zeile ergeben keinen Fallback-Zugang.
- [ ] Letzter aktiver Owner kann nicht deaktiviert oder herabgestuft werden.
- [ ] Deaktivierung mit offenen Zuständigkeiten liefert 409 und eine vollständige Vorschau.
- [ ] Navigation erscheint nur, wenn die Mitgliederverwaltung vollständig funktioniert.

## Rollback

UI-Verlinkung per Flag deaktivieren. Das neue Gate bleibt aktiv; ein Rollback auf fail-open ist
ausgeschlossen. Notfallzugriff erfolgt über dokumentierte DB-Administration, nicht über Codefallback.
