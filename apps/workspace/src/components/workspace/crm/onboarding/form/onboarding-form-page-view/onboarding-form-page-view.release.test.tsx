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
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { OnboardingReleaseWarningKind } from "@invessiv/common/constants/crm/onboarding/onboarding-release-warning-kinds";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OnboardingFormBlockDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-block.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
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
  release: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: vi.fn() }),
  usePathname: () => "/de/crm/onboarding/f-1",
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock("@/client/crm/onboarding-form-api-service", () => ({
  onboardingFormApiService: {
    definitionApi: vi.fn(),
    release: mocks.release,
  },
}));
vi.mock("@/client/crm/files-api-service", () => ({
  filesApiService: {
    getDownloadUrl: vi.fn(),
    readText: vi.fn(),
    downloadArchive: vi.fn(),
  },
}));

const content = getCrmOnboardingDictionary("de");
const texts = content.release;

function step(block: QuestionnaireBlockDto): OnboardingFormBlockDto {
  return {
    position: 0,
    reviewStatus: OnboardingBlockReviewStatus.Pending,
    clarificationMode: null,
    reviewNote: null,
    reviewedByMemberId: null,
    reviewedAt: null,
    version: 1,
    block,
  };
}

const COMPANY = blockFixture([
  fieldFixture("name", QuestionnaireFieldType.ShortText, {
    requirement: QuestionnaireFieldRequirement.Required,
  }),
]);

function form(overrides: Partial<OnboardingFormDto> = {}): OnboardingFormDto {
  return {
    id: "f-1",
    customerId: "c-1",
    projectId: "p-1",
    sourceTemplateId: null,
    status: OnboardingFormStatus.Draft,
    createdByMemberId: "m-1",
    releasedAt: null,
    releasedByMemberId: null,
    submittedAt: null,
    submittedByPortalMembershipId: null,
    servicesConfirmedAt: null,
    servicesConfirmedByPortalMembershipId: null,
    servicesNote: null,
    servicesChangedSinceConfirmation: false,
    callHeldOn: null,
    completedAt: null,
    completedByMemberId: null,
    blocks: [step(COMPANY)],
    answers: [],
    answerFiles: [],
    groupEntries: [],
    services: [],
    version: 4,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    ...overrides,
  };
}

