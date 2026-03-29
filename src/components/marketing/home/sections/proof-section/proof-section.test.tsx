// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProofSection } from "./proof-section";

describe("ProofSection", () => {
  it("renders two review cards with google references and external links", () => {
    render(
      <ProofSection
        cta={{ href: "https://www.google.com/maps", label: "Profil öffnen" }}
        description="Beispielhafte Referenz auf Google-Bewertungen."
        eyebrow="Google Business"
        id="proof"
        projectKicker="Projektbeispiel"
        projectLinkLabel="Beispiel ansehen"
        ratingAriaLabel="5 von 5 Sternen"
        reviewLinkLabel="Bei Google ansehen"
        reviews={[
          {
            authorName: "Name folgt",
            context: "Projektstart",
            excerpt: "Sehr strukturierter Ablauf.",
            profileImageSrc: "/blank-profile-picture.svg",
            projectHref: "/services/02-websites-screen-no-stand.png",
            projectPreviewAlt: "Website Hero",
            projectPreviewSrc: "/services/02-websites-screen-no-stand.png",
            projectTitle: "Beispiel: Hero einer Website",
            reviewHref: "https://www.google.com/maps",
            sourceLabel: "Quelle: Google Bewertung",
          },
          {
            authorName: "Name folgt",
            context: "Ergebnis",
            excerpt: "Klare Kommunikation und schnelles Feedback.",
            profileImageSrc: "/blank-profile-picture.svg",
            projectHref: "/services/03-prozess-tools-gears.png",
            projectPreviewAlt: "Dashboard",
            projectPreviewSrc: "/services/03-prozess-tools-gears.png",
            projectTitle: "Beispiel: Prozess-Dashboard",
            reviewHref: "https://www.google.com/maps",
            sourceLabel: "Quelle: Google Bewertung",
          },
        ]}
        title="Echte Rückmeldungen sollen direkt auf Google nachvollziehbar sein."
        trustNote="Beispieltexte werden später ersetzt."
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Echte Rückmeldungen sollen direkt auf Google nachvollziehbar sein.",
      }),
    ).toBeTruthy();
    expect(screen.getAllByText("Quelle: Google Bewertung")).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: "Bei Google ansehen" }),
    ).toHaveLength(2);
    expect(screen.getAllByText("Beispiel ansehen")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Profil öffnen" })).toBeTruthy();
  });
});
