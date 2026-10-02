// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OnboardingErrorCode } from "@invessiv/common/constants/crm/errors/onboarding-error-codes";
import { OnboardingBlockReviewStatus as S } from "@invessiv/common/constants/crm/onboarding/onboarding-block-review-statuses";
import { OnboardingClarificationMode as M } from "@invessiv/common/constants/crm/onboarding/onboarding-clarification-modes";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { OnboardingFormBlockDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-block.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import {
  getCrmFilesDictionary,
  getCrmOnboardingDictionary,
  getCrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import {
  blockFixture,
  fieldFixture,
} from "@/server/tests/workspace/crm/support/questionnaire-definition-fixtures";
import { OnboardingReviewTab } from "./onboarding-review-tab";

const api = vi.hoisted(() => ({
  reviewBlock: vi.fn(),
  requestChanges: vi.fn(),
}));

vi.mock("@/client/crm/onboarding-form-api-service", () => ({
  onboardingFormApiService: api,
}));
vi.mock("@/client/crm/files-api-service", () => ({
  filesApiService: {
    getDownloadUrl: vi.fn(),
    readText: vi.fn(),
    downloadArchive: vi.fn(),
  },
}));

const content = getCrmOnboardingDictionary("de");
const texts = content.review;

function step(
  id: string,
  title: string,
  review: Partial<OnboardingFormBlockDto> = {},
): OnboardingFormBlockDto {
  return {
    position: 0,
    reviewStatus: S.Pending,
    clarificationMode: null,
    reviewNote: null,
    reviewedByMemberId: null,
    reviewedAt: null,
    version: 1,
    block: blockFixture(
      [fieldFixture(`${id}-name`, QuestionnaireFieldType.ShortText)],
      { id, translations: { de: { title, intro: null } } },
    ),
    ...review,
  };
}

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
    submittedAt: "2026-10-02T08:00:00.000Z",
    submittedByPortalMembershipId: null,
    servicesConfirmedAt: null,
    servicesConfirmedByPortalMembershipId: null,
    servicesNote: null,
    servicesChangedSinceConfirmation: false,
    callHeldOn: null,
    completedAt: null,
    completedByMemberId: null,
    blocks: [step("b-1", "Unternehmen"), step("b-2", "Marke")],
    answers: [],
    answerFiles: [],
    hiddenAnswerFiles: [],
    groupEntries: [],
    services: [],
    version: 4,
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
    ...overrides,
  };
}

const forCustomer = {
  reviewStatus: S.Clarification,
  clarificationMode: M.Customer,
  reviewNote: "Welche Domain meint ihr?",
  reviewedByMemberId: "m-1",
  reviewedAt: "2026-10-02T09:00:00.000Z",
  version: 2,
} as const;
const forCall = {
  ...forCustomer,
  clarificationMode: M.Call,
  reviewNote: "Zielgruppe besprechen",
} as const;

function renderTab(dto: OnboardingFormDto = form(), canWrite = true) {
  const onFormChange = vi.fn();
  const onAnnounce = vi.fn();
  /** Adopts every answered form like the page does, so the tab re-renders with it. */
  function Page() {
    const [current, setCurrent] = useState(dto);
    return tab(current, (next) => {
      onFormChange(next);
      setCurrent(next);
    });
  }
  const tab = (
    current: OnboardingFormDto,
    adopt: (next: OnboardingFormDto) => void,
  ) => (
    <OnboardingReviewTab
      canWrite={canWrite}
      content={content}
      errorTexts={{
        onboarding: content.errors,
        questionnaire: getCrmQuestionnaireDictionary("de").errors,
      }}
      filesContent={getCrmFilesDictionary("de")}
      form={current}
      locale="de"
      onAnnounceAction={onAnnounce}
      onFormChangeAction={adopt}
      projectTitle="Website-Relaunch"
    />
  );
  render(<Page />);
  return { onFormChange, onAnnounce };
}

const card = (title: string) =>
  screen.getByRole("heading", { level: 3, name: title }).closest("li")!;

const option = (title: string, label: string) =>
  within(card(title)).getByRole("radio", { name: label });

