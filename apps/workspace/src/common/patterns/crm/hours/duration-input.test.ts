import { describe, expect, it } from "vitest";

import { DurationInputError } from "@/common/constants/crm/forms/duration-input-errors";
import { readDurationInput } from "@/common/patterns/crm/hours/duration-input";

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