function renderPage(dto: OnboardingFormDto = form(), canWrite = true) {
  render(
    <OnboardingFormPageView
      backHref="/de/crm?cockpit=c-1&project=p-1"
      canWrite={canWrite}
      catalogBlocks={[]}
      content={content}
      context={{
        customerId: "c-1",
        customerName: "Nordlicht Coaching",
        projectId: "p-1",
        projectTitle: "Website-Relaunch",
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

const releaseButton = () =>
  screen.queryByRole("button", { name: texts.action });

async function click(element: HTMLElement) {
  await act(async () => {
    fireEvent.click(element);
  });
}

/** Opens the dialog and confirms it once. */
async function confirmRelease() {
  await click(releaseButton()!);
  const dialog = screen.getByRole("dialog", { name: texts.dialog.title });
  await click(
    within(dialog).getByRole("button", { name: texts.dialog.confirm }),
  );
  return dialog;
}

describe("OnboardingFormPageView release", () => {
  beforeEach(() => {
    mocks.release.mockReset();
    mocks.replace.mockReset();
    mocks.search = "";
  });

  afterEach(cleanup);

  it("offers the release only for a draft the member may write", () => {
    renderPage();
    expect(releaseButton()).toBeInTheDocument();
    cleanup();

    renderPage(form(), false);
    expect(releaseButton()).toBeNull();
    cleanup();

    renderPage(form({ status: OnboardingFormStatus.Open }));
    expect(releaseButton()).toBeNull();
  });

  it("explains a form that asks nothing yet instead of sending it", async () => {
    renderPage(form({ blocks: [step(blockFixture([]))] }));

    await click(releaseButton()!);

    const dialog = screen.getByRole("dialog", { name: texts.dialog.title });
    expect(dialog).toHaveTextContent(texts.dialog.notReleasable);
    expect(
      within(dialog).queryByRole("button", { name: texts.dialog.confirm }),
    ).toBeNull();
    expect(mocks.release).not.toHaveBeenCalled();
  });

  it("releases a draft and shows it as being with the customer", async () => {
    const released = form({ status: OnboardingFormStatus.Open, version: 5 });
    mocks.release.mockResolvedValue({ ok: true, value: released });
    renderPage();
    expect(screen.getByText(content.status.draft)).toBeInTheDocument();

    await confirmRelease();

    expect(mocks.release).toHaveBeenCalledExactlyOnceWith("f-1", {
      expectedVersion: 4,
      acknowledgeWarnings: false,
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText(content.status.open)).toBeInTheDocument();
    expect(releaseButton()).toBeNull();
    expect(screen.getByText(texts.released)).toHaveAttribute(
      "aria-live",
      "polite",
    );
    // From now on the customer sees structure changes at once, and the editor says so.
    expect(
      screen.getByText(content.structure.editor.released),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuetext",
      "0 von 1 Pflichtangaben beantwortet",
    );
  });

  it("names every warning on its own and releases once they are acknowledged", async () => {
    mocks.release
      .mockResolvedValueOnce({
        ok: false,
        code: OnboardingErrorCode.ReleaseWarnings,
        warnings: [
          {
            kind: OnboardingReleaseWarningKind.MissingTranslation,
            blockId: COMPANY.id,
            locale: "en",
          },
          { kind: OnboardingReleaseWarningKind.NoPortalAccess },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        value: form({ status: OnboardingFormStatus.Open, version: 5 }),
      });
    renderPage();

    const dialog = await confirmRelease();

    const warnings = within(dialog).getAllByRole("listitem");
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toHaveTextContent("„Unternehmen“");
    expect(warnings[0]).toHaveTextContent("Englisch");
    expect(warnings[1]).toHaveTextContent(
      texts.dialog.warnings.no_portal_access,
    );
    expect((await screen.findAllByText(content.status.draft)).length).toBe(1);

    await click(
      within(dialog).getByRole("button", {
        name: texts.dialog.confirmAnyway,
      }),
    );

    expect(mocks.release).toHaveBeenLastCalledWith("f-1", {
      expectedVersion: 4,
      acknowledgeWarnings: true,
    });
    expect(screen.getByText(content.status.open)).toBeInTheDocument();
  });

  it("loads the current form after a conflict and releases against its version", async () => {
    mocks.release
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: form({ version: 9 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        value: form({ status: OnboardingFormStatus.Open, version: 10 }),
      });
    renderPage();

    const dialog = await confirmRelease();
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      texts.dialog.conflict,
    );

    await click(
      within(dialog).getByRole("button", { name: texts.dialog.confirm }),
    );

    expect(mocks.release).toHaveBeenLastCalledWith("f-1", {
      expectedVersion: 9,
      acknowledgeWarnings: false,
    });
    expect(screen.getByText(content.status.open)).toBeInTheDocument();
  });

  it("says why a release failed and keeps the draft", async () => {
    mocks.release.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.InvalidTransition,
    });
    renderPage();

    const dialog = await confirmRelease();

    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      content.errors.ONBOARDING_INVALID_TRANSITION,
    );
    expect(screen.getByText(content.status.draft)).toBeInTheDocument();
  });

  it("tells the team on the answers tab that the services changed after the confirmation", () => {
    mocks.search = "tab=answers";
    renderPage(
      form({
        status: OnboardingFormStatus.Submitted,
        servicesConfirmedAt: "2026-10-01T09:00:00.000Z",
        servicesChangedSinceConfirmation: true,
      }),
    );

    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      content.answers.servicesChanged,
    );
    cleanup();

    renderPage(form({ status: OnboardingFormStatus.Submitted }));
    expect(screen.getByRole("tabpanel")).not.toHaveTextContent(
      content.answers.servicesChanged,
    );
  });
});
