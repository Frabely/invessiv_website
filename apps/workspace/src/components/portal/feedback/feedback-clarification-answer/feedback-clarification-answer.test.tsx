// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import { FeedbackAnswerProblem } from "@/common/constants/portal/feedback-answer-problems";
import type { FeedbackAnswerDraft } from "@/common/contracts/portal/feedback-answer-draft";
import { getPortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { FeedbackClarificationAnswer } from "./feedback-clarification-answer";

afterEach(cleanup);

const content = getPortalFeedbackDictionary("en");

function draft(
  overrides: Partial<FeedbackAnswerDraft> = {},
): FeedbackAnswerDraft {
  return {
    itemId: "a",
    clarificationId: "q",
    text: "Blue",
    commandId: "c-1",
    busy: false,
    locked: false,
    problem: null,
    code: null,
    ...overrides,
  };
}

function renderAnswer(current: FeedbackAnswerDraft | null) {
  const onSubmitAction = vi.fn();
  const onChangeAction = vi.fn();
  render(
    <>
      <FeedbackClarificationAnswer
        content={content}
        draft={current}
        number={2}
        onChangeAction={onChangeAction}
        onSubmitAction={onSubmitAction}
      />
      <FeedbackClarificationAnswer
        content={content}
        draft={null}
        number={3}
        onChangeAction={vi.fn()}
        onSubmitAction={vi.fn()}
      />
    </>,
  );
  return { onSubmitAction, onChangeAction };
}

describe("FeedbackClarificationAnswer", () => {
  it("labels each answer by its item and keeps the fields apart", () => {
    const { onChangeAction } = renderAnswer(draft());
    const field = screen.getByRole("textbox", {
      name: /Your answer to point 2/,
    });
    expect(field).toHaveValue("Blue");
    expect(
      screen.getByRole("textbox", { name: /Your answer to point 3/ }),
    ).toHaveValue("");
    fireEvent.change(field, { target: { value: "Green" } });
    expect(onChangeAction).toHaveBeenCalledWith("Green");
    expect(screen.getByText(/4 of 2000 characters/)).toBeInTheDocument();
  });

  it("shows the busy state and does not send twice", () => {
    const { onSubmitAction } = renderAnswer(draft({ busy: true }));
    const [send] = screen.getAllByRole("button");
    expect(send).toHaveTextContent(content.clarifications.answer.submitting);
    expect(send).toBeDisabled();
    expect(
      screen.getByRole("textbox", { name: /Your answer to point 2/ }),
    ).toHaveAttribute("readonly");
    expect(onSubmitAction).not.toHaveBeenCalled();
  });

  it("names a missing answer at the field and a failure as an alert", () => {
    renderAnswer(draft({ text: "", problem: FeedbackAnswerProblem.Required }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      content.clarifications.answer.required,
    );
    cleanup();
    renderAnswer(
      draft({
        problem: FeedbackAnswerProblem.Failure,
        code: PortalFeedbackErrorCode.Unavailable,
      }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      content.errors.unavailable,
    );
  });

  it("keeps the text of a question that is no longer open under its own name, with discard instead of send", () => {
    const onDiscardAction = vi.fn();
    render(
      <FeedbackClarificationAnswer
        content={content}
        draft={draft({ locked: true, problem: FeedbackAnswerProblem.NotOpen })}
        number={2}
        onChangeAction={vi.fn()}
        onDiscardAction={onDiscardAction}
        onSubmitAction={vi.fn()}
      />,
    );
    const field = screen.getByRole("textbox", {
      name: /Unsent answer to an earlier question on point 2/,
    });
    expect(field).toHaveValue("Blue");
    expect(field).toHaveAttribute("readonly");
    expect(screen.getByRole("alert")).toHaveTextContent(
      content.clarifications.answer.notOpen,
    );
    expect(
      screen.queryByRole("button", {
        name: content.clarifications.answer.submit,
      }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: content.clarifications.answer.discard,
      }),
    );
    expect(onDiscardAction).toHaveBeenCalledOnce();
  });
});
