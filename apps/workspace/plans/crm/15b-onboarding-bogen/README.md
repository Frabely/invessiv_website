# Ordner 15b — Onboarding-Bogen

> **Status:** offen · **Abhängigkeiten:** 12b, 13, 14, 15, 15a · **Aufwand:** 4–5 Tage · **Reviewziel:** 100–120 Dateien

> **Portal-Fundament (Neuzuschnitt 23.09.2026):** Seiten über `requirePortalActor(locale, customerId)`, Endpunkte über
> `withPortalActor`, jede Portal-Query über `portalAccessCondition`, jede Portal-Mutation über `portalCanOn` (alles
> aus Task 49). Eigene Portal-Permissions dieses Ordners, in `portal_standard` ergänzt: `portal.onboarding.read`, `portal.onboarding.submit` — firmenweites Modul, verlangt nach Einführung des Projektbezugs eine firmenweite Rolle.
> Navigation: „Onboarding“ (`/portal/[customerId]/onboarding`) in `PORTAL_NAV_ITEMS` mit `requiredPermission`. Negativtests zusätzlich für fehlende
> Portal-Permission.

> **Hinweis Neuplanung Ordner 08 (21.09.2026):** Die hier genannte Vorlage aus Task 12 ist zurückgestellt; die
> Aufgaben aus Ordner 08 sind Projektaufgaben mit vier Status.

## Ziel und Stand nach Merge

**Konkreter Task-Plan**

- [`44-bogen-datenmodell-und-absenden.md`](./44-bogen-datenmodell-und-absenden.md) — Fragenkatalog
  im Code, Tabellen, Entwurf, Feldantworten, Absenden.
- [`45-portal-formular-und-crm-ansicht.md`](./45-portal-formular-und-crm-ansicht.md) — mehrstufiges
  Portalformular mit Upload je Feld und interne Leseansicht mit Übernahmefunktion.

Nach dem Merge füllt der Kunde im Portal einen strukturierten Onboarding-Bogen aus: Texte direkt ins
Feld statt als Word-Dokument, Assets am zugehörigen Feld, Zwischenstand serverseitig gesichert. Intern
ist der Bogen vollständig lesbar, Feldtexte sind mit einem Klick übernehmbar.

## Warum das die Aufgabenliste nicht ersetzt

Die Kundenaufgaben aus Task 11 und die Vorlage aus Task 12 bleiben das Mahnwesen: Sie sagen, **was**
fehlt und bis wann. Der Bogen ist der **Inhalt**. Die Verzahnung — Absenden hakt die zugehörigen
Aufgaben ab — folgt in Ordner 15c, damit diese Einheit auf Formular und Daten fokussiert bleibt.

## Regeln

- Fragen liegen als typisierte Konstante im Code, nicht in der Datenbank. Kein Formularbaukasten.
- Jede Frage trägt Dictionary-Keys, keinen Text. Ein fehlender Sprachstand bricht den Test.
- Antworten sind relationale Zeilen (`field_key` plus Wert), kein `jsonb` und kein Array.
- Der Entwurf liegt **serverseitig**. Das ist eine bewusste Abweichung von der
  `localStorage`-Entscheidung der Feedbackrunden und in Task 44 begründet.
- Assets hängen über eine Verknüpfungstabelle am Feld; der Scope-CHECK aus Ordner 14 bleibt unberührt.
- Ein abgesendeter Bogen ist unveränderlich; das erneute Öffnen ist ein protokollierter interner Vorgang.

## Portal-Widget (aus Ordner 13)

Das Dashboard-Widget `onboarding` (volle Breite ganz oben, `openMode: dialog`) existiert seit Ordner 13 als Mock in der
Widget-Registry (`PORTAL_WIDGET_LAYOUT`). Dieser Ordner stellt es auf echte Daten um: Bogen-Fortschritt und Einstieg
„Weiter ausfüllen“, prominent beim ersten Login. Termin und Verschwinden nach Abschluss folgen in Ordner 15c. Keine
eigene Dashboard-Karte außerhalb der Registry.

## Merge-Gate

- [ ] Portal-Widget `onboarding` von Mock auf echte Daten umgestellt (Registry `mock: false` +
      `requiredPermission: portal.onboarding.read`); Fortschritt stammt aus derselben Berechnung wie das Formular.
- [ ] Katalogtest: jeder `labelKey`, `helpKey` und `choiceKey` existiert in DE und EN.
- [ ] `satisfies Record<OnboardingFormKey, OnboardingFormDefinition>` bricht bei fehlender Vorlage.
- [ ] Je Projekt und Vorlage existiert höchstens ein Entwurf (partieller Unique-Index, Test).
- [ ] Feldantwort speichert ohne vollständiges Neuladen; ein Verbindungsabbruch verliert höchstens
      die zuletzt getippte Änderung.
- [ ] Absenden ist atomar: Status, Zeitstempel und Activity werden gemeinsam geschrieben; die Outbox-Benachrichtigung wird erst in Ordner 20c ergänzt.
- [ ] Ein abgesendeter Bogen lässt sich über keinen Portalpfad mehr ändern (Negativtest).
- [ ] Pflichtfeld fehlt: Absenden wird mit Feldverweis abgelehnt, nicht mit einer Sammelmeldung.
- [ ] Cross-Customer-Negativtest mit echter Session für jeden neuen Portalendpunkt.
- [ ] Fortschritt in Portal und CRM stammt aus derselben Berechnung.

## Rollback

`portal.onboarding.*` aus `portal_standard` und eigenen Portalrollen nehmen und die Vorlage nicht mehr zuweisen. Tabellen sind additiv;
bereits abgesendete Bögen bleiben intern lesbar.
