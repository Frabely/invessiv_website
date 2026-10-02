// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { OnboardingBlockReviewStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { ProjectPhase } from "@invessiv/common/constants/crm/project-phases";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OnboardingFormBlockDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-block.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
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
  complete: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: vi.fn() }),
  usePathname: () => "/de/crm/onboarding/f-1",
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock("@/client/crm/onboarding-form-api-service", () => ({
  onboardingFormApiService: {
    definitionApi: vi.fn(),
    complete: mocks.complete,
  },
}));
vi.mock("@/client/crm/files-api-service", () => ({
  filesApiService: {
    getDownloadUrl: vi.fn(),
    readText: vi.fn(),
    downloadArchive: vi.fn(),
  },
}));
// The dialog offers no day after today in the business time zone.
vi.mock("@/common/patterns/time/business-today", () => ({
  businessToday: () => "2026-10-02",
}));

const content = getCrmOnboardingDictionary("de");
const texts = content.complete;
const dialogTexts = texts.dialog;

const NAME = fieldFixture("name", QuestionnaireFieldType.ShortText, {
  requirement: QuestionnaireFieldRequirement.Required,
  translations: { de: { label: "Firmenname", help: null } },
});

function step(
  overrides: Partial<OnboardingFormBlockDto> = {},
): OnboardingFormBlockDto {
  return {
    position: 0,
    reviewStatus: OnboardingBlockReviewStatus.Complete,
    clarificationMode: null,
    reviewNote: null,
    reviewedByMemberId: "m-1",
    reviewedAt: "2026-10-01T09:00:00.000Z",
    version: 2,
    block: blockFixture([NAME]),
    ...overrides,
  };
}

const ANSWER: OnboardingFormDto["answers"][number] = {
  fieldId: NAME.id,
  groupEntryId: null,
  choiceId: null,
  value: "Nordlicht",
  sortOrder: 0,
};

function form(overrides: Partial<OnboardingFormDto> = {}): OnboardingFormDto {
  return {
    id: "f-1",
    customerId: "c-1",
    projectId: "p-1",
    sourceTemplateId: null,
    status: OnboardingFormStatus.Submitted,
    createdByMemberId: "m-1",
    releasedAt: "2026-10-01T08:00:00.000Z",
    releasedByMemberId: "m-1",
    submittedAt: "2026-10-01T08:45:00.000Z",
    submittedByPortalMembershipId: "pm-1",
    servicesConfirmedAt: null,
    servicesConfirmedByPortalMembershipId: null,
    servicesNote: null,
    servicesChangedSinceConfirmation: false,
    callHeldOn: null,
    completedAt: null,
    completedByMemberId: null,
    blocks: [step()],
    answers: [ANSWER],
    answerFiles: [],
    groupEntries: [],
    services: [],
    version: 6,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:45:00.000Z",
    ...overrides,
  };
}

const COMPLETED = form({
  status: OnboardingFormStatus.Completed,
  callHeldOn: "2026-09-30",
  completedAt: "2026-10-02T10:00:00.000Z",
  completedByMemberId: "m-1",
  version: 7,
});

function renderPage(
  dto: OnboardingFormDto = form(),
  options: { canWrite?: boolean; projectPhase?: ProjectPhase } = {},
) {
  render(
    <OnboardingFormPageView
      backHref="/de/crm?cockpit=c-1&project=p-1"
      canWrite={options.canWrite ?? true}
      catalogBlocks={[]}
      content={content}
      context={{
        customerId: "c-1",
        customerName: "Nordlicht Coaching",
        projectId: "p-1",
        projectTitle: "Website-Relaunch",
        projectPhase: options.projectPhase ?? ProjectPhase.Onboarding,
        templateTitle: null,
      }}
      filesContent={getCrmFilesDictionary("de")}
      fixedChoiceLabels={{
        de: { yes: "Ja", no: "Nein" },
        en: { yes: "Yes", no: "No" },
      }}
      form={dto}
      locale="de"
      questionnaireContent={getCrmQuestionnaireDictionary("de")}
    />,
  );
}

const completeButton = () =>
  screen.queryByRole("button", { name: texts.action });

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

async function openDialog() {
  await click(completeButton()!);
  return screen.getByRole("dialog", { name: dialogTexts.title });
}

const dateField = (dialog: HTMLElement) =>
  within(dialog).getByLabelText(dialogTexts.callHeldOn, { exact: false });

const confirmButton = (dialog: HTMLElement) =>
  within(dialog).getByRole("button", { name: dialogTexts.confirm });

async function confirm(dialog: HTMLElement, callHeldOn?: string) {
  if (callHeldOn !== undefined)
    fireEvent.change(dateField(dialog), { target: { value: callHeldOn } });
  await click(confirmButton(dialog));
}

