# AGENTS.md — Umsetzung CRM & Kundenportal

Diese Datei gilt für die **Umsetzung des Plans** unter `apps/workspace/plans/crm/` — unabhängig
davon, in welchem Ordner der Code dabei entsteht. Sie ergänzt die Repo-Root `AGENTS.md` und die scoped Dateien
im Code: bei Widerspruch zu einer Regel am Code gewinnt die Datei am Code. Diese hier regelt den
**Prozess** und die Entscheidungen, die für dieses Vorhaben bereits gefallen sind.

Sie ist temporär. Ist der Plan abgeschlossen, wird sie entfernt.

## Zweck

Der Plan umfasst 34 Tasks in 16 Merge-Einheiten und rund 39 Personentage. Die Entscheidungen dazu
stecken verteilt in 34 Task-Dateien und 16 Ordner-READMEs. Über so viele Sessions driftet eine
Umsetzung: Migrationsnummern werden blind aus dem Plan übernommen, ein Sicherheitsfilter landet aus
Bequemlichkeit im Rendering statt in der Abfrage, eine Planentscheidung wird stillschweigend anders
gebaut.

Die Regeln unten sind die Punkte, bei denen genau das teuer wäre.

## Einstieg

`00-entscheidungen.md` ist die Gesamtübersicht: geklärte Entscheidungen, Datenmodell, Rechtekonzept,
Merge-Einheiten mit Status, Migrationsplan, bewusst Zurückgestelltes.
`core-features.md` ist der Funktionsüberblick in Prosa.

Die Ordner `01-*` bis `16-*` sind die Merge-Einheiten in Reihenfolge. Jeder enthält eine `README.md`
(Ziel, Tasks, Review-Umfang, Merge-Gate) und die Task-Dateien.

---

## A · Arbeitsweise

1. **Ordnerweise.** Ein Ordner = ein PR auf `feat/crm-<ordner-slug>` = ein Merge. Die einzelnen Tasks
   darin sind Commits. Kein Ordner startet, bevor der vorherige grün in `master` ist.

2. **Einstieg immer über die README.** Jede Session liest zuerst die `README.md` des aktuellen
   Ordners und die Task-Datei, an der gearbeitet wird — erst dann Code. Ohne diesen Schritt fehlen
   die Regeln aus dieser Datei im Context, weil sie nicht projektweit geladen wird.

3. **Ordnernummer ≠ Task-Nummer.** Die Ordnernummer ist die Merge-Reihenfolge, die Task-Nummer die
   Identität: Task 08 heißt überall Task 08 und liegt in Ordner 04. Querverweise im Plan nennen
   immer die Task-Nummer.

4. **Das Merge-Gate ist verbindlich.** Jeder Punkt der Checkliste in der Ordner-README wird
   abgearbeitet, nicht überflogen. Was nicht erfüllt ist, wird im PR ausdrücklich benannt — nicht
   weggelassen.

5. **Status pflegen.** Beim Merge eines Ordners wird die Status-Spalte in der
   Merge-Einheiten-Tabelle in `00-entscheidungen.md` gesetzt. Eine frische Session muss dort ablesen
   können, wo es weitergeht.

6. **Keine stillschweigende Abweichung.** Wer eine Planentscheidung anders bauen will als
   beschrieben, fragt vorher. Danach entweder den Plan ändern oder nach dem Architektur-Gate der
   Root-`AGENTS.md` dokumentiert verschieben: Stelle mit Dateipfad, Regelbezug, Risiko und nächstem
   Schritt.

7. **Kein Auto-Commit.** Änderungen bleiben unkommittiert im Working Tree. Review und Commit macht
   der Nutzer.

## B · Migrationen

8. **Nummer im Repository prüfen**, nie aus dem Plan übernehmen: höchste bestehende plus eins. Die
   Nummern in den Task-Dateien sind Planwerte und folgen der Merge-Reihenfolge der Ordner, nicht der
   Task-Reihenfolge.

9. **Additiv.** Kein `DROP`, kein Umbenennen, kein `NOT NULL` auf eine bestehende befüllte Spalte,
   CHECK-Constraints nur erweitern und nie verengen. Rückbau erst, wenn der letzte Leser weg ist.

10. **Idempotent.** `CREATE ... IF NOT EXISTS`, `--> statement-breakpoint` zwischen den Statements,
    ein zweiter Lauf ist folgenlos. `pnpm db:migrate:dev` und `pnpm db:smoke:dev` müssen grün sein.

11. **Drizzle-Modell deckungsgleich** zur Migration — Spaltennamen, Typen und Constraints. Das ist
    ein ausdrücklicher Review-Punkt im PR, kein Nebenbei.

12. **Nachgezogene Fremdschlüssel nicht vergessen.** Zwei Spalten entstehen, bevor ihre Zieltabelle
    existiert, und bekommen den Fremdschlüssel später: `activities.project_id` in Task 09,
    `files.submission_id` in Task 22.

## C · Harte Sicherheitsgrenzen

Diese Regeln werden nie „für den Moment" aufgeweicht. Wer sie nicht einhalten kann, hört auf und
fragt nach.

13. **Portal-Handler nehmen keine `customerId` aus der Anfrage.** Sie kommt ausschließlich aus der
    Sitzung. Die Signatur muss das Gegenteil unmöglich machen — ein Check, den man vergessen kann,
    genügt nicht.

14. **Getrennte Codepfade.** Portal-Handler liegen unter `src/server/portal/`, niemals unter
    `src/server/workspace/`. Kein Handler wird von beiden Welten benutzt, auch nicht mit einem
    Parameter, der entscheidet, wer gerade fragt.

