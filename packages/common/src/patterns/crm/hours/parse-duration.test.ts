import { describe, expect, it } from "vitest";

import { parseDuration } from "@invessiv/common/patterns/crm/hours/parse-duration";

describe("parseDuration", () => {
  it.each([
    ["1:30", 90],
    ["1,5", 90],
    ["1.5", 90],
    ["0:15", 15],
    ["2", 120],
    ["0", 0],
    [" 0,25 ", 15],
    ["10:00", 600],
  ])("reads %s as %i minutes", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it.each(["0:10", "0,1", "abc", "-1", "", "1:60", "1:5", "1,333", "1:30h"])(
    "rejects %s",
    (input) => {
      expect(parseDuration(input)).toBeNull();
    },
  );
});