describe("OnboardingFormPageView completion", () => {
  beforeEach(() => {
    mocks.complete.mockReset();
    mocks.replace.mockReset();
    mocks.search = "";
  });

  afterEach(cleanup);

  it("offers the completion only for a submitted form the member may write", () => {
    renderPage();
    expect(completeButton()).toBeInTheDocument();
    cleanup();

    renderPage(form(), { canWrite: false });
    expect(completeButton()).toBeNull();
    cleanup();

    for (const status of [
      OnboardingFormStatus.Draft,
      OnboardingFormStatus.Open,
      OnboardingFormStatus.ChangesRequested,
    ]) {
      renderPage(form({ status }));
      expect(completeButton()).toBeNull();
      cleanup();
    }
    renderPage(COMPLETED);
    expect(completeButton()).toBeNull();
  });

  it("asks for the call date before it sends anything", async () => {
    renderPage();
    const dialog = await openDialog();

    expect(dateField(dialog)).toHaveAttribute("max", "2026-10-02");
    await confirm(dialog);
    expect(dialog).toHaveTextContent(dialogTexts.callHeldOnRequired);

    await confirm(dialog, "2026-10-03");
    expect(dialog).toHaveTextContent(dialogTexts.callHeldOnFuture);
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("completes with call date and phase switch and shows the form as completed", async () => {
    mocks.complete.mockResolvedValue({ ok: true, value: COMPLETED });
    renderPage();

    const dialog = await openDialog();
    expect(
      within(dialog).getByRole("checkbox", { name: dialogTexts.advancePhase }),
    ).toBeChecked();
    await confirm(dialog, "2026-09-30");

    expect(mocks.complete).toHaveBeenCalledWith("f-1", {
      expectedVersion: 6,
      callHeldOn: "2026-09-30",
      advancePhase: true,
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(completeButton()).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(texts.completed);
    expect(screen.getAllByText(content.status.completed)[0]).toBeVisible();
  });

  it("sends an unticked phase switch and hides it for a project past the onboarding", async () => {
    mocks.complete.mockResolvedValue({ ok: true, value: COMPLETED });
    renderPage();
    let dialog = await openDialog();
    await click(
      within(dialog).getByRole("checkbox", { name: dialogTexts.advancePhase }),
    );
    await confirm(dialog, "2026-09-30");
    expect(mocks.complete).toHaveBeenLastCalledWith(
      "f-1",
      expect.objectContaining({ advancePhase: false }),
    );
    cleanup();

    renderPage(form(), { projectPhase: ProjectPhase.Development });
    dialog = await openDialog();
    expect(within(dialog).queryByRole("checkbox")).toBeNull();
    await confirm(dialog, "2026-09-30");
    expect(mocks.complete).toHaveBeenLastCalledWith(
      "f-1",
      expect.objectContaining({ advancePhase: false }),
    );
  });

  it("names unreviewed blocks and call points as hints without blocking", async () => {
    renderPage(
      form({
        blocks: [
          step({
            reviewStatus: OnboardingBlockReviewStatus.Pending,
            reviewedByMemberId: null,
            reviewedAt: null,
          }),
          step({
            position: 1,
            reviewStatus: OnboardingBlockReviewStatus.Clarification,
            clarificationMode: OnboardingClarificationMode.Call,
            reviewNote: "Zielgruppe besprechen",
            block: blockFixture([], { id: "b-2", key: "brand" }),
          }),
        ],
      }),
    );

    const dialog = await openDialog();

    expect(dialog).toHaveTextContent(dialogTexts.unreviewedOne);
    expect(dialog).toHaveTextContent(dialogTexts.callPointsOne);
    expect(confirmButton(dialog)).toBeEnabled();
  });

  it("blocks on missing required answers and leads to the answers tab", async () => {
    renderPage(form({ answers: [] }));

    const dialog = await openDialog();

    expect(dialog).toHaveTextContent(dialogTexts.missingHeading);
    expect(dialog).toHaveTextContent(
      formatMessage(dialogTexts.missingItem, {
        field: "Firmenname",
        block: "Unternehmen",
      }),
    );
    expect(confirmButton(dialog)).toBeDisabled();
    expect(
      within(dialog).getByRole("link", { name: dialogTexts.missingLink }),
    ).toHaveAttribute("href", "/de/crm/onboarding/f-1?tab=answers");
  });

  it("adopts the current form of a conflict and keeps the dialog open", async () => {
    mocks.complete.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: form({ version: 9 }),
    });
    renderPage();
    const dialog = await openDialog();
    await confirm(dialog, "2026-09-30");

    expect(dialog).toHaveTextContent(dialogTexts.conflict);
    mocks.complete.mockResolvedValue({ ok: true, value: COMPLETED });
    await click(confirmButton(dialog));
    expect(mocks.complete).toHaveBeenLastCalledWith(
      "f-1",
      expect.objectContaining({ expectedVersion: 9 }),
    );
  });

  it("words a refusal of the server", async () => {
    mocks.complete.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.CallDateRequired,
    });
    renderPage();
    const dialog = await openDialog();
    await confirm(dialog, "2026-09-30");

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      content.errors.ONBOARDING_CALL_DATE_REQUIRED,
    );
  });

  it("opens a completed form on its answers with call date and completion in the head", () => {
    renderPage(COMPLETED);

    expect(
      screen.getByRole("tab", { name: content.form.tabs.answers }),
    ).toHaveAttribute("aria-selected", "true");
    const head = screen.getByRole("banner");
    expect(within(head).getByText(content.form.callHeldOn)).toBeVisible();
    expect(within(head).getByText("30. Sept. 2026")).toBeVisible();
    expect(within(head).getByText(content.form.completedAt)).toBeVisible();
    expect(within(head).getByText("2. Okt. 2026")).toBeVisible();
  });
});
