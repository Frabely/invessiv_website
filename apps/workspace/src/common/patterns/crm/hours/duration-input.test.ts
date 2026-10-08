import { describe, expect, it } from "vitest";

import { DurationInputError } from "@/common/constants/crm/forms/duration-input-errors";
import {
  readDurationInput,
  stepDurationInput,
} from "@/common/patterns/crm/hours/duration-input";

describe("readDurationInput", () => {
  it("reads every accepted spelling as minutes", () => {
    expect(readDurationInput("1:30")).toEqual({ ok: true, minutes: 90 });
    expect(readDurationInput("1,5")).toEqual({ ok: true, minutes: 90 });
    expect(readDurationInput(" 0:15 ")).toEqual({ ok: true, minutes: 15 });
  });

  it("names why a value cannot be used", () => {
    expect(readDurationInput("")).toEqual({
      ok: false,
      error: DurationInputError.Required,
    });
    expect(readDurationInput("0:00")).toEqual({
      ok: false,
      error: DurationInputError.Required,
    });
    expect(readDurationInput("0:10")).toEqual({
      ok: false,
      error: DurationInputError.Invalid,
    });
    expect(readDurationInput("2:15", 120)).toEqual({
      ok: false,
      error: DurationInputError.TooMuch,
    });
    expect(readDurationInput("2:00", 120)).toEqual({ ok: true, minutes: 120 });
  });
});

describe("stepDurationInput", () => {
  it("moves by one booking step and stays inside the range", () => {
    expect(stepDurationInput("1:30", 1)).toBe("1:45");
    expect(stepDurationInput("1,5", -1)).toBe("1:15");
    expect(stepDurationInput("0:00", -1)).toBe("0:00");
    expect(stepDurationInput("2:00", 1, 120)).toBe("2:00");
  });

  it("starts from zero when the text is unreadable", () => {
    expect(stepDurationInput("", 1)).toBe("0:15");
    expect(stepDurationInput("abc", 1)).toBe("0:15");
  });
});
