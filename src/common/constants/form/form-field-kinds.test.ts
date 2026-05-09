import { describe, expect, it } from "vitest";
import {
  FORM_FIELD_KIND_VALUES,
  FormFieldKind,
} from "@/common/constants/form/form-field-kinds";

describe("FormFieldKind", () => {
  it("contains the expected input kinds in order", () => {
    expect(FormFieldKind).toEqual({
      Email: "email",
      Number: "number",
      Tel: "tel",
      Text: "text",
      Url: "url",
    });
  });

  it("does not contain duplicate values", () => {
    expect(new Set(FORM_FIELD_KIND_VALUES).size).toBe(
      FORM_FIELD_KIND_VALUES.length,
    );
  });
});
