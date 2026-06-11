// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONTACT_REQUEST_KIND } from "@invessiv/common/constants/contact/contact-request-kind";
import { getLandingFinalCtaContent } from "@/i18n/dictionaries/landing/final-cta";
import { getLinkedInPostFinalCtaContent } from "@/i18n/dictionaries/linkedin-post/final-cta";
import { submitQuickContact } from "@/client/contact/services/contact-form-service";
import { FinalCtaSection } from "./final-cta-section";

const mockTrackConversionEvent = vi.fn();

vi.mock("@/client/contact/services/contact-form-service", () => ({
  submitQuickContact: vi
    .fn()
    .mockResolvedValue({ ok: true, requestId: "req_1" }),
}));

vi.mock("@/lib/analytics/conversion-events", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/analytics/conversion-events")>();

  return {
    ...actual,
    trackConversionEvent: (...args: unknown[]) =>
      mockTrackConversionEvent(...args),
  };
});

describe("FinalCtaSection", () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submits quick contact with landing context and website in the message", async () => {
    render(
      <FinalCtaSection
        analyticsLocation="landing_final_cta"
        formId="landing_final_cta"
        id="contact"
        locale="de"
        {...getLandingFinalCtaContent("de")}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /^Website/ }), {
      target: { value: "https://example.com" },
    });
    fireEvent.change(
      screen.getByRole("textbox", {
        name: /Was möchtest du mit der Landingpage erreichen/,
      }),
      {
        target: {
          value: "Ich möchte direkt eine neue Landingpage für mein Angebot.",
        },
      },
    );
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Ersteinschätzung anfragen",
      }),
    );

    await waitFor(() => {
      expect(submitQuickContact).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "max@example.com",
          displayName: "Max Mustermann",
          kind: CONTACT_REQUEST_KIND.QuickContact,
          locale: "de",
          message:
            "Landingpage-Anfrage\n\nWebsite: https://example.com\n\nIch möchte direkt eine neue Landingpage für mein Angebot.",
        }),
      );
    });

    expect(mockTrackConversionEvent).toHaveBeenCalledWith("form_start", {
      form_id: "landing_final_cta",
      location: "landing_final_cta",
      target: "form",
      variant: "primary",
    });
    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "form_submit_attempt",
      {
        form_id: "landing_final_cta",
        location: "landing_final_cta",
        target: "form",
        variant: "primary",
      },
    );
    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "lead_submit_success",
      {
        form_id: "landing_final_cta",
        location: "landing_final_cta",
        target: "form",
        variant: "primary",
      },
    );

    await waitFor(() => {
      expect(window.HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
      });
    });
  });

  it("submits the LinkedIn workflow CTA without rendering a website field", async () => {
    render(
      <FinalCtaSection
        analyticsLocation="linkedin_post_final_cta"
        formId="linkedin_post_final_cta"
        id="contact"
        locale="de"
        {...getLinkedInPostFinalCtaContent("de")}
      />,
    );

    expect(screen.queryByRole("textbox", { name: /^Website/ })).toBeNull();

    fireEvent.change(screen.getByRole("textbox", { name: /Name/ }), {
      target: { value: "Max Mustermann" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /E-Mail/ }), {
      target: { value: "max@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Workflow prüfen lassen",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Bitte ausfüllen.", { selector: "[role='alert']" }),
      ).toBeTruthy();
    });
    expect(submitQuickContact).not.toHaveBeenCalled();

    fireEvent.change(
      screen.getByRole("textbox", {
        name: /Wie entstehen deine Posts heute/,
      }),
      {
        target: {
          value:
            "Ich möchte jede Woche aus einem Thema einen LinkedIn-Post samt Bildidee vorbereiten.",
        },
      },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Workflow prüfen lassen",
      }),
    );

    await waitFor(() => {
      expect(submitQuickContact).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "max@example.com",
          displayName: "Max Mustermann",
          kind: CONTACT_REQUEST_KIND.QuickContact,
          locale: "de",
          message:
            "KI-Workflow-Anfrage\n\nIch möchte jede Woche aus einem Thema einen LinkedIn-Post samt Bildidee vorbereiten.",
        }),
      );
    });

    expect(mockTrackConversionEvent).toHaveBeenCalledWith("form_start", {
      form_id: "linkedin_post_final_cta",
      location: "linkedin_post_final_cta",
      target: "form",
      variant: "primary",
    });
    expect(mockTrackConversionEvent).toHaveBeenCalledWith(
      "lead_submit_success",
      {
        form_id: "linkedin_post_final_cta",
        location: "linkedin_post_final_cta",
        target: "form",
        variant: "primary",
      },
    );
  });
});
