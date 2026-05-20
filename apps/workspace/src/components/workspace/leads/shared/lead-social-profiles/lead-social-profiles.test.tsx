// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LeadSocialProfiles } from "./lead-social-profiles";

describe("LeadSocialProfiles", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders website, profile and phone links with accessible labels", () => {
    render(
      <LeadSocialProfiles
        emptyLabel="—"
        labels={{
          website: "Website öffnen",
          linkedin: "LinkedIn-Profil öffnen",
          instagram: "Instagram-Profil öffnen",
          youtube: "YouTube-Kanal öffnen",
          phone: "Anrufen",
        }}
        phone="+49 30 1234567"
        profiles={[
          {
            id: "social-1",
            platform: "linkedin",
            profileUrl: "https://linkedin.com/in/anna",
            normalizedUrl: "linkedin.com/in/anna",
          },
        ]}
        websiteUrl="https://anna.example.com"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Website öffnen" }),
    ).toHaveAttribute("href", "https://anna.example.com");
    expect(
      screen.getByRole("link", { name: "LinkedIn-Profil öffnen" }),
    ).toHaveAttribute("href", "https://linkedin.com/in/anna");
    expect(screen.getByRole("link", { name: "Anrufen" })).toHaveAttribute(
      "href",
      "tel:+49301234567",
    );
  });

  it("renders the empty label when no social data is available", () => {
    render(
      <LeadSocialProfiles
        emptyLabel="Kein Profil"
        labels={{
          website: "Website öffnen",
          linkedin: "LinkedIn-Profil öffnen",
          instagram: "Instagram-Profil öffnen",
          youtube: "YouTube-Kanal öffnen",
          phone: "Anrufen",
        }}
        phone={null}
        profiles={[]}
        websiteUrl={null}
      />,
    );

    expect(screen.getByText("Kein Profil")).toBeInTheDocument();
  });
});