15. **Sichtbarkeitsfilter in die `WHERE`-Klausel**, nie ins Rendering. Gilt für
    `visible_to_customer` an Aufgaben, Dateien und Zeitbuchungen: die Abfrage darf fremde Zeilen
    nicht zurückgeben können.

16. **Fremdzugriff antwortet 404**, nicht 403 — keine Existenzbestätigung für Daten, die dem
    Anfragenden nicht gehören.

17. **Zugangsdaten haben keinen Portal-Endpunkt.** Klartext verlässt den Server nur über den
    Reveal-Pfad, für genau einen Datensatz, hinter `Permission.CredentialsReveal`, protokolliert
    **ohne** den Wert. Der Listen-Handler entschlüsselt gar nicht.

18. **Inhalte von außen sind Text.** Freitext aus Einreichungen, Chatnachrichten und Mailinhalte
    werden nie als HTML oder Markdown gerendert oder versendet.

19. **Storage-Objekte explizit löschen.** Postgres kann keine Blobs entfernen: ein Cascade löscht
    die Zeile und lässt die Datei liegen — danach ist ihre Zuordnung verloren. Jeder Löschpfad für
    Kunde oder Projekt räumt die Objekte über den Storage-Adapter ab.

20. **E2E-Pflicht für die Portal-Grenze.** Die Ordner 08, 10 und 12 brauchen je einen
    Playwright-Test, der mit echten Sessions belegt: Portalnutzer erreicht den internen Bereich
    nicht, interner Nutzer das Portal nicht, kein Kunde die Daten eines anderen.

## D · Bestandscode

21. **Umzüge beweisen sich über Bestandstests.** Ordner 01 (Tasks 01a, 02a) und Ordner 07 (Task 19)
    fassen bestehenden Code an. Der Nachweis ist immer derselbe: _die bestehenden Tests bleiben
    inhaltlich unverändert und grün_, angepasst wird ausschließlich der Importpfad. Wird eine
    Erwartung geändert, ist das ein Verhaltensbruch und gehört in die Diskussion, nicht in den PR.

22. **`lead_status` bleibt unangetastet** — auch nicht „nur schnell" um einen Wert erweitert. Der
    Marker für konvertierte Leads ist `leads.customer_id IS NOT NULL`. Die CHECK-Constraint dieser
    Spalte wurde bereits viermal migriert; das reicht.

23. **Wiederverwenden statt nachbauen.** Vor jedem neuen Baustein die Tabelle „Wiederverwendete
    Muster" in `00-entscheidungen.md` prüfen. Vieles existiert fertig und getestet im Leads-Bereich.

## E · Architektur im Plan-Kontext

Projektregeln, die bei diesem Vorhaben besonders oft greifen. Erinnerung, kein Ersatz für die
Root-`AGENTS.md`.

24. **Export entscheidet über den Ort.** Sobald ein Typ, eine Konstante oder ein Pattern exportiert
    wird, wandert es vorher nach `common` (`contracts/`, `constants/`, `defaults/`, `patterns/`).
    String-Unions als Const-Objekt plus abgeleiteter Type, kein `enum`.

25. **Keine Server Actions.** Der Schreibpfad ist Client-`fetch` → Route Handler → Command-Handler.

26. **Handler liefern Result-Unions und werfen nicht.** Die Route mappt Fehlercodes auf HTTP über
    eine nicht-exportierte Message-Map. Statuscodes aus `HttpResponseCode`, nie nackte Zahlen.

27. **URL-State statt React-State** für Listen, Filter, Sortierung, Seiten, Mehrfachauswahl und
    Panel-Selektion.

28. **Texte nur aus Dictionaries**, DE und EN immer parallel gepflegt. Keine Inline-Strings, keine
    `locale === "de" ? … : …`-Branches. Von der Locale ableitbare Werte gehören nicht ins Dictionary,
    sondern als `Record<Locale, …>` nach `packages/common/src/constants/i18n/`.

29. **Pfade nur aus `SITE_ROUTES`** und `createLocalePathname`, nie aus String-Literalen
    zusammengebaut. Endpunkte über `WorkspaceApiEndpoint`, keine URL-Literale im Client.

30. **Private Seiten** setzen `robots: noindex/nofollow/nocache` und `export const dynamic =
"force-dynamic"`. Das gilt für den internen Bereich **und** für alle Portal-Seiten.

31. **Co-located CSS-Module.** Kein Inline-Styling, keine neuen globalen Komponentenklassen, Farben
    nur über bestehende Theme-Tokens. Zustände über `data-*`-Attribute.

## F · Definition of Done je Task

32. **Seed mitwachsen lassen.** Jeder Ordner, der neues Schema anlegt, erweitert ein
    `db:seed:crm`-Skript (Muster: `db:seed:leads`) um realistische Beispieldaten. Das Skript bleibt
    optional aufrufbar, damit Empty-States weiterhin prüfbar sind.

33. **Jede neue Liste und Sektion hat einen Empty-State**, der erklärt, wofür der Bereich gedacht
    ist — nicht nur „keine Daten". Bei Filtern sind „noch nichts angelegt" und „keine Treffer" zwei
    unterscheidbare Zustände.

34. **Deploy-Sicherheit durchgegangen.** Die drei Fragen aus der Task-Datei sind beantwortet: Was
    ist nach dem Merge live sichtbar, warum bricht nichts Bestehendes, was fehlt noch und wie ist es
    abgesichert. Kein toter Button, keine Route ins Leere, kein Verweis auf Unfertiges.

35. **Grün vor dem PR:** `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`,
    `pnpm build:workspace`. Bei Änderungen in `apps/web` zusätzlich `pnpm build:web`.
