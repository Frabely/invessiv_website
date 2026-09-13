# Ordner 12 — Portalidentität und Mehrfirmenzugriff

> **Status:** offen · **Abhängigkeiten:** 03b, 04, 10 · **Aufwand:** 4–5 Tage · **Reviewziel:** 80–100 Dateien

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
- `portal_memberships` referenziert die in Ordner 03 eingeführte `users.id`; dieselbe menschliche Identität kann
  interne und Portalmitgliedschaften besitzen, ohne deren Berechtigungs-Realms zu vermischen.
- Clerk auf Restricted; öffentliche Selbstregistrierung führt nie zu CRM-Zugriff.
- Einladung bindet Kunde und Personenzuordnung, speichert nur Tokenhash, Ablauf, Ersteller und Status.
- Token sieben Tage gültig, einmal nutzbar und bei Widerruf sofort ungültig.
- Eine Mitgliedschaft entsteht ausschließlich durch Einlösen eines Tokens in einer bestehenden
  Clerk-Sitzung. Ohne Konto führt der Link zu Sign-up, mit Konto zu Sign-in — danach derselbe
  Redeem-Pfad. Es gibt keinen E-Mail-Abgleich und keine Spalte auf einer E-Mail-Adresse.
- Die zweite Firma verlangt eine eigene Einladung und eine eigene Einlösung; keine Direktanlage
  durch Mitarbeiter und keine Auto-Einlösung.
- Eine Mitgliedschaft je Kunde und Person; dieselbe Person kann mehrere Firmen bedienen.
- Portalrollen verwenden das RBAC-Fundament aus Ordner 03. Rollen werden je Portalmitgliedschaft zugewiesen und
  enthalten ausschließlich Portal-Permissions.
- Portalsprache pro Person; Einladungsmail nutzt diese Sprache.

## Firmenkontext und Grenzen

- **Kein Sitzungszustand.** Der aktive Kunde steht im Pfad (`/[locale]/portal/[customerId]/…`) und
  wird bei jeder Anfrage neu gegen eine aktive Mitgliedschaft aufgelöst — dasselbe zustandslose
  Muster wie `src/lib/auth/api.ts` im internen Bereich. Kein Cookie, keine Clerk-Metadaten.
- Der Pfadwert ist ein Vorschlag, keine Autorisierung. Kein Treffer in `portal_memberships` ergibt 404.
- Firmenwechsler ist eine Liste von Links, kein Endpunkt und kein Schreibvorgang.
- Jeder Handler nimmt nur einen aufgelösten `PortalActor`, nie eine rohe `customerId`.
- Widerruf invalidiert Zugriff sofort; bestehende Browser-Sitzung wird beim nächsten Request
  abgewiesen.
- Vor Einladung muss eine Portalvorschau bestätigt sein, auch wenn sie in diesem Ordner noch nur
  Identität und leere Module zeigt.

## Merge-Gate

- [ ] Eine interne Mitgliedschaft gewährt nicht automatisch Portalzugriff und umgekehrt, auch wenn beide dieselbe
      `users.id` referenzieren.
- [ ] Facette „hat Portalzugang" ist in `CUSTOMER_LIST_FACETS` registriert und nutzbar.
- [ ] Keine Mitgliedschaft entsteht ohne eingelösten Token; E-Mail-Gleichheit verbindet nichts.
- [ ] Token ist gehasht, abgelaufen/einmalig und nicht in Logs/Analytics.
- [ ] Paralleles Einlösen desselben Tokens erzeugt genau eine Mitgliedschaft.
- [ ] Zwei Firmen desselben Kontos sind per Link wechselbar und gleichzeitig in zwei Tabs nutzbar.
- [ ] Eine fremde oder geratene `customerId` im Pfad liefert 404 ohne Existenzbestätigung.
- [ ] Widerruf wirkt beim nächsten Request, ohne Abmelden und ohne Cache-Leerung.
- [ ] Fremdzugriffstests decken Query und Mutation ab.
- [ ] Die minimale Portalseite ist ehrlich nutzbar; keine toten Dashboardkarten.

## Rollback

Einladungen stoppen und Portal-Feature-Flag deaktivieren. Mitgliedschaften bleiben gespeichert; weil
es keinen Sitzungszustand gibt, endet der Zugang mit dem Flag sofort und vollständig. Der interne
Workspace bleibt unabhängig.
