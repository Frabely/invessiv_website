/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthClerkPage } from "./auth-clerk-page";

describe("AuthClerkPage", () => {
  it("renders auth copy, Clerk content, and the alternate auth link", () => {
    render(
      <AuthClerkPage
        content={{
          headline: "Account erstellen",
          subline: "Lege einen neuen Account an.",
          footer: {
            promptText: "Schon registriert?",
            linkText: "Zur Anmeldung",
          },
        }}
        footerHref="/de/sign-in"
      >
        <div data-testid="clerk-slot" />
      </AuthClerkPage>,
    );

    expect(
      screen.getByRole("heading", { name: "Account erstellen" }),
    ).toBeTruthy();
    expect(screen.getByText("Lege einen neuen Account an.")).toBeTruthy();
    expect(screen.getByTestId("clerk-slot")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Zur Anmeldung" }).getAttribute("href"),
    ).toBe("/de/sign-in");
  });
});
