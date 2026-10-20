// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FEEDBACK_ITEM_RESULT_VALUES } from "@invessiv/common/constants/crm/feedback-item-results";
import content from "@/i18n/dictionaries/workspace/crm/feedback-rounds/en.json";
import { FeedbackItemResultSelect } from "./feedback-item-result-select";

afterEach(cleanup);

it.each(FEEDBACK_ITEM_RESULT_VALUES)(
  "offers pending after %s and sends null",
  (result) => {
    const change = vi.fn();
    render(
      <FeedbackItemResultSelect
        content={content.result}
        number={1}
        result={result}
        onChangeAction={change}
      />,
    );
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(
      screen.getByRole("option", { name: content.result.choices.pending }),
    );
    expect(change).toHaveBeenCalledExactlyOnceWith(null);
  },
);

it("does not send an action when pending is already selected", () => {
  const change = vi.fn();
  render(
    <FeedbackItemResultSelect
      content={content.result}
      number={1}
      result={null}
      onChangeAction={change}
    />,
  );
  fireEvent.click(screen.getByRole("button"));
  fireEvent.click(
    screen.getByRole("option", { name: content.result.choices.pending }),
  );
  expect(change).not.toHaveBeenCalled();
});

it("is locked with the question status and the reason while a clarification is open", () => {
  const change = vi.fn();
  render(
    <FeedbackItemResultSelect
      content={content.result}
      locked
      number={2}
      result={null}
      onChangeAction={change}
    />,
  );
  const select = screen.getByRole("button");
  expect(select).toBeDisabled();
  expect(select).toHaveTextContent(content.result.choices.clarification);
  expect(select).toHaveAccessibleDescription(content.result.lockedHint);
  expect(change).not.toHaveBeenCalled();
});