describe("OnboardingReviewTab", () => {
  beforeEach(() => {
    api.reviewBlock.mockReset();
    api.requestChanges.mockReset();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("explains what the review is for while the customer has not submitted", () => {
    renderTab(form({ status: OnboardingFormStatus.Open, submittedAt: null }));

    expect(
      screen.getByText(texts.states.notSubmitted.title),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByText(texts.agenda.title)).not.toBeInTheDocument();
  });

  it("counts the review with the shared summary", () => {
    renderTab(
      form({
        blocks: [
          step("b-1", "Unternehmen", forCustomer),
          step("b-2", "Marke", { reviewStatus: S.Complete, version: 2 }),
          step("b-3", "Technik"),
        ],
      }),
    );

    expect(screen.getByText("2 von 3 Blöcken geprüft")).toBeInTheDocument();
    expect(screen.getByText("1 Rückfrage")).toBeInTheDocument();
    expect(card("Unternehmen")).toHaveAttribute("data-review", S.Clarification);
    expect(card("Technik")).toHaveAttribute("data-review", S.Pending);
  });

  it("saves complete with the click and adopts the answered form", async () => {
    const next = form({
      blocks: [
        step("b-1", "Unternehmen", { reviewStatus: S.Complete, version: 2 }),
        step("b-2", "Marke"),
      ],
    });
    api.reviewBlock.mockResolvedValue({ ok: true, value: next });
    const { onFormChange, onAnnounce } = renderTab();

    fireEvent.click(option("Unternehmen", texts.status.complete));

    await waitFor(() => expect(onFormChange).toHaveBeenCalledWith(next));
    expect(api.reviewBlock).toHaveBeenCalledWith("f-1", "b-1", {
      reviewStatus: S.Complete,
      expectedVersion: 1,
    });
    expect(onAnnounce).toHaveBeenCalledWith(
      "Prüfung von „Unternehmen“ gespeichert.",
    );
  });

  it("asks for the text of a question before it saves it with its way", async () => {
    api.reviewBlock.mockResolvedValue({ ok: true, value: form() });
    renderTab();
    const marke = within(card("Marke"));

    fireEvent.click(option("Marke", texts.status.clarification));
    expect(api.reviewBlock).not.toHaveBeenCalled();
    fireEvent.click(marke.getByRole("button", { name: texts.controls.save }));
    expect(marke.getByRole("alert")).toHaveTextContent(
      texts.controls.noteRequired,
    );
    expect(api.reviewBlock).not.toHaveBeenCalled();

    fireEvent.click(marke.getByRole("radio", { name: texts.mode.call }));
    fireEvent.change(marke.getByRole("textbox", { name: /Rückfrage/ }), {
      target: { value: "  Farben besprechen " },
    });
    fireEvent.click(marke.getByRole("button", { name: texts.controls.save }));

    await waitFor(() =>
      expect(api.reviewBlock).toHaveBeenCalledWith("f-1", "b-2", {
        reviewStatus: S.Clarification,
        clarificationMode: M.Call,
        note: "Farben besprechen",
        expectedVersion: 1,
      }),
    );
  });

  it("adopts the current form of a conflict and says so", async () => {
    const current = form({
      blocks: [
        step("b-1", "Unternehmen", { reviewStatus: S.Complete, version: 3 }),
        step("b-2", "Marke"),
      ],
    });
    api.reviewBlock.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    });
    const { onFormChange } = renderTab();

    fireEvent.click(option("Marke", texts.status.complete));

    await waitFor(() => expect(onFormChange).toHaveBeenCalledWith(current));
    expect(within(card("Marke")).getByRole("alert")).toHaveTextContent(
      texts.controls.conflict,
    );
    // The click did not go through, so the selection shows what the server holds.
    expect(option("Marke", texts.status.pending)).toBeChecked();
    expect(card("Unternehmen")).toHaveAttribute("data-review", S.Complete);
  });

  it("keeps a typed question through a conflict and saves it against the adopted version", async () => {
    const current = form({
      blocks: [
        step("b-1", "Unternehmen"),
        step("b-2", "Marke", { reviewStatus: S.Complete, version: 5 }),
      ],
    });
    api.reviewBlock.mockResolvedValueOnce({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current,
    });
    api.reviewBlock.mockResolvedValueOnce({ ok: true, value: current });
    renderTab();
    const marke = () => within(card("Marke"));

    fireEvent.click(option("Marke", texts.status.clarification));
    fireEvent.change(marke().getByRole("textbox", { name: /Rückfrage/ }), {
      target: { value: "Logo fehlt" },
    });
    fireEvent.click(marke().getByRole("button", { name: texts.controls.save }));

    expect(await marke().findByRole("alert")).toHaveTextContent(
      texts.controls.conflict,
    );
    expect(marke().getByRole("textbox", { name: /Rückfrage/ })).toHaveValue(
      "Logo fehlt",
    );

    fireEvent.click(marke().getByRole("button", { name: texts.controls.save }));
    await waitFor(() => expect(api.reviewBlock).toHaveBeenCalledTimes(2));
    expect(api.reviewBlock).toHaveBeenLastCalledWith("f-1", "b-2", {
      reviewStatus: S.Clarification,
      clarificationMode: M.Customer,
      note: "Logo fehlt",
      expectedVersion: 5,
    });
  });

  it("falls back to the stored result when the server refuses", async () => {
    api.reviewBlock.mockResolvedValue({
      ok: false,
      code: OnboardingErrorCode.InvalidTransition,
    });
    renderTab();

    fireEvent.click(option("Marke", texts.status.complete));

    expect(await within(card("Marke")).findByRole("alert")).toHaveTextContent(
      content.errors.ONBOARDING_INVALID_TRANSITION,
    );
    expect(option("Marke", texts.status.pending)).toBeChecked();
  });

  it("puts only call questions and the service hints on the agenda and copies plain text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    renderTab(
      form({
        blocks: [
          step("b-1", "Unternehmen", forCustomer),
          step("b-2", "Marke", forCall),
        ],
        servicesChangedSinceConfirmation: true,
        servicesNote: "Bitte ohne Blog",
      }),
    );
    const agenda = within(
      screen.getByRole("region", { name: texts.agenda.title }),
    );

    expect(agenda.getByText("Zielgruppe besprechen")).toBeInTheDocument();
    expect(agenda.getByText(texts.agenda.servicesChanged)).toBeInTheDocument();
    expect(agenda.getByText("Bitte ohne Blog")).toBeInTheDocument();
    expect(
      agenda.queryByText("Welche Domain meint ihr?"),
    ).not.toBeInTheDocument();

    fireEvent.click(agenda.getByRole("button", { name: texts.agenda.copy }));

    await waitFor(() =>
      expect(agenda.getByRole("status")).toHaveTextContent(texts.agenda.copied),
    );
    expect(writeText).toHaveBeenCalledWith(
      [
        "Agenda Onboarding-Call: Website-Relaunch",
        "",
        "- Marke: Zielgruppe besprechen",
        `- ${texts.agenda.servicesChanged}`,
        `- ${texts.agenda.servicesNote}: Bitte ohne Blog`,
      ].join("\n"),
    );
  });

  it("offers the change request only with a question for the customer and lists it before sending", async () => {
    renderTab(form({ blocks: [step("b-1", "Unternehmen", forCall)] }));
    expect(
      screen.getByRole("button", { name: texts.request.action }),
    ).toBeDisabled();
    expect(screen.getByText(texts.request.hint)).toBeInTheDocument();
    cleanup();

    const requested = form({ status: OnboardingFormStatus.ChangesRequested });
    api.requestChanges.mockResolvedValue({ ok: true, value: requested });
    const { onFormChange, onAnnounce } = renderTab(
      form({
        blocks: [
          step("b-1", "Unternehmen", forCustomer),
          step("b-2", "Marke", forCall),
        ],
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: texts.request.action }));
    const dialog = within(
      screen.getByRole("dialog", { name: texts.request.dialog.title }),
    );
    expect(dialog.getByText("Unternehmen")).toBeInTheDocument();
    expect(dialog.getByText("Welche Domain meint ihr?")).toBeInTheDocument();
    expect(dialog.queryByText("Marke")).not.toBeInTheDocument();

    fireEvent.click(
      dialog.getByRole("button", { name: texts.request.dialog.confirm }),
    );

    await waitFor(() => expect(onFormChange).toHaveBeenCalledWith(requested));
    expect(api.requestChanges).toHaveBeenCalledWith("f-1", {
      expectedVersion: 4,
    });
    expect(onAnnounce).toHaveBeenCalledWith(texts.request.sent);
  });

  it("shows the results without controls while the customer works on the form", () => {
    renderTab(
      form({
        status: OnboardingFormStatus.ChangesRequested,
        blocks: [step("b-1", "Unternehmen", forCustomer)],
      }),
    );

    expect(screen.getByText(texts.states.changesRequested)).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: texts.request.action }),
    ).not.toBeInTheDocument();
    expect(
      within(card("Unternehmen")).getByText("Welche Domain meint ihr?"),
    ).toBeInTheDocument();
  });

  it("gives a member without write access the results only", () => {
    renderTab(form(), false);

    expect(screen.getByText(texts.states.readOnly)).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: texts.request.action }),
    ).not.toBeInTheDocument();
  });
});
