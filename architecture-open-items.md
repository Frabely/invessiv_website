# Architecture Open Items

Zweck: Offene, bewusst verschobene Architekturverstöße werden hier verbindlich dokumentiert.

## Template pro Eintrag

- Datum:
- Datei/Ort:
- Betroffene AGENTS.md-Regel:
- Problem:
- Risiko:
- Entscheidung (verschoben bis ...):
- Nächster Schritt:
- Verantwortlich:

## Aktuell offene Punkte

- Datum: 2026-03-21
- Datei/Ort: [contact-rate-limit.ts](C:/Users/MoritzDesktop/IdeaProjects/invessiv_website/src/server/services/anti-abuse/contact-rate-limit.ts)
- Betroffene AGENTS.md-Regel: Monitoring- und Betriebsstandards / Backend-Architektur auf Vercel skalierbar halten
- Problem: Das Contact-Rate-Limit liegt aktuell in einer In-Memory-Map pro Prozess. Auf Vercel ist das nicht instanzübergreifend konsistent und schützt nur begrenzt gegen verteilte oder kalte Requests.
- Risiko: Uneinheitliches Abuse-Verhalten zwischen Instanzen, schwächerer Schutz unter Last, schwerer reproduzierbare Limits.
- Entscheidung (verschoben bis ...): Verschoben bis zur Einführung eines verteilten Stores für Backend-State.
- Nächster Schritt: Rate-Limit auf KV/Redis-basierte Speicherung umstellen und `Retry-After`/Observability darauf aufbauen.
- Verantwortlich: Backend/API
