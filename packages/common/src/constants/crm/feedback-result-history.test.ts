import { expect, it } from "vitest";
import { FEEDBACK_RESULT_HISTORY_EVENT_KIND_VALUES } from "./feedback-result-history-event-kinds";
import { FEEDBACK_RESULT_ACTOR_SIDE_VALUES } from "./feedback-result-actor-sides";

it("defines result history event kinds without duplicates", () => {
  expect(FEEDBACK_RESULT_HISTORY_EVENT_KIND_VALUES).toEqual([
    "baseline",
    "set",
    "reset",
  ]);
  expect(new Set(FEEDBACK_RESULT_HISTORY_EVENT_KIND_VALUES).size).toBe(
    FEEDBACK_RESULT_HISTORY_EVENT_KIND_VALUES.length,
  );
});

it("defines result actor sides without duplicates", () => {
  expect(FEEDBACK_RESULT_ACTOR_SIDE_VALUES).toEqual([
    "member",
    "portal_contact",
  ]);
  expect(new Set(FEEDBACK_RESULT_ACTOR_SIDE_VALUES).size).toBe(
    FEEDBACK_RESULT_ACTOR_SIDE_VALUES.length,
  );
});
