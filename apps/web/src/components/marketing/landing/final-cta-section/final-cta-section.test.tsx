// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLandingFinalCtaContent } from "@/i18n/dictionaries/landing/final-cta";
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
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("submits quick contact with landing context and website in the message", async () => {
    render(
      <FinalCtaSection
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
        name: "Anfrage senden",
      }),
    );

    await waitFor(() => {
      expect(submitQuickContact).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "max@example.com",
          displayName: "Max Mustermann",
          kind: "quick_contact",
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
  });
});
