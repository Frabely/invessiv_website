// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireCatalogStatus } from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import type { ProjectOnboardingDto } from "@invessiv/common/contracts/crm/onboarding/project-onboarding.dto";
import type { OnboardingViewModel } from "@/common/contracts/crm/onboarding/onboarding-view-model";
import {
  getCrmOnboardingDictionary,
  getCrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { ProjectOnboardingSection } from "./project-onboarding-section";

const navigation = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
const api = vi.hoisted(() => ({ start: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));
vi.mock("@/client/crm/onboarding-form-api-service", () => ({
  onboardingFormApiService: api,
}));

const content = getCrmOnboardingDictionary("de");
const text = content.project;

function state(
  overrides: Partial<ProjectOnboardingDto> = {},
): ProjectOnboardingDto {
  return {
    projectId: "p-1",
    form: null,
    review: null,
    canStart: true,
    projectEligible: true,
    prefillAvailable: false,
    ...overrides,
  };
}

function renderSection(overrides: Partial<OnboardingViewModel> = {}) {
  const viewModel: OnboardingViewModel = {
    projectId: "p-1",
    state: state(),
    templates: [
      {
        id: "t-1",
        title: "Landingpage kompakt",
        description: null,
        status: QuestionnaireCatalogStatus.Active,
        blockCount: 6,
        updatedAt: "2026-10-01T08:00:00.000Z",
      },
    ],
    formHref: null,
    ...overrides,
  };
  return render(
    <ProjectOnboardingSection
      content={content}
      kitErrors={getCrmQuestionnaireDictionary("de").errors}
      labelCollapse="Onboarding zuklappen"
      labelExpand="Onboarding aufklappen"
      locale="de"
      viewModel={viewModel}
    />,
  );
}

describe("ProjectOnboardingSection", () => {
  beforeEach(() => {
    navigation.push.mockReset();
    api.start.mockReset();
  });
  afterEach(cleanup);

  it("explains the purpose and offers the start while there is no form", () => {
    renderSection();
    expect(screen.getByText(text.empty.title)).toBeInTheDocument();
    expect(screen.getByText(text.empty.description)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: text.start }),
    ).toBeInTheDocument();
  });

  it("offers no start without the right and says why a project is not eligible", () => {
    renderSection({
      state: state({ canStart: false, projectEligible: false }),
      templates: [],
    });
    expect(
      screen.queryByRole("button", { name: text.start }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(text.empty.readOnlyDescription),
    ).toBeInTheDocument();
    expect(screen.getByText(text.notEligible)).toBeInTheDocument();
  });

  it("shows how far the review is once the customer has submitted", () => {
    const submitted = {
      id: "f-1",
      status: OnboardingFormStatus.Submitted,
      progress: { answeredRequired: 4, totalRequired: 4, ratio: 1 },
      submittedAt: "2026-10-02T08:00:00.000Z",
      completedAt: null,
    };
    const review = {
      total: 5,
      reviewed: 2,
      clarifications: 1,
      customerClarifications: 1,
      callClarifications: 0,
    };
    renderSection({
      state: state({ canStart: false, form: submitted, review }),
      formHref: "/de/crm/onboarding/f-1",
    });
    expect(screen.getByText("2 von 5 Blöcken geprüft")).toBeInTheDocument();
    expect(screen.getByText("1 Rückfrage")).toBeInTheDocument();
    cleanup();

    // Before a submission there is nothing to review, whatever the columns hold.
    renderSection({
      state: state({
        canStart: false,
        form: {
          ...submitted,
          status: OnboardingFormStatus.Open,
          submittedAt: null,
        },
        review: { ...review, reviewed: 0, clarifications: 0 },
      }),
      formHref: "/de/crm/onboarding/f-1",
    });
    expect(screen.queryByText(/Blöcken geprüft/)).not.toBeInTheDocument();
  });

  it("starts from the chosen template and opens the new form", async () => {
    api.start.mockResolvedValue({ ok: true, value: { id: "f-1" } });
    renderSection({ state: state({ prefillAvailable: true }) });

    fireEvent.click(screen.getByRole("button", { name: text.start }));
    expect(screen.getByText(text.dialog.prefillHint)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: text.dialog.submit }));

    await waitFor(() =>
      expect(api.start).toHaveBeenCalledWith("p-1", { templateId: "t-1" }),
    );
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith("/de/crm/onboarding/f-1"),
    );
  });

  it("starts empty when there is no template and keeps the dialog open on a failure", async () => {
    api.start.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.FormExists,
    });
    renderSection({ templates: [] });

    fireEvent.click(screen.getByRole("button", { name: text.start }));
    expect(screen.getByText(text.dialog.noTemplates)).toBeInTheDocument();
    expect(screen.queryByText(text.dialog.prefillHint)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: text.dialog.submit }));

    await waitFor(() =>
      expect(api.start).toHaveBeenCalledWith("p-1", { templateId: null }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.ONBOARDING_FORM_EXISTS,
    );
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("shows status, progress and the way to an existing form", () => {
    renderSection({
      state: state({
        canStart: false,
        form: {
          id: "f-1",
          status: OnboardingFormStatus.Draft,
          progress: { answeredRequired: 4, totalRequired: 12, ratio: 4 / 12 },
          submittedAt: null,
          completedAt: null,
        },
      }),
      formHref: "/de/crm/onboarding/f-1",
    });

    expect(screen.getByText(content.status.draft)).toBeInTheDocument();
    expect(
      screen.getByText("4 von 12 Pflichtangaben beantwortet"),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "4");
    expect(screen.getByText(text.draftHint)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: text.open })).toHaveAttribute(
      "href",
      "/de/crm/onboarding/f-1",
    );
    expect(
      screen.queryByRole("button", { name: text.start }),
    ).not.toBeInTheDocument();
  });

  it("says when the onboarding was completed", () => {
    renderSection({
      state: state({
        canStart: false,
        form: {
          id: "f-1",
          status: OnboardingFormStatus.Completed,
          progress: { answeredRequired: 4, totalRequired: 4, ratio: 1 },
          submittedAt: "2026-10-02T08:00:00.000Z",
          completedAt: "2026-10-05T10:00:00.000Z",
        },
      }),
      formHref: "/de/crm/onboarding/f-1",
    });

    expect(screen.getByText(content.status.completed)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Abgeschlossen am 5. Okt. 2026. Der Bogen ist die Arbeitsgrundlage für dieses Projekt.",
      ),
    ).toBeInTheDocument();
  });

  it("says so when a form has no required fields yet", () => {
    renderSection({
      state: state({
        canStart: false,
        form: {
          id: "f-1",
          status: OnboardingFormStatus.Open,
          progress: { answeredRequired: 0, totalRequired: 0, ratio: 1 },
          submittedAt: null,
          completedAt: null,
        },
      }),
      formHref: "/de/crm/onboarding/f-1",
    });
    expect(screen.getByText(text.progressNone)).toBeInTheDocument();
    expect(screen.queryByText(text.draftHint)).not.toBeInTheDocument();
  });
});
