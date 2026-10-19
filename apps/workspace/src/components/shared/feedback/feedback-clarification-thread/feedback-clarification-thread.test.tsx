// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FeedbackClarificationStatus as S } from "@invessiv/common/constants/crm/feedback-clarification-statuses";
import type { FeedbackItemClarificationDto } from "@invessiv/common/contracts/crm/feedback-item-clarification.dto";
import type { FeedbackClarificationThreadLabels } from "@/common/contracts/feedback/feedback-clarification-thread-labels";
import { FeedbackClarificationThread } from "./feedback-clarification-thread";

afterEach(cleanup);

const labels: FeedbackClarificationThreadLabels = {
  team: "Our team",
  customer: "Customer",
  byline: "{name} on {date}",
  statusOpen: "Question open",
  statusAnswered: "Answered",
  statusClosed: "Closed",
  closeNote: "Closed with a note",
  earlier: "Earlier questions ({count})",
  showMore: "More",
  showLess: "Less",
};

function clarification(
  id: string,
  status: FeedbackItemClarificationDto["status"],
  day: number,
): FeedbackItemClarificationDto {
  const at = `2026-10-${String(day).padStart(2, "0")}T10:00:00.000Z`;
  return {
    id,
    status,
    question: `Question ${id}`,
    requestedAt: at,
    answer: status === S.Answered ? `Answer ${id}` : null,
    answeredAt: status === S.Answered ? at : null,
    closeNote: status === S.Closed ? `Note ${id}` : null,
    closedAt: status === S.Closed ? at : null,
  };
}

describe("FeedbackClarificationThread", () => {
  it("renders nothing without clarifications", () => {
    const { container } = render(
      <FeedbackClarificationThread
        clarifications={[]}
        label="Questions"
        labels={labels}
        locale="en"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the open question with its slot and the status as text", () => {
    render(
      <FeedbackClarificationThread
        clarifications={[clarification("a", S.Open, 1)]}
        label="Questions"
        labels={labels}
        locale="en"
      >
        <button type="button">Answer now</button>
      </FeedbackClarificationThread>,
    );
    const thread = screen.getByRole("region", { name: "Questions" });
    expect(within(thread).getByText("Question open")).toBeInTheDocument();
    expect(within(thread).getByText("Question a")).toBeInTheDocument();
    expect(within(thread).getByText(/^Our team on/)).toBeInTheDocument();
    expect(
      within(thread).getByRole("button", { name: "Answer now" }),
    ).toBeInTheDocument();
  });

  it("keeps the slot away from finished clarifications", () => {
    render(
      <FeedbackClarificationThread
        clarifications={[clarification("a", S.Answered, 1)]}
        label="Questions"
        labels={labels}
        locale="en"
      >
        <button type="button">Answer now</button>
      </FeedbackClarificationThread>,
    );
    expect(
      screen.queryByRole("button", { name: "Answer now" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Answer a")).toBeInTheDocument();
    expect(screen.getByText(/^Customer on/)).toBeInTheDocument();
  });

  it("folds older finished clarifications behind a disclosure", () => {
    render(
      <FeedbackClarificationThread
        clarifications={[
          clarification("a", S.Closed, 1),
          clarification("b", S.Answered, 2),
          clarification("c", S.Answered, 3),
          clarification("d", S.Open, 4),
        ]}
        label="Questions"
        labels={labels}
        locale="en"
      />,
    );
    const toggle = screen.getByRole("button", {
      name: "Earlier questions (2)",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Question a")).not.toBeVisible();
    expect(screen.getByText("Question c")).toBeVisible();
    expect(screen.getByText("Question d")).toBeVisible();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Question a")).toBeVisible();
    expect(screen.getByText("Closed with a note")).toBeVisible();
    expect(screen.getByText("Note a")).toBeVisible();
  });

  it("uses internal names when given and falls back to the role", () => {
    render(
      <FeedbackClarificationThread
        authorName={(_, part) => (part === "question" ? "Anna" : null)}
        clarifications={[clarification("a", S.Answered, 1)]}
        label="Questions"
        labels={labels}
        locale="en"
      />,
    );
    expect(screen.getByText(/^Anna on/)).toBeInTheDocument();
    expect(screen.getByText(/^Customer on/)).toBeInTheDocument();
  });

  it("renders texts as plain text", () => {
    render(
      <FeedbackClarificationThread
        clarifications={[
          { ...clarification("a", S.Open, 1), question: "<b>bold</b>" },
        ]}
        label="Questions"
        labels={labels}
        locale="en"
      />,
    );
    expect(screen.getByText("<b>bold</b>")).toBeInTheDocument();
  });
});
