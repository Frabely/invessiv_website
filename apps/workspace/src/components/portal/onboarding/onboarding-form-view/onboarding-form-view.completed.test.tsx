// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import {
  portalOnboardingAnswer as answer,
  portalOnboardingBlock as block,
  portalOnboardingField as field,
  portalOnboardingForm,
} from "@/components/shared/onboarding/testing/portal-onboarding-form-fixture";
import {
  getPortalFilesDictionary,
  getPortalOnboardingDictionary,
} from "@/i18n/dictionaries/portal";
import { OnboardingFormView } from "./onboarding-form-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/en/portal/customer-1/onboarding/form-1",
  useSearchParams: () => new URLSearchParams(),
}));

const content = getPortalOnboardingDictionary("en");
const texts = content.states.completed;
const CHAT = "/en/portal/customer-1?chat=open";
const FILES = "/en/portal/customer-1/files";
const COMPLETED = portalOnboardingForm(
  [block("Company", [field("Name")]), block("Brand", [field("Claim")])],
  {
    status: OnboardingFormStatus.Completed,
    submittedAt: "2026-10-01T10:00:00.000Z",
    completedAt: "2026-10-05T10:00:00.000Z",
    answers: [answer("Name", { value: "Nordlicht" })],
    // A stale permission must not bring the form back: nothing is editable once completed.
    editableBlockIds: [],
  },
);

function renderView(
  links: { chatHref?: string | null; filesHref?: string | null } = {},
) {
  return render(
    <OnboardingFormView
      backHref="/en/portal/customer-1"
      call={null}
      canUpload
      chatHref={links.chatHref ?? null}
      cockpitHref={null}
      content={content}
      customerId="customer-1"
      filesContent={getPortalFilesDictionary("en")}
      filesHref={links.filesHref ?? null}
      form={COMPLETED}
      locale="en"
    />,
  );
}

describe("OnboardingFormView after completion", () => {
  afterEach(cleanup);

  it("says when the onboarding was completed and what it is now", () => {
    renderView();

    expect(
      screen.getByRole("heading", { name: "Completed on Oct 5, 2026" }),
    ).toBeVisible();
    expect(screen.getByText(texts.description)).toBeVisible();
    expect(screen.getByText(texts.more)).toBeVisible();
  });

  it("shows the answers read-only without any way to write", () => {
    renderView();

    expect(screen.getByText("Nordlicht")).toBeVisible();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: content.submit.action })).toBe(
      null,
    );
    expect(screen.queryByText(content.call.heading)).toBeNull();
  });

  it("links to files and chat only for a contact who may open them", () => {
    renderView({ chatHref: CHAT, filesHref: FILES });
    expect(screen.getByRole("link", { name: texts.filesLink })).toHaveAttribute(
      "href",
      FILES,
    );
    expect(screen.getByRole("link", { name: texts.chatLink })).toHaveAttribute(
      "href",
      CHAT,
    );
    cleanup();

    renderView();
    expect(screen.queryByRole("link", { name: texts.filesLink })).toBeNull();
    expect(screen.queryByRole("link", { name: texts.chatLink })).toBeNull();
  });
});
