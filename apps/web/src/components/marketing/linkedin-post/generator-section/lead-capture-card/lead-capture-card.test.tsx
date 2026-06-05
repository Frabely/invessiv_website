// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LinkedInPostGeneratorErrorCode } from "@/common/constants/generator/linkedin-post-generator-error-codes";
import type { linkedinPostDeliverService } from "@/client/linkedin-post/services/linkedin-post-deliver-service";
import { getLinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { LeadCaptureCard } from "./lead-capture-card";

const content = getLinkedInPostGeneratorContent("de").leadCapture;

afterEach(cleanup);

type Deliver = typeof linkedinPostDeliverService.deliverLinkedInPost;

function renderCard(overrides?: { deliver?: Deliver; deliveryToken?: string }) {
  const deliver: Deliver =
    overrides?.deliver ?? vi.fn<Deliver>().mockResolvedValue({ ok: true });
  const onIdentityChange = vi.fn();
  render(
    <LeadCaptureCard
      content={content}
      deliver={deliver}
      deliveryToken={
        "deliveryToken" in (overrides ?? {})
          ? overrides?.deliveryToken
          : "signed-token"
      }
      locale="de"
      onIdentityChange={onIdentityChange}
    />,
  );
  return { deliver, onIdentityChange };
}

function fillValidLead({ marketing = false } = {}) {
  fireEvent.change(screen.getByLabelText(content.displayName.label), {
    target: { value: "Moritz Hecht" },
  });
  fireEvent.change(screen.getByLabelText(content.email.label), {
    target: { value: "test@example.com" },
  });
  fireEvent.click(
    screen.getByRole("checkbox", { name: content.consentDelivery.label }),
  );
  if (marketing) {
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: new RegExp(content.consentMarketing.label),
      }),
    );
  }
}

function clickEmailAction() {
  fireEvent.click(screen.getByRole("button", { name: content.emailAction }));
}

describe("LeadCaptureCard", () => {
  it("blocks delivery until name, email and delivery consent are valid", () => {
    const { deliver } = renderCard();

    clickEmailAction();

    expect(screen.getByText(content.displayName.requiredError)).toBeTruthy();
    expect(screen.getByText(content.email.requiredError)).toBeTruthy();
    expect(
      screen.getByText(content.consentDelivery.requiredError),
    ).toBeTruthy();
    expect(deliver).not.toHaveBeenCalled();
  });

  it("requires the delivery consent even with a valid name and email", () => {
    const { deliver } = renderCard();

    fireEvent.change(screen.getByLabelText(content.displayName.label), {
      target: { value: "Moritz Hecht" },
    });
    fireEvent.change(screen.getByLabelText(content.email.label), {
      target: { value: "test@example.com" },
    });
    clickEmailAction();

    expect(
      screen.getByText(content.consentDelivery.requiredError),
    ).toBeTruthy();
    expect(deliver).not.toHaveBeenCalled();
  });

  it("delivers by email and lifts the identity once the lead form is valid", async () => {
    const { deliver, onIdentityChange } = renderCard();
    fillValidLead();

    clickEmailAction();

    await waitFor(() => expect(deliver).toHaveBeenCalledTimes(1));
    expect(deliver).toHaveBeenCalledWith(
      {
        consentDelivery: true,
        consentMarketing: false,
        deliveryToken: "signed-token",
        displayName: "Moritz Hecht",
        email: "test@example.com",
      },
      "de",
    );
    expect(onIdentityChange).toHaveBeenCalledWith({
      displayName: "Moritz Hecht",
      email: "test@example.com",
    });
    expect(await screen.findByText(content.deliver.success)).toBeTruthy();
  });

  it("forwards the optional marketing consent flag when checked", async () => {
    const { deliver } = renderCard();
    fillValidLead({ marketing: true });

    clickEmailAction();

    await waitFor(() => expect(deliver).toHaveBeenCalledTimes(1));
    expect(deliver).toHaveBeenCalledWith(
      expect.objectContaining({ consentMarketing: true }),
      "de",
    );
  });

  it("shows the rate-limited message when delivery is throttled", async () => {
    const deliver = vi.fn<Deliver>().mockResolvedValue({
      code: LinkedInPostGeneratorErrorCode.DeliveryRateLimited,
      ok: false,
    });
    renderCard({ deliver });
    fillValidLead();

    clickEmailAction();

    expect(
      await screen.findByText(content.deliver.errorRateLimited),
    ).toBeTruthy();
  });

  it("asks to regenerate when the deliver token has expired", async () => {
    const deliver = vi.fn<Deliver>().mockResolvedValue({
      code: LinkedInPostGeneratorErrorCode.DeliveryTokenExpired,
      ok: false,
    });
    renderCard({ deliver });
    fillValidLead();

    clickEmailAction();

    expect(await screen.findByText(content.deliver.errorExpired)).toBeTruthy();
  });

  it("falls back to a generic error when no delivery token is available", async () => {
    const { deliver } = renderCard({ deliveryToken: undefined });
    fillValidLead();

    clickEmailAction();

    expect(await screen.findByText(content.deliver.errorGeneric)).toBeTruthy();
    expect(deliver).not.toHaveBeenCalled();
  });
});
