# Ordner 12 — Portalidentität und Mehrfirmenzugriff

> **Status:** offen · **Abhängigkeiten:** 03, 04, 10 · **Aufwand:** 4–5 Tage · **Reviewziel:** 80–120 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`20-portal-zugang.md`](./20-portal-zugang.md) — Invitation, Kontaktbindung,
  Mehrfirmenmitgliedschaft, Firmenkontext und Widerruf.

Kundenkontakte können sicher eingeladen werden, sich mit Clerk anmelden, zwischen berechtigten
Firmen wechseln und den Zugang sofort verlieren. Nach Merge ist eine minimale, aber vollständige
Portalseite mit Firmenname und Abmelden nutzbar; fachliche Dashboardmodule folgen erst in Ordner 13.

## Identität und Einladung

- Additive Migrationen und Modelle für `portal_invites` und `portal_memberships` entstehen in
  diesem Ordner.
- Clerk auf Restricted; öffentliche Selbstregistrierung führt nie zu CRM-Zugriff.
- Einladung bindet Kunde und Personenzuordnung, speichert nur Tokenhash, Ablauf, Ersteller und Status.
- Token sieben Tage gültig, einmal nutzbar und bei Widerruf sofort ungültig.
- Nach erfolgreicher Clerk-Verifikation entsteht beziehungsweise ergänzt eine Portalmitgliedschaft
  des Clerk-Kontos. E-Mail allein autorisiert niemals automatisch.
- Eine Mitgliedschaft je Clerk-User und Kunde; dieselbe Person kann mehrere Firmen besitzen.
- Portalsprache pro Person; Einladungsmail nutzt diese Sprache.

## Firmenkontext und Grenzen

- Aktive Mitgliedschaft in serverseitig geschützter, signierter Sitzung speichern.
- Firmenwechsler zeigt nur aktive Mitgliedschaften und aktualisiert den Kontext serverseitig.
- Jeder Query-Handler leitet `customerId` aus dem validierten Kontext ab.
- Widerruf invalidiert Zugriff sofort; bestehende Browser-Sitzung wird beim nächsten Request
  abgewiesen.
- Vor Einladung muss eine Portalvorschau bestätigt sein, auch wenn sie in diesem Ordner noch nur
  Identität und leere Module zeigt.

## Merge-Gate

- [ ] Interner Nutzer erhält nicht automatisch Portalzugriff und umgekehrt.
- [ ] E-Mail-Kollision verbindet keine fremde Person oder Firma.
- [ ] Token ist gehasht, abgelaufen/einmalig und nicht in Logs/Analytics.
- [ ] Zwei Firmen desselben Kontos sind wechselbar; manipulierte Kontextwerte liefern 404.
- [ ] Fremdzugriffstests decken Query und Mutation ab.
- [ ] Die minimale Portalseite ist ehrlich nutzbar; keine toten Dashboardkarten.

## Rollback

Einladungen stoppen und Portal-Feature-Flag deaktivieren. Mitgliedschaften bleiben widerrufen oder
gespeichert; der interne Workspace bleibt unabhängig.
