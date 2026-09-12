# Ordner 12 — Portalidentität und Mehrfirmenzugriff

> **Status:** offen · **Abhängigkeiten:** 03, 04, 10 · **Aufwand:** 4–5 Tage · **Reviewziel:** 80–100 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`20-portal-zugang.md`](./20-portal-zugang.md) — Invitation, Kontaktbindung,
  Mehrfirmenmitgliedschaft, Firmenkontext und Widerruf.

Kundenkontakte können sicher eingeladen werden, sich mit Clerk anmelden, zwischen berechtigten
Firmen wechseln und den Zugang sofort verlieren. Nach Merge ist eine minimale, aber vollständige
Portalseite mit Firmenname und Abmelden nutzbar; fachliche Dashboardmodule folgen erst in Ordner 13.

## Identität und Einladung

- Additive Migrationen und Modelle für `portal_invitations` und `portal_memberships` entstehen in
  diesem Ordner.
- Clerk auf Restricted; öffentliche Selbstregistrierung führt nie zu CRM-Zugriff.
- Einladung bindet Kunde und Personenzuordnung, speichert nur Tokenhash, Ablauf, Ersteller und Status.
- Token sieben Tage gültig, einmal nutzbar und bei Widerruf sofort ungültig.
- Eine Mitgliedschaft entsteht ausschließlich durch Einlösen eines Tokens in einer bestehenden
  Clerk-Sitzung. Ohne Konto führt der Link zu Sign-up, mit Konto zu Sign-in — danach derselbe
  Redeem-Pfad. Es gibt keinen E-Mail-Abgleich und keine Spalte auf einer E-Mail-Adresse.
- Die zweite Firma verlangt eine eigene Einladung und eine eigene Einlösung; keine Direktanlage
  durch Mitarbeiter und keine Auto-Einlösung.
- Eine Mitgliedschaft je Kunde und Person; dieselbe Person kann mehrere Firmen bedienen.
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
- [ ] Keine Mitgliedschaft entsteht ohne eingelösten Token; E-Mail-Gleichheit verbindet nichts.
- [ ] Token ist gehasht, abgelaufen/einmalig und nicht in Logs/Analytics.
- [ ] Paralleles Einlösen desselben Tokens erzeugt genau eine Mitgliedschaft.
- [ ] Zwei Firmen desselben Kontos sind wechselbar; manipulierte Kontextwerte liefern 404.
- [ ] Fremdzugriffstests decken Query und Mutation ab.
- [ ] Die minimale Portalseite ist ehrlich nutzbar; keine toten Dashboardkarten.

## Rollback

Einladungen stoppen und Portal-Feature-Flag deaktivieren. Mitgliedschaften bleiben widerrufen oder
gespeichert; der interne Workspace bleibt unabhängig.
