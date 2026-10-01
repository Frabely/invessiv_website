// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import {
  getCrmFilesDictionary,
  getCrmOnboardingDictionary,
  getCrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import {
  blockFixture,
  fieldFixture,
} from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";
import { OnboardingFormPageView } from "./onboarding-form-page-view";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  search: "",
  getDownloadUrl: vi.fn(),
}));

vi.mock("@/client/crm/files-api-service", () => ({
  filesApiService: {
    getDownloadUrl: mocks.getDownloadUrl,
    readText: vi.fn(),
    downloadArchive: vi.fn(),
  },
}));

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
          services: [],
          servicesConfirmedAt: null,
          servicesNote: null,
          customerId: "c-1",
          ...form,
        } as unknown as OnboardingFormDto
      }
      filesContent={getCrmFilesDictionary("de")}
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

  it("lets the team download a file the customer attached", () => {
    mocks.search = "tab=answers";
    mocks.getDownloadUrl.mockResolvedValue({
      ok: false,
      code: "FILE_NOT_FOUND",
    });
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
            fieldFixture("logo", QuestionnaireFieldType.Files, {
              translations: { de: { label: "Logo", help: null } },
            }),
          ]),
        },
      ],
      answerFiles: [
        {
          id: "link-1",
          fieldId: "f-logo",
          groupEntryId: null,
          position: 0,
          file: {
            id: "file-1",
            displayName: "logo.png",
            assetKind: AssetKind.Image,
            source: FileSource.Upload,
            extension: "png",
            sizeBytes: 2_048,
            url: null,
            note: null,
            createdAt: "2026-10-01T10:00:00.000Z",
          },
        },
      ],
    });

    expect(
      screen.getByRole("list", { name: "Dateien zu „Logo“" }),
    ).toHaveTextContent("logo.png");
    fireEvent.click(
      screen.getByRole("button", { name: /logo\.png herunterladen/ }),
    );
    expect(mocks.getDownloadUrl).toHaveBeenCalledWith("file-1", "attachment");
  });

  it("explains the answers tab of a form without blocks", () => {
    mocks.search = "tab=answers";
    renderPage(null);

    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      content.answers.empty,
    );
  });
});
