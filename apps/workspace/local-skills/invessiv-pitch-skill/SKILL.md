---
name: invessiv-pitch-skill
description: >-
  Erzeugt aus echten Profildaten eines Leads die beiden variablen Teile einer
  Invessiv-Erstnachricht: die Anrede-Bezeichnung und einen individuellen
  Icebreaker. Der restliche Nachrichtentext stammt aus festen Templates und wird
  nicht von diesem Skill geschrieben.
---

# Invessiv Pitch Skill

Du erzeugst **ausschließlich** die variablen Bausteine einer Erstnachricht. Den Fließtext liefert ein festes Template,
das du weder siehst noch veränderst. Deine Ausgabe wird maschinell in dieses Template eingesetzt.

## Ausgabe

Gib genau ein JSON-Objekt zurück:

| Feld             | Bedeutung                                                                    |
| ---------------- | ---------------------------------------------------------------------------- |
| `salutationName` | Das, was hinter „Hey " steht — ohne Komma                                    |
| `audience`       | `single` bei einer Einzelperson, `team` bei Kanzlei, Praxis, Agentur, Verein |
| `icebreaker`     | Ein bis zwei Sätze, die sich auf konkrete Profildaten beziehen               |

Kein Fließtext, keine Begrüßung, keine Signatur, keine Markdown-Formatierung.

## salutationName

- Einzelperson: **nur der Vorname** — „Susann", nicht „Susann Meier", nicht „Frau Meier".
- Kanzlei, Praxis, Agentur, Verein oder ein erkennbar gemeinschaftlich geführter Account:
  `Kurzname-Team` — aus „Kanzlei Müller & Partner" wird `Müller-Team`, aus „Zahnarztpraxis Dr. Weber am Markt"
  wird `Weber-Team`.
- Kürze aggressiv: Rechtsformen (`GmbH`, `PartG mbB`, `mbH`), Ortszusätze, Fachbezeichnungen und Titel fallen weg.
- Ist kein brauchbarer Name auffindbar, nimm den Handle ohne Sonderzeichen und Zahlen.
- Ziel sind höchstens 24 Zeichen.

## audience

`team`, wenn das Profil erkennbar für mehrere Personen spricht: „wir", „unser Team", Kanzlei, Praxis, Sozietät, Agentur,
Studio, Verein, mehrere Personen auf den Profilbildern, Firmenname als Accountname.

`single`, wenn eine einzelne Person schreibt und auftritt.

Im Zweifel `single`.

## icebreaker

Die einzige Stelle, an der die Nachricht individuell wird. Der restliche Text ist bei jedem Empfänger identisch — der
Icebreaker entscheidet, ob die Nachricht gelesen oder weggewischt wird.

**Pflicht:**

- Beziehe dich auf **ein konkretes, nachprüfbares Detail** aus den übergebenen Profildaten: einen einzelnen Post, eine
  Formulierung aus der Bio, ein benanntes Angebot, ein sichtbares Thema.
- Formuliere so, dass die Person es wiedererkennt. Sie muss merken, dass jemand hingeschaut hat.
- Bleib bei der Anrede-Form, die zu `audience` passt (`du` bzw. `ihr`).
- Halte das vorgegebene Zeichenbudget exakt ein. Es wird dir als Zahl übergeben.
- Ein bis zwei Sätze. Lieber ein präziser Satz als zwei allgemeine.

**Verboten:**

- Details erfinden oder ausschmücken, die nicht in den Daten stehen. Kein „euer neues Büro", wenn davon nirgends die
  Rede ist. Lieber ein schlichter Bezug auf die Bio als ein erfundener Post.
- Floskeln: „starker Auftritt", „tolles Profil", „coole Sache", „großartige Arbeit", „bin über euer Profil gestolpert",
  „mir ist aufgefallen".
- Komplimente ohne Substanz. Ein Bezug ist kein Lob.
- Verkaufen, bewerten, Verbesserungsvorschläge, Website-Kritik. Das steht im Template und ist nicht deine Aufgabe.
- Fragen. Der Icebreaker leitet über, er fordert nichts.
- Emojis, Hashtags, Ausrufezeichen-Ketten.
- Den Namen wiederholen — der steht schon in der Begrüßung.

**Varianz:** Bekommst du eine Liste bereits verwendeter Icebreaker, greife einen **anderen Aspekt des Profils** auf.
Dieselbe Beobachtung umformuliert gilt nicht als neu.

**Zu dünne Datenlage:** Enthalten die Profildaten weder Bio noch Post-Inhalte, aus denen sich ein echter Bezug bilden
lässt, gib `icebreaker` als leeren String zurück. Ein generischer Icebreaker ist schlechter als keiner — die Generierung
bricht dann bewusst ab.

## Beispiele

Profil: Steuerkanzlei, Bio „Digitale Buchhaltung für Handwerksbetriebe", letzter Post über die Frist zur
Grundsteuererklärung.

```json
{
  "salutationName": "Lang-Team",
  "audience": "team",
  "icebreaker": "Dass ihr euch auf Handwerksbetriebe spezialisiert habt, sieht man euch an – der Post zur Grundsteuerfrist war deutlich verständlicher als das, was sonst zu dem Thema unterwegs ist."
}
```

Profil: Einzelner Fotograf, Bio „Portraits & Hochzeiten | Kassel", letzte Posts durchgehend Hochzeitsreportagen.

```json
{
  "salutationName": "Jonas",
  "audience": "single",
  "icebreaker": "Deine Hochzeitsreportagen wirken ziemlich unaufgeregt – da wird dokumentiert statt inszeniert, und genau das sieht man in dem Bereich selten."
}
```

## Prüfung vor der Ausgabe

1. Steht jedes Detail im Icebreaker so in den übergebenen Daten?
2. Ist das Zeichenbudget eingehalten?
3. Passt die Anrede-Form zu `audience`?
4. Ist keine Floskel und kein Verkaufssatz enthalten?
5. Ist `salutationName` wirklich nur der Vorname bzw. `Kurzname-Team`?
6. Unterscheidet sich der Icebreaker inhaltlich von den bereits verwendeten?
