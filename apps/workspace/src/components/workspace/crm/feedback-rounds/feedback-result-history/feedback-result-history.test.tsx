// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { FeedbackItemResult } from "@invessiv/common/constants/crm/feedback-item-results";
import { FeedbackResultActorSide as A } from "@invessiv/common/constants/crm/feedback-result-actor-sides";
import { FeedbackResultHistoryEventKind as K } from "@invessiv/common/constants/crm/feedback-result-history-event-kinds";
import type { FeedbackItemResultHistoryEntryDto } from "@invessiv/common/contracts/crm/feedback-item-result-history-entry.dto";
import content from "@/i18n/dictionaries/workspace/crm/feedback-rounds/en.json";
import { FeedbackResultHistory } from "./feedback-result-history";

afterEach(cleanup);
const entries: FeedbackItemResultHistoryEntryDto[] = [
  {
    id: "reset",
    kind: K.Reset,
    itemVersion: 3,
    result: null,
    resultNote: null,
    actorSide: A.PortalContact,
    actorName: null,
    occurredAt: "2026-10-03T10:00:00.000Z",
  },
  {
    id: "baseline",
    kind: K.Baseline,
    itemVersion: 1,
    result: FeedbackItemResult.Implemented,
    resultNote: "<b>Plain text</b>",
    actorSide: A.Member,
    actorName: "Anna",
    occurredAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "set",
    kind: K.Set,
    itemVersion: 2,
    result: FeedbackItemResult.NotImplemented,
    resultNote: "Reason",
    actorSide: A.Member,
    actorName: null,
    occurredAt: "2026-10-02T10:00:00.000Z",
  },
];

it("starts collapsed and reveals ordered events, safe text and role fallbacks", () => {
  render(
    <FeedbackResultHistory
      entries={entries}
      content={content.result}
      locale="en"
      textLabels={content.detail}
    />,
  );
  const button = screen.getByRole("button", { name: "Result history (3)" });
  expect(button).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
  button.focus();
  expect(button).toHaveFocus();
  // Native buttons expose the same click activation to keyboard and pointer users.
  fireEvent.click(button);
  expect(button).toHaveAttribute("aria-expanded", "true");
  const list = screen.getByRole("list");
  expect(button).toHaveAttribute("aria-controls", list.id);
  const rows = within(list).getAllByRole("listitem");
  expect(rows[0]).toHaveTextContent("Anna");
  expect(rows[0]).toHaveTextContent("Baseline:");
  expect(rows[0]).toHaveTextContent("<b>Plain text</b>");
  expect(rows[0].querySelector("b")).toBeNull();
  expect(rows[1]).toHaveTextContent("Team");
  expect(rows[2]).toHaveTextContent(content.result.history.actorRemoved);
  expect(rows[2]).toHaveTextContent(content.result.history.reset);
  fireEvent.click(button);
  expect(screen.queryByRole("list")).not.toBeInTheDocument();
});

it("renders no disclosure without history", () => {
  const { container } = render(
    <FeedbackResultHistory
      entries={[]}
      content={content.result}
      locale="en"
      textLabels={content.detail}
    />,
  );
  expect(container).toBeEmptyDOMElement();
});
