# Ordner 12b — Portalzugang und Mehrfirmenzugriff

> **Status:** offen · **Abhängigkeiten:** 12a · **Aufwand:** 3–4 Tage · **Reviewziel:** 60–80 Dateien

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`20-portal-zugang.md`](./20-portal-zugang.md) — Einladung mit Portalrollen, Einlösung, Firmenwechsel, Widerruf,
  Rollenpflege je Kontakt, Portalrollen in den Einstellungen und Portalvorschau.

Kundenkontakte können sicher eingeladen werden, sich mit eigenem Clerk-Login anmelden, zwischen berechtigten Firmen
wechseln und den Zugang sofort verlieren. Jeder Kontakt hat eigene Portalrollen. Nach Merge ist eine minimale, aber
ehrlich nutzbare Portalseite mit Firmenname, Firmenwechsler und Abmelden aktiv; fachliche Module folgen ab Ordner 13.
Das Flag `FeatureFlag.Portal` wird mit diesem Ordner eingeschaltet. Der Flag-Mechanismus selbst
(`isFeatureEnabled(FeatureFlag.Portal)` an jedem Gate) bleibt danach als Kill-Switch bestehen — seine Entfernung ist
kein Teil dieses oder des folgenden Ordners, sondern ein eigener, bewusst später angesetzter Cleanup-Task, erst wenn
das Portal (ab Ordner 13) produktiv stabil gelaufen ist.

## Einladung und Identität

- Einladung bindet genau eine Personenzuordnung des Kunden und die gewählten Portalrollen; gespeichert werden nur
  Tokenhash, Ablauf, Ersteller und Status.
- **Kein Mailversand in diesem Ordner.** Der Einladungslink wird nach dem Anlegen einmalig im Dialog angezeigt und
  ist kopierbar; der Mitarbeiter gibt ihn weiter. Der automatische Versand über die Outbox folgt in Ordner 20c; die
  Kopierfunktion bleibt danach als Rückfall erhalten.
- Token sieben Tage gültig, einmal nutzbar, bei Widerruf oder erneuter Einladung sofort ungültig.
- Eine Mitgliedschaft entsteht ausschließlich durch Einlösen eines Tokens in einer bestehenden Clerk-Sitzung. Ohne
  Konto führt der Link zu Sign-up, mit Konto zu Sign-in — danach derselbe Redeem-Pfad. Kein E-Mail-Abgleich.
- Die zweite Firma verlangt eine eigene Einladung und Einlösung.
- Clerk steht vor dem Merge auf „Restricted“; öffentliche Selbstregistrierung führt nie zu Zugriff.
- Interne Mitarbeiter dürfen eingeladen werden. Sie erreichen das Portal ausschließlich über eine eigene, eingelöste
  Einladung — die interne Mitgliedschaft allein gewährt nichts.

## Rollen je Kontakt

- Portalrollen werden in den Einstellungen im Realm „Portal“ definiert (Recht `roles.manage`), mit denselben
  Rollendialogen wie Mitarbeiterrollen und ausschließlich Portal-Permissions.
- Beim Einladen und später an jeder Mitgliedschaft wählt ein Mitarbeiter mit `portal.manage` die Rollen des Kontakts;
  Vorgabe ist `portal_standard`. Kontakte derselben Firma dürfen verschiedene Rollen haben.
- Rollenänderungen wirken beim nächsten Request, weil der `PortalActor` je Anfrage neu aufgelöst wird.

## Merge-Gate

- [ ] Keine Mitgliedschaft entsteht ohne eingelösten Token; E-Mail-Gleichheit verbindet nichts.
- [ ] Token ist gehasht, abgelaufen/einmalig und nicht in Logs, Activities, Security-Events oder Analytics; der
      Klartext erscheint genau einmal in der Antwort an den Einladenden.
- [ ] Paralleles Einlösen desselben Tokens erzeugt genau eine Mitgliedschaft.
- [ ] Nach dem Einlösen trägt die Mitgliedschaft exakt die bei der Einladung gewählten Portalrollen.
- [ ] Zwei Kontakte derselben Firma mit unterschiedlichen Rollen sehen nur die Navigation und Endpunkte ihrer Rechte.
- [ ] Rollenänderung und Widerruf wirken beim nächsten Request, ohne Abmelden und ohne Cache-Leerung.
- [ ] Workspace-Rollen sind im Portal-Rollenpicker nicht wählbar und umgekehrt.
- [ ] Einladen ohne bestätigte Portalvorschau wird abgelehnt.
- [ ] Die Kundenlisten-Query kann „hat Portalzugang“ effizient als Grundlage für die spätere Facette in Ordner 22a
      liefern; eine vorgezogene Filter-UI entsteht nicht.
- [ ] Fremdzugriffstests decken Query und Mutation ab, auch für `portal.manage` gebunden an einen anderen Kunden.
- [ ] Die minimale Portalseite ist ehrlich nutzbar; keine toten Dashboardkarten.
- [ ] Clerk „Restricted“ im PR bestätigt.

## Rollback

Einladungen stoppen und `FeatureFlag.Portal` ausschalten. Mitgliedschaften bleiben gespeichert; weil es keinen
Sitzungszustand gibt, endet der Zugang mit dem Flag sofort und vollständig. Der interne Workspace bleibt unabhängig.
