// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { LeadCaptureCard } from "./lead-capture-card";

const content = getLinkedInPostGeneratorContent("de").leadCapture;

afterEach(cleanup);

function renderCard() {
  const onDownload = vi.fn();
  const onIdentityChange = vi.fn();
  render(
    <LeadCaptureCard
      content={content}
      onDownload={onDownload}
      onIdentityChange={onIdentityChange}
    />,
  );
  return { onDownload, onIdentityChange };
}

function fillValidLead() {
  fireEvent.change(screen.getByLabelText(content.displayName.label), {
    target: { value: "Moritz Hecht" },
  });
  fireEvent.change(screen.getByLabelText(content.email.label), {
    target: { value: "test@example.com" },
  });
  fireEvent.click(
    screen.getByRole("checkbox", { name: content.consentDelivery.label }),
  );
}

describe("LeadCaptureCard", () => {
  it("blocks download until name, email and delivery consent are valid", () => {
    const { onDownload } = renderCard();

    fireEvent.click(
      screen.getByRole("button", { name: content.downloadAction }),
    );

    expect(screen.getByText(content.displayName.requiredError)).toBeTruthy();
    expect(screen.getByText(content.email.requiredError)).toBeTruthy();
    expect(
      screen.getByText(content.consentDelivery.requiredError),
    ).toBeTruthy();
    expect(onDownload).not.toHaveBeenCalled();
  });

  it("requires the delivery consent even with a valid name and email", () => {
    const { onDownload } = renderCard();

    fireEvent.change(screen.getByLabelText(content.displayName.label), {
      target: { value: "Moritz Hecht" },
    });
    fireEvent.change(screen.getByLabelText(content.email.label), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: content.downloadAction }),
    );

    expect(
      screen.getByText(content.consentDelivery.requiredError),
    ).toBeTruthy();
    expect(onDownload).not.toHaveBeenCalled();
  });

  it("downloads and lifts the identity once the lead form is valid", () => {
    const { onDownload, onIdentityChange } = renderCard();
    fillValidLead();

    fireEvent.click(
      screen.getByRole("button", { name: content.downloadAction }),
    );

    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(onIdentityChange).toHaveBeenCalledWith({
      displayName: "Moritz Hecht",
      email: "test@example.com",
    });
    expect(screen.getByText(content.success.download)).toBeTruthy();
  });

  it("treats the email action as coming soon without downloading", () => {
    const { onDownload, onIdentityChange } = renderCard();
    fillValidLead();

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(content.emailAction) }),
    );

    expect(onDownload).not.toHaveBeenCalled();
    expect(onIdentityChange).toHaveBeenCalledTimes(1);
    expect(screen.getByText(content.emailComingSoon)).toBeTruthy();
  });
});
