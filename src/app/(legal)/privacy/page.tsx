import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Privacy | Invessiv",
  description: "Datenschutzerklärung von Invessiv.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Datenschutz | Invessiv",
    description: "Datenschutzerklärung von Invessiv.",
    url: `${SITE_URL}/privacy`,
    locale: "de_DE",
    type: "website",
  },
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <h1>Datenschutzerklärung</h1>
      <p className="legal-lead">
        Stand: 25. Februar 2026. Diese Erklärung informiert über Art, Umfang und Zweck
        der Verarbeitung personenbezogener Daten auf dieser Website.
      </p>

      <section>
        <h2>1. Verantwortliche Stelle</h2>
        <p>
          Invessiv, Inhaber: Moritz Hecht
          <br />
          Frankenberger Straße 235, 09131 Chemnitz, Deutschland
          <br />
          E-Mail: <a href="mailto:hi@invessiv.de">hi@invessiv.de</a>
          <br />
          Telefon: <a href="tel:+4917012345678">+49 170 12345678</a>
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Rechtsform nach finaler Gewerbeanmeldung ergänzen]
        </p>
      </section>

      <section>
        <h2>2. Hosting und Server-Logfiles</h2>
        <p>
          Beim Aufruf der Website verarbeitet der Hosting-Provider technisch notwendige
          Verbindungsdaten (z. B. IP-Adresse, Zeitpunkt, User-Agent, Referrer,
          angeforderte Ressource) zur Sicherstellung des Betriebs und zur
          Missbrauchserkennung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO
          (berechtigtes Interesse an sicherem und stabilem Betrieb).
        </p>
        <p>Aktueller Hosting-Anbieter: Firebase.</p>
        <p className="legal-placeholder">
          [PLATZHALTER: Serverstandort/Region von Firebase ergänzen]
          <br />
          [PLATZHALTER: AVV/Vertrag zur Auftragsverarbeitung ergänzen]
          <br />
          [PLATZHALTER: Bei Wechsel auf IONOS Angaben aktualisieren]
        </p>
      </section>

      <section>
        <h2>3. Kontaktaufnahme</h2>
        <p>
          Wenn Sie uns per E-Mail oder telefonisch kontaktieren, verarbeiten wir Ihre
          Angaben zur Bearbeitung der Anfrage und für Anschlussfragen. Rechtsgrundlage ist
          Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) bzw. lit. f DSGVO.
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Speicherdauer für Kontaktanfragen final ergänzen, Vorschlag: 12 Monate]
        </p>
      </section>

      <section>
        <h2>4. Cookies und ähnliche Technologien</h2>
        <p>
          Diese Website setzt aktuell nur technisch erforderliche Funktionen ein.
          Tracking- oder Marketing-Cookies werden derzeit nicht aktiv eingesetzt.
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Falls später Analytics/Tracking aktiviert wird, Tool, Rechtsgrundlage und Consent-Logik ergänzen]
        </p>
      </section>

      <section>
        <h2>5. Empfänger und Drittlandübermittlung</h2>
        <p>
          Eine Weitergabe personenbezogener Daten erfolgt nur, wenn dies zur
          Vertragserfüllung notwendig ist, eine rechtliche Verpflichtung besteht oder Sie
          eingewilligt haben.
        </p>
        <p className="legal-placeholder">
          [PLATZHALTER: Liste konkreter Dienstleister inkl. Drittlandtransfer und SCC ergänzen]
        </p>
      </section>

      <section>
        <h2>6. Speicherdauer</h2>
        <p>
          Daten werden nur so lange gespeichert, wie es für die jeweiligen Zwecke
          erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
        </p>
      </section>

      <section>
        <h2>7. Ihre Rechte</h2>
        <p>
          Sie haben nach DSGVO insbesondere das Recht auf Auskunft, Berichtigung, Löschung,
          Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Zudem
          haben Sie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde.
        </p>
      </section>

      <section>
        <h2>8. Externe Links</h2>
        <p>
          Diese Website kann Links zu externen Seiten enthalten. Für Inhalte und
          Datenschutzpraktiken der verlinkten Seiten sind ausschließlich deren Betreiber
          verantwortlich.
        </p>
      </section>

      <section>
        <h2>9. Aktualisierung dieser Datenschutzerklärung</h2>
        <p>
          Wir passen diese Datenschutzerklärung an, sobald sich rechtliche Anforderungen
          oder unsere Datenverarbeitung ändern.
        </p>
      </section>
    </main>
  );
}
