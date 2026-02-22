import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invessiv Datenschutz",
  description: "Datenschutzhinweise der Invessiv Website.",
};

export default function DatenschutzPage() {
  return (
    <main className="layout-shell">
      <section className="content-section">
        <h1>Datenschutz</h1>
        <p>
          Diese Seite ist ein Platzhalter fuer die finalen Datenschutzhinweise und wird
          mit den produktiven Tracking- und Verarbeitungsangaben erweitert.
        </p>
      </section>
    </main>
  );
}
