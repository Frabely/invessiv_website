import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Terms",
  description: "Allgemeine Geschäftsbedingungen von Invessiv.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "AGB | Invessiv",
    description: "Allgemeine Geschäftsbedingungen von Invessiv.",
    url: `${SITE_URL}/terms`,
    locale: "de_DE",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <h1>Allgemeine Geschäftsbedingungen (AGB)</h1>
      <p className="legal-lead">
        Stand: 25. Februar 2026. Diese AGB gelten für Leistungen von Invessiv im
        Bereich Website-Erstellung, Website-Optimierung und digitale Prozesslösungen.
      </p>

      <section>
        <h2>1. Anbieter</h2>
        <p>
          Vertragspartner ist Invessiv, vertreten durch Moritz Hecht,
          Frankenberger Straße 235, 09131 Chemnitz, Deutschland.
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Falls eine abweichende Firmierung/Rechtsform eingetragen wird, hier aktualisieren]
        </p>
      </section>

      <section>
        <h2>2. Geltungsbereich</h2>
        <p>
          Diese AGB gelten für alle Angebote, Leistungen und Verträge zwischen Invessiv
          und Unternehmern i. S. d. § 14 BGB, sofern nicht ausdrücklich etwas anderes
          schriftlich vereinbart wurde.
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Falls Endkunden (B2C) direkt bedient werden, Verbraucher-Regelungen ergänzen]
        </p>
      </section>

      <section>
        <h2>3. Leistungen</h2>
        <p>
          Art und Umfang der Leistung ergeben sich aus Angebot, Leistungsbeschreibung
          und ggf. Projektbriefing. Änderungen des Scopes bedürfen einer gesonderten
          Abstimmung.
        </p>
      </section>

      <section>
        <h2>4. Mitwirkungspflichten</h2>
        <p>
          Der Auftraggeber stellt Inhalte, Zugänge, Freigaben und sonstige erforderliche
          Informationen rechtzeitig bereit. Verzögerungen durch fehlende Mitwirkung können
          den Lieferzeitraum verschieben.
        </p>
      </section>

      <section>
        <h2>5. Vergütung und Zahlungsbedingungen</h2>
        <p>
          Preise ergeben sich aus dem individuellen Angebot. Rechnungen sind ohne Abzug
          innerhalb von 14 Tagen fällig.
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Falls Anzahlungen/Abschläge vorgesehen sind, Regelung ergänzen]
        </p>
      </section>

      <section>
        <h2>6. Abnahme</h2>
        <p>
          Nach Fertigstellung erhält der Auftraggeber die Leistung zur Prüfung. Erfolgt
          innerhalb von 7 Werktagen keine begründete Mängelanzeige, gilt die Leistung
          als abgenommen.
        </p>
      </section>

      <section>
        <h2>7. Nutzungsrechte</h2>
        <p>
          Mit vollständiger Zahlung erhält der Auftraggeber die vereinbarten
          Nutzungsrechte an den gelieferten Ergebnissen im vertraglich definierten Umfang.
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Umfang der Nutzungsrechte (einfach/ausschließlich, zeitlich/räumlich) final definieren]
        </p>
      </section>

      <section>
        <h2>8. Gewährleistung und Haftung</h2>
        <p>
          Es gelten die gesetzlichen Gewährleistungsrechte. Für Schäden haften wir nur
          bei Vorsatz und grober Fahrlässigkeit, außer bei Verletzung von Leben, Körper
          oder Gesundheit.
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Haftungsobergrenze und Kardinalpflichten juristisch finalisieren]
        </p>
      </section>

      <section>
        <h2>9. Vertraulichkeit</h2>
        <p>
          Beide Parteien verpflichten sich, vertrauliche Informationen der jeweils anderen
          Partei nicht unbefugt an Dritte weiterzugeben.
        </p>
      </section>

      <section>
        <h2>10. Schlussbestimmungen</h2>
        <p>
          Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Gerichtsstand-Regelung juristisch passend ergänzen]
          <br />
          [PLATZHALTER: Salvatorische Klausel juristisch ergänzen]
        </p>
      </section>
    </main>
  );
}
