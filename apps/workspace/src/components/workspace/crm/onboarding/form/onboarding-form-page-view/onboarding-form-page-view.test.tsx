// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import {
  getCrmOnboardingDictionary,
  getCrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import {
  blockFixture,
  fieldFixture,
} from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";
import { OnboardingFormPageView } from "./onboarding-form-page-view";

const mocks = vi.hoisted(() => ({ replace: vi.fn(), search: "" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: vi.fn() }),
  usePathname: () => "/de/crm/onboarding/f-1",
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock("@/client/crm/onboarding-form-api-service", () => ({
  onboardingFormApiService: { definitionApi: vi.fn() },
}));

const content = getCrmOnboardingDictionary("de");

function renderPage(
  templateTitle: string | null,
  form: Partial<OnboardingFormDto> = {},
) {
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
          answers: [],
          answerFiles: [],
          groupEntries: [],
          servicesConfirmedAt: null,
          ...form,
        } as unknown as OnboardingFormDto
      }
      locale="de"
      questionnaireContent={getCrmQuestionnaireDictionary("de")}
    />,
  );
}

describe("OnboardingFormPageView", () => {
  afterEach(() => {
    cleanup();
    mocks.search = "";
    mocks.replace.mockReset();
  });

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

  it("puts the tab into the URL when the answers are selected", () => {
    renderPage(null);

    fireEvent.click(
      screen.getByRole("tab", { name: content.form.tabs.answers }),
    );

    expect(mocks.replace).toHaveBeenCalledWith(
      "/de/crm/onboarding/f-1?tab=answers",
      { scroll: false },
    );
  });

  it("shows the answers of the customer read-only on the answers tab", () => {
    mocks.search = "tab=answers";
    renderPage(null, {
      blocks: [
        {
          position: 0,
          reviewStatus: OnboardingBlockReviewStatus.Pending,
          clarificationMode: null,
          reviewNote: null,
          reviewedByMemberId: null,
          reviewedAt: null,
          version: 1,
          block: blockFixture([
            fieldFixture("name", QuestionnaireFieldType.ShortText, {
              requirement: QuestionnaireFieldRequirement.Required,
              translations: { de: { label: "Firmenname", help: null } },
            }),
            fieldFixture("claim", QuestionnaireFieldType.ShortText, {
              requirement: QuestionnaireFieldRequirement.Required,
              translations: { de: { label: "Claim", help: null } },
            }),
          ]),
        },
      ],
      answers: [
        {
          fieldId: "f-name",
          groupEntryId: null,
          sortOrder: 0,
          value: "Nordlicht <b>GmbH</b>",
          choiceId: null,
        },
      ],
    });

    expect(
      screen.getByRole("tab", { name: content.form.tabs.answers }),
    ).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveTextContent("Unternehmen");
    expect(panel).toHaveTextContent("Nordlicht <b>GmbH</b>");
    expect(panel.querySelector("b")).toBeNull();
    expect(panel).toHaveTextContent(content.answers.read.unanswered);
    expect(panel).toHaveTextContent("1 von 2 Pflichtangaben");
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("explains the answers tab of a form without blocks", () => {
    mocks.search = "tab=answers";
    renderPage(null);

    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      content.answers.empty,
    );
  });
});
