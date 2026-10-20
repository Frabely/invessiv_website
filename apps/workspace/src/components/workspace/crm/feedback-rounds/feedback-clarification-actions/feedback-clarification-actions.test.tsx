// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FeedbackClarificationStatus } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { FeedbackRoundItemDto } from "@invessiv/common/contracts/crm/feedback-round-item.dto";
import { getCrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FeedbackClarificationActions } from "./feedback-clarification-actions";

const mocks = vi.hoisted(() => ({
  askClarification: vi.fn(),
  closeClarification: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/client/crm/feedback-rounds-api-service", () => ({
  feedbackRoundsApiService: {
    askClarification: mocks.askClarification,
    closeClarification: mocks.closeClarification,
  },
}));

afterEach(() => {
  cleanup();
  mocks.askClarification.mockReset();
  mocks.closeClarification.mockReset();
});

const content = getCrmFeedbackRoundsDictionary("en");

function item(
  overrides: Partial<FeedbackRoundItemDto> = {},
): FeedbackRoundItemDto {
  return {
    id: "a",
    position: 0,
    areaLabel: null,
    kind: null,
    body: "Point",
    createdByPortalMembershipId: null,
    result: null,
    resultNote: null,
    resultSetByMemberId: null,
    resultSetAt: null,
    attachments: [],
    resultHistory: [],
    clarifications: [],
    version: 1,
    ...overrides,
  };
}

const openClarification = {
  id: "q",
  status: FeedbackClarificationStatus.Open,
  question: "Which blue?",
  requestedAt: "2026-10-01T10:00:00.000Z",
  answer: null,
  answeredAt: null,
  closeNote: null,
  closedAt: null,
  requestedByName: null,
  answeredByName: null,
  closedByName: null,
};

const answeredClarification = {
  ...openClarification,
  status: FeedbackClarificationStatus.Answered,
  answer: "The header",
  answeredAt: "2026-10-02T10:00:00.000Z",
};

function actions(current: FeedbackRoundItemDto, onSavedAction = vi.fn()) {
  return (
    <FeedbackClarificationActions
      buttonRef={null}
      content={content}
      item={current}
      number={3}
      onAnnounceAction={vi.fn()}
      onSavedAction={onSavedAction}
    />
  );
}

describe("FeedbackClarificationActions", () => {
  it("asks without an open question and closes an open one", () => {
    render(actions(item()));
    expect(
      screen.getByRole("button", { name: "Ask a question (item 3)" }),
    ).toHaveTextContent(content.clarification.ask);
    cleanup();
    render(actions(item({ clarifications: [openClarification] })));
    expect(
      screen.getByRole("button", { name: "Close question (item 3)" }),
    ).toHaveTextContent(content.clarification.close);
  });

  it("keeps the close dialog for its question when the item changes behind it", () => {
    const { rerender } = render(
      actions(item({ clarifications: [openClarification] })),
    );
    fireEvent.click(screen.getByRole("button", { name: /Close question/ }));
    rerender(
      actions(item({ version: 2, clarifications: [answeredClarification] })),
    );
    expect(
      screen.getByRole("dialog", { name: "Close the question about item 3" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "Question about item 3" }),
    ).not.toBeInTheDocument();
  });

  it("sends no second close once the conflict shows the question answered", async () => {
    mocks.closeClarification.mockResolvedValue({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: item({ version: 2, clarifications: [answeredClarification] }),
    });
    render(actions(item({ clarifications: [openClarification] })));
    fireEvent.click(screen.getByRole("button", { name: /Close question/ }));
    const dialog = screen.getByRole("dialog", {
      name: "Close the question about item 3",
    });
    fireEvent.change(screen.getByLabelText(/Note to the customer/), {
      target: { value: "Settled on the phone" },
    });
    fireEvent.submit(dialog.querySelector("form")!);
    await screen.findByText(content.clarification.closeDialog.conflict);

    fireEvent.submit(dialog.querySelector("form")!);
    expect(
      await screen.findByText(content.processingErrors.changed),
    ).toBeInTheDocument();
    expect(mocks.closeClarification).toHaveBeenCalledOnce();
  });

  it("reports the saved item so the row can move the focus with it", async () => {
    const saved = item({ version: 2, clarifications: [openClarification] });
    mocks.askClarification.mockResolvedValue({ ok: true, value: saved });
    const onSavedAction = vi.fn();
    render(actions(item(), onSavedAction));
    fireEvent.click(screen.getByRole("button", { name: /Ask a question/ }));
    fireEvent.change(screen.getByLabelText(/Your question/), {
      target: { value: "Which blue?" },
    });
    fireEvent.submit(
      screen
        .getByRole("dialog", { name: "Question about item 3" })
        .querySelector("form")!,
    );
    await waitFor(() => expect(onSavedAction).toHaveBeenCalledWith(saved));
  });
});
