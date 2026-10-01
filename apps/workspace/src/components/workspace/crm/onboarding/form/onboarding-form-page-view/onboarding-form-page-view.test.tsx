// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import {
  getCrmOnboardingDictionary,
  getCrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { OnboardingFormPageView } from "./onboarding-form-page-view";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/de/crm/onboarding/f-1",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/client/crm/onboarding-form-api-service", () => ({
  onboardingFormApiService: { definitionApi: vi.fn() },
}));

const content = getCrmOnboardingDictionary("de");

function renderPage(templateTitle: string | null) {
  render(
    <OnboardingFormPageView
      backHref="/de/crm?cockpit=c-1&project=p-1"
      canWrite
      catalogBlocks={[]}
      content={content}
      context={{
        customerId: "c-1",
        customerName: "Nordlicht Coaching",
        projectId: "p-1",
        projectTitle: "Website-Relaunch",
        templateTitle,
      }}
      fixedChoiceLabels={{
        de: { yes: "Ja", no: "Nein" },
        en: { yes: "Yes", no: "No" },
      }}
      form={
        {
          id: "f-1",
          status: OnboardingFormStatus.Draft,
          version: 1,
          blocks: [],
        } as unknown as OnboardingFormDto
      }
      locale="de"
      questionnaireContent={getCrmQuestionnaireDictionary("de")}
    />,
  );
}

describe("OnboardingFormPageView", () => {
  afterEach(cleanup);

  it("names project, customer, template and status in the head", () => {
    renderPage("Landingpage kompakt");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Onboarding: Website-Relaunch",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nordlicht Coaching")).toBeInTheDocument();
    expect(screen.getByText("Landingpage kompakt")).toBeInTheDocument();
    expect(screen.getByText(content.status.draft)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.form.back }),
    ).toHaveAttribute("href", "/de/crm?cockpit=c-1&project=p-1");
  });

  it("shows the structure as the selected tab and says when no template was used", () => {
    renderPage(null);

    expect(
      screen.getByRole("tab", { name: content.form.tabs.structure }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      content.structure.blocks.empty,
    );
    expect(screen.getByText(content.form.templateNone)).toBeInTheDocument();
  });
});
